import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FilePlus, 
  ListFilter, 
  LayoutDashboard
} from 'lucide-react';
import { setActiveView, toggleSidebar } from '../store/complaintSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const { activeView, complaintsList, dashboardStats, isSidebarCollapsed } = useSelector((state) => state.complaints);

  const totalCount = complaintsList.length || (dashboardStats ? dashboardStats.total_complaints : 0);
  const highRiskCount = dashboardStats ? dashboardStats.high_risk_count : 0;

  const navItems = [
    {
      id: 'input',
      label: 'Log a Complaint',
      subtitle: 'Upload or write details',
      icon: FilePlus,
      badge: null
    },
    {
      id: 'logs',
      label: 'All Complaints',
      subtitle: 'View history & status',
      icon: ListFilter,
      badge: totalCount > 0 ? totalCount : null
    },
    {
      id: 'dashboard',
      label: 'Overview & Reports',
      subtitle: 'Summary & progress',
      icon: LayoutDashboard,
      badge: highRiskCount > 0 ? `${highRiskCount}` : null,
      badgeColor: '#fef2f2',
      textColor: '#dc2626'
    }
  ];

  return (
    <aside style={{
      width: isSidebarCollapsed ? '68px' : '260px',
      minWidth: isSidebarCollapsed ? '68px' : '260px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      padding: isSidebarCollapsed ? '20px 8px' : '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      flexShrink: 0,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowY: 'auto',
      overflowX: 'hidden',
      willChange: 'width',
      zIndex: 40
    }}>
      <div>
        {/* Top Header & Collapse Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          marginBottom: '16px',
          padding: isSidebarCollapsed ? '0' : '0 4px',
          height: '24px',
          transition: 'padding 0.3s ease, justify-content 0.3s ease'
        }}>
          <p style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            opacity: isSidebarCollapsed ? 0 : 1,
            maxWidth: isSidebarCollapsed ? 0 : '140px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Navigation
          </p>

          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'color 0.15s ease, background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 640 640" 
              style={{
                width: '15px',
                height: '15px',
                fill: 'currentColor',
                transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <path d="M201.4 297.4C188.9 309.9 188.9 330.2 201.4 342.7L361.4 502.7C373.9 515.2 394.2 515.2 406.7 502.7C419.2 490.2 419.2 469.9 406.7 457.4L269.3 320L406.6 182.6C419.1 170.1 419.1 149.8 406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3L201.3 297.3z"/>
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch(setActiveView(item.id))}
                title={isSidebarCollapsed ? `${item.label} (${item.subtitle})` : undefined}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: isSidebarCollapsed ? '10px 0' : '10px 12px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                  transition: 'background 0.2s ease, border-color 0.2s ease, padding 0.3s ease',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  minWidth: 0,
                  width: '100%'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={18} color={isActive ? '#2563eb' : '#64748b'} />
                  </div>
                  
                  {/* Smooth Sliding Text Container */}
                  <div style={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    maxWidth: isSidebarCollapsed ? 0 : '160px',
                    transform: isSidebarCollapsed ? 'translateX(-8px)' : 'translateX(0)',
                    transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    pointerEvents: isSidebarCollapsed ? 'none' : 'auto'
                  }}>
                    <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.86rem', color: isActive ? '#1e40af' : '#1e293b' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {/* Badge with Smooth Fade */}
                {item.badge && (
                  <span style={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    maxWidth: isSidebarCollapsed ? 0 : '60px',
                    transform: isSidebarCollapsed ? 'scale(0.8)' : 'scale(1)',
                    transition: 'opacity 0.2s ease, max-width 0.3s ease, transform 0.25s ease',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: isSidebarCollapsed ? '0' : '2px 8px',
                    borderRadius: '12px',
                    background: item.badgeColor || '#eff6ff',
                    color: item.textColor || '#2563eb',
                    border: isSidebarCollapsed ? 'none' : '1px solid #e2e8f0',
                    flexShrink: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    pointerEvents: isSidebarCollapsed ? 'none' : 'auto'
                  }}>
                    {item.badge}
                  </span>
                )}

                {/* Notification indicator dot when collapsed */}
                {isSidebarCollapsed && item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '8px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    animation: 'fadeIn 0.2s ease'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
