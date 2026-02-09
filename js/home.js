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
    },

    leave() {
        // No cleanup needed
    },

    // ============ RENDERING ============
    renderCourseGrid() {
        const grid = document.getElementById('courseGrid');
        const emptyState = document.getElementById('emptyState');
        const courses = Store.getCoursesIndex();

        // Sort by lastAccessed descending
        courses.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

        if (courses.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
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

    _handleDeleteCourse(courseId, title) {
        if (!confirm(`Excluir o curso "${title}" e todo o progresso?`)) return;
        Store.deleteCourse(courseId);
        this.renderCourseGrid();
    },

    _handleExportCourse(courseId) {
        const json = Store.exportCourse(courseId);
        if (!json) return;

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            alert('JSON do curso copiado para a area de transferencia!');
        }).catch(() => {
            // Fallback: open in new window
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(`<pre>${json}</pre>`);
            }
        });
    }
};
