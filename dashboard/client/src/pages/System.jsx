import { useFetch } from '../hooks/useFetch'

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl p-5 ${className}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

function CostBar({ label, value, max, color = 'var(--accent)' }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 truncate" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--bg-hover)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 text-right font-medium">${typeof value === 'number' ? value.toFixed(0) : value}</span>
    </div>
  )
}

function CronRow({ job }) {
  const statusColor = job.lastStatus === 'ok' ? 'var(--success)' : job.lastStatus === 'error' ? 'var(--danger)' : 'var(--text-secondary)'
  return (
    <div className="flex items-center gap-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
      <span className="flex-1 truncate">{job.name}</span>
      <span className="text-xs w-20" style={{ color: 'var(--text-secondary)' }}>{job.lastRunAgo || '—'}</span>
      <span className="text-xs w-24 text-right" style={{ color: 'var(--text-secondary)' }}>{job.scheduleLabel || '—'}</span>
    </div>
  )
}

export default function SystemPage() {
  const { data: statusData } = useFetch('/api/status', 60000)
  const { data: costsData } = useFetch('/api/system/costs', 60000)
  const { data: cronData } = useFetch('/api/cron', 60000)

  const costs = costsData?.costs || {}
  const infra = costsData?.infrastructure || []
  const costsByAgent = costsData?.costsByAgent || []
  const costsByModel = costsData?.costsByModel || []
  const infraHosting = costsData?.infrastructure?.hosting || []
  const infraServices = costsData?.infrastructure?.services || []
  const infraAll = [...infraHosting, ...infraServices]
  const cron = cronData?.jobs || []
  const maxAgentCost = Math.max(...costsByAgent.map(c => c.cost), 1)
  const maxModelCost = Math.max(...costsByModel.map(c => c.cost), 1)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">System</h1>

      {/* Gateway Status */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusData?.ok ? 'var(--success)' : 'var(--danger)' }} />
          <span className="font-semibold">{statusData?.ok ? 'Online' : 'Offline'}</span>
          {statusData?.hostname && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>— {statusData.hostname}</span>}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {statusData?.uptime && <span>Uptime: {statusData.uptime}</span>}
          {statusData?.version && <span>Version: {statusData.version}</span>}
          {statusData?.activeSessions != null && <span>Sessions: {statusData.activeSessions}</span>}
          {statusData?.channels && <span>Channels: {statusData.channels.join(', ')}</span>}
        </div>
      </Card>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Monthly Spend</div>
          <div className="text-3xl font-bold mb-1">${costs.actual?.toFixed(0) || '—'}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Target: ${costs.target || 500}/mo</div>
          {costs.actual && costs.target && (
            <div className="mt-2 h-2 rounded-full" style={{ background: 'var(--bg-hover)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min((costs.actual / costs.target) * 100, 100)}%`, background: costs.actual > costs.target ? 'var(--danger)' : 'var(--accent)' }} />
            </div>
          )}
        </Card>
        <Card>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>API Equivalent Value</div>
          <div className="text-3xl font-bold mb-1">${costs.apiEquivalent?.toFixed(0) || '—'}</div>
          <div className="text-xs" style={{ color: 'var(--success)' }}>Savings: ${costs.savings?.toFixed(0) || '—'}/mo via Max 20X</div>
        </Card>
      </div>

      {/* Cost Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="text-sm font-semibold mb-3">Cost by Agent</div>
          <div className="space-y-2">
            {costsByAgent.map(c => (
              <CostBar key={c.agent || c.name} label={c.agent || c.name} value={c.cost} max={maxAgentCost} />
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold mb-3">Cost by Model</div>
          <div className="space-y-2">
            {costsByModel.map(c => (
              <CostBar key={c.name} label={c.name} value={c.cost} max={maxModelCost} color="var(--purple)" />
            ))}
          </div>
        </Card>
      </div>

      {/* Infrastructure */}
      {infraAll.length > 0 && (
        <Card className="mb-6">
          <div className="text-sm font-semibold mb-3">Infrastructure</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {infraAll.map(item => (
              <div key={item.name} className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-lg font-bold">${item.cost}</div>
                {item.detail && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.detail}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cron Health */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Cron Health</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {cron.length} jobs · {cron.filter(j => j.enabled).length} enabled · {cron.filter(j => j.lastStatus === 'error').length} errored
          </div>
        </div>
        <div>
          {cron.map(job => <CronRow key={job.id} job={job} />)}
        </div>
      </Card>
    </div>
  )
}
