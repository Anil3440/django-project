import React from 'react';
import { Check, Clock, XCircle, ChevronRight } from 'lucide-react';

const STEPS = [
  { key: 'PROPOSED', label: '1. Proposed' },
  { key: 'UNDER_REVIEW', label: '2. Under Review' },
  { key: 'APPROVED', label: '3. Approved' },
  { key: 'COMPENSATION_PAID', label: '4. Compensation Paid' },
  { key: 'COMPLETED', label: '5. Completed' },
];

export default function WorkflowStepper({ currentStatus }) {
  const isRejected = currentStatus === 'REJECTED';
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  if (isRejected) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-rose-900">Case Rejected</h4>
            <p className="text-xs text-rose-600">
              This acquisition case was rejected and terminated during the legal review.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-full uppercase tracking-wider">
          Terminated
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Acquisition Lifecycle Pipeline
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isPending = currentIndex < idx;

          return (
            <div
              key={step.key}
              className={`relative flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm ring-1 ring-emerald-300'
                  : isCompleted
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-white border-dashed border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white'
                    : isCompleted
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-3 h-3 animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

