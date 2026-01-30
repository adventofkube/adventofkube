import { Router } from './router.js';
import { renderLanding } from './pages/landing.js';
import { renderCalendar } from './pages/calendar.js';
import { renderDay } from './pages/day.js';

const app = document.getElementById('app');

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
