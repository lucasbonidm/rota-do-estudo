# 📦 Guia Completo de Publicação - Chrome Web Store

## 📝 INFORMAÇÕES BÁSICAS

### Nome da Extensão
```
Rota do Estudo - Organize seus Estudos no YouTube
```

### Resumo (máximo 132 caracteres)
```
Adicione vídeos e playlists do YouTube à sua Rota do Estudo com um clique. Organize seus cursos e módulos facilmente.
```
*Contagem: 125 caracteres ✓*

---

## 📄 DESCRIÇÃO DETALHADA

```
🎓 Organize seus estudos do YouTube de forma profissional

Rota do Estudo é a extensão perfeita para quem usa o YouTube para aprender. Adicione vídeos e playlists completas ao seu app de estudos com apenas um clique, sem precisar copiar links manualmente.

✨ PRINCIPAIS RECURSOS:

📹 Adicione Vídeos Individuais
• Crie um novo curso com um único vídeo
• Adicione vídeos como módulos em cursos existentes
• Organize suas aulas de forma hierárquica

📋 Importe Playlists Completas
• Crie cursos completos a partir de playlists
• Detecte módulos automaticamente ou agrupe tudo junto
• Importe dezenas de vídeos instantaneamente

🎯 Organize Como Quiser
• Crie cursos personalizados
• Adicione módulos temáticos
• Monte sua própria trilha de aprendizado

⚡ Super Rápido e Fácil
• Funciona diretamente na página do YouTube
• Interface intuitiva e em português
• Não precisa sair do YouTube para organizar

🔒 Privacidade Garantida
• Seus dados ficam apenas no seu navegador
• Nenhuma informação é enviada para servidores externos
• Código open source disponível no GitHub

💡 COMO USAR:

1. Instale a extensão
2. Abra qualquer vídeo ou playlist no YouTube
3. Clique no ícone da extensão
4. Escolha como deseja organizar
5. Pronto! Seus estudos estão organizados

📚 IDEAL PARA:

• Estudantes que fazem cursos online
• Autodidatas organizando trilhas de aprendizado
• Professores criando material de apoio
• Qualquer pessoa que usa YouTube para aprender

🌟 GRATUITO E OPEN SOURCE

Esta extensão é 100% gratuita e sempre será. O código está disponível no GitHub para você conferir e contribuir.

---

🔗 Links Úteis:
• Repositório GitHub: [seu-link]
• Reportar Problemas: [seu-link]
• Guia de Uso: [seu-link]

Comece agora a organizar seus estudos de forma profissional! 🚀
```

---

## 🏷️ CATEGORIA E CLASSIFICAÇÃO

### Categoria Principal
```
Produtividade
```

### Categoria Alternativa (se disponível)
```
Educação
```

### Idioma Principal
```
Português (Brasil)
```

### Classificação de Conteúdo
```
Para todos os públicos
```

---

## 🔐 JUSTIFICATIVA DE PERMISSÕES

Copie e cole exatamente isso na seção de justificativa:

### activeTab
```
Necessária para detectar quando o usuário está visualizando um vídeo ou playlist no YouTube. Permite à extensão identificar o contexto da página atual sem acessar todas as abas do navegador.
```

### scripting
```
Utilizada para extrair informações do vídeo ou playlist (título, URL, lista de vídeos) diretamente da página do YouTube. Essencial para o funcionamento da extensão.
```

### storage
```
Armazena as configurações do usuário (URL do aplicativo pessoal) localmente no navegador. Nenhum dado é enviado para servidores externos - tudo fica no dispositivo do usuário.
```

### tabs
```
Permite à extensão abrir o aplicativo Rota do Estudo em uma nova aba quando o usuário clica em "Abrir App". Também necessária para comunicação entre o popup da extensão e a página do YouTube.
```

### Permissões de Host (youtube.com)
```
A extensão precisa acessar apenas páginas do YouTube para extrair informações de vídeos e playlists. Não acessa nenhum outro site ou coleta dados pessoais do usuário.
```

---

## 🔒 POLÍTICA DE PRIVACIDADE

```
POLÍTICA DE PRIVACIDADE - Rota do Estudo

Última atualização: [DATA ATUAL]

A extensão "Rota do Estudo" foi desenvolvida com total respeito à sua privacidade.

DADOS COLETADOS:
• NENHUM dado pessoal é coletado
• NENHUM dado é enviado para servidores externos
• NENHUM rastreamento ou analytics é utilizado

DADOS ARMAZENADOS LOCALMENTE:
A extensão armazena apenas:
• URL do seu aplicativo Rota do Estudo (configurável por você)

Estes dados ficam armazenados apenas no seu navegador e nunca são transmitidos.

PERMISSÕES UTILIZADAS:
• YouTube: Para detectar vídeos e playlists e extrair seus títulos e URLs
• Storage: Para salvar suas configurações localmente
• Tabs: Para abrir seu aplicativo quando solicitado

CÓDIGO ABERTO:
O código-fonte completo está disponível em:
https://github.com/[seu-usuario]/rota-do-estudo

CONTATO:
Para dúvidas sobre privacidade: [seu-email]

Esta extensão NÃO:
❌ Coleta histórico de navegação
❌ Rastreia suas atividades
❌ Vende ou compartilha dados
❌ Utiliza cookies de terceiros
❌ Exibe anúncios
```

---

## 🎨 ASSETS NECESSÁRIOS

### ✅ Você já tem:
- [x] Ícone 128x128px (`icons/icon128.png`)

### 📸 Você precisa criar:

#### 1️⃣ SCREENSHOTS (OBRIGATÓRIO)
**Tamanho:** 1280x800px ou 640x400px
**Quantidade:** Pelo menos 1 (recomendado: 3-5)

**Sugestões de screenshots:**

**Screenshot 1: Popup detectando vídeo**
- Mostre o popup aberto em uma página do YouTube
- Destaque o vídeo detectado
- Título: "Adicione vídeos com um clique"

**Screenshot 2: Popup detectando playlist**
- Mostre o popup aberto em uma playlist
- Mostre a quantidade de vídeos detectados
- Título: "Importe playlists completas"

**Screenshot 3: Opções de organização**
- Mostre as opções: criar curso, adicionar módulo, etc.
- Título: "Organize do seu jeito"

**Screenshot 4: Configurações**
- Mostre a tela de configuração da URL do app
- Título: "Configure seu app pessoal"

**Screenshot 5: Antes e Depois**
- Lado esquerdo: YouTube sem organização
- Lado direito: Cursos organizados
- Título: "Transforme vídeos em cursos estruturados"

#### 2️⃣ TILE PROMOCIONAL (Recomendado)
**Tamanho:** 440x280px
**Descrição:** Imagem promocional pequena

**Sugestões:**
- Logotipo + texto "Organize seus estudos"
- Screenshot com destaque
- Design clean com cores da marca

#### 3️⃣ MARQUEE PROMOCIONAL (Opcional)
**Tamanho:** 1400x560px
**Descrição:** Banner grande na página da extensão

**Sugestões:**
- Screenshot do popup + mockup do aplicativo
- Texto destacado: "Do YouTube para seus Cursos"
- Design profissional com gradient

---

## 🎯 PALAVRAS-CHAVE (SEO)

Inclua estas palavras na descrição (já estão incluídas acima):

✓ YouTube
✓ Estudos
✓ Cursos online
✓ Playlists
✓ Organização
✓ Produtividade
✓ Aprendizado
✓ Educação
✓ Vídeos educativos
✓ Autodidatas
✓ Gestão de estudos

---

## 🌐 SUPORTE E LINKS

### Site oficial
```
https://github.com/[seu-usuario]/rota-do-estudo
```

### URL de suporte
```
https://github.com/[seu-usuario]/rota-do-estudo/issues
```

### Política de Privacidade (URL)
Você pode criar uma página no GitHub:
```
https://github.com/[seu-usuario]/rota-do-estudo/blob/main/PRIVACY.md
```

---

## 📊 MÉTRICAS E TAGS INTERNAS

### Tags sugeridas
```
youtube, estudos, cursos, playlist, educacao, produtividade, organizacao, aprendizado
```

### Tipo de extensão
```
Extension (não é tema ou aplicativo)
```

### Visibilidade
```
Pública (aparece nas buscas)
```

---

## ✅ CHECKLIST ANTES DE ENVIAR

- [ ] Removi todas as referências a localhost/desenvolvimento do manifest.json
- [ ] Testei a extensão em modo anônimo
- [ ] Criei pelo menos 1 screenshot de 1280x800px
- [ ] Revisei a descrição e não há erros de português
- [ ] Configurei a URL do repositório GitHub no manifest
- [ ] Criei a política de privacidade (pode ser no GitHub)
- [ ] Tenho $5 disponíveis para pagar a taxa de desenvolvedor
- [ ] Li todas as justificativas de permissões

---

## 📦 COMO CRIAR O PACOTE ZIP

### Opção 1: Manualmente
1. Entre na pasta `extensao/`
2. Selecione TODOS os arquivos e pastas DENTRO dela
3. Clique com botão direito → "Enviar para" → "Pasta compactada"
4. Renomeie para `rota-do-estudo-v1.0.0.zip`

### Opção 2: Linha de comando
```bash
cd extensao
zip -r ../rota-do-estudo-v1.0.0.zip . -x ".*" -x "__MACOSX"
```

### ⚠️ NÃO incluir:
- ❌ Pasta `.git`
- ❌ Arquivos `.DS_Store`
- ❌ `node_modules`
- ❌ Arquivos de desenvolvimento

### ✅ Deve incluir:
- ✓ manifest.json
- ✓ background.js
- ✓ Pasta `popup/` completa
- ✓ Pasta `content/` completa
- ✓ Pasta `icons/` completa

---

## 🚀 PRÓXIMOS PASSOS

1. **Crie os screenshots** (use Canva, Figma ou PowerPoint)
2. **Atualize o manifest.json** com seu nome e URL do GitHub
3. **Crie o arquivo ZIP** seguindo as instruções acima
4. **Acesse:** https://chrome.google.com/webstore/devconsole/
5. **Pague a taxa:** $5 (uma vez só)
6. **Upload do ZIP** e preencha com as informações deste documento
7. **Aguarde aprovação:** 3-14 dias

---

## 💡 DICAS EXTRAS

### Para aumentar downloads:
- Peça para amigos instalarem e avaliarem com 5 estrelas
- Compartilhe nas redes sociais
- Poste em comunidades de estudantes
- Faça um vídeo tutorial no YouTube
- Crie posts no LinkedIn mostrando a ferramenta

### Para melhorar a listagem:
- Use screenshots com texto explicativo
- Adicione setas e destaques nos screenshots
- Mantenha a descrição atualizada
- Responda todas as avaliações dos usuários
- Lance atualizações frequentes (mostra que está ativo)

---

## 📞 PRECISA DE AJUDA?

Se tiver dúvidas:
1. Leia a documentação oficial: https://developer.chrome.com/docs/webstore/
2. Abra uma issue no seu repositório
3. Pergunte em comunidades de desenvolvedores

BOA SORTE! 🎉
