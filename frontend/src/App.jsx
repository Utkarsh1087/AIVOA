import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ComplaintInputArea from './components/ComplaintInputArea';
import ComplaintForm from './components/ComplaintForm';
import RiskAssessmentPanel from './components/RiskAssessmentPanel';
import ComplaintList from './components/ComplaintList';
import ComplaintDetailModal from './components/ComplaintDetailModal';
import QmsDashboard from './components/QmsDashboard';
import { fetchComplaintsHistory, fetchDashboardStats } from './store/complaintSlice';

export default function App() {
  const dispatch = useDispatch();
  const { activeView, aiResponse } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchComplaintsHistory({}));
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Header */}
      <Navbar />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Main Workspace Area */}
        <main style={{ 
          flex: 1, 
          padding: '24px 32px', 
          overflowY: activeView === 'input' ? 'hidden' : 'auto', 
          maxWidth: '1600px', 
          margin: '0 auto', 
          width: '100%', 
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeView === 'input' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
              gap: '24px',
              height: '100%',
              minHeight: 0,
              alignItems: 'stretch'
            }}>
              {/* Left Column: Log Customer Complaint Form & Risk Assessment - EXCLUSIVELY SCROLLABLE */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                overflowY: 'auto', 
                paddingRight: '6px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px',
                minHeight: 0
              }}>
                <ComplaintForm />

                {/* Full ICH Q9 Risk Assessment & CAPA Recommendations breakdown (when analyzed) */}
                {aiResponse && (
                  <div style={{ animation: 'fadeIn 0.3s ease-in-out', paddingBottom: '16px' }}>
                    <RiskAssessmentPanel />
                  </div>
                )}
              </div>

              {/* Right Column: AI Complaint Intake Assistant - FIXED IN PLACE */}
              <div style={{ 
                width: '100%', 
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <ComplaintInputArea />
              </div>
            </div>
          )}

          {activeView === 'logs' && <ComplaintList />}

          {activeView === 'dashboard' && <QmsDashboard />}
        </main>
      </div>

      {/* Modals */}
      <ComplaintDetailModal />
    </div>
  );
}
