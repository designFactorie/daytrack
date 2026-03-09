import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, placeholder = 'Select date', style }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Parse the value (YYYY-MM-DD)
    const parsed = value ? new Date(value + 'T00:00:00') : null;
    const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : new Date().getMonth());
    const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : new Date().getFullYear());

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (value) {
            const d = new Date(value + 'T00:00:00');
            setViewMonth(d.getMonth());
            setViewYear(d.getFullYear());
        }
    }, [value]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const selectDate = (day) => {
        const m = String(viewMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onChange(`${viewYear}-${m}-${d}`);
        setOpen(false);
    };

    const formatDisplay = (val) => {
        if (!val) return '';
        const [y, m, d] = val.split('-');
        return `${d}/${m}/${y}`;
    };

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div ref={ref} style={{ position: 'relative', ...style }}>
            <div
                className="form-input"
                onClick={() => setOpen(!open)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {value ? formatDisplay(value) : placeholder}
                </span>
                <Calendar size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100,
                    marginTop: 4, width: 280,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    padding: 12, animation: 'fadeIn 150ms ease'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <button type="button" onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={16} /></button>
                        <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth} style={navBtnStyle}><ChevronRight size={16} /></button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Date cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {cells.map((day, i) => {
                            if (!day) return <div key={`e${i}`} />;
                            const m = String(viewMonth + 1).padStart(2, '0');
                            const d = String(day).padStart(2, '0');
                            const dateStr = `${viewYear}-${m}-${d}`;
                            const isSelected = dateStr === value;
                            const isToday = dateStr === today;
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDate(day)}
                                    style={{
                                        width: 34, height: 34,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: isToday && !isSelected ? '1px solid var(--accent)' : 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isSelected ? 'var(--accent)' : 'transparent',
                                        color: isSelected ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: 'var(--fs-sm)',
                                        fontWeight: isSelected || isToday ? 600 : 400,
                                        transition: 'all 100ms ease',
                                        margin: '0 auto'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today shortcut */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            type="button"
                            onClick={() => { onChange(today); setOpen(false); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-accent)', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontWeight: 600, fontFamily: 'var(--font)' }}
                        >
                            Today
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => { onChange(''); setOpen(false); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--fs-xs)', fontFamily: 'var(--font)' }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const navBtnStyle = {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-primary)'
};
