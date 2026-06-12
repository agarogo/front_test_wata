import { use } from 'react'
import { getRuns } from '../lib/api'

export default async function Home() {
  const runs = await getRuns()
  return (
    <div>
      <h1>Dashboard</h1>
      <form action="/api/v1/reconciliation/runs" method="POST">
        <input type="file" name="file" required />
        <button type="submit">Upload</button>
      </form>
      <div>Latest Runs: {JSON.stringify(runs)}</div>
    </div>
  )
}