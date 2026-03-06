// Direct REST API wrapper — avoids Supabase JS client which ad blockers interfere with
const BASE = 'https://aaxnoeirtjlizdhnbqbr.supabase.co/rest/v1'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheG5vZWlydGpsaXpkaG5icWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODM5MzYsImV4cCI6MjA3ODM1OTkzNn0.VNi_UCqEiUAM8AoAtH1QrPJUocJILq28a3RV-W1qyII'

const hdrs = (extra) => ({
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  ...extra,
})

function makeChain(table) {
  let filters = []
  let method = 'GET'
  let body = null
  let selectCols = '*'

  const chain = {
    select(cols = '*') { selectCols = cols; method = 'GET'; return chain },
    order(col) { filters.push(`order=${col}.asc`); return chain },
    eq(col, val) { filters.push(`${col}=eq.${val}`); return chain },
    limit(n) { filters.push(`limit=${n}`); return chain },
    insert(data) { method = 'POST'; body = JSON.stringify(data); return chain },
    update(data) { method = 'PATCH'; body = JSON.stringify(data); return chain },

    async _exec() {
      const qs = method === 'GET' ? [`select=${selectCols}`, ...filters] : filters
      const url = `${BASE}/${table}?${qs.join('&')}`
      try {
        const res = await fetch(url, {
          method,
          headers: hdrs(method !== 'GET' ? { 'Prefer': 'return=minimal' } : {}),
          body,
        })
        if (!res.ok) {
          const t = await res.text()
          return { data: null, error: { message: t, status: res.status } }
        }
        if (method !== 'GET') return { data: null, error: null }
        return { data: await res.json(), error: null }
      } catch (e) {
        return { data: null, error: { message: e.message } }
      }
    },

    then(resolve, reject) { return chain._exec().then(resolve, reject) },
  }
  return chain
}

export const supabase = {
  from(table) { return makeChain(table) },
}

export function getSupabase() { return supabase }
