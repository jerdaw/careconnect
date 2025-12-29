export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-blue-800">
          Kingston Care Connect
        </h1>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <span className="flex place-items-center gap-2 p-8 lg:p-0">
            System Status: <span className="text-green-600 font-bold">Online</span>
          </span>
        </div>
      </div>
    </main>
  )
}
