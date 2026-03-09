import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabaseService } from '../db/supabaseService';

export default function MOMView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const moms = useSupabaseData('moms', q => q.eq('id', Number(id))) || [];
    const mom = moms[0];
    const clients = useSupabaseData('clients') || [];

    if (!mom) {
        return (
            <div className="card">
                <div className="empty-state">
                    <h3>MOM not found</h3>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/mom')}>Back to MOMs</button>
                </div>
            </div>
        );
    }

    const clientName = clients.find(c => c.id === mom.clientId)?.name || 'Unknown';

    const deleteMom = async () => {
        if (!window.confirm('Delete this MOM? This cannot be undone.')) return;
        await supabaseService.moms.delete(Number(id));
        navigate('/mom');
    };

    const Section = ({ title, content, icon }) => {
        if (!content) return null;
        return (
            <div className="mb-6">
                <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-accent)', marginBottom: 'var(--space-2)' }}>
                    {icon} {title}
                </h3>
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>
                    {content}
                </p>
            </div>
        );
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button className="btn btn-ghost" onClick={() => navigate('/mom')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="page-header" style={{ marginBottom: 0, flex: 1 }}>
                    <h1>MOM – {clientName}</h1>
                    <p>{mom.meetingDate} • {mom.meetingType || 'Daily'} {mom.participants ? `• ${mom.participants}` : ''}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/mom/create', { state: { editId: mom.id } })}>
                        <Edit2 size={14} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={deleteMom}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid-2">
                <div>
                    {/* Summary */}
                    {mom.todaysSummary && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                            <div className="card-header"><span className="card-title">📝 Today's Summary</span></div>
                            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>
                                {mom.todaysSummary}
                            </p>
                        </div>
                    )}

                    <div className="card mb-6">
                        <Section title="Discussion Points" content={mom.discussionPoints} icon="💬" />
                        <Section title="Decisions Taken" content={mom.decisions} icon="✅" />
                        <Section title="Blockers / Risks" content={mom.blockers} icon="⚠️" />
                        <Section title="Client Feedback" content={mom.clientFeedback} icon="💡" />
                    </div>
                </div>

                <div>
                    {/* Previous Day Summary */}
                    {mom.previousDaySummary && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                            <div className="card-header"><span className="card-title">📋 Previous Day Summary</span></div>
                            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>
                                {mom.previousDaySummary}
                            </p>
                        </div>
                    )}

                    {/* Action Items */}
                    {mom.actionItems && mom.actionItems.length > 0 && (
                        <div className="card mb-6">
                            <div className="card-header"><span className="card-title">📋 Action Items</span></div>
                            {mom.actionItems.map((item, i) => (
                                <div key={i} className="action-item">
                                    {item.status === 'completed' ? (
                                        <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-muted)', flexShrink: 0 }} />
                                    )}
                                    <span className="action-item-text" style={{ textDecoration: item.status === 'completed' ? 'line-through' : 'none', opacity: item.status === 'completed' ? 0.6 : 1 }}>
                                        {typeof item === 'string' ? item : item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Carry Forward Items */}
                    {mom.carryForwardItems && mom.carryForwardItems.length > 0 && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                            <div className="card-header"><span className="card-title">🔄 Carry Forward Items</span></div>
                            {mom.carryForwardItems.map((item, i) => (
                                <div key={i} className="action-item">
                                    <span className="action-item-text">{typeof item === 'string' ? item : item.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
