import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, ListTodo, FileText,
  Settings, ChevronLeft, ChevronRight, LogOut, Calendar
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/employees', label: 'Employees', icon: UserCog },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/mom', label: 'MOM', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, onLogout, mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          {!collapsed && (
            <>
              <span className="brand-icon">⚡</span>
              <span className="brand-text">DayTrack</span>
            </>
          )}
          <button className="collapse-btn hide-mobile" onClick={onToggle}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button className="collapse-btn show-mobile" onClick={onClose}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                if (window.innerWidth <= 768) onClose();
              }}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width var(--transition-base);
        }
        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-6) var(--space-5);
          border-bottom: 1px solid var(--border);
          min-height: 72px;
        }
        .brand-icon {
          font-size: 1.5rem;
        }
        .brand-text {
          font-size: var(--fs-lg);
          font-weight: var(--fw-extra);
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .collapse-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
        }
        .collapse-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }
        .sidebar.collapsed .collapse-btn {
          margin: 0 auto;
        }
        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          text-decoration: none;
          transition: all var(--transition-fast);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          font-family: var(--font);
        }
        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }
        .nav-item.active {
          color: var(--text-accent);
          background: var(--accent-soft);
        }
        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: var(--space-3);
        }
        .sidebar-footer {
          padding: var(--space-4) var(--space-3);
          border-top: 1px solid var(--border);
        }
        .logout-btn {
          color: var(--text-muted);
        }
        .logout-btn:hover {
          color: var(--danger) !important;
          background: var(--danger-bg) !important;
        }
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: var(--sidebar-width) !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
            z-index: 95;
            animation: fadeIn 200ms ease;
          }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
      </aside>
    </>
  );
}
