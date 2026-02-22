import { START_DATE, DAYS } from '../config.js';

function getDayState(dayNumber) {
  const dayConfig = DAYS.find(d => d.day === dayNumber);
  if (dayConfig && !dayConfig.enabled) return 'locked';

  if (localStorage.getItem(`day${dayNumber}_completed`)) return 'completed';
  if (dayNumber === 0) return 'unlocked';

  const unlockDate = new Date(START_DATE);
  unlockDate.setDate(unlockDate.getDate() + dayNumber - 1);
  return new Date() >= unlockDate ? 'unlocked' : 'locked';
}

function renderCalendarGrid() {
  const dayZero = DAYS.find(d => d.day === 0);
  let dayZeroHtml = '';
  if (dayZero) {
    const state = getDayState(0);
    const statusText = state === 'completed' ? 'COMPLETE' : 'OPEN';
    dayZeroHtml = `
      <div class="day-zero-row">
        <a class="day-tile day-zero ${state}" href="/day/0" data-link>
          <span class="day-number">Day 0</span>
          <span class="day-title">${dayZero.title}</span>
          <span class="day-status">${statusText}</span>
        </a>
      </div>
    `;
  }

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

  return `
    ${dayZeroHtml}
    <div class="calendar-grid">
      ${tilesHtml}
    </div>
  `;
}

export function renderLanding(app) {
  app.innerHTML = `
    <div class="landing-hero">
      <img src="/logo.svg" alt="Advent of Kube" class="landing-logo" />
      <h1>Advent of Kube</h1>
      <p class="tagline">Kubernetes challenges. Debug clusters, find flags.</p>
    </div>

    <div class="landing-layout">
      <div class="landing-left">
        <section class="landing-leaderboard">
          <div id="landing-lb"></div>
        </section>
      </div>
      <div class="landing-right">
        ${renderCalendarGrid()}
      </div>
    </div>
  `;

  // Render leaderboard widget (async, non-blocking)
  import('../leaderboard.js').then(({ renderLeaderboardWidget }) => {
    const lbContainer = document.getElementById('landing-lb');
    if (lbContainer) renderLeaderboardWidget(lbContainer, { compact: true });
  }).catch(() => {
    // Leaderboard unavailable — silent fallback
  });
}
