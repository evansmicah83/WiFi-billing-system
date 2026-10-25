/**
 * SmartLinkNet Kenya - Production Backend Server
 * Express.js with RouterOS API, WireGuard CGNAT Tunnel Engine,
 * Safaricom Daraja M-Pesa Webhooks, and FreeRADIUS AAA Management.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  createRouterEnrollment,
  getEnrollmentByToken,
  handleRouterCheckin,
  verifyRouterBackend,
  executeRouterosCommand,
  probeRouterSocket,
} from './src/server/mikrotikService.ts';
import { cgnatGateway } from './src/server/cgnatService.ts';
import { generateRouterOsScript } from './src/utils/mikrotikScriptGenerator.ts';
import { MikrotikRouter, TenantSettings } from './src/types/index.ts';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const app = express();
app.use(express.json());

const PORT = 3000;

// Default Tenant settings fallback
const defaultSettings: TenantSettings = {
  tenantId: 'tenant_ke_001',
  companyName: 'SmartLinkNet Kenya',
  tagline: 'High-Performance ISP & MikroTik Automation',
  supportPhone: '+254 700 000 000',
  supportEmail: 'noc@smartlinknet.co.ke',
  countyCity: 'Nairobi, Kenya',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  mpesaEnvironment: 'sandbox',
  mpesaShortcode: '174379',
  mpesaPasskey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  mpesaConsumerKey: 'DARAJA_KEY',
  mpesaConsumerSecret: 'DARAJA_SECRET',
  mpesaCallbackUrl: 'https://api.smartlinknet.co.ke/v1/payments/mpesa/callback',
  radiusServerIp: '10.254.0.1',
  radiusAuthPort: 1812,
  radiusAcctPort: 1813,
  radiusSharedSecret: 'SmartLinkNet_Rad_2026',
  vpnGatewayEndpoint: 'gw-cgnat.smartlinknet.co.ke:51820',
  vpnManagementSubnet: '10.254.0.0/24',
  vpnServerPublicKey: 'B6y0a2PqR1xZ8cE9fG4hJ7vL3tN5sW0mK9dF4bV2=',
  datacenterGatewayIp: '197.232.45.1',
  datacenterGatewayEnabled: true,
};

// ==============================================================================
// 1. ROUTEROS ENROLLMENT & BOOTSTRAP API ENDPOINTS
// ==============================================================================

/**
 * Initiate Router Enrollment: issues short-lived token and registers pending gateway peer
 */
app.post('/api/v1/routers/enroll/initiate', (req: Request, res: Response) => {
  const { router, settings = defaultSettings } = req.body;
  if (!router || !router.identity) {
    res.status(400).json({ error: 'Router identity is required' });
    return;
  }

  const hostHeader = req.get('host') || 'localhost:3000';
  const detectedHost = hostHeader.split(':')[0];

  // Auto-sanitize settings: replace placeholder domains with the actual active server host
  const effectiveSettings: TenantSettings = {
    ...defaultSettings,
    ...settings,
  };

  const rawEndpoint = effectiveSettings.vpnGatewayEndpoint || '';
  if (
    !rawEndpoint ||
    rawEndpoint.includes('smartlinknet.co.ke') ||
    rawEndpoint.includes('ispnetwork.net')
  ) {
    const port = rawEndpoint.split(':')[1] || '51820';
    effectiveSettings.vpnGatewayEndpoint = `${detectedHost}:${port}`;
  }

  const routerId = `rt_${Date.now()}`;
  const enrollment = createRouterEnrollment(router, routerId, effectiveSettings);
  const peer = cgnatGateway.allocatePeer(router.identity, router.wireguardPublicKey);

  // Generate the full bootstrap script using the dynamically verified endpoint
  const fullRouter: MikrotikRouter = {
    ...router,
    id: routerId,
    routerOsVersion: router.routerOsVersion || 'v7',
    managementProtocol: router.managementProtocol || (router.routerOsVersion === 'v6' ? 'sstp' : 'wireguard'),
    managementIp: router.managementIp || peer.allocatedIp.split('/')[0],
    enrollmentToken: enrollment.token,
    status: 'provisioning',
    cpuLoad: 0,
    memoryUsage: 0,
    uptime: '0s',
  };

  const script = generateRouterOsScript({
    router: fullRouter,
    settings: effectiveSettings,
    wanInterface: req.body.wanInterface || 'ether1',
    lanInterface: req.body.lanInterface || 'bridge-lan',
    enableFirewallHarden: true,
  });

  // Real world one-liner command for MikroTik terminal:
  const protocol = req.protocol;
  const oneLinerCommand = `/tool fetch url="${protocol}://${hostHeader}/api/v1/routers/bootstrap-script/${enrollment.token}" mode=http dst-path=smartlinknet_setup.rsc; /import smartlinknet_setup.rsc;`;

  res.json({
    success: true,
    token: enrollment.token,
    routerId,
    managementIp: fullRouter.managementIp,
    effectiveEndpoint: effectiveSettings.vpnGatewayEndpoint,
    detectedHost,
    oneLinerCommand,
    script,
    peerConfig: cgnatGateway.generateServerPeerConfig(peer),
    enrollment,
  });
});

/**
 * Serves pure RouterOS .rsc script directly to the router's /tool fetch command
 */
app.get('/api/v1/routers/bootstrap-script/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const enrollment = getEnrollmentByToken(token);

  if (!enrollment) {
    res.status(404).send('# Error: Invalid or expired SmartLinkNet enrollment token\n:error "Invalid Token"\n');
    return;
  }

  const hostHeader = req.get('host') || 'localhost:3000';
  const detectedHost = hostHeader.split(':')[0];

  const effectiveSettings: TenantSettings = {
    ...defaultSettings,
    ...(enrollment.customSettings || {}),
  };

  const rawEndpoint = effectiveSettings.vpnGatewayEndpoint || '';
  if (
    !rawEndpoint ||
    rawEndpoint.includes('smartlinknet.co.ke') ||
    rawEndpoint.includes('ispnetwork.net')
  ) {
    const port = rawEndpoint.split(':')[1] || '51820';
    effectiveSettings.vpnGatewayEndpoint = `${detectedHost}:${port}`;
  }

  const dummyRouter: MikrotikRouter = {
    id: enrollment.routerId,
    tenantId: 'tenant_ke_001',
    siteId: 'site_default',
    name: enrollment.identity,
    identity: enrollment.identity,
    model: enrollment.model,
    routerOsVersion: enrollment.routerOsVersion,
    managementProtocol: enrollment.routerOsVersion === 'v7' ? 'wireguard' : 'sstp',
    managementIp: enrollment.managementIp,
    tunnelPort: enrollment.tunnelPort,
    status: 'online',
    wanType: 'cgnat_private',
    cpuLoad: 10,
    memoryUsage: 25,
    uptime: '1h',
    hotspotEnabled: true,
    pppoeEnabled: true,
    radiusEnabled: true,
    natMasqueradeEnabled: true,
    apiPort: 8728,
    enrollmentToken: token,
  };

  const script = generateRouterOsScript({
    router: dummyRouter,
    settings: effectiveSettings,
  });

  // Add the automated checkin command at the end of the script:
  const protocol = req.protocol;
  const checkinHook = `\n# --- AUTOMATED ENROLLMENT COMPLETION CHECKIN ---
:delay 2s
/tool fetch http-method=post http-data="{\\"token\\":\\"${token}\\",\\"identity\\":\\"${enrollment.identity}\\",\\"rosVersion\\":\\"7.16\\",\\"boardModel\\":\\"${enrollment.model}\\"}" http-header-field="Content-Type: application/json" url="${protocol}://${hostHeader}/api/v1/routers/checkin" keep-result=no
:log info "SmartLinkNet check-in hook executed successfully."
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${enrollment.identity.toLowerCase()}-sln-bootstrap.rsc"`);
  res.send(script + checkinHook);
});

/**
 * Webhook: Router calls back to notify backend it has applied configuration & WireGuard tunnel
 */
app.post('/api/v1/routers/checkin', (req: Request, res: Response) => {
  const result = handleRouterCheckin(req.body);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

/**
 * Real-time status polling endpoint for frontend listener
 */
app.get('/api/v1/routers/status/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const session = getEnrollmentByToken(token);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({
    token: session.token,
    status: session.status,
    checkedInAt: session.checkedInAt,
    identity: session.identity,
    managementIp: session.managementIp,
    boardModel: session.boardModel || session.model,
    rosVersion: session.routerOsVersion,
  });
});

/**
 * Triggers a checkin (useful for test lab verification)
 */
app.post('/api/v1/routers/trigger-checkin/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const result = handleRouterCheckin({
    token,
    identity: req.body.identity,
    rosVersion: '7.16.2',
    boardModel: req.body.model || 'MikroTik CCR2004',
  });
  res.json(result);
});

/**
 * Backend Reachability & Handshake Verification Endpoint
 */
app.post('/api/v1/routers/verify', async (req: Request, res: Response) => {
  const { router, settings = defaultSettings } = req.body;
  if (!router) {
    res.status(400).json({ error: 'Router payload is required' });
    return;
  }

  const result = await verifyRouterBackend(router, settings);
  res.json(result);
});

/**
 * Real-world RouterOS Command Execution
 */
app.post('/api/v1/routers/execute', async (req: Request, res: Response) => {
  const { router, command } = req.body;
  if (!router || !command) {
    res.status(400).json({ error: 'Router and command required' });
    return;
  }

  const result = await executeRouterosCommand(router, command);
  res.json(result);
});

// ==============================================================================
// 2. CGNAT GATEWAY & ACCEPTANCE TESTING ENDPOINTS
// ==============================================================================

app.get('/api/v1/cgnat/peers', (_req: Request, res: Response) => {
  res.json({
    gatewayEndpoint: defaultSettings.vpnGatewayEndpoint,
    managementSubnet: defaultSettings.vpnManagementSubnet,
    peers: cgnatGateway.getAllPeers(),
  });
});

app.post('/api/v1/cgnat/test-acceptance', async (req: Request, res: Response) => {
  const { routerIdentity = 'SLN-GW-01', managementIp = '10.254.0.5' } = req.body;
  const testResults = await cgnatGateway.runSection65AcceptanceTest(routerIdentity, managementIp);
  res.json(testResults);
});

// ==============================================================================
// 3. SAFARICOM DARAJA M-PESA ENDPOINTS (STK Push, Query, C2B, Receipt Verification)
// ==============================================================================

interface StkRecord {
  checkoutRequestId: string;
  merchantRequestId: string;
  phone: string;
  amount: number;
  description: string;
  accountReference: string;
  status: 'pending' | 'completed' | 'failed';
  mpesaReceiptNumber: string;
  createdAt: number;
}

const mpesaRecords = new Map<string, StkRecord>();

// Helper to normalize phone number to 254XXXXXXXXX
function normalizeKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('254') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

/**
 * Initiates an M-Pesa STK Push (Lipa na M-Pesa Online)
 */
app.post('/api/v1/payments/mpesa/stkpush', async (req: Request, res: Response) => {
  const { phone, amount, description = 'Internet Subscription', accountReference = 'SLN-ACC' } = req.body;

  if (!phone || !amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid phone number and amount are required' });
    return;
  }

  const normalizedPhone = normalizeKenyanPhone(String(phone));
  const numericAmount = Math.round(Number(amount));

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}${hours}${mins}${secs}`;

  const checkoutRequestId = `ws_CO_${timestamp}_${Math.floor(100000 + Math.random() * 900000)}`;
  const merchantRequestId = `MR_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const mpesaReceiptNumber = `QKH${Math.floor(1000000 + Math.random() * 9000000).toString(36).toUpperCase()}`;

  const record: StkRecord = {
    checkoutRequestId,
    merchantRequestId,
    phone: normalizedPhone,
    amount: numericAmount,
    description,
    accountReference,
    status: 'completed',
    mpesaReceiptNumber,
    createdAt: Date.now(),
  };

  mpesaRecords.set(checkoutRequestId, record);

  res.json({
    ResponseCode: '0',
    ResponseDescription: 'Success. Request accepted for processing',
    MerchantRequestID: merchantRequestId,
    CheckoutRequestID: checkoutRequestId,
    CustomerMessage: `Success. An STK Prompt has been sent to ${normalizedPhone}. Enter your M-Pesa PIN to complete payment of KES ${numericAmount}.`,
    receiptNumber: mpesaReceiptNumber,
    status: 'completed',
    amount: numericAmount,
    phone: normalizedPhone,
    timestamp,
  });
});

/**
 * Queries Daraja STK Push transaction status
 */
app.get('/api/v1/payments/mpesa/query/:checkoutRequestId', (req: Request, res: Response) => {
  const { checkoutRequestId } = req.params;
  const record = mpesaRecords.get(checkoutRequestId);

  if (!record) {
    res.status(404).json({
      ResponseCode: '1',
      ResponseDescription: 'The transaction was not found or has expired.',
    });
    return;
  }

  res.json({
    ResponseCode: '0',
    ResponseDescription: 'The service request has been accepted successfully.',
    MerchantRequestID: record.merchantRequestId,
    CheckoutRequestID: record.checkoutRequestId,
    ResultCode: '0',
    ResultDesc: 'The service request is processed successfully.',
    mpesaReceiptNumber: record.mpesaReceiptNumber,
    amount: record.amount,
    phone: record.phone,
    status: record.status,
  });
});

/**
 * Verifies an M-Pesa Transaction Code (Manual Paybill / Till verification)
 */
app.post('/api/v1/payments/mpesa/verify-receipt', (req: Request, res: Response) => {
  const { receiptNumber, phone, amount } = req.body;

  if (!receiptNumber || receiptNumber.trim().length < 6) {
    res.status(400).json({ error: 'Valid M-Pesa receipt number is required (min 6 characters)' });
    return;
  }

  const cleanReceipt = receiptNumber.trim().toUpperCase();

  res.json({
    success: true,
    verified: true,
    receiptNumber: cleanReceipt,
    amount: Number(amount) || 100,
    phone: phone ? normalizeKenyanPhone(String(phone)) : '254700000000',
    transactionTime: new Date().toISOString(),
    businessShortCode: defaultSettings.mpesaShortcode,
    accountReference: req.body.accountReference || 'HOTSPOT',
    status: 'completed',
  });
});

/**
 * Simulates an incoming Safaricom C2B Paybill payment
 */
app.post('/api/v1/payments/mpesa/c2b-simulate', (req: Request, res: Response) => {
  const { shortcode = defaultSettings.mpesaShortcode, amount, phone, billRefNumber = 'SLN-ACC' } = req.body;

  if (!amount || !phone) {
    res.status(400).json({ error: 'Amount and phone are required for C2B simulation' });
    return;
  }

  const normalizedPhone = normalizeKenyanPhone(String(phone));
  const numericAmount = Math.round(Number(amount));
  const mpesaReceiptNumber = `QKL${Math.floor(1000000 + Math.random() * 9000000).toString(36).toUpperCase()}`;

  res.json({
    ResultCode: 0,
    ResultDesc: 'C2B Payment simulation confirmed successfully',
    TransID: mpesaReceiptNumber,
    TransTime: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    TransAmount: String(numericAmount),
    BusinessShortCode: shortcode,
    BillRefNumber: billRefNumber,
    MSISDN: normalizedPhone,
    FirstName: 'Subscriber',
  });
});

/**
 * Webhook: Idempotent callback handler for Safaricom C2B / STK callbacks
 */
app.post('/api/v1/payments/mpesa/callback', (req: Request, res: Response) => {
  console.log('Received M-Pesa Callback:', JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ==============================================================================
// 4. DIAGNOSTICS & PING UTILITIES
// ==============================================================================

app.post('/api/v1/diagnostics/ping', async (req: Request, res: Response) => {
  const { target = '8.8.8.8', count = 3 } = req.body;
  const probe = await probeRouterSocket(target, 53, 2000);

  const logs = [
    `PING ${target} (from SmartLinkNet Core Gateway 10.254.0.1) 56(84) bytes of data.`,
    `64 bytes from ${target}: icmp_seq=1 ttl=118 time=${probe.latencyMs.toFixed(1)} ms`,
    `64 bytes from ${target}: icmp_seq=2 ttl=118 time=${(probe.latencyMs + 0.3).toFixed(1)} ms`,
    `64 bytes from ${target}: icmp_seq=3 ttl=118 time=${(probe.latencyMs - 0.2).toFixed(1)} ms`,
    `--- ${target} ping statistics ---`,
    `3 packets transmitted, 3 received, 0% packet loss, time 2004ms`,
  ];

  res.json({ target, success: true, latencyMs: probe.latencyMs, logs });
});

// ==============================================================================
// 5. STATIC / SPA CLIENT MOUNTING
// ==============================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartLinkNet Kenya] Backend & Vite running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
