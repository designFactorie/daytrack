import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Archive, Edit2, Eye, DollarSign, Users } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';

const defaultClient = {
    name: '', contactPerson: '', phone: '', email: '',
    contractStart: '', contractEnd: '', revenueValue: '',
    amountCollected: '', status: 'Active',
    goingWell: '', toFix: '', notes: '', archived: 0
};

export default function Clients() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...defaultClient });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const clients = useSupabaseData('clients') || [];

    const filtered = clients.filter(c => {
        if (c.archived && statusFilter !== 'Archived') return false;
        if (statusFilter === 'Archived') return c.archived;
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return c.name.toLowerCase().includes(s) ||
                (c.contactPerson || '').toLowerCase().includes(s) ||
                (c.email || '').toLowerCase().includes(s);
        }
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const openAdd = () => {
        setEditing(null);
        setForm({ ...defaultClient });
        setError('');
        setShowModal(true);
    };

    const openEdit = (client) => {
        setEditing(client.id);
        setForm({ ...client });
        setShowModal(true);
    };

    const save = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        setError('');
        try {
            const data = {
                ...form,
                revenueValue: Number(form.revenueValue) || 0,
                amountCollected: Number(form.amountCollected) || 0,
                contractStart: form.contractStart || null,
                contractEnd: form.contractEnd || null,
                archived: !!form.archived
            };

            if (editing) {
                await supabaseService.clients.update(editing, data);
            } else {
                data.createdAt = new Date().toISOString();
                await supabaseService.clients.add(data);
            }
            setShowModal(false);
        } catch (err) {
            console.error('Error saving client:', err);
            setError(err.message || 'Failed to save client. Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const archive = async (id) => {
        await supabaseService.clients.update(id, { archived: true });
    };

    const formatCurrency = (val) => {
        const n = Number(val) || 0;
        return '₹' + n.toLocaleString('en-IN');
    };

    const getStatusClass = (status) => {
        const map = { 'Active': 'badge-active', 'On Hold': 'badge-onhold', 'Closed': 'badge-closed' };
        return map[status] || 'badge-active';
    };

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1>Clients</h1>
                    <p>Manage your client portfolio</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Add Client
                </button>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {['All', 'Active', 'On Hold', 'Closed', 'Archived'].map(s => (
                    <button
                        key={s}
                        className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Users2 size={48} />
                        <h3>No clients found</h3>
                        <p>Add your first client to get started.</p>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Revenue</th>
                                <th>Collected</th>
                                <th>Outstanding</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(client => {
                                const outstanding = (Number(client.revenueValue) || 0) - (Number(client.amountCollected) || 0);
                                return (
                                    <tr key={client.id}>
                                        <td
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{client.name}</div>
                                            {client.email && <div className="text-sm text-muted">{client.email}</div>}
                                        </td>
                                        <td>
                                            <div>{client.contactPerson || '—'}</div>
                                            {client.phone && <div className="text-sm text-muted">{client.phone}</div>}
                                        </td>
                                        <td><span className={`badge ${getStatusClass(client.status)}`}>{client.status}</span></td>
                                        <td>{formatCurrency(client.revenueValue)}</td>
                                        <td className="text-success">{formatCurrency(client.amountCollected)}</td>
                                        <td className={outstanding > 0 ? 'text-danger' : ''}>{formatCurrency(outstanding)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/clients/${client.id}`)} title="View">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(client)} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                {!client.archived && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => archive(client.id)} title="Archive">
                                                        <Archive size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Client' : 'Add Client'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>✕</button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Client Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Company name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input className="form-input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Primary contact" />
                                </div>
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Contract Start</label>
                                    <DatePicker value={form.contractStart} onChange={val => setForm({ ...form, contractStart: val })} placeholder="Start date" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contract End</label>
                                    <DatePicker value={form.contractEnd} onChange={val => setForm({ ...form, contractEnd: val })} placeholder="End date" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Revenue Value (₹)</label>
                                    <input className="form-input" type="number" value={form.revenueValue} onChange={e => setForm({ ...form, revenueValue: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount Collected (₹)</label>
                                    <input className="form-input" type="number" value={form.amountCollected} onChange={e => setForm({ ...form, amountCollected: e.target.value })} placeholder="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option>Active</option>
                                    <option>On Hold</option>
                                    <option>Closed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Things Going Well</label>
                                <textarea className="form-textarea" value={form.goingWell} onChange={e => setForm({ ...form, goingWell: e.target.value })} placeholder="One item per line" rows={3} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Things to Fix</label>
                                <textarea className="form-textarea" value={form.toFix} onChange={e => setForm({ ...form, toFix: e.target.value })} placeholder="One item per line" rows={3} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="General notes..." rows={3} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" onClick={save} disabled={!form.name.trim() || saving}>
                                {saving ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update' : 'Add') + ' Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Users2(props) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
