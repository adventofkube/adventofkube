import { Router } from './router.js';
import { renderLanding } from './pages/landing.js';
import { renderCalendar } from './pages/calendar.js';
import { renderDay } from './pages/day.js';

const app = document.getElementById('app');
const header = document.getElementById('site-header');

// Auth header rendering
async function renderAuthHeader(session) {
  if (!header) return;
  const user = session?.user;
  const meta = user?.user_metadata;

  if (user && meta) {
    const avatar = meta.avatar_url || '';
    const username = meta.user_name || meta.preferred_username || 'User';
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
        const { signOut } = await import('./supabase.js');
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
        const { signInWithGitHub } = await import('./supabase.js');
        await signInWithGitHub();
      } catch (err) {
        console.error('Sign in error:', err);
      }
    });
  }
}

// Initialize auth header and sync progress
(async () => {
  try {
    const { getSession, onAuthStateChange, syncProgressFromServer } = await import('./supabase.js');
    const session = await getSession();
    renderAuthHeader(session);

    // Sync progress from server if logged in
    if (session) {
      await syncProgressFromServer();
      // Re-render current page to reflect synced progress
      router.resolve();
    }

    onAuthStateChange(async (newSession) => {
      renderAuthHeader(newSession);
      // Sync progress when user logs in
      if (newSession) {
        await syncProgressFromServer();
        router.resolve();
      }
    });
  } catch (err) {
    // Supabase unavailable — render header without auth
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
window.resetDay = (n) => {
  localStorage.removeItem(`day${n}_completed`);
  localStorage.removeItem(`day${n}_completedTime`);
  localStorage.removeItem(`day${n}_startTime`);
  console.log(`Day ${n} reset. Refresh the page.`);
};
