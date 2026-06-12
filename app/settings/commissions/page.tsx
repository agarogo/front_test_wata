import Link from "next/link";

export default function CommissionsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6">
        <div className="mb-8">
          <Link
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-black dark:text-white mb-8">
          Commission Settings
        </h1>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configure Commissions</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your commission rates and settings here.
          </p>
        </div>
      </main>
    </div>
  );
}
