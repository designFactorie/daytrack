import { useState, useRef, useEffect } from 'react';
import { supabaseService } from '../db/supabaseService';

export default function Login({ onLogin }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const correctPin = await supabaseService.settings.get('adminPin', '1234');

            if (pin === correctPin) {
                sessionStorage.setItem('daytrack_auth', 'true');
                onLogin();
            } else {
                setError('Invalid PIN. Please try again.');
                setPin('');
                inputRef.current?.focus();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-box" onSubmit={handleSubmit}>
                <h1>DayTrack</h1>
                <p>Admin Productivity & Client Tracker</p>

                {error && <div className="login-error">{error}</div>}

                <input
                    ref={inputRef}
                    type="password"
                    className="pin-input"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • •"
                    maxLength={6}
                    autoComplete="off"
                />

                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    disabled={!pin || loading}
                >
                    {loading ? 'Verifying...' : 'Enter Dashboard'}
                </button>

                <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    Default PIN: 1234
                </p>
            </form>
        </div>
    );
}
