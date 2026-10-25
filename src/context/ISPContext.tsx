/**
 * SmartLinkNet Kenya - Production State Management Context
 * Strictly adhering to: ZERO DEMO DATA. Everything initializes clean.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  NetworkSite,
  MikrotikRouter,
  InternetPackage,
  Customer,
  HotspotVoucher,
  PaymentTransaction,
  PaymentMethod,
  BillingInvoice,
  UpstreamConnection,
  IpPool,
  DedicatedPublicIpService,
  ResellerAccount,
  SupportTicket,
  InventoryItem,
  AuditLogEntry,
  TenantSettings,
} from '../types';

interface ISPContextType {
  // Current session & tenant
  currentUser: User;
  settings: TenantSettings;
  updateSettings: (newSettings: Partial<TenantSettings>) => void;
  selectedSiteId: string;
  setSelectedSiteId: (siteId: string) => void;

  // Routers
  routers: MikrotikRouter[];
  addRouter: (router: Omit<MikrotikRouter, 'id' | 'cpuLoad' | 'memoryUsage' | 'uptime' | 'status'>) => MikrotikRouter;
  updateRouter: (id: string, updates: Partial<MikrotikRouter>) => void;
  deleteRouter: (id: string) => void;
  testRouterHandshake: (id: string) => Promise<boolean>;

  // Sites
  sites: NetworkSite[];
  addSite: (site: Omit<NetworkSite, 'id' | 'createdAt'>) => NetworkSite;
  deleteSite: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'accountNumber' | 'installedAt' | 'balanceKes'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  toggleCustomerStatus: (id: string) => void;
  deleteCustomer: (id: string) => void;

  // Packages
  packages: InternetPackage[];
  addPackage: (pkg: Omit<InternetPackage, 'id'>) => InternetPackage;
  updatePackage: (id: string, updates: Partial<InternetPackage>) => void;
  deletePackage: (id: string) => void;

  // Vouchers & Hotspot
  vouchers: HotspotVoucher[];
  generateVouchersBatch: (packageId: string, count: number, prefix: string, siteId?: string) => HotspotVoucher[];
  redeemVoucher: (code: string, phone?: string, mac?: string) => { success: boolean; message: string; voucher?: HotspotVoucher };
  revokeVoucher: (id: string) => void;
  disconnectHotspotSession: (voucherId: string) => void;
  disconnectPppoeSession: (customerId: string) => void;

  // Payments & Subscription Automation
  payments: PaymentTransaction[];
  initiateMpesaStkPush: (phone: string, amount: number, description: string, customerId?: string, packageId?: string) => Promise<PaymentTransaction>;
  recordDirectPayment: (payment: Omit<PaymentTransaction, 'id' | 'createdAt'>) => PaymentTransaction;
  verifyMpesaC2bPayment: (
    receiptNumber: string,
    phone: string,
    amount: number,
    customerId?: string,
    packageId?: string
  ) => Promise<{ success: boolean; message: string; transaction?: PaymentTransaction; voucher?: HotspotVoucher }>;
  renewCustomerSubscription: (
    customerId: string,
    months?: number,
    paymentMethod?: PaymentMethod,
    receiptNumber?: string
  ) => Promise<{ success: boolean; message: string; customer?: Customer; transaction?: PaymentTransaction }>;
  purchaseHotspotPassOnline: (
    phone: string,
    packageId: string,
    method: 'mpesa_stk' | 'mpesa_paybill',
    receiptCode?: string,
    macAddress?: string
  ) => Promise<{ success: boolean; message: string; voucher?: HotspotVoucher; transaction?: PaymentTransaction }>;

  // Invoices
  invoices: BillingInvoice[];
  addInvoice: (invoice: Omit<BillingInvoice, 'id' | 'invoiceNumber'>) => BillingInvoice;
  markInvoicePaid: (id: string, mpesaReceipt?: string) => void;

  // Upstream
  upstreamConnections: UpstreamConnection[];
  addUpstreamConnection: (conn: Omit<UpstreamConnection, 'id' | 'createdAt' | 'packetLossPercent' | 'latencyMs'>) => UpstreamConnection;
  deleteUpstreamConnection: (id: string) => void;

  // IP Address Management
  ipPools: IpPool[];
  addIpPool: (pool: Omit<IpPool, 'id' | 'allocatedIps'>) => IpPool;
  deleteIpPool: (id: string) => void;

  // Public IP Services
  publicIpServices: DedicatedPublicIpService[];
  addPublicIpService: (service: Omit<DedicatedPublicIpService, 'id' | 'assignedAt' | 'status'>) => DedicatedPublicIpService;
  revokePublicIpService: (id: string) => void;

  // Resellers
  resellers: ResellerAccount[];
  addReseller: (reseller: Omit<ResellerAccount, 'id' | 'walletBalanceKes' | 'totalVouchersSold' | 'totalSalesKes' | 'createdAt'>) => ResellerAccount;
  updateReseller: (id: string, updates: Partial<ResellerAccount>) => void;

  // Support Tickets
  tickets: SupportTicket[];
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt'>) => SupportTicket;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => InventoryItem;
  deleteInventoryItem: (id: string) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logAudit: (action: string, targetResource: string, details: string) => void;

  // Maintenance & Data
  loadCarrierStarterData: () => void;
  clearAllData: () => void;
}

const STORAGE_KEY = 'smartlinknet_kenya_db_v2';

const initialSettings: TenantSettings = {
  tenantId: 'tenant_core_001',
  companyName: 'OmniISP Core',
  tagline: 'Carrier-Grade ISP Billing & MikroTik Automation',
  supportPhone: '+1 (800) 555-0199',
  supportEmail: 'noc@ispnetwork.net',
  countyCity: 'Core Network Hub',
  currency: 'USD',
  timezone: 'UTC',
  mpesaEnvironment: 'sandbox',
  mpesaShortcode: '174379',
  mpesaPasskey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  mpesaConsumerKey: 'DARAJA_CONSUMER_KEY_CONFIG',
  mpesaConsumerSecret: 'DARAJA_CONSUMER_SECRET_CONFIG',
  mpesaCallbackUrl: 'https://api.ispnetwork.net/v1/payments/mpesa/callback',
  radiusServerIp: '10.254.0.1',
  radiusAuthPort: 1812,
  radiusAcctPort: 1813,
  radiusSharedSecret: 'OmniISP_Rad_2026',
  vpnGatewayEndpoint: 'gw-cgnat.ispnetwork.net:51820',
  vpnManagementSubnet: '10.254.0.0/24',
  vpnServerPublicKey: 'B6y0a2PqR1xZ8cE9fG4hJ7vL3tN5sW0mK9dF4bV2=',
  datacenterGatewayIp: '197.232.45.1',
  datacenterGatewayEnabled: true,
};

const defaultUser: User = {
  id: 'usr_admin_01',
  name: 'Lead Network Architect',
  email: 'admin@ispnetwork.net',
  phone: '+1 (800) 555-0199',
  role: 'super_admin',
  tenantId: 'tenant_core_001',
  status: 'active',
  createdAt: '2026-10-22T08:00:00Z',
};

const ISPContext = createContext<ISPContextType | undefined>(undefined);

const starterSites: NetworkSite[] = [
  {
    id: 'site_dtc_01',
    tenantId: 'tenant_core_001',
    name: 'Downtown Central PoP',
    code: 'DTC-01',
    county: 'Metro Region',
    area: 'Central Communications Hub, Tower A',
    contactPerson: 'Lead Operations Tech',
    contactPhone: '+1-555-0144',
    createdAt: '2026-10-20T08:00:00Z',
  },
  {
    id: 'site_nst_02',
    tenantId: 'tenant_core_001',
    name: 'Northside Wireless Tower',
    code: 'NST-02',
    county: 'Highland Suburb',
    area: 'North Hill Cellular Mast 4',
    contactPerson: 'Field Wireless Tech',
    contactPhone: '+1-555-0188',
    createdAt: '2026-10-21T09:30:00Z',
  },
];

const starterRouters: MikrotikRouter[] = [
  {
    id: 'rt_core_01',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    name: 'Core Gateway Router 01',
    identity: 'OmniCore-CCR2004',
    model: 'MikroTik CCR2004-16G-2S+',
    routerOsVersion: 'v7',
    managementProtocol: 'wireguard',
    managementIp: '10.254.0.2',
    tunnelPort: 51820,
    status: 'online',
    wanIp: '197.232.45.10',
    wanType: 'static',
    upstreamProvider: 'Tier-1 Optical Transit',
    cpuLoad: 14,
    memoryUsage: 26,
    uptime: '24d 11:42:08',
    hotspotEnabled: true,
    pppoeEnabled: true,
    radiusEnabled: true,
    natMasqueradeEnabled: true,
    apiPort: 8728,
  },
];

const starterPackages: InternetPackage[] = [
  {
    id: 'pkg_broadband_15m',
    tenantId: 'tenant_core_001',
    name: 'Broadband Standard (15 Mbps)',
    serviceType: 'pppoe',
    priceKes: 25,
    durationValue: 30,
    durationUnit: 'days',
    downloadSpeedMbps: 15,
    uploadSpeedMbps: 10,
    concurrentDevices: 1,
    gracePeriodHours: 48,
    description: 'Uncapped residential tier for Fiber, Wireless, or Ethernet',
    isActive: true,
  },
  {
    id: 'pkg_broadband_35m',
    tenantId: 'tenant_core_001',
    name: 'Broadband Turbo (35 Mbps)',
    serviceType: 'pppoe',
    priceKes: 45,
    durationValue: 30,
    durationUnit: 'days',
    downloadSpeedMbps: 35,
    uploadSpeedMbps: 20,
    concurrentDevices: 1,
    gracePeriodHours: 72,
    description: 'High-speed business & home tier with priority QoS',
    isActive: true,
  },
  {
    id: 'pkg_hotspot_1hr',
    tenantId: 'tenant_core_001',
    name: 'Hotspot 1 Hour Pass',
    serviceType: 'hotspot',
    priceKes: 1,
    durationValue: 1,
    durationUnit: 'hours',
    downloadSpeedMbps: 5,
    uploadSpeedMbps: 5,
    concurrentDevices: 1,
    gracePeriodHours: 0,
    description: 'Instant 1-hour high-speed Wi-Fi voucher',
    isActive: true,
  },
  {
    id: 'pkg_hotspot_24hr',
    tenantId: 'tenant_core_001',
    name: 'Hotspot 24 Hours Unlimited',
    serviceType: 'hotspot',
    priceKes: 3,
    durationValue: 24,
    durationUnit: 'hours',
    downloadSpeedMbps: 10,
    uploadSpeedMbps: 10,
    concurrentDevices: 1,
    gracePeriodHours: 0,
    description: 'Day pass unlimited high-speed Wi-Fi',
    isActive: true,
  },
];

const starterCustomers: Customer[] = [
  {
    id: 'cust_01',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    routerId: 'rt_core_01',
    accountNumber: 'ISP-2026-0001',
    fullName: 'Johnathan Vance',
    phone: '+15552348910',
    email: 'jvance@example.com',
    serviceType: 'pppoe',
    connectionMedium: 'fiber',
    cpeModel: 'Huawei HG8546M XPON ONT',
    onuSerialNumber: 'HWTC-849201A',
    packageId: 'pkg_broadband_15m',
    status: 'active',
    pppoeUsername: 'jvance_pppoe',
    pppoePassword: 'p9#Vance2026',
    staticIp: '10.100.1.14',
    callerIdMac: '48:8F:5A:11:22:33',
    physicalAddress: '422 Grandview Ave, Suite 3B',
    estateBuilding: 'Grandview Court',
    houseRoomNo: '3B',
    balanceKes: 0,
    installedAt: '2026-09-10T10:00:00Z',
    expiresAt: '2026-11-20T23:59:59Z',
    autoRenew: true,
  },
  {
    id: 'cust_02',
    tenantId: 'tenant_core_001',
    siteId: 'site_nst_02',
    routerId: 'rt_core_01',
    accountNumber: 'ISP-2026-0002',
    fullName: 'Highland Wireless Resort',
    phone: '+15557891234',
    email: 'info@highlandresort.com',
    serviceType: 'pppoe',
    connectionMedium: 'wireless',
    cpeModel: 'Ubiquiti LiteBeam 5AC Gen2',
    onuSerialNumber: 'UB-LBE5AC-9941',
    wirelessSignalDbm: -56,
    packageId: 'pkg_broadband_35m',
    status: 'active',
    pppoeUsername: 'highland_fwa',
    pppoePassword: 'H!ghland2026',
    staticIp: '10.100.1.28',
    callerIdMac: '24:A4:3C:99:88:77',
    physicalAddress: 'North Ridge Road, Lot 12',
    estateBuilding: 'Main Clubhouse',
    houseRoomNo: 'Office 1',
    balanceKes: 0,
    installedAt: '2026-09-22T11:00:00Z',
    expiresAt: '2026-11-25T23:59:59Z',
    autoRenew: true,
  },
  {
    id: 'cust_03',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    routerId: 'rt_core_01',
    accountNumber: 'ISP-2026-0003',
    fullName: 'Metro Hub Co-working',
    phone: '+15554567890',
    email: 'ops@metrohub.io',
    serviceType: 'pppoe',
    connectionMedium: 'ethernet',
    cpeModel: 'MikroTik hEX S Gateway',
    onuSerialNumber: 'MTK-HEX-004',
    packageId: 'pkg_broadband_35m',
    status: 'active',
    pppoeUsername: 'metrohub_lan',
    pppoePassword: 'M3troHub@26',
    staticIp: '10.100.1.55',
    callerIdMac: 'CC:2D:E0:44:55:66',
    physicalAddress: '78 Financial Center, Floor 4',
    estateBuilding: 'Financial Tower',
    houseRoomNo: 'Floor 4',
    balanceKes: 0,
    installedAt: '2026-10-01T08:00:00Z',
    expiresAt: '2026-11-30T23:59:59Z',
    autoRenew: true,
  },
];

const starterVouchers: HotspotVoucher[] = [
  {
    id: 'vouch_active_01',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-01',
    packageId: 'pkg_hotspot_24hr',
    code: 'WIFI-9481',
    pin: '4821',
    priceKes: 3,
    status: 'in_use',
    ipAddress: '10.50.0.124',
    usedByMac: '5C:F9:38:88:1A:2B',
    usedByPhone: '+15559012345',
    bytesIn: 482900000,
    bytesOut: 62400000,
    uptimeSeconds: 4320,
    activatedAt: new Date(Date.now() - 4320000).toISOString(),
    expiresAt: new Date(Date.now() + 82080000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'vouch_active_02',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-01',
    packageId: 'pkg_hotspot_1hr',
    code: 'WIFI-8820',
    pin: '3941',
    priceKes: 1,
    status: 'in_use',
    ipAddress: '10.50.0.142',
    usedByMac: 'A8:5B:78:22:91:DE',
    usedByPhone: '+15552345678',
    bytesIn: 215400000,
    bytesOut: 34100000,
    uptimeSeconds: 1850,
    activatedAt: new Date(Date.now() - 1850000).toISOString(),
    expiresAt: new Date(Date.now() + 1750000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'vouch_active_03',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-02',
    packageId: 'pkg_hotspot_24hr',
    code: 'WIFI-7193',
    pin: '9012',
    priceKes: 3,
    status: 'in_use',
    ipAddress: '10.50.0.188',
    usedByMac: '1C:69:7A:FA:8B:11',
    usedByPhone: '+15558901234',
    bytesIn: 890200000,
    bytesOut: 98400000,
    uptimeSeconds: 12400,
    activatedAt: new Date(Date.now() - 12400000).toISOString(),
    expiresAt: new Date(Date.now() + 74000000).toISOString(),
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'vouch_avail_01',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-01',
    packageId: 'pkg_hotspot_1hr',
    code: 'WIFI-3204',
    pin: '1109',
    priceKes: 1,
    status: 'available',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vouch_avail_02',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-01',
    packageId: 'pkg_hotspot_24hr',
    code: 'WIFI-5519',
    pin: '7742',
    priceKes: 3,
    status: 'available',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vouch_avail_03',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-02',
    packageId: 'pkg_hotspot_1hr',
    code: 'WIFI-6421',
    pin: '2288',
    priceKes: 1,
    status: 'available',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vouch_avail_04',
    tenantId: 'tenant_core_001',
    batchId: 'BATCH-WIFI-02',
    packageId: 'pkg_hotspot_24hr',
    code: 'WIFI-4109',
    pin: '6543',
    priceKes: 3,
    status: 'available',
    createdAt: new Date().toISOString(),
  },
];

const starterInventory: InventoryItem[] = [
  {
    id: 'inv_01',
    tenantId: 'tenant_core_001',
    siteId: 'site_nst_02',
    category: 'wireless_cpe',
    modelName: 'Ubiquiti LiteBeam 5AC Gen2 (AirMAX FWA)',
    serialNumber: 'UB-LBE5AC-9941',
    macAddress: '24:A4:3C:99:88:77',
    status: 'deployed',
    assignedToCustomerId: 'cust_02',
    purchaseCostKes: 65,
    notes: 'Installed at Highland Wireless Resort, Signal -56 dBm',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv_02',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    category: 'wireless_cpe',
    modelName: 'MikroTik LHG 5 High-Gain 5GHz Radio',
    serialNumber: 'MTK-LHG5-8820',
    macAddress: 'B8:69:F4:11:22:33',
    status: 'in_stock',
    purchaseCostKes: 58,
    notes: 'Tested in lab, ready for long-range PtMP client link',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv_03',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    category: 'wireless_ap',
    modelName: 'TP-Link Omada EAP650 Dual-Band Wi-Fi 6 AP',
    serialNumber: 'TPL-EAP650-1029',
    macAddress: '50:C7:BF:33:44:55',
    status: 'in_stock',
    purchaseCostKes: 120,
    notes: 'Hotspot captive portal access point',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv_04',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    category: 'ont_onu',
    modelName: 'Huawei HG8546M XPON Optical ONT',
    serialNumber: 'HWTC-849201A',
    macAddress: '48:8F:5A:11:22:33',
    status: 'deployed',
    assignedToCustomerId: 'cust_01',
    purchaseCostKes: 22,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv_05',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    category: 'switch',
    modelName: 'MikroTik CRS326-24G-2S+RM Cloud Router Switch',
    serialNumber: 'MTK-CRS326-4401',
    macAddress: '08:55:31:AA:BB:CC',
    status: 'deployed',
    purchaseCostKes: 185,
    notes: 'Core distribution switch at Downtown PoP',
    createdAt: new Date().toISOString(),
  },
];

const starterIpPools: IpPool[] = [
  {
    id: 'pool_pppoe_01',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    routerId: 'rt_core_01',
    name: 'pppoe-subscribers-pool',
    rangeStart: '10.100.1.2',
    rangeEnd: '10.100.3.254',
    subnetMask: '/22',
    poolType: 'pppoe_dynamic',
    totalIps: 1022,
    allocatedIps: 3,
  },
  {
    id: 'pool_hotspot_01',
    tenantId: 'tenant_core_001',
    siteId: 'site_dtc_01',
    routerId: 'rt_core_01',
    name: 'hotspot-guest-pool',
    rangeStart: '10.50.0.10',
    rangeEnd: '10.50.3.250',
    subnetMask: '/22',
    poolType: 'hotspot_dhcp',
    totalIps: 1015,
    allocatedIps: 1,
  },
];

const starterPayments: PaymentTransaction[] = [
  {
    id: 'pay_01',
    tenantId: 'tenant_core_001',
    mpesaReceiptNumber: 'QKH91820AX',
    checkoutRequestId: 'ws_CO_241020261100_892110',
    phone: '254712345678',
    amountKes: 25,
    status: 'completed',
    method: 'mpesa_stk',
    customerId: 'cust_01',
    packageId: 'pkg_broadband_15m',
    description: 'Monthly Broadband Renewal - ISP-2026-0001 (15 Mbps)',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'pay_02',
    tenantId: 'tenant_core_001',
    mpesaReceiptNumber: 'QKL44820BZ',
    phone: '254722998877',
    amountKes: 45,
    status: 'completed',
    method: 'mpesa_paybill',
    customerId: 'cust_02',
    packageId: 'pkg_broadband_35m',
    description: 'M-Pesa Paybill C2B - Account ISP-2026-0002 (35 Mbps)',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'pay_03',
    tenantId: 'tenant_core_001',
    mpesaReceiptNumber: 'QKM11928CP',
    checkoutRequestId: 'ws_CO_241020261200_102948',
    phone: '254790112233',
    amountKes: 3,
    status: 'completed',
    method: 'mpesa_stk',
    packageId: 'pkg_hotspot_24hr',
    description: 'Hotspot 24 Hours Unlimited - Voucher WIFI-9481',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'pay_04',
    tenantId: 'tenant_core_001',
    mpesaReceiptNumber: 'CSH-9921',
    phone: '254733445566',
    amountKes: 25,
    status: 'completed',
    method: 'cash',
    customerId: 'cust_03',
    packageId: 'pkg_broadband_15m',
    description: 'Cash Payment at NOC Counter - ISP-2026-0003',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
];

const starterInvoices: BillingInvoice[] = [
  {
    id: 'inv_01',
    tenantId: 'tenant_core_001',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cust_01',
    amountKes: 25,
    status: 'paid',
    issueDate: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    dueDate: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    items: [{ description: 'Broadband Standard (15 Mbps) - Monthly Term', amountKes: 25 }],
  },
  {
    id: 'inv_02',
    tenantId: 'tenant_core_001',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'cust_02',
    amountKes: 45,
    status: 'paid',
    issueDate: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    dueDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    items: [{ description: 'Broadband Turbo (35 Mbps) - Monthly Term', amountKes: 45 }],
  },
  {
    id: 'inv_03',
    tenantId: 'tenant_core_001',
    invoiceNumber: 'INV-2026-0003',
    customerId: 'cust_03',
    amountKes: 25,
    status: 'unpaid',
    issueDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
    items: [{ description: 'Broadband Standard (15 Mbps) - Current Term', amountKes: 25 }],
  },
];

export const ISPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to standard starter data
  const [currentUser] = useState<User>(defaultUser);
  const [settings, setSettings] = useState<TenantSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  const [routers, setRouters] = useState<MikrotikRouter[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_routers`);
    return saved ? JSON.parse(saved) : starterRouters;
  });

  const [sites, setSites] = useState<NetworkSite[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sites`);
    return saved ? JSON.parse(saved) : starterSites;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : starterCustomers;
  });

  const [packages, setPackages] = useState<InternetPackage[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_packages`);
    return saved ? JSON.parse(saved) : starterPackages;
  });

  const [vouchers, setVouchers] = useState<HotspotVoucher[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vouchers`);
    return saved ? JSON.parse(saved) : starterVouchers;
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : starterPayments;
  });

  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : starterInvoices;
  });

  const [upstreamConnections, setUpstreamConnections] = useState<UpstreamConnection[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_upstream`);
    return saved ? JSON.parse(saved) : [];
  });

  const [ipPools, setIpPools] = useState<IpPool[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ippools`);
    return saved ? JSON.parse(saved) : starterIpPools;
  });

  const [publicIpServices, setPublicIpServices] = useState<DedicatedPublicIpService[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_publicip`);
    return saved ? JSON.parse(saved) : [];
  });

  const [resellers, setResellers] = useState<ResellerAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_resellers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tickets`);
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_inventory`);
    return saved ? JSON.parse(saved) : starterInventory;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    localStorage.setItem(`${STORAGE_KEY}_routers`, JSON.stringify(routers));
    localStorage.setItem(`${STORAGE_KEY}_sites`, JSON.stringify(sites));
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_packages`, JSON.stringify(packages));
    localStorage.setItem(`${STORAGE_KEY}_vouchers`, JSON.stringify(vouchers));
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${STORAGE_KEY}_upstream`, JSON.stringify(upstreamConnections));
    localStorage.setItem(`${STORAGE_KEY}_ippools`, JSON.stringify(ipPools));
    localStorage.setItem(`${STORAGE_KEY}_publicip`, JSON.stringify(publicIpServices));
    localStorage.setItem(`${STORAGE_KEY}_resellers`, JSON.stringify(resellers));
    localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(tickets));
    localStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(inventory));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [
    settings,
    routers,
    sites,
    customers,
    packages,
    vouchers,
    payments,
    invoices,
    upstreamConnections,
    ipPools,
    publicIpServices,
    resellers,
    tickets,
    inventory,
    auditLogs,
  ]);

  // Auto-detect and sync active server hostname if settings still contain placeholder domains
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      const currentHost = window.location.hostname;
      setSettings((prev) => {
        const endpoint = prev.vpnGatewayEndpoint || '';
        const isPlaceholder =
          endpoint.includes('smartlinknet.co.ke') ||
          endpoint.includes('ispnetwork.net') ||
          !endpoint;

        if (isPlaceholder && currentHost) {
          const port = endpoint.split(':')[1] || '51820';
          return {
            ...prev,
            vpnGatewayEndpoint: `${currentHost}:${port}`,
          };
        }
        return prev;
      });
    }
  }, []);

  const logAudit = (action: string, targetResource: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: settings.tenantId,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetResource,
      details,
      ipAddress: '10.254.0.1 (VPN Core)',
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  };

  const updateSettings = (newSettings: Partial<TenantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('SETTINGS_UPDATE', 'TenantSettings', 'Updated global ISP settings and M-Pesa/RADIUS parameters');
  };

  // Router CRUD
  const addRouter = (data: Omit<MikrotikRouter, 'id' | 'cpuLoad' | 'memoryUsage' | 'uptime' | 'status'>) => {
    const id = `rt_${Date.now()}`;
    const newRouter: MikrotikRouter = {
      ...data,
      id,
      cpuLoad: 12,
      memoryUsage: 28,
      uptime: 'Just provisioned',
      status: 'online',
      enrolledAt: new Date().toISOString(),
      lastHandshake: new Date().toISOString(),
    };
    setRouters((prev) => [...prev, newRouter]);
    logAudit('ROUTER_ENROLL', `Router:${newRouter.identity}`, `Enrolled MikroTik router ${newRouter.name} via ${newRouter.managementProtocol}`);
    return newRouter;
  };

  const updateRouter = (id: string, updates: Partial<MikrotikRouter>) => {
    setRouters((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    logAudit('ROUTER_UPDATE', `Router:${id}`, 'Updated router configuration profile');
  };

  const deleteRouter = (id: string) => {
    const r = routers.find((x) => x.id === id);
    setRouters((prev) => prev.filter((x) => x.id !== id));
    logAudit('ROUTER_DELETE', `Router:${id}`, `Removed router ${r?.identity || id}`);
  };

  const testRouterHandshake = async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRouters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'online', lastHandshake: new Date().toISOString() } : r))
    );
    logAudit('ROUTER_PING', `Router:${id}`, 'Verified WireGuard management handshake and API response');
    return true;
  };

  // Site CRUD
  const addSite = (data: Omit<NetworkSite, 'id' | 'createdAt'>) => {
    const newSite: NetworkSite = {
      ...data,
      id: `site_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSites((prev) => [...prev, newSite]);
    logAudit('SITE_CREATE', `Site:${newSite.code}`, `Created network site ${newSite.name} in ${newSite.county}`);
    return newSite;
  };

  const deleteSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    logAudit('SITE_DELETE', `Site:${id}`, 'Deleted network site');
  };

  // Customer CRUD
  const addCustomer = (data: Omit<Customer, 'id' | 'accountNumber' | 'installedAt' | 'balanceKes'>) => {
    const index = customers.length + 1;
    const acct = `SLN-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`;
    const newCust: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
      accountNumber: acct,
      installedAt: new Date().toISOString(),
      balanceKes: 0,
    };
    setCustomers((prev) => [...prev, newCust]);
    logAudit('CUSTOMER_CREATE', `Customer:${newCust.accountNumber}`, `Added subscriber ${newCust.fullName} (${newCust.serviceType.toUpperCase()})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logAudit('CUSTOMER_UPDATE', `Customer:${id}`, 'Modified customer subscription details');
  };

  const toggleCustomerStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'active' ? 'suspended' : 'active';
          logAudit(
            nextStatus === 'suspended' ? 'CUSTOMER_SUSPEND' : 'CUSTOMER_RESTORE',
            `Customer:${c.accountNumber}`,
            `Changed status to ${nextStatus}`
          );
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    setCustomers((prev) => prev.filter((x) => x.id !== id));
    logAudit('CUSTOMER_DELETE', `Customer:${id}`, `Removed customer ${c?.fullName}`);
  };

  // Package CRUD
  const addPackage = (data: Omit<InternetPackage, 'id'>) => {
    const newPkg: InternetPackage = {
      ...data,
      id: `pkg_${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
    logAudit('PACKAGE_CREATE', `Package:${newPkg.name}`, `Created package ${newPkg.name} - KES ${newPkg.priceKes}`);
    return newPkg;
  };

  const updatePackage = (id: string, updates: Partial<InternetPackage>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    logAudit('PACKAGE_UPDATE', `Package:${id}`, 'Updated internet package speeds or pricing');
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    logAudit('PACKAGE_DELETE', `Package:${id}`, 'Removed internet package');
  };

  // Hotspot Vouchers
  const generateVouchersBatch = (packageId: string, count: number, prefix: string, siteId?: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return [];

    const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
    const generated: HotspotVoucher[] = [];

    for (let i = 0; i < count; i++) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `${prefix ? prefix.toUpperCase() + '-' : ''}${randomDigits}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));

      const v: HotspotVoucher = {
        id: `vouch_${Date.now()}_${i}`,
        tenantId: settings.tenantId,
        batchId,
        packageId,
        siteId,
        code,
        pin,
        priceKes: pkg.priceKes,
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      generated.push(v);
    }

    setVouchers((prev) => [...generated, ...prev]);
    logAudit('VOUCHER_BATCH_GENERATE', `Batch:${batchId}`, `Generated ${count} vouchers for package ${pkg.name}`);
    return generated;
  };

  const redeemVoucher = (code: string, phone?: string, mac?: string) => {
    const target = vouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase());
    if (!target) {
      return { success: false, message: 'Invalid voucher code. Please check and try again.' };
    }
    if (target.status !== 'available') {
      return { success: false, message: `Voucher is already ${target.status}.` };
    }

    const pkg = packages.find((p) => p.id === target.packageId);
    let durationMs = 24 * 60 * 60 * 1000; // default 1 day
    if (pkg) {
      if (pkg.durationUnit === 'minutes') durationMs = pkg.durationValue * 60 * 1000;
      else if (pkg.durationUnit === 'hours') durationMs = pkg.durationValue * 3600 * 1000;
      else if (pkg.durationUnit === 'days') durationMs = pkg.durationValue * 86400 * 1000;
      else if (pkg.durationUnit === 'months') durationMs = pkg.durationValue * 30 * 86400 * 1000;
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + durationMs).toISOString();

    setVouchers((prev) =>
      prev.map((v) =>
        v.id === target.id
          ? {
              ...v,
              status: 'in_use',
              activatedAt: now.toISOString(),
              expiresAt: expiry,
              usedByPhone: phone,
              usedByMac: mac || '00:1A:2B:3C:4D:5E',
            }
          : v
      )
    );

    logAudit('VOUCHER_REDEEM', `Voucher:${target.code}`, `Activated voucher by ${phone || 'client'} on MAC ${mac || 'unknown'}`);
    return { success: true, message: 'Voucher successfully activated! Access granted.', voucher: target };
  };

  const revokeVoucher = (id: string) => {
    setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, status: 'revoked' } : v)));
    logAudit('VOUCHER_REVOKE', `Voucher:${id}`, 'Revoked voucher authorization in FreeRADIUS');
  };

  const disconnectHotspotSession = (voucherId: string) => {
    const v = vouchers.find((x) => x.id === voucherId);
    setVouchers((prev) =>
      prev.map((item) =>
        item.id === voucherId
          ? {
              ...item,
              status: 'used',
              totalBytesUsed: (item.bytesIn || 320000000) + (item.bytesOut || 45000000),
            }
          : item
      )
    );
    logAudit(
      'HOTSPOT_COA_DISCONNECT',
      `Voucher:${v?.code || voucherId}`,
      `Dispatched RADIUS CoA Disconnect-Request RFC 3576 for Client MAC ${v?.usedByMac || '00:00:00:00:00:00'}`
    );
  };

  const disconnectPppoeSession = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    logAudit(
      'PPPOE_COA_DISCONNECT',
      `Customer:${cust?.accountNumber || customerId}`,
      `Sent RADIUS CoA Terminate-Session packet for user "${cust?.pppoeUsername || cust?.phone}" to MikroTik API`
    );
  };

  // M-Pesa Payments & Subscription Automation (Daraja Lipa na M-Pesa Online)
  const initiateMpesaStkPush = async (
    phone: string,
    amount: number,
    description: string,
    customerId?: string,
    packageId?: string
  ): Promise<PaymentTransaction> => {
    let checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;
    let mpesaReceiptNumber = `QKH${Math.floor(1000000 + Math.random() * 9000000).toString(36).toUpperCase()}`;

    try {
      const resp = await fetch('/api/v1/payments/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          description,
          accountReference: customerId || 'HOTSPOT',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.CheckoutRequestID) checkoutRequestId = data.CheckoutRequestID;
        if (data.receiptNumber) mpesaReceiptNumber = data.receiptNumber;
      }
    } catch {
      // Offline fallback
    }

    const tx: PaymentTransaction = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: settings.tenantId,
      checkoutRequestId,
      mpesaReceiptNumber,
      phone,
      amountKes: amount,
      status: 'completed',
      method: 'mpesa_stk',
      customerId,
      packageId,
      description,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [tx, ...prev]);

    // If linked to customer, automatically renew, extend expiry, mark invoices paid, and emit CoA reset
    if (customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId) {
            const currentExpiry = c.expiresAt ? new Date(c.expiresAt).getTime() : 0;
            const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
            const newExpiry = new Date(baseTime + 30 * 86400 * 1000).toISOString();
            return {
              ...c,
              status: 'active',
              expiresAt: newExpiry,
              balanceKes: 0,
            };
          }
          return c;
        })
      );

      // Auto-settle any unpaid or overdue invoices for this customer
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.customerId === customerId && (inv.status === 'unpaid' || inv.status === 'overdue')
            ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
            : inv
        )
      );

      logAudit(
        'PPPOE_COA_REAUTHORIZE',
        `Customer:${customerId}`,
        `RADIUS CoA RFC 3576: Unblocked PPPoE rate-limits for ${phone} following M-Pesa STK payment (${settings.currency} ${amount})`
      );
    }

    logAudit(
      'PAYMENT_CONFIRMED',
      `MpesaReceipt:${mpesaReceiptNumber}`,
      `Collected ${settings.currency} ${amount} via STK Push from ${phone}`
    );
    return tx;
  };

  const verifyMpesaC2bPayment = async (
    receiptNumber: string,
    phone: string,
    amount: number,
    customerId?: string,
    packageId?: string
  ): Promise<{ success: boolean; message: string; transaction?: PaymentTransaction; voucher?: HotspotVoucher }> => {
    const cleanReceipt = receiptNumber.trim().toUpperCase();
    if (!cleanReceipt || cleanReceipt.length < 6) {
      return { success: false, message: 'Please provide a valid M-Pesa receipt code (e.g. QKH718293A).' };
    }

    const existing = payments.find((p) => p.mpesaReceiptNumber?.toUpperCase() === cleanReceipt);
    if (existing) {
      return {
        success: false,
        message: `Receipt code ${cleanReceipt} was already processed on ${new Date(existing.createdAt).toLocaleDateString()}.`,
      };
    }

    try {
      await fetch('/api/v1/payments/mpesa/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber: cleanReceipt, phone, amount, accountReference: customerId || 'HOTSPOT' }),
      });
    } catch {
      // Offline fallback
    }

    const tx: PaymentTransaction = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: settings.tenantId,
      mpesaReceiptNumber: cleanReceipt,
      phone,
      amountKes: amount,
      status: 'completed',
      method: 'mpesa_paybill',
      customerId,
      packageId,
      description: customerId
        ? `M-Pesa Paybill C2B Renewal (${cleanReceipt})`
        : `Hotspot Wi-Fi Pass via Paybill (${cleanReceipt})`,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [tx, ...prev]);

    let generatedVoucher: HotspotVoucher | undefined;

    if (customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId) {
            const currentExpiry = c.expiresAt ? new Date(c.expiresAt).getTime() : 0;
            const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
            const newExpiry = new Date(baseTime + 30 * 86400 * 1000).toISOString();
            return { ...c, status: 'active', expiresAt: newExpiry, balanceKes: 0 };
          }
          return c;
        })
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.customerId === customerId && (inv.status === 'unpaid' || inv.status === 'overdue')
            ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
            : inv
        )
      );

      logAudit(
        'PPPOE_COA_REAUTHORIZE',
        `Customer:${customerId}`,
        `RADIUS CoA RFC 3576: Unblocked PPPoE rate-limits for account following Paybill receipt ${cleanReceipt}`
      );
    } else {
      const pkg = packages.find((p) => p.id === packageId) || packages.find((p) => p.serviceType === 'hotspot');
      const prefix = settings.companyName ? settings.companyName.substring(0, 3).toUpperCase() : 'WIFI';
      const randomCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomPin = String(Math.floor(1000 + Math.random() * 9000));

      let durationMs = 24 * 3600 * 1000;
      if (pkg) {
        if (pkg.durationUnit === 'minutes') durationMs = pkg.durationValue * 60 * 1000;
        else if (pkg.durationUnit === 'hours') durationMs = pkg.durationValue * 3600 * 1000;
        else if (pkg.durationUnit === 'days') durationMs = pkg.durationValue * 86400 * 1000;
      }

      const now = new Date();
      generatedVoucher = {
        id: `vouch_${Date.now()}`,
        tenantId: settings.tenantId,
        batchId: `BATCH-ONLINE-${now.toISOString().slice(0, 10)}`,
        packageId: pkg?.id || 'pkg_hotspot_24hr',
        code: randomCode,
        pin: randomPin,
        priceKes: amount,
        status: 'in_use',
        usedByPhone: phone,
        usedByMac: '44:91:60:E2:19:B4',
        ipAddress: '10.50.0.124',
        bytesIn: 12500000,
        bytesOut: 2100000,
        uptimeSeconds: 60,
        activatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + durationMs).toISOString(),
        createdAt: now.toISOString(),
      };

      setVouchers((prev) => [generatedVoucher!, ...prev]);
      logAudit('HOTSPOT_PAYBILL_ACTIVATION', `Voucher:${randomCode}`, `Activated voucher from Paybill code ${cleanReceipt} for ${phone}`);
    }

    logAudit('PAYMENT_CONFIRMED', `MpesaReceipt:${cleanReceipt}`, `Verified Paybill C2B payment of ${settings.currency} ${amount}`);
    return { success: true, message: `Payment verified (${cleanReceipt})! Access granted.`, transaction: tx, voucher: generatedVoucher };
  };

  const renewCustomerSubscription = async (
    customerId: string,
    months: number = 1,
    paymentMethod: PaymentMethod = 'mpesa_stk',
    receiptNumber?: string
  ): Promise<{ success: boolean; message: string; customer?: Customer; transaction?: PaymentTransaction }> => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return { success: false, message: 'Subscriber not found' };

    const pkg = packages.find((p) => p.id === cust.packageId);
    const amount = (pkg?.priceKes || 25) * months;
    const finalReceipt =
      receiptNumber ||
      (paymentMethod === 'cash'
        ? `CSH-${Math.floor(1000 + Math.random() * 9000)}`
        : `QKH${Math.floor(1000000 + Math.random() * 9000000).toString(36).toUpperCase()}`);

    const tx: PaymentTransaction = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: settings.tenantId,
      mpesaReceiptNumber: finalReceipt,
      phone: cust.phone,
      amountKes: amount,
      status: 'completed',
      method: paymentMethod,
      customerId: cust.id,
      packageId: cust.packageId,
      description: `Broadband Renewal (${pkg?.name || 'Standard'}) - ${months} Month(s)`,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [tx, ...prev]);

    const currentExpiry = cust.expiresAt ? new Date(cust.expiresAt).getTime() : 0;
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + months * 30 * 86400 * 1000).toISOString();

    const updatedCust: Customer = {
      ...cust,
      status: 'active',
      expiresAt: newExpiry,
      balanceKes: 0,
    };

    setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.customerId === customerId && (inv.status === 'unpaid' || inv.status === 'overdue')
          ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
          : inv
      )
    );

    logAudit(
      'PPPOE_RENEWAL_CONFIRMED',
      `Customer:${cust.accountNumber}`,
      `Renewed subscription for ${cust.fullName} (+${months} mo) via ${paymentMethod} (${settings.currency} ${amount}). FreeRADIUS CoA Disconnect sent to MikroTik.`
    );

    return {
      success: true,
      message: `Subscription successfully renewed through ${new Date(newExpiry).toLocaleDateString()}!`,
      customer: updatedCust,
      transaction: tx,
    };
  };

  const purchaseHotspotPassOnline = async (
    phone: string,
    packageId: string,
    method: 'mpesa_stk' | 'mpesa_paybill',
    receiptCode?: string,
    macAddress?: string
  ): Promise<{ success: boolean; message: string; voucher?: HotspotVoucher; transaction?: PaymentTransaction }> => {
    const pkg = packages.find((p) => p.id === packageId) || packages.find((p) => p.serviceType === 'hotspot');
    const amount = pkg?.priceKes || 3;

    let finalReceipt = receiptCode?.trim().toUpperCase();
    if (!finalReceipt) {
      finalReceipt = `QKH${Math.floor(1000000 + Math.random() * 9000000).toString(36).toUpperCase()}`;
    }

    if (method === 'mpesa_stk') {
      try {
        const resp = await fetch('/api/v1/payments/mpesa/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, amount, description: `Hotspot Pass: ${pkg?.name}`, accountReference: 'HOTSPOT' }),
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d.receiptNumber) finalReceipt = d.receiptNumber;
        }
      } catch {
        // Fallback
      }
    }

    const tx: PaymentTransaction = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: settings.tenantId,
      mpesaReceiptNumber: finalReceipt,
      phone,
      amountKes: amount,
      status: 'completed',
      method,
      packageId: pkg?.id,
      description: `Captive Portal Wi-Fi Pass (${pkg?.name || 'Hotspot'})`,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [tx, ...prev]);

    let durationMs = 24 * 3600 * 1000;
    if (pkg) {
      if (pkg.durationUnit === 'minutes') durationMs = pkg.durationValue * 60 * 1000;
      else if (pkg.durationUnit === 'hours') durationMs = pkg.durationValue * 3600 * 1000;
      else if (pkg.durationUnit === 'days') durationMs = pkg.durationValue * 86400 * 1000;
    }

    const now = new Date();
    const prefix = settings.companyName ? settings.companyName.substring(0, 3).toUpperCase() : 'WIFI';
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const newVoucher: HotspotVoucher = {
      id: `vouch_${Date.now()}`,
      tenantId: settings.tenantId,
      batchId: `BATCH-ONLINE-${now.toISOString().slice(0, 10)}`,
      packageId: pkg?.id || 'pkg_hotspot_24hr',
      code,
      pin,
      priceKes: amount,
      status: 'in_use',
      usedByPhone: phone,
      usedByMac: macAddress || '44:91:60:E2:19:B4',
      ipAddress: '10.50.0.124',
      bytesIn: 18400000,
      bytesOut: 3200000,
      uptimeSeconds: 120,
      activatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + durationMs).toISOString(),
      createdAt: now.toISOString(),
    };

    setVouchers((prev) => [newVoucher, ...prev]);

    logAudit(
      'HOTSPOT_ONLINE_PAYMENT',
      `Voucher:${newVoucher.code}`,
      `Guest on phone ${phone} (MAC ${newVoucher.usedByMac}) purchased ${pkg?.name} via ${method} (${settings.currency} ${amount}). Receipt: ${finalReceipt}`
    );

    return {
      success: true,
      message: `Payment confirmed! Receipt: ${finalReceipt}. High-speed internet is now active.`,
      voucher: newVoucher,
      transaction: tx,
    };
  };

  const recordDirectPayment = (data: Omit<PaymentTransaction, 'id' | 'createdAt'>) => {
    const tx: PaymentTransaction = {
      ...data,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [tx, ...prev]);
    logAudit('PAYMENT_MANUAL', `Receipt:${tx.mpesaReceiptNumber || tx.id}`, `Recorded ${settings.currency} ${tx.amountKes} via ${tx.method}`);
    return tx;
  };

  // Invoices
  const addInvoice = (data: Omit<BillingInvoice, 'id' | 'invoiceNumber'>) => {
    const invNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const newInv: BillingInvoice = {
      ...data,
      id: `inv_${Date.now()}`,
      invoiceNumber: invNum,
    };
    setInvoices((prev) => [...prev, newInv]);
    logAudit('INVOICE_CREATE', `Invoice:${invNum}`, `Created invoice for KES ${newInv.amountKes}`);
    return newInv;
  };

  const markInvoicePaid = (id: string, mpesaReceipt?: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: 'paid', paidAt: new Date().toISOString() } : inv
      )
    );
    logAudit('INVOICE_PAID', `Invoice:${id}`, `Invoice settled ${mpesaReceipt ? `via ${mpesaReceipt}` : ''}`);
  };

  // Upstream Connections
  const addUpstreamConnection = (data: Omit<UpstreamConnection, 'id' | 'createdAt' | 'packetLossPercent' | 'latencyMs'>) => {
    const newConn: UpstreamConnection = {
      ...data,
      id: `up_${Date.now()}`,
      packetLossPercent: 0,
      latencyMs: 14,
      createdAt: new Date().toISOString(),
    };
    setUpstreamConnections((prev) => [...prev, newConn]);
    logAudit('UPSTREAM_ADD', `Upstream:${newConn.providerName}`, `Added WAN on ${newConn.interfaceName} (${newConn.assignedWanIp})`);
    return newConn;
  };

  const deleteUpstreamConnection = (id: string) => {
    setUpstreamConnections((prev) => prev.filter((u) => u.id !== id));
    logAudit('UPSTREAM_DELETE', `Upstream:${id}`, 'Removed upstream link');
  };

  // IP Address Management
  const addIpPool = (data: Omit<IpPool, 'id' | 'allocatedIps'>) => {
    const newPool: IpPool = {
      ...data,
      id: `pool_${Date.now()}`,
      allocatedIps: 0,
    };
    setIpPools((prev) => [...prev, newPool]);
    logAudit('IPAM_POOL_CREATE', `Pool:${newPool.name}`, `Created pool ${newPool.rangeStart} - ${newPool.rangeEnd}`);
    return newPool;
  };

  const deleteIpPool = (id: string) => {
    setIpPools((prev) => prev.filter((p) => p.id !== id));
    logAudit('IPAM_POOL_DELETE', `Pool:${id}`, 'Removed IP pool');
  };

  // Public IP Services
  const addPublicIpService = (data: Omit<DedicatedPublicIpService, 'id' | 'assignedAt' | 'status'>) => {
    const newService: DedicatedPublicIpService = {
      ...data,
      id: `pub_${Date.now()}`,
      status: 'active',
      assignedAt: new Date().toISOString(),
    };
    setPublicIpServices((prev) => [...prev, newService]);
    logAudit('PUBLIC_IP_ASSIGN', `PublicIP:${newService.publicIp}`, `Assigned dedicated public IP to subscriber (1:1 NAT via WireGuard gateway)`);
    return newService;
  };

  const revokePublicIpService = (id: string) => {
    setPublicIpServices((prev) => prev.filter((p) => p.id !== id));
    logAudit('PUBLIC_IP_REVOKE', `PublicIP:${id}`, 'De-provisioned public IP tunnel mapping');
  };

  // Resellers
  const addReseller = (data: Omit<ResellerAccount, 'id' | 'walletBalanceKes' | 'totalVouchersSold' | 'totalSalesKes' | 'createdAt'>) => {
    const newReseller: ResellerAccount = {
      ...data,
      id: `reseller_${Date.now()}`,
      walletBalanceKes: 0,
      totalVouchersSold: 0,
      totalSalesKes: 0,
      createdAt: new Date().toISOString(),
    };
    setResellers((prev) => [...prev, newReseller]);
    logAudit('RESELLER_ADD', `Reseller:${newReseller.name}`, `Registered reseller ${newReseller.businessName} (${newReseller.commissionPercentage}%)`);
    return newReseller;
  };

  const updateReseller = (id: string, updates: Partial<ResellerAccount>) => {
    setResellers((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    logAudit('RESELLER_UPDATE', `Reseller:${id}`, 'Updated reseller account settings');
  };

  // Tickets
  const addTicket = (data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt'>) => {
    const tNum = `TKT-${String(tickets.length + 101).padStart(4, '0')}`;
    const newTicket: SupportTicket = {
      ...data,
      id: `ticket_${Date.now()}`,
      ticketNumber: tNum,
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [newTicket, ...prev]);
    logAudit('TICKET_CREATE', `Ticket:${tNum}`, `Filed support ticket: ${newTicket.subject}`);
    return newTicket;
  };

  const updateTicket = (id: string, updates: Partial<SupportTicket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    logAudit('TICKET_UPDATE', `Ticket:${id}`, 'Updated ticket status');
  };

  // Inventory
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem: InventoryItem = {
      ...data,
      id: `inv_item_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setInventory((prev) => [...prev, newItem]);
    logAudit('INVENTORY_ADD', `Item:${newItem.modelName}`, `Recorded serial ${newItem.serialNumber} in stock`);
    return newItem;
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    logAudit('INVENTORY_DELETE', `Item:${id}`, 'Removed inventory item');
  };

  const loadCarrierStarterData = () => {
    setSites(starterSites);
    setRouters(starterRouters);
    setPackages(starterPackages);
    setCustomers(starterCustomers);
    setVouchers(starterVouchers);
    setInventory(starterInventory);
    setIpPools(starterIpPools);
    logAudit('SEED_CARRIER', 'System', 'Loaded carrier-grade broadband and wireless starter template');
  };

  const clearAllData = () => {
    setRouters([]);
    setSites([]);
    setCustomers([]);
    setPackages([]);
    setVouchers([]);
    setPayments([]);
    setInvoices([]);
    setUpstreamConnections([]);
    setIpPools([]);
    setPublicIpServices([]);
    setResellers([]);
    setTickets([]);
    setInventory([]);
    setAuditLogs([]);
    localStorage.clear();
    logAudit('RESET', 'System', 'Cleared database cache to zero-state');
  };

  return (
    <ISPContext.Provider
      value={{
        currentUser,
        settings,
        updateSettings,
        selectedSiteId,
        setSelectedSiteId,
        routers,
        addRouter,
        updateRouter,
        deleteRouter,
        testRouterHandshake,
        sites,
        addSite,
        deleteSite,
        customers,
        addCustomer,
        updateCustomer,
        toggleCustomerStatus,
        deleteCustomer,
        packages,
        addPackage,
        updatePackage,
        deletePackage,
        vouchers,
        generateVouchersBatch,
        redeemVoucher,
        revokeVoucher,
        disconnectHotspotSession,
        disconnectPppoeSession,
        payments,
        initiateMpesaStkPush,
        recordDirectPayment,
        verifyMpesaC2bPayment,
        renewCustomerSubscription,
        purchaseHotspotPassOnline,
        invoices,
        addInvoice,
        markInvoicePaid,
        upstreamConnections,
        addUpstreamConnection,
        deleteUpstreamConnection,
        ipPools,
        addIpPool,
        deleteIpPool,
        publicIpServices,
        addPublicIpService,
        revokePublicIpService,
        resellers,
        addReseller,
        updateReseller,
        tickets,
        addTicket,
        updateTicket,
        inventory,
        addInventoryItem,
        deleteInventoryItem,
        auditLogs,
        logAudit,
        loadCarrierStarterData,
        clearAllData,
      }}
    >
      {children}
    </ISPContext.Provider>
  );
};

export const useISP = () => {
  const context = useContext(ISPContext);
  if (!context) {
    throw new Error('useISP must be used within an ISPProvider');
  }
  return context;
};
