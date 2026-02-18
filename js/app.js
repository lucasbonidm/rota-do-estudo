// ============ SHARED UTILITIES ============

/**
 * Configura troca de abas em modais.
 * @param {NodeList|Array} tabs - Botões de aba com data-tab
 * @param {Object} contentIdMap - Mapa { 'nomeTab': 'idDoElemento' }
 */
function setupTabs(tabs, contentIdMap) {
    tabs = Array.from(tabs);
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.entries(contentIdMap).forEach(([tabName, contentId]) => {
                const el = document.getElementById(contentId);
                if (el) el.classList.toggle('active', tab.dataset.tab === tabName);
            });
        };
    });
}

/**
 * Copia texto para o clipboard e mostra feedback no botão.
 * @param {HTMLElement} btn - Botão com um <span> filho
 * @param {string} text - Texto a copiar
 */
function copyWithFeedback(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const span = btn.querySelector('span');
        const original = span.textContent;
        span.textContent = 'Copiado!';
        setTimeout(() => span.textContent = original, 2000);
    });
}

// ============ APP BOOTSTRAP ============
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    Store.setTheme(isDark ? 'dark' : 'light');
}

function initApp() {
    // 1. Apply saved theme
    const prefs = Store.getPreferences();
    if (prefs.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 3. Theme toggle button (home view only)
    document.getElementById('themeToggleHome').addEventListener('click', toggleTheme);

    // 4. Register routes
    Router.register('/home', HomeView);
    Router.register('/course/:courseId', CourseView);
    Router.register('/course-editor/:courseId', CourseEditorView);

    // 5. Start router
    Router.init();
}

document.addEventListener('DOMContentLoaded', initApp);
