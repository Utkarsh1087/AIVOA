import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, setSelectedComplaintDetail } from '../store/complaintSlice';
import { 
  ShieldAlert, 
  Activity, 
  FileText, 
  TrendingUp, 
  Award,
  Eye
} from 'lucide-react';

export default function QmsDashboard() {
  const dispatch = useDispatch();
  const { dashboardStats } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (!dashboardStats) {
    return (
      <div className="qms-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading summary reports...
      </div>
    );
  }

  const s = dashboardStats;
  const total = s.total_complaints || 1;
  const highPct = Math.round((s.high_risk_count / total) * 100);
  const medPct = Math.round((s.medium_risk_count / total) * 100);
  const lowPct = Math.round((s.low_risk_count / total) * 100);

  const getRiskBadgeClass = (riskLevel) => {
    const l = String(riskLevel || '').toLowerCase();
    if (l === 'high') return 'badge-risk-high';
    if (l === 'medium') return 'badge-risk-medium';
    return 'badge-risk-low';
  };

  return (
    <div>
      {/* Overview KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* KPI 1 */}
        <div className="qms-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Complaints
            </span>
            <FileText size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {s.total_complaints}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Total registered cases
          </div>
        </div>

        {/* KPI 2 */}
        <div className="qms-card" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              High Priority Issues
            </span>
            <ShieldAlert size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {s.high_risk_count}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#dc2626', marginTop: '4px' }}>
            {highPct}% of total complaints
          </div>
        </div>

        {/* KPI 3 */}
        <div className="qms-card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Under Review
            </span>
            <Activity size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6d28d9' }}>
            {s.open_count + s.investigating_count}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#6d28d9', marginTop: '4px' }}>
            {s.capa_pending_count} action plans in progress
          </div>
        </div>

        {/* KPI 4 */}
        <div className="qms-card" style={{ padding: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Quality Rating
            </span>
            <Award size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>
            94.2%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '4px' }}>
            Product Quality & Safety Grade
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Risk Distribution Breakdown */}
        <div className="qms-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Severity & Risk Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* High Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>High Risk ({s.high_risk_count})</span>
                <span style={{ color: '#64748b' }}>{highPct}%</span>
              </div>
              <div className="progress-bar-track">
                <div style={{ height: '100%', width: `${highPct}%`, backgroundColor: '#dc2626', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Medium Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#d97706', fontWeight: 600 }}>Medium Risk ({s.medium_risk_count})</span>
                <span style={{ color: '#64748b' }}>{medPct}%</span>
              </div>
              <div className="progress-bar-track">
                <div style={{ height: '100%', width: `${medPct}%`, backgroundColor: '#d97706', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Low Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Low Risk ({s.low_risk_count})</span>
                <span style={{ color: '#64748b' }}>{lowPct}%</span>
              </div>
              <div className="progress-bar-track">
                <div style={{ height: '100%', width: `${lowPct}%`, backgroundColor: '#16a34a', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Investigation Lifecycle */}
        <div className="qms-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Complaint Status Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 600 }}>NEW COMPLAINTS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e40af' }}>{s.open_count}</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600 }}>UNDER REVIEW</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>{s.investigating_count}</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>ACTION PENDING</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{s.capa_pending_count}</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>RESOLVED & CLOSED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14532d' }}>{s.closed_count}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="qms-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Recent Customer Complaints
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                textAlign: 'left',
                color: '#64748b',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '8px 10px' }}>ID</th>
                <th style={{ padding: '8px 10px' }}>Risk</th>
                <th style={{ padding: '8px 10px' }}>Customer / Product</th>
                <th style={{ padding: '8px 10px' }}>Batch</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(s.recent_complaints || []).map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563eb' }}>
                    #{c.id}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={getRiskBadgeClass(c.risk_level)}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.customer_name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{c.product_name}</div>
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: '#334155' }}>
                    {c.batch_number}
                  </td>
                  <td style={{ padding: '10px', color: '#475569', fontSize: '0.8rem' }}>
                    {c.status}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      onClick={() => dispatch(setSelectedComplaintDetail(c))}
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      <Eye size={12} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
