import { useState, useRef, useEffect } from 'react';
import { Plus, Search, ListTodo, AlertTriangle, Check, ChevronDown, X, CircleCheck } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';

const defaultTask = {
    title: '', description: '', clientIds: [], clientId: '', employeeId: '',
    priority: 'Medium', status: 'Pending', dueDate: '', completedDate: ''
};

export default function Tasks() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [clientFilter, setClientFilter] = useState('All');
    const [employeeFilter, setEmployeeFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...defaultTask });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const tasks = useSupabaseData('tasks') || [];
    const clients = (useSupabaseData('clients') || []).filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name));
    const employees = useSupabaseData('employees') || [];

    const today = new Date().toISOString().split('T')[0];

    const filtered = tasks.filter(t => {
        if (statusFilter !== 'All' && statusFilter === 'Overdue') {
            if (!(t.dueDate < today && t.status !== 'Completed')) return false;
        } else if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (clientFilter !== 'All' && t.clientId !== Number(clientFilter)) return false;
        if (employeeFilter !== 'All' && t.employeeId !== Number(employeeFilter)) return false;
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return t.title.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s);
        }
        return true;
    }).sort((a, b) => {
        // Overdue first, then by due date
        const aOverdue = a.dueDate < today && a.status !== 'Completed' ? 0 : 1;
        const bOverdue = b.dueDate < today && b.status !== 'Completed' ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    const getClientName = (cid) => clients.find(c => c.id === cid)?.name || '—';
    const getEmployeeName = (eid) => employees.find(e => e.id === eid)?.name || '—';

    const openAdd = () => {
        setEditing(null);
        setForm({ ...defaultTask, clientIds: [] });
        setError('');
        setShowModal(true);
    };

    const openEdit = (task) => {
        setEditing(task.id);
        setForm({ ...task, clientIds: task.clientId ? [task.clientId] : [], clientId: task.clientId || '', employeeId: task.employeeId || '' });
        setShowModal(true);
    };

    const toggleClient = (cid) => {
        setForm(f => {
            const ids = f.clientIds || [];
            return { ...f, clientIds: ids.includes(cid) ? ids.filter(id => id !== cid) : [...ids, cid] };
        });
    };

    const save = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        setError('');
        try {
            const baseData = {
                title: form.title,
                description: form.description,
                employeeId: Number(form.employeeId) || null,
                priority: form.priority,
                status: form.status,
                dueDate: form.dueDate || null,
                completedDate: form.completedDate || null,
            };
            if (baseData.status === 'Completed' && !baseData.completedDate) {
                baseData.completedDate = new Date().toISOString().split('T')[0];
            }
            if (editing) {
                await supabaseService.tasks.update(editing, { ...baseData, clientId: Number(form.clientId) || (form.clientIds?.[0] || null) });
            } else {
                const selectedClients = (form.clientIds || []).length > 0 ? form.clientIds : [null];
                const createdDate = new Date().toISOString().split('T')[0];
                for (const cid of selectedClients) {
                    await supabaseService.tasks.add({ ...baseData, clientId: cid, createdDate });
                }
            }
            setShowModal(false);
        } catch (err) {
            console.error('Error saving task:', err);
            setError('Failed to save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleComplete = async (id, currentStatus, e) => {
        e.stopPropagation();
        const isCompleted = currentStatus === 'Completed';
        await supabaseService.tasks.update(id, {
            status: isCompleted ? 'Pending' : 'Completed',
            completedDate: isCompleted ? '' : new Date().toISOString().split('T')[0]
        });
    };

    const deleteTask = async (id) => {
        await supabaseService.tasks.delete(id);
        setShowModal(false);
    };

    const getPriorityClass = (p) => {
        const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
        return map[p] || 'badge-low';
    };

    const getStatusClass = (s) => {
        const map = { 'Pending': 'badge-pending', 'In Progress': 'badge-inprogress', 'Completed': 'badge-completed', 'Delayed': 'badge-delayed' };
        return map[s] || 'badge-pending';
    };

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1>Tasks</h1>
                    <p>Track and manage all tasks</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Add Task
                </button>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} />
                    <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Delayed</option>
                    <option>Overdue</option>
                </select>

                <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
                    <option value="All">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                    <option value="All">All Employees</option>
                    {employees.filter(e => e.status === 'Active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>

                <select className="form-select" style={{ width: 'auto', minWidth: 120 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                    <option value="All">All Priority</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <ListTodo size={48} />
                        <h3>No tasks found</h3>
                        <p>Create tasks to track work across clients and employees.</p>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 44 }}></th>
                                <th>Task</th>
                                <th>Client</th>
                                <th>Assigned To</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(task => {
                                const overdue = task.dueDate < today && task.status !== 'Completed';
                                return (
                                    <tr key={task.id} onClick={() => openEdit(task)} style={{ cursor: 'pointer' }}>
                                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center', width: 44, padding: '8px 4px' }}>
                                            <button
                                                onClick={(e) => toggleComplete(task.id, task.status, e)}
                                                title={task.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed'}
                                                style={{
                                                    background: 'none', border: task.status === 'Completed' ? 'none' : '2px solid var(--text-muted)',
                                                    borderRadius: '50%', width: 24, height: 24, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: task.status === 'Completed' ? 'var(--success)' : 'transparent',
                                                    transition: 'all 150ms ease'
                                                }}
                                            >
                                                {task.status === 'Completed' && <CircleCheck size={22} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.6 : 1 }}>{task.title}</div>
                                            {task.description && <div className="text-sm text-muted truncate" style={{ maxWidth: 300 }}>{task.description}</div>}
                                        </td>
                                        <td>{getClientName(task.clientId)}</td>
                                        <td>{getEmployeeName(task.employeeId)}</td>
                                        <td><span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span></td>
                                        <td><span className={`badge ${getStatusClass(task.status)}`}>{task.status}</span></td>
                                        <td>
                                            <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: overdue ? 600 : 400 }}>
                                                {overdue && <AlertTriangle size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />}
                                                {task.dueDate || '—'}
                                            </span>
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Task' : 'Add Task'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>✕</button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details..." />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">{editing ? 'Client' : 'Clients (multi-select)'}</label>
                                    {editing ? (
                                        <select className="form-select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                                            <option value="">Select client</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    ) : (
                                        <MultiClientSelect
                                            clients={clients}
                                            selected={form.clientIds || []}
                                            onToggle={toggleClient}
                                        />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assigned To</label>
                                    <select className="form-select" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                                        <option value="">Select employee</option>
                                        {employees.filter(e => e.status === 'Active').map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option>Pending</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                        <option>Delayed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <DatePicker value={form.dueDate} onChange={val => setForm({ ...form, dueDate: val })} placeholder="Select due date" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            {editing && (
                                <button className="btn btn-danger btn-sm" onClick={() => deleteTask(editing)} style={{ marginRight: 'auto' }}>
                                    Delete
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" onClick={save} disabled={!form.title.trim() || saving}>
                                {saving ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update' : 'Add') + ' Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Multi-Client Select Component ---- */
function MultiClientSelect({ clients, selected, onToggle }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const selectedNames = clients.filter(c => selected.includes(c.id)).map(c => c.name);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Trigger */}
            <div
                className="form-input"
                onClick={() => setOpen(!open)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minHeight: 42 }}
            >
                {selected.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Select clients...</span>
                ) : (
                    selectedNames.map((name, i) => (
                        <span key={i} style={{
                            background: 'var(--accent-soft)', color: 'var(--text-accent)',
                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--fs-xs)', fontWeight: 600, display: 'inline-flex',
                            alignItems: 'center', gap: 4
                        }}>
                            {name}
                        </span>
                    ))
                )}
                <ChevronDown size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', marginTop: 4,
                    boxShadow: 'var(--shadow-lg)', maxHeight: 260, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text-primary)',
                                fontFamily: 'var(--font)', fontSize: 'var(--fs-sm)', outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No clients found</div>
                        ) : filtered.map(c => (
                            <div
                                key={c.id}
                                onClick={() => onToggle(c.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', cursor: 'pointer',
                                    background: selected.includes(c.id) ? 'var(--accent-soft)' : 'transparent',
                                    transition: 'background 100ms ease'
                                }}
                                onMouseEnter={e => { if (!selected.includes(c.id)) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                                onMouseLeave={e => { if (!selected.includes(c.id)) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 18, height: 18, borderRadius: 4,
                                    border: selected.includes(c.id) ? 'none' : '2px solid var(--text-muted)',
                                    background: selected.includes(c.id) ? 'var(--accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {selected.includes(c.id) && <Check size={12} color="white" />}
                                </div>
                                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{c.name}</span>
                            </div>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                            {selected.length} client{selected.length !== 1 ? 's' : ''} selected — a task will be created for each
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
