import React, { useState } from 'react';
import { UserCog, Plus, ShieldCheck, CheckCircle2, User as UserIcon, X } from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { UserRole } from '../../types';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'suspended';
}

export const UsersPermissionsView: React.FC = () => {
  const { currentUser } = useISP();
  const [users, setUsers] = useState<StaffUser[]>([
    {
      id: 'usr_admin',
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      role: 'super_admin',
      status: 'active',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('254');
  const [role, setRole] = useState<UserRole>('network_engineer');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setUsers((prev) => [
      ...prev,
      {
        id: `usr_${Date.now()}`,
        name,
        email,
        phone,
        role,
        status: 'active',
      },
    ]);

    setIsModalOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Staff Users & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Granular permissions for ISP Owners, Network Engineers, Field Techs, Cashiers, and Support Agents.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
        <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
          <thead className="bg-[#F5F8FC] text-[#64748B]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Staff Member</th>
              <th className="px-4 py-3 text-left font-semibold">Contact Email & Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Assigned Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Access Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F5F8FC]/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-bold text-[#123B5D]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#123B5D] text-white">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <span>{u.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-[#172B4D]">{u.email}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">{u.phone}</div>
                </td>

                <td className="px-4 py-3">
                  <span className="rounded bg-blue-50 px-2.5 py-0.5 font-bold uppercase text-[10px] text-[#1976D2]">
                    {u.role.replace('_', ' ')}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    ACTIVE
                  </span>
                </td>

                <td className="px-4 py-3 text-right font-mono text-[10px] text-[#64748B]">
                  {u.role === 'super_admin' ? 'FULL ROOT ACCESS' : 'ROLE CONFINED'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix Reference */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#1976D2]" /> Role Permissions Matrix (Multi-Tenant Isolation)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-[#F5F8FC] p-3 space-y-1">
            <span className="font-bold text-[#123B5D]">1. Super Admin / Owner</span>
            <p className="text-[11px] text-[#64748B]">
              Full control: tenant settings, Daraja M-Pesa API keys, RADIUS server, router root enrollments.
            </p>
          </div>
          <div className="rounded-lg bg-[#F5F8FC] p-3 space-y-1">
            <span className="font-bold text-[#123B5D]">2. Network Engineer</span>
            <p className="text-[11px] text-[#64748B]">
              MikroTik provisioning, WireGuard CGNAT tunnels, IP pools, bandwidth queues, RADIUS CoA.
            </p>
          </div>
          <div className="rounded-lg bg-[#F5F8FC] p-3 space-y-1">
            <span className="font-bold text-[#123B5D]">3. Field Technician</span>
            <p className="text-[11px] text-[#64748B]">
              Subscriber registration, ONT/ONU serial assignment, optical signal testing, support tickets.
            </p>
          </div>
          <div className="rounded-lg bg-[#F5F8FC] p-3 space-y-1">
            <span className="font-bold text-[#123B5D]">4. Cashier / Accountant</span>
            <p className="text-[11px] text-[#64748B]">
              M-Pesa payment validation, voucher batch printing, customer invoices, revenue reports.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Add Staff Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Kamau"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamau@smartlinknet.co.ke"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                >
                  <option value="network_engineer">Network Engineer</option>
                  <option value="field_tech">Field Technician</option>
                  <option value="cashier">Cashier / Accountant</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="isp_admin">ISP Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D]"
                >
                  Save Staff User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
