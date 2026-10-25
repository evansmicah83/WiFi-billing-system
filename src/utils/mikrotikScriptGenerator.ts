/**
 * SmartLinkNet Kenya - RouterOS Script & FreeRADIUS Provisioning Generator
 * Generates verified, idempotent RouterOS v7 & v6 automation commands.
 */

import { MikrotikRouter, TenantSettings } from '../types';

export interface ScriptGenerationOptions {
  router: MikrotikRouter;
  settings: TenantSettings;
  lanInterface?: string;
  wanInterface?: string;
  hotspotSubnet?: string; // e.g. 10.50.0.0/22
  pppoeSubnet?: string; // e.g. 10.100.0.0/22
  enableFirewallHarden?: boolean;
  enableBandwidthQueues?: boolean;
}

export function generateRouterOsScript(options: ScriptGenerationOptions): string {
  const {
    router,
    settings,
    lanInterface = 'bridge-lan',
    wanInterface = 'ether1',
    hotspotSubnet = '10.50.0.0/22',
    pppoeSubnet = '10.100.0.0/22',
    enableFirewallHarden = true,
  } = options;

  const timestamp = new Date().toISOString();
  const isV7 = router.routerOsVersion === 'v7';

  // Extract and sanitize WireGuard / SSTP endpoint host
  const rawEndpoint = settings.vpnGatewayEndpoint || '';
  let endpointHost = rawEndpoint.split(':')[0]?.trim() || '';
  const endpointPort = rawEndpoint.split(':')[1]?.trim() || '51820';

  if (
    !endpointHost ||
    endpointHost.includes('smartlinknet.co.ke') ||
    endpointHost.includes('ispnetwork.net')
  ) {
    if (typeof window !== 'undefined' && window.location.hostname) {
      endpointHost = window.location.hostname;
    } else {
      endpointHost = '127.0.0.1';
    }
  }

  const rosVersionStr = (router.routerOsVersion || 'v7').toUpperCase();
  const mgmtProtocolStr = (router.managementProtocol || (router.routerOsVersion === 'v6' ? 'sstp' : 'wireguard')).toUpperCase();

  return `# ==============================================================================
# SMARTLINKNET KENYA - AUTOMATED ROUTEROS ${rosVersionStr} PROVISIONING SCRIPT
# Router Identity: ${router.identity}
# Management IP:   ${router.managementIp}/24
# Gateway Host:    ${endpointHost}:${endpointPort}
# Generated At:    ${timestamp}
# Protocol:        ${mgmtProtocolStr} (CGNAT Remote Management Tunnel)
# ==============================================================================
# NOTE: This script is IDEMPOTENT. Repeated execution will not duplicate peers,
# address pools, firewall NAT rules, or RADIUS servers.
# ==============================================================================

:log info "Starting SmartLinkNet Kenya Provisioning for ${router.identity}..."

# --- 1. SYSTEM IDENTITY & TIMEZONE ---
/system identity set name="${router.identity}"
/system clock set time-zone-name="${settings.timezone || 'UTC'}"

# --- 2. CGNAT REMOTE MANAGEMENT TUNNEL (${isV7 ? 'WIREGUARD' : 'SSTP/L2TP'}) ---
${
  isV7
    ? `# RouterOS v7 Native WireGuard Outbound Tunnel
:if ([:len [/interface wireguard find name="wg-sln-mgmt"]] = 0) do={
    /interface wireguard add name="wg-sln-mgmt" listen-port=${router.tunnelPort || 13231} comment="SmartLinkNet CGNAT Mgmt Tunnel"
}

# Assign Private Management IP
:if ([:len [/ip address find comment="SmartLinkNet Private Mgmt IP"]] = 0) do={
    /ip address add address=${router.managementIp}/24 interface=wg-sln-mgmt comment="SmartLinkNet Private Mgmt IP"
}

# Add Remote VPN Gateway Peer (Persistent Keepalive 25s for CGNAT Traversal)
:if ([:len [/interface wireguard peers find interface="wg-sln-mgmt"]] = 0) do={
    /interface wireguard peers add interface="wg-sln-mgmt" \\
        public-key="${settings.vpnServerPublicKey || 'BmK9wP3j7YQ8vL4tN6sR1xZ2cE0aF5dG9hJ='}" \\
        endpoint-address="${endpointHost}" \\
        endpoint-port=${endpointPort} \\
        allowed-address=${settings.vpnManagementSubnet || '10.254.0.0/24'} \\
        persistent-keepalive=25s \\
        comment="SmartLinkNet Core Gateway Peer"
} else={
    /interface wireguard peers set [find interface="wg-sln-mgmt"] persistent-keepalive=25s
}`
    : `# RouterOS v6 SSTP Encrypted Management Client
:if ([:len [/interface sstp-client find name="sstp-sln-mgmt"]] = 0) do={
    /interface sstp-client add name="sstp-sln-mgmt" connect-to="${endpointHost}" \\
        user="${router.identity}" password="${router.enrollmentToken || 'sln-secure-token'}" \\
        profile=default-encryption verify-server-certificate=no disabled=no comment="SmartLinkNet SSTP Mgmt Tunnel"
}`
}

# --- 3. CENTRALIZED FREERADIUS AAA INTEGRATION ---
${
  router.radiusEnabled
    ? `:if ([:len [/radius find comment="SmartLinkNet Centralized RADIUS"]] = 0) do={
    /radius add service=hotspot,ppp,login address=${settings.radiusServerIp || '10.254.0.1'} \\
        secret="${settings.radiusSharedSecret || 'SlnRadSecret2026'}" \\
        authentication-port=${settings.radiusAuthPort || 1812} \\
        accounting-port=${settings.radiusAcctPort || 1813} \\
        timeout=3s \\
        src-address=${router.managementIp} \\
        comment="SmartLinkNet Centralized RADIUS"
} else={
    /radius set [find comment="SmartLinkNet Centralized RADIUS"] \\
        address=${settings.radiusServerIp || '10.254.0.1'} \\
        secret="${settings.radiusSharedSecret || 'SlnRadSecret2026'}" \\
        src-address=${router.managementIp}
}

# Enable RADIUS Incoming Disconnect / Change of Authorization (CoA RFC 3576)
/radius incoming set accept=yes port=3799`
    : '# RADIUS AAA is disabled in router profile.'
}

# --- 4. SECURE MANAGEMENT API ACCESS ---
/ip service set api address=${settings.vpnManagementSubnet || '10.254.0.0/24'} disabled=no port=${router.apiPort || 8728}
/ip service set api-ssl address=${settings.vpnManagementSubnet || '10.254.0.0/24'} disabled=no port=8729
/ip service set winbox address=${settings.vpnManagementSubnet || '10.254.0.0/24'} disabled=no
/ip service set telnet disabled=yes
/ip service set ftp disabled=yes

# --- 5. HOTSPOT SERVER CONFIGURATION ---
${
  router.hotspotEnabled
    ? `:if ([:len [/ip pool find name="sln-hotspot-pool"]] = 0) do={
    /ip pool add name="sln-hotspot-pool" ranges=${hotspotSubnet.split('/')[0].replace('.0', '.10')}-${hotspotSubnet.split('/')[0].replace('.0', '.250')}
}

:if ([:len [/ip hotspot profile find name="sln-hotspot-profile"]] = 0) do={
    /ip hotspot profile add name="sln-hotspot-profile" \\
        hotspot-address=${hotspotSubnet.split('/')[0].replace('.0', '.1')} \\
        dns-name="wifi.login" \\
        html-directory=hotspot \\
        rate-limit="" \\
        use-radius=yes \\
        radius-accounting=yes \\
        radius-interim-update=5m \\
        login-by=http-chap,http-pap,cookie \\
        split-user-domain=no
}

# Walled Garden for M-Pesa Safaricom Daraja API callbacks & Captive Portal domain
/ip hotspot walled-garden ip add dst-host="*.safaricom.co.ke" action=accept comment="Safaricom Daraja API"
${endpointHost && endpointHost !== '127.0.0.1' && endpointHost !== 'localhost' ? `/ip hotspot walled-garden ip add dst-host="${endpointHost}" action=accept comment="ISP Captive Portal Domain"` : ''}`
    : '# Hotspot is not enabled on this profile.'
}

# --- 6. PPPoE SUBSCRIBER SERVER CONFIGURATION ---
${
  router.pppoeEnabled
    ? `:if ([:len [/ip pool find name="sln-pppoe-pool"]] = 0) do={
    /ip pool add name="sln-pppoe-pool" ranges=${pppoeSubnet.split('/')[0].replace('.0', '.10')}-${pppoeSubnet.split('/')[0].replace('.0', '.250')}
}

:if ([:len [/ppp profile find name="sln-pppoe-profile"]] = 0) do={
    /ppp profile add name="sln-pppoe-profile" \\
        local-address=${pppoeSubnet.split('/')[0].replace('.0', '.1')} \\
        remote-address="sln-pppoe-pool" \\
        use-encryption=yes \\
        only-one=yes \\
        change-tcp-mss=yes \\
        use-upnp=no \\
        dns-server=8.8.8.8,1.1.1.1 \\
        comment="SmartLinkNet PPPoE Profile"
}

# PPPoE Server Interface Bind
:if ([:len [/interface pppoe-server server find service-name="SmartLinkNet-PPPoE"]] = 0) do={
    /interface pppoe-server server add service-name="SmartLinkNet-PPPoE" \\
        interface=${lanInterface} \\
        default-profile="sln-pppoe-profile" \\
        authentication=pap,chap,mschap2 \\
        one-session-per-host=yes \\
        disabled=no
}`
    : '# PPPoE server is not enabled on this profile.'
}

# --- 7. SCOPED NAT MASQUERADE ---
${
  router.natMasqueradeEnabled
    ? `:if ([:len [/ip firewall nat find comment="SmartLinkNet Scoped Subscriber Masquerade"]] = 0) do={
    /ip firewall nat add chain=srcnat out-interface=${wanInterface} action=masquerade comment="SmartLinkNet Scoped Subscriber Masquerade"
}`
    : '# NAT Masquerade disabled.'
}

# --- 8. FIREWALL HARDENING & CGNAT ACCESS ISOLATION ---
${
  enableFirewallHarden
    ? `:if ([:len [/ip firewall filter find comment="SmartLinkNet: Accept Management VPN"]] = 0) do={
    /ip firewall filter add chain=input in-interface=${isV7 ? 'wg-sln-mgmt' : 'sstp-sln-mgmt'} action=accept comment="SmartLinkNet: Accept Management VPN"
    /ip firewall filter add chain=input connection-state=established,related action=accept comment="Accept Established/Related"
    /ip firewall filter add chain=input protocol=icmp action=accept comment="Accept ICMP Ping"
    /ip firewall filter add chain=input in-interface=${wanInterface} dst-port=22,23,80,443,8728,8729,8291 protocol=tcp action=drop comment="Drop Public Inbound Management"
}`
    : '# Standard firewall rules applied.'
}

:log info "SmartLinkNet Kenya Provisioning for ${router.identity} completed successfully!"
`;
}

/**
 * Generates standard FreeRADIUS PostgreSQL SQL queries for database seeding
 */
export function generateFreeRadiusSql(username: string, pass: string, downloadMbps: number, uploadMbps: number, service: 'Hotspot' | 'PPPoE'): string {
  const rateLimit = `${uploadMbps}M/${downloadMbps}M`;
  return `-- FreeRADIUS SQL Provisioning for ${username} (${service})
INSERT INTO radcheck (username, attribute, op, value) 
VALUES ('${username}', 'Cleartext-Password', ':=', '${pass}')
ON CONFLICT (username, attribute) DO UPDATE SET value = EXCLUDED.value;

-- MikroTik Rate-Limit Attribute (Wispr-Bandwidth or Mikrotik-Rate-Limit)
INSERT INTO radreply (username, attribute, op, value) 
VALUES ('${username}', 'Mikrotik-Rate-Limit', ':=', '${rateLimit}')
ON CONFLICT (username, attribute) DO UPDATE SET value = EXCLUDED.value;

-- Max Simultaneous Use
INSERT INTO radcheck (username, attribute, op, value) 
VALUES ('${username}', 'Simultaneous-Use', ':=', '1')
ON CONFLICT (username, attribute) DO UPDATE SET value = EXCLUDED.value;
`;
}
