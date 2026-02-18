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
