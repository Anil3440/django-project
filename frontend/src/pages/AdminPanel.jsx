import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { RoleBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, targetRole) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await api.setUserRole(userId, targetRole);
      setActionMsg(res.message);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change user role.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs font-semibold text-purple-300 mb-2">
            <Shield className="w-3.5 h-3.5" /> SUPERUSER CONSOLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Administration & RBAC Manager
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Promote registered citizens to Land Officers, review user activity, and access Django's native admin panel.
          </p>
        </div>

        <a
          href="http://127.0.0.1:8000/admin/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all self-start md:self-auto"
        >
          Open Django Admin <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">User Directory & Role Delegation</h3>
              <p className="text-xs text-slate-400">Manage permissions across all registered government accounts</p>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Querying user registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Current Role</th>
                  <th className="px-5 py-3">Registered At</th>
                  <th className="px-5 py-3 text-right">Role Delegation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      {u.username}
                      {u.is_superuser && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          Superuser
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">{u.email || '—'}</td>

                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-5 py-4 text-slate-400 font-medium">{u.date_joined}</td>

                    <td className="px-5 py-4 text-right">
                      {u.is_superuser ? (
                        <span className="text-slate-400 text-[11px] italic">Root Administrator</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'Officer' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'Officer')}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Promote to Officer
                            </button>
                          )}
                          {u.role === 'Officer' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'Viewer')}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Demote to Viewer
                            </button>
                          )}
                        </div>
                      )}
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

