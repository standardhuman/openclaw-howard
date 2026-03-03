import { useFetch } from '../hooks/useFetch'
import { useState } from 'react'

const STATUS_COLORS = {
  'active': 'var(--success)',
  'in-progress': 'var(--accent)',
  'planning': 'var(--warning)',
  'paused': 'var(--text-secondary)',
  'completed': 'var(--success)',
}

function ProgressBar({ pct }) {
  return (
    <div className="h-2 rounded-full mt-2" style={{ background: 'var(--bg-hover)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--success)' : 'var(--accent)' }} />
    </div>
  )
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="rounded-xl p-5 cursor-pointer transition-colors"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-lg mr-2">{project.icon || '📁'}</span>
          <span className="font-semibold">{project.name}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: STATUS_COLORS[project.status] || 'var(--text-secondary)' }}>
          {project.status}
        </span>
      </div>

      <ProgressBar pct={project.progress || 0} />
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{project.progress || 0}%</div>

      {project.metric && <div className="text-sm mt-2" style={{ color: 'var(--accent)' }}>{project.metric}</div>}
      {project.lead && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Lead: {project.lead}</div>}

      {expanded && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {project.nextAction && <div className="text-sm mb-2"><span className="font-medium">Next:</span> {project.nextAction}</div>}

          {project.checklist?.length > 0 && (
            <div className="space-y-1 mb-3">
              {project.checklist.map((c, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <span>{c.done ? '✅' : '⬜'}</span>
                  <span style={{ color: c.done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.text}</span>
                </div>
              ))}
            </div>
          )}

          {project.recentActivity?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Recent</div>
              {project.recentActivity.map((a, i) => <div key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>· {a}</div>)}
            </div>
          )}

          {project.docs?.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Docs</div>
              {project.docs.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noreferrer" className="text-xs block hover:underline" style={{ color: 'var(--accent)' }}>📄 {d.label}</a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  const { data, loading } = useFetch('/api/projects', 60000)
  const [filter, setFilter] = useState('active')
  const projects = data?.projects || []
  const filtered = filter === 'all' ? projects : projects.filter(p => !['completed', 'paused'].includes(p.status))

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading projects…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          {['active', 'all'].map(v => (
            <button key={v} onClick={() => setFilter(v)} className="px-3 py-1 text-xs rounded-md capitalize"
              style={{ background: filter === v ? 'var(--bg-hover)' : 'transparent', color: filter === v ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => <ProjectCard key={p.name} project={p} />)}
      </div>
    </div>
  )
}
