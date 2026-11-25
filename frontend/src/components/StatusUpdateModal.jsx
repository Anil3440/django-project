import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, ArrowRightCircle, AlertCircle, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';

const STATUS_LABELS = {
  PROPOSED: 'Proposed',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  COMPENSATION_PAID: 'Compensation Paid',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

export default function StatusUpdateModal({ isOpen, onClose, onSuccess, currentCase }) {
  const [newStatus, setNewStatus] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validNext = currentCase?.valid_next_statuses || [];

  useEffect(() => {
    if (validNext.length > 0) {
      setNewStatus(validNext[0]);
    } else {
      setNewStatus('');
    }
    setCompensationAmount(currentCase?.compensation_amount || '');
    setRemarks('');
    setError('');
  }, [currentCase, isOpen]);

  if (!isOpen || !currentCase) return null;

  const requiresCompensation = newStatus === 'APPROVED' || newStatus === 'COMPENSATION_PAID';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newStatus) {
      setError('Please select a valid next status.');
      return;
    }

    if (newStatus === 'APPROVED' && (!compensationAmount || Number(compensationAmount) <= 0)) {
      setError('Compensation amount is mandatory when approving an acquisition.');
      return;
    }

    if (!remarks.trim()) {
      setError('Audit remarks are required for government compliance.');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateCaseStatus(currentCase.id, {
        new_status: newStatus,
        compensation_amount: compensationAmount ? Number(compensationAmount) : null,
        remarks: remarks.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Status transition failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ArrowRightCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Advance Workflow Status</h3>
              <p className="text-xs text-slate-500">Official Decision & Audit Entry</p>
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

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Project</span>
              <span className="text-sm font-bold text-slate-800">{currentCase.project_name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block mb-0.5">Current Status</span>
              <StatusBadge status={currentCase.status} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Permitted Next Status <span className="text-rose-500">*</span>
            </label>
            {validNext.length === 0 ? (
              <div className="p-3 bg-slate-100 text-slate-500 rounded-lg text-xs">
                No further forward transitions allowed from <strong>{currentCase.status}</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {validNext.map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setNewStatus(st)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                      newStatus === st
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span>{STATUS_LABELS[st] || st}</span>
                    <StatusBadge status={st} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {requiresCompensation && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Compensation Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 7500000"
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                Official approved compensation disbursed to the land owner.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Remarks & Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide reason, inspection notes, or order number..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              disabled={submitting || validNext.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Applying...' : 'Confirm Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

