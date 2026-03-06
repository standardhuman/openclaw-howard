import { useState, useEffect } from 'react'
import { getSupabase } from './supabase'
import {
  CalendarIcon, BedIcon, TargetIcon, MapIcon, HandIcon, DollarIcon,
  SunriseIcon, MountainIcon, SunsetIcon,
  HomeIcon, UtensilsIcon, FlameIcon, CoffeeIcon, CarIcon, HikingIcon,
  SandwichIcon, SwordIcon, WindIcon, ChatIcon, DiceIcon, YogaIcon,
  GuitarIcon, CircleIcon, HandshakeIcon, MeatIcon, SaladIcon,
  HotelIcon, CabinIcon, TentIcon,
  HotSpringIcon, TreesIcon, BeachIcon,
  BackpackIcon, BootIcon, LotusIcon,
  CalendarPlusIcon, DownloadIcon,
  CheckIcon, QuestionIcon, XIcon,
} from './Icons'

const RSVP_DEADLINE = '2026-03-27T23:59:59-07:00'

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  interested: 'Interested',
  maybe: 'Maybe',
  cant: "Can't Make It",
}

const STATUS_COLORS = {
  confirmed: 'bg-green-900/50 text-green-400 border-green-700/50',
  interested: 'bg-amber/10 text-amber border-amber/20',
  maybe: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  cant: 'bg-red-900/50 text-red-400 border-red-700/50',
}

const GCAL_URL = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=TMC+Tahoe+Away+Weekend&dates=20260410T180000/20260412T210000&location=1201+Wildwood+Ave+Unit+16+South+Lake+Tahoe+CA+96150&details=Men%27s+retreat+weekend+with+The+Men%27s+Circle.+Brotherhood%2C+nature%2C+growth.%0A%0ADetails%3A+https%3A%2F%2Ftahoe-away-weekend-26.briancline.co'

function generateICS() {
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TMC//Tahoe Away Weekend//EN
BEGIN:VEVENT
DTSTART:20260410T180000
DTEND:20260412T210000
SUMMARY:TMC Tahoe Away Weekend
LOCATION:1201 Wildwood Ave\\, Unit 16\\, South Lake Tahoe\\, CA 96150
DESCRIPTION:Men's retreat weekend with The Men's Circle. Brotherhood\\, nature\\, growth.\\n\\nDetails: https://tahoe-away-weekend-26.briancline.co
URL:https://tahoe-away-weekend-26.briancline.co
END:VEVENT
END:VCALENDAR`
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tahoe-away-weekend-2026.ics'
  a.click()
  URL.revokeObjectURL(url)
}

const SCHEDULE = {
  friday: {
    label: 'Friday, April 10',
    Icon: SunriseIcon,
    events: [
      { time: '6:00 PM', title: 'Arrival', desc: 'Light activities, card games, board games', Icon: HomeIcon },
      { time: '6:30 PM', title: 'Group Dinner', desc: 'First meal together at the house', Icon: UtensilsIcon },
      { time: '7:30–9:00 PM', title: 'Group Check-In', desc: 'Each man shares what he\'s hoping for during the weekend', Icon: FlameIcon },
    ],
  },
  saturday: {
    label: 'Saturday, April 11',
    Icon: MountainIcon,
    events: [
      { time: '8:00 AM', title: 'Breakfast', desc: 'At the house', Icon: CoffeeIcon },
      { time: '9:00 AM', title: 'Drive to Hike', desc: '30 min drive to trailhead', Icon: CarIcon },
      { time: '10:00 AM', title: 'Exercise Options', desc: 'Barn Trail hike, group sauna, or bike ride', Icon: HikingIcon },
      { time: '12:00 PM', title: 'Lunch', desc: 'At the house', Icon: SandwichIcon },
      { time: '1:00 PM', title: 'Warrior/Magician/Lover/King', desc: 'Talk by Patrick Dominguez', Icon: SwordIcon },
      { time: '2:00 PM', title: 'Breathwork', desc: 'Led by Evan Drake — 2 hours', Icon: WindIcon },
      { time: '4:00 PM', title: 'T-Groups', desc: 'Led by Brian — 2 hours', Icon: ChatIcon },
      { time: '6:00 PM', title: 'Dinner', desc: 'At the house', Icon: MeatIcon },
      { time: '7:00–9:00 PM', title: 'Games & Wind Down', desc: 'Relax and connect', Icon: DiceIcon },
    ],
  },
  sunday: {
    label: 'Sunday, April 12',
    Icon: SunsetIcon,
    events: [
      { time: '8:00 AM', title: 'Breakfast', desc: 'At the house', Icon: CoffeeIcon },
      { time: '9:00 AM', title: 'Light Workout & Yoga', desc: 'Gentle movement to start the day', Icon: YogaIcon },
      { time: '10:00 AM', title: 'Relaxation', desc: 'Sauna (4 at a time), journaling, music/guitar', Icon: GuitarIcon },
      { time: '11:00 AM', title: 'Open Circle', desc: 'Final group gathering', Icon: CircleIcon },
      { time: '12:00 PM', title: 'Lunch', desc: 'Last meal together', Icon: SaladIcon },
      { time: '1:00 PM', title: 'Closing', desc: 'Wrap up and say goodbye', Icon: HandshakeIcon },
      { time: '2:00 PM', title: 'Drive Home', desc: 'Safe travels', Icon: CarIcon },
    ],
  },
}

const ACCOMMODATIONS = [
  {
    title: "Evan's House (Base Camp)",
    Icon: HomeIcon,
    price: 'FREE',
    priceNum: 0,
    description: 'Primary gathering location for all activities. Sauna on site.',
    pros: ['Free', 'Sauna on site', 'Central hub for all activities'],
    cons: ['Limited sleeping capacity', 'Overflow needs other accommodation'],
    address: '1201 Wildwood Ave., Unit 16, South Lake Tahoe, CA 96150',
  },
  {
    title: 'Tahoe Lakeshore Lodge & Spa',
    Icon: HotelIcon,
    price: '$148–209/night',
    priceNum: 209,
    description: 'Share rooms with 2 beds for ~$105/person/night. Private beach and lake access.',
    pros: ['Private beach & lake access', '~$105/person sharing', '10 min from base camp'],
    cons: ['Additional cost', 'Separate from group'],
    url: 'https://www.tahoelakeshorelodge.com/',
  },
  {
    title: 'Airbnb/VRBO Group Cabins',
    Icon: CabinIcon,
    price: '$556–1,124/night',
    priceNum: 556,
    description: 'Large cabins sleeping 10-14. Hot tubs, saunas, full kitchens.',
    pros: ['Everyone under one roof', 'Full kitchens', 'Hot tubs & saunas'],
    cons: ['Higher total cost', 'Booking availability varies'],
    links: [
      { label: 'Airbnb South Lake Tahoe', url: 'https://www.airbnb.com/s/South-Lake-Tahoe--CA/homes?adults=12&checkin=2026-04-10&checkout=2026-04-12' },
      { label: 'VRBO South Lake Tahoe', url: 'https://www.vrbo.com/vacation-rentals/usa/california/lake-tahoe-ca/south-shore/south-lake-tahoe' },
      { label: 'Tahoe Keys Villa (14 guests, sauna, hot tub)', url: 'https://www.rnrvr.com/lake-tahoe-rentals/tahoe-keys-villa-pool-table-sauna-dock-hot-tub-ac' },
      { label: 'AvantStay Group Homes', url: 'https://avantstay.com/blog/lake-tahoe-airbnbs/' },
    ],
  },
  {
    title: 'Camping',
    Icon: TentIcon,
    price: '$25–50/night',
    priceNum: 35,
    description: 'Budget option. Campground by the Lake or KOA. April temps: 30s–50s°F.',
    pros: ['Cheapest option', 'Adventure factor', 'Close to nature'],
    cons: ['Cold (30s–50s°F in April)', 'Limited facilities', 'Some campgrounds not open yet'],
    links: [
      { label: 'Campground by the Lake', url: 'https://www.cityofslt.gov/270/Campground-by-the-Lake' },
      { label: 'Lake Tahoe KOA', url: 'https://koa.com/campgrounds/lake-tahoe/' },
      { label: 'Tahoe Valley Campground', url: 'https://thousandtrails.com/california/tahoe-valley-campground' },
    ],
  },
]

const ACTIVITIES = [
  {
    title: 'Barn Trail Hike',
    Icon: HikingIcon,
    desc: 'Moderate loop trail with views of Lake Tahoe and the Cal-Neva area.',
    url: 'https://www.alltrails.com/trail/us/california/barn-trail-to-cal-neva-loop',
    price: 'Free',
  },
  {
    title: 'Tahoe Forest Baths',
    Icon: TreesIcon,
    desc: 'Traditional Japanese cedar enzyme bath. One of only two locations in the US.',
    url: 'https://tahoeforestbaths.com',
    price: 'Check site',
  },
  {
    title: "David Walley's Hot Springs",
    Icon: HotSpringIcon,
    desc: 'Seven mineral hot spring pools, steam rooms, dry saunas. ~45 min from SLT.',
    price: '$55/person day pass',
    url: 'https://www.holidayinnclub.com/explore-resorts/david-walleys-resort/on-site-activities/pools',
  },
  {
    title: 'Warrior/Magician/Lover/King',
    Icon: SwordIcon,
    desc: 'Talk by Patrick Dominguez exploring masculine archetypes.',
    price: 'Included',
  },
  {
    title: 'Breathwork Session',
    Icon: WindIcon,
    desc: '2-hour guided breathwork experience led by Evan Drake.',
    price: 'Included',
  },
  {
    title: 'T-Groups',
    Icon: ChatIcon,
    desc: '2-hour interpersonal group process led by Brian.',
    price: 'Included',
  },
  {
    title: 'Nevada Beach',
    Icon: BeachIcon,
    desc: 'Sandy beach on the south shore of Lake Tahoe. Great for a group walk or hangout.',
    price: 'Free (parking may apply)',
    url: 'https://www.recreation.gov/camping/campgrounds/232768',
  },
  {
    title: 'Group Sauna',
    Icon: HotSpringIcon,
    desc: 'Sauna at Evan\'s house — fits 4 at a time. Rotate throughout the weekend.',
    price: 'Free',
  },
]

const PACKING_LIST = [
  { category: 'Essentials', Icon: BackpackIcon, items: ['Sleeping bag or bedding (if not at hotel)', 'Pillow', 'Toiletries', 'Medications', 'Phone charger', 'ID & wallet'] },
  { category: 'Outdoor Gear', Icon: BootIcon, items: ['Hiking boots/shoes', 'Layers (30s–50s°F)', 'Rain jacket', 'Warm hat & gloves', 'Sunglasses & sunscreen', 'Water bottle'] },
  { category: 'Activities', Icon: LotusIcon, items: ['Yoga mat (if you have one)', 'Journal & pen', 'Guitar or instrument (optional)', 'Swimsuit (for sauna/hot springs)', 'Towel'] },
  { category: 'Fun', Icon: DiceIcon, items: ['Card games', 'Board games', 'Books', 'Snacks to share', 'Your favorite beverage'] },
]

function Section({ id, Icon, title, children }) {
  return (
    <section id={id} className="py-16 px-4 max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
        {Icon && <Icon className="w-7 h-7 text-amber" />}{title}
      </h2>
      {children}
    </section>
  )
}

function CostCalculator({ pricePerNight, nights = 2, label }) {
  const [people, setPeople] = useState(2)
  if (!pricePerNight) return null
  const perPerson = Math.ceil(pricePerNight * nights / people)
  return (
    <div className="mt-3 p-3 bg-midnight/50 rounded-lg">
      <div className="text-xs text-amber font-semibold mb-1">{label || 'Cost Calculator'}</div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Splitting with</label>
        <input
          type="number" min={1} max={20} value={people}
          onChange={e => setPeople(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 bg-deep-blue border border-card-border rounded px-2 py-1 text-sm text-center"
        />
        <span className="text-xs text-slate-400">people</span>
        <span className="ml-auto font-bold text-amber">${perPerson}<span className="text-xs font-normal text-slate-400">/person for {nights} nights</span></span>
      </div>
    </div>
  )
}

function SharedCostCalculator() {
  const [attendees, setAttendees] = useState(12)
  const [foodBudget, setFoodBudget] = useState(600)
  const [accomBudget, setAccomBudget] = useState(1200)
  const [activitiesBudget, setActivitiesBudget] = useState(200)
  const total = foodBudget + accomBudget + activitiesBudget
  const perPerson = Math.ceil(total / attendees)

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4 text-amber flex items-center gap-2"><DollarIcon className="w-5 h-5" /> Per-Person Cost Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          ['Attendees', attendees, setAttendees, 1, 25],
          ['Food Budget ($)', foodBudget, setFoodBudget, 0, 5000],
          ['Accommodation ($)', accomBudget, setAccomBudget, 0, 10000],
          ['Activities ($)', activitiesBudget, setActivitiesBudget, 0, 5000],
        ].map(([label, val, setter, min, max]) => (
          <div key={label}>
            <label className="text-xs text-slate-400 block mb-1">{label}</label>
            <input
              type="number" min={min} max={max} value={val}
              onChange={e => setter(Math.max(min, parseInt(e.target.value) || 0))}
              className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center p-4 bg-forest/30 rounded-lg">
        <div>
          <div className="text-sm text-slate-400">Total shared costs</div>
          <div className="text-xl font-bold">${total.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Per person ({attendees} people)</div>
          <div className="text-2xl font-bold text-amber">${perPerson}</div>
        </div>
      </div>
    </div>
  )
}

function RSVPSection() {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', status: 'confirmed', dietary: '', notes: '',
    can_drive: false, car_seats: 0, needs_ride: true, departure_area: '',
  })

  const deadlinePassed = new Date() > new Date(RSVP_DEADLINE)
  const daysLeft = Math.max(0, Math.ceil((new Date(RSVP_DEADLINE) - new Date()) / (1000 * 60 * 60 * 24)))

  useEffect(() => { loadRSVPs() }, [])

  async function loadRSVPs() {
    try {
      const sb = getSupabase()
      if (!sb) { setLoading(false); return }
      const { data, error } = await sb.from('tahoe_rsvps').select('*').order('name')
      if (error) console.error('Supabase error:', error)
      if (data) setRsvps(data)
    } catch (e) {
      console.error('Failed to load RSVPs:', e)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const sb = getSupabase()
      if (!sb) { setError('Unable to connect. Try again.'); setSubmitting(false); return }

      const existing = rsvps.find(r => r.name.toLowerCase() === form.name.trim().toLowerCase())
      const payload = {
        status: form.status,
        email: form.email || null,
        dietary: form.dietary || null,
        notes: form.notes || null,
        can_drive: form.can_drive,
        car_seats: form.can_drive ? (parseInt(form.car_seats) || 0) : 0,
        needs_ride: !form.can_drive && form.needs_ride,
        departure_area: form.departure_area || null,
        updated_at: new Date().toISOString(),
      }

      let result
      if (existing) {
        result = await sb.from('tahoe_rsvps').update(payload).eq('id', existing.id)
      } else {
        result = await sb.from('tahoe_rsvps').insert({ name: form.name.trim(), ...payload })
      }

      if (result.error) {
        console.error('Submit error:', result.error)
        setError('Something went wrong: ' + result.error.message)
        setSubmitting(false)
        return
      }

      await loadRSVPs()
      setSubmitting(false)
      setSubmitted(true)
      setFormOpen(false)
      setForm({ name: '', email: '', status: 'confirmed', dietary: '', notes: '', can_drive: false, car_seats: 0, needs_ride: true, departure_area: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (e) {
      console.error('Submit failed:', e)
      setError('Failed to submit. Please try again.')
      setSubmitting(false)
    }
  }

  const statusCounts = rsvps.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <Section id="rsvp" Icon={HandIcon} title="RSVP">
      {/* Deadline banner */}
      <div className={`text-center mb-6 p-4 rounded-lg ${deadlinePassed ? 'bg-red-900/30 border border-red-700/50' : 'bg-amber/10 border border-amber/20'}`}>
        {deadlinePassed ? (
          <p className="text-red-400 font-semibold">RSVPs are now closed</p>
        ) : (
          <>
            <p className="text-amber font-semibold">RSVPs close Friday, March 27th</p>
            <p className="text-slate-400 text-sm mt-1">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left to sign up</p>
          </>
        )}
      </div>

      {/* Add to Calendar */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <a href={GCAL_URL} target="_blank" rel="noopener"
          className="bg-forest/30 border border-green-700/50 text-green-300 px-4 py-2 rounded-full text-sm font-semibold hover:bg-forest/50 transition flex items-center gap-2">
          <CalendarPlusIcon className="w-4 h-4" /> Add to Google Calendar
        </a>
        <button onClick={generateICS}
          className="bg-deep-blue border border-card-border text-slate-300 px-4 py-2 rounded-full text-sm font-semibold hover:bg-card-border/30 transition flex items-center gap-2">
          <DownloadIcon className="w-4 h-4" /> Download .ics file
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={`p-3 rounded-lg border text-center ${STATUS_COLORS[key]}`}>
            <div className="text-xs font-semibold">{label}</div>
            <div className="text-xl font-bold mt-1">{statusCounts[key] || 0}</div>
          </div>
        ))}
      </div>

      {/* Success / Error messages */}
      {submitted && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 text-sm text-center flex items-center justify-center gap-2">
          <CheckIcon className="w-4 h-4" /> RSVP submitted! See you in Tahoe.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* RSVP form */}
      {!deadlinePassed && (
        <div className="text-center mb-6">
          {!formOpen ? (
            <button onClick={() => setFormOpen(true)}
              className="bg-amber text-midnight font-bold px-8 py-3 rounded-full hover:bg-amber-light transition text-lg flex items-center gap-2 mx-auto">
              <MountainIcon className="w-5 h-5" /> RSVP Now
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="card max-w-lg mx-auto text-left">
              <h3 className="font-bold text-lg mb-4 text-amber">Sign Up for Tahoe</h3>
              <div className="space-y-4">
                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Your Name *</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm" placeholder="First and Last" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Email (for updates)</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm" placeholder="you@example.com" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Are you coming?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['confirmed', "I'm in!"], ['maybe', 'Maybe'], ['interested', 'Interested'], ['cant', "Can't make it"]].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm({ ...form, status: val })}
                        className={`text-sm py-2 px-3 rounded border transition ${form.status === val ? STATUS_COLORS[val] + ' font-bold' : 'border-card-border text-slate-400 hover:border-slate-500'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rideshare section */}
                {(form.status === 'confirmed' || form.status === 'interested' || form.status === 'maybe') && (
                  <div className="p-4 bg-deep-blue/50 border border-card-border rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-amber flex items-center gap-2"><CarIcon className="w-4 h-4" /> Transportation</h4>

                    {/* Can drive toggle */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.can_drive}
                          onChange={e => setForm({ ...form, can_drive: e.target.checked, needs_ride: !e.target.checked })}
                          className="w-4 h-4 rounded border-card-border bg-deep-blue accent-amber" />
                        <span className="text-sm">I can drive</span>
                      </label>
                    </div>

                    {/* If driving: how many seats */}
                    {form.can_drive && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Open seats for passengers</label>
                        <input type="number" min={0} max={7} value={form.car_seats}
                          onChange={e => setForm({ ...form, car_seats: parseInt(e.target.value) || 0 })}
                          className="w-20 bg-deep-blue border border-card-border rounded px-3 py-2 text-sm text-center" />
                      </div>
                    )}

                    {/* If not driving: needs ride */}
                    {!form.can_drive && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.needs_ride}
                          onChange={e => setForm({ ...form, needs_ride: e.target.checked })}
                          className="w-4 h-4 rounded border-card-border bg-deep-blue accent-amber" />
                        <span className="text-sm">I need a ride</span>
                      </label>
                    )}

                    {/* Departure area */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Departing from</label>
                      <select value={form.departure_area} onChange={e => setForm({ ...form, departure_area: e.target.value })}
                        className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm">
                        <option value="">Select area...</option>
                        <option value="SF">San Francisco</option>
                        <option value="East Bay">East Bay / Berkeley / Oakland</option>
                        <option value="Peninsula">Peninsula / South Bay</option>
                        <option value="Marin">Marin / North Bay</option>
                        <option value="Sacramento">Sacramento area</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Dietary & Notes */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Dietary restrictions</label>
                    <input value={form.dietary} onChange={e => setForm({ ...form, dietary: e.target.value })}
                      className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm" placeholder="Vegetarian, allergies, etc." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Notes</label>
                    <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full bg-deep-blue border border-card-border rounded px-3 py-2 text-sm" placeholder="Anything else?" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-amber text-midnight font-bold py-2 rounded-lg hover:bg-amber-light transition disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit RSVP'}
                </button>
                <button type="button" onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-card-border rounded-lg text-slate-400 hover:text-white transition">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Roster */}
      {loading ? (
        <p className="text-center text-slate-400">Loading RSVPs...</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {rsvps.map((person) => (
            <button key={person.id} onClick={() => {
              if (deadlinePassed) return
              setForm({
                name: person.name,
                email: person.email || '',
                status: person.status || 'confirmed',
                dietary: person.dietary || '',
                notes: person.notes || '',
                can_drive: person.can_drive || false,
                car_seats: person.car_seats || 0,
                needs_ride: person.needs_ride || false,
                departure_area: person.departure_area || '',
              })
              setFormOpen(true)
              document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }} className={`card !p-3 text-left w-full ${deadlinePassed ? '' : 'hover:border-amber/40 cursor-pointer transition'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{person.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[person.status] || 'text-slate-400 border-slate-600'}`}>
                  {STATUS_LABELS[person.status] || person.status}
                </span>
              </div>
              {(person.can_drive || person.needs_ride || person.departure_area) && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {person.can_drive && <span className="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded inline-flex items-center gap-1"><CarIcon className="w-3 h-3" /> Driver ({person.car_seats} seats)</span>}
                  {person.needs_ride && <span className="text-xs bg-amber/10 text-amber px-1.5 py-0.5 rounded">Needs ride</span>}
                  {person.departure_area && <span className="text-xs text-slate-500">{person.departure_area}</span>}
                </div>
              )}
              {!deadlinePassed && <div className="text-xs text-slate-600 mt-1">Tap to edit</div>}
            </button>
          ))}
        </div>
      )}
    </Section>
  )
}

function RideshareBoard({ rsvps }) {
  const drivers = rsvps.filter(r => r.can_drive && (r.status === 'confirmed' || r.status === 'interested' || r.status === 'maybe'))
  const needsRide = rsvps.filter(r => r.needs_ride && !r.can_drive && (r.status === 'confirmed' || r.status === 'interested' || r.status === 'maybe'))
  const totalSeats = drivers.reduce((sum, d) => sum + (d.car_seats || 0), 0)

  const byArea = needsRide.reduce((acc, r) => {
    const area = r.departure_area || 'Unspecified'
    if (!acc[area]) acc[area] = []
    acc[area].push(r)
    return acc
  }, {})

  return (
    <div className="card mb-6">
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><CarIcon className="w-5 h-5 text-amber" /> Rideshare Board</h3>
      <p className="text-slate-400 text-sm mb-4">
        SLT is ~3.5 hrs from SF, ~2 hrs from Sacramento. Rideshare info from RSVPs updates automatically.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-center">
          <div className="text-xs text-green-400 font-semibold">Drivers</div>
          <div className="text-xl font-bold text-green-300">{drivers.length}</div>
        </div>
        <div className="p-3 bg-amber/10 border border-amber/20 rounded-lg text-center">
          <div className="text-xs text-amber font-semibold">Need Ride</div>
          <div className="text-xl font-bold text-amber">{needsRide.length}</div>
        </div>
        <div className="p-3 bg-deep-blue border border-card-border rounded-lg text-center">
          <div className="text-xs text-slate-400 font-semibold">Open Seats</div>
          <div className="text-xl font-bold">{totalSeats}</div>
        </div>
      </div>

      {/* Drivers */}
      {drivers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-amber mb-3">Drivers</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {drivers.map((d) => (
              <div key={d.id} className="bg-deep-blue/50 border border-card-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold">{d.name}</div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-900/50 text-green-400">
                    {d.car_seats} seat{d.car_seats !== 1 ? 's' : ''}
                  </span>
                </div>
                {d.departure_area && <div className="text-xs text-slate-400">{d.departure_area}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs a ride — grouped by area */}
      {needsRide.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-amber mb-3">Needs a Ride</h4>
          {Object.entries(byArea).map(([area, people]) => (
            <div key={area} className="mb-2">
              <div className="text-xs text-slate-500 mb-1">{area}</div>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <span key={p.id} className="text-xs bg-amber/10 text-amber border border-amber/20 px-3 py-1 rounded-full">{p.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {drivers.length === 0 && needsRide.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">No rideshare info yet. Fill in transportation details in your RSVP!</p>
      )}

      {/* CTA */}
      <div className="text-center mt-4">
        <a href="#rsvp" className="text-amber text-sm hover:underline">Update your transportation info in RSVP ↑</a>
      </div>
    </div>
  )
}

function useRSVPs() {
  const [rsvps, setRsvps] = useState([])
  useEffect(() => {
    async function load() {
      try {
        const sb = getSupabase()
        if (!sb) return
        const { data } = await sb.from('tahoe_rsvps').select('*').order('name')
        if (data) setRsvps(data)
      } catch (e) { console.error(e) }
    }
    load()
  }, [])
  return rsvps
}

export default function App() {
  const [activeDay, setActiveDay] = useState('friday')
  const rsvpsForRideshare = useRSVPs()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="gradient-hero min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 70%, #2d5a45 0%, transparent 50%), radial-gradient(circle at 70% 30%, #1a2744 0%, transparent 50%)'
        }} />
        <div className="relative z-10">
          <div className="text-amber font-semibold tracking-widest uppercase text-sm mb-4">The Men's Circle presents</div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
            Tahoe Away<br />Weekend
          </h1>
          <div className="flex items-center justify-center gap-3 text-xl md:text-2xl text-warm mb-6">
            <MountainIcon className="w-6 h-6" />
            <span>April 10–12, 2026</span>
            <TreesIcon className="w-6 h-6" />
          </div>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            A men's retreat weekend in South Lake Tahoe. Brotherhood, nature, growth.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#rsvp" className="bg-amber text-midnight font-bold px-6 py-3 rounded-full hover:bg-amber-light transition inline-flex items-center gap-2">
              <MountainIcon className="w-5 h-5" /> RSVP Now
            </a>
            <a href="#schedule" className="border border-amber/40 text-amber px-6 py-3 rounded-full hover:bg-amber/10 transition inline-flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> View Schedule
            </a>
            <a href="https://docs.google.com/document/d/1iuLwIFkA17469wrBGKQUgIJqzv8TH2cy0YBASMI5bLs/edit"
              target="_blank" rel="noopener"
              className="border border-slate-600 text-slate-400 px-6 py-3 rounded-full hover:bg-slate-800/50 transition">
              Planning Doc
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-midnight to-transparent" />
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-midnight/90 backdrop-blur-md border-b border-card-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-center gap-6 overflow-x-auto text-sm font-medium">
          {[
            ['schedule', 'Schedule', CalendarIcon],
            ['accommodation', 'Stay', BedIcon],
            ['activities', 'Activities', TargetIcon],
            ['logistics', 'Logistics', MapIcon],
            ['rsvp', 'RSVP', HandIcon],
            ['costs', 'Costs', DollarIcon],
          ].map(([id, label, NavIcon]) => (
            <a key={id} href={`#${id}`} className="text-slate-400 hover:text-amber whitespace-nowrap transition flex items-center gap-1.5">
              <NavIcon className="w-4 h-4" />{label}
            </a>
          ))}
        </div>
      </nav>

      {/* Schedule */}
      <Section id="schedule" Icon={CalendarIcon} title="Weekend Schedule">
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {Object.entries(SCHEDULE).map(([key, day]) => (
            <button key={key} className={`day-tab ${activeDay === key ? 'active' : ''}`} onClick={() => setActiveDay(key)}>
              <day.Icon className="w-4 h-4 inline mr-1" /> {day.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {SCHEDULE[activeDay].events.map((ev, i) => (
            <div key={i} className="card flex gap-4 items-start">
              <ev.Icon className="w-6 h-6 text-amber mt-1 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-amber font-mono text-sm">{ev.time}</span>
                  <span className="font-bold">{ev.title}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{ev.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Accommodation */}
      <Section id="accommodation" Icon={BedIcon} title="Where to Stay">
        <div className="grid md:grid-cols-2 gap-4">
          {ACCOMMODATIONS.map((a, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <a.Icon className="w-6 h-6 text-amber shrink-0" />
                  <span className="font-bold text-lg">{a.title}</span>
                </div>
                <span className="text-amber font-bold text-sm">{a.price}</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">{a.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-green-400 font-semibold mb-1">Pros</div>
                  {a.pros.map((p, j) => <div key={j} className="text-slate-400">✓ {p}</div>)}
                </div>
                <div>
                  <div className="text-red-400 font-semibold mb-1">Cons</div>
                  {a.cons.map((c, j) => <div key={j} className="text-slate-400">✗ {c}</div>)}
                </div>
              </div>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener" className="inline-block mt-3 text-amber text-sm hover:underline">
                  View details →
                </a>
              )}
              {a.links && (
                <div className="mt-3 space-y-1">
                  {a.links.map((link, j) => (
                    <a key={j} href={link.url} target="_blank" rel="noopener" className="block text-amber text-sm hover:underline">
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}
              {a.priceNum > 0 && <CostCalculator pricePerNight={a.priceNum} label={`Split ${a.title} cost`} />}
            </div>
          ))}
        </div>
      </Section>

      {/* Activities */}
      <Section id="activities" Icon={TargetIcon} title="Activities">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="card">
              <a.Icon className="w-7 h-7 text-amber mb-2" />
              <h3 className="font-bold mb-1">{a.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{a.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber font-semibold">{a.price}</span>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener" className="text-xs text-slate-400 hover:text-amber transition">
                    Learn more →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Logistics */}
      <Section id="logistics" Icon={MapIcon} title="Logistics">
        {/* Rideshare — now powered by RSVP data */}
        <RideshareBoard rsvps={rsvpsForRideshare} />

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Meal Planning */}
          <div className="card">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><UtensilsIcon className="w-5 h-5 text-amber" /> Meal Planning</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Fri Dinner', 'TBD'],
                ['Sat Breakfast', 'TBD'],
                ['Sat Lunch', 'TBD'],
                ['Sat Dinner', 'TBD'],
                ['Sun Breakfast', 'TBD'],
                ['Sun Lunch', 'TBD'],
              ].map(([meal, team]) => (
                <div key={meal} className="flex justify-between">
                  <span className="text-slate-400">{meal}</span>
                  <span className="text-amber">{team}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packing List */}
        <div className="card mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BackpackIcon className="w-5 h-5 text-amber" /> What to Bring</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PACKING_LIST.map((cat, i) => (
              <div key={i}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><cat.Icon className="w-4 h-4 text-amber" />{cat.category}</h4>
                <ul className="space-y-1">
                  {cat.items.map((item, j) => (
                    <li key={j} className="text-slate-400 text-sm flex items-start gap-1">
                      <span className="text-slate-600 mt-0.5">○</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="card">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><MapIcon className="w-5 h-5 text-amber" /> Base Camp Location</h3>
          <p className="text-slate-400 text-sm mb-3">1201 Wildwood Ave., Unit 16, South Lake Tahoe, CA 96150</p>
          <div className="rounded-lg overflow-hidden aspect-video">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3080.5!2d-119.9847!3d38.9347!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80998531e6f35b53%3A0x0!2s1201+Wildwood+Ave+South+Lake+Tahoe+CA+96150!5e0!3m2!1sen!2sus!4v1"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Base Camp Location"
            />
          </div>
        </div>
      </Section>

      {/* RSVP */}
      <RSVPSection />

      {/* Cost Sharing */}
      <Section id="costs" Icon={DollarIcon} title="Cost Sharing">
        <div className="max-w-xl mx-auto">
          <SharedCostCalculator />
        </div>
      </Section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to join us?</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">Brotherhood, nature, growth. Three days in Tahoe with men who show up.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="#rsvp" className="bg-amber text-midnight font-bold px-8 py-3 rounded-full hover:bg-amber-light transition text-lg inline-flex items-center gap-2">
            <MountainIcon className="w-5 h-5" /> RSVP Now
          </a>
          <a href={GCAL_URL} target="_blank" rel="noopener"
            className="border border-green-700/50 text-green-300 px-6 py-3 rounded-full hover:bg-forest/30 transition inline-flex items-center gap-2">
            <CalendarPlusIcon className="w-4 h-4" /> Add to Calendar
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-12 px-4 text-center">
        <p className="text-slate-400 mb-2">Questions? Contact Evan Drake</p>
        <a href="mailto:iamevandrake@gmail.com" className="text-amber hover:underline">iamevandrake@gmail.com</a>
        <div className="mt-6 flex gap-4 justify-center">
          <a href="https://docs.google.com/document/d/1iuLwIFkA17469wrBGKQUgIJqzv8TH2cy0YBASMI5bLs/edit"
            target="_blank" rel="noopener" className="text-slate-500 hover:text-amber text-sm transition">
            Full Planning Doc
          </a>
        </div>
        <p className="text-slate-600 text-xs mt-6">TMC Tahoe Away Weekend 2026</p>
      </footer>
    </div>
  )
}
