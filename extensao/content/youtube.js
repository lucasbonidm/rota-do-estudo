// ============ CONTENT SCRIPT - YouTube ============
// Injetado em paginas do YouTube para extrair dados de videos e playlists

(function () {
  'use strict';

  // Listener unico para todas as mensagens
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'DETECT_PAGE') {
      detectPage().then(sendResponse);
      return true;
    }

    if (msg.type === 'EXTRACT_VIDEO') {
      sendResponse(extractVideoData());
      return false;
    }

    if (msg.type === 'EXTRACT_PLAYLIST') {
      extractPlaylistData().then(sendResponse);
      return true;
    }

    if (msg.type === 'SPLIT_MODULES') {
      const result = splitIntoModules(msg.lessons, msg.playlistTitle);
      sendResponse(result);
      return false;
    }

    // Mensagem nao reconhecida - nao responder
    return false;
  });

  // ============ DETECCAO DE PAGINA ============

  async function detectPage() {
    const url = window.location.href;

    // Playlist page
    if (url.includes('list=') && (url.includes('/playlist') || url.includes('/watch'))) {
      const data = await extractPlaylistData();
      return {
        context: 'playlist',
        title: data.title,
        totalVideos: data.totalVideos,
        lessons: data.lessons
      };
    }

    // Video page
    if (url.includes('/watch') && url.includes('v=')) {
      const data = extractVideoData();
      return {
        context: 'video',
        title: data.title,
        url: data.url,
        videoId: data.videoId
      };
    }

    // Outra pagina do YouTube
    return { context: 'none' };
  }

  // ============ EXTRACAO DE VIDEO ============

  function extractVideoData() {
    const url = window.location.href;
    const videoIdMatch = url.match(/[?&]v=([\w-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';

    const title = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string'
    )?.innerText.trim() || document.title.replace(' - YouTube', '').trim();

    const cleanUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : url.split('&')[0];

    return {
      type: 'video',
      title,
      url: cleanUrl,
      videoId
    };
  }

  // ============ EXTRACAO DE PLAYLIST ============

  async function extractPlaylistData() {
    const playlistTitle = document.querySelector(
      'yt-formatted-string.ytd-playlist-header-renderer'
    )?.innerText.trim()
      || document.querySelector(
        'ytd-playlist-panel-renderer yt-formatted-string.title'
      )?.innerText.trim()
      || document.querySelector(
        '#header-description h3 yt-formatted-string'
      )?.innerText.trim()
      || 'Playlist';

    const lessons = extractVisibleVideos();

    return {
      type: 'playlist',
      title: playlistTitle,
      totalVideos: lessons.length,
      lessons
    };
  }

  function extractVisibleVideos() {
    const videoElements = document.querySelectorAll(
      'ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer'
    );

    const lessons = [];
    videoElements.forEach(el => {
      const title = el.querySelector('#video-title')?.innerText.trim();
      if (!title) return;

      const href = el.querySelector('a#thumbnail, a#wc-endpoint, a#video-title')?.getAttribute('href');
      const videoIdMatch = href?.match(/[?&]v=([\w-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

      lessons.push({ title, url, videoId });
    });

    return lessons;
  }

  // ============ DETECCAO DE MODULOS ============

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
})();
