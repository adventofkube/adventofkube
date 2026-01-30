import { START_DATE, DAYS } from '../config.js';

let stopwatchInterval = null;

function getDayState(dayNumber) {
  if (localStorage.getItem(`day${dayNumber}_completed`)) return 'completed';
  const unlockDate = new Date(START_DATE);
  unlockDate.setDate(unlockDate.getDate() + dayNumber - 1);
  return new Date() >= unlockDate ? 'unlocked' : 'locked';
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function startStopwatch(dayNumber, timerEl) {
  if (stopwatchInterval) clearInterval(stopwatchInterval);

  const key = `day${dayNumber}_startTime`;
  let startTime = localStorage.getItem(key);
  if (!startTime) return;
  startTime = parseInt(startTime, 10);

  function update() {
    const elapsed = Date.now() - startTime;
    timerEl.textContent = `Elapsed: ${formatTime(elapsed)}`;
  }
  update();
  stopwatchInterval = setInterval(update, 1000);
}

async function hashFlag(flag) {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function renderDay(app, params) {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }

  const dayNumber = parseInt(params.n, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 25) {
    app.innerHTML = '<p>Invalid day.</p>';
    return;
  }

  const dayConfig = DAYS[dayNumber - 1];
  const state = getDayState(dayNumber);

  if (state === 'locked') {
    app.innerHTML = `
      <a href="/calendar" class="back-link" data-link>&larr; Back to Calendar</a>
      <div class="day-page">
        <h1>Day ${dayNumber}: ${dayConfig.title}</h1>
        <p>This challenge is not yet unlocked.</p>
      </div>
    `;
    return;
  }

  const isCompleted = state === 'completed';
  const completedTime = localStorage.getItem(`day${dayNumber}_completedTime`);
  const startTimeKey = `day${dayNumber}_startTime`;
  const hasStarted = !!localStorage.getItem(startTimeKey);

  let bannerHtml = '';
  if (isCompleted && completedTime) {
    bannerHtml = `<div class="day-completed-banner">Challenge completed! Time: ${completedTime}</div>`;
  } else if (isCompleted) {
    bannerHtml = `<div class="day-completed-banner">Challenge completed!</div>`;
  }

  app.innerHTML = `
    <a href="/calendar" class="back-link" data-link>&larr; Back to Calendar</a>
    <div class="day-page">
      <h1>Day ${dayNumber}: ${dayConfig.title}</h1>
      ${bannerHtml}
      <p class="day-description">${dayConfig.description}</p>
      ${!hasStarted && !isCompleted ? `<button class="start-btn" id="start-btn">Start Challenge</button>` : ''}
      <div id="challenge-area" style="${hasStarted || isCompleted ? '' : 'display:none'}">
        <a href="${dayConfig.chartUrl}" class="chart-link" target="_blank" rel="noopener">Download Helm Chart</a>
        <div class="stopwatch" id="stopwatch">Elapsed: 0:00</div>
        ${!isCompleted ? `
          <div class="flag-section">
            <label for="flag-input">Enter your flag:</label>
            <div class="flag-input-row">
              <input type="text" id="flag-input" placeholder="flag{...}" />
              <button id="flag-submit">Submit</button>
            </div>
            <div id="flag-result"></div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      localStorage.setItem(startTimeKey, Date.now().toString());
      startBtn.remove();
      const area = document.getElementById('challenge-area');
      area.style.display = '';
      startStopwatch(dayNumber, document.getElementById('stopwatch'));
    });
  }

  // Stopwatch
  if (hasStarted && !isCompleted) {
    startStopwatch(dayNumber, document.getElementById('stopwatch'));
  } else if (isCompleted) {
    const timerEl = document.getElementById('stopwatch');
    if (completedTime) {
      timerEl.textContent = `Final time: ${completedTime}`;
    } else {
      timerEl.textContent = 'Completed';
    }
  }

  // Flag submission
  const submitBtn = document.getElementById('flag-submit');
  if (submitBtn) {
    const flagInput = document.getElementById('flag-input');
    const resultEl = document.getElementById('flag-result');

    submitBtn.addEventListener('click', async () => {
      const flag = flagInput.value.trim();
      if (!flag) return;

      const hash = await hashFlag(flag);
      if (hash === dayConfig.flagHash) {
        const startTime = parseInt(localStorage.getItem(startTimeKey), 10);
        const elapsed = Date.now() - startTime;
        const timeStr = formatTime(elapsed);

        localStorage.setItem(`day${dayNumber}_completed`, 'true');
        localStorage.setItem(`day${dayNumber}_completedTime`, timeStr);

        if (stopwatchInterval) {
          clearInterval(stopwatchInterval);
          stopwatchInterval = null;
        }

        resultEl.className = 'flag-result success';
        resultEl.textContent = `Correct! Completed in ${timeStr}`;
        flagInput.disabled = true;
        submitBtn.disabled = true;

        document.getElementById('stopwatch').textContent = `Final time: ${timeStr}`;
      } else {
        resultEl.className = 'flag-result error';
        resultEl.textContent = 'Incorrect flag. Try again.';
      }
    });

    flagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitBtn.click();
      }
    });
  }
}
