export function renderLanding(app) {
  app.innerHTML = `
    <div class="landing-hero">
      <h1>Advent of Kube</h1>
      <p class="tagline">25 days of Kubernetes challenges. One flag per day.</p>
      <a href="/calendar" class="cta-button" data-link>Open Calendar</a>
    </div>

    <div class="landing-how">
      <h2>How It Works</h2>
      <ol>
        <li>A new challenge unlocks each day</li>
        <li>Install the Helm chart: <code>helm install dayN chart.tgz</code></li>
        <li>Explore the cluster to solve the challenge</li>
        <li>Find the flag and submit it to complete the day</li>
      </ol>
    </div>
  `;
}
