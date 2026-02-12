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

// Verificar se app está acessível (sem tentar abrir nova aba)
async function checkAppAvailable() {
  const tab = await findAppTab();
  if (!tab) {
    return { available: false, tabId: null };
  }

  // Tentar injetar content script para verificar se está realmente responsivo
  try {
    await injectAppContentScript(tab.id);
    return { available: true, tabId: tab.id };
  } catch {
    return { available: false, tabId: tab.id };
  }
}

// Abrir app (com interação do usuário, é permitido)
async function openAppTab(courseId = null) {
  const appUrl = await getAppUrl();
  const targetUrl = courseId ? `${appUrl}#/course/${courseId}` : appUrl;

  let tab = await findAppTab();

  if (tab) {
    // App já está aberto, atualizar URL
    console.log('[NC] App já aberto, atualizando para:', targetUrl);
    await chrome.tabs.update(tab.id, { url: targetUrl, active: true });
  } else {
    // Abrir nova aba (com interação do usuário, é permitido)
    console.log('[NC] Abrindo app em:', targetUrl);
    tab = await chrome.tabs.create({ url: targetUrl, active: true });

    // Aguardar carregamento e injetar script
    await new Promise((resolve) => {
      const listener = (tabId, info) => {
        if (tabId === tab.id && info.status === 'complete') {
          console.log('[NC] App carregado, tab:', tabId);
          chrome.tabs.onUpdated.removeListener(listener);
          injectAppContentScript(tab.id).catch(err => {
            console.error('[NC] Erro ao injetar script:', err);
          });
          resolve();
        }
      };

      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        console.warn('[NC] Timeout aguardando carregamento do app');
        resolve();
      }, 30000);

      chrome.tabs.onUpdated.addListener(listener);
    });
  }

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
  // Primeiro, verificar se app está disponível
  const appCheck = await checkAppAvailable();

  if (!appCheck.available) {
    console.warn('[NC] App não está disponível');
    const appUrl = await getAppUrl();
    return {
      success: false,
      error: 'App não está aberto',
      appNotOpen: true,
      appUrl: appUrl
    };
  }

  let tab = appCheck.tabId;

  // Tentar enviar mensagem, com retry apos reinjecao
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[NC] Tentativa ${attempt + 1} de enviar mensagem (${msg.type})`);
      const response = await chrome.tabs.sendMessage(tab, msg);
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
          await injectAppContentScript(tab);
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
  try {
    await openAppTab(courseId);
  } catch (err) {
    console.error('[NC] Erro ao abrir app:', err);
  }
}
