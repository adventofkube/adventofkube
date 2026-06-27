import { Router } from './router.js';
import { renderLanding } from './pages/landing.js';
import { renderCalendar } from './pages/calendar.js';
import { renderDay } from './pages/day.js';

const app = document.getElementById('app');
const header = document.getElementById('site-header');

// Auth header rendering. `user` is { id, username, avatar } or null.
function renderAuthHeader(user) {
  if (!header) return;

  if (user) {
    const avatar = user.avatar || '';
    const username = user.username || 'User';
    header.innerHTML = `<nav class="site-nav">
      <a href="/" class="nav-brand" data-link>
        <img src="/logo.svg" alt="" class="nav-logo" />
        <span>Advent of Kube</span>
      </a>
      <div class="nav-right">
        ${avatar ? `<img src="${avatar}" alt="" class="nav-avatar" />` : ''}
        <span class="nav-username">${username}</span>
        <button class="nav-logout" id="nav-logout">Sign out</button>
      </div>
    </nav>`;
    document.getElementById('nav-logout')?.addEventListener('click', async () => {
      try {
        const { signOut } = await import('./api.js');
        await signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    });
  } else {
    header.innerHTML = `<nav class="site-nav">
      <a href="/" class="nav-brand" data-link>
        <img src="/logo.svg" alt="" class="nav-logo" />
        <span>Advent of Kube</span>
      </a>
      <div class="nav-right">
        <button class="nav-login" id="nav-login">Sign in with GitHub</button>
      </div>
    </nav>`;
    document.getElementById('nav-login')?.addEventListener('click', async () => {
      try {
        const { signInWithGitHub } = await import('./api.js');
        signInWithGitHub();
      } catch (err) {
        console.error('Sign in error:', err);
      }
    });
  }
}

// Initialize auth header and sync progress.
(async () => {
  try {
    const { getUser, syncProgressFromServer } = await import('./api.js');
    const user = await getUser();
    renderAuthHeader(user);

    // Sync progress from server if logged in.
    if (user) {
      await syncProgressFromServer();
      // Re-render current page to reflect synced progress.
      router.resolve();
    }
  } catch (err) {
    // Backend unavailable — render header without auth.
    renderAuthHeader(null);
  }
})();

const router = new Router([
  {
    path: '/',
    handler: () => renderLanding(app),
  },
  {
    path: '/calendar',
    handler: () => renderCalendar(app, (path) => router.navigate(path)),
  },
  {
    path: '/day/:n',
    handler: (params) => renderDay(app, params),
  },
]);

// Initial resolve
router.resolve();

// Debug: reset a day's progress (call from console: resetDay(2))
window.resetDay = async (n) => {
  localStorage.removeItem(`day${n}_completed`);
  localStorage.removeItem(`day${n}_completedTime`);
  localStorage.removeItem(`day${n}_startTime`);

  // Also delete server-side submission if logged in
  try {
    const { deleteSubmission } = await import('./api.js');
    const result = await deleteSubmission(n);
    if (result.deleted) {
      console.log(`Day ${n} reset (local + server). Refresh the page.`);
    } else if (result.error) {
      console.log(`Day ${n} reset (local only). Server: ${result.error}`);
    }
  } catch {
    console.log(`Day ${n} reset (local only). Refresh the page.`);
  }
};
