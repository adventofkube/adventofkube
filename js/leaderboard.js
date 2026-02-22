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

function formatTimestamp(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function orderBonus(rankIndex) {
  if (rankIndex >= 10) return 0;
  return 50 - rankIndex * 5;
}

function computeDayScores(dayEntries) {
  const bySubmitOrder = dayEntries.slice();
  bySubmitOrder.sort(function(a, b) {
    var keyA = a.submitted_at,
        keyB = b.submitted_at;
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  var order = 0;
  var orderMap = bySubmitOrder.reduce(function(map, entry) {
    map[entry.user_id] = order++;
    return map;
  }, {});
  const fastest_time = dayEntries[0].elapsed_ms;
  for (let i = 0; i < dayEntries.length; i++) {
    dayEntries[i].timeScore = dayEntries[i].elapsed_ms === 0 ? 1000 : Math.round(1000 * (fastest_time / dayEntries[i].elapsed_ms));
    dayEntries[i].orderBonusVal = orderBonus(orderMap[dayEntries[i].user_id]);
    dayEntries[i].score = dayEntries[i].timeScore + dayEntries[i].orderBonusVal;
  }
}

function prepareDayEntries(dayEntries, mode) {
  const entries = [...dayEntries];
  computeDayScores(entries);

  if (mode === 'speed') {
    entries.sort((a, b) => a.elapsed_ms - b.elapsed_ms);
  } else if (mode === 'order') {
    entries.sort((a, b) => {
      const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : Infinity;
      const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : Infinity;
      return aTime - bTime;
    });
  } else {
    // 'score' mode — highest score first
    entries.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  return entries;
}

function computeOverallStandings(allSubmissions, mode) {
  // Group submissions by day (already sorted by elapsed_ms from query)
  const byDay = {};
  for (const s of allSubmissions) {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  }

  // Compute scores per day, then aggregate per user
  const userMap = {};
  for (const [, entries] of Object.entries(byDay)) {
    computeDayScores(entries);
    for (const entry of entries) {
      const userId = entry.user_id;
      const profile = entry.profiles;
      if (!userMap[userId]) {
        userMap[userId] = {
          username: profile?.github_username ?? 'unknown',
          avatar: profile?.avatar_url ?? '',
          totalScore: 0,
          totalElapsed: 0,
          daysCompleted: 0,
          latestSubmission: null,
        };
      }
      userMap[userId].totalScore += entry.score || 0;
      userMap[userId].totalElapsed += entry.elapsed_ms;
      userMap[userId].daysCompleted += 1;
      const subTime = entry.submitted_at ? new Date(entry.submitted_at).getTime() : 0;
      if (!userMap[userId].latestSubmission || subTime > userMap[userId].latestSubmission) {
        userMap[userId].latestSubmission = subTime;
      }
    }
  }

  const standings = Object.entries(userMap)
    .map(([userId, data]) => ({ userId, ...data }));

  if (mode === 'speed') {
    standings.sort((a, b) => b.daysCompleted - a.daysCompleted || a.totalElapsed - b.totalElapsed);
  } else if (mode === 'order') {
    standings.sort((a, b) => b.daysCompleted - a.daysCompleted || a.latestSubmission - b.latestSubmission);
  } else {
    // 'score' mode
    standings.sort((a, b) => b.totalScore - a.totalScore || b.daysCompleted - a.daysCompleted);
  }

  return standings;
}

function renderTable(rows, type, currentUserId, mode) {
  if (!rows.length) {
    return '<p class="lb-empty">No submissions yet.</p>';
  }

  let headerCols;
  if (type === 'overall') {
    const lastCol = mode === 'speed' ? 'Total Time'
      : mode === 'order' ? 'Last Completed'
      : 'Score';
    headerCols = `<th class="lb-rank">#</th><th class="lb-user">User</th><th>Days</th><th>${lastCol}</th>`;
  } else {
    const lastCol = mode === 'speed' ? 'Time'
      : mode === 'order' ? 'Submitted'
      : 'Score';
    headerCols = `<th class="lb-rank">#</th><th class="lb-user">User</th><th>Time</th>${mode !== 'speed' ? `<th>${lastCol}</th>` : ''}`;
  }

  const bodyRows = rows.map((row, i) => {
    const rank = i + 1;
    const isSelf = (type === 'overall' ? row.userId : row.user_id) === currentUserId;
    const selfClass = isSelf ? ' lb-self' : '';
    const avatar = (type === 'overall' ? row.avatar : row.profiles?.avatar_url) || '';
    const username = (type === 'overall' ? row.username : row.profiles?.github_username) || 'unknown';

    let cells;
    if (type === 'overall') {
      const lastVal = mode === 'speed' ? formatElapsed(row.totalElapsed)
        : mode === 'order' ? (row.latestSubmission ? formatTimestamp(new Date(row.latestSubmission).toISOString()) : '-')
        : row.totalScore;
      cells = `<td>${row.daysCompleted}</td><td>${lastVal}</td>`;
    } else {
      const timeCell = `<td>${formatElapsed(row.elapsed_ms)}</td>`;
      if (mode === 'speed') {
        cells = timeCell;
      } else if (mode === 'order') {
        cells = `${timeCell}<td>${formatTimestamp(row.submitted_at)}</td>`;
      } else {
        cells = `${timeCell}<td>${row.score ?? '-'}</td>`;
      }
    }

    return `<tr class="${selfClass}">
      <td class="lb-rank">${rank}</td>
      <td class="lb-user">${avatar ? `<img src="${avatar}" alt="" class="lb-avatar" />` : ''}<span>${username}</span></td>
      ${cells}
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
    <div class="lb-toolbar" id="lb-toolbar"></div>
    <div class="lb-content" id="lb-content"><p class="lb-loading">Loading leaderboard...</p></div>
    <div class="lb-footer" id="lb-footer"></div>
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
  const toolbarEl = container.querySelector('#lb-toolbar');
  const contentEl = container.querySelector('#lb-content');
  const footerEl = container.querySelector('#lb-footer');

  let activeTabIndex = 0;
  let activeMode = 'score';
  let dayGridOpen = false;

  function renderToolbar() {
    const modes = [
      { key: 'score', label: 'Score' },
      { key: 'speed', label: 'Speed' },
      { key: 'order', label: 'Order' },
    ];

    const dayLabel = activeTabIndex > 0 ? `Day ${enabledDays[activeTabIndex - 1]}` : 'Per day';

    const dayCells = enabledDays.map((d, i) => {
      const idx = i + 1;
      return `<button class="lb-day-cell${idx === activeTabIndex ? ' active' : ''}" data-index="${idx}">${d}</button>`;
    }).join('');

    toolbarEl.innerHTML = `
      <div class="lb-toolbar-left">
        <button class="lb-tab${activeTabIndex === 0 ? ' active' : ''}" data-index="0">Overall</button>
        <div class="lb-day-picker">
          <button class="lb-day-trigger${activeTabIndex > 0 ? ' active' : ''}${dayGridOpen ? ' open' : ''}" data-role="day-trigger">${dayLabel} <span class="lb-caret">&#9662;</span></button>
          ${dayGridOpen ? `<div class="lb-day-grid">${dayCells}</div>` : ''}
        </div>
      </div>
      <div class="lb-toolbar-right">
        <div class="lb-toggle">${modes.map(m =>
          `<button class="lb-toggle-btn${m.key === activeMode ? ' active' : ''}" data-mode="${m.key}">${m.label}</button>`
        ).join('')}</div>
      </div>
    `;
  }

  function renderScoringNote() {
    footerEl.innerHTML = `<details class="lb-scoring-note">
      <summary>How scoring works</summary>
      <div class="lb-scoring-body">
        <p><strong>Per-day score</strong> = time score + order bonus</p>
        <ul>
          <li><strong>Time score:</strong> <code>round(1000 &times; fastest_time / your_time)</code> &mdash; fastest solver gets 1000</li>
          <li><strong>Order bonus:</strong> +50 for 1st, +45 for 2nd, &minus;5 per rank, minimum +0 (11th+ get no bonus)</li>
          <li><strong>Max per day:</strong> 1050 (fastest + first)</li>
        </ul>
        <p><strong>Overall score</strong> = sum of per-day scores across all completed days.</p>
      </div>
    </details>`;
  }

  function showContent() {
    renderToolbar();
    renderScoringNote();

    if (activeTabIndex === 0) {
      const standings = computeOverallStandings(allSubmissions, activeMode);
      contentEl.innerHTML = renderTable(standings, 'overall', currentUserId, activeMode);
    } else {
      const day = enabledDays[activeTabIndex - 1];
      const dayEntries = allSubmissions.filter(s => s.day === day);
      const sorted = prepareDayEntries(dayEntries, activeMode);
      contentEl.innerHTML = renderTable(sorted, 'day', currentUserId, activeMode);
    }
  }

  toolbarEl.addEventListener('click', (e) => {
    // Overall button
    const tab = e.target.closest('.lb-tab');
    if (tab) {
      activeTabIndex = 0;
      dayGridOpen = false;
      showContent();
      return;
    }

    // Day picker trigger
    const trigger = e.target.closest('.lb-day-trigger');
    if (trigger) {
      dayGridOpen = !dayGridOpen;
      renderToolbar();
      return;
    }

    // Day cell in grid
    const cell = e.target.closest('.lb-day-cell');
    if (cell) {
      activeTabIndex = parseInt(cell.dataset.index, 10);
      dayGridOpen = false;
      showContent();
      return;
    }

    // Mode toggle
    const modeBtn = e.target.closest('.lb-toggle-btn');
    if (modeBtn) {
      activeMode = modeBtn.dataset.mode;
      showContent();
      return;
    }
  });

  showContent();
}
