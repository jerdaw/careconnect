

export default function BetaBanner() {
    return (
        <div className="bg-blue-600 px-4 py-2 text-white dark:bg-blue-800">
            <div className="mx-auto flex max-w-7xl items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold rounded bg-white/20 px-1.5 py-0.5 text-xs">PILOT</span>
                    <span className="opacity-90">
                        This is a student-led project. Data may be incomplete.
                    </span>
                </div>
                <div className="hidden sm:block">
                    <a
                        href="https://forms.gle/YOUR_GOOGLE_FORM_ID"
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-white/50 hover:decoration-white"
                    >
                        Report an Issue
                    </a>
                </div>
            </div>
        </div>
    );
}
