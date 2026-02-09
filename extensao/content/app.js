// ============ CONTENT SCRIPT - App (Rota do Estudo) ============
// Injetado na pagina do app para ler/escrever no localStorage
// Replica logica do Store.js para manter compatibilidade 100%

(function () {
  'use strict';

  // Evitar registro duplicado se o script for reinjetado
  if (window.__rotaDoEstudoAppScript) return;
  window.__rotaDoEstudoAppScript = true;

  const KEYS = {
    INDEX: 'courses_index',
    courseKey: (id) => `course_${id}`
  };

  // ============ UTILIDADES (replicadas do Store.js) ============

  function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function parseVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : '';
  }

  function getThumbnailUrl(videoId) {
    if (!videoId) return '';
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  }

  // ============ LEITURA ============

  function getCoursesIndex() {
    try {
      const data = localStorage.getItem(KEYS.INDEX);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function getCourse(courseId) {
    try {
      const data = localStorage.getItem(KEYS.courseKey(courseId));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function saveCoursesIndex(index) {
    localStorage.setItem(KEYS.INDEX, JSON.stringify(index));
  }

  // ============ PROGRESSO ============

  function calcProgress(course) {
    if (!course) return { completed: 0, total: 0, percentage: 0 };
    let total = 0, completed = 0;
    course.modules.forEach(m => {
      m.lessons.forEach(l => {
        total++;
        if (l.completed) completed++;
      });
    });
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }

  function getCourseThumbnail(course) {
    if (!course || !course.modules.length) return '';
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (les.videoId) return getThumbnailUrl(les.videoId);
      }
    }
    return '';
  }

  // ============ ESCRITA ============

  function saveCourse(course) {
    localStorage.setItem(KEYS.courseKey(course.id), JSON.stringify(course));
    // Sync index
    const progress = calcProgress(course);
    const thumbnail = getCourseThumbnail(course);
    const index = getCoursesIndex();
    const i = index.findIndex(c => c.id === course.id);
    if (i !== -1) {
      Object.assign(index[i], {
        title: course.title,
        thumbnail,
        totalLessons: progress.total,
        completedLessons: progress.completed,
        lastAccessed: new Date().toISOString()
      });
      saveCoursesIndex(index);
    }
  }

  function createCourse(data) {
    const id = generateId('course');
    const modules = (data.modules || []).map((mod, mi) => ({
      id: generateId('mod'),
      title: mod.title || `Modulo ${mi + 1}`,
      description: mod.description || '',
      lessons: (mod.lessons || []).map((les, li) => {
        const videoId = les.videoId || parseVideoId(les.url || '');
        return {
          id: generateId('les'),
          number: les.number || li + 1,
          title: les.title || `Aula ${li + 1}`,
          url: les.url || '',
          videoId: videoId || '',
          completed: false
        };
      })
    }));

    const course = { id, title: data.title, modules };
    localStorage.setItem(KEYS.courseKey(id), JSON.stringify(course));

    const progress = calcProgress(course);
    const thumbnail = getCourseThumbnail(course);
    const index = getCoursesIndex();
    index.push({
      id,
      title: data.title,
      thumbnail,
      totalLessons: progress.total,
      completedLessons: progress.completed,
      lastAccessed: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    saveCoursesIndex(index);

    // Notifica o app para atualizar a UI
    window.dispatchEvent(new CustomEvent('course-data-updated', {
      detail: { action: 'createCourse', courseId: id }
    }));

    return { success: true, courseId: id, title: data.title, totalLessons: progress.total };
  }

  function addLesson(data) {
    const course = getCourse(data.courseId);
    if (!course) return { success: false, error: 'Curso nao encontrado' };

    const mod = course.modules.find(m => m.id === data.moduleId);
    if (!mod) return { success: false, error: 'Modulo nao encontrado' };

    const videoId = data.videoId || parseVideoId(data.url || '');
    const number = mod.lessons.length + 1;
    const lesson = {
      id: generateId('les'),
      number,
      title: data.title || `Aula ${number}`,
      url: data.url || '',
      videoId: videoId || '',
      completed: false
    };
    mod.lessons.push(lesson);
    saveCourse(course);

    window.dispatchEvent(new CustomEvent('course-data-updated', {
      detail: { action: 'addLesson', courseId: data.courseId }
    }));

    return { success: true, lessonId: lesson.id };
  }

  function importModule(data) {
    const course = getCourse(data.courseId);
    if (!course) return { success: false, error: 'Curso nao encontrado' };

    const mod = {
      id: generateId('mod'),
      title: data.module.title || 'Modulo Importado',
      description: data.module.description || '',
      lessons: (data.module.lessons || []).map((les, i) => {
        const videoId = les.videoId || parseVideoId(les.url || '');
        return {
          id: generateId('les'),
          number: les.number || i + 1,
          title: les.title || `Aula ${i + 1}`,
          url: les.url || '',
          videoId: videoId || '',
          completed: false
        };
      })
    };

    course.modules.push(mod);
    saveCourse(course);

    window.dispatchEvent(new CustomEvent('course-data-updated', {
      detail: { action: 'importModule', courseId: data.courseId }
    }));

    return { success: true, moduleId: mod.id };
  }

  // ============ LISTENER DE MENSAGENS ============

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_COURSES') {
      const index = getCoursesIndex();
      sendResponse({ courses: index });
    }

    if (msg.type === 'GET_COURSE') {
      const course = getCourse(msg.courseId);
      sendResponse({ course });
    }

    if (msg.type === 'CREATE_COURSE') {
      const result = createCourse(msg.data);
      sendResponse(result);
    }

    if (msg.type === 'ADD_LESSON') {
      const result = addLesson(msg.data);
      sendResponse(result);
    }

    if (msg.type === 'IMPORT_MODULE') {
      const result = importModule(msg.data);
      sendResponse(result);
    }

    if (msg.type === 'PING') {
      sendResponse({ status: 'ok' });
    }
  });
})();
