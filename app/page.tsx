import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-8">
          Onlipay Dashboard
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Welcome to Onlipay. Manage your runs and settings from here.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/runs"
            className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Runs</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              View and manage your payment runs
            </p>
          </Link>
          <Link
            href="/settings/commissions"
            className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Commissions</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Configure commission settings
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
