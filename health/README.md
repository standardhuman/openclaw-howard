# Health Data

Daily health summaries from Apple Health via Shortcuts automation.

## Format

Each file is `YYYY-MM-DD.json` containing yesterday's health data:

```json
{
  "date": "2026-03-06",
  "steps": 8432,
  "active_calories": 412,
  "resting_heart_rate": 58,
  "sleep_hours": 7.2,
  "workouts": [
    {
      "type": "Running",
      "duration_min": 45,
      "calories": 380,
      "distance_mi": 4.2
    }
  ]
}
```

## Setup

Apple Shortcut "Daily Health Export" runs at 5:30am via Personal Automation.

### Shortcut Steps

1. **Get dates**
   - Action: `Adjust Date` → subtract 1 day from Current Date → save as `Yesterday`
   - Action: `Format Date` → Yesterday as `yyyy-MM-dd` → save as `DateStr`

2. **Query Health samples** (each uses "Find Health Samples Where Start Date is Yesterday")
   - Steps: `Find Health Samples` → Type: Steps → Start Date is in `Yesterday` → Get: Sum
   - Active Energy: `Find Health Samples` → Type: Active Energy → Sum
   - Resting Heart Rate: `Find Health Samples` → Type: Resting Heart Rate → sort by date desc → Get First → Value
   - Sleep Analysis: `Find Health Samples` → Type: Sleep Analysis → filter for "Asleep" → Sum duration

3. **Query Workouts**
   - `Find Health Samples` → Type: Workouts → Start Date is in `Yesterday`
   - For each: get Type, Duration, Calories, Distance

4. **Build JSON text**
   - Use `Text` action to construct the JSON string with all variables

5. **Save file**
   - `Save File` → to Shortcuts folder or iCloud Drive
   - Path: `Health/YYYY-MM-DD.json`

6. **Copy to Mac** (choose one):
   - **Option A (iCloud):** Save to iCloud Drive → file syncs to Mac → symlink or cron copies to `~/clawd/health/`
   - **Option B (SSH):** Run `scp` or `rsync` via Shortcut SSH action to push to Mac Mini
   - **Option C (Pushcut/webhook):** POST the JSON to a local endpoint

### Automation Trigger

- Open Shortcuts app → Automation tab → Personal Automation
- Time of Day: 5:30 AM, Daily
- Run Immediately (no confirmation)
- Action: Run Shortcut "Daily Health Export"

## Usage in Cron Jobs

Dawn Patrol and Evening Debrief read the latest file:
```bash
cat ~/clawd/health/$(date -v-0d +%Y-%m-%d).json 2>/dev/null
```
