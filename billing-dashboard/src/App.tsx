import { useState, useEffect } from 'react';
import { EmailPanel } from './EmailPanel';
import { VideoPanel } from './VideoPanel';

// Use env var if set (production), otherwise use current hostname (dev/Tailscale)
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

interface Override {
  type: 'percent' | 'dollar' | 'flat';
  value: number;
  note?: string;
}

interface Boat {
  Boat: string;
  Date: string;
  HullTotal: string;
  Anode: string;
  AnodeType: string;
  Total: string;
  email: string | null;
  billed: boolean;
  invoiceId?: string;
  stripeUrl?: string;
  billedAt?: string;
  billedStatus?: string;
  hasCard?: boolean | null;
  stripeCustomerId?: string;
  // Breakdown fields
  length?: number;
  boatType?: string;
  plan?: string;
  props?: number;
  rate?: number;
  baseAmount?: number;
  typeSurcharge?: number;
  propSurcharge?: number;
  baseTotal?: number;
  growthPercent?: string;
  growthDesc?: string;
  priceNote?: string;
  override?: Override | null;
  originalTotal?: string;
}

interface BillingData {
  month: string;
  boats: Boat[];
  summary: {
    total: number;
    billed: number;
    pending: number;
    amount: string;
  };
}

type FilterType = 'all' | 'ready' | 'noEmail' | 'billed';
type ViewType = 'billing' | 'email' | 'video';

export { API_URL };

function App() {
  const [activeView, setActiveView] = useState<ViewType>('billing');
  const [months, setMonths] = useState<{id: string, name: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [selectedBoats, setSelectedBoats] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [stripeKey, setStripeKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingBoat, setSendingBoat] = useState<string | null>(null);
  const [previewBoat, setPreviewBoat] = useState<Boat | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateYear, setGenerateYear] = useState('2026');
  const [generateMonth, setGenerateMonth] = useState('2');
  const [generating, setGenerating] = useState(false);
  const [filterPlan, setFilterPlan] = useState(false);
  const [filterStartTime, setFilterStartTime] = useState(false);
  const [generateResult, setGenerateResult] = useState<{count: number, total: string, checked: number} | null>(null);

  // Conditions check
  const [conditionsCheck, setConditionsCheck] = useState<{total: number, withConditions: number, missingCount: number, missing: {boat: string, location: string}[]} | null>(null);
  const [checkingConditions, setCheckingConditions] = useState(false);

  // Video status per boat
  const [videoStatus, setVideoStatus] = useState<Record<string, { count: number; uploaded: boolean; youtubeUrl?: string }>>({});

  const generateBilling = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const params = new URLSearchParams();
      if (filterPlan) params.set('filterPlan', 'true');
      if (filterStartTime) params.set('filterStartTime', 'true');
      const url = `${API_URL}/generate/${generateYear}/${generateMonth}${params.toString() ? '?' + params : ''}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGenerateResult({ count: data.count, total: data.totalAmount, checked: data.totalBoatsChecked });
        setMessage({ type: 'success', text: `Generated ${data.month}: ${data.count} boats, $${data.totalAmount}` });
        // Reload months list
        const monthsRes = await fetch(`${API_URL}/months`);
        setMonths(await monthsRes.json());
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate billing' });
    }
    setGenerating(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Load months on startup
  useEffect(() => {
    fetch(`${API_URL}/months`)
      .then(r => r.json())
      .then(setMonths)
      .catch(console.error);
    
    fetch(`${API_URL}/stripe-key/status`)
      .then(r => r.json())
      .then(d => setStripeConfigured(d.configured))
      .catch(console.error);
  }, []);

  // Load billing data when month changes
  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);
    fetch(`${API_URL}/billing/${selectedMonth}`)
      .then(r => r.json())
      .then(data => {
        setBillingData(data);
        setSelectedBoats(new Set());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // Load video status for billing rows
  useEffect(() => {
    if (!billingData?.boats?.length) return;
    fetch(`${API_URL}/videos/upload-ready`)
      .then(r => r.json())
      .then(data => {
        const vids = data.videos || {};
        const status: Record<string, { count: number; uploaded: boolean; youtubeUrl?: string }> = {};
        // Match by boat name (case-insensitive)
        for (const boat of billingData.boats) {
          const key = Object.keys(vids).find(k => k.toLowerCase() === boat.Boat.toLowerCase());
          if (key) {
            status[boat.Boat] = { count: vids[key].length, uploaded: false };
          }
        }
        // Also check archive for already-uploaded videos
        fetch(`${API_URL}/videos/durations`)
          .then(r => r.json())
          .then(durData => {
            const durs = durData.durations || {};
            for (const boat of billingData.boats) {
              const durKey = Object.keys(durs).find(k => k.toLowerCase().startsWith(boat.Boat.toLowerCase() + '|'));
              if (durKey && !status[boat.Boat]) {
                status[boat.Boat] = { count: durs[durKey].videoCount, uploaded: true };
              }
            }
            setVideoStatus(status);
          })
          .catch(() => setVideoStatus(status));
      })
      .catch(console.error);
  }, [billingData]);

  const configureStripe = async () => {
    if (!stripeKey) return;
    const res = await fetch(`${API_URL}/stripe-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: stripeKey })
    });
    if (res.ok) {
      setStripeConfigured(true);
      setStripeKey('');
      setMessage({ type: 'success', text: 'Stripe key configured' });
    } else {
      setMessage({ type: 'error', text: 'Invalid Stripe key' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const sendInvoice = async (boat: Boat) => {
    if (!stripeConfigured || !boat.email) return;
    
    setSendingBoat(boat.Boat);
    try {
      const monthName = months.find(m => m.id === selectedMonth)?.name || selectedMonth;
      const res = await fetch(`${API_URL}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boat: boat.Boat,
          hull: boat.override ? (parseFloat(boat.Total) - parseFloat(boat.Anode || '0')).toFixed(2) : boat.HullTotal,
          anode: boat.Anode,
          anodeType: boat.AnodeType,
          total: boat.Total,
          email: boat.email,
          month: monthName,
          serviceDate: boat.Date  // Actual service date for clear billing
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update local state with invoice details
        setBillingData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            boats: prev.boats.map(b => 
              b.Boat === boat.Boat ? { 
                ...b, 
                billed: true,
                invoiceId: data.invoiceId,
                stripeUrl: data.stripeUrl,
                billedStatus: data.status,
                billedAt: new Date().toISOString()
              } : b
            ),
            summary: {
              ...prev.summary,
              billed: prev.summary.billed + 1,
              pending: prev.summary.pending - 1
            }
          };
        });
        setSelectedBoats(prev => {
          const next = new Set(prev);
          next.delete(boat.Boat);
          return next;
        });
        setMessage({ type: 'success', text: `${boat.Boat}: ${data.status === 'charged' ? 'Charged' : 'Invoice sent'}` });
      } else {
        setMessage({ type: 'error', text: `${boat.Boat}: ${data.error}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `${boat.Boat}: Failed to send` });
    }
    setSendingBoat(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const sendSelected = async () => {
    if (!billingData) return;
    const toSend = billingData.boats.filter(b => 
      selectedBoats.has(b.Boat) && !b.billed && b.email
    );
    
    for (const boat of toSend) {
      await sendInvoice(boat);
      await new Promise(r => setTimeout(r, 500)); // Small delay between sends
    }
  };

  const filteredBoats = billingData?.boats.filter(b => {
    switch (filter) {
      case 'ready': return !b.billed && b.email;
      case 'noEmail': return !b.email;
      case 'billed': return b.billed;
      default: return true;
    }
  }) || [];

  const readyBoats = filteredBoats.filter(b => !b.billed && b.email);
  const selectedReadyCount = [...selectedBoats].filter(name => 
    readyBoats.some(b => b.Boat === name)
  ).length;

  const toggleSelectAll = () => {
    if (selectedReadyCount === readyBoats.length) {
      setSelectedBoats(new Set());
    } else {
      setSelectedBoats(new Set(readyBoats.map(b => b.Boat)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 mb-6">
          <h1 className="text-3xl font-bold">SailorSkills Operations</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('billing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeView === 'billing' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >💰 Invoicing</button>
            <button
              onClick={() => setActiveView('email')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeView === 'email' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >📧 Email</button>
            <button
              onClick={() => setActiveView('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeView === 'video' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >🎬 Videos</button>
          </div>
        </div>

        {activeView === 'video' ? (
          <VideoPanel />
        ) : activeView === 'email' ? (
          <EmailPanel apiUrl={API_URL} />
        ) : (
        <>
        
        {/* Stripe Key Config */}
        {!stripeConfigured && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 mb-2">Stripe key required</p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="rk_live_... or sk_live_..."
                value={stripeKey}
                onChange={e => setStripeKey(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
              <button
                onClick={configureStripe}
                className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded"
              >
                Configure
              </button>
            </div>
          </div>
        )}
        
        {/* Message Toast */}
        {message && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Month Selector & Summary */}
        <div className="flex items-center gap-4 mb-6">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
          >
            <option value="">Select month...</option>
            {months.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowGenerate(true)}
            className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-sm"
          >
            + Generate Month
          </button>
          
          {billingData && (
            <div className="flex gap-6 text-sm items-center">
              <span className="text-gray-400">
                Total: <span className="text-white font-medium">{billingData.summary.total} boats</span>
              </span>
              <span className="text-gray-400">
                Amount: <span className="text-white font-medium">${billingData.summary.amount}</span>
              </span>
              <span className="text-green-400">
                Billed: {billingData.summary.billed}
              </span>
              <span className="text-yellow-400">
                Pending: {billingData.summary.pending}
              </span>
              <span className="text-gray-400">
                💳 <span className="text-green-400">{billingData.boats.filter(b => b.hasCard === true).length}</span>
                {' / '}
                📧 <span className="text-yellow-400">{billingData.boats.filter(b => b.hasCard === false).length}</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Conditions Check */}
        {billingData && (
          <div className="mb-4">
            <button
              onClick={async () => {
                setCheckingConditions(true);
                try {
                  // Extract year/month from selectedMonth (format: "month_year" e.g. "february_2026")
                  const parts = selectedMonth.split('_');
                  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
                  const monthNum = monthNames.indexOf(parts[0]) + 1;
                  const year = parts[1];
                  const res = await fetch(`${API_URL}/conditions-check/${year}/${monthNum}`);
                  const data = await res.json();
                  setConditionsCheck(data);
                } catch (err) { console.error(err); }
                finally { setCheckingConditions(false); }
              }}
              disabled={checkingConditions}
              className="px-3 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              {checkingConditions ? '⏳ Checking...' : '🔍 Check Missing Conditions'}
            </button>
            {conditionsCheck && (
              <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-700">
                <div className="flex gap-4 text-sm mb-2">
                  <span>Active boats: <span className="text-white font-medium">{conditionsCheck.total}</span></span>
                  <span className="text-green-400">✓ Has conditions: {conditionsCheck.withConditions}</span>
                  <span className="text-yellow-400">⚠ Missing: {conditionsCheck.missingCount}</span>
                </div>
                {conditionsCheck.missing.length > 0 && (
                  <div className="max-h-40 overflow-y-auto text-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                      {conditionsCheck.missing.map(m => (
                        <span key={m.boat} className="text-yellow-300">
                          {m.boat} <span className="text-gray-500 text-xs">{m.location}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters & Actions */}
        {billingData && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(['all', 'ready', 'noEmail', 'billed'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === f 
                      ? 'bg-blue-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'ready' ? 'Ready' : f === 'noEmail' ? 'No Email' : 'Billed'}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              {selectedBoats.size > 0 && (
                <>
                  {/* Reset selected billed boats */}
                  {[...selectedBoats].some(name => billingData?.boats.find(b => b.Boat === name)?.billed) && (
                    <button
                      onClick={async () => {
                        const boatsToReset = [...selectedBoats].filter(name => 
                          billingData?.boats.find(b => b.Boat === name)?.billed
                        );
                        if (boatsToReset.length === 0) return;
                        
                        await fetch(`${API_URL}/billing/${selectedMonth}/reset`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ boats: boatsToReset })
                        });
                        
                        // Reload billing data
                        const res = await fetch(`${API_URL}/billing/${selectedMonth}`);
                        setBillingData(await res.json());
                        setSelectedBoats(new Set());
                        setMessage({ type: 'success', text: `Reset ${boatsToReset.length} boat(s)` });
                        setTimeout(() => setMessage(null), 3000);
                      }}
                      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
                    >
                      Reset {[...selectedBoats].filter(name => billingData?.boats.find(b => b.Boat === name)?.billed).length} Billed
                    </button>
                  )}
                  {/* Send selected ready boats */}
                  {selectedReadyCount > 0 && (
                    <button
                      onClick={sendSelected}
                      disabled={!stripeConfigured || sendingBoat !== null}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-4 py-2 rounded"
                    >
                      Send {selectedReadyCount} Selected
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Billing Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : billingData ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedReadyCount === readyBoats.length && readyBoats.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left">Boat</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Hull</th>
                  <th className="p-3 text-right">Anode</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-center">Video</th>
                  <th className="p-3 text-center">Card</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoats.map(boat => (
                  <tr 
                    key={boat.Boat} 
                    className={`border-t border-gray-700 hover:bg-gray-750 ${
                      sendingBoat === boat.Boat ? 'bg-blue-900/30' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedBoats.has(boat.Boat)}
                        onChange={e => {
                          const next = new Set(selectedBoats);
                          if (e.target.checked) next.add(boat.Boat);
                          else next.delete(boat.Boat);
                          setSelectedBoats(next);
                        }}
                        disabled={!boat.email}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">
                      <button 
                        onClick={() => setPreviewBoat(boat)}
                        className="hover:text-blue-400"
                      >
                        {boat.Boat}
                      </button>
                    </td>
                    <td className="p-3 text-gray-400">{boat.Date}</td>
                    <td className="p-3 text-right">${boat.HullTotal}</td>
                    <td className="p-3 text-right text-gray-400">
                      {parseFloat(boat.Anode) > 0 ? `$${boat.Anode}` : '-'}
                    </td>
                    <td className="p-3 text-right font-medium">
                      <span className={boat.override ? 'text-yellow-300' : ''}>${boat.Total}</span>
                      {boat.override && <span className="text-yellow-500 text-xs ml-1">✎</span>}
                    </td>
                    <td className="p-3 text-sm">
                      {boat.email || <span className="text-red-400">Missing</span>}
                    </td>
                    <td className="p-3 text-center">
                      {videoStatus[boat.Boat] ? (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            videoStatus[boat.Boat].uploaded
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-blue-900/40 text-blue-400'
                          }`}
                          title={`${videoStatus[boat.Boat].count} video${videoStatus[boat.Boat].count !== 1 ? 's' : ''} ${videoStatus[boat.Boat].uploaded ? 'uploaded' : 'ready'}`}
                        >
                          🎬 {videoStatus[boat.Boat].count}
                        </span>
                      ) : (
                        <span className="text-gray-600" title="No video">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {boat.hasCard === true ? (
                        <span className="text-green-400" title="Card on file - will auto-charge">💳</span>
                      ) : boat.hasCard === false ? (
                        <span className="text-yellow-400" title="No card - will send invoice">📧</span>
                      ) : (
                        <span className="text-gray-500" title="Unknown">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {boat.billed ? (
                        boat.stripeUrl ? (
                          <a 
                            href={boat.stripeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-500"
                            title={`${boat.billedStatus === 'charged' ? 'Charged' : 'Sent'} - Click to view in Stripe`}
                          >
                            ✓ {boat.billedStatus === 'charged' ? 'Charged' : 'Sent'}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-green-600">Billed</span>
                        )
                      ) : boat.email ? (
                        <span className="inline-block px-2 py-1 rounded text-xs bg-yellow-600">Pending</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs bg-gray-600">No Email</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {!boat.billed && boat.email && (
                        <button
                          onClick={() => sendInvoice(boat)}
                          disabled={!stripeConfigured || sendingBoat !== null}
                          className={`text-sm px-3 py-1 rounded disabled:bg-gray-600 ${boat.hasCard ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                          {sendingBoat === boat.Boat ? '...' : boat.hasCard ? '💳' : '📧'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Select a month to view billing data
          </div>
        )}
        
        {/* Generate Month Modal */}
        {showGenerate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" onClick={() => { setShowGenerate(false); setGenerateResult(null); }}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Generate Monthly Billing</h2>
              <p className="text-gray-400 text-sm mb-4">
                Finds boats with service logged in Conditions database for the selected month.
              </p>
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Month</label>
                  <select
                    value={generateMonth}
                    onChange={e => setGenerateMonth(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={generateYear}
                    onChange={e => setGenerateYear(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
              </div>
              
              {/* Filter Toggles */}
              <div className="bg-gray-700 rounded p-4 mb-4">
                <p className="text-sm font-medium mb-3">Optional Filters</p>
                <label className="flex items-center gap-3 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterPlan}
                    onChange={e => setFilterPlan(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Only Plan = "Subbed" or "One-time"</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterStartTime}
                    onChange={e => setFilterStartTime(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Only boats with Start Time ≤ end of month</span>
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  ✓ Always required: Service entry in Conditions for selected month
                </p>
              </div>
              
              {/* Results */}
              {generateResult && (
                <div className="bg-green-900/30 border border-green-600 rounded p-3 mb-4">
                  <p className="text-green-200 font-medium">Generated!</p>
                  <p className="text-sm text-green-300">
                    {generateResult.count} boats serviced (checked {generateResult.checked} total)
                  </p>
                  <p className="text-sm text-green-300">
                    Total: ${generateResult.total}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowGenerate(false); setGenerateResult(null); }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded"
                >
                  {generateResult ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={generateBilling}
                  disabled={generating}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 py-2 rounded"
                >
                  {generating ? 'Generating...' : generateResult ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Preview Modal with Breakdown + Price Adjustment */}
        {previewBoat && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPreviewBoat(null)}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full my-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{previewBoat.Boat}</h2>
              
              {/* Boat Info */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-400">Date:</span> {previewBoat.Date ? new Date(previewBoat.Date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</div>
                <div><span className="text-gray-400">Email:</span> {previewBoat.email || <span className="text-red-400">Missing</span>}</div>
                {previewBoat.length && <div><span className="text-gray-400">Length:</span> {previewBoat.length}ft</div>}
                {previewBoat.boatType && <div><span className="text-gray-400">Type:</span> {previewBoat.boatType}</div>}
                {previewBoat.plan && <div><span className="text-gray-400">Plan:</span> {previewBoat.plan}</div>}
                {previewBoat.props && previewBoat.props > 1 && <div><span className="text-gray-400">Props:</span> {previewBoat.props}</div>}
              </div>
              
              {/* Charge Breakdown */}
              <div className="bg-gray-700 rounded p-4 mb-4">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Charge Breakdown</p>
                
                {previewBoat.length && previewBoat.rate ? (
                  <>
                    <div className="flex justify-between py-1 text-sm">
                      <span className="text-gray-300">Base: {previewBoat.length}ft × ${previewBoat.rate}/ft</span>
                      <span>${previewBoat.baseAmount?.toFixed(2)}</span>
                    </div>
                    {(previewBoat.typeSurcharge ?? 0) > 0 && (
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-300">Power boat surcharge (+25%)</span>
                        <span>${previewBoat.typeSurcharge?.toFixed(2)}</span>
                      </div>
                    )}
                    {(previewBoat.propSurcharge ?? 0) > 0 && (
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-300">Extra prop surcharge (+10% × {(previewBoat.props ?? 1) - 1})</span>
                        <span>${previewBoat.propSurcharge?.toFixed(2)}</span>
                      </div>
                    )}
                    {previewBoat.growthDesc && previewBoat.growthPercent !== '0.0%' && (
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-300">Growth: {previewBoat.growthDesc} (+{previewBoat.growthPercent})</span>
                        <span>${(parseFloat(previewBoat.HullTotal) - (previewBoat.baseTotal ?? 0)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 text-sm border-t border-gray-600 mt-1 pt-1">
                      <span className="text-gray-200 font-medium">Hull Total</span>
                      <span className="font-medium">${previewBoat.HullTotal}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-300">Hull Cleaning</span>
                    <span>${previewBoat.HullTotal}</span>
                  </div>
                )}
                
                {parseFloat(previewBoat.Anode) > 0 && (
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-300">Anode: {previewBoat.AnodeType}</span>
                    <span>${previewBoat.Anode}</span>
                  </div>
                )}
                
                {previewBoat.priceNote && (
                  <div className="text-xs text-yellow-400 mt-1">⚠ {previewBoat.priceNote}</div>
                )}
                
                <div className="flex justify-between py-2 border-t border-gray-500 mt-2 font-bold text-lg">
                  <span>Total</span>
                  <span className={previewBoat.override ? 'text-yellow-300' : ''}>
                    ${previewBoat.Total}
                    {previewBoat.override && <span className="text-xs font-normal ml-1">(adjusted)</span>}
                  </span>
                </div>
                {previewBoat.override && previewBoat.originalTotal && (
                  <div className="text-xs text-gray-400 text-right">
                    Original: ${previewBoat.originalTotal}
                    {previewBoat.override.note && <span> — {previewBoat.override.note}</span>}
                  </div>
                )}
              </div>
              
              {/* Price Adjustment */}
              {!previewBoat.billed && (
                <div className="bg-gray-750 border border-gray-600 rounded p-4 mb-4">
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Adjust Price</p>
                  <div className="flex gap-2 mb-3">
                    {(['percent', 'dollar', 'flat'] as const).map(t => (
                      <button
                        key={t}
                        id={`adj-${t}`}
                        onClick={() => {
                          const el = document.getElementById('adj-value') as HTMLInputElement;
                          const noteEl = document.getElementById('adj-note') as HTMLInputElement;
                          if (el) el.dataset.type = t;
                          // Update button styles
                          document.querySelectorAll('[id^="adj-"]').forEach(b => {
                            if (b.id === `adj-${t}`) b.className = 'px-3 py-1 rounded text-sm bg-blue-600';
                            else if (b.id.startsWith('adj-') && b.id !== 'adj-value' && b.id !== 'adj-note') b.className = 'px-3 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600';
                          });
                        }}
                        className={`px-3 py-1 rounded text-sm ${t === 'flat' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                      >
                        {t === 'percent' ? '% Adjust' : t === 'dollar' ? '$ Adjust' : 'Set Amount'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="adj-value"
                      type="number"
                      step="any"
                      placeholder="Enter value"
                      data-type="flat"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                    <input
                      id="adj-note"
                      type="text"
                      placeholder="Note (optional)"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        const el = document.getElementById('adj-value') as HTMLInputElement;
                        const noteEl = document.getElementById('adj-note') as HTMLInputElement;
                        const type = (el?.dataset.type || 'flat') as Override['type'];
                        const value = parseFloat(el?.value || '0');
                        if (!value && type !== 'flat') return;
                        
                        const res = await fetch(`${API_URL}/billing/${selectedMonth}/override`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ boat: previewBoat.Boat, override: { type, value, note: noteEl?.value || '' } })
                        });
                        if (res.ok) {
                          // Reload billing data
                          const dataRes = await fetch(`${API_URL}/billing/${selectedMonth}`);
                          const data = await dataRes.json();
                          setBillingData(data);
                          const updated = data.boats.find((b: Boat) => b.Boat === previewBoat.Boat);
                          if (updated) setPreviewBoat(updated);
                          setMessage({ type: 'success', text: `${previewBoat.Boat}: Price adjusted` });
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
                    >
                      Apply
                    </button>
                    {previewBoat.override && (
                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_URL}/billing/${selectedMonth}/override`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ boat: previewBoat.Boat, override: null })
                          });
                          if (res.ok) {
                            const dataRes = await fetch(`${API_URL}/billing/${selectedMonth}`);
                            const data = await dataRes.json();
                            setBillingData(data);
                            const updated = data.boats.find((b: Boat) => b.Boat === previewBoat.Boat);
                            if (updated) setPreviewBoat(updated);
                            setMessage({ type: 'success', text: `${previewBoat.Boat}: Override cleared` });
                          }
                        }}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm"
                      >
                        Clear Override
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewBoat(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded"
                >
                  Close
                </button>
                {!previewBoat.billed && previewBoat.email && (
                  <button
                    onClick={() => { sendInvoice(previewBoat); setPreviewBoat(null); }}
                    disabled={!stripeConfigured || sendingBoat !== null}
                    className={`flex-1 py-2 rounded ${previewBoat.hasCard ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-gray-600`}
                  >
                    {previewBoat.hasCard ? '💳 Charge Card' : '📧 Send Invoice'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default App;
