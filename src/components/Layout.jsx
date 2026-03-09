import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Layout({ onLogout }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="app-shell">
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(c => !c)}
                onLogout={onLogout}
            />
            <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
