import React from 'react';
import { Layers, Shield, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
          <Cpu className="w-3.5 h-3.5" /> Full Stack Architecture
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          BhoomiTrack System Architecture
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          BhoomiTrack provides end-to-end digital governance for government land acquisition. The system couples a robust <strong>Django 5.x</strong> backend handling state machine enforcement and audit logging with an attractive <strong>React + Tailwind CSS</strong> Single Page Application (SPA).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Layers className="w-4 h-4" /> Frontend (React SPA)
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Modern React 18 with Vite build tooling</li>
            <li>Tailwind CSS styling with responsive grid layouts</li>
            <li>Lucide React icons & visual workflow steppers</li>
            <li>Real-time 10-second AJAX polling for decision support</li>
            <li>Role-aware UI (Admin, Officer, Viewer)</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
            <Database className="w-4 h-4" /> Backend & Database (Django + SQLite)
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Django 5.x with SQLite relational database</li>
            <li>Session & cookie state management</li>
            <li>Role-Based Access Control (RBAC) with Django Groups</li>
            <li>Immutable audit logging via <code>CaseUpdate</code></li>
            <li>CORS middleware & clean JSON endpoints</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

