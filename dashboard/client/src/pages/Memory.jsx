import { useState, useEffect } from 'react'
import { useFetch } from '../hooks/useFetch'
import Markdown from 'react-markdown'

const AGENTS = ['all', 'main', 'jacques', 'marcel', 'reese', 'blake', 'noa', 'kai', 'quinn', 'sage', 'milo', 'avery', 'cyrus', 'rio']

function StaleBadge({ days }) {
  if (days <= 1) return <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--success)' }} />
  if (days <= 7) return <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--warning)' }} />
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--danger)' }} />
}

export default function MemoryPage() {
  const [tab, setTab] = useState('daily')
  const [agentFilter, setAgentFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(null)
  const [noteContent, setNoteContent] = useState(null)

  const { data: datesData } = useFetch('/api/memory/dates')
  const { data: stalenessData } = useFetch('/api/memory/staleness')
  const { data: longtermList } = useFetch('/api/memory/longterm')
  const [longtermContent, setLongtermContent] = useState(null)
  const [longtermAgent, setLongtermAgent] = useState(null)

  const dates = datesData?.dates || []
  const stale = stalenessData?.stale || []

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0])
  }, [dates, selectedDate])

  useEffect(() => {
    if (selectedDate && tab === 'daily') {
      const url = agentFilter === 'all'
        ? `/api/memory/daily?date=${selectedDate}`
        : `/api/memory/daily?date=${selectedDate}&agent=${agentFilter}`
      fetch(url).then(r => r.json()).then(d => setNoteContent(d.notes || [])).catch(() => setNoteContent([]))
    }
  }, [selectedDate, agentFilter, tab])

  const loadLongterm = (agent) => {
    setLongtermAgent(agent)
    fetch(`/api/memory/longterm/${agent}`).then(r => r.json()).then(d => setLongtermContent(d.content || 'No content')).catch(() => setLongtermContent('Error loading'))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Memory</h1>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          {['daily', 'longterm'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1 text-xs rounded-md capitalize"
              style={{ background: tab === t ? 'var(--bg-hover)' : 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {t === 'longterm' ? 'Long-term' : 'Daily'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'daily' ? (
        <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
          {/* Date sidebar */}
          <div className="w-48 shrink-0 overflow-y-auto rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="mb-3">
              <select className="w-full rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                {AGENTS.map(a => <option key={a} value={a}>{a === 'all' ? 'All agents' : a}</option>)}
              </select>
            </div>
            {dates.map(d => (
              <div key={d} onClick={() => setSelectedDate(d)}
                className="px-2 py-1.5 rounded cursor-pointer text-sm transition-colors"
                style={{ background: selectedDate === d ? 'var(--bg-hover)' : 'transparent', color: selectedDate === d ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {noteContent === null ? (
              <div style={{ color: 'var(--text-secondary)' }}>Select a date</div>
            ) : noteContent.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No notes for this date</div>
            ) : (
              noteContent.map((note, i) => (
                <div key={i} className="mb-6">
                  <div className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    {note.agent} — {note.filename}
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{note.wordCount} words</span>
                  </div>
                  <div className="markdown-content">
                    <Markdown>{note.content}</Markdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
          {/* Agent list */}
          <div className="w-48 shrink-0 overflow-y-auto rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Agents</div>
            {(longtermList?.files || []).map(f => {
              const staleInfo = stale.find(s => s.agent === f.agent)
              return (
                <div key={f.agent} onClick={() => loadLongterm(f.agent)}
                  className="px-2 py-1.5 rounded cursor-pointer text-sm flex items-center gap-2 transition-colors"
                  style={{ background: longtermAgent === f.agent ? 'var(--bg-hover)' : 'transparent', color: longtermAgent === f.agent ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {staleInfo && <StaleBadge days={staleInfo.daysSinceUpdate} />}
                  <span>{f.agent}</span>
                </div>
              )
            })}

            {stale.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Freshness</div>
                <div className="space-y-1">
                  <div className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} /> Today ({stale.filter(s => s.daysSinceUpdate <= 1).length})</div>
                  <div className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--warning)' }} /> This week ({stale.filter(s => s.daysSinceUpdate > 1 && s.daysSinceUpdate <= 7).length})</div>
                  <div className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} /> Stale ({stale.filter(s => s.daysSinceUpdate > 7).length})</div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {longtermContent ? (
              <div className="markdown-content">
                <Markdown>{longtermContent}</Markdown>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>Select an agent to view MEMORY.md</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
