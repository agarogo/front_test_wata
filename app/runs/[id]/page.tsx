import { use } from 'react'
import { getRun, getRunCounts } from '../../lib/api'

export default async function RunDetail({ params }) {
  const { id } = params
  const run = await getRun(id)
  const counts = await getRunCounts(id)
  return (
    <div>
      <h1>{run.status}</h1>
      <div>Summary: {JSON.stringify(run)}</div>
      <div>Counts: {JSON.stringify(counts)}</div>
      <a href={`/runs/${id}/report.xlsx`}>Download XLSX</a>
      <a href={`/runs/${id}/report.txt`}>Download TXT</a>
      <button onClick={() => acceptRun(id)}>Accept</button>
    </div>
  )
}