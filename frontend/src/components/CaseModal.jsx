import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, FolderPlus, AlertCircle, Check } from 'lucide-react';

const PURPOSES = ['Highway', 'Railway', 'Solar Park', 'Industrial', 'Public Building'];

export default function CaseModal({ isOpen, onClose, onSuccess, initialParcelId = null, parcels = [] }) {
  const [formData, setFormData] = useState({
    parcel_id: '',
    project_name: '',
    purpose: 'Highway',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      parcel_id: initialParcelId || (parcels[0]?.id || ''),
      project_name: '',
      purpose: 'Highway',
    });
    setError('');
  }, [initialParcelId, isOpen, parcels]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.createCase(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to open case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Open Acquisition Case</h3>
              <p className="text-xs text-slate-500">Initiate digital land acquisition workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Land Parcel <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.parcel_id}
              onChange={(e) => setFormData({ ...formData, parcel_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Parcel --</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcel_id} — {p.title} ({p.area_acres} acres, {p.district})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NH-44 Expressway Widening"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Purpose / Sector <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PURPOSES.map((pur) => (
                <option key={pur} value={pur}>
                  {pur}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Rule:</strong> The case will initiate in the <code>PROPOSED</code> status and automatically log an opening entry to the immutable audit trail.
          </div>

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
              {submitting ? 'Creating...' : 'Open Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

