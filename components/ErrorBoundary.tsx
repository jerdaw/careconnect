'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                        Something went wrong
                    </h2>
                    <p className="mb-6 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
                        We encountered an unexpected error. Please try reloading the page.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="default"
                    >
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
