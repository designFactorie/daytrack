import { useNavigate } from 'react-router-dom';
import {
    Users, ListTodo, AlertTriangle, FileText,
    DollarSign, UserCog, TrendingUp, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    const clients = (useSupabaseData('clients') || []).filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name));
    const activeClients = clients.filter(c => c.status === 'Active');
    const employees = useSupabaseData('employees') || [];
    const tasks = useSupabaseData('tasks') || [];
    const todayMoms = (useSupabaseData('moms') || []).filter(m => m.meetingDate === today);

    const tasksDueToday = tasks.filter(t => t.dueDate === today && t.status !== 'Completed');
    const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== 'Completed');

    const totalRevenue = clients.reduce((sum, c) => sum + (Number(c.revenueValue) || 0), 0);
    const totalCollected = clients.reduce((sum, c) => sum + (Number(c.amountCollected) || 0), 0);
    const outstanding = totalRevenue - totalCollected;

    // Employee task load data
    const employeeLoad = employees.map(emp => ({
        name: emp.name.split(' ')[0],
        tasks: tasks.filter(t => t.employeeId === emp.id && t.status !== 'Completed').length,
        completed: tasks.filter(t => t.employeeId === emp.id && t.status === 'Completed').length,
    })).filter(e => e.tasks > 0 || e.completed > 0);

    // Revenue breakdown pie
    const revenueData = [
        { name: 'Collected', value: totalCollected },
        { name: 'Outstanding', value: outstanding },
    ].filter(d => d.value > 0);

    const formatCurrency = (val) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val}`;
    };

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's your overview for today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid-4 mb-6">
                <div className="stat-card" onClick={() => navigate('/clients')}>
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div className="stat-value">{activeClients.length}</div>
                    <div className="stat-label">Active Clients</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/tasks')}>
                    <div className="stat-icon orange"><Clock size={22} /></div>
                    <div className="stat-value">{tasksDueToday.length}</div>
                    <div className="stat-label">Tasks Due Today</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/tasks')}>
                    <div className="stat-icon red"><AlertTriangle size={22} /></div>
                    <div className="stat-value">{overdueTasks.length}</div>
                    <div className="stat-label">Overdue Tasks</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/mom')}>
                    <div className="stat-icon green"><FileText size={22} /></div>
                    <div className="stat-value">{todayMoms.length}</div>
                    <div className="stat-label">MOMs Today</div>
                </div>
            </div>

            {/* Revenue Row */}
            <div className="grid-4 mb-6">
                <div className="stat-card" onClick={() => navigate('/clients')}>
                    <div className="stat-icon purple"><TrendingUp size={22} /></div>
                    <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/clients')}>
                    <div className="stat-icon green"><DollarSign size={22} /></div>
                    <div className="stat-value">{formatCurrency(totalCollected)}</div>
                    <div className="stat-label">Amount Collected</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/clients')}>
                    <div className="stat-icon red"><DollarSign size={22} /></div>
                    <div className="stat-value">{formatCurrency(outstanding)}</div>
                    <div className="stat-label">Outstanding</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/employees')}>
                    <div className="stat-icon blue"><UserCog size={22} /></div>
                    <div className="stat-value">{employees.filter(e => e.status === 'Active').length}</div>
                    <div className="stat-label">Active Employees</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid-2">
                {employeeLoad.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Employee Task Load</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={employeeLoad} barGap={4}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1f35', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                />
                                <Bar dataKey="tasks" name="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Done" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {revenueData.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Revenue Breakdown</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {revenueData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v) => formatCurrency(v)}
                                    contentStyle={{ background: '#1a1f35', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {employeeLoad.length === 0 && revenueData.length === 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state">
                            <TrendingUp size={48} />
                            <h3>No data yet</h3>
                            <p>Start by adding clients and employees to see your dashboard come to life.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
