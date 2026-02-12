// ============ POPUP - Logica Principal ============

(function () {
  'use strict';

  // ============ STATE ============

  const APP_URL = 'https://rota-do-estudo.vercel.app';

  let state = {
    context: 'loading', // loading | none | video | playlist | feedback
    videoData: null,
    playlistData: null,
    lastCreatedCourseId: null,
    isYouTubePage: false // Se está realmente em uma página do YouTube
  };

  // ============ DOM REFS ============

  const views = {
    loading: document.getElementById('view-loading'),
    none: document.getElementById('view-none'),
    video: document.getElementById('view-video'),
    playlist: document.getElementById('view-playlist'),
    feedback: document.getElementById('view-feedback')
  };

  // ============ INIT ============

  async function init() {
    bindEvents();

    try {
      await detectPage();
    } catch (err) {
      console.error('[POPUP] Erro ao inicializar:', err);
      showView('none');
    }
  }

  // ============ DETECCAO ============

  async function detectPage() {
    showLoading('Detectando pagina...');
    state.isYouTubePage = false;

    try {
      const tab = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab[0]?.url || '';
      state.isYouTubePage = currentUrl.includes('youtube.com');

      const result = await sendMessage({ type: 'DETECT_YOUTUBE' });

      if (!result || result.context === 'none') {
        showNoneView();
        return;
      }

      if (result.context === 'video') {
        state.videoData = result;
        document.getElementById('video-title').textContent = result.title || 'Vídeo sem título';
        showView('video');
        return;
      }

      if (result.context === 'playlist') {
        state.playlistData = result;
        document.getElementById('playlist-title').textContent = result.title || 'Playlist sem título';
        const count = result.totalVideos || 0;
        document.getElementById('playlist-count').textContent =
          `${count} video${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        showView('playlist');
        return;
      }

      showNoneView();
    } catch (err) {
      console.error('[POPUP] Erro ao detectar página:', err);
      showNoneView();
    }
  }

  // Mostrar view "none" com mensagens apropriadas
  function showNoneView() {
    const msgDefault = document.getElementById('msg-none-default');
    const msgYoutube = document.getElementById('msg-none-youtube');
    const btnRetry = document.getElementById('btn-retry-detect');
    const btnReload = document.getElementById('btn-reload-page');

    if (state.isYouTubePage) {
      // Está no YouTube mas não detectou nada
      msgDefault.classList.add('hidden');
      msgYoutube.classList.remove('hidden');
      btnRetry.classList.remove('hidden');
      btnReload.classList.remove('hidden');
    } else {
      // Fora do YouTube
      msgDefault.classList.remove('hidden');
      msgYoutube.classList.add('hidden');
      btnRetry.classList.add('hidden');
      btnReload.classList.add('hidden');
    }

    showView('none');
  }

  // Recarregar página e re-detectar
  async function reloadAndDetect() {
    showLoading('Recarregando pagina...');

    try {
      await sendMessage({ type: 'RELOAD_TAB' });
      await detectPage();
    } catch (err) {
      console.error('[POPUP] Erro ao recarregar:', err);
      showNoneView();
    }
  }

  // ============ ACOES ============

  // -- Criar curso a partir de video --
  async function createCourseFromVideo(courseName) {
    const data = state.videoData;
    if (!data) return;

    showLoading('Criando curso...');

    const result = await sendMessage({
      type: 'CREATE_COURSE',
      data: {
        title: courseName,
        modules: [{
          title: 'Geral',
          description: '',
          lessons: [{
            title: data.title,
            url: data.url,
            videoId: data.videoId
          }]
        }]
      }
    });

    if (result?.success) {
      state.lastCreatedCourseId = result.courseId;
      showFeedback('success', 'Curso criado com sucesso!', `"${result.title}" - 1 aula`);
    } else {
      showFeedback('error', 'Erro ao criar curso', result?.error || 'Tente novamente');
    }
  }

  // -- Criar curso a partir de playlist --
  async function createCourseFromPlaylist(courseName, moduleMode) {
    const data = state.playlistData;
    if (!data || !data.lessons?.length) return;

    showLoading('Criando curso...');

    let modules;

    if (moduleMode === 'auto') {
      modules = splitIntoModules(data.lessons, courseName);
    } else {
      modules = [{
        title: courseName,
        description: '',
        lessons: data.lessons
      }];
    }

    const result = await sendMessage({
      type: 'CREATE_COURSE',
      data: {
        title: courseName,
        modules
      }
    });

    if (result?.success) {
      state.lastCreatedCourseId = result.courseId;
      showFeedback('success', 'Curso criado com sucesso!', `"${courseName}" - ${result.totalLessons} aulas`);
    } else {
      showFeedback('error', 'Erro ao criar curso', result?.error || 'Tente novamente');
    }
  }

  // ============ SPLIT MODULES (logica local) ============

  function splitIntoModules(lessons, playlistTitle) {
    const modules = [];
    let currentModule = null;

    lessons.forEach(lesson => {
      const isModuleHeader = /^m[oó]dulo\s*\d+/i.test(lesson.title);

      if (isModuleHeader) {
        currentModule = {
          title: lesson.title,
          description: '',
          lessons: []
        };
        modules.push(currentModule);
      } else {
        if (!currentModule) {
          currentModule = {
            title: playlistTitle,
            description: '',
            lessons: []
          };
          modules.push(currentModule);
        }
        currentModule.lessons.push(lesson);
      }
    });

    return modules;
  }

  // ============ ADICIONAR MODULO A CURSO EXISTENTE ============

  async function fetchCourses() {
    const result = await sendMessage({ type: 'GET_COURSES' });
    return result?.courses || [];
  }

  function populateCourseSelect(selectEl, noCoursesMsgEl, courses) {
    selectEl.innerHTML = '';
    if (!courses.length) {
      selectEl.classList.add('hidden');
      noCoursesMsgEl.classList.remove('hidden');
      return false;
    }
    noCoursesMsgEl.classList.add('hidden');
    selectEl.classList.remove('hidden');
    courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      selectEl.appendChild(opt);
    });
    return true;
  }

  async function addModuleToCourse(courseId, moduleName, lessons) {
    showLoading('Adicionando modulo...');

    const result = await sendMessage({
      type: 'IMPORT_MODULE',
      data: {
        courseId,
        module: {
          title: moduleName,
          description: '',
          lessons
        }
      }
    });

    if (result?.success) {
      state.lastCreatedCourseId = courseId;
      showFeedback('success', 'Modulo adicionado!', `"${moduleName}" - ${lessons.length} aula${lessons.length !== 1 ? 's' : ''}`);
    } else {
      showFeedback('error', 'Erro ao adicionar modulo', result?.error || 'Tente novamente');
    }
  }

  // ============ ADICIONAR VIDEO A MODULO EXISTENTE ============

  async function fetchCourse(courseId) {
    const result = await sendMessage({ type: 'GET_COURSE', courseId });
    return result?.course || null;
  }

  function populateModuleSelect(selectEl, noModulesMsgEl, modules) {
    selectEl.innerHTML = '';
    if (!modules || !modules.length) {
      selectEl.classList.add('hidden');
      noModulesMsgEl.classList.remove('hidden');
      return false;
    }
    noModulesMsgEl.classList.add('hidden');
    selectEl.classList.remove('hidden');
    modules.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      selectEl.appendChild(opt);
    });
    return true;
  }

  async function addLessonToModule(courseId, moduleId) {
    const data = state.videoData;
    if (!data) return;

    showLoading('Adicionando video...');

    const result = await sendMessage({
      type: 'ADD_LESSON',
      data: {
        courseId,
        moduleId,
        title: data.title,
        url: data.url,
        videoId: data.videoId
      }
    });

    if (result?.success) {
      state.lastCreatedCourseId = courseId;
      showFeedback('success', 'Video adicionado!', `"${data.title}"`);
    } else {
      showFeedback('error', 'Erro ao adicionar video', result?.error || 'Tente novamente');
    }
  }

  async function addLessonsToModule(courseId, moduleId, lessons) {
    if (!lessons?.length) return;

    showLoading('Adicionando videos...');

    let added = 0;

    for (const lesson of lessons) {
      const result = await sendMessage({
        type: 'ADD_LESSON',
        data: {
          courseId,
          moduleId,
          title: lesson.title,
          url: lesson.url,
          videoId: lesson.videoId
        }
      });
      if (result?.success) {
        added++;
      }
    }

    if (added > 0) {
      state.lastCreatedCourseId = courseId;
      showFeedback('success', 'Videos adicionados!', `${added} aula${added !== 1 ? 's' : ''} adicionada${added !== 1 ? 's' : ''}`);
    } else {
      showFeedback('error', 'Erro ao adicionar videos', 'Tente novamente');
    }
  }

  // ============ FEEDBACK ============

  function showFeedback(type, title, detail) {
    const content = document.getElementById('feedback-content');
    const iconChar = type === 'success' ? '\u2713' : (type === 'error' ? '\u2717' : 'ℹ');

    content.className = `feedback-${type}`;

    let html = `
      <div class="feedback-icon">${iconChar}</div>
      <div class="feedback-title">${title}</div>
      <div class="feedback-detail">${detail}</div>
    `;

    // Se for sucesso, adicionar botão "Visualizar Curso"
    if (type === 'success' && state.lastCreatedCourseId) {
      html += `
        <div class="feedback-actions">
          <button id="btn-visualizar-curso" class="btn btn-primary btn-full">
            Visualizar Curso
          </button>
          <button id="btn-fechar-feedback" class="btn btn-secondary btn-full">
            Fechar
          </button>
        </div>
      `;
    }

    content.innerHTML = html;

    // Vincular eventos
    if (type === 'success' && state.lastCreatedCourseId) {
      setTimeout(() => {
        const btnVisualizar = document.getElementById('btn-visualizar-curso');
        const btnFechar = document.getElementById('btn-fechar-feedback');
        if (btnVisualizar) {
          btnVisualizar.addEventListener('click', () => openApp(state.lastCreatedCourseId));
        }
        if (btnFechar) {
          btnFechar.addEventListener('click', () => window.close());
        }
      }, 0);
    }

    showView('feedback');
  }

  // ============ VIEW MANAGEMENT ============

  function showView(name) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    if (views[name]) {
      views[name].classList.remove('hidden');
    }
    state.context = name;
  }

  function showLoading(text) {
    const el = document.getElementById('loading-text');
    if (el) el.textContent = text || 'Detectando pagina...';
    showView('loading');
  }

  // ============ EVENT BINDING ============

  function bindEvents() {
    // Retry de detecção
    document.getElementById('btn-retry-detect').addEventListener('click', () => {
      detectPage();
    });

    // Recarregar página e re-detectar
    document.getElementById('btn-reload-page').addEventListener('click', () => {
      reloadAndDetect();
    });

    // Abrir App (todos os botoes)
    document.getElementById('btn-open-app-none').addEventListener('click', () => openApp());
    document.getElementById('btn-open-app-video').addEventListener('click', () => openApp());
    document.getElementById('btn-open-app-playlist').addEventListener('click', () => openApp());

    // -- Video: criar curso --
    const createVideoForm = document.getElementById('create-video-form');
    document.getElementById('btn-create-video').addEventListener('click', () => {
      document.getElementById('input-course-name-video').value = state.videoData?.title || '';
      createVideoForm.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-create-video').addEventListener('click', () => {
      createVideoForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-create-video').addEventListener('click', () => {
      const name = document.getElementById('input-course-name-video').value.trim();
      if (name) createCourseFromVideo(name);
    });

    // -- Playlist: criar curso --
    const createPlaylistForm = document.getElementById('create-playlist-form');
    document.getElementById('btn-create-playlist').addEventListener('click', () => {
      document.getElementById('input-course-name-playlist').value = state.playlistData?.title || '';
      createPlaylistForm.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-create-playlist').addEventListener('click', () => {
      createPlaylistForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-create-playlist').addEventListener('click', () => {
      const name = document.getElementById('input-course-name-playlist').value.trim();
      const mode = document.querySelector('input[name="module-mode"]:checked').value;
      if (name) createCourseFromPlaylist(name, mode);
    });

    // -- Video: adicionar modulo --
    const addModuleVideoForm = document.getElementById('add-module-video-form');
    document.getElementById('btn-add-module-video').addEventListener('click', async () => {
      const courses = await fetchCourses();
      const hasCoursesV = populateCourseSelect(
        document.getElementById('select-course-video'),
        document.getElementById('no-courses-video'),
        courses
      );
      document.getElementById('input-module-name-video').value = state.videoData?.title || '';
      document.getElementById('btn-confirm-module-video').disabled = !hasCoursesV;
      addModuleVideoForm.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-module-video').addEventListener('click', () => {
      addModuleVideoForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-module-video').addEventListener('click', () => {
      const courseId = document.getElementById('select-course-video').value;
      const moduleName = document.getElementById('input-module-name-video').value.trim();
      if (!courseId || !moduleName) return;
      const data = state.videoData;
      if (!data) return;
      addModuleToCourse(courseId, moduleName, [{
        title: data.title,
        url: data.url,
        videoId: data.videoId
      }]);
    });

    // -- Video: adicionar aula a modulo existente --
    const addLessonVideoForm = document.getElementById('add-lesson-video-form');
    const selectLessonCourse = document.getElementById('select-lesson-course-video');
    const selectLessonModule = document.getElementById('select-lesson-module-video');

    document.getElementById('btn-add-lesson-video').addEventListener('click', async () => {
      const courses = await fetchCourses();
      const hasCourses = populateCourseSelect(
        selectLessonCourse,
        document.getElementById('no-courses-lesson-video'),
        courses
      );
      if (hasCourses) {
        const course = await fetchCourse(selectLessonCourse.value);
        populateModuleSelect(
          selectLessonModule,
          document.getElementById('no-modules-lesson-video'),
          course?.modules || []
        );
      } else {
        selectLessonModule.classList.add('hidden');
      }
      document.getElementById('btn-confirm-lesson-video').disabled = !hasCourses;
      addLessonVideoForm.classList.remove('hidden');
    });

    selectLessonCourse.addEventListener('change', async () => {
      const course = await fetchCourse(selectLessonCourse.value);
      const hasModules = populateModuleSelect(
        selectLessonModule,
        document.getElementById('no-modules-lesson-video'),
        course?.modules || []
      );
      document.getElementById('btn-confirm-lesson-video').disabled = !hasModules;
    });

    document.getElementById('btn-cancel-lesson-video').addEventListener('click', () => {
      addLessonVideoForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-lesson-video').addEventListener('click', () => {
      const courseId = selectLessonCourse.value;
      const moduleId = selectLessonModule.value;
      if (!courseId || !moduleId) return;
      addLessonToModule(courseId, moduleId);
    });

    // -- Playlist: adicionar modulo --
    const addModulePlaylistForm = document.getElementById('add-module-playlist-form');
    document.getElementById('btn-add-module-playlist').addEventListener('click', async () => {
      const courses = await fetchCourses();
      const hasCoursesP = populateCourseSelect(
        document.getElementById('select-course-playlist'),
        document.getElementById('no-courses-playlist'),
        courses
      );
      document.getElementById('input-module-name-playlist').value = state.playlistData?.title || '';
      document.getElementById('btn-confirm-module-playlist').disabled = !hasCoursesP;
      addModulePlaylistForm.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-module-playlist').addEventListener('click', () => {
      addModulePlaylistForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-module-playlist').addEventListener('click', () => {
      const courseId = document.getElementById('select-course-playlist').value;
      const moduleName = document.getElementById('input-module-name-playlist').value.trim();
      if (!courseId || !moduleName) return;
      const data = state.playlistData;
      if (!data || !data.lessons?.length) return;
      addModuleToCourse(courseId, moduleName, data.lessons);
    });

    // -- Playlist: adicionar aulas a modulo existente --
    const addLessonPlaylistForm = document.getElementById('add-lesson-playlist-form');
    const selectLessonCourseP = document.getElementById('select-lesson-course-playlist');
    const selectLessonModuleP = document.getElementById('select-lesson-module-playlist');

    document.getElementById('btn-add-lesson-playlist').addEventListener('click', async () => {
      const courses = await fetchCourses();
      const hasCourses = populateCourseSelect(
        selectLessonCourseP,
        document.getElementById('no-courses-lesson-playlist'),
        courses
      );
      if (hasCourses) {
        const course = await fetchCourse(selectLessonCourseP.value);
        populateModuleSelect(
          selectLessonModuleP,
          document.getElementById('no-modules-lesson-playlist'),
          course?.modules || []
        );
      } else {
        selectLessonModuleP.classList.add('hidden');
      }
      document.getElementById('btn-confirm-lesson-playlist').disabled = !hasCourses;
      addLessonPlaylistForm.classList.remove('hidden');
    });

    selectLessonCourseP.addEventListener('change', async () => {
      const course = await fetchCourse(selectLessonCourseP.value);
      const hasModules = populateModuleSelect(
        selectLessonModuleP,
        document.getElementById('no-modules-lesson-playlist'),
        course?.modules || []
      );
      document.getElementById('btn-confirm-lesson-playlist').disabled = !hasModules;
    });

    document.getElementById('btn-cancel-lesson-playlist').addEventListener('click', () => {
      addLessonPlaylistForm.classList.add('hidden');
    });

    document.getElementById('btn-confirm-lesson-playlist').addEventListener('click', () => {
      const courseId = selectLessonCourseP.value;
      const moduleId = selectLessonModuleP.value;
      if (!courseId || !moduleId) return;
      const data = state.playlistData;
      if (!data || !data.lessons?.length) return;
      addLessonsToModule(courseId, moduleId, data.lessons);
    });

    // Enter key nos inputs
    document.getElementById('input-course-name-video').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-create-video').click();
    });

    document.getElementById('input-course-name-playlist').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-create-playlist').click();
    });

    document.getElementById('input-module-name-video').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-module-video').click();
    });

    document.getElementById('input-module-name-playlist').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-module-playlist').click();
    });
  }

  // ============ HELPERS ============

  function sendMessage(msg) {
    return chrome.runtime.sendMessage(msg);
  }

  function openApp(courseId) {
    sendMessage({ type: 'OPEN_APP', courseId: courseId || null });
  }

  // ============ START ============
  init();
})();
