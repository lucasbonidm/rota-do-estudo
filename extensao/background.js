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
    try {
      await injectAppContentScript(tab.id);
      return tab;
    } catch (err) {
      console.warn('[NC] Content script falhou em aba existente, abrindo nova:', err);
      // Se falhou em aba existente, tentar fechar e abrir nova
      try {
        await chrome.tabs.remove(tab.id);
      } catch {}
    }
  }

  // Abrir nova aba com o app
  const appUrl = await getAppUrl();
  console.log('[NC] Abrindo app em:', appUrl);
  tab = await chrome.tabs.create({ url: appUrl, active: false });

  // Aguardar carregamento completo
  let loadAttempts = 0;
  const maxAttempts = 30; // 30 segundos máximo

  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        console.log('[NC] App carregado, tab:', tabId);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    // Timeout de segurança
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      console.warn('[NC] Timeout aguardando carregamento do app');
      resolve(); // Continuar mesmo com timeout
    }, 30000);

    chrome.tabs.onUpdated.addListener(listener);
  });

  await injectAppContentScript(tab.id);

  // Aumentar delay para garantir que o content script está pronto
  await new Promise(r => setTimeout(r, 500));

  console.log('[NC] App tab pronto:', tab.id);
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
    if (!tab || !tab.id) {
      throw new Error('Tab inválida');
    }
  } catch (err) {
    console.error('[NC] Erro ao garantir aba do app:', err);
    return { success: false, error: 'Não foi possível abrir o app. Verifique se o navegador permite abrir abas.' };
  }

  // Tentar enviar mensagem, com retry apos reinjecao
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[NC] Tentativa ${attempt + 1} de enviar mensagem (${msg.type})`);
      const response = await chrome.tabs.sendMessage(tab.id, msg);
      if (response) {
        console.log(`[NC] Resposta recebida:`, response);
        return response;
      }
    } catch (err) {
      console.warn(`[NC] Tentativa ${attempt + 1} falhou:`, err.message);
      if (attempt < 2) {
        // Não é a última tentativa - tentar reinjetar e aguardar
        try {
          console.log('[NC] Reinjetando content script...');
          await injectAppContentScript(tab.id);
          // Aguardar mais tempo para script inicializar
          await new Promise(r => setTimeout(r, 800));
        } catch (reinjectErr) {
          console.error('[NC] Erro ao reinjetar:', reinjectErr.message);
        }
      }
    }
  }

  return { success: false, error: 'Não foi possível comunicar com o app. Verifique se https://rota-do-estudo.vercel.app está carregando corretamente.' };
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
