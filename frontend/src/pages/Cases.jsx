import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  FolderOpen,
  Plus,
  ArrowRightCircle,
  Eye,
  IndianRupee,
  Layers,
  Calendar,
  Building,
} from 'lucide-react';

const STATUS_TABS = [
  { id: '', label: 'All Cases' },
  { id: 'PROPOSED', label: 'Proposed' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'COMPENSATION_PAID', label: 'Compensation Paid' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function Cases({ onSelectCase, onOpenNewCase, onAdvanceStatus }) {
  const { isOfficer } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (yearFilter) params.year = yearFilter;

      const res = await api.getCases(params);
      setCases(res.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, yearFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-teal-600" /> Land Acquisition Cases
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            End-to-end digital acquisition tracking for highways, railways, and industrial corridors.
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={onOpenNewCase}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Open New Case
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Year:</span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Cases Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Querying active acquisition cases...</div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No acquisition cases found.</p>
            <p className="text-xs text-slate-400">Try switching to a different status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Case #</th>
                  <th className="px-5 py-3.5">Project Name & Purpose</th>
                  <th className="px-5 py-3.5">Demarcated Parcel</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5">Workflow Status</th>
                  <th className="px-5 py-3.5 text-right">Compensation (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => onSelectCase(c.id)}
                        className="text-teal-700 hover:text-teal-800 hover:underline"
                      >
                        #{c.id}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{c.project_name}</div>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {c.purpose} • Opened: {c.created_at}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{c.parcel_id}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.area_acres} Acres • {c.parcel_title}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                        {c.state_code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {c.compensation_amount ? (
                        <span className="text-emerald-700">
                          ₹{c.compensation_amount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">Pending Approval</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {isOfficer && c.status !== 'COMPLETED' && c.status !== 'REJECTED' && (
                          <button
                            onClick={() => onAdvanceStatus(c)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                            title="Advance Workflow Status"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" /> Advance
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

