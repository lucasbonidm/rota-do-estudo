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

    // Tentar múltiplos seletores para encontrar o título (YouTube muda frequentemente)
    let title = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string'
    )?.innerText?.trim();

    if (!title) {
      title = document.querySelector('h1 yt-formatted-string')?.innerText?.trim();
    }

    if (!title) {
      title = document.querySelector('h1.title')?.innerText?.trim();
    }

    if (!title) {
      // Fallback: usar o title da página
      title = document.title.replace(' - YouTube', '').trim();
    }

    const cleanUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : url.split('&')[0];

    return {
      type: 'video',
      title: title || 'Vídeo',
      url: cleanUrl,
      videoId
    };
  }

  // ============ EXTRACAO DE PLAYLIST ============

  async function extractPlaylistData() {
    // Tentar múltiplos seletores para encontrar o título da playlist
    let playlistTitle = document.querySelector(
      'yt-formatted-string.ytd-playlist-header-renderer'
    )?.innerText?.trim();

    if (!playlistTitle) {
      playlistTitle = document.querySelector(
        'ytd-playlist-panel-renderer yt-formatted-string.title'
      )?.innerText?.trim();
    }

    if (!playlistTitle) {
      playlistTitle = document.querySelector(
        '#header-description h3 yt-formatted-string'
      )?.innerText?.trim();
    }

    if (!playlistTitle) {
      playlistTitle = document.querySelector('h1 yt-formatted-string')?.innerText?.trim();
    }

    if (!playlistTitle) {
      playlistTitle = document.querySelector('h1.title')?.innerText?.trim();
    }

    const lessons = extractVisibleVideos();

    return {
      type: 'playlist',
      title: playlistTitle || 'Playlist',
      totalVideos: lessons.length,
      lessons
    };
  }

  function extractVisibleVideos() {
    // Tentar múltiplos seletores para encontrar vídeos da playlist
    let videoElements = document.querySelectorAll(
      'ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer'
    );

    // Se não encontrou, tentar seletores alternativos
    if (videoElements.length === 0) {
      videoElements = document.querySelectorAll('[data-video-id]');
    }

    const lessons = [];
    const seenVideoIds = new Set();

    videoElements.forEach(el => {
      // Tentar encontrar o título
      let title = el.querySelector('#video-title')?.innerText?.trim();
      if (!title) {
        title = el.querySelector('a#video-title')?.getAttribute('title')?.trim();
      }
      if (!title) {
        title = el.querySelector('[role="link"]')?.innerText?.trim();
      }
      if (!title) return;

      // Tentar encontrar o link do vídeo
      let href = el.querySelector('a#thumbnail')?.getAttribute('href') ||
                 el.querySelector('a#wc-endpoint')?.getAttribute('href') ||
                 el.querySelector('a#video-title')?.getAttribute('href');

      // Fallback: tentar data-video-id
      let videoId = '';
      if (!href) {
        videoId = el.getAttribute('data-video-id') || '';
      } else {
        const videoIdMatch = href?.match(/[?&]v=([\w-]{11})/);
        videoId = videoIdMatch ? videoIdMatch[1] : '';
      }

      // Pular se já vimos este videoId (evita duplicatas)
      if (!videoId || seenVideoIds.has(videoId)) return;

      seenVideoIds.add(videoId);
      const url = `https://www.youtube.com/watch?v=${videoId}`;

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
