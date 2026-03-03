import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import Markdown from 'react-markdown'

const CATEGORY_LABELS = {
  plans: '📁 Plans',
  specs: '📁 Specs',
  research: '📁 Research',
  cases: '📁 Cases',
  bugs: '📁 Bugs',
  obsidian: '📁 Obsidian',
  other: '📁 Other',
}

export default function DocsPage() {
  const { data, loading } = useFetch('/api/docs')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docContent, setDocContent] = useState(null)

  const docs = data?.docs || []

  const filtered = useMemo(() => {
    let f = docs
    if (catFilter !== 'all') f = f.filter(d => d.category === catFilter)
    if (search) {
      const q = search.toLowerCase()
      f = f.filter(d => d.name.toLowerCase().includes(q) || (d.preview || '').toLowerCase().includes(q))
    }
    return f
  }, [docs, catFilter, search])

  const grouped = useMemo(() => {
    const g = {}
    for (const doc of filtered) {
      const cat = doc.category || 'other'
      if (!g[cat]) g[cat] = []
      g[cat].push(doc)
    }
    return g
  }, [filtered])

  const categories = useMemo(() => {
    const cats = new Set(docs.map(d => d.category))
    return ['all', ...Array.from(cats).sort()]
  }, [docs])

  const openDoc = async (doc) => {
    setSelectedDoc(doc)
    try {
      const r = await fetch(`/api/docs/content?path=${encodeURIComponent(doc.path)}`)
      const d = await r.json()
      setDocContent(d.content || 'No content')
    } catch {
      setDocContent('Error loading document')
    }
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading docs…</div>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Docs</h1>

      <div className="mb-4">
        <input
          className="w-full rounded-lg px-4 py-2.5 text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          placeholder="🔍 Search docs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className="px-3 py-1 text-xs rounded-lg capitalize"
            style={{ background: catFilter === cat ? 'var(--accent)' : 'var(--bg-card)', color: catFilter === cat ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
        {/* File list */}
        <div className={`overflow-y-auto ${selectedDoc ? 'w-1/3' : 'w-full'}`}>
          {Object.entries(grouped).map(([cat, files]) => (
            <div key={cat} className="mb-4">
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                {CATEGORY_LABELS[cat] || `📁 ${cat}`} ({files.length})
              </div>
              {files.map(doc => (
                <div key={doc.path} onClick={() => openDoc(doc)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
                  style={{ background: selectedDoc?.path === doc.path ? 'var(--bg-hover)' : 'transparent' }}>
                  <span className="truncate">{doc.name}</span>
                  <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {doc.lastModified ? new Date(doc.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {(doc.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Doc viewer */}
        {selectedDoc && (
          <div className="flex-1 overflow-y-auto rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{selectedDoc.name}</h2>
              <button onClick={() => { setSelectedDoc(null); setDocContent(null) }} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="markdown-content">
              <Markdown>{docContent || 'Loading…'}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
