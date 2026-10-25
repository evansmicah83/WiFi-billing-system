/**
 * SmartLinkNet Kenya - Comprehensive ISP Platform Type Definitions
 */

export type UserRole =
  | 'super_admin'
  | 'isp_owner'
  | 'isp_admin'
  | 'network_engineer'
  | 'field_tech'
  | 'cashier'
  | 'support_agent'
  | 'reseller'
  | 'subscriber';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tenantId: string;
  siteId?: string;
  status: 'active' | 'suspended' | 'invited';
  createdAt: string;
}

export interface NetworkSite {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  county: string;
  area: string;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
  createdAt: string;
}

export type RouterOsVersion = 'v7' | 'v6';
export type ManagementVpnProtocol = 'wireguard' | 'sstp' | 'l2tp';

export interface MikrotikRouter {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  identity: string;
  model: string;
  serialNumber?: string;
  routerOsVersion: RouterOsVersion;
  managementProtocol: ManagementVpnProtocol;
  managementIp: string; // e.g. 10.254.0.5
  tunnelPort: number;
  wireguardPublicKey?: string;
  wireguardPresharedKey?: string;
  lastHandshake?: string;
  status: 'online' | 'offline' | 'degraded' | 'provisioning';
  wanIp?: string;
  wanType: 'dhcp' | 'static' | 'pppoe_client' | 'cgnat_private';
  upstreamProvider?: string;
  cpuLoad: number; // 0 - 100%
  memoryUsage: number; // 0 - 100%
  uptime: string;
  hotspotEnabled: boolean;
  pppoeEnabled: boolean;
  radiusEnabled: boolean;
  natMasqueradeEnabled: boolean;
  apiPort: number;
  enrollmentToken?: string;
  enrolledAt?: string;
}

export type ServiceType = 'hotspot' | 'pppoe' | 'corporate_dedicated';

export interface InternetPackage {
  id: string;
  tenantId: string;
  name: string;
  serviceType: ServiceType;
  priceKes: number;
  durationValue: number;
  durationUnit: 'minutes' | 'hours' | 'days' | 'months';
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  burstDownloadMbps?: number;
  burstUploadMbps?: number;
  dataQuotaGb?: number; // 0 or undefined for unlimited
  concurrentDevices: number;
  gracePeriodHours: number;
  description: string;
  isActive: boolean;
  siteId?: string; // specific site or all sites
}

export type SubscriberStatus = 'active' | 'suspended' | 'expired' | 'pending_install';

export type ConnectionMedium = 'fiber' | 'wireless' | 'ethernet' | 'hotspot';

export interface Customer {
  id: string;
  tenantId: string;
  siteId: string;
  routerId: string;
  accountNumber: string; // e.g. SLN-2026-001
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;
  serviceType: ServiceType;
  connectionMedium?: ConnectionMedium;
  cpeModel?: string;
  wirelessSignalDbm?: number; // e.g. -58 dBm for wireless FWA
  packageId: string;
  status: SubscriberStatus;
  pppoeUsername?: string;
  pppoePassword?: string;
  staticIp?: string;
  macAddress?: string;
  callerIdMac?: string; // lock to calling MAC
  physicalAddress: string;
  estateBuilding?: string;
  houseRoomNo?: string;
  gpsCoordinates?: string;
  onuSerialNumber?: string; // or CPE / Radio Serial
  fatBoxPort?: string;
  balanceKes: number;
  installedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  notes?: string;
}

export interface HotspotVoucher {
  id: string;
  tenantId: string;
  batchId: string;
  packageId: string;
  siteId?: string;
  routerId?: string;
  code: string; // e.g. SLN-8472
  pin?: string;
  priceKes: number;
  status: 'available' | 'in_use' | 'used' | 'expired' | 'revoked';
  activatedAt?: string;
  expiresAt?: string;
  usedByMac?: string;
  usedByPhone?: string;
  ipAddress?: string;
  bytesIn?: number;
  bytesOut?: number;
  uptimeSeconds?: number;
  totalBytesUsed?: number;
  resellerId?: string;
  createdAt: string;
}

export type PaymentMethod = 'mpesa_stk' | 'mpesa_c2b' | 'mpesa_paybill' | 'cash' | 'bank_transfer';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'reversed';

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  mpesaReceiptNumber?: string; // e.g. QKH789ZX4
  checkoutRequestId?: string;
  phone: string;
  amountKes: number;
  status: PaymentStatus;
  method: PaymentMethod;
  customerId?: string;
  voucherId?: string;
  packageId?: string;
  invoiceId?: string;
  description: string;
  errorMessage?: string;
  rawCallbackData?: string;
  createdAt: string;
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string; // e.g. INV-2026-0041
  customerId: string;
  amountKes: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  items: {
    description: string;
    amountKes: number;
  }[];
}

export interface UpstreamConnection {
  id: string;
  tenantId: string;
  siteId: string;
  routerId: string;
  providerName: 'Safaricom Fibre' | 'Faiba (JTL)' | 'Zuku Fibre' | 'Starlink' | 'Liquid Telecom' | 'Telkom Kenya' | 'Other';
  interfaceName: string; // e.g. ether1
  connectionType: 'dhcp' | 'static' | 'pppoe_upstream' | 'vlan';
  assignedWanIp: string;
  isCgnatRange: boolean; // e.g. 100.64.0.0/10 or 10.x.x.x
  observedPublicIp?: string;
  gatewayIp?: string;
  dnsServers: string;
  downloadSpeedLimitMbps: number;
  uploadSpeedLimitMbps: number;
  isFailoverBackup: boolean;
  priorityOrder: number;
  status: 'active' | 'backup_standby' | 'down';
  packetLossPercent: number;
  latencyMs: number;
  createdAt: string;
}

export interface IpPool {
  id: string;
  tenantId: string;
  siteId: string;
  routerId: string;
  name: string;
  rangeStart: string;
  rangeEnd: string;
  subnetMask: string; // e.g. /24
  poolType: 'hotspot_dhcp' | 'pppoe_dynamic' | 'static_subscribers' | 'cgnat_shared' | 'management_vpn';
  totalIps: number;
  allocatedIps: number;
}

export interface DedicatedPublicIpService {
  id: string;
  tenantId: string;
  publicIp: string; // e.g. 197.232.45.88
  customerId: string;
  routerId: string;
  serviceType: '1:1_nat' | 'routed_prefix' | 'wireguard_gateway';
  datacenterGateway: string; // e.g. gw-nairobi-01.smartlinknet.co.ke
  internalPrivateIp: string; // e.g. 10.100.0.45
  status: 'active' | 'provisioning' | 'suspended' | 'released';
  monthlyFeeKes: number;
  assignedAt: string;
  expiresAt: string;
}

export interface ResellerAccount {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  businessName: string;
  assignedSiteId: string;
  commissionPercentage: number;
  walletBalanceKes: number;
  totalVouchersSold: number;
  totalSalesKes: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  ticketNumber: string; // e.g. TKT-1042
  customerId?: string;
  customerName: string;
  customerPhone: string;
  category: 'no_internet' | 'slow_speeds' | 'router_offline' | 'billing_payment' | 'physical_fibre_cut' | 'installation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  assignedTechnician?: string;
  siteId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  siteId: string;
  category:
    | 'olt'
    | 'ont_onu'
    | 'wireless_cpe'
    | 'wireless_ap'
    | 'switch'
    | 'splitter'
    | 'fat_box'
    | 'fibre_cable'
    | 'mikrotik_router'
    | 'accessories';
  modelName: string;
  serialNumber: string;
  macAddress?: string;
  status: 'in_stock' | 'deployed' | 'faulty' | 'reserved';
  assignedToCustomerId?: string;
  purchaseCostKes: number;
  notes?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  details: string;
  ipAddress: string;
}

export interface TenantSettings {
  tenantId: string;
  companyName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  countyCity: string;
  currency: string; // KES
  timezone: string; // Africa/Nairobi
  // Safaricom Daraja M-Pesa Settings
  mpesaEnvironment: 'sandbox' | 'production';
  mpesaShortcode: string; // Paybill or Till Number
  mpesaPasskey: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaCallbackUrl: string;
  // FreeRADIUS AAA Settings
  radiusServerIp: string;
  radiusAuthPort: number;
  radiusAcctPort: number;
  radiusSharedSecret: string;
  // CGNAT WireGuard Gateway
  vpnGatewayEndpoint: string;
  vpnManagementSubnet: string; // e.g. 10.254.0.0/24
  vpnServerPublicKey: string;
  // Public IP Data Centre Gateway
  datacenterGatewayIp: string;
  datacenterGatewayEnabled: boolean;
}
