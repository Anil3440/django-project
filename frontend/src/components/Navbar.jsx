import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './StatusBadge';
import {
  LayoutDashboard,
  MapPin,
  FolderOpen,
  Info,
  LogOut,
  User,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isOfficer, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'parcels', label: 'Land Parcels', icon: MapPin },
    { id: 'cases', label: 'Acquisitions', icon: FolderOpen },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Console', icon: ShieldCheck }] : []),
    { id: 'about', label: 'Architecture', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">🌾</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                  Bhoomi<span className="text-emerald-600">Track</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider block -mt-1 uppercase">
                  National Land Portal
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right User & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 py-1 pr-1 bg-slate-50 border border-slate-200 rounded-full">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      {user.username}
                    </span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {isAdmin && (
                  <a
                    href="http://127.0.0.1:8000/admin/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Open Django Admin"
                  >
                    Admin <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={async () => {
                    await logout();
                    setActiveTab('login');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-slate-400" />
                {item.label}
              </button>
            );
          })}
          {user ? (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{user.username}</p>
                <RoleBadge role={user.role} />
              </div>
              <button
                onClick={async () => {
                  await logout();
                  setActiveTab('login');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

