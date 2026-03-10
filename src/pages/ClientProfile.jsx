import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, FileText, DollarSign, CheckCircle, AlertCircle, Save, X, ListTodo, CircleCheck, AlertTriangle, Plus } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';
import DatePicker from '../components/DatePicker';

const defaultTask = {
    title: '', description: '', clientId: '', employeeId: '',
    priority: 'Medium', status: 'Pending', dueDate: '', completedDate: ''
};

export default function ClientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [editingField, setEditingField] = useState(null); // 'goingWell' | 'toFix' | 'notes'
    const [editValue, setEditValue] = useState('');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({ ...defaultTask });

    const clientsData = useSupabaseData('clients', q => q.eq('id', Number(id))) || [];
    const client = clientsData[0];
    const tasks = useSupabaseData('tasks', q => q.eq('clientId', Number(id))) || [];
    const moms = useSupabaseData('moms', q => q.eq('clientId', Number(id)).order('meetingDate', { ascending: false })) || [];
    const employees = useSupabaseData('employees') || [];

    if (!client) {
        return (
            <div className="card">
                <div className="empty-state">
                    <h3>Client not found</h3>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/clients')}>Back to Clients</button>
                </div>
            </div>
        );
    }

    const outstanding = (Number(client.revenueValue) || 0) - (Number(client.amountCollected) || 0);
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;

    const goingWellItems = (client.goingWell || '').split('\n').filter(Boolean);
    const toFixItems = (client.toFix || '').split('\n').filter(Boolean);

    const getEmployeeName = (empId) => {
        const emp = employees.find(e => e.id === empId);
        return emp ? emp.name : '—';
    };

    const startEditing = (field) => {
        setEditingField(field);
        setEditValue(client[field] || '');
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveField = async () => {
        if (!editingField) return;
        try {
            await supabaseService.clients.update(Number(id), { [editingField]: editValue });
            setEditingField(null);
            setEditValue('');
        } catch (err) {
            console.error('Error saving field:', err);
            alert('Failed to save. Please try again.');
        }
    };

    const toggleTaskComplete = async (taskId, currentStatus, e) => {
        e.stopPropagation();
        const isCompleted = currentStatus === 'Completed';
        try {
            await supabaseService.tasks.update(taskId, {
                status: isCompleted ? 'Pending' : 'Completed',
                completedDate: isCompleted ? null : new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            console.error('Error toggling task:', err);
            alert('Failed to update task.');
        }
    };

    const saveTask = async () => {
        if (!taskForm.title.trim()) return;
        try {
            const data = {
                ...taskForm,
                clientId: Number(id),
                employeeId: taskForm.employeeId ? Number(taskForm.employeeId) : null,
                dueDate: taskForm.dueDate || null,
                createdDate: new Date().toISOString().split('T')[0],
                completedDate: taskForm.completedDate || null
            };
            await supabaseService.tasks.add(data);
            setShowTaskModal(false);
            setTaskForm({ ...defaultTask });
        } catch (err) {
            console.error('Error saving task:', err);
            alert('Failed to save task. Please try again.');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button className="btn btn-ghost" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>{client.name}</h1>
                    <p>{client.contactPerson || ''} {client.email ? `• ${client.email}` : ''} {client.phone ? `• ${client.phone}` : ''}</p>
                </div>
                <span className={`badge ${client.status === 'Active' ? 'badge-active' : client.status === 'On Hold' ? 'badge-onhold' : 'badge-closed'}`} style={{ marginLeft: 'auto' }}>
                    {client.status}
                </span>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {['overview', 'revenue', 'tasks', 'mom-history'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' ? 'Overview' : tab === 'revenue' ? 'Revenue & Notes' : tab === 'tasks' ? 'Tasks' : 'MOM History'}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    <div className="grid-4 mb-6">
                        <div className="stat-card">
                            <div className="stat-icon blue"><DollarSign size={22} /></div>
                            <div className="stat-value">₹{(Number(client.revenueValue) || 0).toLocaleString('en-IN')}</div>
                            <div className="stat-label">Contract Value</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><DollarSign size={22} /></div>
                            <div className="stat-value">₹{(Number(client.amountCollected) || 0).toLocaleString('en-IN')}</div>
                            <div className="stat-label">Collected</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><DollarSign size={22} /></div>
                            <div className="stat-value">₹{outstanding.toLocaleString('en-IN')}</div>
                            <div className="stat-label">Outstanding</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><FileText size={22} /></div>
                            <div className="stat-value">{moms.length}</div>
                            <div className="stat-label">Total MOMs</div>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header"><span className="card-title">Contract Details</span></div>
                            <table className="table" style={{ background: 'transparent' }}>
                                <tbody>
                                    <tr><td className="text-muted">Start Date</td><td>{client.contractStart || '—'}</td></tr>
                                    <tr><td className="text-muted">End Date</td><td>{client.contractEnd || '—'}</td></tr>
                                    <tr><td className="text-muted">Status</td><td>{client.status}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="card" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
                            <div className="card-header"><span className="card-title">Tasks</span></div>
                            <div className="flex gap-4">
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div className="stat-value text-success">{completedTasks}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingTasks}</div>
                                    <div className="stat-label">Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue & Notes Tab */}
            {activeTab === 'revenue' && (
                <div className="grid-2">
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title"><CheckCircle size={16} style={{ color: 'var(--success)', marginRight: 8 }} />Things Going Well</span>
                            {editingField === 'goingWell' ? (
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost btn-sm" onClick={cancelEditing}><X size={16} /></button>
                                    <button className="btn btn-primary btn-sm" onClick={saveField}><Save size={14} /> Save</button>
                                </div>
                            ) : (
                                <button className="btn btn-ghost btn-sm" onClick={() => startEditing('goingWell')}><Edit2 size={14} /> Edit</button>
                            )}
                        </div>
                        {editingField === 'goingWell' ? (
                            <textarea
                                className="form-textarea"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="One item per line"
                                rows={5}
                                autoFocus
                            />
                        ) : goingWellItems.length > 0 ? (
                            <ul style={{ paddingLeft: 20 }}>
                                {goingWellItems.map((item, i) => (
                                    <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 'var(--fs-sm)', listStyleType: 'disc' }}>{item}</li>
                                ))}
                            </ul>
                        ) : <p className="text-muted text-sm">No items recorded.</p>}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title"><AlertCircle size={16} style={{ color: 'var(--danger)', marginRight: 8 }} />Things to Fix</span>
                            {editingField === 'toFix' ? (
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost btn-sm" onClick={cancelEditing}><X size={16} /></button>
                                    <button className="btn btn-primary btn-sm" onClick={saveField}><Save size={14} /> Save</button>
                                </div>
                            ) : (
                                <button className="btn btn-ghost btn-sm" onClick={() => startEditing('toFix')}><Edit2 size={14} /> Edit</button>
                            )}
                        </div>
                        {editingField === 'toFix' ? (
                            <textarea
                                className="form-textarea"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="One item per line"
                                rows={5}
                                autoFocus
                            />
                        ) : toFixItems.length > 0 ? (
                            <ul style={{ paddingLeft: 20 }}>
                                {toFixItems.map((item, i) => (
                                    <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 'var(--fs-sm)', listStyleType: 'disc' }}>{item}</li>
                                ))}
                            </ul>
                        ) : <p className="text-muted text-sm">No items recorded.</p>}
                    </div>

                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div className="card-header">
                            <span className="card-title">Notes</span>
                            {editingField === 'notes' ? (
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost btn-sm" onClick={cancelEditing}><X size={16} /></button>
                                    <button className="btn btn-primary btn-sm" onClick={saveField}><Save size={14} /> Save</button>
                                </div>
                            ) : (
                                <button className="btn btn-ghost btn-sm" onClick={() => startEditing('notes')}><Edit2 size={14} /> Edit</button>
                            )}
                        </div>
                        {editingField === 'notes' ? (
                            <textarea
                                className="form-textarea"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="General notes..."
                                rows={6}
                                autoFocus
                            />
                        ) : (
                            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                                {client.notes || 'No notes yet.'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ fontSize: 'var(--fs-middle)', fontWeight: 600 }}>Client Tasks</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                            <Plus size={16} /> Add Task
                        </button>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <ListTodo size={48} />
                                <h3>No tasks for this client</h3>
                                <p>Create tasks from here or via MOM action items.</p>
                                <button className="btn btn-primary mt-4" onClick={() => setShowTaskModal(true)}>
                                    <Plus size={18} /> Add Your First Task
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 44 }}></th>
                                        <th>Task</th>
                                        <th>Assigned To</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map(task => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const overdue = task.dueDate < todayStr && task.status !== 'Completed';
                                        return (
                                            <tr key={task.id}>
                                                <td style={{ textAlign: 'center', width: 44, padding: '8px 4px' }}>
                                                    <button
                                                        onClick={(e) => toggleTaskComplete(task.id, task.status, e)}
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
                                                    <div style={{ fontWeight: 600, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.6 : 1 }}>
                                                        {task.title}
                                                    </div>
                                                    {task.description && <div className="text-sm text-muted">{task.description}</div>}
                                                </td>
                                                <td>{getEmployeeName(task.employeeId)}</td>
                                                <td>
                                                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${task.status === 'Pending' ? 'badge-pending' :
                                                        task.status === 'In Progress' ? 'badge-inprogress' :
                                                            task.status === 'Completed' ? 'badge-completed' : 'badge-delayed'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                </td>
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
                </div>
            )}

            {/* MOM History Tab */}
            {activeTab === 'mom-history' && (
                <div>
                    {moms.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No MOMs yet</h3>
                                <p>Create a MOM for this client to start tracking meetings.</p>
                                <button className="btn btn-primary mt-4" onClick={() => navigate('/mom/create', { state: { clientId: client.id } })}>
                                    Create MOM
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="timeline">
                            {moms.map(mom => (
                                <div key={mom.id} className="timeline-item">
                                    <div className="timeline-date">{mom.meetingDate} • {mom.meetingType || 'Daily'}</div>
                                    <div className="card" onClick={() => navigate(`/mom/${mom.id}`)} style={{ cursor: 'pointer' }}>
                                        {mom.todaysSummary && (
                                            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-3)' }}>
                                                {mom.todaysSummary.substring(0, 200)}{mom.todaysSummary.length > 200 ? '...' : ''}
                                            </p>
                                        )}
                                        <div className="flex gap-4 text-sm text-muted">
                                            {mom.actionItems && <span>📋 {mom.actionItems.length} action items</span>}
                                            {mom.participants && <span>👥 {mom.participants}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showTaskModal && (
                <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Task for {client.name}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Task Title *</label>
                                <input className="form-input" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Add more details..." rows={3} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Assign To</label>
                                    <select className="form-select" value={taskForm.employeeId} onChange={e => setTaskForm({ ...taskForm, employeeId: e.target.value })}>
                                        <option value="">Select employee</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <DatePicker value={taskForm.dueDate} onChange={val => setTaskForm({ ...taskForm, dueDate: val })} placeholder="Set deadline" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveTask} disabled={!taskForm.title.trim()}>
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
