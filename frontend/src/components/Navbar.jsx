import React from 'react';
import { useDispatch } from 'react-redux';
import { 
  ShieldCheck, 
  PlusCircle
} from 'lucide-react';
import { setActiveView, resetFormAndAI } from '../store/complaintSlice';

export default function Navbar() {
  const dispatch = useDispatch();

  const handleNewComplaint = () => {
    dispatch(resetFormAndAI());
    dispatch(setActiveView('input'));
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
        }}>
          <ShieldCheck size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              AIVOA
            </span>
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #bfdbfe'
            }}>
              AI Complaint Assistant
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '-1px' }}>
            Smart Customer Complaint & Issue Resolution System
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div>
        <button 
          onClick={handleNewComplaint}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <PlusCircle size={16} />
          Log New Complaint
        </button>
      </div>
    </header>
  );
}
