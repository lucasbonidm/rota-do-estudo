// ============ COURSE EDITOR VIEW ============

const CourseEditorView = {
    viewId: 'course-editor-view',

    state: {
        courseId: null,
        courseData: null,
        expandedModules: new Set()
    },

    _moduleSortable: null,
    _lessonSortables: [],

    // ============ LIFECYCLE ============
    enter(params) {
        this.state.courseId = params.courseId;
        this.state.courseData = Store.getCourse(params.courseId);

        if (!this.state.courseData) {
            Router.navigate('#/home');
            return;
        }

        // Start with all modules collapsed
        this.state.expandedModules = new Set();

        document.title = `Editar: ${this.state.courseData.title} - Rota do Estudo`;

        this._render();
    },

    leave() {
        if (this._moduleSortable) {
            this._moduleSortable.destroy();
            this._moduleSortable = null;
        }
        this._lessonSortables.forEach(s => s.destroy());
        this._lessonSortables = [];

        this.state.courseId = null;
        this.state.courseData = null;
        this.state.expandedModules = new Set();
    },

    // ============ RENDERING ============
    _render() {
        const container = document.getElementById('course-editor-view');
        const course = this.state.courseData;
        const progress = Store.getCourseProgress(this.state.courseId);
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

        container.innerHTML = `
            <div class="editor-layout">
                <div class="editor-container">

                    <!-- Header -->
                    <div class="editor-header">
                        <button class="btn btn-icon btn-ghost"" id="editorBack" title="Voltar para cursos" aria-label="Voltar para lista de cursos">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                        </button>
                        <h1 class="editor-heading">Editar Curso</h1>
                    </div>

                    <!-- Course Name -->
                    <div class="editor-section">
                        <label class="form-label" for="editorCourseName">Nome do Curso</label>
                        <input type="text" id="editorCourseName" class="form-input editor-course-name" value="${course.title}" autocomplete="off">
                    </div>

                    <!-- Progress -->
                    <div class="editor-section">
                        <div class="editor-section-title">Progresso</div>
                        <div class="editor-progress-card">
                            <div class="editor-progress-header">
                                <span>Completadas ${progress.completed} de ${progress.total} aulas</span>
                                <span class="editor-progress-pct">${progress.percentage}%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="editor-section">
                        <div class="editor-section-header">
                            <div>
                                <div class="editor-section-title">Conteúdo</div>
                                <div class="editor-section-meta" id="editorContentMeta">${course.modules.length} módulos • ${totalLessons} aulas</div>
                            </div>
                            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                                <button id="editorCollapseAll" class="btn btn-ghost btn-sm">Expandir tudo</button>
                                <button id="editorAddModule" class="btn btn-outline btn-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    Adicionar módulo
                                </button>
                            </div>
                        </div>

                        <div id="editorModuleList" class="editor-module-list">
                            <!-- modules rendered here -->
                        </div>
                    </div>

                </div>
            </div>
        `;

        this._refreshModuleList();
        this._setupStaticListeners();
    },

    _renderModulesHTML() {
        return this.state.courseData.modules.map(mod => {
            const isExpanded = this.state.expandedModules.has(mod.id);
            const progress = Store.getModuleProgress(this.state.courseData, mod.id);

            const lessonsHTML = mod.lessons.map((lesson, idx) => `
                <div class="editor-lesson-item" data-lesson-id="${lesson.id}" data-module-id="${mod.id}">
                    <span class="drag-handle editor-drag-handle" title="Arrastar para reordenar">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/></svg>
                    </span>
                    <span class="editor-lesson-number">${idx + 1}</span>
                    <span class="editor-lesson-title">${lesson.title}</span>
                    <div class="lesson-actions">
                        <button class="btn btn-outline btn-sm btn-icon" data-action="edit-lesson" data-module-id="${mod.id}" data-lesson-id="${lesson.id}" title="Editar aula">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-icon btn-outline-destructive" data-action="delete-lesson" data-module-id="${mod.id}" data-lesson-id="${lesson.id}" title="Excluir aula">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');

            return `
                <div class="editor-module" data-module-id="${mod.id}">
                    <div class="editor-module-header" data-module-id="${mod.id}">
                        <span class="drag-handle editor-drag-handle editor-module-drag" title="Arrastar para reordenar">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/></svg>
                        </span>
                        <span class="editor-module-chevron" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${isExpanded ? '0deg' : '-90deg'}); transition: transform 0.15s;">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </span>
                        <div class="editor-module-info">
                            <span class="editor-module-title">${mod.title}</span>
                            <span class="editor-module-meta">${mod.lessons.length} aulas${progress.total > 0 ? ' • ' + progress.completed + '/' + progress.total + ' concluídas' : ''}</span>
                        </div>
                        <div class="editor-module-actions">
                            <button class="btn btn-outline btn-sm" data-action="add-lesson" data-module-id="${mod.id}" title="Adicionar aula">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                Adicionar aula
                            </button>
                            <button class="btn btn-outline btn-sm btn-icon" data-action="edit-module" data-module-id="${mod.id}" title="Editar módulo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                            <button class="btn btn-outline btn-sm btn-icon btn-outline-destructive" data-action="delete-module" data-module-id="${mod.id}" title="Excluir módulo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="editor-lesson-list${isExpanded ? '' : ' hidden'}" data-module-id="${mod.id}">
                        <div class="editor-lessons-sortable" data-module-id="${mod.id}">
                            ${lessonsHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    _refreshModuleList() {
        const list = document.getElementById('editorModuleList');
        if (!list) return;
        list.innerHTML = this._renderModulesHTML();
        this._setupSortables();
        this._updateContentMeta();
    },

    _updateContentMeta() {
        const meta = document.getElementById('editorContentMeta');
        if (!meta) return;
        const course = this.state.courseData;
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        meta.textContent = `${course.modules.length} módulos • ${totalLessons} aulas`;
    },

    // ============ EVENT LISTENERS ============
    _setupStaticListeners() {
        document.getElementById('editorBack').addEventListener('click', () => Router.navigate('#/home'));

        const nameInput = document.getElementById('editorCourseName');
        nameInput.addEventListener('blur', () => {
            const newTitle = nameInput.value.trim();
            if (newTitle && newTitle !== this.state.courseData.title) {
                Store.updateCourseTitle(this.state.courseId, newTitle);
                this.state.courseData = Store.getCourse(this.state.courseId);
                document.title = `Editar: ${newTitle} - Rota do Estudo`;
            }
        });
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') nameInput.blur();
        });

        document.getElementById('editorCollapseAll').addEventListener('click', () => {
            const allCollapsed = this.state.expandedModules.size === 0;
            if (allCollapsed) {
                this.state.expandedModules = new Set(this.state.courseData.modules.map(m => m.id));
            } else {
                this.state.expandedModules.clear();
            }
            this._refreshModuleList();
            const btn = document.getElementById('editorCollapseAll');
            if (btn) btn.textContent = allCollapsed ? 'Recolher tudo' : 'Expandir tudo';
        });

        document.getElementById('editorAddModule').addEventListener('click', () => this.handleAddModule());

        // Module list event delegation (set up ONCE to avoid duplicate listeners)
        const list = document.getElementById('editorModuleList');
        if (list) {
            list.addEventListener('click', (e) => {
                // Toggle module expand/collapse (click on header area, not on action buttons or drag handle)
                const moduleHeader = e.target.closest('.editor-module-header');
                if (moduleHeader && !e.target.closest('[data-action]') && !e.target.closest('.editor-drag-handle')) {
                    const moduleId = moduleHeader.dataset.moduleId;
                    if (this.state.expandedModules.has(moduleId)) {
                        this.state.expandedModules.delete(moduleId);
                    } else {
                        this.state.expandedModules.add(moduleId);
                    }
                    this._refreshModuleList();
                    return;
                }

                // Action buttons
                const actionBtn = e.target.closest('[data-action]');
                if (!actionBtn) return;
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const moduleId = actionBtn.dataset.moduleId;
                const lessonId = actionBtn.dataset.lessonId;

                if (action === 'edit-module') this.handleEditModule(moduleId);
                if (action === 'delete-module') this.handleDeleteModule(moduleId);
                if (action === 'add-lesson') this.handleAddLesson(moduleId);
                if (action === 'edit-lesson') this.handleEditLesson(moduleId, lessonId);
                if (action === 'delete-lesson') this.handleDeleteLesson(moduleId, lessonId);
            });
        }
    },

    _setupSortables() {
        if (!window.Sortable) return;

        // Destroy previous
        if (this._moduleSortable) {
            this._moduleSortable.destroy();
            this._moduleSortable = null;
        }
        this._lessonSortables.forEach(s => s.destroy());
        this._lessonSortables = [];

        const moduleList = document.getElementById('editorModuleList');
        if (moduleList) {
            this._moduleSortable = new Sortable(moduleList, {
                animation: 150,
                handle: '.editor-module-drag',
                draggable: '.editor-module',
                onEnd: () => {
                    const orderedIds = [...moduleList.querySelectorAll(':scope > .editor-module')]
                        .map(el => el.dataset.moduleId);
                    Store.reorderModules(this.state.courseId, orderedIds);
                    this.state.courseData = Store.getCourse(this.state.courseId);
                    this._updateContentMeta();
                }
            });
        }

        document.querySelectorAll('.editor-lessons-sortable').forEach(container => {
            const moduleId = container.dataset.moduleId;
            const sortable = new Sortable(container, {
                animation: 150,
                handle: '.editor-drag-handle',
                draggable: '.editor-lesson-item',
                onEnd: () => {
                    const orderedIds = [...container.querySelectorAll('.editor-lesson-item')]
                        .map(el => el.dataset.lessonId);
                    Store.reorderLessons(this.state.courseId, moduleId, orderedIds);
                    this.state.courseData = Store.getCourse(this.state.courseId);
                }
            });
            this._lessonSortables.push(sortable);
        });
    },

    // ============ CRUD: MODULES ============
    handleAddModule() {
        this._openInlineModal('Adicionar Módulo', `
            <div class="inline-modal-tabs">
                <button class="modal-tab active" data-tab="manual">Manual</button>
                <button class="modal-tab" data-tab="import">Importar JSON</button>
                <button class="modal-tab" data-tab="extension">Usar Extensão</button>
            </div>
            <div id="inlineTabManual" class="tab-content active">
                <label class="form-label" for="newModuleTitle">Nome do módulo</label>
                <input id="newModuleTitle" type="text" class="form-input" placeholder="Ex: Módulo 6 - Avançado" autocomplete="off">
                <label class="form-label" for="newModuleDesc" style="margin-top:12px">Descrição (opcional)</label>
                <input id="newModuleDesc" type="text" class="form-input" placeholder="Descrição do módulo" autocomplete="off">
                <button id="confirmAddModule" class="btn btn-primary modal-action">Adicionar</button>
            </div>
            <div id="inlineTabExtension" class="tab-content">
                <div class="extension-promo">
                    <img src="docs/screenshots/Rota%20do%20Estudo.png" alt="Extensão Rota do Estudo" class="extension-screenshot">
                    <p class="extension-promo-desc">Com a extensão do Chrome, importe playlists do YouTube diretamente, sem precisar do Console DevTools.</p>
                    <a href="https://chromewebstore.google.com/detail/rota-do-estudo/begpmhbipnpefoagmeblnphcegoclbco" target="_blank" rel="noopener noreferrer" class="btn btn-primary extension-install-btn">Instalar Extensão no Chrome</a>
                </div>
            </div>
            <div id="inlineTabImport" class="tab-content">
                <div class="import-help">
                    <p class="import-help-title">Como obter o JSON da playlist:</p>
                    <ol class="import-steps">
                        <li>Abra a <strong>playlist</strong> no YouTube</li>
                        <li>Role até o final para carregar todos os vídeos</li>
                        <li>Pressione <kbd>F12</kbd> para abrir o DevTools</li>
                        <li>Vá na aba <strong>Console</strong></li>
                        <li>Cole o código abaixo e pressione <kbd>Enter</kbd></li>
                        <li>Copie o JSON gerado e cole no campo abaixo</li>
                    </ol>
                    <div class="code-template">
                        <div class="code-template-header">
                            <span>Código para o Console</span>
                            <button type="button" id="copyModuleScript" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                <span>Copiar</span>
                            </button>
                        </div>
                        <pre class="code-template-code scrollable" id="moduleScriptCode"></pre>
                    </div>
                </div>
                <label class="form-label" for="importModuleJson" style="margin-top:16px">Cole o JSON gerado aqui</label>
                <textarea id="importModuleJson" class="form-textarea" rows="6" placeholder='{"title": "...", "lessons": [...]}'></textarea>
                <div id="importModuleError" class="form-error" style="display: none;"></div>
                <button id="confirmImportModule" class="btn btn-primary modal-action">Importar Módulo</button>
            </div>
        `, () => {
            // Tab switching
            setupTabs(document.querySelectorAll('#inlineModalBody .modal-tab'), {
                manual: 'inlineTabManual',
                import: 'inlineTabImport',
                extension: 'inlineTabExtension'
            });

            // Manual add
            document.getElementById('confirmAddModule').addEventListener('click', () => {
                const title = document.getElementById('newModuleTitle').value.trim();
                if (!title) return;
                const desc = document.getElementById('newModuleDesc').value.trim();
                Store.addModule(this.state.courseId, title, desc);
                this.state.courseData = Store.getCourse(this.state.courseId);
                // Expand the new module
                const newMod = this.state.courseData.modules[this.state.courseData.modules.length - 1];
                if (newMod) this.state.expandedModules.add(newMod.id);
                this._refreshModuleList();
                this._closeInlineModal();
            });

            // Populate module script code
            const codeEl = document.getElementById('moduleScriptCode');
            if (codeEl) codeEl.textContent = MODULE_IMPORT_SCRIPT;

            // Copy script button
            const copyBtn = document.getElementById('copyModuleScript');
            if (copyBtn) {
                copyBtn.onclick = () => copyWithFeedback(copyBtn, MODULE_IMPORT_SCRIPT);
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
                    const newMod = this.state.courseData.modules[this.state.courseData.modules.length - 1];
                    if (newMod) this.state.expandedModules.add(newMod.id);
                    this._refreshModuleList();
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

        this._openInlineModal('Editar Módulo', `
            <label class="form-label" for="editModuleTitle">Nome do módulo</label>
            <input id="editModuleTitle" type="text" class="form-input" value="${mod.title}" autocomplete="off">
            <label class="form-label" for="editModuleDesc" style="margin-top:12px">Descrição</label>
            <input id="editModuleDesc" type="text" class="form-input" value="${mod.description || ''}" autocomplete="off">
            <button id="confirmEditModule" class="btn btn-primary modal-action">Salvar</button>
        `, () => {
            document.getElementById('confirmEditModule').addEventListener('click', () => {
                const title = document.getElementById('editModuleTitle').value.trim();
                if (!title) return;
                const desc = document.getElementById('editModuleDesc').value.trim();
                Store.updateModule(this.state.courseId, moduleId, { title, description: desc });
                this.state.courseData = Store.getCourse(this.state.courseId);
                this._refreshModuleList();
                this._closeInlineModal();
            });
        });
    },

    async handleDeleteModule(moduleId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const ok = await Dialog.confirm({
            title: 'Excluir módulo',
            message: `Excluir "${mod.title}" e todas as suas aulas?`,
            confirmLabel: 'Excluir',
            danger: true,
        });
        if (!ok) return;

        Store.deleteModule(this.state.courseId, moduleId);
        this.state.courseData = Store.getCourse(this.state.courseId);
        this.state.expandedModules.delete(moduleId);
        this._refreshModuleList();
    },

    // ============ CRUD: LESSONS ============
    handleAddLesson(moduleId) {
        this._openInlineModal('Adicionar Aula', `
            <div class="inline-modal-tabs">
                <button class="modal-tab active" data-tab="manual">Manual</button>
                <button class="modal-tab" data-tab="extension">Usar Extensão</button>
            </div>
            <div id="inlineLessonTabManual" class="tab-content active">
                <label class="form-label" for="newLessonTitle">Título da aula</label>
                <input id="newLessonTitle" type="text" class="form-input" placeholder="Ex: Introdução ao Flexbox" autocomplete="off">
                <label class="form-label" for="newLessonUrl" style="margin-top:12px">URL do YouTube</label>
                <input id="newLessonUrl" type="url" class="form-input" placeholder="https://www.youtube.com/watch?v=..." autocomplete="off">
                <button id="confirmAddLesson" class="btn btn-primary modal-action">Adicionar</button>
            </div>
            <div id="inlineLessonTabExtension" class="tab-content">
                <div class="extension-promo">
                    <img src="docs/screenshots/Rota%20do%20Estudo.png" alt="Extensão Rota do Estudo" class="extension-screenshot">
                    <p class="extension-promo-desc">Com a extensão do Chrome, importe playlists do YouTube diretamente, sem precisar do Console DevTools.</p>
                    <a href="https://chromewebstore.google.com/detail/rota-do-estudo/begpmhbipnpefoagmeblnphcegoclbco" target="_blank" rel="noopener noreferrer" class="btn btn-primary extension-install-btn">Instalar Extensão no Chrome</a>
                </div>
            </div>
        `, () => {
            // Tab switching
            setupTabs(document.querySelectorAll('#inlineModalBody .modal-tab'), {
                manual: 'inlineLessonTabManual',
                extension: 'inlineLessonTabExtension'
            });

            document.getElementById('confirmAddLesson').addEventListener('click', () => {
                const title = document.getElementById('newLessonTitle').value.trim();
                if (!title) return;
                const url = document.getElementById('newLessonUrl').value.trim();
                Store.addLesson(this.state.courseId, moduleId, title, url);
                this.state.courseData = Store.getCourse(this.state.courseId);
                this.state.expandedModules.add(moduleId);
                this._refreshModuleList();
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
            <label class="form-label" for="editLessonTitle">Título</label>
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
                    this.state.expandedModules.add(newModuleId);
                }
                this.state.courseData = Store.getCourse(this.state.courseId);
                this._refreshModuleList();
                this._closeInlineModal();
            });
        });
    },

    async handleDeleteLesson(moduleId, lessonId) {
        const mod = this.state.courseData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        const ok = await Dialog.confirm({
            title: 'Excluir aula',
            message: `Excluir aula "${lesson.title}"?`,
            confirmLabel: 'Excluir',
            danger: true,
        });
        if (!ok) return;

        Store.deleteLesson(this.state.courseId, moduleId, lessonId);
        this.state.courseData = Store.getCourse(this.state.courseId);
        this._refreshModuleList();
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

        modalEl.classList.toggle('modal-small', !(options && options.wide));

        closeBtn.onclick = () => this._closeInlineModal();
        overlay.onclick = (e) => {
            if (e.target === overlay) this._closeInlineModal();
        };

        if (onMount) onMount();

        const firstInput = body.querySelector('input, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 50);
    },

    _closeInlineModal() {
        const overlay = document.getElementById('inlineModalOverlay');
        overlay.style.display = 'none';
        overlay.querySelector('.modal').classList.add('modal-small');
    }
};
