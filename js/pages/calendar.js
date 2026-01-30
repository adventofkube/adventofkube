import { START_DATE, DAYS } from '../config.js';

function getDayState(dayNumber) {
  // Check if completed in localStorage
  const completed = localStorage.getItem(`day${dayNumber}_completed`);
  if (completed) return 'completed';

  // Day 0 is always unlocked
  if (dayNumber === 0) return 'unlocked';

  // Check if unlocked based on date
  const unlockDate = new Date(START_DATE);
  unlockDate.setDate(unlockDate.getDate() + dayNumber - 1);

  const now = new Date();
  if (now >= unlockDate) return 'unlocked';

  return 'locked';
}

export function renderCalendar(app, navigate) {
  // Render day 0 as a full-width tile above the grid
  const dayZero = DAYS.find(d => d.day === 0);
  let dayZeroHtml = '';
  if (dayZero) {
    const state = getDayState(0);
    let statusText = state === 'completed' ? 'COMPLETE' : 'OPEN';
    const tag = 'a';
    const href = `href="/day/0" data-link`;

    dayZeroHtml = `
      <div class="day-zero-row">
        <${tag} class="day-tile day-zero ${state}" ${href}>
          <span class="day-number">Day 0</span>
          <span class="day-title">${dayZero.title}</span>
          <span class="day-status">${statusText}</span>
        </${tag}>
      </div>
    `;
  }

  // Render days 1–25 in the grid
  let tilesHtml = '';
  for (const day of DAYS) {
    if (day.day === 0) continue;

    const state = getDayState(day.day);
    let statusText = '';
    if (state === 'locked') statusText = 'LOCKED';
    else if (state === 'completed') statusText = 'COMPLETE';
    else statusText = 'OPEN';

    const isClickable = state !== 'locked';
    const tag = isClickable ? 'a' : 'div';
    const href = isClickable ? `href="/day/${day.day}" data-link` : '';

    tilesHtml += `
      <${tag} class="day-tile ${state}" ${href}>
        <span class="day-number">${day.day}</span>
        <span class="day-status">${statusText}</span>
      </${tag}>
    `;
  }

  app.innerHTML = `
    <div class="calendar-header">
      <h1>Challenge Calendar</h1>
    </div>
    ${dayZeroHtml}
    <div class="calendar-grid">
      ${tilesHtml}
    </div>
  `;
}
