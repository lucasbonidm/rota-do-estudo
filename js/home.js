// ============ HOME VIEW - Dashboard ============

// Script to extract course JSON from YouTube playlist
const COURSE_IMPORT_SCRIPT = String.raw`const courseTitle =
  document.querySelector('ytd-playlist-panel-renderer yt-formatted-string.title')?.innerText.trim()
  || document.querySelector('h1#title')?.innerText.trim()
  || 'Nome do Curso';

const videos = document.querySelectorAll(
  'ytd-playlist-panel-video-renderer'
);

const modules = [];
let currentModule = null;

Array.from(videos).forEach(v => {
  const title = v.querySelector('#video-title')?.innerText.trim();
  if (!title) return;

  const href = v.querySelector('a#wc-endpoint')?.getAttribute('href');
  const url = href
    ? 'https://www.youtube.com' + href.split('&')[0]
    : '';

  const isModule = /^módulo\s*\d+/i.test(title);

  if (isModule) {
    currentModule = {
      title,
      description: '',
      lessons: []
    };
    modules.push(currentModule);
  } else {
    if (!currentModule) {
      currentModule = {
        title: courseTitle,
        description: '',
        lessons: []
      };
      modules.push(currentModule);
    }

    currentModule.lessons.push({
      title,
      url
    });
  }
});

const result = {
  title: courseTitle,
  modules
};

console.log(JSON.stringify(result, null, 2));`;

const HomeView = {
    viewId: 'home-view',

    enter() {
        document.title = 'Rota do Estudo';
        this.renderCourseGrid();
        this._setupEventListeners();

        // Escutar atualizações da extensão Chrome
        this._onExtensionUpdate = () => this.renderCourseGrid();
        window.addEventListener('course-data-updated', this._onExtensionUpdate);
    },

    leave() {
        if (this._onExtensionUpdate) {
            window.removeEventListener('course-data-updated', this._onExtensionUpdate);
            this._onExtensionUpdate = null;
        }
    },

    // ============ RENDERING ============
    renderCourseGrid() {
        const emptyState = document.getElementById('emptyState');
        const courseSections = document.getElementById('courseSections');
        const courses = Store.getCoursesIndex();

        if (courses.length === 0) {
            courseSections.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        // Categorize courses by progress
        const inProgress = [];
        const notStarted = [];
        const completed = [];

        courses.forEach(course => {
            const percentage = course.totalLessons > 0
                ? Math.round((course.completedLessons / course.totalLessons) * 100)
                : 0;

            if (percentage === 100) {
                completed.push(course);
            } else if (percentage === 0) {
                notStarted.push(course);
            } else {
                inProgress.push(course);
            }
        });

        // Sort by lastAccessed descending
        [inProgress, notStarted, completed].forEach(arr => {
            arr.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
        });

        courseSections.style.display = 'block';
        emptyState.style.display = 'none';

        // Render sections
        this._renderSection('inProgressSection', 'inProgressGrid', inProgress);
        this._renderSection('notStartedSection', 'notStartedGrid', notStarted);
        this._renderSection('completedSection', 'completedGrid', completed);
    },

    _renderSection(sectionId, gridId, courses) {
        const section = document.getElementById(sectionId);
        const grid = document.getElementById(gridId);

        if (courses.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        grid.innerHTML = '';
        courses.forEach(course => {
            grid.appendChild(this._createCourseCard(course));
        });
    },

    _createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.setAttribute('data-course-id', course.id);

        const percentage = course.totalLessons > 0
            ? Math.round((course.completedLessons / course.totalLessons) * 100)
            : 0;

        const lastAccessed = course.lastAccessed
            ? new Date(course.lastAccessed).toLocaleDateString('pt-BR')
            : '';

        card.innerHTML = `
            <div class="course-card-thumbnail" style="${course.thumbnail ? `background-image: url('${course.thumbnail}')` : ''}">
                ${!course.thumbnail ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                ` : ''}
                ${percentage > 0 ? `<div class="course-card-badge">${percentage}%</div>` : ''}
            </div>
            <div class="course-card-body">
                <h3 class="course-card-title">${course.title}</h3>
                <div class="course-card-meta">
                    <span>${course.totalLessons} aulas</span>
                    ${lastAccessed ? `<span>${lastAccessed}</span>` : ''}
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="course-card-footer">
                <button class="btn btn-ghost btn-sm edit-course-btn" data-course-id="${course.id}" title="Editar nome do curso">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm export-course-btn" data-course-id="${course.id}" title="Exportar JSON">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm delete-course-btn" data-course-id="${course.id}" title="Excluir curso">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
        `;

        // Click card to open course
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-course-btn') || e.target.closest('.export-course-btn') || e.target.closest('.edit-course-btn')) return;
            Router.navigate(`#/course/${course.id}`);
        });

        // Edit button
        card.querySelector('.edit-course-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleEditCourse(course.id, course.title);
        });

        // Delete button
        card.querySelector('.delete-course-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleDeleteCourse(course.id, course.title);
        });

        // Export button
        card.querySelector('.export-course-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleExportCourse(course.id);
        });

        return card;
    },

    // ============ EVENT LISTENERS ============
    _setupEventListeners() {
        const newCourseBtn = document.getElementById('newCourseBtn');
        const emptyStateBtn = document.getElementById('emptyStateBtn');

        newCourseBtn.onclick = () => this._openModal();
        if (emptyStateBtn) emptyStateBtn.onclick = () => this._openModal();

        document.getElementById('exportAllBtn').onclick = () => { this._closeSettingsMenu(); this._handleExportAll(); };
        document.getElementById('importAllBtn').onclick = () => { this._closeSettingsMenu(); this._handleImportAll(); };

        // Settings dropdown
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsMenu = document.getElementById('settingsMenu');
        settingsToggle.onclick = (e) => {
            e.stopPropagation();
            const isOpen = settingsMenu.classList.toggle('open');
            settingsToggle.setAttribute('aria-expanded', isOpen);
        };
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#settingsDropdown')) {
                this._closeSettingsMenu();
            }
        });
    },

    _closeSettingsMenu() {
        const menu = document.getElementById('settingsMenu');
        const toggle = document.getElementById('settingsToggle');
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    },

    // ============ MODAL ============
    _openModal() {
        const overlay = document.getElementById('courseModalOverlay');
        overlay.style.display = 'flex';

        // Tab switching
        const tabs = overlay.querySelectorAll('.modal-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tabManual').classList.toggle('active', tab.dataset.tab === 'manual');
                document.getElementById('tabImport').classList.toggle('active', tab.dataset.tab === 'import');
            };
        });

        // Close
        document.getElementById('modalClose').onclick = () => this._closeModal();
        overlay.onclick = (e) => {
            if (e.target === overlay) this._closeModal();
        };

        // Create course
        document.getElementById('createCourseBtn').onclick = () => {
            const title = document.getElementById('courseTitleInput').value.trim();
            if (!title) return;
            const courseId = Store.createCourse(title);
            this._closeModal();
            Router.navigate(`#/course/${courseId}`);
        };

        // Import course
        document.getElementById('importCourseBtn').onclick = () => {
            const jsonStr = document.getElementById('importJsonInput').value.trim();
            const errorEl = document.getElementById('importError');
            errorEl.style.display = 'none';

            if (!jsonStr) return;

            try {
                const data = JSON.parse(jsonStr);
                if (!data.modules && !data.courseTitle && !data.title) {
                    throw new Error('JSON deve conter "title" ou "courseTitle" e "modules".');
                }
                const courseId = Store.importCourse(data);
                this._closeModal();
                Router.navigate(`#/course/${courseId}`);
            } catch (err) {
                errorEl.textContent = `Erro: ${err.message}`;
                errorEl.style.display = 'block';
            }
        };

        // Reset and focus
        document.getElementById('courseTitleInput').value = '';
        document.getElementById('importJsonInput').value = '';
        document.getElementById('importError').style.display = 'none';

        // Reset tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabs[0].classList.add('active');
        document.getElementById('tabManual').classList.add('active');
        document.getElementById('tabImport').classList.remove('active');

        // Populate import script code
        const codeEl = document.getElementById('courseScriptCode');
        if (codeEl) codeEl.textContent = COURSE_IMPORT_SCRIPT;

        // Copy script button
        const copyBtn = document.getElementById('copyCourseScript');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(COURSE_IMPORT_SCRIPT).then(() => {
                    const span = copyBtn.querySelector('span');
                    span.textContent = 'Copiado!';
                    setTimeout(() => span.textContent = 'Copiar', 2000);
                });
            };
        }

        setTimeout(() => document.getElementById('courseTitleInput').focus(), 50);
    },

    _closeModal() {
        document.getElementById('courseModalOverlay').style.display = 'none';
    },

    // ============ ACTIONS ============
    _handleEditCourse(courseId, currentTitle) {
        const overlay = document.getElementById('inlineModalOverlay');
        const titleEl = document.getElementById('inlineModalTitle');
        const body = document.getElementById('inlineModalBody');
        const closeBtn = document.getElementById('inlineModalClose');

        titleEl.textContent = 'Editar Curso';
        body.innerHTML = `
            <label class="form-label" for="editCourseTitleInput">Nome do curso</label>
            <input id="editCourseTitleInput" type="text" class="form-input" value="${currentTitle}" autocomplete="off">
            <button id="confirmEditCourse" class="btn btn-primary modal-action">Salvar</button>
        `;
        overlay.style.display = 'flex';

        const closeModal = () => { overlay.style.display = 'none'; };
        closeBtn.onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

        document.getElementById('confirmEditCourse').addEventListener('click', () => {
            const newTitle = document.getElementById('editCourseTitleInput').value.trim();
            if (!newTitle) return;
            Store.updateCourseTitle(courseId, newTitle);
            closeModal();
            this.renderCourseGrid();
        });

        setTimeout(() => {
            const input = document.getElementById('editCourseTitleInput');
            input.focus();
            input.select();
        }, 50);
    },

    async _handleDeleteCourse(courseId, title) {
        const ok = await Dialog.confirm({
            title: 'Excluir curso',
            message: `Excluir o curso "${title}" e todo o progresso?`,
            confirmLabel: 'Excluir',
            danger: true,
        });
        if (!ok) return;
        Store.deleteCourse(courseId);
        this.renderCourseGrid();
    },

    _handleExportCourse(courseId) {
        const json = Store.exportCourse(courseId);
        if (!json) return;

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            Dialog.alert({ message: 'JSON do curso copiado para a área de transferência!', type: 'success' });
        }).catch(() => {
            // Fallback: open in new window
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(`<pre>${json}</pre>`);
            }
        });
    },

    _handleExportAll() {
        const data = Store.exportAll();
        if (!data.courses.length) {
            Dialog.alert({ message: 'Nenhum curso para exportar.', type: 'warning' });
            return;
        }
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rota-do-estudo-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    _handleImportAll() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.courses || !Array.isArray(data.courses)) {
                        throw new Error('Arquivo invalido: esperado um backup com "courses".');
                    }
                    const count = Store.importAll(data);
                    Dialog.alert({ message: `${count} curso(s) importado(s) com sucesso!`, type: 'success' });
                    this.renderCourseGrid();
                } catch (err) {
                    Dialog.alert({ message: `Erro ao importar: ${err.message}`, type: 'error' });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
};
