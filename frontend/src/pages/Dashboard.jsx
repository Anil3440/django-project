import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  MapPin,
  FolderOpen,
  IndianRupee,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  Building2,
} from 'lucide-react';

export default function Dashboard({ onNavigate, onOpenNewParcel, onOpenNewCase }) {
  const { user, isOfficer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [pollingActive, setPollingActive] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // 10-second polling interval for real-time decision support
    const interval = setInterval(() => {
      if (pollingActive) {
        fetchDashboard();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pollingActive]);

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-500">Connecting to National Land Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome & Live Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            LIVE DECISION SUPPORT • REFRESHING EVERY 10S
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            National Land Acquisition Monitor
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Real-time digital oversight for land parcel mapping, legal acquisition workflow transitions, compensation disbursement, and audit compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {isOfficer && (
            <>
              <button
                onClick={onOpenNewParcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Add Parcel
              </button>
              <button
                onClick={onOpenNewCase}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> Open Case
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Parcels</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {data?.total_parcels ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Surveyed
            </span>
            in 6 national states
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-b-2xl"></div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Area (Acres)</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {data?.total_area ? data.total_area.toLocaleString('en-IN') : 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            Across agricultural, barren & forest zones
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-b-2xl"></div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Legal Cases</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">
            {data?.active_cases ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            Under active review & processing
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-b-2xl"></div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Compensation</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{data?.total_comp ? Math.round(data.total_comp).toLocaleString('en-IN') : 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            Approved & disbursed to landholders
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-b-2xl"></div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases by Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cases by Legal Status</h3>
              <p className="text-xs text-slate-400">Current state machine distribution</p>
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {data?.cases_by_status?.map((item) => {
              const total = data.total_parcels || 1;
              const pct = Math.min(100, Math.round((item.count / total) * 100));
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.count} cases</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'COMPLETED'
                          ? 'bg-teal-500'
                          : item.status === 'APPROVED'
                          ? 'bg-emerald-500'
                          : item.status === 'COMPENSATION_PAID'
                          ? 'bg-amber-500'
                          : item.status === 'UNDER_REVIEW'
                          ? 'bg-blue-500'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(8, item.count * 15)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top States by Acquired Area */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Top States by Acquisition</h3>
              <p className="text-xs text-slate-400">Approved & completed acreage</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          {data?.top_states?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No states with approved acquisitions yet.</div>
          ) : (
            <div className="space-y-3">
              {data?.top_states?.map((st, i) => (
                <div
                  key={st.code}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-semibold">Code: {st.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-700">
                      {st.acquired_area.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Acres</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Live Activity Feed</h3>
                <p className="text-xs text-slate-400">Last updated: {lastUpdated}</p>
              </div>
            </div>
            <button
              onClick={fetchDashboard}
              title="Refresh now"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {data?.latest_updates?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No recent updates logged yet.</div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {data?.latest_updates?.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-100 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[160px]">{u.project_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{u.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {u.old_status ? (
                      <>
                        <StatusBadge status={u.old_status} size="sm" />
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      </>
                    ) : null}
                    <StatusBadge status={u.new_status} size="sm" />
                  </div>

                  {u.remarks && (
                    <p className="text-[11px] text-slate-600 italic bg-white/80 p-1.5 rounded border border-slate-200/50">
                      "{u.remarks}"
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 font-semibold text-right">
                    By Officer: {u.updated_by}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

