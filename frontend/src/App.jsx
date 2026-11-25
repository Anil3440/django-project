import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Parcels from './pages/Parcels';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Login from './pages/Login';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import ParcelModal from './components/ParcelModal';
import CaseModal from './components/CaseModal';
import StatusUpdateModal from './components/StatusUpdateModal';
import ParcelDetailModal from './components/ParcelDetailModal';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  useEffect(() => {
    // If user is already authenticated on initial load, navigate to dashboard
    if (user && activeTab === 'login') {
      setActiveTab('dashboard');
    }
  }, [user]);

  // States list for modals
  const [states, setStates] = useState([]);
  const [parcels, setParcels] = useState([]);

  // Modals
  const [parcelModalOpen, setParcelModalOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);

  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseParcelId, setCaseParcelId] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [caseForStatus, setCaseForStatus] = useState(null);

  const [detailParcelId, setDetailParcelId] = useState(null);

  const loadReferenceData = async () => {
    try {
      const [sRes, pRes] = await Promise.all([api.getStates(), api.getParcels()]);
      setStates(sRes.states || []);
      setParcels(pRes.parcels || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleOpenCaseDetail = (id) => {
    setSelectedCaseId(id);
    setActiveTab('case_detail');
  };

  const handleOpenNewParcel = () => {
    setEditingParcel(null);
    setParcelModalOpen(true);
  };

  const handleEditParcel = (parcel) => {
    setEditingParcel(parcel);
    setParcelModalOpen(true);
  };

  const handleOpenNewCase = (parcelId = null) => {
    setCaseParcelId(parcelId);
    setCaseModalOpen(true);
  };

  const handleAdvanceStatus = (c) => {
    setCaseForStatus(c);
    setStatusModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {!user && activeTab !== 'login' && (
        <div className="bg-emerald-800 text-white py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <span>Viewing in Public Citizen Mode (Read-Only).</span>
          <button
            onClick={() => setActiveTab('login')}
            className="underline text-emerald-200 hover:text-white font-bold"
          >
            Sign in as Land Officer or Admin &rarr;
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={setActiveTab}
            onOpenNewParcel={handleOpenNewParcel}
            onOpenNewCase={() => handleOpenNewCase()}
          />
        )}

        {activeTab === 'parcels' && (
          <Parcels
            onSelectParcel={(id) => setDetailParcelId(id)}
            onOpenNewParcel={handleOpenNewParcel}
            onEditParcel={handleEditParcel}
          />
        )}

        {activeTab === 'cases' && (
          <Cases
            onSelectCase={handleOpenCaseDetail}
            onOpenNewCase={() => handleOpenNewCase()}
            onAdvanceStatus={handleAdvanceStatus}
          />
        )}

        {activeTab === 'case_detail' && (
          <CaseDetail
            caseId={selectedCaseId}
            onBack={() => setActiveTab('cases')}
            onAdvanceStatus={handleAdvanceStatus}
            onSelectParcel={(id) => setDetailParcelId(id)}
          />
        )}

        {activeTab === 'login' && (
          <Login onSuccess={() => setActiveTab('dashboard')} />
        )}

        {activeTab === 'admin' && <AdminPanel />}

        {activeTab === 'about' && <About />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>BhoomiTrack &copy; {new Date().getFullYear()} • Real-Time National Land Acquisition & Management System</p>
      </footer>

      {/* Global Modals */}
      <ParcelModal
        isOpen={parcelModalOpen}
        onClose={() => setParcelModalOpen(false)}
        onSuccess={loadReferenceData}
        initialParcel={editingParcel}
        states={states}
      />

      <CaseModal
        isOpen={caseModalOpen}
        onClose={() => setCaseModalOpen(false)}
        onSuccess={loadReferenceData}
        initialParcelId={caseParcelId}
        parcels={parcels}
      />

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={loadReferenceData}
        currentCase={caseForStatus}
      />

      <ParcelDetailModal
        isOpen={Boolean(detailParcelId)}
        onClose={() => setDetailParcelId(null)}
        parcelId={detailParcelId}
        onOpenCase={(pid) => handleOpenNewCase(pid)}
        onEditParcel={handleEditParcel}
      />
    </div>
  );
}

