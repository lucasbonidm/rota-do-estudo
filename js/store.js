// ============ STORE - localStorage Data Layer ============

const Store = {
    KEYS: {
        INDEX: 'courses_index',
        PREFERENCES: 'app_preferences',
        courseKey: (id) => `course_${id}`,
        OLD_PROGRESS: 'courseProgress'
    },

    // ============ ID GENERATION ============
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    },

    // ============ COURSES INDEX ============
    getCoursesIndex() {
        try {
            const data = localStorage.getItem(this.KEYS.INDEX);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    saveCoursesIndex(index) {
        localStorage.setItem(this.KEYS.INDEX, JSON.stringify(index));
    },

    updateCourseInIndex(courseId, updates) {
        const index = this.getCoursesIndex();
        const i = index.findIndex(c => c.id === courseId);
        if (i !== -1) {
            Object.assign(index[i], updates);
            this.saveCoursesIndex(index);
        }
    },

    // ============ FULL COURSE DATA ============
    getCourse(courseId) {
        try {
            const data = localStorage.getItem(this.KEYS.courseKey(courseId));
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    saveCourse(course) {
        localStorage.setItem(this.KEYS.courseKey(course.id), JSON.stringify(course));
        // Sync index
        const progress = this.getCourseProgress(course.id);
        const thumbnail = this._getCourseThumbnail(course);
        this.updateCourseInIndex(course.id, {
            title: course.title,
            thumbnail,
            totalLessons: progress.total,
            completedLessons: progress.completed,
            lastAccessed: new Date().toISOString()
        });
    },

    createCourse(title) {
        const id = this.generateId('course');
        const course = { id, title, modules: [] };
        localStorage.setItem(this.KEYS.courseKey(id), JSON.stringify(course));

        const index = this.getCoursesIndex();
        index.push({
            id,
            title,
            thumbnail: '',
            totalLessons: 0,
            completedLessons: 0,
            lastAccessed: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });
        this.saveCoursesIndex(index);
        return id;
    },

    importCourse(data) {
        // Normalize: accept legacy format (courseTitle) or new format (title)
        const title = data.courseTitle || data.title || 'Curso Importado';
        const id = this.generateId('course');

        const modules = (data.modules || []).map((mod, mi) => ({
            id: mod.id ? `mod_${mod.id}` : this.generateId('mod'),
            title: mod.title || `Modulo ${mi + 1}`,
            description: mod.description || '',
            lessons: (mod.lessons || []).map((les, li) => {
                const videoId = les.videoId || this.parseVideoId(les.url || '');
                return {
                    id: les.id || this.generateId('les'),
                    number: les.number || li + 1,
                    title: les.title || `Aula ${li + 1}`,
                    url: les.url || '',
                    videoId: videoId || '',
                    completed: les.completed || false
                };
            })
        }));

        const course = { id, title, modules };
        localStorage.setItem(this.KEYS.courseKey(id), JSON.stringify(course));

        const progress = this._calcProgress(course);
        const thumbnail = this._getCourseThumbnail(course);
        const index = this.getCoursesIndex();
        index.push({
            id,
            title,
            thumbnail,
            totalLessons: progress.total,
            completedLessons: progress.completed,
            lastAccessed: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });
        this.saveCoursesIndex(index);
        return id;
    },

    deleteCourse(courseId) {
        localStorage.removeItem(this.KEYS.courseKey(courseId));
        const index = this.getCoursesIndex().filter(c => c.id !== courseId);
        this.saveCoursesIndex(index);
    },

    updateCourseTitle(courseId, newTitle) {
        const course = this.getCourse(courseId);
        if (!course) return;
        course.title = newTitle;
        this.saveCourse(course);
    },

    // ============ MODULES ============
    addModule(courseId, title, description) {
        const course = this.getCourse(courseId);
        if (!course) return null;
        const mod = {
            id: this.generateId('mod'),
            title: title || 'Novo Modulo',
            description: description || '',
            lessons: []
        };
        course.modules.push(mod);
        this.saveCourse(course);
        return mod.id;
    },

    updateModule(courseId, moduleId, updates) {
        const course = this.getCourse(courseId);
        if (!course) return;
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return;
        if (updates.title !== undefined) mod.title = updates.title;
        if (updates.description !== undefined) mod.description = updates.description;
        this.saveCourse(course);
    },

    importModule(courseId, data) {
        const course = this.getCourse(courseId);
        if (!course) return null;

        const mod = {
            id: this.generateId('mod'),
            title: data.title || 'Modulo Importado',
            description: data.description || '',
            lessons: (data.lessons || []).map((les, i) => {
                const videoId = les.videoId || this.parseVideoId(les.url || '');
                return {
                    id: les.id || this.generateId('les'),
                    number: les.number || i + 1,
                    title: les.title || `Aula ${i + 1}`,
                    url: les.url || '',
                    videoId: videoId || '',
                    completed: les.completed || false
                };
            })
        };

        course.modules.push(mod);
        this.saveCourse(course);
        return mod.id;
    },

    deleteModule(courseId, moduleId) {
        const course = this.getCourse(courseId);
        if (!course) return;
        course.modules = course.modules.filter(m => m.id !== moduleId);
        this.saveCourse(course);
    },

    // ============ LESSONS ============
    addLesson(courseId, moduleId, title, url) {
        const course = this.getCourse(courseId);
        if (!course) return null;
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return null;

        const videoId = this.parseVideoId(url || '');
        const number = mod.lessons.length + 1;
        const lesson = {
            id: this.generateId('les'),
            number,
            title: title || `Aula ${number}`,
            url: url || '',
            videoId: videoId || '',
            completed: false
        };
        mod.lessons.push(lesson);
        this.saveCourse(course);
        return lesson.id;
    },

    updateLesson(courseId, moduleId, lessonId, updates) {
        const course = this.getCourse(courseId);
        if (!course) return;
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        if (updates.title !== undefined) lesson.title = updates.title;
        if (updates.url !== undefined) {
            lesson.url = updates.url;
            lesson.videoId = this.parseVideoId(updates.url) || lesson.videoId;
        }
        this.saveCourse(course);
    },

    deleteLesson(courseId, moduleId, lessonId) {
        const course = this.getCourse(courseId);
        if (!course) return;
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return;
        mod.lessons = mod.lessons.filter(l => l.id !== lessonId);
        // Re-number
        mod.lessons.forEach((l, i) => l.number = i + 1);
        this.saveCourse(course);
    },

    toggleLessonComplete(courseId, moduleId, lessonId) {
        const course = this.getCourse(courseId);
        if (!course) return false;
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return false;
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (!lesson) return false;
        lesson.completed = !lesson.completed;
        this.saveCourse(course);
        return lesson.completed;
    },

    // ============ PROGRESS ============
    getCourseProgress(courseId) {
        const course = this.getCourse(courseId);
        return this._calcProgress(course);
    },

    getModuleProgress(course, moduleId) {
        if (!course) return { completed: 0, total: 0, percentage: 0 };
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return { completed: 0, total: 0, percentage: 0 };
        const total = mod.lessons.length;
        const completed = mod.lessons.filter(l => l.completed).length;
        return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
    },

    _calcProgress(course) {
        if (!course) return { completed: 0, total: 0, percentage: 0 };
        let total = 0, completed = 0;
        course.modules.forEach(m => {
            m.lessons.forEach(l => {
                total++;
                if (l.completed) completed++;
            });
        });
        return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
    },

    _getCourseThumbnail(course) {
        if (!course || !course.modules.length) return '';
        for (const mod of course.modules) {
            for (const les of mod.lessons) {
                if (les.videoId) return this.getThumbnailUrl(les.videoId);
            }
        }
        return '';
    },

    // ============ PREFERENCES ============
    getPreferences() {
        try {
            const data = localStorage.getItem(this.KEYS.PREFERENCES);
            return data ? JSON.parse(data) : { theme: 'dark', lastCourseId: null };
        } catch {
            return { theme: 'dark', lastCourseId: null };
        }
    },

    savePreferences(prefs) {
        localStorage.setItem(this.KEYS.PREFERENCES, JSON.stringify(prefs));
    },

    setTheme(theme) {
        const prefs = this.getPreferences();
        prefs.theme = theme;
        this.savePreferences(prefs);
    },

    setLastCourse(courseId) {
        const prefs = this.getPreferences();
        prefs.lastCourseId = courseId;
        this.savePreferences(prefs);
    },

    // ============ UTILITIES ============
    parseVideoId(url) {
        if (!url) return '';
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
        return match ? match[1] : '';
    },

    getThumbnailUrl(videoId) {
        if (!videoId) return '';
        return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    },

    exportCourse(courseId) {
        const course = this.getCourse(courseId);
        if (!course) return null;
        return JSON.stringify(course, null, 2);
    },

    // ============ MIGRATION ============
    migrateFromLegacy() {
        const hasIndex = localStorage.getItem(this.KEYS.INDEX);
        if (hasIndex) return false;

        // Check if legacy data exists (from the old data.js)
        if (typeof LEGACY_COURSE_DATA === 'undefined') return false;

        const oldProgress = localStorage.getItem(this.KEYS.OLD_PROGRESS);
        let completedSet = new Set();
        if (oldProgress) {
            try {
                completedSet = new Set(JSON.parse(oldProgress));
            } catch { /* ignore */ }
        }

        const courseId = this.generateId('course');
        const course = {
            id: courseId,
            title: LEGACY_COURSE_DATA.courseTitle,
            modules: LEGACY_COURSE_DATA.modules.map(mod => ({
                id: `mod_${mod.id}`,
                title: mod.title,
                description: mod.description,
                lessons: mod.lessons.map(les => ({
                    id: `les_${mod.id}_${les.number}`,
                    number: les.number,
                    title: les.title,
                    url: les.url,
                    videoId: les.videoId,
                    completed: completedSet.has(`${mod.id}-${les.number}`)
                }))
            }))
        };

        localStorage.setItem(this.KEYS.courseKey(courseId), JSON.stringify(course));

        const progress = this._calcProgress(course);
        const thumbnail = this._getCourseThumbnail(course);
        this.saveCoursesIndex([{
            id: courseId,
            title: course.title,
            thumbnail,
            totalLessons: progress.total,
            completedLessons: progress.completed,
            lastAccessed: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }]);

        this.savePreferences({
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            lastCourseId: courseId
        });

        localStorage.removeItem(this.KEYS.OLD_PROGRESS);
        return true;
    }
};
