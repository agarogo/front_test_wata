import { use } from 'react'
import { getRuns } from '../../lib/api'

export default async function RunsPage() {
  const runs = await getRuns()
  return (
    <div>
      <h1>Runs</h1>
      {runs.map(run => (
        <div key={run.id}>
          <a href={`/runs/${run.id}`}>{run.id}</a>
        </div>
      ))}
    </div>
  )
}