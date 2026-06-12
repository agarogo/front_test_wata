import Link from "next/link";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

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
          Run #{id}
        </h1>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Run Details</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            View details for run with ID: {id}
          </p>
        </div>
      </main>
    </div>
  );
}
