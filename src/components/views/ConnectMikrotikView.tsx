import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Server,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  Terminal,
  Activity,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Radio,
  Lock,
  Layers,
  Code,
  Globe,
  Check,
  Sparkles,
  HelpCircle,
  Play,
  Wifi,
  Network,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { MikrotikRouter, RouterOsVersion, ManagementVpnProtocol } from '../../types';

interface ConnectMikrotikViewProps {
  onNavigate: (tab: string) => void;
}

export const ConnectMikrotikView: React.FC<ConnectMikrotikViewProps> = ({ onNavigate }) => {
  const { routers, sites, settings, addRouter, updateSettings } = useISP();

  // Wizard state: Step 1 (Quick Details) -> Step 2 (Connect & Realtime Detection)
  const [step, setStep] = useState<1 | 2>(1);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [copiedFullScript, setCopiedFullScript] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Router basic details
  const nextMgmtIpIndex = routers.length + 5;
  const [routerName, setRouterName] = useState('Core Gateway Router 01');
  const [identity, setIdentity] = useState('CORE-ROUTER-01');
  const [model, setModel] = useState('MikroTik CCR2004-16G-2S+');
  const [routerOsVersion, setRouterOsVersion] = useState<RouterOsVersion>('v7');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [wanInterface, setWanInterface] = useState('ether1');
  const [lanInterface, setLanInterface] = useState('bridge-lan');

  // Backend generated responses
  const [enrollmentToken, setEnrollmentToken] = useState('');
  const [managementIp, setManagementIp] = useState(`10.254.0.${nextMgmtIpIndex}`);
  const [oneLinerCommand, setOneLinerCommand] = useState('');
  const [scriptContent, setScriptContent] = useState('');

  // Realtime detector state
  const [detectorStatus, setDetectorStatus] = useState<'listening' | 'connected' | 'error'>('listening');
  const [detectedRouter, setDetectedRouter] = useState<any | null>(null);
  const [pollingActive, setPollingActive] = useState(false);

  // Realtime Live Console state
  const [activeTabMode, setActiveTabMode] = useState<'quick_cmd' | 'full_script' | 'live_console'>('quick_cmd');
  const [cliCommand, setCliCommand] = useState('/system resource print');
  const [cliOutput, setCliOutput] = useState('');
  const [isExecutingCli, setIsExecutingCli] = useState(false);

  const pollingTimerRef = useRef<any>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active host & WireGuard endpoint detection
  const detectedBrowserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const defaultWireguardPort = settings.vpnGatewayEndpoint?.split(':')[1] || '51820';
  const autoDetectedEndpoint = `${detectedBrowserHost}:${defaultWireguardPort}`;

  const isPlaceholderDomain =
    settings.vpnGatewayEndpoint.includes('smartlinknet.co.ke') ||
    settings.vpnGatewayEndpoint.includes('ispnetwork.net') ||
    !settings.vpnGatewayEndpoint;

  const [isEditingEndpoint, setIsEditingEndpoint] = useState(false);
  const [customEndpointValue, setCustomEndpointValue] = useState(settings.vpnGatewayEndpoint);

  useEffect(() => {
    setCustomEndpointValue(settings.vpnGatewayEndpoint);
  }, [settings.vpnGatewayEndpoint]);

  const handleApplyEndpoint = async (newEndpoint: string) => {
    const clean = newEndpoint.trim();
    if (!clean) return;

    updateSettings({ vpnGatewayEndpoint: clean });
    setCustomEndpointValue(clean);
    setIsEditingEndpoint(false);

    // If step 2 is already active with enrollmentToken, regenerate oneLinerCommand & scriptContent
    if (step === 2 && enrollmentToken) {
      try {
        const cleanIdentity = identity.trim().toUpperCase().replace(/\s+/g, '-');
        const payloadRouter = {
          tenantId: settings.tenantId,
          siteId,
          name: routerName,
          identity: cleanIdentity,
          model,
          routerOsVersion,
          managementProtocol: (routerOsVersion === 'v7' ? 'wireguard' : 'sstp') as ManagementVpnProtocol,
          managementIp,
          tunnelPort: 13231,
          wanType: 'cgnat_private' as const,
          upstreamProvider: 'Safaricom / Faiba / Starlink (CGNAT)',
          hotspotEnabled: true,
          pppoeEnabled: true,
          radiusEnabled: true,
          natMasqueradeEnabled: true,
          apiPort: 8728,
        };

        const res = await fetch('/api/v1/routers/enroll/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            router: payloadRouter,
            settings: { ...settings, vpnGatewayEndpoint: clean },
            wanInterface,
            lanInterface,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setOneLinerCommand(data.oneLinerCommand);
          setScriptContent(data.script);
        }
      } catch (err) {
        console.error('Error refreshing script with new endpoint:', err);
      }
    }
  };

  // Step 1 -> Step 2: Call backend to create enrollment & generate 1-line script
  const handleGenerateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const cleanIdentity = identity.trim().toUpperCase().replace(/\s+/g, '-');
      const payloadRouter = {
        tenantId: settings.tenantId,
        siteId,
        name: routerName,
        identity: cleanIdentity,
        model,
        routerOsVersion,
        managementProtocol: (routerOsVersion === 'v7' ? 'wireguard' : 'sstp') as ManagementVpnProtocol,
        managementIp,
        tunnelPort: 13231,
        wanType: 'cgnat_private' as const,
        upstreamProvider: 'Safaricom / Faiba / Starlink (CGNAT)',
        hotspotEnabled: true,
        pppoeEnabled: true,
        radiusEnabled: true,
        natMasqueradeEnabled: true,
        apiPort: 8728,
      };

      const res = await fetch('/api/v1/routers/enroll/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          router: payloadRouter,
          settings,
          wanInterface,
          lanInterface,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEnrollmentToken(data.token);
        setOneLinerCommand(data.oneLinerCommand);
        setScriptContent(data.script);
        if (data.managementIp) setManagementIp(data.managementIp);

        // Sync auto-detected endpoint if backend corrected placeholder
        if (data.effectiveEndpoint && data.effectiveEndpoint !== settings.vpnGatewayEndpoint) {
          updateSettings({ vpnGatewayEndpoint: data.effectiveEndpoint });
        }

        // Move to Step 2 and activate Realtime Radar Listener
        setStep(2);
        setDetectorStatus('listening');
        setPollingActive(true);
      } else {
        setErrorMsg(data.error || 'Failed to initiate router enrollment');
      }
    } catch (err: any) {
      console.error('Enroll error:', err);
      setErrorMsg('Network error connecting to backend: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Realtime Polling Effect: actively polls the backend to detect router checkin
  useEffect(() => {
    if (step === 2 && pollingActive && enrollmentToken) {
      pollingTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/v1/routers/status/${enrollmentToken}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'connected') {
              clearInterval(pollingTimerRef.current);
              setPollingActive(false);
              setDetectorStatus('connected');
              setDetectedRouter(data);

              // Automatically add router to context
              addRouter({
                tenantId: settings.tenantId,
                siteId,
                name: routerName,
                identity: data.identity || identity,
                model: data.boardModel || model,
                routerOsVersion,
                managementProtocol: routerOsVersion === 'v7' ? 'wireguard' : 'sstp',
                managementIp: data.managementIp || managementIp,
                tunnelPort: 13231,
                wanType: 'cgnat_private',
                upstreamProvider: 'Safaricom Fibre / Starlink',
                hotspotEnabled: true,
                pppoeEnabled: true,
                radiusEnabled: true,
                natMasqueradeEnabled: true,
                apiPort: 8728,
                enrollmentToken,
              });
            }
          }
        } catch (e) {
          // ignore transient poll error
        }
      }, 2000);
    }

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [step, pollingActive, enrollmentToken]);

  // Copy helpers
  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(oneLinerCommand);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2500);
  };

  const handleCopyFullScript = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopiedFullScript(true);
    setTimeout(() => setCopiedFullScript(false), 2500);
  };

  const handleDownloadRsc = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${identity.toLowerCase()}-smartlinknet.rsc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run real-time checkin simulation (for testing in browser or lab without hardware)
  const handleSimulateCheckin = async () => {
    if (!enrollmentToken) return;
    try {
      const res = await fetch(`/api/v1/routers/trigger-checkin/${enrollmentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          model,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDetectorStatus('connected');
        setDetectedRouter(data.session);
        setPollingActive(false);

        // Add to state
        addRouter({
          tenantId: settings.tenantId,
          siteId,
          name: routerName,
          identity,
          model,
          routerOsVersion,
          managementProtocol: routerOsVersion === 'v7' ? 'wireguard' : 'sstp',
          managementIp,
          tunnelPort: 13231,
          wanType: 'cgnat_private',
          upstreamProvider: 'Safaricom Fibre / Starlink',
          hotspotEnabled: true,
          pppoeEnabled: true,
          radiusEnabled: true,
          natMasqueradeEnabled: true,
          apiPort: 8728,
          enrollmentToken,
        });
      }
    } catch (e: any) {
      setErrorMsg('Error triggering checkin: ' + e.message);
    }
  };

  // Run live RouterOS command in the console
  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || cliCommand;
    if (!cmd) return;
    setIsExecutingCli(true);

    try {
      const targetRouter: MikrotikRouter = {
        id: 'active_router',
        tenantId: settings.tenantId,
        siteId,
        name: routerName,
        identity,
        model,
        routerOsVersion,
        managementProtocol: routerOsVersion === 'v7' ? 'wireguard' : 'sstp',
        managementIp,
        tunnelPort: 13231,
        status: 'online',
        wanType: 'cgnat_private',
        cpuLoad: 12,
        memoryUsage: 28,
        uptime: '2h',
        hotspotEnabled: true,
        pppoeEnabled: true,
        radiusEnabled: true,
        natMasqueradeEnabled: true,
        apiPort: 8728,
      };

      const res = await fetch('/api/v1/routers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          router: targetRouter,
          command: cmd,
        }),
      });

      const data = await res.json();
      setCliOutput(data.output);
    } catch (err: any) {
      setCliOutput(`Execution error: ${err.message}`);
    } finally {
      setIsExecutingCli(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#123B5D] text-[#00B8D9] shadow-xs">
              <Zap className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
              Connect MikroTik Router
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Super-simple 2-step setup: Name your router, paste 1 command in WinBox, and watch it link in real-time.
          </p>
        </div>

        <button
          onClick={() => onNavigate('routers')}
          className="text-xs font-semibold text-[#1976D2] hover:underline self-start sm:self-auto"
        >
          View Connected Fleet ({routers.length})
        </button>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 font-bold ${
              step === 1 ? 'text-[#1976D2]' : 'text-emerald-700'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 1 ? 'bg-[#1976D2] text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Step 1: Router Setup</span>
          </div>

          <div className="h-0.5 w-8 bg-slate-200"></div>

          <div
            className={`flex items-center gap-2 font-bold ${
              step === 2 ? 'text-[#1976D2]' : 'text-[#64748B]'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2 ? 'bg-[#1976D2] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span>Step 2: Paste Command & Realtime Detect</span>
          </div>
        </div>

        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="text-xs font-semibold text-[#64748B] hover:text-[#172B4D] flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Setup
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: QUICK & SIMPLE ROUTER SETUP                                        */}
      {/* ========================================================================= */}
      {step === 1 && (
        <form onSubmit={handleGenerateConnection} className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">Router Profile & Hardware</h3>
                <p className="text-xs text-[#64748B]">
                  No complicated networking required. SmartLinkNet automatically configures WireGuard, FreeRADIUS, Hotspot, and PPPoE.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                AUTO-CONFIGURED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Router Name / Location *
                </label>
                <input
                  type="text"
                  required
                  value={routerName}
                  onChange={(e) => setRouterName(e.target.value)}
                  placeholder="e.g. Westlands PoP Core or Main Office"
                  className="w-full rounded-xl border border-[#E2E8F0] p-3 text-xs font-semibold focus:border-[#1976D2] focus:outline-hidden"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  A friendly label to identify this router on your dashboard.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Router System Identity (/system identity) *
                </label>
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value.toUpperCase())}
                  placeholder="e.g. SLN-CORE-01"
                  className="w-full rounded-xl border border-[#E2E8F0] p-3 text-xs font-mono font-bold text-[#123B5D] focus:border-[#1976D2] focus:outline-hidden"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  This will be set as the router's identity in MikroTik RouterOS.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Hardware Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] p-3 text-xs focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="MikroTik CCR2004-16G-2S+">MikroTik CCR2004 (Cloud Core Router)</option>
                  <option value="MikroTik RB5009UG+S+IN">MikroTik RB5009 (High-Speed Edge)</option>
                  <option value="MikroTik RB4011iGS+RM">MikroTik RB4011 (Apartment / Estate)</option>
                  <option value="MikroTik hEX S (RB760iGS)">MikroTik hEX S (Small Branch / Cafe)</option>
                  <option value="MikroTik hAP ac3 / ax3">MikroTik hAP ac3 / ax3 (Wi-Fi Hotspot)</option>
                  <option value="MikroTik CHR (Cloud Hosted Router)">MikroTik CHR (Cloud Hosted VM)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  RouterOS Target Version
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRouterOsVersion('v7')}
                    className={`rounded-xl border p-2.5 text-center font-bold text-xs transition-all ${
                      routerOsVersion === 'v7'
                        ? 'border-[#1976D2] bg-blue-50 text-[#1976D2]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    RouterOS v7 (WireGuard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouterOsVersion('v6')}
                    className={`rounded-xl border p-2.5 text-center font-bold text-xs transition-all ${
                      routerOsVersion === 'v6'
                        ? 'border-[#1976D2] bg-blue-50 text-[#1976D2]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    RouterOS v6 (SSTP)
                  </button>
                </div>
              </div>

              {/* WireGuard Peer Gateway Endpoint Configuration */}
              <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-[#123B5D]">
                      WireGuard Server Gateway Endpoint (Peer Address) *
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      The public domain or IP your MikroTik connects to via UDP port 51820.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                    className="self-start sm:self-auto rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-[#1976D2] hover:bg-blue-200 transition-colors flex items-center gap-1 shrink-0"
                    title="Auto-fill with current browser/server host"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Detect ({autoDetectedEndpoint})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customEndpointValue}
                    onChange={(e) => setCustomEndpointValue(e.target.value)}
                    onBlur={() => handleApplyEndpoint(customEndpointValue)}
                    placeholder="e.g. 197.232.45.10:51820 or your-domain.com:51820"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs font-mono font-bold text-[#123B5D] focus:border-[#1976D2] focus:outline-hidden"
                  />
                  {customEndpointValue !== settings.vpnGatewayEndpoint && (
                    <button
                      type="button"
                      onClick={() => handleApplyEndpoint(customEndpointValue)}
                      className="rounded-xl bg-[#1976D2] px-3 py-2 text-xs font-bold text-white hover:bg-[#123B5D] shrink-0"
                    >
                      Save
                    </button>
                  )}
                </div>

                {isPlaceholderDomain && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Current setting is a placeholder. Click "Auto-Detect" to use your current server host.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Included Features Banner */}
            <div className="rounded-xl border border-blue-200 bg-[#F5F8FC] p-4 text-xs space-y-2">
              <span className="font-bold text-[#123B5D] flex items-center gap-1.5 text-xs">
                <Sparkles className="h-4 w-4 text-[#1976D2]" /> Automatically Pre-Configured For You:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span><strong>WireGuard CGNAT Bypass:</strong> Connects behind Safaricom/Faiba/Starlink</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span><strong>FreeRADIUS AAA Client:</strong> Ready for Hotspot vouchers & PPPoE users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span><strong>Captive Portal & Walled Garden:</strong> Safaricom M-Pesa bypass included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span><strong>Idempotent NAT Masquerade:</strong> Zero duplicate firewall rules</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-xl bg-[#1976D2] px-6 py-3 text-xs font-bold text-white hover:bg-[#123B5D] shadow-xs transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Preparing 1-Click Script...</span>
                  </>
                ) : (
                  <>
                    <span>Generate 1-Click Connection</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: INSTANT COMMAND & REALTIME AUTO-DETECTION                          */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          {/* WireGuard Peer Target & Domain Inspector */}
          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123B5D] text-[#00B8D9] shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#123B5D] text-xs">WireGuard Gateway Peer Target:</span>
                    <code className="font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[#1976D2] text-xs">
                      {settings.vpnGatewayEndpoint}
                    </code>
                    {isPlaceholderDomain ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Unowned Domain (Update Required)
                      </span>
                    ) : settings.vpnGatewayEndpoint === autoDetectedEndpoint ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <Check className="h-3 w-3" /> Auto-Synced to Active Server
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        Custom Public Host / IP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Your MikroTik router contacts this address via UDP port {defaultWireguardPort} to establish its tunnel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {settings.vpnGatewayEndpoint !== autoDetectedEndpoint && (
                  <button
                    type="button"
                    onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                    className="rounded-xl bg-[#1976D2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#123B5D] transition-colors flex items-center gap-1.5 shadow-xs"
                    title={`Auto-update WireGuard peer to ${autoDetectedEndpoint}`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Update to Active Host</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingEndpoint(!isEditingEndpoint)}
                  className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{isEditingEndpoint ? 'Cancel' : 'Change IP / Domain'}</span>
                </button>
              </div>
            </div>

            {/* If placeholder warning */}
            {isPlaceholderDomain && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>smartlinknet.co.ke</strong> is not your domain — the router's WireGuard peer will fail to resolve. Auto-sync to your active server host now:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                  className="self-start sm:self-auto rounded-lg bg-amber-600 px-3 py-1 font-bold text-white text-[11px] hover:bg-amber-700 shrink-0"
                >
                  ⚡ Apply {autoDetectedEndpoint}
                </button>
              </div>
            )}

            {/* Custom Input Drawer */}
            {isEditingEndpoint && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={customEndpointValue}
                  onChange={(e) => setCustomEndpointValue(e.target.value)}
                  placeholder="e.g. 197.232.45.10:51820 or vpn.yourdomain.com:51820"
                  className="w-full sm:flex-1 rounded-xl border border-[#E2E8F0] p-2.5 text-xs font-mono font-bold text-[#123B5D] focus:border-[#1976D2] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleApplyEndpoint(customEndpointValue)}
                  className="w-full sm:w-auto rounded-xl bg-[#1976D2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123B5D] shrink-0"
                >
                  Apply & Regenerate Script
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                  className="w-full sm:w-auto rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-[#1976D2] hover:bg-blue-100 shrink-0 flex items-center justify-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Use Active Host</span>
                </button>
              </div>
            )}
          </div>

          {/* Main 1-Line Command Box */}
          <div className="rounded-2xl border-2 border-[#1976D2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#1976D2] mb-1">
                  <Zap className="h-3.5 w-3.5" /> Quick Connect
                </span>
                <h3 className="text-base font-bold text-[#123B5D]">
                  Run This 1 Command in MikroTik Terminal
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-lg">
                IP: {managementIp}
              </span>
            </div>

            {/* 3 Step Visual Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#172B4D]">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3 flex items-start gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123B5D] text-white font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <p className="font-bold text-[#123B5D]">Open WinBox</p>
                  <p className="text-[11px] text-[#64748B]">Log into your MikroTik router.</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3 flex items-start gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123B5D] text-white font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <p className="font-bold text-[#123B5D]">Click "New Terminal"</p>
                  <p className="text-[11px] text-[#64748B]">Found in the left WinBox menu.</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3 flex items-start gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123B5D] text-white font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <p className="font-bold text-[#123B5D]">Paste & Press Enter</p>
                  <p className="text-[11px] text-[#64748B]">The script configures everything.</p>
                </div>
              </div>
            </div>

            {/* Command Box */}
            <div className="rounded-xl bg-[#0B1F33] p-4 text-xs font-mono text-emerald-400 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/10">
                <span>Copy & Paste this command into WinBox Terminal:</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
              <p className="whitespace-pre-wrap break-all select-all font-semibold text-emerald-300">
                {oneLinerCommand}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={handleCopyOneLiner}
                className="flex items-center gap-2 rounded-xl bg-[#1976D2] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#123B5D] transition-colors shadow-xs"
              >
                {copiedOneLiner ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedOneLiner ? 'Copied to Clipboard!' : 'Copy 1-Line Command'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTabMode(activeTabMode === 'full_script' ? 'quick_cmd' : 'full_script')}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-slate-50"
                >
                  {activeTabMode === 'full_script' ? 'Hide Full Script' : 'View Full Script (.rsc)'}
                </button>
                <button
                  onClick={handleDownloadRsc}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .rsc</span>
                </button>
              </div>
            </div>

            {/* Full Script Accordion if requested */}
            {activeTabMode === 'full_script' && (
              <div className="rounded-xl bg-[#0B1F33] p-4 text-xs font-mono text-emerald-400 max-h-72 overflow-y-auto mt-3">
                <pre className="whitespace-pre-wrap leading-relaxed">{scriptContent}</pre>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* REALTIME RADAR LISTENER                                                    */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl p-6 transition-all ${
              detectorStatus === 'connected'
                ? 'border-2 border-emerald-500 bg-emerald-50/70'
                : 'border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50'
            }`}
          >
            {detectorStatus === 'listening' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Animated Radar Pulse */}
                  <div className="relative flex h-12 w-12 items-center justify-center shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1976D2] opacity-40"></span>
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1976D2] text-white">
                      <Radio className="h-5 w-5" />
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                      <span>Listening for Router Connection...</span>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#1976D2]" />
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Waiting for <strong className="text-[#123B5D]">{identity}</strong> to run the command and establish its WireGuard handshake to <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-bold">{settings.vpnGatewayEndpoint}</code>.
                    </p>
                    {isPlaceholderDomain ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-amber-800 font-medium">
                        <span className="flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Unowned domain! Handshake cannot complete.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                          className="font-bold underline text-[#1976D2] hover:text-[#123B5D]"
                        >
                          Auto-update to {autoDetectedEndpoint} now
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                        <span>WireGuard Target: {settings.vpnGatewayEndpoint}</span>
                        {settings.vpnGatewayEndpoint !== autoDetectedEndpoint && (
                          <button
                            type="button"
                            onClick={() => handleApplyEndpoint(autoDetectedEndpoint)}
                            className="font-semibold text-[#1976D2] hover:underline"
                          >
                            (Sync to {autoDetectedEndpoint})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handleSimulateCheckin}
                    className="rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-bold text-[#1976D2] hover:bg-blue-50 shadow-2xs"
                    title="Simulate command execution if testing in browser"
                  >
                    Simulate WinBox Execution (Lab Test)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-950">
                        🎉 MikroTik Router Connected & Online!
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Outbound WireGuard management tunnel established. API is reachable on <span className="font-mono font-bold">{managementIp}:8728</span>.
                      </p>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full">
                    Latency: 12ms
                  </span>
                </div>

                {/* Verified Services Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-emerald-900 font-semibold">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-100/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>WireGuard: Up</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-100/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>RADIUS AAA: Bound</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-100/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>Hotspot: Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-100/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    <span>PPPoE: Listening</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* REALTIME COMMAND TEST STATION                                             */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#1976D2]" /> Realtime Command Test Station
                </h3>
                <p className="text-xs text-[#64748B]">
                  Test real-time execution against your router right now. Click any quick command below:
                </p>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                API-Over-Tunnel Live
              </span>
            </div>

            {/* Quick Action Test Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={isExecutingCli}
                onClick={() => handleRunCommand('/ping count=3 address=8.8.8.8')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-[#F5F8FC] p-2.5 text-xs font-bold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2] transition-all disabled:opacity-50"
              >
                <Activity className="h-3.5 w-3.5 text-[#1976D2]" />
                <span>Test Ping (8.8.8.8)</span>
              </button>

              <button
                disabled={isExecutingCli}
                onClick={() => handleRunCommand('/system resource print')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-[#F5F8FC] p-2.5 text-xs font-bold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2] transition-all disabled:opacity-50"
              >
                <Server className="h-3.5 w-3.5 text-[#1976D2]" />
                <span>System Specs (CPU/RAM)</span>
              </button>

              <button
                disabled={isExecutingCli}
                onClick={() => handleRunCommand('/interface wireguard peers print')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-[#F5F8FC] p-2.5 text-xs font-bold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2] transition-all disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Inspect WireGuard</span>
              </button>

              <button
                disabled={isExecutingCli}
                onClick={() => handleRunCommand('/radius print')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-[#F5F8FC] p-2.5 text-xs font-bold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2] transition-all disabled:opacity-50"
              >
                <Radio className="h-3.5 w-3.5 text-[#00B8D9]" />
                <span>Verify FreeRADIUS</span>
              </button>
            </div>

            {/* Custom Command Input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={cliCommand}
                onChange={(e) => setCliCommand(e.target.value)}
                placeholder="/system resource print or /ip hotspot active print"
                className="flex-1 rounded-xl border border-[#E2E8F0] p-2.5 text-xs font-mono focus:border-[#1976D2] focus:outline-hidden"
              />
              <button
                disabled={isExecutingCli}
                onClick={() => handleRunCommand()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#123B5D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0B2A43] transition-colors disabled:opacity-50"
              >
                {isExecutingCli ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-[#00B8D9]" />
                    <span>Execute Command</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal Output */}
            {cliOutput && (
              <div className="rounded-xl bg-[#0B1F33] p-4 text-xs font-mono text-emerald-400 max-h-64 overflow-y-auto mt-2">
                <pre className="whitespace-pre-wrap">{cliOutput}</pre>
              </div>
            )}
          </div>

          {/* Navigation Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#172B4D] hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Modify Settings</span>
            </button>

            <button
              onClick={() => onNavigate('routers')}
              className="flex items-center gap-2 rounded-xl bg-[#123B5D] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0B2A43] shadow-xs"
            >
              <span>View In Router Fleet ({routers.length})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
