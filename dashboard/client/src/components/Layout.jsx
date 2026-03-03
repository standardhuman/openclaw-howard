import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { path: '/tasks', label: 'Tasks', icon: '📋' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/projects', label: 'Projects', icon: '🚀' },
  { path: '/memory', label: 'Memory', icon: '🧠' },
  { path: '/docs', label: 'Docs', icon: '📄' },
  { path: '/team', label: 'Team', icon: '👥' },
  { path: '/system', label: 'System', icon: '⚙️' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 60 : 220,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-4 py-5 cursor-pointer select-none"
          onClick={() => setCollapsed(c => !c)}
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-xl">⚓</span>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Mission Control
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'font-medium' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer status */}
        <div
          className="px-4 py-3 text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: status?.ok ? 'var(--success)' : 'var(--danger)' }}
            />
            {!collapsed && <span>{status?.ok ? 'Online' : 'Offline'}</span>}
          </div>
          {!collapsed && <div className="mt-1">13 agents</div>}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
