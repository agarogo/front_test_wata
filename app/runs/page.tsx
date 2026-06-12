import { useState, useEffect } from 'react';
import { getRunDetail } from '../../lib/api';
import { RunDetail } from '../../lib/types';

export default function Runs() {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would come from the URL parameter
    const runId = '12345'; // Example run ID

    async function fetchRunDetail() {
      try {
        const runData = await getRunDetail(runId);
        setRun(runData);
      } catch (error) {
        console.error('Failed to fetch run detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRunDetail();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!run) {
    return <div>Run not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Run Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="space-y-2">
            <div>
              <span className="text-muted text-sm">Gateway Sum WATA Base</span>
              <p className="font-mono">{run.gateway_sum_wata_base.toFixed(2)} RUB</p>
            </div>
            <div>
              <span className="text-muted text-sm">Conversion Commission Rate</span>
              <p className="font-mono">{run.conversion_commission_rate.toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-muted text-sm">FX Rate</span>
              <p className="font-mono">{run.fx_rate.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted text-sm">Gateway USDT Amount</span>
              <p className="font-mono">{run.gateway_usdt_amount.toFixed(2)} USDT</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Counts</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted text-sm">Gateway Missing Current</p>
              <p className="text-2xl font-bold">{run.counts.gateway_missing_current}</p>
            </div>
            <div>
              <p className="text-muted text-sm">WATA Missing Current</p>
              <p className="text-2xl font-bold">{run.counts.wata_missing_current}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Discrepancies</p>
              <p className="text-2xl font-bold">{run.counts.discrepancies}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Resolved</p>
              <p className="text-2xl font-bold">{run.counts.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <button className="bg-primary text-surface font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition-colors">
              Accept Run
            </button>
            <button className="bg-danger text-surface font-bold py-2 px-4 rounded-md hover:bg-danger-dark transition-colors">
              Delete Run
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Download Reports</h2>
          <div className="space-y-2">
            <a href="http://localhost:8100/api/v1/reconciliation/runs/12345/report.xlsx" download="report.xlsx" className="block w-full text-center py-2 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">
              Download Excel Report
            </a>
            <a href="http://localhost:8100/api/v1/reconciliation/runs/12345/report.txt" download="report.txt" className="block w-full text-center py-2 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">
              Download Text Report
            </a>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Mismatch Tabs</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">Gateway Missing Current</button>
            <button className="w-full py-2 px-4 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">WATA Missing Current</button>
            <button className="w-full py-2 px-4 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">Discrepancies</button>
            <button className="w-full py-2 px-4 bg-surface-alt rounded-md hover:bg-surface-dark transition-colors">Resolved</button>
          </div>
        </div>
      </div>
    </div>
  );
}