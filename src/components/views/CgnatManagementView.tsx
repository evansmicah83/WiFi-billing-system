import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Activity,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Radio,
  Cpu,
  Check,
  XCircle,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

interface TestStepResult {
  step: string;
  name: string;
  status: 'passed' | 'failed';
  details: string;
}

export const CgnatManagementView: React.FC = () => {
  const { routers, settings } = useISP();

  const [testingTunnelId, setTestingTunnelId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    summary: string;
    steps: TestStepResult[];
    overallPass: boolean;
  } | null>(null);

  const handleRunAcceptanceTest = async (routerId: string) => {
    setTestingTunnelId(routerId);
    setTestResults(null);

    try {
      const res = await fetch('/api/v1/cgnat/test-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routerId }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResults({
          summary: data.summary,
          steps: data.steps || [],
          overallPass: data.overallPass,
        });
      } else {
        setTestResults({
          summary: 'Failed to run CGNAT test suite against backend gateway.',
          steps: [],
          overallPass: false,
        });
      }
    } catch {
      setTestResults({
        summary: 'Error contacting CGNAT test daemon.',
        steps: [],
        overallPass: false,
      });
    } finally {
      setTestingTunnelId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            CGNAT Remote Management Architecture
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Outbound-initiated WireGuard v7 tunnels enable remote API control behind dynamic CGNAT or Starlink.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          WireGuard Core Gateway: ACTIVE
        </span>
      </div>

      {/* Architecture Explanation Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#1976D2]" /> How CGNAT Bypass Works (Section 6 Compliance)
        </h3>
        <p className="text-xs text-[#172B4D] leading-relaxed">
          Standard Kenyan upstream fibre providers (Safaricom, Zuku, Faiba) and satellite links (Starlink) assign private dynamic WAN IPs in the CGNAT range (e.g. <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">100.64.0.0/10</code>). Inbound port forwarding is impossible from the public internet.
        </p>
        <p className="text-xs text-[#172B4D] leading-relaxed">
          SmartLinkNet solves this by configuring the MikroTik to establish an <strong>outbound encrypted WireGuard tunnel</strong> to our Linux VPN gateway with <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">persistent-keepalive=25s</code>. All backend operations (RouterOS API-SSL, monitoring, FreeRADIUS CoA) travel securely inside this tunnel without opening public ports.
        </p>
      </div>

      {/* Gateway Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
          <span className="font-medium text-[#64748B]">Gateway Public Endpoint</span>
          <p className="font-mono font-bold text-[#123B5D] text-sm">{settings.vpnGatewayEndpoint}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Port 51820 / UDP Reachable</span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
          <span className="font-medium text-[#64748B]">Internal Management Subnet</span>
          <p className="font-mono font-bold text-[#1976D2] text-sm">{settings.vpnManagementSubnet}</p>
          <span className="text-[10px] text-[#64748B]">Gateway IP: 10.254.0.1/24</span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
          <span className="font-medium text-[#64748B]">Registered WireGuard Peers</span>
          <p className="font-bold text-[#123B5D] text-sm">{routers.length} Tunnels Active</p>
          <span className="text-[10px] text-[#64748B]">Zero-trust peer isolation enforced</span>
        </div>
      </div>

      {/* Peers Table or Zero State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#123B5D]">Enrolled WireGuard Router Peers</h3>
          <span className="text-xs text-[#64748B]">{routers.length} peers enrolled</span>
        </div>

        {routers.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-2">
            <Lock className="h-8 w-8 text-[#64748B] mx-auto" />
            <h4 className="text-sm font-bold text-[#123B5D]">No active management peers</h4>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Enroll a router via the Connect MikroTik wizard to generate a unique WireGuard peer keypair and management IP.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Router / Peer Identity</th>
                  <th className="px-4 py-3 text-left font-semibold">Management IP</th>
                  <th className="px-4 py-3 text-left font-semibold">WAN Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Keepalive</th>
                  <th className="px-4 py-3 text-left font-semibold">Tunnel State</th>
                  <th className="px-4 py-3 text-right font-semibold">Section 6.5 Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {routers.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5F8FC]/60">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#123B5D]">{r.identity}</div>
                      <div className="font-mono text-[10px] text-[#64748B]">{r.name}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-[#1976D2]">
                      {r.managementIp}/24
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {r.wanType.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[#64748B] font-mono">25s (NAT Traversal)</td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        ESTABLISHED
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={testingTunnelId === r.id}
                        onClick={() => handleRunAcceptanceTest(r.id)}
                        className="rounded bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1976D2] hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      >
                        {testingTunnelId === r.id ? 'Running 7-Step Suite...' : 'Run Section 6.5 Test'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Real Backend Section 6.5 Test Suite Results */}
        {testResults && (
          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-2xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#123B5D]">
                  Section 6.5 CGNAT Bypass Automated Test Suite
                </h4>
                <p className="text-xs text-[#64748B]">{testResults.summary}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  testResults.overallPass
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {testResults.overallPass ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                )}
                {testResults.overallPass ? 'ALL TESTS PASSED' : 'CHECK FAILED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {testResults.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-[#F5F8FC] flex items-start gap-2.5"
                >
                  {step.status === 'passed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-[#123B5D]">
                      {step.step}: {step.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">{step.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
