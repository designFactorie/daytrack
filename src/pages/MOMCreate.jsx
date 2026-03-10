import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';
import { generateDailySummary, hasApiKey } from '../utils/ai';

export default function MOMCreate() {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedClientId = location.state?.clientId || '';
    const editId = location.state?.editId || null;
    const [clientId, setClientId] = useState(preselectedClientId);
    const [form, setForm] = useState({
        meetingDate: new Date().toISOString().split('T')[0],
        meetingType: 'Daily',
        participants: '',
        discussionPoints: '',
        decisions: '',
        blockers: '',
        clientFeedback: '',
        previousDaySummary: '',
        todaysSummary: '',
        actionItems: [],
        carryForwardItems: [],
    });
    const [previousActionItems, setPreviousActionItems] = useState([]);
    const [newActionText, setNewActionText] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const clients = (useSupabaseData('clients') || []).filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name));

    // Check AI availability
    useEffect(() => {
        hasApiKey().then(setAiAvailable);
    }, []);

    // Load existing MOM for edit mode
    useEffect(() => {
        if (!editId) return;
        (async () => {
            const mom = await supabaseService.moms.getById(Number(editId));
            if (mom) {
                setClientId(String(mom.clientId));
                setForm({
                    meetingDate: mom.meetingDate || '',
                    meetingType: mom.meetingType || 'Daily',
                    participants: mom.participants || '',
                    discussionPoints: mom.discussionPoints || '',
                    decisions: mom.decisions || '',
                    blockers: mom.blockers || '',
                    clientFeedback: mom.clientFeedback || '',
                    previousDaySummary: mom.previousDaySummary || '',
                    todaysSummary: mom.todaysSummary || '',
                    actionItems: mom.actionItems || [],
                    carryForwardItems: mom.carryForwardItems || [],
                });
            }
        })();
    }, [editId]);

    // Fetch previous MOM when client changes (only in create mode)
    useEffect(() => {
        if (editId) return; // Skip in edit mode
        if (!clientId) {
            setPreviousActionItems([]);
            setForm(f => ({ ...f, previousDaySummary: '', carryForwardItems: [] }));
            return;
        }

        (async () => {
            const prevMoms = await supabaseService.moms.getByClient(Number(clientId));

            if (prevMoms.length > 0) {
                const latest = prevMoms[0];
                const pendingItems = [
                    ...(latest.actionItems || []).filter(a => a.status !== 'completed'),
                    ...(latest.carryForwardItems || [])
                ].map(item => ({
                    text: typeof item === 'string' ? item : item.text,
                    status: 'pending' // pending | completed | carry | task
                }));

                setPreviousActionItems(pendingItems);
                setForm(f => ({
                    ...f,
                    previousDaySummary: latest.todaysSummary || `Meeting on ${latest.meetingDate}: ${(latest.discussionPoints || '').substring(0, 200)}`,
                }));
            } else {
                setPreviousActionItems([]);
                setForm(f => ({ ...f, previousDaySummary: '' }));
            }
        })();
    }, [clientId]);

    const updatePrevAction = (index, status) => {
        setPreviousActionItems(items =>
            items.map((item, i) => i === index ? { ...item, status } : item)
        );
    };

    const addActionItem = () => {
        if (!newActionText.trim()) return;
        setForm(f => ({
            ...f,
            actionItems: [...f.actionItems, { text: newActionText.trim(), status: 'pending' }]
        }));
        setNewActionText('');
    };

    const removeActionItem = (index) => {
        setForm(f => ({
            ...f,
            actionItems: f.actionItems.filter((_, i) => i !== index)
        }));
    };

    const generateSummary = async () => {
        setAiLoading(true);
        const actionTexts = form.actionItems.map(a => `- ${a.text}`).join('\n');
        const summary = await generateDailySummary(form.discussionPoints, form.decisions, actionTexts);
        setForm(f => ({ ...f, todaysSummary: summary }));
        setAiLoading(false);
    };

    const convertToTask = async (actionText) => {
        if (!clientId) return;
        try {
            await supabaseService.tasks.add({
                title: actionText,
                description: `Created from MOM action item`,
                clientId: Number(clientId),
                employeeId: null,
                priority: 'Medium',
                status: 'Pending',
                dueDate: null,
                createdDate: new Date().toISOString().split('T')[0],
                completedDate: null
            });
        } catch (err) {
            console.error('Error converting action item to task:', err);
            setError('Failed to create task from action item.');
        }
    };

    const save = async () => {
        if (!clientId || !form.meetingDate) {
            setError('Client and meeting date are required.');
            return;
        }

        // Check for duplicate MOM
        const allMoms = await supabaseService.moms.getAll();
        const existing = allMoms.find(m => m.clientId === Number(clientId) && m.meetingDate === form.meetingDate);

        if (existing && existing.id !== Number(editId)) {
            setError('A MOM already exists for this client on this date.');
            return;
        }

        try {
            const momData = {
                clientId: Number(clientId),
                meetingDate: form.meetingDate,
                meetingType: form.meetingType,
                participants: form.participants || null,
                discussionPoints: form.discussionPoints || null,
                decisions: form.decisions || null,
                actionItems: form.actionItems || [],
                blockers: form.blockers || null,
                clientFeedback: form.clientFeedback || null,
                previousDaySummary: form.previousDaySummary || null,
                todaysSummary: form.todaysSummary || null,
                carryForwardItems: carryForward || [],
            };

            if (editId) {
                await supabaseService.moms.update(Number(editId), momData);
            } else {
                momData.createdAt = new Date().toISOString();
                await supabaseService.moms.add(momData);
            }
            navigate('/mom');
        } catch (err) {
            console.error('Error saving MOM:', err);
            setError('Failed to save MOM. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button className="btn btn-ghost" onClick={() => navigate('/mom')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>{editId ? 'Edit MOM' : 'Create MOM'}</h1>
                    <p>{editId ? 'Update meeting minutes' : "Record today's meeting minutes"}</p>
                </div>
            </div>

            {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
                    {error}
                </div>
            )}

            <div className="grid-2">
                {/* Left Column */}
                <div>
                    <div className="card mb-6">
                        <div className="card-header"><span className="card-title">Meeting Details</span></div>
                        <div className="form-group">
                            <label className="form-label">Client *</label>
                            <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
                                <option value="">Select client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Meeting Date *</label>
                                <DatePicker value={form.meetingDate} onChange={val => setForm({ ...form, meetingDate: val })} placeholder="Select date" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Meeting Type</label>
                                <select className="form-select" value={form.meetingType} onChange={e => setForm({ ...form, meetingType: e.target.value })}>
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Review</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Participants</label>
                            <input className="form-input" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} placeholder="Names separated by commas" />
                        </div>
                    </div>

                    <div className="card mb-6">
                        <div className="card-header"><span className="card-title">Discussion</span></div>
                        <div className="form-group">
                            <label className="form-label">Discussion Points</label>
                            <textarea className="form-textarea" value={form.discussionPoints} onChange={e => setForm({ ...form, discussionPoints: e.target.value })} placeholder="Key topics discussed..." rows={5} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Decisions Taken</label>
                            <textarea className="form-textarea" value={form.decisions} onChange={e => setForm({ ...form, decisions: e.target.value })} placeholder="Key decisions made..." rows={3} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Blockers / Risks</label>
                            <textarea className="form-textarea" value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })} placeholder="Any blockers or risks..." rows={2} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Client Feedback</label>
                            <textarea className="form-textarea" value={form.clientFeedback} onChange={e => setForm({ ...form, clientFeedback: e.target.value })} placeholder="Client's feedback..." rows={2} />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Previous Day Summary */}
                    {form.previousDaySummary && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                            <div className="card-header"><span className="card-title">📋 Previous Day Summary</span></div>
                            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {form.previousDaySummary}
                            </p>
                        </div>
                    )}

                    {/* Carried Forward Items */}
                    {previousActionItems.length > 0 && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                            <div className="card-header"><span className="card-title">🔄 Previous Action Items</span></div>
                            <p className="text-sm text-muted mb-4">Mark each item: ✅ Done, 🔄 Carry Forward, or 📋 Convert to Task</p>
                            {previousActionItems.map((item, i) => (
                                <div key={i} className="action-item">
                                    <span className="action-item-text">{item.text}</span>
                                    <div className="action-item-status">
                                        <button className={`done ${item.status === 'completed' ? 'active' : ''}`} onClick={() => updatePrevAction(i, 'completed')} title="Done">✅</button>
                                        <button className={`carry ${item.status === 'carry' ? 'active' : ''}`} onClick={() => updatePrevAction(i, 'carry')} title="Carry Forward">🔄</button>
                                        <button className={`task ${item.status === 'task' ? 'active' : ''}`} onClick={() => updatePrevAction(i, 'task')} title="Convert to Task">📋</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Today's Action Items */}
                    <div className="card mb-6">
                        <div className="card-header"><span className="card-title">📋 Today's Action Items</span></div>
                        {form.actionItems.map((item, i) => (
                            <div key={i} className="action-item">
                                <span className="action-item-text">{item.text}</span>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeActionItem(i)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2 mt-4">
                            <input
                                className="form-input"
                                value={newActionText}
                                onChange={e => setNewActionText(e.target.value)}
                                placeholder="Add action item..."
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                            />
                            <button className="btn btn-secondary btn-sm" onClick={addActionItem}>
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="card mb-6">
                        <div className="card-header">
                            <span className="card-title">📝 Today's Summary</span>
                            {aiAvailable && (
                                <button className="btn btn-sm btn-secondary" onClick={generateSummary} disabled={aiLoading}>
                                    <Sparkles size={14} />
                                    {aiLoading ? 'Generating...' : 'AI Generate'}
                                </button>
                            )}
                        </div>
                        <textarea
                            className="form-textarea"
                            value={form.todaysSummary}
                            onChange={e => setForm({ ...form, todaysSummary: e.target.value })}
                            placeholder="Meeting summary..."
                            rows={6}
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-between">
                        <button className="btn btn-secondary" onClick={() => navigate('/mom')}>Cancel</button>
                        <button className="btn btn-primary btn-lg" onClick={save} disabled={saving || !clientId}>
                            {saving ? 'Saving...' : editId ? 'Update MOM' : 'Save MOM'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
