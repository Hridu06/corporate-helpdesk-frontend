import { formatDuration } from '../format'

function Table({ caption, columns, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <caption className="border-b border-slate-200 px-5 py-3 text-left text-base font-semibold text-slate-900">{caption}</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column, index) => (
              <th key={column} scope="col" className={`px-5 py-2 font-semibold ${index > 0 ? 'text-right' : ''}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

const Cell = ({ children }) => <td className="px-5 py-2 text-right tabular-nums">{children}</td>

/** One row per department, plus the tickets that have none. */
export function DepartmentTable({ departments }) {
  return (
    <Table caption="By department" columns={['Department', 'Created', 'Resolved', 'Open now', 'Avg resolution']}>
      {departments.map((department) => (
        <tr key={department.id}>
          <th scope="row" className="px-5 py-2 font-normal text-slate-800">
            {department.name ?? <span className="text-slate-500">No department</span>}
          </th>
          <Cell>{department.created}</Cell>
          <Cell>{department.resolved}</Cell>
          <Cell>{department.open_now}</Cell>
          <Cell>{formatDuration(department.avg_resolution_seconds)}</Cell>
        </tr>
      ))}
    </Table>
  )
}

/** One row per agent; figures follow the ticket's current assignee. */
export function AgentTable({ agents }) {
  return (
    <Table caption="By agent" columns={['Agent', 'Open now', 'Resolved', 'Avg resolution', 'Avg first response']}>
      {agents.map((agent) => (
        <tr key={agent.id}>
          <th scope="row" className="px-5 py-2 font-normal text-slate-800">
            {agent.name}
          </th>
          <Cell>{agent.open_now}</Cell>
          <Cell>{agent.resolved}</Cell>
          <Cell>{formatDuration(agent.avg_resolution_seconds)}</Cell>
          <Cell>{formatDuration(agent.avg_first_response_seconds)}</Cell>
        </tr>
      ))}
    </Table>
  )
}
