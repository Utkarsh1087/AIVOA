import React from 'react';
import { useSelector } from 'react-redux';
import { 
  ShieldAlert, 
  AlertOctagon, 
  CheckSquare, 
  Wrench, 
  Search, 
  AlertTriangle
} from 'lucide-react';

export default function RiskAssessmentPanel() {
  const { aiResponse, editableForm } = useSelector((state) => state.complaints);

  if (!aiResponse || aiResponse.is_relevant === false) return null;

  const risk = aiResponse.risk_assessment || {};
  const recs = aiResponse.recommendations || [];
  const capas = aiResponse.capa_recommendations || [];
  const rootCauses = aiResponse.root_cause_suggestions || [];
  const duplicateCheck = aiResponse.duplicate_check || {};

  const riskLevel = risk.risk_level || editableForm.risk_level || 'Medium';
  const severity = risk.severity || editableForm.severity || 'Major';
  const priority = risk.priority || editableForm.priority || 'Medium';

  const getRiskBadgeClass = (level) => {
    const l = String(level || '').toLowerCase();
    if (l === 'high' || l === 'critical') return 'badge-risk-high';
    if (l === 'medium' || l === 'major') return 'badge-risk-medium';
    return 'badge-risk-low';
  };

  return (
    <div className="qms-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #fecaca'
          }}>
            <ShieldAlert size={20} color="#dc2626" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              AI Assessment & Action Recommendations
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Summary of findings, potential causes, and recommended next steps
            </p>
          </div>
        </div>

        {/* Risk & Priority Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={getRiskBadgeClass(riskLevel)}>
            <AlertOctagon size={13} />
            {riskLevel} Risk
          </span>
          <span style={{
            background: '#f1f5f9',
            color: '#334155',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            Severity: {severity}
          </span>
          <span style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #bfdbfe'
          }}>
            Priority: {priority}
          </span>
        </div>
      </div>

      {/* Duplicate Check Banner */}
      {duplicateCheck.is_duplicate_suspected && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem' }}>
            <strong>Similar Complaint Found:</strong> {duplicateCheck.explanation}
          </div>
        </div>
      )}

      {/* Risk Rationale & Potential Impact */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Why This Is Important
          </div>
          <p style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.5' }}>
            {risk.reason || editableForm.risk_reason || 'Standard evaluation recorded.'}
          </p>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Possible Impact on Other Items
          </div>
          <p style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.5' }}>
            {risk.potential_impact || editableForm.potential_impact || 'No wider impact identified.'}
          </p>
        </div>
      </div>

      {/* Three Column Action Recommendations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Containment Steps */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
            <CheckSquare size={16} />
            Immediate Next Steps
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recs.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Root Causes */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#92400e', fontWeight: 700, fontSize: '0.82rem' }}>
            <Search size={16} />
            Possible Root Causes
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rootCauses.map((rc, i) => (
              <li key={i}>{rc}</li>
            ))}
          </ul>
        </div>

        {/* Action Plan */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#1e40af', fontWeight: 700, fontSize: '0.82rem' }}>
            <Wrench size={16} />
            Action & Prevention Plan
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {capas.map((capa, i) => (
              <li key={i}>{capa}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
