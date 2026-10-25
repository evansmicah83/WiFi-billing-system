import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wifi,
  Network,
  Package,
  Ticket,
  CreditCard,
  FileText,
  Router,
  Zap,
  Building,
  Radio,
  Globe,
  Shield,
  Layers,
  Activity,
  UserCheck,
  LifeBuoy,
  Boxes,
  BarChart3,
  UserCog,
  History,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { customers, routers, vouchers, tickets, invoices, settings } = useISP();

  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid').length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;

  const sections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'customers', name: 'Customers', icon: Users, badge: customers.length },
        { id: 'packages', name: 'Packages & Tariffs', icon: Package },
        { id: 'hotspot', name: 'Hotspot', icon: Wifi },
        { id: 'pppoe', name: 'PPPoE', icon: Network },
        { id: 'vouchers', name: 'Vouchers', icon: Ticket, badge: vouchers.length },
      ],
    },
    {
      title: 'Billing & Finance',
      items: [
        { id: 'payments', name: 'Payments', icon: CreditCard },
        { id: 'invoices', name: 'Invoices', icon: FileText, badge: unpaidInvoices > 0 ? unpaidInvoices : undefined },
        { id: 'resellers', name: 'Resellers & Agents', icon: UserCheck },
        { id: 'reports', name: 'Financial Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Network & Infrastructure',
      items: [
        { id: 'routers', name: 'Routers', icon: Router, badge: routers.length },
        { id: 'connect_mikrotik', name: 'Connect MikroTik', icon: Zap },
        { id: 'sites', name: 'Sites & PoPs', icon: Building },
        { id: 'upstream', name: 'Upstream Networks', icon: Radio },
        { id: 'ipam', name: 'IP Pools (IPAM)', icon: Globe },
        { id: 'monitoring', name: 'Network Monitoring', icon: Activity },
      ],
    },
    {
      title: 'Support & Assets',
      items: [
        { id: 'tickets', name: 'Support Tickets', icon: LifeBuoy, badge: openTickets > 0 ? openTickets : undefined },
        { id: 'inventory', name: 'Hardware Inventory', icon: Boxes },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { id: 'users', name: 'Users & Roles', icon: UserCog },
        { id: 'audit_logs', name: 'Audit Logs', icon: History },
        { id: 'settings', name: 'System Settings', icon: Settings },
      ],
    },
  ];

  const brandInitials = (settings.companyName || 'ISP')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 3)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-[#E2E8F0] bg-[#123B5D] text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00B8D9] text-[#123B5D] font-black text-sm">
              {brandInitials || 'ISP'}
            </div>
            <div className="truncate">
              <span className="text-sm font-bold tracking-tight text-white block truncate">
                {settings.companyName || 'OmniISP Cloud'}
              </span>
              <span className="text-[10px] text-[#00B8D9] font-semibold tracking-wider uppercase block truncate">
                {settings.tagline || 'Telecom & Billing Platform'}
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Nav Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                {section.title}
              </h2>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobile();
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1976D2] text-white shadow-xs'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#00B8D9]' : 'text-white/60 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                              isActive ? 'bg-white text-[#1976D2]' : 'bg-white/20 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-3 w-3 text-white/80" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Status Footer */}
        <div className="border-t border-white/10 bg-[#0B2A43] p-3 text-xs">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span>FreeRADIUS Engine</span>
            <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span> PostgreSQL SQL
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>WireGuard Gateway</span>
            <span className="text-[#00B8D9] font-mono text-[10px]">10.254.0.1/24</span>
          </div>
        </div>
      </aside>
    </>
  );
};
