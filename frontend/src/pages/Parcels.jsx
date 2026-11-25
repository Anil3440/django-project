import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Tag,
  IndianRupee,
  Layers,
} from 'lucide-react';

const LAND_TYPES = ['All Types', 'Agricultural', 'Residential', 'Commercial', 'Forest', 'Barren'];

export default function Parcels({ onSelectParcel, onOpenNewParcel, onEditParcel }) {
  const { isOfficer, isAdmin } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  const fetchStates = async () => {
    try {
      const res = await api.getStates();
      setStates(res.states || []);
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedState) params.state = selectedState;
      if (selectedType && selectedType !== 'All Types') params.land_type = selectedType;

      const res = await api.getParcels(params);
      setParcels(res.parcels || []);
    } catch (err) {
      console.error('Failed to load parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParcels();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, selectedType]);

  const handleDelete = async (id, parcel_id) => {
    if (!window.confirm(`Are you sure you want to permanently delete parcel ${parcel_id}?`)) {
      return;
    }
    try {
      await api.deleteParcel(id);
      fetchParcels();
    } catch (err) {
      alert(err.message || 'Failed to delete parcel.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" /> Land Parcel Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            National cadastre database of demarcated agricultural, commercial and infrastructure plots.
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={onOpenNewParcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Register Parcel
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Parcel ID (e.g. PB-LDH-0001), Title, Owner, District..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* State Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States</option>
              {states.map((st) => (
                <option key={st.id} value={st.code}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          {/* Land Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {LAND_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applied Filter Chips */}
        {(searchQuery || selectedState || selectedType !== 'All Types') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Filters:</span>
            {selectedState && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                State: {selectedState}
              </span>
            )}
            {selectedType !== 'All Types' && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Type: {selectedType}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedState('');
                setSelectedType('All Types');
              }}
              className="text-rose-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Parcels Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Querying cadastre records...</div>
        ) : parcels.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No parcels match the search criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or state selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Parcel Identifier</th>
                  <th className="px-5 py-3.5">Title & District</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5">Classification</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5 text-right">Valuation (₹)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => onSelectParcel(p.id)}
                        className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5"
                      >
                        {p.parcel_id}
                        {p.active_case && (
                          <span
                            className="w-2 h-2 rounded-full bg-indigo-500"
                            title="Active Acquisition Case Open"
                          ></span>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{p.title}</div>
                      <div className="text-[11px] text-slate-400">{p.district}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                        {p.state_code}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-800">
                      {p.area_acres} <span className="text-[10px] text-slate-400 font-normal">Acres</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        {p.land_type}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">{p.owner_name}</td>

                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      ₹{p.market_value.toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => onSelectParcel(p.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isOfficer && (
                          <button
                            onClick={() => onEditParcel(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Parcel"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p.id, p.parcel_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Parcel (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
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

