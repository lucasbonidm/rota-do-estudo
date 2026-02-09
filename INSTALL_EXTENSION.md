# 🔌 Guia de Instalação da Extensão Chrome - Rota do Estudo

Este guia explica como instalar a extensão Chrome do **Rota do Estudo** para adicionar vídeos e playlists do YouTube com um clique.

---

## 📋 Requisitos

- ✅ Navegador Chrome, Edge ou Brave (qualquer versão recente)
- ✅ Arquivos da extensão (pasta `extensao/`)
- ✅ 2 minutos do seu tempo

---

## 🚀 Passo 1: Baixar os Arquivos

Se você ainda não tem os arquivos:

### **Opção A: Clonar pelo Git** (recomendado)
```bash
git clone https://github.com/lucasbonidm/rota-do-estudo.git
cd rota-do-estudo
```

### **Opção B: Baixar como ZIP**
1. Acesse: [github.com/lucasbonidm/rota-do-estudo](https://github.com/lucasbonidm/rota-do-estudo)
2. Clique no botão verde **"Code"**
3. Selecione **"Download ZIP"**
4. Extraia a pasta em um local de fácil acesso (ex: Desktop)

---

## 🔧 Passo 2: Abrir as Configurações do Chrome

### **No Windows/Linux:**
1. Abra **Google Chrome** (ou Edge/Brave)
2. Na barra de endereço, digite: `chrome://extensions/`
3. Pressione **Enter**

### **No Mac:**
1. Abra **Google Chrome**
2. Menu → **Preferências** → **Mais ferramentas** → **Extensões**
3. Ou use o atalho: `⌘ + Shift + M`

---

## ⚙️ Passo 3: Ativar Modo de Desenvolvedor

Na página de extensões, procure o botão **"Modo de desenvolvedor"** no **canto superior direito**.

**Antes:**
```
[Extensões]              [Modo de desenvolvedor] ⭕
```

**Depois:**
```
[Extensões]              [Modo de desenvolvedor] 🔵
```

Clique para ativar (ele vai ficar azul/ativo).

![Ativar modo de desenvolvedor](/docs/screenshots/modo-desenvolvedor.png)
<!-- Imagem mostrando o botão "Modo de desenvolvedor" -->

---

## 📂 Passo 4: Carregar a Extensão

Após ativar o "Modo de desenvolvedor", aparecem 3 botões novos:
- 📦 Carregar extensão sem empacotar
- 🔄 Atualizar
- 🗑️ Remover

Clique em **"Carregar extensão sem empacotar"**.

![Botão de carregar extensão](/docs/screenshots/carregar-extensao.png)
<!-- Imagem mostrando os botões que aparecem -->

---

## 📁 Passo 5: Selecionar a Pasta `extensao/`

Uma janela de seleção de pasta vai abrir.

Navegue até seu projeto **rota-do-estudo** e selecione a pasta **`extensao/`**:

```
rota-do-estudo/
├── extensao/          ← Selecione ESTA pasta
│   ├── manifest.json
│   ├── background.js
│   ├── popup/
│   ├── content/
│   └── icons/
├── js/
├── css/
├── index.html
└── README.md
```

Clique em **"Selecionar"** (ou equivalente no seu SO).

---

## ✅ Passo 6: Confirmar Instalação

Se tudo funcionou, você verá:

```
🔌 Rota do Estudo
   ID: abc123def456...

   ✅ Ativo

   Versão 1.0.0
   Descrição: Adicione videos e playlists do YouTube à Rota do Estudo
```

A extensão agora aparece na **barra superior do Chrome**, perto dos ícones de busca.

![Extensão instalada na barra](/docs/screenshots/extensao-instalada.png)
<!-- Imagem mostrando a extensão na barra do Chrome -->

---

## 🎯 Passo 7: Usar a Extensão

### **Abra um vídeo ou playlist no YouTube**

1. Vá para: [youtube.com](https://youtube.com)
2. Abra qualquer **vídeo** ou **playlist**
3. Clique no ícone da extensão (Rota do Estudo) na barra superior

### **O que vai acontecer:**

- Se for um **vídeo**: opção de criar novo curso com esse vídeo
- Se for uma **playlist**: opção de importar todos os vídeos de uma vez

### **Escolha o que deseja fazer:**

```
┌─────────────────────────────────────┐
│  🎬 Rota do Estudo                  │
├─────────────────────────────────────┤
│  VIDEO detectado                    │
│  "JavaScript para Iniciantes"       │
│                                      │
│  [📝 Criar novo curso]              │
│  [🔗 Abrir App]                     │
└─────────────────────────────────────┘
```

---

## ⚙️ Configurar a URL do App

Se você está usando o app em um local diferente, pode configurar a URL:

1. Clique na extensão
2. Clique no ícone de **⚙️ Configurações**
3. Digite a URL do seu app (ex: `https://rota-do-estudo.vercel.app/`)
4. Clique em **Salvar**

A extensão vai se conectar ao seu app naquela URL.

---

## 🔄 Atualizar a Extensão

Se você fizer mudanças no código da extensão, é necessário recarregá-la:

1. Vá em `chrome://extensions/`
2. Procure pela extensão **"Rota do Estudo"**
3. Clique no botão **🔄 Atualizar**

Pronto! As mudanças foram carregadas.

---

## 🗑️ Desinstalar a Extensão

Se quiser remover a extensão:

1. Vá em `chrome://extensions/`
2. Procure pela extensão **"Rota do Estudo"**
3. Clique no botão **🗑️ Remover**
4. Confirme

---

## ❓ Troubleshooting - Soluções para Problemas

### **"Não consigo encontrar a pasta `extensao/`"**

Certifique-se que você:
- ✅ Baixou os arquivos do repositório
- ✅ Extraiu o ZIP corretamente (se baixou assim)
- ✅ A pasta contém `manifest.json` (se abrir a pasta e não vê esse arquivo, não é a pasta certa)

**Estrutura correta:**
```
extensao/
├── manifest.json
├── background.js
└── ...
```

---

### **"O ícone da extensão não aparece"**

1. Vá em `chrome://extensions/`
2. Procure por "Rota do Estudo"
3. Se estiver cinza/inativo, a extensão não carregou corretamente
4. Tente remover e carregar novamente

---

### **"A extensão carregou mas não funciona"**

1. Abra o **DevTools** da extensão:
   - Vá em `chrome://extensions/`
   - Procure "Rota do Estudo"
   - Clique em **"Detalhes"**
   - Clique em **"Página de fundo"** (abre o console)

2. Procure por erros em vermelho
3. Se tiver erro, copie e reporte em: [Issues do GitHub](https://github.com/lucasbonidm/rota-do-estudo/issues)

---

### **"Quando clico na extensão, nada acontece"**

Verifique se:
- ✅ Você está em `youtube.com` (a extensão só funciona no YouTube)
- ✅ O app Rota do Estudo está aberto em outra aba
- ✅ A URL configurada está correta (⚙️ → Configurações)

---

### **"Erro ao tentar adicionar um vídeo"**

Possíveis causas:
1. **App não está aberto** → Abra em outra aba
2. **URL incorreta** → Verifique em Configurações (⚙️)
3. **Vídeo bloqueado** → Alguns vídeos não podem ser incorporados

---

## 🌐 Navegadores Compatíveis

A extensão funciona em:

| Navegador | Suporte | Como Instalar |
|-----------|---------|---------------|
| **Chrome** | ✅ Total | Siga este guia |
| **Edge (Chromium)** | ✅ Total | Mesmo processo (vá em `edge://extensions/`) |
| **Brave** | ✅ Total | Mesmo processo (vá em `brave://extensions/`) |
| **Opera** | ✅ Provável | Extensões do Chrome funcionam no Opera |
| **Firefox** | ❌ Não | Requer versão Firefox da extensão |
| **Safari** | ❌ Não | Requer versão Safari da extensão |

---

**v1.0** • 2026 • [rota-do-estudo.vercel.app](https://rota-do-estudo.vercel.app)
