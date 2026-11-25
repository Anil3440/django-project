import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { X, MapPin, Tag, User, Calendar, IndianRupee, Layers, Plus, Edit2, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ParcelDetailModal({ isOpen, onClose, parcelId, onOpenCase, onEditParcel }) {
  const { isOfficer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && parcelId) {
      setLoading(true);
      api.getParcel(parcelId)
        .then((res) => {
          setData(res);
          setError('');
        })
        .catch((err) => {
          setError(err.message || 'Failed to load parcel details.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, parcelId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ID
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {data?.parcel?.parcel_id || 'Parcel Detail'}
              </h3>
              <p className="text-xs text-slate-500">{data?.parcel?.title || 'Loading survey metadata...'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading details...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : data?.parcel ? (
            <>
              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">State & District</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {data.parcel.district}, {data.parcel.state_code}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Area Measured</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    {data.parcel.area_acres} Acres
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Land Type</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    {data.parcel.land_type}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Owner</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    {data.parcel.owner_name}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Market Valuation</span>
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-0.5 mt-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {data.parcel.market_value.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Recorded Date</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {data.parcel.created_at}
                  </span>
                </div>
              </div>

              {/* Associated acquisition cases */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Associated Acquisition Cases ({data.cases.length})
                  </h4>
                  {isOfficer && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCase(data.parcel.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> New Case
                    </button>
                  )}
                </div>

                {data.cases.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No acquisition cases have been opened for this parcel yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.cases.map((c) => (
                      <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{c.project_name}</div>
                          <div className="text-xs text-slate-400">
                            Sector: {c.purpose} • Opened: {c.created_at}
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={c.status} />
                          {c.compensation_amount && (
                            <div className="text-xs font-bold text-emerald-700 mt-1">
                              ₹{c.compensation_amount.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
          >
            Close
          </button>
          {isOfficer && data?.parcel && (
            <button
              onClick={() => {
                onClose();
                onEditParcel(data.parcel);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Parcel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

