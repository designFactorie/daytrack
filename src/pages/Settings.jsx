import { useState, useEffect } from 'react';
import { Shield, Key, Download, Upload, Save, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabaseService } from '../db/supabaseService';
import { testConnection } from '../utils/ai';

export default function Settings() {
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [availableModels, setAvailableModels] = useState([]);
    const [saved, setSaved] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

    useEffect(() => {
        (async () => {
            const pinVal = await supabaseService.settings.get('adminPin');
            const keyVal = await supabaseService.settings.get('geminiApiKey');
            const modelVal = await supabaseService.settings.get('geminiModel');
            setPin(pinVal || '1234');
            setApiKey(keyVal || '');
            setSelectedModel(modelVal || 'gemini-1.5-flash');
        })();
    }, []);

    const savePin = async () => {
        if (!newPin || newPin.length < 4) return;
        await supabaseService.settings.set('adminPin', newPin);
        setPin(newPin);
        setNewPin('');
        showSaved('PIN updated successfully!');
    };

    const saveAiSettings = async () => {
        const trimmedKey = apiKey.trim();
        await supabaseService.settings.set('geminiApiKey', trimmedKey);
        await supabaseService.settings.set('geminiModel', selectedModel);
        setApiKey(trimmedKey);
        showSaved('AI settings saved!');
        setTestResult(null);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        const aiUtils = await import('../utils/ai');
        const result = await aiUtils.testConnection();

        if (result.success) {
            setTestResult({ success: true, message: 'Connection successful! Your API key and model are valid.' });
        } else {
            const modelsResult = await aiUtils.listModels();
            let msg = result.error;
            if (modelsResult.success && modelsResult.models.length > 0) {
                setAvailableModels(modelsResult.models);
                msg += '\n\nPlease select a different model from the list below and save.';
            } else if (modelsResult.error) {
                msg += '\n\nFailed to list models: ' + modelsResult.error;
            }
            setTestResult({ success: false, message: msg });
        }
        setIsTesting(false);
    };

    const showSaved = (msg) => {
        setSaved(msg);
        setTimeout(() => setSaved(''), 3000);
    };

    const exportData = async () => {
        const data = {
            clients: await supabaseService.clients.getAll(),
            employees: await supabaseService.employees.getAll(),
            tasks: await supabaseService.tasks.getAll(),
            moms: await supabaseService.moms.getAll(),
            payment_tranches: await supabaseService.tranches.getAll(),
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daytrack-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSaved('Data exported!');
    };

    const importData = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Verify data? This will add data from the backup to your current database. If IDs conflict, it might error.')) {
                    await supabaseService.importDB(data);
                    showSaved('Data imported successfully! Refresh to see changes.');
                }
            } catch (err) {
                alert('Failed to import data: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <div className="page-header">
                <h1>Settings</h1>
                <p>Configure your DayTrack preferences</p>
            </div>

            {saved && (
                <div style={{
                    background: 'var(--success-bg)', border: '1px solid var(--success)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
                    marginBottom: 'var(--space-6)', color: 'var(--success)', fontSize: 'var(--fs-sm)',
                    animation: 'fadeIn 200ms ease'
                }}>
                    ✅ {saved}
                </div>
            )}

            <div className="grid-2">
                {/* Admin PIN */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Shield size={18} style={{ marginRight: 8 }} /> Admin PIN</span>
                    </div>
                    <p className="text-sm text-muted mb-4">Current PIN: {pin.replace(/./g, '•')}</p>
                    <div className="form-group">
                        <label className="form-label">New PIN (minimum 4 digits)</label>
                        <input
                            className="form-input"
                            type="password"
                            value={newPin}
                            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="Enter new PIN"
                        />
                    </div>
                    <button className="btn btn-primary" onClick={savePin} disabled={!newPin || newPin.length < 4}>
                        <Save size={16} /> Update PIN
                    </button>
                </div>

                {/* API Key */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Key size={18} style={{ marginRight: 8 }} /> Gemini AI Settings</span>
                    </div>
                    <p className="text-sm text-muted mb-4">Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</p>

                    <div className="form-group">
                        <label className="form-label">API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="AIza..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">AI Model</label>
                        <div className="flex gap-2">
                            <select
                                className="form-select"
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                {availableModels.filter(m => !['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'].includes(m)).map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        {availableModels.length > 0 && (
                            <p style={{ fontSize: '10px', color: 'var(--success)', marginTop: '4px' }}>
                                ✨ Successfully detected {availableModels.length} models for your key.
                            </p>
                        )}
                    </div>

                    {testResult && (
                        <div style={{
                            fontSize: 'var(--fs-xs)',
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: testResult.success ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            whiteSpace: 'pre-line'
                        }}>
                            {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {testResult.message}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button className="btn btn-primary" onClick={saveAiSettings} style={{ flex: 1 }}>
                            <Save size={16} /> Save AI Settings
                        </button>
                        <button className="btn btn-secondary" onClick={handleTestConnection} disabled={!apiKey || isTesting} style={{ flex: 1 }}>
                            <Sparkles size={16} className={isTesting ? 'animate-spin' : ''} />
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>
                </div>

                {/* Export / Import */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <span className="card-title">📦 Data Backup</span>
                    </div>
                    <p className="text-sm text-muted mb-4">Export your data as JSON for backup, or import a previous backup.</p>
                    <div className="flex gap-4 items-center">
                        <button className="btn btn-secondary" onClick={exportData}>
                            <Download size={16} /> Export Data
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={importData}
                                style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%' }}
                            />
                            <button className="btn btn-secondary">
                                <Upload size={16} /> Import Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* SQL Safety Guide */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <span className="card-title text-warning"><AlertCircle size={18} style={{ marginRight: 8 }} /> SQL Safety Guide</span>
                    </div>
                    <div className="grid-2 gap-8">
                        <div>
                            <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 8 }}>❌ Avoid Destructive Scripts</h4>
                            <p className="text-sm text-muted mb-4">Never run scripts beginning with <code>DROP TABLE</code>. This permanently deletes all your records.</p>
                            <div style={{ background: 'var(--bg-body)', padding: 12, borderRadius: 8, fontSize: 11, border: '1px solid var(--border)' }}>
                                <pre style={{ color: 'var(--danger)' }}>{`-- DANGEROUS: DELETES EVERYTHING
DROP TABLE IF EXISTS public.clients;
CREATE TABLE public.clients (...);`}</pre>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 8 }}>✅ Use Safe Updates</h4>
                            <p className="text-sm text-muted mb-4">Use <code>IF NOT EXISTS</code> so you can run updates without losing existing data.</p>
                            <div style={{ background: 'var(--bg-body)', padding: 12, borderRadius: 8, fontSize: 11, border: '1px solid var(--border)' }}>
                                <pre style={{ color: 'var(--success)' }}>{`-- SAFE: PRESERVES DATA
CREATE TABLE IF NOT EXISTS public.tranches (
  id bigint GENERATED BY ...
);`}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
