import React, { useState } from 'react';
import {
  Settings,
  CreditCard,
  Server,
  ShieldCheck,
  Save,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

export const SystemSettingsView: React.FC = () => {
  const { settings, updateSettings, clearAllData } = useISP();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [countyCity, setCountyCity] = useState(settings.countyCity);
  const [currency, setCurrency] = useState(settings.currency || 'USD');
  const [timezone, setTimezone] = useState(settings.timezone || 'UTC');

  // Daraja M-Pesa
  const [mpesaEnvironment, setMpesaEnvironment] = useState(settings.mpesaEnvironment);
  const [mpesaShortcode, setMpesaShortcode] = useState(settings.mpesaShortcode);
  const [mpesaPasskey, setMpesaPasskey] = useState(settings.mpesaPasskey);
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState(settings.mpesaConsumerKey);
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState(settings.mpesaConsumerSecret);
  const [mpesaCallbackUrl, setMpesaCallbackUrl] = useState(settings.mpesaCallbackUrl);

  // FreeRADIUS
  const [radiusServerIp, setRadiusServerIp] = useState(settings.radiusServerIp);
  const [radiusAuthPort, setRadiusAuthPort] = useState(settings.radiusAuthPort);
  const [radiusAcctPort, setRadiusAcctPort] = useState(settings.radiusAcctPort);
  const [radiusSharedSecret, setRadiusSharedSecret] = useState(settings.radiusSharedSecret);

  // WireGuard Gateway
  const [vpnGatewayEndpoint, setVpnGatewayEndpoint] = useState(settings.vpnGatewayEndpoint);
  const [vpnManagementSubnet, setVpnManagementSubnet] = useState(settings.vpnManagementSubnet);
  const [vpnServerPublicKey, setVpnServerPublicKey] = useState(settings.vpnServerPublicKey);

  const [savedMsg, setSavedMsg] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      tagline,
      supportPhone,
      supportEmail,
      countyCity,
      currency,
      timezone,
      mpesaEnvironment,
      mpesaShortcode,
      mpesaPasskey,
      mpesaConsumerKey,
      mpesaConsumerSecret,
      mpesaCallbackUrl,
      radiusServerIp,
      radiusAuthPort: Number(radiusAuthPort),
      radiusAcctPort: Number(radiusAcctPort),
      radiusSharedSecret,
      vpnGatewayEndpoint,
      vpnManagementSubnet,
      vpnServerPublicKey,
    });

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleExportBackup = () => {
    const fullBackup = {
      settings,
      timestamp: new Date().toISOString(),
      platform: 'OmniISP Core v2.0',
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_isp_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Global System & Integration Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure Safaricom Daraja M-Pesa API, FreeRADIUS AAA secrets, and WireGuard CGNAT gateways.
          </p>
        </div>

        {savedMsg && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Configuration Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Business Profile */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#1976D2]" /> ISP Business Identity & Local Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Company / Brand Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold text-[#123B5D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Support Phone Hotline</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">NOC Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Operational Region / City Base</label>
              <input
                type="text"
                value={countyCity}
                onChange={(e) => setCountyCity(e.target.value)}
                placeholder="e.g. Metro Area or Nairobi"
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Billing Currency & Operational Timezone</label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-1/2 rounded-lg border border-[#E2E8F0] p-2.5 font-bold text-[#123B5D] focus:outline-hidden"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="KES">KES (KSh - Kenyan Shilling)</option>
                  <option value="ZAR">ZAR (R - South African Rand)</option>
                  <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="AUD">AUD ($ - Australian Dollar)</option>
                  <option value="BRL">BRL (R$ - Brazilian Real)</option>
                </select>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-1/2 rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-xs focus:outline-hidden"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Safaricom Daraja M-Pesa Integration */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Safaricom Daraja M-Pesa API
            </h3>
            <div className="flex items-center gap-1 font-semibold text-xs">
              <span className="text-[#64748B]">Mode:</span>
              <select
                value={mpesaEnvironment}
                onChange={(e) => setMpesaEnvironment(e.target.value as any)}
                className="rounded border border-[#E2E8F0] px-2 py-0.5 text-xs font-bold uppercase text-[#1976D2] focus:outline-hidden"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Business Shortcode (Paybill / Till) *</label>
              <input
                type="text"
                required
                value={mpesaShortcode}
                onChange={(e) => setMpesaShortcode(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono font-bold text-[#123B5D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Lipa Na M-Pesa Online Passkey *</label>
              <input
                type="password"
                required
                value={mpesaPasskey}
                onChange={(e) => setMpesaPasskey(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Daraja Consumer Key</label>
              <input
                type="text"
                value={mpesaConsumerKey}
                onChange={(e) => setMpesaConsumerKey(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Daraja Consumer Secret</label>
              <input
                type="password"
                value={mpesaConsumerSecret}
                onChange={(e) => setMpesaConsumerSecret(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#172B4D] mb-1">Idempotent Callback Webhook URL</label>
              <input
                type="text"
                value={mpesaCallbackUrl}
                onChange={(e) => setMpesaCallbackUrl(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Centralized FreeRADIUS Settings */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
            <Server className="h-4 w-4 text-[#1976D2]" /> Self-Hosted FreeRADIUS PostgreSQL AAA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">RADIUS Server Internal IP</label>
              <input
                type="text"
                value={radiusServerIp}
                onChange={(e) => setRadiusServerIp(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono font-bold text-[#1976D2] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">RADIUS Shared Secret (/radius secret)</label>
              <input
                type="password"
                value={radiusSharedSecret}
                onChange={(e) => setRadiusSharedSecret(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Authentication Port (UDP)</label>
              <input
                type="number"
                value={radiusAuthPort}
                onChange={(e) => setRadiusAuthPort(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Accounting Port (UDP)</label>
              <input
                type="number"
                value={radiusAcctPort}
                onChange={(e) => setRadiusAcctPort(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: WireGuard CGNAT Gateway */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00B8D9]" /> WireGuard Remote Management Gateway
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-[#172B4D]">VPN Server Public Endpoint</label>
                <button
                  type="button"
                  onClick={() => {
                    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                    const port = vpnGatewayEndpoint.split(':')[1] || '51820';
                    setVpnGatewayEndpoint(`${host}:${port}`);
                  }}
                  className="text-[11px] font-bold text-[#1976D2] hover:underline flex items-center gap-1"
                  title="Auto-fill with current domain / IP"
                >
                  ⚡ Auto-Detect Host
                </button>
              </div>
              <input
                type="text"
                value={vpnGatewayEndpoint}
                onChange={(e) => setVpnGatewayEndpoint(e.target.value)}
                placeholder="e.g. 197.232.45.10:51820 or vpn.yourdomain.com:51820"
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono font-bold text-[#123B5D] focus:outline-hidden"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">
                The public IP or FQDN your MikroTik routers resolve to negotiate WireGuard UDP handshakes.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Private Management Subnet</label>
              <input
                type="text"
                value={vpnManagementSubnet}
                onChange={(e) => setVpnManagementSubnet(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-[#1976D2] font-semibold focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#172B4D] mb-1">Gateway Server Public Key</label>
              <input
                type="text"
                value={vpnServerPublicKey}
                onChange={(e) => setVpnServerPublicKey(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-xs focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              <span>Export Full Configuration</span>
            </button>
            {isConfirmingReset ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 animate-in fade-in">
                <span className="text-[11px] font-bold text-rose-800">Clear all data?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setIsConfirmingReset(false);
                  }}
                  className="rounded bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <span>Reset Database</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-6 py-2.5 font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save All Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
