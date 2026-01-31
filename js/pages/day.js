import { START_DATE, DAYS } from '../config.js';

let stopwatchInterval = null;

function getDayState(dayNumber) {
  const dayConfig = DAYS.find(d => d.day === dayNumber);
  if (dayConfig && !dayConfig.enabled) return 'locked';

  if (localStorage.getItem(`day${dayNumber}_completed`)) return 'completed';
  if (dayNumber === 0) return 'unlocked';

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
  if (isNaN(dayNumber) || dayNumber < 0 || dayNumber > 25) {
    app.innerHTML = '<p>Invalid day.</p>';
    return;
  }

  const dayConfig = DAYS.find(d => d.day === dayNumber);
  if (!dayConfig) {
    app.innerHTML = '<p>Invalid day.</p>';
    return;
  }
  const state = getDayState(dayNumber);

  if (state === 'locked') {
    app.innerHTML = `
      <div class="day-page">
        <div class="day-header">
          <a href="/" class="back-link" data-link title="Home"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></a>
          <h1>Day ${dayNumber}: ${dayConfig.title}</h1>
        </div>
        <p class="day-description">${dayConfig.description}</p>
        <p class="day-locked-notice">This challenge is not yet available.</p>
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
    <div class="day-page">
      <div class="day-header">
        <a href="/" class="back-link" data-link title="Home"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></a>
        <h1>Day ${dayNumber}: ${dayConfig.title}</h1>
        <span class="stopwatch" id="stopwatch"></span>
      </div>
      ${bannerHtml}
      <p class="day-description">${dayConfig.description}</p>
      ${!hasStarted && !isCompleted ? `<button class="start-btn" id="start-btn">Start Challenge</button>` : ''}
      <div id="challenge-area" style="${hasStarted || isCompleted ? '' : 'display:none'}">
        <div class="day-layout">
          <div class="day-left">
            ${dayConfig.setup ? `
              <div class="setup-section">
                <h2>Setup</h2>
                <div class="setup-steps">${dayConfig.setup.join('\n')}</div>
              </div>
            ` : `
              <a href="${dayConfig.chartUrl}" class="chart-link" target="_blank" rel="noopener">Download Helm Chart</a>
            `}
            ${dayConfig.hints ? `
              <div class="hints-section">
                <h2>Hints</h2>
                ${dayConfig.hints.map((hint, i) => `
                  <details class="hint-item">
                    <summary>Hint ${i + 1}</summary>
                    <p>${hint}</p>
                  </details>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="day-right">
            ${dayConfig.docs ? `
              <div class="docs-section">
                <h2>Relevant Docs</h2>
                <ul class="docs-list">
                  ${dayConfig.docs.map(d => `<li><a href="${d.url}" target="_blank" rel="noopener">${d.title}</a></li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${!isCompleted ? `
              <div class="flag-section">
                <label for="flag-input">Enter your flag:</label>
                <div class="flag-input-row">
                  <input type="text" id="flag-input" placeholder="AOK{...}" />
                  <button id="flag-submit">Submit</button>
                </div>
                <div id="flag-result"></div>
              </div>
            ` : ''}
          </div>
        </div>
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

  // Add copy buttons to all code blocks
  document.querySelectorAll('.setup-steps code, .hint-item code').forEach(block => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
    wrapper.appendChild(btn);
  });
}
