// ============ ROUTER - Hash-based SPA Router ============

const Router = {
    routes: [],
    currentHandler: null,
    currentParams: null,

    register(pattern, handler) {
        // Convert pattern like '/course/:courseId' to regex
        const paramNames = [];
        const regexStr = pattern.replace(/:(\w+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        });
        this.routes.push({
            regex: new RegExp(`^${regexStr}$`),
            paramNames,
            handler
        });
    },

    navigate(hash) {
        window.location.hash = hash;
    },

    match(path) {
        for (const route of this.routes) {
            const match = path.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });
                return { handler: route.handler, params };
            }
        }
        return null;
    },

    handleRouteChange() {
        const hash = window.location.hash.replace(/^#/, '') || '/home';

        // Leave current view
        if (this.currentHandler && this.currentHandler.leave) {
            this.currentHandler.leave();
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        // Match and enter new view
        const result = this.match(hash);
        if (result) {
            this.currentHandler = result.handler;
            this.currentParams = result.params;
            // Show the view container
            const viewId = result.handler.viewId;
            if (viewId) {
                const viewEl = document.getElementById(viewId);
                if (viewEl) viewEl.classList.add('active');
            }
            result.handler.enter(result.params);
        } else {
            // Fallback to home
            this.navigate('#/home');
        }
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
            window.location.hash = '#/home';
        } else {
            this.handleRouteChange();
        }
    }
};
