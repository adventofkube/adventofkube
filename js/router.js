export class Router {
  constructor(routes) {
    this.routes = routes;
    this._onPopState = this._onPopState.bind(this);
    window.addEventListener('popstate', this._onPopState);
    document.addEventListener('click', (e) => this._onLinkClick(e));
  }

  _onPopState() {
    this.resolve();
  }

  _onLinkClick(e) {
    const link = e.target.closest('[data-link]');
    if (!link) return;
    e.preventDefault();
    this.navigate(link.getAttribute('href'));
  }

  navigate(path) {
    window.history.pushState(null, '', path);
    this.resolve();
  }

  resolve() {
    const path = window.location.pathname;

    for (const route of this.routes) {
      const match = this._match(route.path, path);
      if (match) {
        route.handler(match.params);
        window.scrollTo(0, 0);
        return;
      }
    }

    // Fallback: show landing
    if (this.routes.length > 0) {
      this.routes[0].handler({});
    }
  }

  _match(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return { params };
  }
}
