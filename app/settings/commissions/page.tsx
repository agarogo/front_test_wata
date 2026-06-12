import { use } from 'react'
import { getCommissionGroups, updateCommissionGroup, resetCommissionGroups } from '../../lib/api'

export default async function CommissionsPage() {
  const groups = await getCommissionGroups()
  return (
    <div>
      <h1>Commission Groups</h1>
      <table>
        <tbody>
          {groups.map(group => (
            <tr key={group.id}>
              <td>{group.id}</td>
              <td>{group.rate}</td>
              <td>{group.min_commission}</td>
              <td>{group.fixed_commission}</td>
              <td>
                <input type="number" defaultValue={group.rate} />
                <button onClick={() => updateCommissionGroup(group.id, { rate: 0.1 })}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => resetCommissionGroups()}>Reset</button>
    </div>
  )
}