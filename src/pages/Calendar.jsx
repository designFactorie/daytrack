import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, X, ListTodo } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const tasks = useSupabaseData('tasks') || [];
    const clients = (useSupabaseData('clients') || []).sort((a, b) => a.name.localeCompare(b.name));
    const employees = useSupabaseData('employees') || [];

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarDays = useMemo(() => {
        const totalDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const prevMonthTotalDays = daysInMonth(year, month - 1);

        const days = [];

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthTotalDays - i,
                month: month - 1,
                year: year,
                currentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                month: month,
                year: year,
                currentMonth: true
            });
        }

        // Next month days
        const remainingSlots = 42 - days.length;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push({
                day: i,
                month: month + 1,
                year: year,
                currentMonth: false
            });
        }

        return days;
    }, [year, month]);

    const changeMonth = (offset) => {
        const newDate = new Date(year, month + offset, 1);
        setCurrentDate(newDate);
    };

    const getTasksForDate = (day, m, y) => {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(t => t.dueDate === dateStr);
    };

    const handleDayClick = (dateObj) => {
        const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setShowModal(true);
    };

    const today = new Date().toISOString().split('T')[0];

    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return [];
        return tasks.filter(t => t.dueDate === selectedDate);
    }, [selectedDate, tasks]);

    const getClientName = (cid) => clients.find(c => c.id === cid)?.name || '—';
    const getEmployeeName = (eid) => employees.find(e => e.id === eid)?.name || '—';

    return (
        <div className="calendar-page">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1>Calendar</h1>
                    <p>View tasks scheduled by month</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="calendar-nav flex items-center gap-2">
                        <button className="btn btn-ghost p-2" onClick={() => changeMonth(-1)}>
                            <ChevronLeft size={20} />
                        </button>
                        <h3 style={{ minWidth: 150, textAlign: 'center', margin: 0 }}>
                            {monthNames[month]} {year}
                        </h3>
                        <button className="btn btn-ghost p-2" onClick={() => changeMonth(1)}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCurrentDate(new Date())}>Today</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="calendar-grid">
                    <div className="calendar-weekday">Sun</div>
                    <div className="calendar-weekday">Mon</div>
                    <div className="calendar-weekday">Tue</div>
                    <div className="calendar-weekday">Wed</div>
                    <div className="calendar-weekday">Thu</div>
                    <div className="calendar-weekday">Fri</div>
                    <div className="calendar-weekday">Sat</div>

                    {calendarDays.map((dateObj, idx) => {
                        const dateTasks = getTasksForDate(dateObj.day, dateObj.month, dateObj.year);
                        const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
                        const isToday = dateStr === today;

                        return (
                            <div
                                key={idx}
                                className={`calendar-day ${!dateObj.currentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
                                onClick={() => handleDayClick(dateObj)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="day-number">{dateObj.day}</div>
                                <div className="day-tasks">
                                    {dateTasks.slice(0, 3).map(task => (
                                        <div key={task.id} className={`task-pill ${task.status === 'Completed' ? 'completed' : ''}`}>
                                            <span className="task-indicator" style={{ background: task.status === 'Completed' ? 'var(--success)' : 'var(--accent)' }}></span>
                                            <span className="task-title truncate">{task.title}</span>
                                        </div>
                                    ))}
                                    {dateTasks.length > 3 && (
                                        <div className="task-more">+{dateTasks.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tasks Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ marginBottom: 4 }}>Tasks for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</h2>
                                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{selectedDateTasks.length} tasks scheduled</p>
                            </div>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {selectedDateTasks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                                    <ListTodo size={40} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
                                    <p>No tasks scheduled for this day.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                                    {selectedDateTasks.map(task => (
                                        <div key={task.id} className="card" style={{ padding: 'var(--space-3)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{task.title}</div>
                                                <span className={`badge ${task.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: 10 }}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                                                <div className="flex items-center gap-1">
                                                    <span style={{ color: 'var(--text-muted)' }}>Client:</span>
                                                    <span>{getClientName(task.clientId)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span style={{ color: 'var(--text-muted)' }}>Assigned to:</span>
                                                    <span>{getEmployeeName(task.employeeId)}</span>
                                                </div>
                                            </div>
                                            {task.description && (
                                                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    {task.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-left: 1px solid var(--border);
                    border-top: 1px solid var(--border);
                }
                .calendar-weekday {
                    padding: var(--space-3);
                    text-align: center;
                    font-weight: 600;
                    font-size: var(--fs-xs);
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: var(--bg-body);
                    border-right: 1px solid var(--border);
                    border-bottom: 1px solid var(--border);
                }
                .calendar-day {
                    min-height: 120px;
                    padding: var(--space-2);
                    border-right: 1px solid var(--border);
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-card);
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-1);
                    transition: background 0.2s;
                }
                .calendar-day:hover {
                    background: var(--bg-card-hover);
                }
                .calendar-day.other-month {
                    background: rgba(0,0,0,0.02);
                }
                .calendar-day.other-month .day-number {
                    color: var(--text-muted);
                }
                .calendar-day.is-today {
                    background: var(--accent-soft);
                }
                .calendar-day.is-today .day-number {
                    background: var(--accent);
                    color: white !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                }
                .day-number {
                    font-size: var(--fs-sm);
                    font-weight: 500;
                    margin-bottom: var(--space-1);
                }
                .day-tasks {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .task-pill {
                    font-size: 10px;
                    padding: 2px 6px;
                    background: var(--bg-body);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    max-width: 100%;
                    border: 1px solid var(--border);
                }
                .task-pill.completed {
                    opacity: 0.6;
                }
                .task-indicator {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .task-title {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .task-more {
                    font-size: 10px;
                    color: var(--text-muted);
                    padding-left: 6px;
                }
            `}</style>
        </div>
    );
}
