import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, Sparkles, CheckCircle, Clock, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';
import { generateCollectiveSummary, hasApiKey } from '../utils/ai';

export default function MOMList() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    const [viewMode, setViewMode] = useState('today'); // 'today' | 'history'
    const [clientFilter, setClientFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [aiAvailable, setAiAvailable] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    const clients = (useSupabaseData('clients') || []).filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name));
    const activeClients = clients.filter(c => c.status === 'Active');
    const allMoms = useSupabaseData('moms', q => q.order('meetingDate', { ascending: false })) || [];
    const todayMoms = allMoms.filter(m => m.meetingDate === today);

    useEffect(() => {
        hasApiKey().then(setAiAvailable);
    }, []);

    // Build a map of clientId -> today's MOM
    const todayMomMap = {};
    todayMoms.forEach(m => { todayMomMap[m.clientId] = m; });

    const clientsDone = activeClients.filter(c => todayMomMap[c.id]);
    const clientsPending = activeClients.filter(c => !todayMomMap[c.id]);

    // History filter
    const filteredHistory = allMoms.filter(m => {
        if (clientFilter !== 'All' && m.clientId !== Number(clientFilter)) return false;
        if (dateFrom && m.meetingDate < dateFrom) return false;
        if (dateTo && m.meetingDate > dateTo) return false;
        return true;
    });

    const getClientName = (cid) => clients.find(c => c.id === cid)?.name || 'Unknown';

    const getLastMomDate = (clientId) => {
        const clientMoms = allMoms.filter(m => m.clientId === clientId && m.meetingDate !== today);
        return clientMoms.length > 0 ? clientMoms[0].meetingDate : null;
    };

    const generateSummaryReport = async () => {
        if (filteredHistory.length === 0) return;
        setSummaryLoading(true);
        setShowSummary(true);
        const clientName = clientFilter !== 'All' ? getClientName(Number(clientFilter)) : 'All Clients';
        const range = `${dateFrom || 'start'} to ${dateTo || 'present'}`;
        const result = await generateCollectiveSummary(filteredHistory, clientName, range);
        setSummaryText(result);
        setSummaryLoading(false);
    };

    const deleteMom = async (momId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this MOM? This cannot be undone.')) return;
        await supabaseService.moms.delete(momId);
    };

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1>Minutes of Meeting</h1>
                    <p>Daily meeting tracker for all clients</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/mom/create')}>
                    <Plus size={18} /> New MOM
                </button>
            </div>

            {/* View Toggle */}
            <div className="tabs">
                <button className={`tab ${viewMode === 'today' ? 'active' : ''}`} onClick={() => setViewMode('today')}>
                    📋 Today's MOMs
                </button>
                <button className={`tab ${viewMode === 'history' ? 'active' : ''}`} onClick={() => setViewMode('history')}>
                    📅 History
                </button>
            </div>

            {/* ============ TODAY'S VIEW ============ */}
            {viewMode === 'today' && (
                <div>
                    {/* Progress Bar */}
                    {activeClients.length > 0 && (
                        <div className="card mb-6" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                                    Today's Progress
                                </span>
                                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-accent)', fontWeight: 700 }}>
                                    {clientsDone.length} / {activeClients.length} clients
                                </span>
                            </div>
                            <div style={{
                                width: '100%', height: 8, background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-full)', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${activeClients.length > 0 ? (clientsDone.length / activeClients.length) * 100 : 0}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--accent), #22c55e)',
                                    borderRadius: 'var(--radius-full)',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Pending Clients */}
                    {clientsPending.length > 0 && (
                        <div className="mb-6">
                            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--warning)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Clock size={18} /> Pending — {clientsPending.length} client{clientsPending.length !== 1 ? 's' : ''}
                            </h3>
                            <div className="grid-3">
                                {clientsPending.map(client => {
                                    const lastDate = getLastMomDate(client.id);
                                    return (
                                        <div
                                            key={client.id}
                                            className="client-tile pending"
                                            onClick={() => navigate('/mom/create', { state: { clientId: client.id } })}
                                        >
                                            <div className="tile-header">
                                                <div className="tile-avatar">{client.name.charAt(0)}</div>
                                                <div className="tile-info">
                                                    <div className="tile-name">{client.name}</div>
                                                    <div className="tile-sub">
                                                        {lastDate ? `Last MOM: ${lastDate}` : 'No previous MOM'}
                                                    </div>
                                                </div>
                                                <ArrowRight size={18} className="tile-arrow" />
                                            </div>
                                            {client.contactPerson && (
                                                <div className="tile-contact">👤 {client.contactPerson}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed Clients */}
                    {clientsDone.length > 0 && (
                        <div className="mb-6">
                            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--success)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <CheckCircle size={18} /> Done — {clientsDone.length} client{clientsDone.length !== 1 ? 's' : ''}
                            </h3>
                            <div className="grid-3">
                                {clientsDone.map(client => {
                                    const mom = todayMomMap[client.id];
                                    return (
                                        <div
                                            key={client.id}
                                            className="client-tile done"
                                            onClick={() => navigate(`/mom/${mom.id}`)}
                                        >
                                            <div className="tile-header">
                                                <div className="tile-avatar done">{client.name.charAt(0)}</div>
                                                <div className="tile-info">
                                                    <div className="tile-name">{client.name}</div>
                                                    <div className="tile-sub">{mom.meetingType || 'Daily'} • {mom.actionItems?.length || 0} action items</div>
                                                </div>
                                                <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                            </div>
                                            {mom.todaysSummary && (
                                                <div className="tile-summary">
                                                    {mom.todaysSummary.substring(0, 100)}{mom.todaysSummary.length > 100 ? '...' : ''}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeClients.length === 0 && (
                        <div className="card">
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No active clients</h3>
                                <p>Add clients first to start recording daily MOMs.</p>
                                <button className="btn btn-primary mt-4" onClick={() => navigate('/clients')}>Go to Clients</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============ HISTORY VIEW ============ */}
            {viewMode === 'history' && (
                <div>
                    <div className="filter-bar">
                        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
                            <option value="All">All Clients</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <div className="flex items-center gap-2">
                            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From" style={{ width: 160 }} />
                            <span className="text-muted">to</span>
                            <DatePicker value={dateTo} onChange={setDateTo} placeholder="To" style={{ width: 160 }} />
                        </div>

                        {aiAvailable && filteredHistory.length > 0 && (
                            <button className="btn btn-secondary ml-auto" onClick={generateSummaryReport} disabled={summaryLoading}>
                                <Sparkles size={16} />
                                {summaryLoading ? 'Generating...' : 'Generate Summary'}
                            </button>
                        )}
                    </div>

                    {/* AI Summary Modal */}
                    {showSummary && (
                        <div className="modal-overlay" onClick={() => setShowSummary(false)}>
                            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>📊 Collective Summary</h2>
                                    <button className="btn btn-ghost" onClick={() => setShowSummary(false)}>✕</button>
                                </div>
                                <div className="modal-body">
                                    {summaryLoading ? (
                                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                            <Sparkles size={32} style={{ animation: 'pulse 1.5s infinite' }} />
                                            <p className="mt-4">Generating AI summary...</p>
                                        </div>
                                    ) : (
                                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font)', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                                            {summaryText}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredHistory.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No MOMs found</h3>
                                <p>No meeting records match your filters.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="timeline">
                            {filteredHistory.map(mom => (
                                <div key={mom.id} className="timeline-item">
                                    <div className="timeline-date">
                                        {mom.meetingDate} &bull; {getClientName(mom.clientId)} &bull; {mom.meetingType || 'Daily'}
                                    </div>
                                    <div className="card" onClick={() => navigate(`/mom/${mom.id}`)} style={{ cursor: 'pointer' }}>
                                        {mom.todaysSummary ? (
                                            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-3)' }}>
                                                {mom.todaysSummary.substring(0, 250)}{mom.todaysSummary.length > 250 ? '...' : ''}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
                                                {(mom.discussionPoints || '').substring(0, 200) || 'No summary available'}
                                            </p>
                                        )}
                                        <div className="flex gap-4 text-sm text-muted" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="flex gap-4">
                                                {mom.actionItems && <span>📋 {mom.actionItems.length} action items</span>}
                                                {mom.participants && <span>👥 {mom.participants}</span>}
                                                {mom.blockers && <span>⚠️ Has blockers</span>}
                                            </div>
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate('/mom/create', { state: { editId: mom.id } }); }} title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={(e) => deleteMom(mom.id, e)} title="Delete" style={{ color: 'var(--danger)' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tile Styles */}
            <style>{`
        .client-tile {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          cursor: pointer;
          transition: all var(--transition-base);
          position: relative;
        }
        .client-tile:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }
        .client-tile.pending {
          border-color: rgba(245, 158, 11, 0.2);
        }
        .client-tile.pending:hover {
          border-color: rgba(245, 158, 11, 0.5);
          background: rgba(245, 158, 11, 0.04);
        }
        .client-tile.done {
          border-color: rgba(34, 197, 94, 0.2);
          opacity: 0.85;
        }
        .client-tile.done:hover {
          opacity: 1;
          border-color: rgba(34, 197, 94, 0.5);
        }
        .tile-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .tile-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--fs-md);
          color: white;
          flex-shrink: 0;
        }
        .tile-avatar.done {
          background: linear-gradient(135deg, #16a34a, #22c55e);
        }
        .tile-info {
          flex: 1;
          min-width: 0;
        }
        .tile-name {
          font-weight: 600;
          font-size: var(--fs-base);
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tile-sub {
          font-size: var(--fs-xs);
          color: var(--text-muted);
          margin-top: 2px;
        }
        .tile-arrow {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }
        .client-tile:hover .tile-arrow {
          transform: translateX(3px);
          color: var(--warning);
        }
        .tile-contact {
          font-size: var(--fs-xs);
          color: var(--text-muted);
          margin-top: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--border);
        }
        .tile-summary {
          font-size: var(--fs-xs);
          color: var(--text-secondary);
          margin-top: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--border);
          line-height: 1.5;
        }
      `}</style>
        </div>
    );
}
