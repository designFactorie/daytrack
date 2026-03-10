import { useState } from 'react';
import { Plus, Search, Edit2, UserCog } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';

const defaultEmployee = {
    name: '', role: '', phone: '', email: '', status: 'Active'
};

export default function Employees() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...defaultEmployee });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const employees = useSupabaseData('employees') || [];
    const tasks = useSupabaseData('tasks') || [];

    const filtered = employees.filter(e => {
        if (statusFilter !== 'All' && e.status !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return e.name.toLowerCase().includes(s) ||
                (e.role || '').toLowerCase().includes(s) ||
                (e.email || '').toLowerCase().includes(s);
        }
        return true;
    });

    const getTaskCount = (empId) => tasks.filter(t => t.employeeId === empId && t.status !== 'Completed').length;

    const openAdd = () => {
        setEditing(null);
        setForm({ ...defaultEmployee });
        setError('');
        setShowModal(true);
    };

    const openEdit = (emp) => {
        setEditing(emp.id);
        setForm({ ...emp });
        setShowModal(true);
    };

    const save = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        setError('');
        try {
            if (editing) {
                await supabaseService.employees.update(editing, form);
            } else {
                await supabaseService.employees.add({ ...form, createdAt: new Date().toISOString() });
            }
            setShowModal(false);
        } catch (err) {
            console.error('Error saving employee:', err);
            setError('Failed to save employee. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1>Employees</h1>
                    <p>Manage your team</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} />
                    <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['All', 'Active', 'Inactive'].map(s => (
                    <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
                        {s}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <UserCog size={48} />
                        <h3>No employees found</h3>
                        <p>Add your first team member to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="grid-3">
                    {filtered.map(emp => (
                        <div key={emp.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEdit(emp)}>
                            <div className="flex items-center gap-3 mb-4">
                                <div style={{
                                    width: 44, height: 44, borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 'var(--fs-md)', color: 'white'
                                }}>
                                    {emp.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                    <div className="text-sm text-muted">{emp.role || 'No role set'}</div>
                                </div>
                                <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                    {emp.status}
                                </span>
                            </div>
                            <div className="flex gap-4 text-sm text-muted">
                                {emp.email && <span>📧 {emp.email}</span>}
                                {emp.phone && <span>📞 {emp.phone}</span>}
                            </div>
                            <div className="mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                                <span className="text-sm" style={{ color: getTaskCount(emp.id) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                    📋 {getTaskCount(emp.id)} active tasks
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>✕</button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Developer, Designer, PM..." />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" onClick={save} disabled={!form.name.trim() || saving}>
                                {saving ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update' : 'Add') + ' Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
