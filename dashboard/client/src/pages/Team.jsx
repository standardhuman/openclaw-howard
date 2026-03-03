import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'

const TEAM_GROUPS = [
  { key: 'Core Team', label: 'Core Team' },
  { key: 'Scheduled Crew', label: 'Scheduled Crew' },
  { key: 'On-Demand', label: 'On-Demand Crew' },
]

function StatusDot({ status }) {
  const color = status === 'active' ? 'var(--success)' : 'var(--text-secondary)'
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
}

function AgentCardFull({ agent }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors cursor-default"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{agent.name}</span>
            <StatusDot status={agent.status} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{agent.role}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{agent.station}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-lg p-2" style={{ background: 'var(--bg-hover)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cost</div>
          <div className="text-sm font-medium">${agent.costThisMonth?.toFixed(0) || 0}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--bg-hover)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tasks</div>
          <div className="text-sm font-medium">{agent.tasksCompleted || 0}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--bg-hover)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last</div>
          <div className="text-sm font-medium">{agent.lastActive || '—'}</div>
        </div>
      </div>

      {agent.currentTask && (
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--accent)' }}>Doing:</span>{' '}
          {agent.currentTask.slice(0, 60)}{agent.currentTask.length > 60 ? '…' : ''}
        </div>
      )}
    </div>
  )
}

function AgentCardCompact({ agent }) {
  return (
    <div
      className="rounded-xl p-4 transition-colors cursor-default"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{agent.emoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{agent.name}</span>
            <StatusDot status={agent.status} />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{agent.role}</div>
        </div>
      </div>
      {agent.costThisMonth > 0 && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          ${agent.costThisMonth?.toFixed(0)} · {agent.lastActive || '—'}
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  const { data, loading } = useFetch('/api/agents', 60000)
  const [view, setView] = useState('grid')
  const agents = data?.agents || []

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading team…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Team</h1>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          {['grid', 'org'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 text-xs rounded-md capitalize transition-colors"
              style={{
                background: view === v ? 'var(--bg-hover)' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {v === 'org' ? 'Org Chart' : 'Grid'}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="space-y-8">
          {TEAM_GROUPS.map(group => {
            const members = agents.filter(a => a.team === group.key)
            if (!members.length) return null
            const isCore = group.key === 'Core Team'
            return (
              <div key={group.key}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {group.label}
                </h2>
                <div className={`grid gap-4 ${isCore ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                  {members.map(a => isCore ? <AgentCardFull key={a.name} agent={a} /> : <AgentCardCompact key={a.name} agent={a} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <OrgChart agents={agents} />
      )}
    </div>
  )
}

function OrgChart({ agents }) {
  const findAgent = name => agents.find(a => a.name === name)

  const Node = ({ name, sub }) => {
    const a = findAgent(name)
    if (!a) return null
    return (
      <div className="flex flex-col items-center">
        <div
          className="rounded-xl px-4 py-2 text-center text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: 120 }}
        >
          <div>{a.emoji} {a.name}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.role}</div>
        </div>
        {sub && sub.length > 0 && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <div className="flex gap-4 items-start">
              {sub.map((child, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-px h-4" style={{ background: 'var(--border)' }} />
                  {typeof child === 'string' ? <Node name={child} /> : <Node {...child} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex justify-center overflow-x-auto py-8">
      <Node
        name="Howard"
        sub={[
          { name: 'Jacques', sub: ['Blake'] },
          { name: 'Marcel', sub: ['Milo'] },
          { name: 'Reese' },
          { name: 'Noa' },
          { name: 'Kai' },
          { name: 'Quinn', sub: ['Sage'] },
          { name: 'Avery' },
          { name: 'Cyrus' },
          { name: 'Rio' },
        ]}
      />
    </div>
  )
}
