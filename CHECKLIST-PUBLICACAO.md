# ✅ Checklist de Publicação - Rota do Estudo

Use este checklist para garantir que está tudo pronto antes de enviar para a Chrome Web Store.

## 📋 Pré-Publicação

### 1️⃣ Código e Configuração
- [ ] Removi localhost/URLs de desenvolvimento do `manifest.json`
- [ ] Atualizei `author` no `manifest.json` com meu nome
- [ ] Atualizei `homepage_url` no `manifest.json` com meu GitHub
- [ ] Removi todos os `console.log()` de debug
- [ ] Testei a extensão carregando em modo desenvolvedor
- [ ] Testei em uma janela anônima/privada
- [ ] Testei com vídeos individuais do YouTube
- [ ] Testei com playlists do YouTube
- [ ] Verifiquei que não há erros no console

### 2️⃣ Assets Visuais
- [ ] Tenho os ícones 16x16, 48x48 e 128x128 prontos
- [ ] Criei pelo menos 1 screenshot (1280x800px)
  - [ ] Screenshot 1: ____________________
  - [ ] Screenshot 2: ____________________
  - [ ] Screenshot 3: ____________________
  - [ ] Screenshot 4: ____________________
  - [ ] Screenshot 5: ____________________
- [ ] (Opcional) Criei tile promocional 440x280px
- [ ] (Opcional) Criei marquee 1400x560px

**Dica:** Use o arquivo `criar-screenshots.html` para gerar screenshots!

### 3️⃣ Documentação
- [ ] Li o arquivo `PUBLICACAO-CHROME-WEB-STORE.md` completo
- [ ] Copiei a descrição detalhada
- [ ] Copiei as justificativas de permissões
- [ ] Criei o arquivo `PRIVACY.md` no GitHub ou tenho URL da política
- [ ] Revisei todos os textos e não há erros de português

### 4️⃣ GitHub (Recomendado)
- [ ] Fiz commit de todas as alterações
- [ ] Criei um repositório público no GitHub
- [ ] Fiz push do código
- [ ] Adicionei o arquivo `PRIVACY.md` no repositório
- [ ] Atualizei o README.md com instruções de uso
- [ ] Copiei a URL do repositório para usar na listagem

## 📦 Criação do Pacote

### 5️⃣ Preparar ZIP
- [ ] Executei `criar-zip.bat` OU criei o ZIP manualmente
- [ ] Verifiquei que o ZIP contém:
  - [ ] `manifest.json`
  - [ ] `background.js`
  - [ ] Pasta `popup/` completa
  - [ ] Pasta `content/` completa
  - [ ] Pasta `icons/` completa
- [ ] Verifiquei que o ZIP NÃO contém:
  - [ ] Pasta `.git`
  - [ ] `node_modules`
  - [ ] Arquivos `.DS_Store` ou `Thumbs.db`
  - [ ] Arquivos de desenvolvimento

**Nome do arquivo ZIP:** `rota-do-estudo-v1.0.0.zip`

## 🌐 Chrome Web Store

### 6️⃣ Conta de Desenvolvedor
- [ ] Acessei https://chrome.google.com/webstore/devconsole/
- [ ] Criei/fiz login na conta de desenvolvedor
- [ ] Paguei a taxa de $5 (única vez)
- [ ] Tenho acesso ao painel de desenvolvedor

### 7️⃣ Informações da Listagem

#### Informações Básicas
- [ ] Nome: `Rota do Estudo - Organize seus Estudos no YouTube`
- [ ] Resumo: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
- [ ] Descrição: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
- [ ] Categoria: `Produtividade`
- [ ] Idioma: `Português (Brasil)`

#### Assets
- [ ] Upload do ícone 128x128
- [ ] Upload de screenshots (pelo menos 1)
- [ ] (Opcional) Upload do tile promocional
- [ ] (Opcional) Upload do marquee

#### Links
- [ ] Site oficial: `https://github.com/[meu-usuario]/rota-do-estudo`
- [ ] URL de suporte: `https://github.com/[meu-usuario]/rota-do-estudo/issues`
- [ ] Política de Privacidade: `https://github.com/[meu-usuario]/rota-do-estudo/blob/main/PRIVACY.md`

#### Privacidade
- [ ] Preenchi justificativas para todas as permissões
  - [ ] `activeTab`: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
  - [ ] `scripting`: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
  - [ ] `storage`: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
  - [ ] `tabs`: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
  - [ ] Host permissions: (copiar de `PUBLICACAO-CHROME-WEB-STORE.md`)
- [ ] Confirmei que não coleto dados pessoais
- [ ] Adicionei link da política de privacidade

### 8️⃣ Upload e Publicação
- [ ] Fiz upload do arquivo ZIP
- [ ] Aguardei a análise automática passar
- [ ] Corrigi erros/avisos se houver
- [ ] Escolhi visibilidade: **Pública** (recomendado)
- [ ] Cliquei em "Enviar para análise"
- [ ] Recebi confirmação de envio

## ⏳ Pós-Envio

### 9️⃣ Aguardar Aprovação
- [ ] Recebi email de confirmação do envio
- [ ] Aguardando análise (pode levar 3-14 dias)
- [ ] Checando status regularmente no painel

### 🔟 Após Aprovação
- [ ] Extensão foi aprovada! 🎉
- [ ] Testei a instalação da loja oficial
- [ ] Compartilhei com amigos
- [ ] Pedi para avaliarem com 5 estrelas
- [ ] Compartilhei nas redes sociais

---

## 📊 Progresso Geral

**Data de início:** ___/___/______
**Data de envio:** ___/___/______
**Data de aprovação:** ___/___/______

**Status atual:**
- [ ] Preparando arquivos
- [ ] Criando assets visuais
- [ ] Pronto para enviar
- [ ] Enviado para análise
- [ ] Em análise
- [ ] Aprovado e publicado! 🎉

---

## 🆘 Problemas Comuns

### ❌ ZIP rejeitado
**Solução:** Verifique se não incluiu arquivos ocultos ou de desenvolvimento

### ❌ Permissões não justificadas
**Solução:** Use as justificativas do arquivo `PUBLICACAO-CHROME-WEB-STORE.md`

### ❌ Falta política de privacidade
**Solução:** Hospede o arquivo `PRIVACY.md` no GitHub e adicione o link

### ❌ Ícones com problema
**Solução:** Garanta que são PNG, não JPG, e têm os tamanhos exatos

### ❌ Screenshots rejeitados
**Solução:** Use exatamente 1280x800px ou 640x400px

---

## 📞 Precisa de Ajuda?

- Documentação oficial: https://developer.chrome.com/docs/webstore/
- Suporte Google: https://support.google.com/chrome_webstore/
- Comunidade: Stack Overflow, Reddit r/webdev

---

**Boa sorte com a publicação! 🚀**
