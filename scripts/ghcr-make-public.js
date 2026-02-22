// GitHub Container Registry — Bulk Change Org Package Visibility to Public
//
// The GitHub API does not support changing package visibility for org-owned
// packages (returns 404). This script works around that by submitting the
// visibility change form through the browser, using your existing session.
//
// Usage:
//   1. Log into github.com in Chrome
//   2. Open DevTools (F12) → Console
//   3. Paste this script and press Enter
//
// Configuration:
//   - Set ORG to your GitHub organization name
//   - Set PACKAGE_TYPE to "container", "npm", "maven", etc.
//   - Set PACKAGES to an array of package names, or leave empty to
//     auto-detect all private packages from the org packages page

const ORG = "YOUR_ORG";
const PACKAGE_TYPE = "container";
const PACKAGES = []; // e.g. ["my-image", "charts/my-chart"] — leave empty to auto-detect

(async () => {
  let packages = PACKAGES;

  // Auto-detect private packages if none specified
  if (packages.length === 0) {
    console.log("No packages specified — detecting private packages...");
    const listUrl = `/orgs/${ORG}/packages?visibility=private`;
    const page = await fetch(listUrl).then((r) => r.text());
    const doc = new DOMParser().parseFromString(page, "text/html");
    const links = doc.querySelectorAll('a[href*="/packages/"]');
    const prefix = `/orgs/${ORG}/packages/${PACKAGE_TYPE}/package/`;
    for (const link of links) {
      const href = link.getAttribute("href");
      if (href && href.startsWith(prefix)) {
        packages.push(decodeURIComponent(href.slice(prefix.length)));
      }
    }
    if (packages.length === 0) {
      console.log("No private packages found.");
      return;
    }
    console.log(`Found ${packages.length} private package(s):`, packages);
  }

  let success = 0;
  let failed = 0;

  for (const pkg of packages) {
    try {
      const settingsUrl = `/orgs/${ORG}/packages/${PACKAGE_TYPE}/${encodeURIComponent(pkg)}/settings`;
      const page = await fetch(settingsUrl).then((r) => r.text());
      const doc = new DOMParser().parseFromString(page, "text/html");
      const form = doc.querySelector('form[action*="change_visibility"]');

      if (!form) {
        console.warn(`⚠ No visibility form found for: ${pkg} (already public?)`);
        continue;
      }

      const token = form.querySelector('input[name="authenticity_token"]').value;
      const actionUrl = form.getAttribute("action");

      const body = new URLSearchParams({
        authenticity_token: token,
        visibility: "public",
        verify: pkg,
      });

      const res = await fetch(actionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "follow",
      });

      if (res.ok) {
        console.log(`✅ ${pkg}`);
        success++;
      } else {
        console.error(`❌ ${pkg} (HTTP ${res.status})`);
        failed++;
      }

      // Delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error(`❌ ${pkg}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} changed, ${failed} failed.`);
})();
