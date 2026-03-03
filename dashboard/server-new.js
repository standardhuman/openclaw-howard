const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const url = require('url');

const PORT = 3333;
const HOST = '0.0.0.0';
const DIR = __dirname;
const HOME = require('os').homedir();

const DIST_DIR = path.join(DIR, 'dist');
const DATA_FILE = path.join(DIR, 'data.json');
const CURATED_FILE = path.join(DIR, 'data-curated.json');
const TASKS_FILE = path.join(DIR, 'tasks.json');

// Agent workspace directories
const AGENT_DIRS = {
  main: path.join(HOME, 'clawd'),
  jacques: path.join(HOME, 'clawd-jacques'),
  marcel: path.join(HOME, 'clawd-marcel'),
  reese: path.join(HOME, 'clawd-reese'),
  blake: path.join(HOME, 'clawd-blake'),
  noa: path.join(HOME, 'clawd-noa'),
  kai: path.join(HOME, 'clawd-kai'),
  quinn: path.join(HOME, 'clawd-quinn'),
  sage: path.join(HOME, 'clawd-sage'),
  milo: path.join(HOME, 'clawd-milo'),
  avery: path.join(HOME, 'clawd-avery'),
  cyrus: path.join(HOME, 'clawd-cyrus'),
  rio: path.join(HOME, 'clawd-rio'),
};

const DOCS_ROOTS = [
  { root: path.join(HOME, 'clawd/docs'), source: 'clawd' },
  { root: path.join(HOME, "Obsidian/Brian's Vault"), source: 'obsidian' },
];

const MIME = {
  '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Caching
let _cache = {};
function cached(key, ttlMs, fn) {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < ttlMs) return _cache[key].data;
  const data = fn();
  _cache[key] = { data, ts: now };
  return data;
}

function readJSON(filepath) {
  try { return JSON.parse(fs.readFileSync(filepath, 'utf-8')); } catch { return null; }
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function gwRPC(method) {
  try {
    const out = execSync(`openclaw gateway call ${method} --json 2>/dev/null`, { timeout: 10000 }).toString();
    return JSON.parse(out);
  } catch { return null; }
}

function categorizeJob(name) {
  const n = (name || '').toLowerCase();
  if (/dawn|debrief|notebook|pulse|staging/.test(n)) return 'briefing';
  if (/research|noa/.test(n)) return 'research';
  if (/memory|sync|voice|checkpoint|capture/.test(n)) return 'memory';
  if (/dashboard|backup|collect/.test(n)) return 'maintenance';
  return 'data';
}

function timeAgo(ms) {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function scanDir(dir, ext = '.md') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        results.push(...scanDir(full, ext));
      } else if (e.isFile() && e.name.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

function safePath(requestedPath, allowedRoots) {
  const resolved = path.resolve(requestedPath);
  return allowedRoots.some(root => resolved.startsWith(path.resolve(root)));
}

// ---- API Routes ----

function handleAPI(req, res, pathname, query) {
  // GET /api/status
  if (pathname === '/api/status') {
    const data = readJSON(DATA_FILE);
    const status = cached('gw-status', 30000, () => gwRPC('status'));
    return json(res, {
      ok: true,
      hostname: status?.hostname || 'Brians-Mac-mini.local',
      uptime: status?.uptime || '—',
      version: status?.version || '—',
      activeSessions: status?.activeSessions ?? data?.agents?.filter(a => a.status === 'active').length ?? 0,
      channels: status?.channels || ['Telegram', 'Slack', 'Webchat'],
    });
  }

  // GET /api/agents
  if (pathname === '/api/agents') {
    const data = readJSON(DATA_FILE);
    return json(res, { agents: data?.agents || [] });
  }

  // GET /api/activity
  if (pathname === '/api/activity') {
    const data = readJSON(DATA_FILE);
    return json(res, { activity: data?.recentActivity || [] });
  }

  // GET /api/projects
  if (pathname === '/api/projects') {
    const curated = readJSON(CURATED_FILE);
    return json(res, { projects: curated?.projects || [] });
  }

  // GET/PUT /api/tasks
  if (pathname === '/api/tasks') {
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
          json(res, { ok: true });
        } catch (e) {
          json(res, { error: e.message }, 400);
        }
      });
      return;
    }
    const tasks = readJSON(TASKS_FILE);
    return json(res, { tasks: tasks?.tasks || [] });
  }

  // GET /api/cron
  if (pathname === '/api/cron') {
    const cronData = cached('cron-list', 60000, () => gwRPC('cron.list'));
    const jobs = (cronData?.jobs || []).map(j => ({
      id: j.id || j.jobId,
      name: j.name || j.id || '(unnamed)',
      agentId: j.sessionTarget === 'isolated' ? (j.payload?.agentId || '—') : 'main',
      enabled: j.enabled !== false,
      schedule: j.schedule || {},
      category: categorizeJob(j.name || j.id),
      lastStatus: j.state?.lastStatus || null,
      lastRunMs: j.state?.lastRunAtMs || null,
      lastRunAgo: timeAgo(j.state?.lastRunAtMs),
      lastDurationMs: j.state?.lastDurationMs || null,
      nextRunMs: j.state?.nextRunAtMs || null,
      scheduleLabel: j.schedule?.kind === 'cron' ? j.schedule.expr :
        j.schedule?.kind === 'every' ? `every ${Math.round(j.schedule.everyMs / 60000)}m` :
        j.schedule?.kind === 'at' ? 'one-shot' : '—',
    }));
    return json(res, { jobs });
  }

  // GET /api/system/costs
  if (pathname === '/api/system/costs') {
    const data = readJSON(DATA_FILE);
    const org = data?.organization || {};
    return json(res, {
      costs: {
        actual: org.monthlyCosts?.actual,
        target: org.monthlyCosts?.target || 500,
        apiEquivalent: org.monthlyCosts?.apiEquivalent,
        savings: org.monthlyCosts?.savings,
      },
      costsByAgent: org.costsByAgent || [],
      costsByModel: org.costsByModel || [],
      infrastructure: org.infrastructure || [],
    });
  }

  // GET /api/memory/dates
  if (pathname === '/api/memory/dates') {
    const dates = cached('memory-dates', 300000, () => {
      const dateSet = new Set();
      for (const [agent, dir] of Object.entries(AGENT_DIRS)) {
        const memDir = path.join(dir, 'memory');
        try {
          for (const f of fs.readdirSync(memDir)) {
            const m = f.match(/^(\d{4}-\d{2}-\d{2})/);
            if (m) dateSet.add(m[1]);
          }
        } catch {}
      }
      return Array.from(dateSet).sort().reverse();
    });
    return json(res, { dates });
  }

  // GET /api/memory/daily?date=YYYY-MM-DD&agent=
  if (pathname === '/api/memory/daily') {
    const date = query.date;
    const agentFilter = query.agent;
    if (!date) return json(res, { error: 'date required' }, 400);

    const notes = [];
    for (const [agent, dir] of Object.entries(AGENT_DIRS)) {
      if (agentFilter && agentFilter !== 'all' && agent !== agentFilter) continue;
      const memDir = path.join(dir, 'memory');
      try {
        for (const f of fs.readdirSync(memDir)) {
          if (f.startsWith(date) && f.endsWith('.md')) {
            const fullPath = path.join(memDir, f);
            const content = fs.readFileSync(fullPath, 'utf-8');
            const stat = fs.statSync(fullPath);
            notes.push({
              date, agent, filename: f, content,
              lastModified: stat.mtime.toISOString(),
              wordCount: content.split(/\s+/).length,
            });
          }
        }
      } catch {}
    }
    return json(res, { notes });
  }

  // GET /api/memory/longterm
  if (pathname === '/api/memory/longterm' && !pathname.includes('/longterm/')) {
    const files = [];
    for (const [agent, dir] of Object.entries(AGENT_DIRS)) {
      const memFile = path.join(dir, 'MEMORY.md');
      try {
        const stat = fs.statSync(memFile);
        files.push({ agent, path: memFile, lastModified: stat.mtime.toISOString(), size: stat.size });
      } catch {}
    }
    return json(res, { files });
  }

  // GET /api/memory/longterm/:agent
  const ltMatch = pathname.match(/^\/api\/memory\/longterm\/(\w+)$/);
  if (ltMatch) {
    const agent = ltMatch[1];
    const dir = AGENT_DIRS[agent];
    if (!dir) return json(res, { error: 'unknown agent' }, 404);
    const memFile = path.join(dir, 'MEMORY.md');
    try {
      const content = fs.readFileSync(memFile, 'utf-8');
      const stat = fs.statSync(memFile);
      return json(res, { content, lastModified: stat.mtime.toISOString() });
    } catch {
      return json(res, { content: 'No MEMORY.md found', lastModified: null });
    }
  }

  // GET /api/memory/staleness
  if (pathname === '/api/memory/staleness') {
    const stale = [];
    for (const [agent, dir] of Object.entries(AGENT_DIRS)) {
      const memFile = path.join(dir, 'MEMORY.md');
      try {
        const stat = fs.statSync(memFile);
        const days = Math.floor((Date.now() - stat.mtime.getTime()) / 86400000);
        stale.push({ agent, file: 'MEMORY.md', daysSinceUpdate: days });
      } catch {}
    }
    return json(res, { stale });
  }

  // GET /api/docs
  if (pathname === '/api/docs') {
    const docs = cached('docs-list', 300000, () => {
      const results = [];
      for (const { root, source } of DOCS_ROOTS) {
        const files = scanDir(root, '.md');
        for (const f of files) {
          const rel = path.relative(root, f);
          const name = path.basename(f, '.md');
          let category = 'other';
          if (source === 'obsidian') category = 'obsidian';
          else if (rel.startsWith('plans')) category = 'plans';
          else if (rel.startsWith('specs')) category = 'specs';
          else if (rel.startsWith('research')) category = 'research';
          else if (rel.startsWith('cases')) category = 'cases';
          else if (rel.startsWith('bugs')) category = 'bugs';

          try {
            const stat = fs.statSync(f);
            const preview = fs.readFileSync(f, 'utf-8').slice(0, 200);
            results.push({ path: f, name, category, source, lastModified: stat.mtime.toISOString(), size: stat.size, preview });
          } catch {}
        }
      }
      return results;
    });
    return json(res, { docs });
  }

  // GET /api/docs/content?path=
  if (pathname === '/api/docs/content') {
    const docPath = query.path;
    if (!docPath) return json(res, { error: 'path required' }, 400);
    const allowedRoots = DOCS_ROOTS.map(r => r.root);
    if (!safePath(docPath, allowedRoots)) return json(res, { error: 'forbidden' }, 403);
    try {
      const content = fs.readFileSync(docPath, 'utf-8');
      return json(res, { content });
    } catch {
      return json(res, { error: 'not found' }, 404);
    }
  }

  return json(res, { error: 'not found' }, 404);
}

// ---- Server ----

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  // API routes
  if (pathname.startsWith('/api/')) {
    return handleAPI(req, res, pathname, parsed.query);
  }

  // Legacy: PUT /tasks.json
  if (req.method === 'PUT' && pathname === '/tasks.json') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
        json(res, { ok: true });
      } catch (e) {
        json(res, { error: e.message }, 400);
      }
    });
    return;
  }

  // Static file serving — try dist/ first (React build), then DIR (legacy)
  let filePath = pathname;
  if (filePath === '/') filePath = '/index.html';

  // Try dist first
  const distPath = path.join(DIST_DIR, filePath);
  if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    const ext = path.extname(distPath);
    const data = fs.readFileSync(distPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return res.end(data);
  }

  // Try root dir (avatars, legacy HTML, data files)
  const rootPath = path.join(DIR, filePath);
  if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
    const ext = path.extname(rootPath);
    const data = fs.readFileSync(rootPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return res.end(data);
  }

  // SPA fallback — serve dist/index.html for client-side routing
  const spaIndex = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(spaIndex)) {
    const data = fs.readFileSync(spaIndex);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(data);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`⚓ Mission Control running at:`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   Tailscale: http://brians-mac-mini:${PORT}`);
});
