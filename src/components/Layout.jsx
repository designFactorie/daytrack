import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Layout({ onLogout }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="app-shell">
            <div className="mobile-topbar show-mobile">
                <button className="hamburger-btn" onClick={() => setMobileOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="mobile-brand">
                    <span>⚡</span>
                    <span>DayTrack</span>
                </div>
            </div>

            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(c => !c)}
                onLogout={onLogout}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />
            <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
