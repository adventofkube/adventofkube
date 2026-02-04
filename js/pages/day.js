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
            ${dayConfig.osSetup ? `
              <div class="setup-section">
                <h2>Setup</h2>
                <div class="os-toggle" id="os-toggle">
                  <button class="os-btn" data-os="windows">Windows</button>
                  <button class="os-btn" data-os="mac">Mac</button>
                  <button class="os-btn" data-os="linux">Linux</button>
                </div>
                <div class="setup-steps os-steps" id="os-steps"></div>
                ${dayConfig.setup ? `<div class="setup-steps">${dayConfig.setup.join('\n')}</div>` : ''}
              </div>
            ` : dayConfig.setup ? `
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
      const sw = document.getElementById('stopwatch');
      sw.style.display = '';
      startStopwatch(dayNumber, sw);
    });
  }

  // Stopwatch
  const timerEl = document.getElementById('stopwatch');
  if (hasStarted && !isCompleted) {
    startStopwatch(dayNumber, timerEl);
  } else if (isCompleted) {
    timerEl.style.display = 'none';
  } else {
    timerEl.style.display = 'none';
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
        document.getElementById('stopwatch').style.display = 'none';

        // Submit to leaderboard if logged in
        try {
          const { getSession, submitFlag } = await import('../supabase.js');
          const session = await getSession();
          if (session) {
            const lbResult = await submitFlag(dayNumber, flag, elapsed);
            if (lbResult.recorded) {
              resultEl.textContent += lbResult.improved === false
                ? ' (leaderboard: kept your faster time)'
                : ' Recorded to leaderboard!';
            }
          } else {
            resultEl.insertAdjacentHTML('afterend',
              '<p class="lb-login-prompt">Sign in with GitHub to record your time on the leaderboard.</p>');
          }
        } catch {
          // Supabase unavailable — silent fallback
        }
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

  // OS toggle for Day 0 setup
  if (dayConfig.osSetup) {
    const osToggle = document.getElementById('os-toggle');
    const osSteps = document.getElementById('os-steps');
    const osButtons = osToggle.querySelectorAll('.os-btn');

    function renderOsSteps(os) {
      const steps = dayConfig.osSetup[os] || [];
      osSteps.innerHTML = steps.map(step =>
        `<div class="os-step">
          <div class="os-step-title">${step.title}</div>
          <div class="os-step-content">${step.content}</div>
        </div>`
      ).join('');

      // Update active button
      osButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.os === os);
      });

      // Save preference
      localStorage.setItem('preferred_os', os);

      // Re-apply copy buttons to new code blocks
      osSteps.querySelectorAll('code').forEach(block => {
        const text = block.textContent;
        const isBlock = text.includes('\n') || text.length > 30;
        if (!isBlock) {
          block.classList.add('inline-code');
          return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(text).then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
          });
        });
        wrapper.appendChild(btn);
      });
    }

    osButtons.forEach(btn => {
      btn.addEventListener('click', () => renderOsSteps(btn.dataset.os));
    });

    // Auto-detect or use saved preference
    const savedOs = localStorage.getItem('preferred_os');
    const detectedOs = navigator.platform.toLowerCase().includes('win') ? 'windows'
      : navigator.platform.toLowerCase().includes('mac') ? 'mac' : 'linux';
    renderOsSteps(savedOs || detectedOs);
  }

  // Add copy buttons to block-level code (commands), skip short inline snippets
  document.querySelectorAll('.setup-steps:not(.os-steps) code, .hint-item code').forEach(block => {
    const text = block.textContent;
    const isBlock = text.includes('\n') || text.length > 30;
    if (!isBlock) {
      block.classList.add('inline-code');
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
    wrapper.appendChild(btn);
  });
}
