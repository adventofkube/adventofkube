import { DAYS } from '../config.js';

export function renderLanding(app) {
  const enabledDays = DAYS.filter(d => d.enabled);

  const challengeLinks = enabledDays.map(d => {
    const completed = localStorage.getItem(`day${d.day}_completed`);
    const status = completed ? 'completed' : 'unlocked';
    const statusText = completed ? 'COMPLETE' : 'OPEN';
    return `
      <a href="/day/${d.day}" class="challenge-row ${status}" data-link>
        <span class="challenge-day">Day ${d.day}</span>
        <span class="challenge-title">${d.title}</span>
        <span class="challenge-status">${statusText}</span>
      </a>
    `;
  }).join('');

  app.innerHTML = `
    <div class="landing-hero">
      <h1>Advent of Kube</h1>
      <p class="tagline">Kubernetes challenges. Debug clusters, find flags.</p>
    </div>

    <div class="landing-how">
      <h2>How It Works</h2>
      <ol>
        <li>Set up a local Kubernetes cluster with <a href="https://kind.sigs.k8s.io/" target="_blank" rel="noopener">kind</a></li>
        <li>Install the challenge Helm chart</li>
        <li>Debug the cluster — diagnose and fix the issues</li>
        <li>Find the flag and submit it</li>
      </ol>
    </div>

    <div class="challenges-list">
      <h2>Challenges</h2>
      ${challengeLinks}
    </div>
  `;
}
