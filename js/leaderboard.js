import { DAYS } from './config.js';

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function computeOverallStandings(allSubmissions) {
  // Group submissions by day, already sorted by elapsed_ms from the query
  const byDay = {};
  for (const s of allSubmissions) {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  }

  // Assign points per day: 100 for 1st, 99 for 2nd, etc.
  const pointsMap = {}; // userId -> { username, avatar, totalPoints }
  for (const [, entries] of Object.entries(byDay)) {
    entries.forEach((entry, i) => {
      const points = Math.max(1, 100 - i);
      const userId = entry.user_id;
      const profile = entry.profiles;
      if (!pointsMap[userId]) {
        pointsMap[userId] = {
          username: profile?.github_username ?? 'unknown',
          avatar: profile?.avatar_url ?? '',
          totalPoints: 0,
          daysCompleted: 0,
        };
      }
      pointsMap[userId].totalPoints += points;
      pointsMap[userId].daysCompleted += 1;
    });
  }

  return Object.entries(pointsMap)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.daysCompleted - a.daysCompleted);
}

function renderTable(rows, type, currentUserId) {
  if (!rows.length) {
    return '<p class="lb-empty">No submissions yet.</p>';
  }

  const headerCols = type === 'overall'
    ? '<th class="lb-rank">#</th><th class="lb-user">User</th><th>Days</th><th>Points</th>'
    : '<th class="lb-rank">#</th><th class="lb-user">User</th><th>Time</th><th>Points</th>';

  const bodyRows = rows.map((row, i) => {
    const rank = i + 1;
    const points = type === 'overall' ? row.totalPoints : Math.max(1, 100 - i);
    const isSelf = row.userId === currentUserId;
    const selfClass = isSelf ? ' lb-self' : '';
    const avatar = (type === 'overall' ? row.avatar : row.profiles?.avatar_url) || '';
    const username = (type === 'overall' ? row.username : row.profiles?.github_username) || 'unknown';
    const middle = type === 'overall'
      ? `<td>${row.daysCompleted}</td>`
      : `<td>${formatElapsed(row.elapsed_ms)}</td>`;

    return `<tr class="${selfClass}">
      <td class="lb-rank">${rank}</td>
      <td class="lb-user">${avatar ? `<img src="${avatar}" alt="" class="lb-avatar" />` : ''}<span>${username}</span></td>
      ${middle}
      <td>${points}</td>
    </tr>`;
  }).join('');

  return `<table class="lb-table"><thead><tr>${headerCols}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

/**
 * Render a leaderboard widget into the given container.
 * Options:
 *   compact: boolean — smaller styling for embedding
 */
export async function renderLeaderboardWidget(container, options = {}) {
  const compact = options.compact ?? false;

  container.innerHTML = `<div class="lb-widget${compact ? ' lb-compact' : ''}">
    <div class="lb-tabs" id="lb-tabs"></div>
    <div class="lb-content" id="lb-content"><p class="lb-loading">Loading leaderboard...</p></div>
  </div>`;

  let allSubmissions = [];
  let currentUserId = null;

  try {
    const { fetchAllSubmissions, getUser } = await import('./supabase.js');
    const [subs, user] = await Promise.all([fetchAllSubmissions(), getUser()]);
    allSubmissions = subs;
    currentUserId = user?.id ?? null;
  } catch (err) {
    console.error('Leaderboard load error:', err);
    container.querySelector('#lb-content').innerHTML =
      '<p class="lb-empty">Could not load leaderboard.</p>';
    return;
  }

  const enabledDays = DAYS.filter(d => d.enabled).map(d => d.day);
  const tabs = ['Overall', ...enabledDays.map(d => `Day ${d}`)];
  const tabsEl = container.querySelector('#lb-tabs');
  const contentEl = container.querySelector('#lb-content');

  function renderTabs(activeIndex) {
    tabsEl.innerHTML = tabs
      .map((t, i) => `<button class="lb-tab${i === activeIndex ? ' active' : ''}" data-index="${i}">${t}</button>`)
      .join('');
  }

  function showTab(index) {
    renderTabs(index);
    if (index === 0) {
      // Overall
      const standings = computeOverallStandings(allSubmissions);
      contentEl.innerHTML = renderTable(standings, 'overall', currentUserId);
    } else {
      // Specific day
      const day = enabledDays[index - 1];
      const dayEntries = allSubmissions
        .filter(s => s.day === day)
        .sort((a, b) => a.elapsed_ms - b.elapsed_ms);
      contentEl.innerHTML = renderTable(dayEntries, 'day', currentUserId);
    }
  }

  tabsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.lb-tab');
    if (!btn) return;
    showTab(parseInt(btn.dataset.index, 10));
  });

  showTab(0);
}
