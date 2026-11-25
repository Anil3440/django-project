import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, MapPin, AlertCircle, Check } from 'lucide-react';

const LAND_TYPES = ['Agricultural', 'Residential', 'Commercial', 'Forest', 'Barren'];

export default function ParcelModal({ isOpen, onClose, onSuccess, initialParcel = null, states = [] }) {
  const isEditing = Boolean(initialParcel);

  const [formData, setFormData] = useState({
    parcel_id: '',
    title: '',
    state_id: '',
    district: '',
    area_acres: '',
    land_type: 'Agricultural',
    owner_name: '',
    market_value: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialParcel) {
      setFormData({
        parcel_id: initialParcel.parcel_id || '',
        title: initialParcel.title || '',
        state_id: initialParcel.state_id || '',
        district: initialParcel.district || '',
        area_acres: initialParcel.area_acres || '',
        land_type: initialParcel.land_type || 'Agricultural',
        owner_name: initialParcel.owner_name || '',
        market_value: initialParcel.market_value || '',
      });
    } else {
      setFormData({
        parcel_id: '',
        title: '',
        state_id: states[0]?.id || '',
        district: '',
        area_acres: '',
        land_type: 'Agricultural',
        owner_name: '',
        market_value: '',
      });
    }
    setError('');
  }, [initialParcel, isOpen, states]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await api.updateParcel(initialParcel.id, formData);
      } else {
        await api.createParcel(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed. Please review the inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Land Parcel' : 'Register New Land Parcel'}
              </h3>
              <p className="text-xs text-slate-500">Government Survey & Registry Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parcel ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                placeholder="e.g. PB-LDH-0001"
                value={formData.parcel_id}
                onChange={(e) => setFormData({ ...formData, parcel_id: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400">Format: XX-XXX-0000</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Title / Location Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ludhiana Prime Farmland"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.state_id}
                onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ludhiana"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Area in Acres <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 45.5"
                value={formData.area_acres}
                onChange={(e) => setFormData({ ...formData, area_acres: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Land Classification <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.land_type}
                onChange={(e) => setFormData({ ...formData, land_type: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {LAND_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Gurpreet Singh"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Market Valuation (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 5000000"
                value={formData.market_value}
                onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Saving...' : isEditing ? 'Update Parcel' : 'Register Parcel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

