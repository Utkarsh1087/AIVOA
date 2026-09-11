import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDetailModal } from '../store/complaintSlice';
import { 
  X, 
  CheckSquare, 
  Wrench, 
  Search, 
  AlertTriangle
} from 'lucide-react';

export default function ComplaintDetailModal() {
  const dispatch = useDispatch();
  const { selectedComplaintDetail, isDetailModalOpen } = useSelector((state) => state.complaints);

  if (!isDetailModalOpen || !selectedComplaintDetail) return null;

  const c = selectedComplaintDetail;

  const getRiskBadgeClass = (riskLevel) => {
    const l = String(riskLevel || '').toLowerCase();
    if (l === 'high') return 'badge-risk-high';
    if (l === 'medium') return 'badge-risk-medium';
    return 'badge-risk-low';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div className="qms-card" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Complaint #{c.id} Details
              </h2>
              <span className={getRiskBadgeClass(c.risk_level)}>
                {c.risk_level} RISK
              </span>
              {c.priority && (
                <span style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #bfdbfe'
                }}>
                  Priority: {c.priority}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Registered on {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          <button
            onClick={() => dispatch(closeDetailModal())}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '18px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '0.84rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>CUSTOMER</span>
            <strong style={{ color: '#0f172a' }}>{c.customer_name || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>PRODUCT</span>
            <strong style={{ color: '#0f172a' }}>
              {c.product_name} {c.product_strength ? `(${c.product_strength})` : ''}
            </strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>BATCH / LOT NUMBER</span>
            <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{c.batch_number || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>MADE / EXPIRY DATES</span>
            <span style={{ color: '#334155' }}>{c.mfg_date || 'N/A'} / {c.expiry_date || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>ISSUE TYPE</span>
            <span style={{ color: '#334155' }}>{c.complaint_type || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>ORIGINATING SITE BLOCK</span>
            <span style={{ color: '#334155' }}>{c.originating_site_block || 'Manufacturing'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>IMPACTED NPM</span>
            <span style={{ color: '#334155' }}>{c.impacted_npm || 'Primary Packaging'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>AFFECTED QUANTITY</span>
            <span style={{ color: '#334155' }}>{c.quantity_affected || '0'}</span>
          </div>
        </div>

        {/* Structured Defect Summary */}
        {c.structured_defect_summary && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Structured Defect Summary
            </div>
            <p style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#1e293b',
              lineHeight: '1.45'
            }}>
              {c.structured_defect_summary}
            </p>
          </div>
        )}

        {/* Complaint Description */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Problem Description
          </div>
          <p style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '0.84rem',
            color: '#1e293b',
            lineHeight: '1.5'
          }}>
            {c.complaint_description}
          </p>
        </div>

        {/* Risk Rationale & Impact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Why This Is Important
            </div>
            <p style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.4' }}>
              {c.risk_reason || 'Standard evaluation recorded.'}
            </p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Possible Impact on Other Items
            </div>
            <p style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.4' }}>
              {c.potential_impact || 'No other impact found.'}
            </p>
          </div>
        </div>

        {/* Containment & CAPA Lists */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.78rem', marginBottom: '6px' }}>
              <CheckSquare size={14} /> Immediate Next Steps
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(c.recommendations || []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontWeight: 700, fontSize: '0.78rem', marginBottom: '6px' }}>
              <Wrench size={14} /> Action & Prevention Steps
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(c.capa_recommendations || []).map((cp, i) => (
                <li key={i}>{cp}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
