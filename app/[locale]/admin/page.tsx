'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Save, RefreshCw } from 'lucide-react';
import { Service, IntentCategory, VerificationLevel } from '../../../types/service';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<string>('');

    // 1. Fetch Data on Load
    useEffect(() => {
        // In a real app, we'd fetch from an API. 
        // Here, we just import the JSON for initial view, 
        // BUT to get "write" capability we likely need to fetch from an endpoint 
        // that reads the file fresh.
        fetch('/api/admin/data')
            .then(res => res.json() as Promise<{ services: Service[] }>)
            .then(data => {
                setServices(data.services);
                setIsLoading(false);
            })
            .catch(() => {
                setStatus('Error loading data. Are you in Dev mode?');
                setIsLoading(false);
            });
    }, []);

    const handleSave = async (service: Service) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service }),
            });
            if (!res.ok) throw new Error('Failed to save');

            // Update local state
            setServices(prev => prev.map(s => s.id === service.id ? service : s));
            setStatus('Saved successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch {
            setStatus('Error saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReindex = async () => {
        setStatus('Re-indexing... might take a minute.');
        try {
            const res = await fetch('/api/admin/reindex', { method: 'POST' });
            if (!res.ok) throw new Error('Reindex failed');
            setStatus('Re-indexing Complete! Embeddings updated.');
        } catch {
            setStatus('Re-indexing failed check console.');
        }
    };

    if (isLoading) return <div className="p-8">Loading Admin...</div>;

    return (
        <main className="min-h-screen bg-neutral-100 p-8 dark:bg-neutral-900">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard 🛠️</h1>
                <div className="flex gap-4">
                    <span className="text-sm text-red-500 font-mono">{status}</span>
                    <Button
                        variant="secondary"
                        onClick={handleReindex}
                    >
                        <RefreshCw className="h-4 w-4" /> Re-Index AI
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* List Column */}
                <div className="space-y-4 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-neutral-500">All Services ({services.length})</h2>
                        <Button
                            variant="default"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setSelectedService({
                                id: 'new-' + Date.now(),
                                name: 'New Service',
                                description: '',
                                url: '',
                                phone: '',
                                address: '',
                                intent_category: IntentCategory.Food,
                                verification_level: VerificationLevel.L0,
                                synthetic_queries: [],
                                identity_tags: [],
                                provenance: {
                                    verified_by: 'admin',
                                    verified_at: new Date().toISOString(),
                                    evidence_url: '',
                                    method: 'manual-entry'
                                }
                            })}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="h-[80vh] overflow-y-auto space-y-2 pr-2">
                        {services.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedService(s)}
                                className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${selectedService?.id === s.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950'}`}
                            >
                                <div className="font-medium">{s.name}</div>
                                <div className="text-neutral-400">{s.intent_category}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Column */}
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-950 lg:col-span-2">
                    {selectedService ? (
                        <ServiceEditor
                            service={selectedService}
                            onSave={handleSave}
                            isSaving={isSaving}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-neutral-400">
                            Select a service to edit
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

// Simple Sub-component for form
function ServiceEditor({ service, onSave, isSaving }: { service: Service, onSave: (s: Service) => void, isSaving: boolean }) {
    const [formData, setFormData] = useState(service);

    // Reset form when selection changes
    useEffect(() => {
        setFormData(service);
    }, [service]);

    const handleChange = (field: keyof Service, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <span className="text-xs font-mono text-neutral-400">ID: {formData.id}</span>
                <Button
                    onClick={() => onSave(formData)}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-500">Name</label>
                    <input
                        className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-500">Description</label>
                    <textarea
                        className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                        rows={4}
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500">Category</label>
                        <select
                            className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                            value={formData.intent_category}
                            onChange={e => handleChange('intent_category', e.target.value)}
                        >
                            {Object.values(IntentCategory).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500">Keywords (Comma sep)</label>
                        <input
                            className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                            value={formData.synthetic_queries.join(', ')}
                            onChange={e => setFormData(p => ({ ...p, synthetic_queries: e.target.value.split(',').map(s => s.trim()) }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500">Website URL</label>
                        <input
                            className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                            value={formData.url}
                            onChange={e => handleChange('url', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500">Address</label>
                        <input
                            className="mt-1 block w-full rounded border-neutral-300 dark:bg-neutral-900"
                            value={formData.address || ''}
                            onChange={e => handleChange('address', e.target.value)}
                        />
                    </div>
                </div>
                {/* Add other fields as needed for MVP */}
            </div>
        </div>
    );
}
