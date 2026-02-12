// ============ SERVICE WORKER - Background ============
// Gerencia comunicacao entre popup, content scripts e abas

const APP_URL = 'https://rota-do-estudo.vercel.app';

// ============ BUSCAR ABA DO APP ============

async function findAppTab() {
  const appUrl = APP_URL;
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
// activateTab=false permite abrir em background sem fechar o popup
async function openAppTab(courseId = null, activateTab = true) {
  const targetUrl = courseId ? `${APP_URL}#/course/${courseId}` : APP_URL;

  let tab = await findAppTab();

  if (tab) {
    // App já está aberto, atualizar URL
    console.log('[NC] App já aberto, atualizando para:', targetUrl);
    await chrome.tabs.update(tab.id, { url: targetUrl, active: activateTab });
  } else {
    // Abrir nova aba
    console.log('[NC] Abrindo app em:', targetUrl);
    tab = await chrome.tabs.create({ url: targetUrl, active: activateTab });

    // Aguardar carregamento completo
    await waitForTabLoad(tab.id, 30000);

    // Injetar content script
    try {
      await injectAppContentScript(tab.id);
    } catch (err) {
      console.error('[NC] Erro ao injetar script:', err);
    }
  }

  return tab;
}

// Aguardar aba carregar completamente
async function waitForTabLoad(tabId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        console.log('[NC] App carregado, tab:', tabId);
        resolve();
      }
    };

    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      console.warn('[NC] Timeout aguardando carregamento do app');
      resolve();
    }, timeoutMs);

    chrome.tabs.onUpdated.addListener(listener);
  });
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
  if (msg.type === 'DETECT_YOUTUBE') {
    // Envia mensagem para content script do YouTube na aba ativa
    // Com re-injeção automática se o content script não responder
    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
        sendResponse({ context: 'none' });
        return;
      }

      // Primeira tentativa
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_PAGE' });
        if (response && response.context !== 'none') {
          sendResponse(response);
          return;
        }
      } catch (err) {
        console.log('[NC] Content script não respondeu, re-injetando...');
      }

      // Re-injetar content script e tentar novamente
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/youtube.js']
        });
        await new Promise(r => setTimeout(r, 500));
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_PAGE' });
        sendResponse(response || { context: 'none' });
      } catch (err) {
        console.warn('[NC] Falha mesmo após re-injeção:', err.message);
        sendResponse({ context: 'none' });
      }
    });
    return true;
  }

  if (msg.type === 'RELOAD_TAB') {
    // Recarrega a aba ativa e re-injeta content script após carregamento
    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (!tab) {
        sendResponse({ success: false });
        return;
      }

      await chrome.tabs.reload(tab.id);

      // Aguardar carregamento completo
      await new Promise((resolve) => {
        const listener = (tabId, info) => {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 10000);
      });

      // Aguardar um pouco mais para o DOM renderizar
      await new Promise(r => setTimeout(r, 1000));

      sendResponse({ success: true });
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
  let tab = await findAppTab();

  // Se app não está aberto, abrir em background (sem fechar o popup)
  if (!tab) {
    console.log('[NC] App não está aberto, abrindo em background...');
    tab = await openAppTab(null, false);
    // Aguardar SPA inicializar após carregamento da página
    await new Promise(r => setTimeout(r, 1000));
  }

  // Injetar script se necessário
  try {
    await injectAppContentScript(tab.id);
  } catch (err) {
    console.warn('[NC] Erro ao injetar (pode já estar injetado):', err.message);
  }

  // Tentar enviar mensagem, com retry
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
        try {
          console.log('[NC] Reinjetando content script...');
          await injectAppContentScript(tab.id);
          await new Promise(r => setTimeout(r, 800));
        } catch (reinjectErr) {
          console.error('[NC] Erro ao reinjetar:', reinjectErr.message);
        }
      }
    }
  }

  return { success: false, error: 'Não foi possível comunicar com o app' };
}

async function openAppInCourse(courseId) {
  try {
    await openAppTab(courseId);
  } catch (err) {
    console.error('[NC] Erro ao abrir app:', err);
  }
}
