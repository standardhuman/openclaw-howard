import { useMemo, useState } from 'react'
import { useFetch } from '../hooks/useFetch'

const CATEGORY_COLORS = {
  briefing: '#00bcd4',
  research: '#9d4edd',
  memory: '#06d6a0',
  maintenance: '#ffd166',
  data: '#ff6b6b',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function parseCronExpr(expr) {
  // Basic cron parser: minute hour dom month dow
  if (!expr) return null
  const parts = expr.trim().split(/\s+/)
  if (parts.length < 5) return null
  const minute = parseInt(parts[0])
  const hour = parseInt(parts[1])
  const dow = parts[4] // day of week
  if (isNaN(minute) || isNaN(hour)) return null
  // Parse which days (0=Sun, 1=Mon, ..., 6=Sat; or * for all)
  let days = [0, 1, 2, 3, 4, 5, 6]
  if (dow !== '*') {
    days = dow.split(',').flatMap(d => {
      if (d.includes('-')) {
        const [a, b] = d.split('-').map(Number)
        return Array.from({ length: b - a + 1 }, (_, i) => a + i)
      }
      return [parseInt(d)]
    })
  }
  // Convert to Mon=0 format (cron uses 0=Sun)
  const monDays = days.map(d => d === 0 ? 6 : d - 1)
  return { hour, minute, days: monDays }
}

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function CalendarPage() {
  const { data, loading } = useFetch('/api/cron', 60000)
  const [weekOffset, setWeekOffset] = useState(0)
  const jobs = data?.jobs || []
  const weekDates = getWeekDates(weekOffset)

  const slots = useMemo(() => {
    // Map jobs to {dayIndex (0=Mon), hour, minute, job}
    const s = []
    for (const job of jobs) {
      if (!job.enabled) continue
      const parsed = parseCronExpr(job.schedule?.expr)
      if (parsed) {
        for (const dayIdx of parsed.days) {
          s.push({ dayIdx, hour: parsed.hour, minute: parsed.minute, job })
        }
      } else if (job.schedule?.kind === 'every' && job.schedule?.everyMs) {
        // Interval jobs — show at each occurrence (max 24 per day)
        const intervalH = job.schedule.everyMs / 3600000
        if (intervalH >= 1) {
          for (let h = 0; h < 24; h += intervalH) {
            for (let d = 0; d < 7; d++) {
              s.push({ dayIdx: d, hour: Math.floor(h), minute: Math.round((h % 1) * 60), job })
            }
          }
        }
      }
    }
    return s
  }, [jobs])

  const weekLabel = `Week of ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading calendar…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{weekLabel}</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 text-xs rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }} onClick={() => setWeekOffset(o => o - 1)}>◀</button>
            <button className="px-2 py-1 text-xs rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }} onClick={() => setWeekOffset(0)}>Today</button>
            <button className="px-2 py-1 text-xs rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }} onClick={() => setWeekOffset(o => o + 1)}>▶</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded" style={{ background: color }} />
            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: 800 }}>
          {/* Header */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }} />
          {DAYS.map((day, i) => (
            <div key={day} className="p-2 text-center text-xs font-semibold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {day} {weekDates[i]?.getDate()}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <>
              <div key={`label-${hour}`} className="p-1 text-right text-xs pr-2" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              {DAYS.map((_, dayIdx) => {
                const cellSlots = slots.filter(s => s.dayIdx === dayIdx && s.hour === hour)
                return (
                  <div key={`${hour}-${dayIdx}`} className="p-0.5 min-h-[28px] relative" style={{ borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                    {cellSlots.map((s, i) => (
                      <div
                        key={i}
                        className="text-xs px-1 py-0.5 rounded truncate mb-0.5"
                        title={`${s.job.name} (${s.job.category})\n${s.hour.toString().padStart(2, '0')}:${s.minute.toString().padStart(2, '0')}`}
                        style={{ background: CATEGORY_COLORS[s.job.category] + '30', color: CATEGORY_COLORS[s.job.category], fontSize: 10 }}
                      >
                        {s.job.name?.split(' ').slice(0, 2).join(' ') || s.job.id}
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
