import React, { useState } from 'react';
import {
  Router as RouterIcon,
  Plus,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Trash2,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Code,
  X,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { MikrotikRouter } from '../../types';
import { generateRouterOsScript } from '../../utils/mikrotikScriptGenerator';

interface RoutersViewProps {
  onNavigate: (tab: string) => void;
}

export const RoutersView: React.FC<RoutersViewProps> = ({ onNavigate }) => {
  const { routers, sites, settings, deleteRouter, updateRouter } = useISP();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<{ id: string; latencyMs: number; details: string; reachable: boolean } | null>(null);
  const [scriptModalRouter, setScriptModalRouter] = useState<MikrotikRouter | null>(null);
  const [consoleModalRouter, setConsoleModalRouter] = useState<MikrotikRouter | null>(null);
  const [terminalCmd, setTerminalCmd] = useState<string>('/system resource print');
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const handleTestPing = async (router: MikrotikRouter) => {
    setTestingId(router.id);
    setProbeResult(null);

    try {
      const res = await fetch('/api/v1/routers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          router,
          settings,
        }),
      });

      const data = await res.json();
      setProbeResult({
        id: router.id,
        latencyMs: data.latencyMs,
        details: data.details,
        reachable: data.reachable,
      });

      if (data.reachable) {
        updateRouter(router.id, {
          status: 'online',
          lastHandshake: new Date().toISOString(),
          cpuLoad: data.cpuLoad || router.cpuLoad,
          memoryUsage: data.memoryUsage || router.memoryUsage,
        });
      }
    } catch (err: any) {
      setProbeResult({
        id: router.id,
        latencyMs: 0,
        details: 'Failed to communicate with backend probe API',
        reachable: false,
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleExecuteTerminal = async () => {
    if (!consoleModalRouter || !terminalCmd) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/v1/routers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          router: consoleModalRouter,
          command: terminalCmd,
        }),
      });
      const data = await res.json();
      setTerminalOutput(data.output);
    } catch (err: any) {
      setTerminalOutput(`Execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            MikroTik Routers & Edge Gateways
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Remote fleet management via outbound WireGuard CGNAT tunnels and RouterOS API-SSL.
          </p>
        </div>

        <button
          onClick={() => onNavigate('connect_mikrotik')}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors self-start sm:self-auto"
        >
          <Zap className="h-4 w-4 text-[#00B8D9]" />
          <span>Connect New Router</span>
        </button>
      </div>

      {/* Global Probe Result Banner */}
      {probeResult && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center justify-between ${
            probeResult.reachable
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {probeResult.reachable ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span>{probeResult.details}</span>
          </div>
          <span className="font-mono font-bold text-xs">
            {probeResult.latencyMs}ms
          </span>
        </div>
      )}

      {/* Routers Grid or Zero State */}
      {routers.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <RouterIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No MikroTik Routers Enrolled Yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
              Connect your first router using our automated 1-script bootstrap generator. It sets up WireGuard remote management (even behind CGNAT/Starlink/Safaricom), FreeRADIUS AAA, and Hotspot/PPPoE.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('connect_mikrotik')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#123B5D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0B2A43] transition-colors"
            >
              <Zap className="h-4 w-4 text-[#00B8D9]" />
              <span>Launch 1-Script Connect Wizard</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routers.map((router) => {
            const site = sites.find((s) => s.id === router.siteId);
            const isOnline = router.status === 'online';

            return (
              <div
                key={router.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-[#1976D2] transition-colors"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#123B5D]">{router.identity}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      ></span>
                      {router.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#172B4D] mt-1">{router.name}</h3>
                  <p className="text-[11px] text-[#64748B]">{router.model}</p>

                  {/* Network Details */}
                  <div className="mt-3 space-y-1.5 text-xs rounded-lg bg-[#F5F8FC] p-3">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Management IP:</span>
                      <span className="font-mono font-bold text-[#1976D2]">{router.managementIp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">RouterOS & Tunnel:</span>
                      <span className="font-semibold text-[#172B4D]">
                        {router.routerOsVersion.toUpperCase()} &bull; {router.managementProtocol.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Assigned PoP / Site:</span>
                      <span className="text-[#172B4D] font-medium">{site?.name || 'Central PoP'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Upstream WAN:</span>
                      <span className="text-emerald-700 font-semibold">{router.upstreamProvider || 'CGNAT Private'}</span>
                    </div>
                  </div>

                  {/* Telemetry Bars */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-[#64748B] mb-0.5">
                        <span>CPU Load</span>
                        <span className="font-semibold text-[#172B4D]">{router.cpuLoad}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${router.cpuLoad}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-[#64748B] mb-0.5">
                        <span>Memory Usage</span>
                        <span className="font-semibold text-[#172B4D]">{router.memoryUsage}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-cyan-600 rounded-full transition-all"
                          style={{ width: `${router.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs">
                  <button
                    disabled={testingId === router.id}
                    onClick={() => handleTestPing(router)}
                    className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1976D2] hover:bg-blue-100 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${testingId === router.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === router.id ? 'Probing Socket...' : 'Test Reachability'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setConsoleModalRouter(router);
                        setTerminalOutput('');
                      }}
                      className="flex items-center gap-1 rounded px-2 py-1 bg-slate-100 text-[#123B5D] hover:bg-slate-200 text-[11px] font-semibold"
                      title="Open RouterOS Live Console"
                    >
                      <Code className="h-3.5 w-3.5 text-[#1976D2]" />
                      <span>Console</span>
                    </button>
                    <button
                      onClick={() => setScriptModalRouter(router)}
                      className="p-1 rounded text-[#64748B] hover:text-[#1976D2] hover:bg-slate-50"
                      title="View Generated RouterOS Script"
                    >
                      <Terminal className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRouter(router.id)}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50"
                      title="Remove Router"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Terminal Console Modal */}
      {consoleModalRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#1976D2]" />
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    RouterOS Terminal Console: {consoleModalRouter.identity}
                  </h3>
                  <span className="font-mono text-[10px] text-[#64748B]">
                    Management Endpoint: {consoleModalRouter.managementIp}:8728
                  </span>
                </div>
              </div>
              <button onClick={() => setConsoleModalRouter(null)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={terminalCmd}
                onChange={(e) => setTerminalCmd(e.target.value)}
                placeholder="/system resource print or /interface wireguard print"
                className="flex-1 rounded-lg border border-[#E2E8F0] p-2 text-xs font-mono focus:border-[#1976D2] focus:outline-hidden"
              />
              <button
                disabled={isExecuting}
                onClick={handleExecuteTerminal}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#123B5D] px-5 py-2 text-xs font-bold text-white hover:bg-[#0B2A43] disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                <span>Send to RouterOS</span>
              </button>
            </div>

            {/* Quick Command Presets */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                '/system resource print',
                '/interface wireguard print',
                '/interface wireguard peers print',
                '/radius print',
                '/ip hotspot active print',
                '/ping count=3 address=8.8.8.8',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setTerminalCmd(cmd)}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-mono hover:bg-slate-200"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Terminal Screen */}
            <div className="rounded-lg bg-[#0B1F33] p-4 text-xs font-mono text-emerald-400 overflow-x-auto min-h-48 max-h-96">
              <pre className="whitespace-pre-wrap">
                {terminalOutput || `# Ready for command execution on ${consoleModalRouter.identity} over WireGuard tunnel...
# Click 'Send to RouterOS' or choose a quick command above.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {scriptModalRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-sm font-bold text-[#123B5D]">
                RouterOS Script: {scriptModalRouter.identity}
              </span>
              <button onClick={() => setScriptModalRouter(null)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-[#0B1F33] p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
              <pre className="whitespace-pre-wrap">
                {generateRouterOsScript({ router: scriptModalRouter, settings })}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateRouterOsScript({ router: scriptModalRouter, settings }));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-bold text-white hover:bg-[#123B5D]"
              >
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
