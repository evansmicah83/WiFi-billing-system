import React, { useState } from 'react';
import {
  Package as PackageIcon,
  Plus,
  Zap,
  Clock,
  ArrowDown,
  ArrowUp,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  Wifi,
  Network,
  Shield,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { InternetPackage, ServiceType } from '../../types';

export const PackagesView: React.FC = () => {
  const { packages, addPackage, updatePackage, deletePackage, settings } = useISP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('pppoe');
  const [priceKes, setPriceKes] = useState(2500);
  const [downloadSpeedMbps, setDownloadSpeedMbps] = useState(15);
  const [uploadSpeedMbps, setUploadSpeedMbps] = useState(10);
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('days');
  const [dataQuotaGb, setDataQuotaGb] = useState(0); // 0 = unlimited
  const [concurrentDevices, setConcurrentDevices] = useState(1);
  const [description, setDescription] = useState('');

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingPackageId) {
      updatePackage(editingPackageId, {
        name,
        serviceType,
        priceKes: Number(priceKes),
        downloadSpeedMbps: Number(downloadSpeedMbps),
        uploadSpeedMbps: Number(uploadSpeedMbps),
        durationValue: Number(durationValue),
        durationUnit,
        dataQuotaGb: Number(dataQuotaGb),
        concurrentDevices: Number(concurrentDevices),
        description,
      });
    } else {
      addPackage({
        tenantId: settings.tenantId,
        name,
        serviceType,
        priceKes: Number(priceKes),
        downloadSpeedMbps: Number(downloadSpeedMbps),
        uploadSpeedMbps: Number(uploadSpeedMbps),
        durationValue: Number(durationValue),
        durationUnit,
        dataQuotaGb: Number(dataQuotaGb),
        concurrentDevices: Number(concurrentDevices),
        gracePeriodHours: 48,
        description: description || `${downloadSpeedMbps}Mbps High Speed Plan`,
        isActive: true,
      });
    }

    setIsModalOpen(false);
    setEditingPackageId(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setServiceType('pppoe');
    setPriceKes(2500);
    setDownloadSpeedMbps(15);
    setUploadSpeedMbps(10);
    setDurationValue(30);
    setDurationUnit('days');
    setDataQuotaGb(0);
    setConcurrentDevices(1);
    setDescription('');
  };

  const handleQuickPreset = (presetName: string, type: ServiceType, down: number, up: number, price: number, durVal: number, durUnit: 'hours' | 'days' | 'months') => {
    addPackage({
      tenantId: settings.tenantId,
      name: presetName,
      serviceType: type,
      priceKes: price,
      downloadSpeedMbps: down,
      uploadSpeedMbps: up,
      durationValue: durVal,
      durationUnit: durUnit,
      dataQuotaGb: 0,
      concurrentDevices: 1,
      gracePeriodHours: 48,
      description: `${down}Mbps Unlimited Speed`,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Internet Packages & Bandwidth Policies
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure upload/download rate-limits (MikroTik Simple Queues & FreeRADIUS Wispr-Bandwidth).
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Package</span>
        </button>
      </div>

      {/* Zero Data State */}
      {packages.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <PackageIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No Internet Packages Created Yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
              Start with empty clean data, or quickly click one of the standard carrier broadband presets below to add recommended tier packages:
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => handleQuickPreset('Bronze 15 Mbps Unlimited', 'pppoe', 15, 10, 25, 30, 'days')}
              className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2 text-xs font-semibold text-[#123B5D] hover:border-[#1976D2] hover:bg-blue-50"
            >
              + Add 15 Mbps PPPoE ({settings.currency} 25)
            </button>
            <button
              onClick={() => handleQuickPreset('Silver 35 Mbps Unlimited', 'pppoe', 35, 20, 45, 30, 'days')}
              className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2 text-xs font-semibold text-[#123B5D] hover:border-[#1976D2] hover:bg-blue-50"
            >
              + Add 35 Mbps PPPoE ({settings.currency} 45)
            </button>
            <button
              onClick={() => handleQuickPreset('24 Hours Hotspot Unlimited', 'hotspot', 10, 5, 3, 24, 'hours')}
              className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2 text-xs font-semibold text-[#123B5D] hover:border-[#1976D2] hover:bg-blue-50"
            >
              + Add 24-Hr Hotspot ({settings.currency} 3)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const isHotspot = pkg.serviceType === 'hotspot';
            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-[#1976D2] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isHotspot ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isHotspot ? <Wifi className="h-3 w-3" /> : <Network className="h-3 w-3" />}
                      {pkg.serviceType.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">Active</span>
                  </div>

                  <h3 className="text-base font-bold text-[#123B5D] mt-2.5">{pkg.name}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{pkg.description}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#123B5D]">{settings.currency} {pkg.priceKes.toLocaleString()}</span>
                    <span className="text-xs text-[#64748B]">
                      / {pkg.durationValue} {pkg.durationUnit}
                    </span>
                  </div>

                  {/* Speeds Badge */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[#F5F8FC] p-2.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <ArrowDown className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block leading-none">Download</span>
                        <span className="font-bold text-[#123B5D]">{pkg.downloadSpeedMbps} Mbps</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUp className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block leading-none">Upload</span>
                        <span className="font-bold text-[#123B5D]">{pkg.uploadSpeedMbps} Mbps</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Quota: {pkg.dataQuotaGb ? `${pkg.dataQuotaGb} GB` : 'Unlimited'}</span>
                    <span>Max Devices: {pkg.concurrentDevices}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#E2E8F0] pt-3">
                  <button
                    onClick={() => {
                      setEditingPackageId(pkg.id);
                      setName(pkg.name);
                      setServiceType(pkg.serviceType);
                      setPriceKes(pkg.priceKes);
                      setDownloadSpeedMbps(pkg.downloadSpeedMbps);
                      setUploadSpeedMbps(pkg.uploadSpeedMbps);
                      setDurationValue(pkg.durationValue);
                      setDurationUnit(pkg.durationUnit);
                      setDataQuotaGb(pkg.dataQuotaGb || 0);
                      setConcurrentDevices(pkg.concurrentDevices);
                      setDescription(pkg.description);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2.5 py-1 text-xs font-semibold text-[#172B4D] hover:bg-slate-50"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-md"
                    title="Delete Package"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Package */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">
                {editingPackageId ? 'Edit Package' : 'Create Internet Package'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gold 25 Mbps Unlimited"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="pppoe">PPPoE (Broadband / Fiber / Wireless)</option>
                    <option value="hotspot">Hotspot Wi-Fi Pass</option>
                    <option value="corporate_dedicated">Corporate Dedicated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    value={priceKes}
                    onChange={(e) => setPriceKes(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold text-[#123B5D] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Download Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    value={downloadSpeedMbps}
                    onChange={(e) => setDownloadSpeedMbps(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Upload Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    value={uploadSpeedMbps}
                    onChange={(e) => setUploadSpeedMbps(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Validity Duration</label>
                  <input
                    type="number"
                    required
                    value={durationValue}
                    onChange={(e) => setDurationValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Duration Unit</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Description / Plan Highlights</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Recommended for 4K streaming & online meetings"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                />
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
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
