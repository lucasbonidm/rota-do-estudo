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
        currentPlayer: null,
        expandedModules: new Set()
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

        // Escutar atualizações da extensão Chrome
        this._onExtensionUpdate = (e) => {
            if (e.detail?.courseId === this.state.courseId) {
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.renderModules();
                this.updateProgressBar();
            }
        };
        window.addEventListener('course-data-updated', this._onExtensionUpdate);

        // Initialize video preferences
        this.elements.speedControl.value = Store.getVideoSpeed();
        const isAutoplayEnabled = Store.getAutoplay();
        this.elements.autoplayToggle.classList.toggle('active', isAutoplayEnabled);

        // Update header brand
        this.elements.sidebarCourseTitle.textContent = this.state.courseData.title;
        document.title = `${this.state.courseData.title} - Rota do Estudo`;

        this.state.expandedModules = new Set();
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

        // Ao carregar, expandir apenas o módulo da aula ativa e rolar até ela
        if (this.state.currentModuleId) {
            this.state.expandedModules = new Set([this.state.currentModuleId]);
            this.renderModules();
            const lessonItem = document.querySelector(`[data-lesson-id="${this.state.currentLessonId}"]`);
            if (lessonItem) {
                lessonItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    },

    leave() {
        if (this._onExtensionUpdate) {
            window.removeEventListener('course-data-updated', this._onExtensionUpdate);
            this._onExtensionUpdate = null;
        }
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
        if (this.elements.speedControl && this._boundHandlers.speedChange) {
            this.elements.speedControl.removeEventListener('change', this._boundHandlers.speedChange);
        }
        if (this.elements.autoplayToggle && this._boundHandlers.autoplayToggle) {
            this.elements.autoplayToggle.removeEventListener('click', this._boundHandlers.autoplayToggle);
        }
        if (this.elements.theaterModeToggle && this._boundHandlers.theaterMode) {
            this.elements.theaterModeToggle.removeEventListener('click', this._boundHandlers.theaterMode);
        }
        if (this.elements.showSidebarBtn && this._boundHandlers.showSidebar) {
            this.elements.showSidebarBtn.removeEventListener('click', this._boundHandlers.showSidebar);
        }
        // Reset sidebar state
        if (this.elements.appLayout) {
            this.elements.appLayout.classList.remove('theater-mode');
        }
        if (this.elements.showSidebarBtn) {
            this.elements.showSidebarBtn.style.display = 'none';
        }
        // Reset state
        this.state.currentModuleId = null;
        this.state.currentLessonId = null;
        this.state.searchQuery = '';
        this.state.filteredLessons = [];
        this.state.expandedModules = new Set();
    },

    _cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            moduleNav: document.getElementById('moduleNav'),
            noResults: document.getElementById('noResults'),
            videoContainer: document.getElementById('videoContainer'),
            currentLessonTitle: document.getElementById('currentLessonTitle'),
            markCompleteBtn: document.getElementById('markComplete'),
            progressFill: document.querySelector('#course-view .progress-fill'),
            progressText: document.querySelector('#course-view .progress-text'),
            sidebarCourseTitle: document.getElementById('sidebarCourseTitle'),
            backToHome: document.getElementById('backToHome'),
            speedControl: document.getElementById('speedControl'),
            autoplayToggle: document.getElementById('autoplayToggle'),
            theaterModeToggle: document.getElementById('theaterModeToggle'),
            showSidebarBtn: document.getElementById('showSidebarBtn'),
            appLayout: document.querySelector('.app-layout')
        };
    },

    _setupEventListeners() {
        this._boundHandlers.search = (e) => this.handleSearch(e);
        this._boundHandlers.clearSearch = () => this.clearSearch();
        this._boundHandlers.markComplete = () => this.toggleLessonCompletion();
        this._boundHandlers.backToHome = () => Router.navigate('#/home');
        this._boundHandlers.keydown = (e) => this.handleKeydown(e);
        this._boundHandlers.speedChange = (e) => this.handleSpeedChange(e);
        this._boundHandlers.autoplayToggle = () => this.handleAutoplayToggle();
        this._boundHandlers.theaterMode = () => this.toggleTheaterMode();
        this._boundHandlers.showSidebar = () => this.toggleTheaterMode();

        this.elements.searchInput.addEventListener('input', this._boundHandlers.search);
        this.elements.clearSearch.addEventListener('click', this._boundHandlers.clearSearch);
        this.elements.markCompleteBtn.addEventListener('click', this._boundHandlers.markComplete);
        this.elements.backToHome.addEventListener('click', this._boundHandlers.backToHome);
        this.elements.speedControl.addEventListener('change', this._boundHandlers.speedChange);
        this.elements.autoplayToggle.addEventListener('click', this._boundHandlers.autoplayToggle);
        this.elements.theaterModeToggle.addEventListener('click', this._boundHandlers.theaterMode);
        this.elements.showSidebarBtn.addEventListener('click', this._boundHandlers.showSidebar);
        document.addEventListener('keydown', this._boundHandlers.keydown);
    },

    // ============ MODULE MANAGEMENT ============
    renderModules() {
        const nav = this.elements.moduleNav;
        nav.innerHTML = '';

        if (this.state.searchQuery.trim()) {
            this._renderSearchResults(nav);
            return;
        }

        this.elements.noResults.style.display = 'none';

        this.state.courseData.modules.forEach(mod => {
            const isExpanded = this.state.expandedModules.has(mod.id);
            const isActive = mod.id === this.state.currentModuleId;
            const progress = Store.getModuleProgress(this.state.courseData, mod.id);

            const item = document.createElement('div');
            item.className = 'module-accordion-item' + (isExpanded ? ' expanded' : '');
            item.setAttribute('data-module-id', mod.id);

            item.innerHTML = `
                <button class="module-accordion-header${isActive ? ' active' : ''}"
                        aria-expanded="${isExpanded}"
                        aria-controls="lessons-${mod.id}">
                    <div class="module-accordion-info">
                        <div class="module-accordion-label">${mod.title}</div>
                        <div class="module-accordion-meta">
                            <span class="module-accordion-progress-text">${progress.completed}/${progress.total}</span>
                            <div class="module-accordion-progress-bar">
                                <div class="module-accordion-progress-fill" style="width: ${progress.percentage}%"></div>
                            </div>
                        </div>
                    </div>
                    <span class="module-accordion-chevron" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                </button>
                <div class="module-accordion-lessons" id="lessons-${mod.id}" role="region">
                </div>
            `;

            const header = item.querySelector('.module-accordion-header');
            header.addEventListener('click', () => this._toggleModuleExpand(mod.id));

            const lessonsContainer = item.querySelector('.module-accordion-lessons');
            mod.lessons.forEach(lesson => {
                const lessonEl = document.createElement('div');
                lessonEl.className = 'lesson-item'
                    + (lesson.completed ? ' completed' : '')
                    + (this.state.currentLessonId === lesson.id ? ' active' : '');
                lessonEl.setAttribute('data-lesson-id', lesson.id);
                lessonEl.setAttribute('role', 'button');
                lessonEl.setAttribute('tabindex', '0');
                lessonEl.innerHTML = `<span class="lesson-title">${lesson.title}</span>`;
                lessonEl.addEventListener('click', () => {
                    this.state.currentModuleId = mod.id;
                    this._loadLesson(lesson, mod);
                });
                lessonsContainer.appendChild(lessonEl);
            });

            nav.appendChild(item);
        });
    },

    _toggleModuleExpand(moduleId) {
        if (this.state.expandedModules.has(moduleId)) {
            this.state.expandedModules.delete(moduleId);
        } else {
            this.state.expandedModules.add(moduleId);
        }
        this.renderModules();
    },

    _renderSearchResults(nav) {
        const query = this.state.searchQuery.toLowerCase();
        let totalMatches = 0;

        this.state.courseData.modules.forEach(mod => {
            const matches = mod.lessons.filter(l =>
                l.title.toLowerCase().includes(query)
            );
            if (matches.length === 0) return;

            totalMatches += matches.length;

            const groupLabel = document.createElement('div');
            groupLabel.className = 'search-group-label';
            groupLabel.textContent = mod.title;
            nav.appendChild(groupLabel);

            matches.forEach(lesson => {
                const item = document.createElement('div');
                item.className = 'lesson-item'
                    + (lesson.completed ? ' completed' : '')
                    + (this.state.currentLessonId === lesson.id ? ' active' : '');
                item.setAttribute('data-lesson-id', lesson.id);
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');
                item.innerHTML = `<span class="lesson-title">${lesson.title}</span>`;
                item.addEventListener('click', () => {
                    this.state.currentModuleId = mod.id;
                    this.state.expandedModules.add(mod.id);
                    this._loadLesson(lesson, mod);
                });
                nav.appendChild(item);
            });
        });

        this.elements.noResults.style.display = totalMatches === 0 ? 'block' : 'none';
    },

    _refreshLessonStates() {
        if (this.state.searchQuery.trim()) {
            this.renderModules();
            return;
        }

        this.state.courseData.modules.forEach(mod => {
            mod.lessons.forEach(lesson => {
                const el = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
                if (!el) return;
                el.classList.toggle('completed', lesson.completed);
                el.classList.toggle('active', lesson.id === this.state.currentLessonId);
            });

            const accordionItem = document.querySelector(`.module-accordion-item[data-module-id="${mod.id}"]`);
            if (!accordionItem) return;
            const progress = Store.getModuleProgress(this.state.courseData, mod.id);
            const progressText = accordionItem.querySelector('.module-accordion-progress-text');
            const progressFill = accordionItem.querySelector('.module-accordion-progress-fill');
            if (progressText) progressText.textContent = `${progress.completed}/${progress.total}`;
            if (progressFill) progressFill.style.width = `${progress.percentage}%`;
        });
    },

    selectModule(moduleId) {
        this.state.currentModuleId = moduleId;
        this.state.expandedModules.add(moduleId);
        this.state.searchQuery = '';
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';

        this.renderModules();

        // Load first incomplete lesson
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
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

        this._refreshLessonStates();
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

        this.renderModules();
        this._updateMarkCompleteButton();
        this.updateProgressBar();

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
        this.renderModules();
    },

    clearSearch() {
        this.state.searchQuery = '';
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';
        this.renderModules();
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

    toggleTheaterMode() {
        const isHidden = this.elements.appLayout.classList.toggle('theater-mode');
        this.elements.showSidebarBtn.style.display = isHidden ? '' : 'none';
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

    // ============ HELPERS ============
    _findLessonById(lessonId) {
        for (const mod of this.state.courseData.modules) {
            const lesson = mod.lessons.find(l => l.id === lessonId);
            if (lesson) return lesson;
        }
        return null;
    }
};
