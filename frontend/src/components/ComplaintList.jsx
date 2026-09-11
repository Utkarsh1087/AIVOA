import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComplaintsHistory, setSelectedComplaintDetail } from '../store/complaintSlice';
import { 
  Search, 
  Eye, 
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ComplaintList() {
  const dispatch = useDispatch();
  const { complaintsList, loadingLogs } = useSelector((state) => state.complaints);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchComplaintsHistory({ search: searchTerm, riskLevel: riskFilter, statusFilter }));
  }, [dispatch, searchTerm, riskFilter, statusFilter]);

  const handleRefresh = () => {
    dispatch(fetchComplaintsHistory({ search: searchTerm, riskLevel: riskFilter, statusFilter }));
  };

  const getRiskBadgeClass = (riskLevel) => {
    const l = String(riskLevel || '').toLowerCase();
    if (l === 'high') return 'badge-risk-high';
    if (l === 'medium') return 'badge-risk-medium';
    return 'badge-risk-low';
  };

  const getStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'open') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (s.includes('investigat')) return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    if (s.includes('capa')) return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
  };

  return (
    <div className="qms-card" style={{ padding: '24px' }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '16px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            All Customer Complaints
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            View and search all registered complaints and their status
          </p>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, product..."
              className="qms-input"
              style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="qms-select"
            style={{ width: '120px', fontSize: '0.82rem' }}
          >
            <option value="All">All Risk</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="qms-select"
            style={{ width: '140px', fontSize: '0.82rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Review</option>
            <option value="CAPA Pending">Action Pending</option>
            <option value="Closed">Closed</option>
          </select>

          <button onClick={handleRefresh} className="btn-outline" style={{ padding: '8px 12px' }} title="Refresh list">
            <RefreshCw size={15} className={loadingLogs ? 'pulsing' : ''} />
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      {loadingLogs ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={28} className="pulsing" style={{ margin: '0 auto 10px' }} />
          Loading complaint logs...
        </div>
      ) : complaintsList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No customer complaints found matching criteria.
        </div>
      ) : (
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
                <th style={{ padding: '10px 12px' }}>ID</th>
                <th style={{ padding: '10px 12px' }}>Risk Level</th>
                <th style={{ padding: '10px 12px' }}>Customer & Product</th>
                <th style={{ padding: '10px 12px' }}>Batch #</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaintsList.map((c) => {
                const st = getStatusStyle(c.status);
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563eb' }}>
                      #{c.id}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={getRiskBadgeClass(c.risk_level)}>
                        {c.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {c.product_name} {c.product_strength ? `(${c.product_strength})` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#334155' }}>
                      {c.batch_number}
                    </td>
                    <td style={{ padding: '12px', color: '#475569', fontSize: '0.8rem' }}>
                      {c.complaint_type}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>
                      {c.complaint_date || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => dispatch(setSelectedComplaintDetail(c))}
                        className="btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} />
                        View Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
