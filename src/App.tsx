/**
 * SmartLinkNet Kenya - Complete ISP Billing, Hotspot, PPPoE, MikroTik Automation,
 * CGNAT Remote Management and Public IP Platform.
 */

import React, { useState } from 'react';
import { ISPProvider, useISP } from './context/ISPContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { OverviewView } from './components/views/OverviewView';
import { CustomersView } from './components/views/CustomersView';
import { HotspotView } from './components/views/HotspotView';
import { PppoeView } from './components/views/PppoeView';
import { PackagesView } from './components/views/PackagesView';
import { VouchersView } from './components/views/VouchersView';
import { PaymentsView } from './components/views/PaymentsView';
import { InvoicesView } from './components/views/InvoicesView';
import { RoutersView } from './components/views/RoutersView';
import { ConnectMikrotikView } from './components/views/ConnectMikrotikView';
import { SitesBranchesView } from './components/views/SitesBranchesView';
import { UpstreamNetworksView } from './components/views/UpstreamNetworksView';
import { IpManagementView } from './components/views/IpManagementView';
import { CgnatManagementView } from './components/views/CgnatManagementView';
import { PublicIpServicesView } from './components/views/PublicIpServicesView';
import { NetworkMonitoringView } from './components/views/NetworkMonitoringView';
import { ResellersView } from './components/views/ResellersView';
import { SupportTicketsView } from './components/views/SupportTicketsView';
import { InventoryView } from './components/views/InventoryView';
import { ReportsView } from './components/views/ReportsView';
import { UsersPermissionsView } from './components/views/UsersPermissionsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemSettingsView } from './components/views/SystemSettingsView';

const AppContent: React.FC = () => {
  const { settings } = useISP();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={setActiveTab} />;
      case 'customers':
        return <CustomersView />;
      case 'hotspot':
        return <HotspotView />;
      case 'pppoe':
        return <PppoeView />;
      case 'packages':
        return <PackagesView />;
      case 'vouchers':
        return <VouchersView />;
      case 'payments':
        return <PaymentsView />;
      case 'invoices':
        return <InvoicesView />;
      case 'routers':
        return <RoutersView onNavigate={setActiveTab} />;
      case 'connect_mikrotik':
        return <ConnectMikrotikView onNavigate={setActiveTab} />;
      case 'sites':
        return <SitesBranchesView />;
      case 'upstream':
        return <UpstreamNetworksView />;
      case 'ipam':
        return <IpManagementView />;
      case 'cgnat':
        return <CgnatManagementView />;
      case 'public_ip':
        return <PublicIpServicesView />;
      case 'monitoring':
        return <NetworkMonitoringView />;
      case 'resellers':
        return <ResellersView />;
      case 'tickets':
        return <SupportTicketsView />;
      case 'inventory':
        return <InventoryView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersPermissionsView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'settings':
        return <SystemSettingsView />;
      default:
        return <OverviewView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F8FC]">
      {/* Responsive Collapsible / Drawer Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-5">
          <div className="mx-auto max-w-7xl w-full">{renderActiveView()}</div>

          {/* Clean Telecommunications Footer */}
          <footer className="mt-12 border-t border-[#E2E8F0] py-4 text-center text-xs text-[#64748B]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <div>
                <span className="font-semibold text-[#123B5D]">{settings.companyName || 'ISP Core'}</span> &bull; Carrier-Grade ISP Billing & MikroTik Automation
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Backend Tunnel Gateway Active
                </span>
                <span>Timezone: {settings.timezone || 'UTC'}</span>
                <span>Currency: {settings.currency || 'USD'}</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ISPProvider>
      <AppContent />
    </ISPProvider>
  );
}
