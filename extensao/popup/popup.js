// ============ POPUP - Logica Principal ============

(function () {
  'use strict';

  // ============ STATE ============

  let state = {
    context: 'loading', // loading | none | video | playlist | config | feedback
    videoData: null,
    playlistData: null,
    appUrl: '',
    lastCreatedCourseId: null
  };

  // ============ DOM REFS ============

  const views = {
    loading: document.getElementById('view-loading'),
    none: document.getElementById('view-none'),
    video: document.getElementById('view-video'),
    playlist: document.getElementById('view-playlist'),
    config: document.getElementById('view-config'),
    feedback: document.getElementById('view-feedback')
  };

  // ============ INIT ============

  async function init() {
    bindEvents();

    // Carregar URL do app
    const response = await sendMessage({ type: 'GET_APP_URL' });
    state.appUrl = response?.url || '';

    // Se nao tem URL configurada, mostrar config
    if (!state.appUrl) {
      showView('config');
      return;
    }

    // Detectar pagina do YouTube
    await detectPage();
  }

  // ============ DETECCAO ============

  async function detectPage() {
    showView('loading');

    try {
      const result = await sendMessage({ type: 'DETECT_YOUTUBE' });

      if (!result || result.context === 'none') {
        showView('none');
        return;
      }

      if (result.context === 'video') {
        state.videoData = result;
        document.getElementById('video-title').textContent = result.title;
        showView('video');
        return;
      }

      if (result.context === 'playlist') {
        state.playlistData = result;
        document.getElementById('playlist-title').textContent = result.title;
        document.getElementById('playlist-count').textContent =
          `${result.totalVideos} video${result.totalVideos !== 1 ? 's' : ''} encontrado${result.totalVideos !== 1 ? 's' : ''}`;
        showView('playlist');
        return;
      }

      showView('none');
    } catch {
      showView('none');
    }
  }

  // ============ ACOES ============

  // -- Criar curso a partir de video --
  async function createCourseFromVideo(courseName) {
    const data = state.videoData;
    if (!data) return;

    showView('loading');

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

    showView('loading');

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

  // ============ CONFIG ============

  async function saveAppUrl(url) {
    if (!url) return;

    // Remover barra final
    url = url.replace(/\/+$/, '');

    await sendMessage({ type: 'SET_APP_URL', url });
    state.appUrl = url;
    await detectPage();
  }

  // ============ FEEDBACK ============

  function showFeedback(type, title, detail) {
    const content = document.getElementById('feedback-content');
    const iconChar = type === 'success' ? '\u2713' : '\u2717';

    content.className = `feedback-${type}`;
    content.innerHTML = `
      <div class="feedback-icon">${iconChar}</div>
      <div class="feedback-title">${title}</div>
      <div class="feedback-detail">${detail}</div>
    `;

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

  // ============ EVENT BINDING ============

  function bindEvents() {
    // Config
    document.getElementById('btn-config').addEventListener('click', () => {
      document.getElementById('input-app-url').value = state.appUrl;
      showView('config');
    });

    document.getElementById('btn-save-url').addEventListener('click', () => {
      const url = document.getElementById('input-app-url').value.trim();
      saveAppUrl(url);
    });

    document.getElementById('btn-cancel-config').addEventListener('click', () => {
      if (state.appUrl) {
        detectPage();
      }
    });

    // Abrir App (todos os botoes)
    document.getElementById('btn-open-app-none').addEventListener('click', () => openApp());
    document.getElementById('btn-open-app-video').addEventListener('click', () => openApp());
    document.getElementById('btn-open-app-playlist').addEventListener('click', () => openApp());
    document.getElementById('btn-open-app-feedback').addEventListener('click', () => {
      openApp(state.lastCreatedCourseId);
    });
    document.getElementById('btn-close-feedback').addEventListener('click', () => window.close());

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

    // Enter key nos inputs
    document.getElementById('input-course-name-video').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-create-video').click();
    });

    document.getElementById('input-course-name-playlist').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-confirm-create-playlist').click();
    });

    document.getElementById('input-app-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-save-url').click();
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
