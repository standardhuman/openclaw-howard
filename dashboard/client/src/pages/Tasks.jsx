import { useState, useEffect, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'

const COLUMNS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const PRIORITY_COLORS = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--accent)',
  low: 'var(--text-secondary)',
}

const AGENT_EMOJI = {
  main: '🪨', jacques: '🤿', marcel: '🎨', reese: '📐', blake: '🔍',
  noa: '🔭', kai: '🗺️', quinn: '📋', sage: '🤝', milo: '📣',
  avery: '⚖️', cyrus: '🛡️', rio: '🌊',
}

function daysSince(dateStr) {
  if (!dateStr) return ''
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  return d === 0 ? 'today' : `${d}d`
}

function TaskCard({ task, onMove, onEdit }) {
  const [dragging, setDragging] = useState(false)
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); setDragging(true) }}
      onDragEnd={() => setDragging(false)}
      onClick={() => onEdit(task)}
      className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-opacity"
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        opacity: dragging ? 0.5 : 1,
      }}
    >
      <div className="text-sm font-medium mb-1">{task.title}</div>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {task.assignee && <span>{AGENT_EMOJI[task.assignee] || '👤'} {task.assignee}</span>}
        {task.priority && (
          <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-card)', color: PRIORITY_COLORS[task.priority] }}>
            {task.priority}
          </span>
        )}
        <span>{daysSince(task.created)}</span>
      </div>
    </div>
  )
}

function Column({ col, tasks, onDrop, onEdit }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className="flex-1 min-w-[220px] rounded-xl p-3"
      style={{ background: over ? 'var(--bg-hover)' : 'var(--bg-card)', border: '1px solid var(--border)', transition: 'background 0.15s' }}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(e.dataTransfer.getData('taskId'), col.key) }}
    >
      <div className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
        {col.label}
        <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--bg-hover)' }}>{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map(t => <TaskCard key={t.id} task={t} onEdit={onEdit} />)}
      </div>
    </div>
  )
}

function NewTaskModal({ onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('medium')
  const [project, setProject] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="rounded-xl p-6 w-full max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">New Task</h2>
        <div className="space-y-3">
          <input className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Description" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {Object.entries(AGENT_EMOJI).map(([id, em]) => <option key={id} value={id}>{em} {id}</option>)}
            </select>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              value={priority} onChange={e => setPriority(e.target.value)}>
              {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Project (optional)" value={project} onChange={e => setProject(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 text-sm rounded-lg" style={{ color: 'var(--text-secondary)' }} onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm rounded-lg font-medium" style={{ background: 'var(--accent)', color: '#fff' }}
            onClick={() => { if (title.trim()) onSave({ title, description: desc, assignee: assignee || undefined, priority, project: project || undefined, status: 'backlog', created: new Date().toISOString(), id: Date.now().toString() }); }}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { data: tasksData, loading } = useFetch('/api/tasks')
  const { data: activityData } = useFetch('/api/activity', 60000)
  const [tasks, setTasks] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [editTask, setEditTask] = useState(null)

  useEffect(() => {
    if (tasksData?.tasks) setTasks(tasksData.tasks)
  }, [tasksData])

  const saveTasks = useCallback((updated) => {
    setTasks(updated)
    fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: updated }) })
  }, [])

  const handleDrop = (taskId, newStatus) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus, ...(newStatus === 'done' ? { completed: new Date().toISOString() } : {}) } : t)
    saveTasks(updated)
  }

  const handleNewTask = (task) => {
    saveTasks([...tasks, task])
    setShowNew(false)
  }

  const activity = activityData?.activity || []

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading tasks…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button className="px-4 py-2 text-sm rounded-lg font-medium" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => setShowNew(true)}>
          + New Task
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <Column key={col.key} col={col} tasks={tasks.filter(t => t.status === col.key)} onDrop={handleDrop} onEdit={setEditTask} />
        ))}
      </div>

      {activity.length > 0 && (
        <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold mb-3">Recent Activity</div>
          <div className="space-y-2">
            {activity.slice(0, 20).map((a, i) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <span>{a.emoji || '📌'}</span>
                <span className="flex-1">{a.text || a.description || JSON.stringify(a)}</span>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{a.ago || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew && <NewTaskModal onClose={() => setShowNew(false)} onSave={handleNewTask} />}
    </div>
  )
}
