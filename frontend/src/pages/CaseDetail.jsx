import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import WorkflowStepper from '../components/WorkflowStepper';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  ArrowRightCircle,
  FolderOpen,
  MapPin,
  Calendar,
  IndianRupee,
  Layers,
  Building,
  User,
  History,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function CaseDetail({ caseId, onBack, onAdvanceStatus, onSelectParcel }) {
  const { isOfficer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getCase(caseId);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchDetail();
    }
  }, [caseId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-500">Retrieving case record & audit chain...</p>
      </div>
    );
  }

  if (error || !data?.case) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-base mb-1">Failed to load Case #{caseId}</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Case not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Cases
        </button>
      </div>
    );
  }

  const { case: currentCase, updates } = data;
  const canAdvance =
    isOfficer && currentCase.status !== 'COMPLETED' && currentCase.status !== 'REJECTED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">CASE #{currentCase.id}</span>
              <StatusBadge status={currentCase.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentCase.project_name}
            </h1>
          </div>
        </div>

        {canAdvance && (
          <button
            onClick={() => onAdvanceStatus(currentCase, fetchDetail)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto hover:scale-105"
          >
            <ArrowRightCircle className="w-4 h-4" /> Advance Workflow Status
          </button>
        )}
      </div>

      {/* Visual Stepper */}
      <WorkflowStepper currentStatus={currentCase.status} />

      {/* Grid: Case & Parcel Info + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Acquisition Metadata Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-teal-600" /> Case Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Purpose / Category
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-teal-600" />
                  {currentCase.purpose}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Compensation Disbursed
                </span>
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {currentCase.compensation_amount
                    ? currentCase.compensation_amount.toLocaleString('en-IN')
                    : 'Pending Official Approval'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Opening Officer
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  {currentCase.opened_by}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Case Initiated On
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  {currentCase.created_at}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Land Parcel */}
          {currentCase.parcel && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Demarcated Land Parcel
                </h3>
                <button
                  onClick={() => onSelectParcel(currentCase.parcel.id)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  View Full Cadastre Profile &rarr;
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {currentCase.parcel.parcel_id}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px]">
                    {currentCase.parcel.land_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Title</span>
                    <span className="font-bold text-slate-800">{currentCase.parcel.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Location</span>
                    <span className="font-bold text-slate-800">
                      {currentCase.parcel.district}, {currentCase.parcel.state_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Area</span>
                    <span className="font-bold text-slate-800">{currentCase.parcel.area_acres} Acres</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Owner</span>
                    <span className="font-bold text-slate-800">{currentCase.parcel.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Valuation</span>
                    <span className="font-bold text-slate-800">
                      ₹{currentCase.parcel.market_value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Audit Trail History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Immutable Audit Trail</h3>
          </div>
          <p className="text-xs text-slate-400">
            Chronological audit log mandated for digital transparency and government verification.
          </p>

          <div className="space-y-4 pt-2">
            {updates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No historical entries found.</p>
            ) : (
              updates.map((upd, idx) => (
                <div key={upd.id} className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-l-transparent">
                  {/* Timeline dot */}
                  <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white absolute -left-[7px] top-1 shadow-sm"></div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {upd.old_status && (
                        <>
                          <StatusBadge status={upd.old_status} size="sm" />
                          <span className="text-slate-300 text-xs">&rarr;</span>
                        </>
                      )}
                      <StatusBadge status={upd.new_status} size="sm" />
                    </div>

                    <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{upd.remarks}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>By: {upd.updated_by}</span>
                      <span>{upd.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

