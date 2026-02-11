// ============ COURSE VIEW ============

// Script to extract module JSON from YouTube playlist
const MODULE_IMPORT_SCRIPT = String.raw`const moduleTitle =
  document.querySelector('ytd-playlist-panel-renderer yt-formatted-string.title')?.innerText.trim()
  || 'Nome do Modulo';

const videos = document.querySelectorAll(
  'ytd-playlist-panel-video-renderer'
);

const lessons = [];

Array.from(videos).forEach(v => {
  const title = v.querySelector('#video-title')?.innerText.trim();
  if (!title) return;

  const href = v.querySelector('a#wc-endpoint')?.getAttribute('href');
  const url = href
    ? 'https://www.youtube.com' + href.split('&')[0]
    : '';

  lessons.push({ title, url });
});

const result = {
  title: moduleTitle,
  description: '',
  lessons
};

console.log(JSON.stringify(result, null, 2));`;

const CourseView = {
    viewId: 'course-view',

    state: {
        courseId: null,
        courseData: null,
        currentModuleId: null,
        currentLessonId: null,
        searchQuery: '',
        filteredLessons: [],
        currentPlayer: null
    },

    elements: {},

    _boundHandlers: {},

    // ============ LIFECYCLE ============
    enter(params) {
        this.state.courseId = params.courseId;
        this.state.courseData = Store.getCourse(params.courseId);

        if (!this.state.courseData) {
            Router.navigate('#/home');
            return;
        }

        Store.setLastCourse(params.courseId);

        this._cacheElements();
        this._setupEventListeners();
        this._setupSidebarToggle();

        // Initialize video preferences
        this.elements.speedControl.value = Store.getVideoSpeed();
        const isAutoplayEnabled = Store.getAutoplay();
        this.elements.autoplayToggle.classList.toggle('active', isAutoplayEnabled);

        // Update sidebar brand
        this.elements.sidebarCourseTitle.textContent = this.state.courseData.title;
        document.title = `${this.state.courseData.title} - Rota do Estudo`;

        this.renderModules();

        // Load specific lesson or auto-load
        if (params.lessonId) {
            this._loadLessonById(params.lessonId);
        } else if (this.state.courseData.modules.length > 0) {
            const firstMod = this.state.courseData.modules[0];
            this.selectModule(firstMod.id);
            this.autoLoadNextLesson();
        } else {
            this._clearVideoPanel();
        }

        this.updateProgressBar();
    },

    leave() {
        // Stop video
        if (this.state.currentPlayer) {
            this.state.currentPlayer.stopVideo();
            this.state.currentPlayer.destroy();
            this.state.currentPlayer = null;
        }
        if (this.elements.videoContainer) {
            this.elements.videoContainer.innerHTML = '<p class="placeholder">Selecione uma aula para comecar</p>';
        }
        // Remove all event listeners
        if (this._boundHandlers.keydown) {
            document.removeEventListener('keydown', this._boundHandlers.keydown);
        }
        if (this.elements.searchInput && this._boundHandlers.search) {
            this.elements.searchInput.removeEventListener('input', this._boundHandlers.search);
        }
        if (this.elements.clearSearch && this._boundHandlers.clearSearch) {
            this.elements.clearSearch.removeEventListener('click', this._boundHandlers.clearSearch);
        }
        if (this.elements.markCompleteBtn && this._boundHandlers.markComplete) {
            this.elements.markCompleteBtn.removeEventListener('click', this._boundHandlers.markComplete);
        }
        if (this.elements.backToHome && this._boundHandlers.backToHome) {
            this.elements.backToHome.removeEventListener('click', this._boundHandlers.backToHome);
        }
        if (this.elements.addModuleBtn && this._boundHandlers.addModule) {
            this.elements.addModuleBtn.removeEventListener('click', this._boundHandlers.addModule);
        }
        if (this.elements.addLessonBtn && this._boundHandlers.addLesson) {
            this.elements.addLessonBtn.removeEventListener('click', this._boundHandlers.addLesson);
        }
        if (this.elements.speedControl && this._boundHandlers.speedChange) {
            this.elements.speedControl.removeEventListener('change', this._boundHandlers.speedChange);
        }
        if (this.elements.autoplayToggle && this._boundHandlers.autoplayToggle) {
            this.elements.autoplayToggle.removeEventListener('click', this._boundHandlers.autoplayToggle);
        }
        // Reset state
        this.state.currentModuleId = null;
        this.state.currentLessonId = null;
        this.state.searchQuery = '';
        this.state.filteredLessons = [];
        // Close sidebar on mobile
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    },

    _cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            moduleNav: document.getElementById('moduleNav'),
            moduleTitle: document.getElementById('moduleTitle'),
            moduleDescription: document.getElementById('moduleDescription'),
            lessonList: document.getElementById('lessonList'),
            noResults: document.getElementById('noResults'),
            videoContainer: document.getElementById('videoContainer'),
            currentLessonTitle: document.getElementById('currentLessonTitle'),
            markCompleteBtn: document.getElementById('markComplete'),
            progressFill: document.querySelector('#course-view .progress-fill'),
            progressText: document.querySelector('#course-view .progress-text'),
            sidebarCourseTitle: document.getElementById('sidebarCourseTitle'),
            backToHome: document.getElementById('backToHome'),
            addModuleBtn: document.getElementById('addModuleBtn'),
            addLessonBtn: document.getElementById('addLessonBtn'),
            toggleLessonPanel: document.getElementById('toggleLessonPanel'),
            lessonPanel: document.querySelector('.lesson-panel'),
            speedControl: document.getElementById('speedControl'),
            autoplayToggle: document.getElementById('autoplayToggle')
        };
    },

    _setupEventListeners() {
        this._boundHandlers.search = (e) => this.handleSearch(e);
        this._boundHandlers.clearSearch = () => this.clearSearch();
        this._boundHandlers.markComplete = () => this.toggleLessonCompletion();
        this._boundHandlers.backToHome = () => Router.navigate('#/home');
        this._boundHandlers.addModule = () => this.handleAddModule();
        this._boundHandlers.addLesson = () => this.handleAddLesson();
        this._boundHandlers.keydown = (e) => this.handleKeydown(e);
        this._boundHandlers.speedChange = (e) => this.handleSpeedChange(e);
        this._boundHandlers.autoplayToggle = () => this.handleAutoplayToggle();
        this._boundHandlers.togglePanel = () => this.toggleLessonPanel();

        this.elements.searchInput.addEventListener('input', this._boundHandlers.search);
        this.elements.clearSearch.addEventListener('click', this._boundHandlers.clearSearch);
        this.elements.markCompleteBtn.addEventListener('click', this._boundHandlers.markComplete);
        this.elements.backToHome.addEventListener('click', this._boundHandlers.backToHome);
        this.elements.addModuleBtn.addEventListener('click', this._boundHandlers.addModule);
        this.elements.addLessonBtn.addEventListener('click', this._boundHandlers.addLesson);
        this.elements.speedControl.addEventListener('change', this._boundHandlers.speedChange);
        this.elements.autoplayToggle.addEventListener('click', this._boundHandlers.autoplayToggle);
        this.elements.toggleLessonPanel.addEventListener('click', this._boundHandlers.togglePanel);
        document.addEventListener('keydown', this._boundHandlers.keydown);
    },

    // ============ MODULE MANAGEMENT ============
    renderModules() {
        const nav = this.elements.moduleNav;
        nav.innerHTML = '';

        this.state.courseData.modules.forEach(mod => {
            const btn = document.createElement('button');
            btn.className = 'module-btn';
            btn.setAttribute('data-module-id', mod.id);

            const progress = Store.getModuleProgress(this.state.courseData, mod.id);

            if (mod.id === this.state.currentModuleId) {
                btn.classList.add('active');
            }

            btn.innerHTML = `
                <div class="module-btn-content">
                    <span class="drag-handle" title="Arrastar para reordenar"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/></svg></span>
                    <div class="module-btn-label">${mod.title}</div>
                    <div class="module-btn-actions">
                        <button class="action-btn action-edit" data-action="edit-module" data-module-id="${mod.id}" title="Editar modulo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button class="action-btn action-delete" data-action="delete-module" data-module-id="${mod.id}" title="Excluir modulo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="module-btn-meta">
                    <span class="module-progress-text">${progress.completed}/${progress.total}</span>
                    <div class="module-progress-bar">
                        <div class="module-progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                </div>
            `;

            // Module select (not on action buttons)
            btn.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) return;
                this.selectModule(mod.id);
            });

            // Action buttons via delegation
            btn.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.action-btn');
                if (!actionBtn) return;
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const moduleId = actionBtn.dataset.moduleId;
                if (action === 'edit-module') this.handleEditModule(moduleId);
                if (action === 'delete-module') this.handleDeleteModule(moduleId);
            });

            nav.appendChild(btn);
        });

        if (window.Sortable) {
            if (this._moduleSortable) this._moduleSortable.destroy();
            this._moduleSortable = new Sortable(nav, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: () => {
                    const orderedIds = [...nav.querySelectorAll('.module-btn')].map(el => el.dataset.moduleId);
                    Store.reorderModules(this.state.courseId, orderedIds);
                    this.state.courseData = Store.getCourse(this.state.courseId);
                }
            });
        }
    },

    selectModule(moduleId) {
        this.state.currentModuleId = moduleId;
        this.state.currentLessonId = null;
        this.state.searchQuery = '';
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';

        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (mod) {
            this.elements.moduleTitle.textContent = mod.title;
            this.elements.moduleDescription.textContent = mod.description || '';
        }

        this.renderModules();
        this.renderLessons();

        // Load first incomplete lesson
        if (mod) {
            const firstIncomplete = mod.lessons.find(l => !l.completed);
            const target = firstIncomplete || mod.lessons[0];
            if (target) {
                this._loadLesson(target, mod);
            } else {
                this._clearVideoPanel();
            }
        }
    },

    // ============ LESSON RENDERING ============
    renderLessons() {
        const mod = this.state.courseData.modules.find(m => m.id === this.state.currentModuleId);
        if (!mod) return;

        let lessons = mod.lessons;
        if (this.state.searchQuery.trim()) {
            lessons = lessons.filter(l =>
                l.title.toLowerCase().includes(this.state.searchQuery.toLowerCase())
            );
        }
        this.state.filteredLessons = lessons;

        const list = this.elements.lessonList;
        list.innerHTML = '';

        if (lessons.length === 0) {
            this.elements.noResults.style.display = 'block';
            return;
        }
        this.elements.noResults.style.display = 'none';

        lessons.forEach(lesson => {
            const item = document.createElement('div');
            item.className = 'lesson-item';
            item.setAttribute('data-lesson-id', lesson.id);

            if (lesson.completed) item.classList.add('completed');
            if (this.state.currentLessonId === lesson.id) item.classList.add('active');

            item.innerHTML = `
                <span class="drag-handle" title="Arrastar para reordenar"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/></svg></span>
                <span class="lesson-number">${lesson.number}</span>
                <span class="lesson-title">${lesson.title}</span>
                <div class="lesson-actions">
                    <button class="action-btn action-edit" data-action="edit-lesson" data-lesson-id="${lesson.id}" title="Editar aula">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button class="action-btn action-delete" data-action="delete-lesson" data-lesson-id="${lesson.id}" title="Excluir aula">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) return;
                this._loadLesson(lesson, mod);
            });

            item.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.action-btn');
                if (!actionBtn) return;
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const lessonId = actionBtn.dataset.lessonId;
                if (action === 'edit-lesson') this.handleEditLesson(this.state.currentModuleId, lessonId);
                if (action === 'delete-lesson') this.handleDeleteLesson(this.state.currentModuleId, lessonId);
            });

            list.appendChild(item);
        });

        if (window.Sortable && !this.state.searchQuery.trim()) {
            if (this._lessonSortable) this._lessonSortable.destroy();
            this._lessonSortable = new Sortable(list, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: () => {
                    const orderedIds = [...list.querySelectorAll('.lesson-item')].map(el => el.dataset.lessonId);
                    Store.reorderLessons(this.state.courseId, this.state.currentModuleId, orderedIds);
                    this.state.courseData = Store.getCourse(this.state.courseId);
                    this.renderLessons();
                }
            });
        }
    },

    // ============ VIDEO LOADING ============
    _loadLesson(lesson) {
        this.state.currentLessonId = lesson.id;

        if (lesson.videoId) {
            // Create a unique container for the YouTube player
            this.elements.videoContainer.innerHTML = '<div id="playerContainer" class="video-iframe"></div>';

            // Create YouTube player with API
            this.state.currentPlayer = new YT.Player('playerContainer', {
                videoId: lesson.videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    fs: 1,
                    iv_load_policy: 3
                },
                events: {
                    onReady: (event) => this.onPlayerReady(event),
                    onStateChange: (event) => this.onPlayerStateChange(event)
                }
            });
        } else if (lesson.url) {
            this.elements.videoContainer.innerHTML = '<div class="placeholder"><p>Nenhum video disponivel para esta aula</p><p style="font-size: 12px; margin-top: 8px; color: var(--color-text-secondary);">URL fornecida: ' + lesson.url.substring(0, 50) + '...</p></div>';
        } else {
            this.elements.videoContainer.innerHTML = '<p class="placeholder">Nenhum video disponivel para esta aula</p>';
        }

        this.elements.currentLessonTitle.textContent = `${lesson.number}. ${lesson.title}`;

        this.renderLessons();
        this._updateMarkCompleteButton();

        const lessonItem = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
        if (lessonItem) {
            lessonItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    // ============ PLAYER API CALLBACKS ============
    onPlayerReady(event) {
        // Apply saved video speed
        const speed = Store.getVideoSpeed();
        event.target.setPlaybackRate(speed);
        this.elements.speedControl.value = speed;

        if (this.state.pendingAutoplay) {
            this.state.pendingAutoplay = false;
            event.target.playVideo();
        }
    },

    onPlayerStateChange(event) {
        // YT.PlayerState.ENDED = 0
        if (event.data === YT.PlayerState.ENDED && Store.getAutoplay()) {
            this.state.pendingAutoplay = true;
            this.toggleLessonCompletion();
        }
    },

    _loadLessonById(lessonId) {
        for (const mod of this.state.courseData.modules) {
            const lesson = mod.lessons.find(l => l.id === lessonId);
            if (lesson) {
                this.selectModule(mod.id);
                this._loadLesson(lesson, mod);
                return;
            }
        }
    },

    _clearVideoPanel() {
        if (this.state.currentPlayer) {
            this.state.currentPlayer.stopVideo();
            this.state.currentPlayer.destroy();
            this.state.currentPlayer = null;
        }
        this.elements.videoContainer.innerHTML = '<p class="placeholder">Selecione uma aula para comecar</p>';
        this.elements.currentLessonTitle.textContent = '\u2014';
        this._updateMarkCompleteButton();
    },

    // ============ PROGRESS ============
    toggleLessonCompletion() {
        if (!this.state.currentLessonId || !this.state.currentModuleId) return;

        const isNowCompleted = Store.toggleLessonComplete(
            this.state.courseId,
            this.state.currentModuleId,
            this.state.currentLessonId
        );

        // Reload course data
        this.state.courseData = Store.getCourse(this.state.courseId);

        this.renderLessons();
        this._updateMarkCompleteButton();
        this.updateProgressBar();
        this.renderModules();

        if (isNowCompleted) {
            this.handleNextLesson();
        }
    },

    _updateMarkCompleteButton() {
        const btn = this.elements.markCompleteBtn;
        const span = btn.querySelector('span');

        if (!this.state.currentLessonId) {
            if (span) span.textContent = 'Marcar como Concluida';
            btn.disabled = true;
            btn.removeAttribute('data-completed');
            return;
        }

        btn.disabled = false;
        const lesson = this._findLessonById(this.state.currentLessonId);
        const isCompleted = lesson ? lesson.completed : false;

        if (isCompleted) {
            if (span) span.textContent = 'Marcar como Nao Concluida';
            btn.setAttribute('data-completed', 'true');
        } else {
            if (span) span.textContent = 'Marcar como Concluida';
            btn.removeAttribute('data-completed');
        }
    },

    updateProgressBar() {
        const progress = Store.getCourseProgress(this.state.courseId);
        this.elements.progressFill.style.width = progress.percentage + '%';
        this.elements.progressText.textContent = `${progress.completed}/${progress.total} aulas concluidas`;
    },

    // ============ AUTO-LOAD ============
    autoLoadNextLesson() {
        const course = this.state.courseData;
        if (!course) return;

        let lastCompletedMod = null;
        let lastCompletedLesson = null;

        for (const mod of course.modules) {
            for (const lesson of mod.lessons) {
                if (lesson.completed) {
                    lastCompletedMod = mod;
                    lastCompletedLesson = lesson;
                }
            }
        }

        if (!lastCompletedMod) {
            const firstMod = course.modules[0];
            if (firstMod && firstMod.lessons.length > 0) {
                if (this.state.currentModuleId !== firstMod.id) {
                    this.selectModule(firstMod.id);
                }
                this._loadLesson(firstMod.lessons[0], firstMod);
            }
            return;
        }

        const lessonIdx = lastCompletedMod.lessons.findIndex(l => l.id === lastCompletedLesson.id);

        // Next in same module
        if (lessonIdx < lastCompletedMod.lessons.length - 1) {
            if (this.state.currentModuleId !== lastCompletedMod.id) {
                this.selectModule(lastCompletedMod.id);
            }
            this._loadLesson(lastCompletedMod.lessons[lessonIdx + 1], lastCompletedMod);
            return;
        }

        // Next module
        const modIdx = course.modules.findIndex(m => m.id === lastCompletedMod.id);
        if (modIdx < course.modules.length - 1) {
            const nextMod = course.modules[modIdx + 1];
            if (nextMod.lessons.length > 0) {
                this.selectModule(nextMod.id);
                this._loadLesson(nextMod.lessons[0], nextMod);
                return;
            }
        }
    },

    // ============ SEARCH ============
    handleSearch(event) {
        this.state.searchQuery = event.target.value.trim();
        this.elements.clearSearch.style.display = this.state.searchQuery ? 'flex' : 'none';
        this.renderLessons();
    },

    clearSearch() {
        this.state.searchQuery = '';
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';
        this.renderLessons();
    },

    // ============ NAVIGATION ============
    handleNextLesson() {
        if (!this.state.currentLessonId) return;
        const course = this.state.courseData;
        const currentMod = course.modules.find(m => m.id === this.state.currentModuleId);
        if (!currentMod) return;

        const lessonIdx = currentMod.lessons.findIndex(l => l.id === this.state.currentLessonId);
        if (lessonIdx === -1) return;

        if (lessonIdx < currentMod.lessons.length - 1) {
            this._loadLesson(currentMod.lessons[lessonIdx + 1], currentMod);
            return;
        }

        const modIdx = course.modules.findIndex(m => m.id === this.state.currentModuleId);
        if (modIdx < course.modules.length - 1) {
            const nextMod = course.modules[modIdx + 1];
            this.selectModule(nextMod.id);
            if (nextMod.lessons.length > 0) {
                this._loadLesson(nextMod.lessons[0], nextMod);
            }
        }
    },

    handlePrevLesson() {
        if (!this.state.currentLessonId) return;
        const course = this.state.courseData;
        const currentMod = course.modules.find(m => m.id === this.state.currentModuleId);
        if (!currentMod) return;

        const lessonIdx = currentMod.lessons.findIndex(l => l.id === this.state.currentLessonId);
        if (lessonIdx === -1) return;

        if (lessonIdx > 0) {
            this._loadLesson(currentMod.lessons[lessonIdx - 1], currentMod);
            return;
        }

        const modIdx = course.modules.findIndex(m => m.id === this.state.currentModuleId);
        if (modIdx > 0) {
            const prevMod = course.modules[modIdx - 1];
            this.selectModule(prevMod.id);
            if (prevMod.lessons.length > 0) {
                this._loadLesson(prevMod.lessons[prevMod.lessons.length - 1], prevMod);
            }
        }
    },

    // ============ PLAYER CONTROLS ============
    handleSpeedChange(event) {
        const speed = parseFloat(event.target.value);
        Store.setVideoSpeed(speed);
        if (this.state.currentPlayer) {
            this.state.currentPlayer.setPlaybackRate(speed);
        }
    },

    handleAutoplayToggle() {
        const isActive = !this.elements.autoplayToggle.classList.contains('active');
        this.elements.autoplayToggle.classList.toggle('active', isActive);
        Store.setAutoplay(isActive);
    },

    toggleLessonPanel() {
        const panel = this.elements.lessonPanel;
        const isCollapsed = panel.classList.toggle('collapsed');
        this.elements.toggleLessonPanel.title = isCollapsed ? 'Expandir painel' : 'Recolher painel';
    },

    // ============ KEYBOARD SHORTCUTS ============
    handleKeydown(event) {
        if (event.altKey && event.key === 'ArrowRight') {
            event.preventDefault();
            this.handleNextLesson();
        } else if (event.altKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            this.handlePrevLesson();
        } else if (event.altKey && event.key === 'm') {
            event.preventDefault();
            this.toggleLessonCompletion();
        } else if (event.key === 'Escape' && this.state.searchQuery) {
            event.preventDefault();
            this.clearSearch();
        }
    },

    // ============ SIDEBAR TOGGLE ============
    _setupSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const trigger = document.getElementById('sidebarTrigger');
        const overlay = document.getElementById('sidebarOverlay');
        const appLayout = document.querySelector('.app-layout');

        if (trigger) {
            trigger.addEventListener('click', () => {
                if (window.innerWidth >= 1024) {
                    appLayout.classList.toggle('sidebar-collapsed');
                } else {
                    sidebar.classList.toggle('open');
                    if (overlay) overlay.classList.toggle('active');
                }
            });
        }
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    },

    // ============ CRUD: MODULES ============
    handleAddModule() {
        this._openInlineModal('Adicionar Modulo', `
            <div class="inline-modal-tabs">
                <button class="inline-modal-tab active" data-tab="manual">Manual</button>
                <button class="inline-modal-tab" data-tab="import">Importar JSON</button>
            </div>
            <div id="inlineTabManual" class="inline-tab-content active">
                <label class="form-label" for="newModuleTitle">Nome do modulo</label>
                <input id="newModuleTitle" type="text" class="form-input" placeholder="Ex: Modulo 6 - Avancado" autocomplete="off">
                <label class="form-label" for="newModuleDesc" style="margin-top:12px">Descricao (opcional)</label>
                <input id="newModuleDesc" type="text" class="form-input" placeholder="Descricao do modulo" autocomplete="off">
                <button id="confirmAddModule" class="btn btn-primary modal-action">Adicionar</button>
            </div>
            <div id="inlineTabImport" class="inline-tab-content">
                <div class="import-help">
                    <p class="import-help-title">Como obter o JSON da playlist:</p>
                    <ol class="import-steps">
                        <li>Abra a <strong>playlist</strong> no YouTube</li>
                        <li>Role ate o final para carregar todos os videos</li>
                        <li>Pressione <kbd>F12</kbd> para abrir o DevTools</li>
                        <li>Va na aba <strong>Console</strong></li>
                        <li>Cole o codigo abaixo e pressione <kbd>Enter</kbd></li>
                        <li>Copie o JSON gerado e cole no campo abaixo</li>
                    </ol>
                    <div class="code-template">
                        <div class="code-template-header">
                            <span>Codigo para o Console</span>
                            <button type="button" id="copyModuleScript" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                <span>Copiar</span>
                            </button>
                        </div>
                        <pre class="code-template-code" id="moduleScriptCode"></pre>
                    </div>
                </div>
                <label class="form-label" for="importModuleJson" style="margin-top:16px">Cole o JSON gerado aqui</label>
                <textarea id="importModuleJson" class="form-textarea" rows="6" placeholder='{"title": "...", "lessons": [...]}'></textarea>
                <div id="importModuleError" class="form-error" style="display: none;"></div>
                <button id="confirmImportModule" class="btn btn-primary modal-action">Importar Modulo</button>
            </div>
        `, () => {
            // Tab switching
            const tabs = document.querySelectorAll('.inline-modal-tab');
            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById('inlineTabManual').classList.toggle('active', tab.dataset.tab === 'manual');
                    document.getElementById('inlineTabImport').classList.toggle('active', tab.dataset.tab === 'import');
                };
            });

            // Manual add
            document.getElementById('confirmAddModule').addEventListener('click', () => {
                const title = document.getElementById('newModuleTitle').value.trim();
                if (!title) return;
                const desc = document.getElementById('newModuleDesc').value.trim();
                Store.addModule(this.state.courseId, title, desc);
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.renderModules();
                this.updateProgressBar();
                this._closeInlineModal();
            });

            // Populate module script code
            const codeEl = document.getElementById('moduleScriptCode');
            if (codeEl) codeEl.textContent = MODULE_IMPORT_SCRIPT;

            // Copy script button
            const copyBtn = document.getElementById('copyModuleScript');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(MODULE_IMPORT_SCRIPT).then(() => {
                        const span = copyBtn.querySelector('span');
                        span.textContent = 'Copiado!';
                        setTimeout(() => span.textContent = 'Copiar', 2000);
                    });
                };
            }

            // Import module
            document.getElementById('confirmImportModule').addEventListener('click', () => {
                const jsonStr = document.getElementById('importModuleJson').value.trim();
                const errorEl = document.getElementById('importModuleError');
                errorEl.style.display = 'none';
                if (!jsonStr) return;

                try {
                    const data = JSON.parse(jsonStr);
                    if (!data.title && !data.lessons) {
                        throw new Error('JSON deve conter "title" e "lessons".');
                    }
                    Store.importModule(this.state.courseId, data);
                    this.state.courseData = Store.getCourse(this.state.courseId);
                    this.renderModules();
                    this.updateProgressBar();
                    this._closeInlineModal();
                } catch (err) {
                    errorEl.textContent = 'Erro: ' + err.message;
                    errorEl.style.display = 'block';
                }
            });
        }, { wide: true });
    },

    handleEditModule(moduleId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;

        this._openInlineModal('Editar Modulo', `
            <label class="form-label" for="editModuleTitle">Nome do modulo</label>
            <input id="editModuleTitle" type="text" class="form-input" value="${mod.title}" autocomplete="off">
            <label class="form-label" for="editModuleDesc" style="margin-top:12px">Descricao</label>
            <input id="editModuleDesc" type="text" class="form-input" value="${mod.description || ''}" autocomplete="off">
            <button id="confirmEditModule" class="btn btn-primary modal-action">Salvar</button>
        `, () => {
            document.getElementById('confirmEditModule').addEventListener('click', () => {
                const title = document.getElementById('editModuleTitle').value.trim();
                if (!title) return;
                const desc = document.getElementById('editModuleDesc').value.trim();
                Store.updateModule(this.state.courseId, moduleId, { title, description: desc });
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.renderModules();
                if (this.state.currentModuleId === moduleId) {
                    this.elements.moduleTitle.textContent = title;
                    this.elements.moduleDescription.textContent = desc;
                }
                this._closeInlineModal();
            });
        });
    },

    handleDeleteModule(moduleId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        if (!confirm(`Excluir "${mod.title}" e todas as suas aulas?`)) return;

        Store.deleteModule(this.state.courseId, moduleId);
        this.state.courseData = Store.getCourse(this.state.courseId);
        this.renderModules();
        this.updateProgressBar();

        if (this.state.currentModuleId === moduleId) {
            if (this.state.courseData.modules.length > 0) {
                this.selectModule(this.state.courseData.modules[0].id);
            } else {
                this.elements.moduleTitle.textContent = 'Nenhum modulo';
                this.elements.moduleDescription.textContent = '';
                this.elements.lessonList.innerHTML = '';
                this._clearVideoPanel();
            }
        }
    },

    // ============ CRUD: LESSONS ============
    handleAddLesson() {
        if (!this.state.currentModuleId) return;

        this._openInlineModal('Adicionar Aula', `
            <label class="form-label" for="newLessonTitle">Titulo da aula</label>
            <input id="newLessonTitle" type="text" class="form-input" placeholder="Ex: Introducao ao Flexbox" autocomplete="off">
            <label class="form-label" for="newLessonUrl" style="margin-top:12px">URL do YouTube</label>
            <input id="newLessonUrl" type="url" class="form-input" placeholder="https://www.youtube.com/watch?v=..." autocomplete="off">
            <button id="confirmAddLesson" class="btn btn-primary modal-action">Adicionar</button>
        `, () => {
            document.getElementById('confirmAddLesson').addEventListener('click', () => {
                const title = document.getElementById('newLessonTitle').value.trim();
                if (!title) return;
                const url = document.getElementById('newLessonUrl').value.trim();
                Store.addLesson(this.state.courseId, this.state.currentModuleId, title, url);
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.renderLessons();
                this.renderModules();
                this.updateProgressBar();
                this._closeInlineModal();
            });
        });
    },

    handleEditLesson(moduleId, lessonId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const moduleOptions = this.state.courseData.modules.map(m =>
            `<option value="${m.id}"${m.id === moduleId ? ' selected' : ''}>${m.title}</option>`
        ).join('');

        this._openInlineModal('Editar Aula', `
            <label class="form-label" for="editLessonTitle">Titulo</label>
            <input id="editLessonTitle" type="text" class="form-input" value="${lesson.title}" autocomplete="off">
            <label class="form-label" for="editLessonUrl" style="margin-top:12px">URL do YouTube</label>
            <input id="editLessonUrl" type="url" class="form-input" value="${lesson.url || ''}" autocomplete="off">
            <label class="form-label" for="editLessonModule" style="margin-top:12px">Módulo</label>
            <select id="editLessonModule" class="form-input">${moduleOptions}</select>
            <button id="confirmEditLesson" class="btn btn-primary modal-action">Salvar</button>
        `, () => {
            document.getElementById('confirmEditLesson').addEventListener('click', () => {
                const title = document.getElementById('editLessonTitle').value.trim();
                if (!title) return;
                const url = document.getElementById('editLessonUrl').value.trim();
                const newModuleId = document.getElementById('editLessonModule').value;
                Store.updateLesson(this.state.courseId, moduleId, lessonId, { title, url });
                if (newModuleId !== moduleId) {
                    Store.moveLesson(this.state.courseId, moduleId, newModuleId, lessonId);
                }
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.renderLessons();
                if (this.state.currentLessonId === lessonId) {
                    const updatedLesson = this._findLessonById(lessonId);
                    if (updatedLesson) {
                        const updatedMod = this.state.courseData.modules.find(m => m.id === newModuleId);
                        this._loadLesson(updatedLesson, updatedMod);
                    }
                }
                this._closeInlineModal();
            });
        });
    },

    handleDeleteLesson(moduleId, lessonId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        if (!confirm(`Excluir aula "${lesson.title}"?`)) return;

        Store.deleteLesson(this.state.courseId, moduleId, lessonId);
        this.state.courseData = Store.getCourse(this.state.courseId);
        this.renderLessons();
        this.renderModules();
        this.updateProgressBar();

        if (this.state.currentLessonId === lessonId) {
            this._clearVideoPanel();
            this.state.currentLessonId = null;
        }
    },

    // ============ INLINE MODAL HELPERS ============
    _openInlineModal(title, bodyHtml, onMount, options) {
        const overlay = document.getElementById('inlineModalOverlay');
        const modalEl = overlay.querySelector('.modal');
        const titleEl = document.getElementById('inlineModalTitle');
        const body = document.getElementById('inlineModalBody');
        const closeBtn = document.getElementById('inlineModalClose');

        titleEl.textContent = title;
        body.innerHTML = bodyHtml;
        overlay.style.display = 'flex';

        // Handle modal size
        modalEl.classList.toggle('modal-small', !(options && options.wide));

        closeBtn.onclick = () => this._closeInlineModal();
        overlay.onclick = (e) => {
            if (e.target === overlay) this._closeInlineModal();
        };

        if (onMount) onMount();

        // Focus first input
        const firstInput = body.querySelector('input, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 50);
    },

    _closeInlineModal() {
        const overlay = document.getElementById('inlineModalOverlay');
        overlay.style.display = 'none';
        overlay.querySelector('.modal').classList.add('modal-small');
    },

    // ============ HELPERS ============
    _findLessonById(lessonId) {
        for (const mod of this.state.courseData.modules) {
            const lesson = mod.lessons.find(l => l.id === lessonId);
            if (lesson) return lesson;
        }
        return null;
    }
};
