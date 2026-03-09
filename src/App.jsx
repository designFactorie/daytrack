import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import MOMList from './pages/MOMList';
import MOMCreate from './pages/MOMCreate';
import MOMView from './pages/MOMView';
import Settings from './pages/Settings';

function ProtectedRoute({ children, isAuth }) {
    return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
    const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('daytrack_auth') === 'true');
    const navigate = typeof window !== 'undefined' ? useNavigate() : null;

    const handleLogin = () => {
        setIsAuth(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('daytrack_auth');
        setIsAuth(false);
    };

    return (
        <Routes>
            <Route path="/login" element={
                isAuth ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            } />

            <Route path="/" element={
                <ProtectedRoute isAuth={isAuth}>
                    <Layout onLogout={handleLogout} />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:id" element={<ClientProfile />} />
                <Route path="employees" element={<Employees />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="mom" element={<MOMList />} />
                <Route path="mom/create" element={<MOMCreate />} />
                <Route path="mom/:id" element={<MOMView />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
