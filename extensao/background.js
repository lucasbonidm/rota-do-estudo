// ============ SERVICE WORKER - Background ============
// Gerencia comunicacao entre popup, content scripts e abas

const DEFAULT_APP_URL = 'https://rota-do-estudo.vercel.app/';

// ============ BUSCAR ABA DO APP ============

async function getAppUrl() {
  const result = await chrome.storage.sync.get('appUrl');
  return result.appUrl || DEFAULT_APP_URL;
}

async function findAppTab() {
  const appUrl = await getAppUrl();
  const tabs = await chrome.tabs.query({});
  return tabs.find(tab => tab.url && tab.url.startsWith(appUrl));
}

async function ensureAppTab() {
  let tab = await findAppTab();

  if (tab) {
    // App ja esta aberto, garantir content script injetado
    await injectAppContentScript(tab.id);
    return tab;
  }

  // Abrir nova aba com o app
  const appUrl = await getAppUrl();
  tab = await chrome.tabs.create({ url: appUrl, active: false });

  // Aguardar carregamento
  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  await injectAppContentScript(tab.id);

  // Pequeno delay para content script inicializar
  await new Promise(r => setTimeout(r, 300));

  return tab;
}

// ============ INJETAR CONTENT SCRIPT NO APP ============

async function injectAppContentScript(tabId) {
  // Sempre tenta injetar - se ja estiver injetado, o Chrome ignora duplicatas
  // pois o content script usa IIFE
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/app.js']
    });
    console.log('[NC] Content script injetado no app, tab:', tabId);
  } catch (err) {
    console.error('[NC] Erro ao injetar content script no app:', err);
    throw err;
  }
}

// ============ LISTENER PRINCIPAL ============

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Mensagens do popup
  if (msg.type === 'GET_APP_URL') {
    getAppUrl().then(url => sendResponse({ url }));
    return true;
  }

  if (msg.type === 'SET_APP_URL') {
    chrome.storage.sync.set({ appUrl: msg.url }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.type === 'DETECT_YOUTUBE') {
    // Envia mensagem para content script do YouTube na aba ativa
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
        sendResponse({ context: 'none' });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'DETECT_PAGE' }).then(response => {
        sendResponse(response || { context: 'none' });
      }).catch(() => {
        sendResponse({ context: 'none' });
      });
    });
    return true;
  }

  // Operacoes no app (proxy para content script do app)
  if (['GET_COURSES', 'GET_COURSE', 'CREATE_COURSE', 'ADD_LESSON', 'IMPORT_MODULE'].includes(msg.type)) {
    handleAppOperation(msg).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (msg.type === 'OPEN_APP') {
    openAppInCourse(msg.courseId);
    return;
  }
});

// ============ OPERACOES NO APP ============

async function handleAppOperation(msg) {
  let tab;
  try {
    tab = await ensureAppTab();
  } catch (err) {
    console.error('[NC] Erro ao garantir aba do app:', err);
    return { success: false, error: 'Nao foi possivel abrir o app. Verifique a URL configurada.' };
  }

  // Tentar enviar mensagem, com retry apos reinjecao
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, msg);
      return response;
    } catch (err) {
      console.warn(`[NC] Tentativa ${attempt + 1} falhou:`, err.message);
      if (attempt === 0) {
        // Primeira falha: reinjetar e tentar novamente
        try {
          await injectAppContentScript(tab.id);
        } catch {
          return { success: false, error: 'Sem permissao para acessar o app. Verifique a URL configurada.' };
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  return { success: false, error: 'Nao foi possivel comunicar com o app. O app esta aberto?' };
}

async function openAppInCourse(courseId) {
  const appUrl = await getAppUrl();
  const url = courseId ? `${appUrl}#/course/${courseId}` : appUrl;
  const tab = await findAppTab();

  if (tab) {
    await chrome.tabs.update(tab.id, { url, active: true });
  } else {
    await chrome.tabs.create({ url, active: true });
  }
}
