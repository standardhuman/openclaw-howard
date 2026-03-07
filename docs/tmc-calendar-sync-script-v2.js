/**
 * TMC Brotherhood Events — Bidirectional Sync v2.1
 * 
 * Spreadsheet ↔ Google Calendar
 * 
 * SETUP:
 * 1. Open the spreadsheet → Extensions → Apps Script
 * 2. Paste this entire file into Code.gs (replace existing code)
 * 3. Run setupTriggers() once (installs triggers + creates dropdown validation)
 * 4. Authorize when prompted
 * 5. Run fullSyncSheetToCalendar() to push existing "Publish" rows
 * 
 * PUBLISH COLUMN (G):
 * - (blank)    → Draft. Event is not on the calendar.
 * - Publish    → Create or update the calendar event + invite members.
 * - Unpublish  → Remove the calendar event. Row stays in sheet for planning.
 * 
 * Events are ONLY synced to the calendar when column G = "Publish".
 * 
 * SHEETS:
 * - Sheet1: Main event tracker
 * - Member Directory: Email → Name lookup (auto-created on first run)
 * 
 * COLUMNS (Sheet1):
 * A: Sponsor | B: Co-sponsor | C: Event Name | D: Theme
 * E: Location | F: Other Notes | G: Publish | H: Date
 * I: Start Time | J: End Time | K: Attendees (auto)
 * L: Headcount (auto) | M: Status (auto) | N: Calendar Link (auto)
 * O: Event ID (hidden)
 */

const CALENDAR_ID = 'b7cad28ac6a1dc2c862ddfb8af611eb955f6748c042309ef8ea5bdc27b9c31ec@group.calendar.google.com';
const SHEET_NAME = 'Events';
const DIRECTORY_SHEET = 'Member Directory';
const EVENT_ID_COL = 15; // Column O
const HEADER_ROW = 1;

const COL = {
  SPONSOR: 1,
  COSPONSOR: 2,
  NAME: 3,
  THEME: 4,
  LOCATION: 5,
  OTHER: 6,
  PUBLISH: 7,       // "Publish" | "Unpublish" | blank (draft)
  DATE: 8,
  START: 9,
  END: 10,
  ATTENDEES: 11,
  HEADCOUNT: 12,
  STATUS: 13,
  CAL_LINK: 14,
  EVENT_ID: 15,
};

// ─── SETUP ───────────────────────────────────────────────

/**
 * Run once to set up triggers and the Member Directory sheet.
 */
function setupTriggers() {
  // Remove existing triggers
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // On edit → push changes to calendar
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  // Every hour → pull calendar changes + update statuses
  ScriptApp.newTrigger('hourlySyncAndUpdate')
    .timeBased()
    .everyHours(1)
    .create();

  // Ensure headers, dropdown, and directory exist
  ensureHeaders();
  ensurePublishDropdown();
  ensureDirectorySheet();

  Logger.log('Setup complete: triggers installed, headers set, Publish dropdown ready, directory ready.');
}

/**
 * Ensure Sheet1 has all column headers.
 */
function ensureHeaders() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const headers = [
    'Full Name Event Sponsor', 'Full Name Co-sponsor',
    'Brotherhood Event Name', 'Brotherhood Event Theme',
    'Brotherhood Event Location', 'Other', 'Publish', 'Date',
    'Start Time', 'End Time', 'Attendees', 'Headcount',
    'Status', 'Calendar Link', 'Event ID'
  ];

  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
}

/**
 * Add data validation dropdown to the Publish column (G).
 * Applies to rows 2–500 (extend if needed).
 */
function ensurePublishDropdown() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Publish', 'Unpublish'], true)  // true = show dropdown
    .setAllowInvalid(false)  // prevent free text
    .build();

  // Apply to G2:G500
  sheet.getRange(HEADER_ROW + 1, COL.PUBLISH, 499, 1).setDataValidation(rule);
}

/**
 * Create the Member Directory sheet if it doesn't exist.
 * Two columns: Email, Name
 */
function ensureDirectorySheet() {
  const ss = SpreadsheetApp.getActive();
  let dir = ss.getSheetByName(DIRECTORY_SHEET);
  if (!dir) {
    dir = ss.insertSheet(DIRECTORY_SHEET);
    dir.getRange(1, 1, 1, 2).setValues([['Email', 'Name']]);
    dir.setColumnWidth(1, 250);
    dir.setColumnWidth(2, 200);
    Logger.log('Created Member Directory sheet. Add email→name rows to auto-resolve sponsors.');
  }
}

// ─── SHEET → CALENDAR ────────────────────────────────────

/**
 * On-edit trigger.
 */
function onSheetEdit(e) {
  const sheet = e.source.getSheetByName(SHEET_NAME);
  if (!sheet || e.range.getSheet().getName() !== SHEET_NAME) return;
  if (e.range.getRow() <= HEADER_ROW) return;
  syncRowToCalendar(sheet, e.range.getRow());
}

/**
 * Push a single row to the calendar — only if Publish column = "Publish".
 * If "Unpublish", delete the calendar event and clear auto-columns.
 * If blank (draft), do nothing.
 */
function syncRowToCalendar(sheet, row) {
  const data = sheet.getRange(row, 1, 1, EVENT_ID_COL).getValues()[0];

  const publishState = (data[COL.PUBLISH - 1] || '').toString().trim();
  const existingEventId = data[COL.EVENT_ID - 1];
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  // ── UNPUBLISH: delete calendar event, clear auto-columns ──
  if (publishState === 'Unpublish') {
    if (existingEventId) {
      try {
        const event = calendar.getEventById(existingEventId);
        if (event) {
          Logger.log('Unpublishing: ' + event.getTitle());
          event.deleteEvent();
        }
      } catch (e) {}
      // Clear auto-columns
      sheet.getRange(row, COL.EVENT_ID).setValue('');
      sheet.getRange(row, COL.ATTENDEES).setValue('');
      sheet.getRange(row, COL.HEADCOUNT).setValue('');
      sheet.getRange(row, COL.STATUS).setValue('Unpublished');
      sheet.getRange(row, COL.CAL_LINK).setValue('');
    }
    return;
  }

  // ── DRAFT (blank): do nothing ──
  if (publishState !== 'Publish') return;

  // ── PUBLISH: create or update calendar event ──
  const eventName = data[COL.NAME - 1];
  const dateVal = data[COL.DATE - 1];
  const startVal = data[COL.START - 1];
  const endVal = data[COL.END - 1];

  if (!eventName || !dateVal || !startVal || !endVal) {
    // Not enough data to publish — set status as a hint
    sheet.getRange(row, COL.STATUS).setValue('Missing details');
    return;
  }

  const startDt = combineDateAndTime(dateVal, startVal);
  const endDt = combineDateAndTime(dateVal, endVal);
  if (!startDt || !endDt) return;

  const sponsor = data[COL.SPONSOR - 1] || '';
  const cosponsor = data[COL.COSPONSOR - 1] || '';
  const theme = data[COL.THEME - 1] || '';
  const other = data[COL.OTHER - 1] || '';
  const location = data[COL.LOCATION - 1] || '';

  let desc = '';
  if (theme) desc += theme + '\n\n';
  if (sponsor) desc += 'Sponsor: ' + sponsor + '\n';
  if (cosponsor) desc += 'Co-sponsor: ' + cosponsor + '\n';
  if (other) desc += '\n' + other;
  desc = desc.trim();

  let event = null;
  let isNewEvent = false;

  if (existingEventId) {
    try {
      event = calendar.getEventById(existingEventId);
      if (event) {
        // Only update fields that actually changed to avoid
        // Google sending update notifications to all guests
        if (event.getTitle() !== eventName) event.setTitle(eventName);
        if (event.getStartTime().getTime() !== startDt.getTime() ||
            event.getEndTime().getTime() !== endDt.getTime()) {
          event.setTime(startDt, endDt);
        }
        if (stripHtml(event.getDescription() || '') !== desc) event.setDescription(desc);
        if (location && event.getLocation() !== location) event.setLocation(location);
      }
    } catch (e) {
      event = null;
    }
  }

  if (!event) {
    event = calendar.createEvent(eventName, startDt, endDt, {
      description: desc,
      location: location,
    });
    sheet.getRange(row, COL.EVENT_ID).setValue(event.getId());
    isNewEvent = true;
  }

  // On new events: invite all members.
  // On existing events: only add members who aren't already guests.
  if (isNewEvent) {
    inviteAllMembers(event);
  } else {
    inviteNewMembersOnly(event);
  }

  // Update auto-columns for this row
  updateAutoColumns(sheet, row, event);
}

/**
 * Push all rows to calendar.
 */
function fullSyncSheetToCalendar() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  for (let row = HEADER_ROW + 1; row <= lastRow; row++) {
    syncRowToCalendar(sheet, row);
  }
  Logger.log('Full sync complete: rows ' + (HEADER_ROW + 1) + ' to ' + lastRow);
}

// ─── CALENDAR → SHEET ────────────────────────────────────

/**
 * Hourly trigger: pull new calendar events, clean orphans, refresh auto-columns.
 */
function hourlySyncAndUpdate() {
  calendarToSheet();
  cleanOrphanedEvents();
  refreshAllAutoColumns();
}

/**
 * Pull non-recurring events from calendar into the sheet.
 */
function calendarToSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const directory = getEmailDirectory();

  // Look 6 months back and 6 months ahead
  const now = new Date();
  const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(past, future);

  const lastRow = Math.max(sheet.getLastRow(), HEADER_ROW);
  const existingIds = new Set();
  const existingNames = new Set();

  if (lastRow > HEADER_ROW) {
    sheet.getRange(HEADER_ROW + 1, COL.EVENT_ID, lastRow - HEADER_ROW, 1).getValues()
      .forEach(r => { if (r[0]) existingIds.add(r[0]); });
    sheet.getRange(HEADER_ROW + 1, COL.NAME, lastRow - HEADER_ROW, 1).getValues()
      .forEach(r => { if (r[0]) existingNames.add(r[0].toString().trim().toLowerCase()); });
  }

  for (const event of events) {
    if (event.isRecurringEvent()) continue;

    const eventId = event.getId();
    if (existingIds.has(eventId)) continue;

    const title = event.getTitle();
    if (existingNames.has(title.trim().toLowerCase())) continue;

    // Strip HTML from description
    const rawDesc = event.getDescription() || '';
    const desc = stripHtml(rawDesc);

    // Resolve creator email to name
    let sponsor = '';
    const creators = event.getCreators();
    if (creators && creators.length > 0) {
      sponsor = directory[creators[0].toLowerCase()] || creators[0];
    }

    // Parse structured description
    let cosponsor = '', theme = '', other = '';
    const cosponsorMatch = desc.match(/Co-sponsor:\s*(.+)/i);
    const sponsorMatch = desc.match(/Sponsor:\s*(.+)/i);
    if (sponsorMatch) {
      // Only use if we didn't already get creator name
      if (!sponsor) sponsor = sponsorMatch[1].trim();
    }
    if (cosponsorMatch) cosponsor = cosponsorMatch[1].trim();

    // First line that's not a sponsor tag = theme
    const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && !lines[0].match(/^(Sponsor|Co-sponsor):/i)) {
      theme = lines[0];
    }
    other = lines.filter(l =>
      l !== theme && !l.match(/^Sponsor:/i) && !l.match(/^Co-sponsor:/i)
    ).join('\n');

    const startDt = event.getStartTime();
    const endDt = event.getEndTime();
    const location = event.getLocation() || '';
    const tz = Session.getScriptTimeZone();

    // Attendee info
    const attendeeInfo = getAttendeeInfo(event, directory);

    // Status
    const status = getEventStatus(event);

    // Calendar link
    const calLink = 'https://calendar.google.com/calendar/event?eid=' +
      Utilities.base64Encode(eventId.split('@')[0] + ' ' + CALENDAR_ID);

    const newRow = [
      sponsor, cosponsor, title, theme, location, other,
      'Publish',
      Utilities.formatDate(startDt, tz, 'M/d/yy'),
      Utilities.formatDate(startDt, tz, 'h:mm a'),
      Utilities.formatDate(endDt, tz, 'h:mm a'),
      attendeeInfo.names,
      attendeeInfo.yesCount,
      status,
      calLink,
      eventId
    ];
    sheet.appendRow(newRow);
    existingIds.add(eventId);
    existingNames.add(title.trim().toLowerCase());
  }
}

/**
 * Invite all members from the Member Directory to an event.
 * Skips anyone already on the guest list.
 */
function inviteAllMembers(event) {
  const directory = getEmailDirectory();
  const emails = Object.keys(directory);
  if (emails.length === 0) return;

  // Get existing guest emails to avoid duplicate invites
  const existingGuests = new Set();
  try {
    const guests = event.getGuestList(false);
    for (const g of guests) {
      existingGuests.add(g.getEmail().toLowerCase());
    }
  } catch (e) {}

  for (const email of emails) {
    if (!existingGuests.has(email.toLowerCase())) {
      event.addGuest(email);
    }
  }
}

/**
 * Only invite members who aren't already on the guest list.
 * Used for existing events to catch new directory additions
 * without re-notifying everyone.
 */
function inviteNewMembersOnly(event) {
  const directory = getEmailDirectory();
  const emails = Object.keys(directory);
  if (emails.length === 0) return;

  const existingGuests = new Set();
  try {
    const guests = event.getGuestList(false);
    for (const g of guests) {
      existingGuests.add(g.getEmail().toLowerCase());
    }
  } catch (e) { return; }

  let added = 0;
  for (const email of emails) {
    if (!existingGuests.has(email.toLowerCase())) {
      event.addGuest(email);
      added++;
    }
  }
  if (added > 0) {
    Logger.log('Added ' + added + ' new member(s) to: ' + event.getTitle());
  }
}

/**
 * Delete calendar events whose event ID no longer appears in any sheet row.
 * Only touches non-recurring events on the TMC calendar.
 */
function cleanOrphanedEvents() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const lastRow = sheet.getLastRow();

  // Collect all event IDs still in the sheet
  const sheetEventIds = new Set();
  if (lastRow > HEADER_ROW) {
    sheet.getRange(HEADER_ROW + 1, COL.EVENT_ID, lastRow - HEADER_ROW, 1).getValues()
      .forEach(r => { if (r[0]) sheetEventIds.add(r[0]); });
  }

  // Check calendar events against sheet
  const now = new Date();
  const future = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(now, future);

  for (const event of events) {
    if (event.isRecurringEvent()) continue;
    const eventId = event.getId();
    if (!sheetEventIds.has(eventId)) {
      Logger.log('Deleting orphaned event: ' + event.getTitle() + ' (' + eventId + ')');
      event.deleteEvent();
    }
  }
}

// ─── AUTO-COLUMNS ────────────────────────────────────────

/**
 * Update attendees, headcount, status, and calendar link for one row.
 */
function updateAutoColumns(sheet, row, event) {
  if (!event) {
    const eventId = sheet.getRange(row, COL.EVENT_ID).getValue();
    if (!eventId) return;
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    try { event = calendar.getEventById(eventId); } catch (e) { return; }
    if (!event) return;
  }

  const directory = getEmailDirectory();
  const attendeeInfo = getAttendeeInfo(event, directory);
  const status = getEventStatus(event);
  const calLink = 'https://calendar.google.com/calendar/event?eid=' +
    Utilities.base64Encode(event.getId().split('@')[0] + ' ' + CALENDAR_ID);

  sheet.getRange(row, COL.ATTENDEES).setValue(attendeeInfo.names);
  sheet.getRange(row, COL.HEADCOUNT).setValue(attendeeInfo.yesCount);
  sheet.getRange(row, COL.STATUS).setValue(status);
  sheet.getRange(row, COL.CAL_LINK).setValue(calLink);
}

/**
 * Refresh auto-columns for all rows.
 */
function refreshAllAutoColumns() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const directory = getEmailDirectory();
  const lastRow = sheet.getLastRow();

  if (lastRow <= HEADER_ROW) return;

  const eventIds = sheet.getRange(HEADER_ROW + 1, COL.EVENT_ID, lastRow - HEADER_ROW, 1).getValues();
  const dates = sheet.getRange(HEADER_ROW + 1, COL.DATE, lastRow - HEADER_ROW, 1).getValues();

  for (let i = 0; i < eventIds.length; i++) {
    const row = i + HEADER_ROW + 1;
    const eventId = eventIds[i][0];
    const dateVal = dates[i][0];

    // Status can be computed without calendar API for past events
    if (!eventId && dateVal) {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const status = d < new Date() ? 'Past' : 'Upcoming';
        sheet.getRange(row, COL.STATUS).setValue(status);
      }
      continue;
    }

    if (!eventId) continue;

    try {
      const event = calendar.getEventById(eventId);
      if (event) {
        const attendeeInfo = getAttendeeInfo(event, directory);
        const status = getEventStatus(event);
        const calLink = 'https://calendar.google.com/calendar/event?eid=' +
          Utilities.base64Encode(eventId.split('@')[0] + ' ' + CALENDAR_ID);

        sheet.getRange(row, COL.ATTENDEES).setValue(attendeeInfo.names);
        sheet.getRange(row, COL.HEADCOUNT).setValue(attendeeInfo.yesCount);
        sheet.getRange(row, COL.STATUS).setValue(status);
        sheet.getRange(row, COL.CAL_LINK).setValue(calLink);
      } else {
        // Event was deleted from calendar
        sheet.getRange(row, COL.STATUS).setValue('Cancelled');
        sheet.getRange(row, COL.EVENT_ID).setValue('');
        sheet.getRange(row, COL.ATTENDEES).setValue('');
        sheet.getRange(row, COL.HEADCOUNT).setValue('');
        sheet.getRange(row, COL.CAL_LINK).setValue('');
      }
    } catch (e) {
      // Event can't be fetched — likely deleted
      sheet.getRange(row, COL.STATUS).setValue('Cancelled');
      sheet.getRange(row, COL.EVENT_ID).setValue('');
    }
  }
}

// ─── HELPERS ─────────────────────────────────────────────

/**
 * Get attendee info from a calendar event.
 * Returns { names: "Name (Yes), Name (No), ...", yesCount: N }
 */
function getAttendeeInfo(event, directory) {
  const guests = event.getGuestList(true); // include self
  if (!guests || guests.length === 0) {
    return { names: '', yesCount: 0 };
  }

  let yesCount = 0;
  const parts = [];

  for (const guest of guests) {
    const email = guest.getEmail().toLowerCase();
    const name = guest.getName() || directory[email] || email;
    const guestStatus = guest.getGuestStatus();

    let statusLabel = '';
    if (guestStatus === CalendarApp.GuestStatus.YES) {
      statusLabel = '✓';
      yesCount++;
    } else if (guestStatus === CalendarApp.GuestStatus.NO) {
      statusLabel = '✗';
    } else if (guestStatus === CalendarApp.GuestStatus.MAYBE) {
      statusLabel = '?';
    } else {
      statusLabel = '—';
    }

    parts.push(name + ' ' + statusLabel);
  }

  return { names: parts.join(', '), yesCount: yesCount };
}

/**
 * Determine event status.
 */
function getEventStatus(event) {
  const now = new Date();
  const start = event.getStartTime();
  const end = event.getEndTime();

  if (end < now) return 'Past';
  if (start <= now && end >= now) return 'Happening Now';
  return 'Upcoming';
}

/**
 * Load email→name directory from the Member Directory sheet.
 * Returns { "email@example.com": "First Last", ... }
 */
function getEmailDirectory() {
  const dir = {};
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(DIRECTORY_SHEET);
  if (!sheet) return dir;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return dir;

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (const row of data) {
    const email = (row[0] || '').toString().trim().toLowerCase();
    const name = (row[1] || '').toString().trim();
    if (email && name) dir[email] = name;
  }
  return dir;
}

/**
 * Strip HTML tags and clean up whitespace.
 */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n').map(l => l.trim()).join('\n')
    .trim();
}

/**
 * Parse flexible time formats.
 * Handles: "7:00 PM", "7pm", "7 pm", "7 p.m.", "7:00pm", "19:00"
 */
function parseTime(timeVal) {
  if (timeVal instanceof Date) {
    return { hours: timeVal.getHours(), minutes: timeVal.getMinutes() };
  }

  const str = timeVal.toString().trim();

  // "7:00 PM" / "7:00pm" / "7:00 p.m."
  let match = str.match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].replace(/\./g, '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  // "7pm" / "7 pm" / "7 p.m." / "7 PM"
  match = str.match(/^(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1]);
    const ampm = match[2].replace(/\./g, '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: 0 };
  }

  // 24-hour: "19:00"
  match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) };
  }

  return null;
}

/**
 * Combine a date value and a time value into a single Date.
 */
function combineDateAndTime(dateVal, timeVal) {
  try {
    let d;
    if (dateVal instanceof Date) {
      d = new Date(dateVal);
    } else {
      d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
    }

    // First try the flexible parser
    const parsed = parseTime(timeVal);
    if (parsed) {
      d.setHours(parsed.hours, parsed.minutes, 0, 0);
      return d;
    }

    // Fallback for Date objects from Sheets
    if (timeVal instanceof Date) {
      d.setHours(timeVal.getHours(), timeVal.getMinutes(), 0, 0);
      return d;
    }

    return null;
  } catch (e) {
    return null;
  }
}

// ─── TEST / DEBUG ────────────────────────────────────────

/**
 * Test function — check a specific row's data and parsing.
 */
function testRow() {
  const ROW = 6; // Change this to test different rows
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const data = sheet.getRange(ROW, 1, 1, EVENT_ID_COL).getValues()[0];
  Logger.log('Row ' + ROW + ' data: ' + JSON.stringify(data));

  const startDt = combineDateAndTime(data[COL.DATE - 1], data[COL.START - 1]);
  const endDt = combineDateAndTime(data[COL.DATE - 1], data[COL.END - 1]);
  Logger.log('Parsed start: ' + startDt + ' | end: ' + endDt);

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  Logger.log('Calendar found: ' + (calendar !== null));

  if (data[COL.EVENT_ID - 1]) {
    const event = calendar.getEventById(data[COL.EVENT_ID - 1]);
    if (event) {
      const dir = getEmailDirectory();
      Logger.log('Creators: ' + JSON.stringify(event.getCreators()));
      Logger.log('Attendees: ' + getAttendeeInfo(event, dir).names);
      Logger.log('Status: ' + getEventStatus(event));
    }
  }
}
