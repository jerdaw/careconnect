'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
// import { useTranslations } from 'next-intl';

export default function LoginPage() {
    // const t = useTranslations('Common'); // Reserved for future use
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    // Redirect to dashboard after login
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Magic link sent! Check your email to sign in.'
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Partner Login
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Manage your service listing
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="relative block w-full rounded-md border-0 py-3 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700"
                            placeholder="name@organization.org"
                        />
                    </div>

                    {message && (
                        <div className={`rounded-md p-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {message.text}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
