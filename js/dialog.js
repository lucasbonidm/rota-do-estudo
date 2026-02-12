/**
 * Dialog — substitui alert() e confirm() nativos do browser
 * com modais estilizados no design system do app.
 */
const Dialog = (() => {
    const ICONS = {
        success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
        error:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
        info:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
        confirm: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    };

    const ICON_COLORS = {
        success: '#22c55e',
        error:   '#ef4444',
        warning: '#eab308',
        info:    '#3b82f6',
        confirm: '#ef4444',
    };

    let _resolveCallback = null;

    function _getOrCreateOverlay() {
        return document.getElementById('dialogOverlay');
    }

    function _close(result) {
        const overlay = _getOrCreateOverlay();
        if (!overlay) return;
        overlay.style.display = 'none';
        document.removeEventListener('keydown', _onKeyDown);
        if (_resolveCallback) {
            _resolveCallback(result);
            _resolveCallback = null;
        }
    }

    function _onKeyDown(e) {
        if (e.key === 'Escape') _close(false);
    }

    function _open({ title, message, type, buttons }) {
        const overlay = _getOrCreateOverlay();
        if (!overlay) {
            console.warn('Dialog: #dialogOverlay não encontrado no DOM.');
            return;
        }

        const iconEl = document.getElementById('dialogIcon');
        const messageEl = document.getElementById('dialogMessage');
        const actionsEl = document.getElementById('dialogActions');

        // Ícone
        if (iconEl) {
            iconEl.innerHTML = ICONS[type] || '';
            iconEl.style.color = ICON_COLORS[type] || '#94a3b8';
        }

        // Título
        const titleTextEl = document.getElementById('dialogTitleText');
        if (titleTextEl) {
            titleTextEl.textContent = title;
        }

        // Mensagem
        if (messageEl) {
            messageEl.textContent = message;
        }

        // Botões
        actionsEl.innerHTML = '';
        buttons.forEach(({ label, value, className }) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = className;
            btn.addEventListener('click', () => _close(value));
            actionsEl.appendChild(btn);
        });

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) _close(false);
        };

        // Fechar pelo botão X
        const closeBtn = document.getElementById('dialogClose');
        if (closeBtn) closeBtn.onclick = () => _close(false);

        overlay.style.display = 'flex';
        document.addEventListener('keydown', _onKeyDown);

        // Foca o último botão (primário) para acessibilidade
        setTimeout(() => {
            const btns = actionsEl.querySelectorAll('button');
            if (btns.length) btns[btns.length - 1].focus();
        }, 50);
    }

    /**
     * Exibe um diálogo de confirmação.
     * @param {object} opts
     * @param {string} opts.message
     * @param {string} [opts.title]
     * @param {string} [opts.confirmLabel]
     * @param {string} [opts.cancelLabel]
     * @param {boolean} [opts.danger]
     * @returns {Promise<boolean>}
     */
    function confirm({ message, title = 'Confirmar', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
        return new Promise((resolve) => {
            _resolveCallback = resolve;
            _open({
                title,
                message,
                type: 'confirm',
                buttons: [
                    { label: cancelLabel, value: false, className: 'btn-dialog btn-dialog-secondary' },
                    { label: confirmLabel, value: true,  className: danger ? 'btn-dialog btn-dialog-danger' : 'btn-dialog btn-dialog-primary' },
                ],
            });
        });
    }

    /**
     * Exibe uma notificação (substitui alert()).
     * @param {object} opts
     * @param {string} opts.message
     * @param {string} [opts.title]
     * @param {'success'|'error'|'info'|'warning'} [opts.type]
     * @returns {Promise<void>}
     */
    function alert({ message, title, type = 'info' }) {
        const defaultTitles = { success: 'Sucesso', error: 'Erro', warning: 'Aviso', info: 'Informação' };
        return new Promise((resolve) => {
            _resolveCallback = resolve;
            _open({
                title: title || defaultTitles[type] || 'Aviso',
                message,
                type,
                buttons: [
                    { label: 'OK', value: true, className: 'btn-dialog btn-dialog-primary' },
                ],
            });
        });
    }

    return { confirm, alert };
})();
