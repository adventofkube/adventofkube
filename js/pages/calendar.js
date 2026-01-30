import { START_DATE, DAYS } from '../config.js';

function getDayState(dayNumber) {
  // Check if completed in localStorage
  const completed = localStorage.getItem(`day${dayNumber}_completed`);
  if (completed) return 'completed';

  // Check if unlocked based on date
  const unlockDate = new Date(START_DATE);
  unlockDate.setDate(unlockDate.getDate() + dayNumber - 1);

  const now = new Date();
  if (now >= unlockDate) return 'unlocked';

  return 'locked';
}

export function renderCalendar(app, navigate) {
  let tilesHtml = '';

  for (const day of DAYS) {
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
    <div class="calendar-grid">
      ${tilesHtml}
    </div>
  `;
}
