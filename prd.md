# PRD - Rota do Estudo

**Versão**: 1.0
**Data**: Fevereiro 2026
**Status**: Ativo e em desenvolvimento

---

## 📋 Sumário Executivo

O **Rota do Estudo** é uma aplicação web single-page (SPA) que permite aos usuários criar, gerenciar e acompanhar cursos de forma interativa. A aplicação suporta múltiplos cursos, rastreamento de progresso, player de vídeo embutido do YouTube, e funciona completamente offline com persistência via localStorage.

---

## 🎯 Visão Geral

### Objetivo Principal
Fornecer uma plataforma centralizada e intuitiva para gerenciar conteúdo educacional, permitindo que usuários:
- Criem e organizem cursos com múltiplos módulos e aulas
- Importem playlists do YouTube automaticamente
- Acompanhem o progresso de aprendizado
- Acessem conteúdo de forma estruturada e responsiva

### Público-Alvo
- Estudantes que desejam organizar conteúdo de múltiplas plataformas
- Educadores que querem centralizar seus cursos
- Qualquer pessoa que trabalhe com conteúdo educacional em vídeo

### Diferenciais
- ✅ Completamente offline (exceto carregamento de vídeos)
- ✅ Sem necessidade de servidor ou autenticação
- ✅ Interface intuitiva e responsiva
- ✅ Suporte para tema claro/escuro
- ✅ Importação automática de playlists do YouTube
- ✅ Rastreamento de progresso persistente

---

## 🏗️ Arquitetura

### Estrutura de Pastas
```
rota-do-estudo/
├── index.html           # Página principal (única página HTML)
├── css/
│   └── styles.css       # Todos os estilos (responsive)
├── js/
│   ├── app.js           # Bootstrap da aplicação
│   ├── store.js         # Data layer (localStorage)
│   ├── router.js        # SPA Router
│   ├── home.js          # View: Home (lista de cursos)
│   └── course.js        # View: Course (detalhes e player)
└── README.md            # Documentação para usuários
```

### Padrão de Arquitetura
- **SPA (Single Page Application)**: Roteamento client-side sem refresh de página
- **Data Layer com localStorage**: Persistência de dados offline
- **Vanilla JavaScript**: Sem dependências externas (exceto Google Fonts)
- **Component-Based Views**: `HomeView` e `CourseView` como componentes principais

### Fluxo de Dados
```
User Interaction
    ↓
Router (URL change)
    ↓
View Component (render)
    ↓
Store (read/write data)
    ↓
localStorage (persist)
```

---

## 📦 Data Model

### Estrutura de Dados Principal

#### Índice de Cursos (localStorage key: `courses_index`)
```json
[
  {
    "id": "course_1707000000000_abc123",
    "title": "Meu Curso de Programação",
    "thumbnail": "https://i.ytimg.com/vi/..../mqdefault.jpg",
    "totalLessons": 30,
    "completedLessons": 12,
    "lastAccessed": "2026-02-09T10:30:00Z",
    "createdAt": "2026-01-15T08:00:00Z"
  }
]
```

#### Dados Completos de um Curso (localStorage key: `course_{id}`)
```json
{
  "id": "course_1707000000000_abc123",
  "title": "Meu Curso de Programação",
  "modules": [
    {
      "id": "mod_1",
      "title": "Módulo 1 - Introdução",
      "description": "Conceitos iniciais do curso...",
      "lessons": [
        {
          "id": "les_1_1",
          "number": 1,
          "title": "Aula 1 - Introdução",
          "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "videoId": "dQw4w9WgXcQ",
          "completed": true
        },
        {
          "id": "les_1_2",
          "number": 2,
          "title": "O que vamos aprender no módulo 01?",
          "url": "https://www.youtube.com/watch?v=jgQjeqGRdgA",
          "videoId": "jgQjeqGRdgA",
          "completed": false
        }
      ]
    }
  ]
}
```

#### Preferências do Usuário (localStorage key: `app_preferences`)
```json
{
  "theme": "dark",
  "lastCourseId": "course_1707000000000_abc123"
}
```

### IDs e Convenções
- **Course ID**: `course_{timestamp}_{random}`
- **Module ID**: `mod_{timestamp}_{random}`
- **Lesson ID**: `les_{timestamp}_{random}`
- Formato de data: ISO 8601 (UTC)

---

## 🎬 Funcionalidades

### 1. Home View - Gerenciamento de Cursos

#### Funcionalidades
- **Listar Cursos**: Grade de cards com todos os cursos
  - Thumbnail (primeira imagem de vídeo)
  - Título do curso
  - Progresso visual (barra)
  - Data de último acesso
  - Total de aulas vs concluídas

- **Criar Novo Curso**: Botão principal
  - Modal com opção "Manual" (criar vazio)
  - Modal com opção "Importar JSON"

- **Importar de Playlist YouTube**:
  - Interface de importação com instruções passo a passo
  - Script JavaScript para extrair dados da playlist
  - Validação de JSON
  - Mensagens de erro claras

- **Alternador de Tema**:
  - Alterna entre modo claro e escuro
  - Persiste preferência no localStorage

- **Empty State**: Mensagem quando nenhum curso está criado

#### Fluxo de Criar Novo Curso (Manual)
1. Clique em "Novo Curso"
2. Modal abre com formulário
3. Insira nome do curso
4. Sistema gera ID único
5. Cria curso vazio com 0 aulas
6. Redireciona para CourseView
7. Dados persistem em localStorage

#### Fluxo de Importar Playlist
1. Usuário abre playlist no YouTube
2. Rola até o final (carrega todos os vídeos)
3. Abre DevTools (F12)
4. Copia script fornecido no modal
5. Cola no console e executa
6. Recebe JSON com título, módulos e aulas
7. Cola JSON no campo "Importar JSON"
8. Sistema valida e importa
9. Cria curso com estrutura completa
10. Redireciona para CourseView

### 2. Course View - Visualização e Edição

#### Layout em 3 Painéis (Desktop)
```
┌─────────────────────────────────────────────┐
│ [←] Título do Curso        [☀️/🌙]         │
├──────────────┬──────────────────┬───────────┤
│              │                  │           │
│   SIDEBAR    │  VIDEO PLAYER    │  LESSON   │
│              │  + CONTROLS      │   LIST    │
│  • Busca     │  + INFO          │           │
│  • Progress  │                  │           │
│  • Módulos   │  [✓] Mark Done   │  Scroll   │
│  • Atalhos   │  [→] YouTube     │  through  │
│              │                  │  lessons  │
└──────────────┴──────────────────┴───────────┘
```

#### Sidebar
- **Busca Global**: Filtra aulas por título em tempo real
  - Campo de input com ícone de lupa
  - Botão limpar (aparece quando há texto)
  - Atualiza lista de aulas em tempo real

- **Progresso Geral**:
  - Barra visual de progresso
  - Texto: "X/Y aulas concluídas"
  - Percentual calculado dinamicamente

- **Navegação de Módulos**:
  - Lista de módulos (expansível/colapsável)
  - Indicador de progresso por módulo
  - Botão para adicionar novo módulo
  - Clique para selecionar módulo

- **Dicas de Atalhos**:
  - Alt + → = Próxima aula
  - Alt + ← = Aula anterior
  - Alt + M = Marcar como concluída
  - Esc = Limpar busca

#### Player de Vídeo
- **Video Container**:
  - Iframe responsivo do YouTube
  - Mantém proporção 16:9
  - Placeholder quando nenhuma aula selecionada

- **Informações da Aula**:
  - Título da aula
  - Módulo e número
  - Exemplo: "Módulo 1 • Aula 5"

- **Botões de Controle**:
  - **Marcar como Concluída**: Toggle on/off
    - Muda de cor/ícone quando ativo
    - Atualiza progresso geral
    - Persiste em localStorage

  - **Abrir no YouTube**: Link externo
    - Abre em nova aba
    - Aparece apenas para aulas com videoId

#### Painel de Aulas
- **Lista de Aulas do Módulo Selecionado**:
  - Card por aula com:
    - Número e título
    - Ícone de status (✓ quando concluída)
    - Número do módulo
    - Clicável para selecionar
    - Destaque visual quando selecionada

- **Busca Filtra Lista**:
  - Mostra apenas aulas que combinam com o termo
  - "Nenhuma aula encontrada" quando vazio

- **Botão Adicionar Aula**:
  - Abre modal inline para adicionar aula
  - Requer: título, URL (opcional)
  - Extrai videoId automaticamente da URL

#### Responsividade
- **Desktop (1200px+)**: 3 painéis lado a lado
- **Tablet (768px-1200px)**: 2 colunas (sidebar + conteúdo)
- **Mobile (< 768px)**: 1 coluna
  - Sidebar colapsável (hamburger menu)
  - Overlay quando sidebar aberta

### 3. Modais

#### Modal de Novo Curso
- **Tabs**: Manual | Importar JSON
- **Validação**: Nome obrigatório
- **Fechar**: Botão X ou click fora do modal
- **Ações**: Criar | Cancelar

#### Modal de Adicionar Aula/Módulo
- **Campo de Titulo**: Text input obrigatório
- **Campo de URL**: Text input (extrair videoId)
- **Botão Adicionar**: Cria e fecha modal
- **Validação**: Título mínimo 3 caracteres

### 4. Atalhos de Teclado

| Atalho | Ação | Context |
|--------|------|---------|
| `Alt + →` | Próxima aula | Em qualquer lugar |
| `Alt + ←` | Aula anterior | Em qualquer lugar |
| `Alt + M` | Marcar como concluída | Quando aula selecionada |
| `Esc` | Limpar busca | Quando há busca ativa |

---

## 🎨 Design

### Paleta de Cores

#### Modo Claro
- **Fundo primário**: #FFFFFF (branco)
- **Fundo secundário**: #F5F5F5 (cinza muito claro)
- **Texto primário**: #1a1a1a (quase preto)
- **Texto secundário**: #666666 (cinza escuro)
- **Border**: #E0E0E0 (cinza claro)
- **Accent**: #007BFF (azul)
- **Sucesso**: #28A745 (verde)
- **Aviso**: #FFC107 (amarelo)

#### Modo Escuro
- **Fundo primário**: #1a1a1a (quase preto)
- **Fundo secundário**: #2d2d2d (cinza escuro)
- **Texto primário**: #FFFFFF (branco)
- **Texto secundário**: #B0B0B0 (cinza claro)
- **Border**: #3d3d3d (cinza)
- **Accent**: #0D9FFF (azul claro)
- **Sucesso**: #4CAF50 (verde)
- **Aviso**: #FFB300 (amarelo escuro)

### Tipografia
- **Font**: Inter (via Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Headers**: 600 ou 700 (Inter)
- **Body**: 400 ou 500 (Inter)
- **Tamanho base**: 16px

### Componentes

#### Botão Primário
- Fundo: Accent color (#007BFF)
- Texto: Branco
- Padding: 8px 16px
- Border-radius: 4px
- Hover: Darker shade

#### Botão Secundário (Ghost)
- Fundo: Transparente
- Texto: Accent color
- Border: 1px accent color
- Hover: Fundo claro

#### Card
- Border-radius: 8px
- Box-shadow: 0 2px 4px rgba(0,0,0,0.1)
- Padding: 16px
- Hover: Shadow aumenta

#### Modal
- Overlay: 0.5 opacidade fundo
- Card: Border-radius 8px
- Backdrop: Blur (opcional)
- Close button: X no canto

### Responsividade

#### Breakpoints
- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Notebook**: 768px - 1200px
- **Desktop**: > 1200px

#### Grid System
- 12 colunas
- Gutter: 16px
- Padding: 16px (mobile), 24px (desktop)

---

## 🔧 Funcionalidades Técnicas

### localStorage

#### Chaves Utilizadas
- `courses_index`: Array de metadados de cursos
- `course_{id}`: Dados completos do curso
- `app_preferences`: Preferências do usuário (tema, último curso)

#### Limite de Armazenamento
- Típico: 5-10MB por domínio
- Aplicação atual: ~100KB-500KB (escala com quantidade de aulas)

#### Sincronização
- Index atualizado automaticamente ao salvar curso
- Não há sincronização em tempo real (cada aba é independente)

### Router (SPA)

#### Rotas
- `/home`: Home View (lista de cursos)
- `/course/:courseId`: Course View (detalhes)

#### Comportamento
- URL muda sem recarregar página
- Botão voltar funciona corretamente
- Deep linking funciona (pode compartilhar URLs)

### Tema (Dark Mode)

#### Implementação
- Toggle visual no header
- Classe `dark` adicionada ao `<html>`
- Estilos CSS diferenciam com `.dark`
- Preferência salva em localStorage

#### Alternância
- Botão de tema em ambas as views
- Transição suave entre temas

### Extração de Videos do YouTube

#### parseVideoId()
Extrai ID do video de diferentes formatos de URL:
- `https://www.youtube.com/watch?v=Ejkb_YpuHWs`
- `https://youtu.be/Ejkb_YpuHWs`
- `https://www.youtube.com/embed/Ejkb_YpuHWs`
- Resultado: `Ejkb_YpuHWs` (11 caracteres)

#### getThumbnailUrl()
Gera URL de thumbnail do YouTube:
- Padrão: `https://i.ytimg.com/vi/{videoId}/mqdefault.jpg`
- Qualidade: Média (320x180)

#### Iframes Responsivos
```html
<iframe
  src="https://www.youtube.com/embed/{videoId}"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>
```

### Busca e Filtro

#### Implementação
- Filtra em tempo real (sem debounce)
- Case-insensitive (toLowerCase)
- Busca em título da aula
- Atualiza lista de aulas dinamicamente

#### Performance
- Atualmente sem virtualization (adequado para < 1000 aulas)
- Search é local (não requer servidor)

### Migração de Dados Legados

#### Cenário
Aplicação tinha dados antigos em formato diferente. Sistema de migração:
1. Verifica se existe `courses_index`
2. Se não existir e `LEGACY_COURSE_DATA` estiver presente
3. Cria novo estrutura de dados
4. Preserva aulas marcadas como concluídas
5. Salva como novo formato
6. Remove dados antigos

---

## 🚀 Fluxos de Usuário

### Fluxo 1: Criar Novo Curso e Adicionar Aulas

```
1. Usuário clica [Novo Curso]
   ↓
2. Modal abre com campo "Nome do curso"
   ↓
3. Usuário digita "JavaScript Completo"
   ↓
4. Clica [Criar Curso]
   ↓
5. Sistema gera ID único (course_...)
   ↓
6. Cria índice e dados vazios
   ↓
7. Redireciona para /course/{id}
   ↓
8. HomeView mostra novo curso
   ↓
9. CourseView exibe "Selecione um módulo"
   ↓
10. Usuário clica [+ Adicionar Módulo]
    ↓
11. Modal pede título do módulo
    ↓
12. Cria módulo vazio
    ↓
13. Usuário clica [+ Adicionar Aula]
    ↓
14. Modal pede título e URL do video
    ↓
15. Sistema extrai videoId
    ↓
16. Salva aula no módulo
    ↓
17. Lista atualiza em tempo real
```

### Fluxo 2: Importar Playlist do YouTube

```
1. Usuário clica [Novo Curso]
   ↓
2. Modal abre, escolhe tab [Importar JSON]
   ↓
3. Vê instruções passo a passo
   ↓
4. Copia script JavaScript fornecido
   ↓
5. Abre playlist no YouTube
   ↓
6. Rola até o final (carrega todos os videos)
   ↓
7. Pressiona F12 → Console
   ↓
8. Cola script e executa
   ↓
9. Copia JSON do console
   ↓
10. Cola no textarea do modal
    ↓
11. Clica [Importar]
    ↓
12. Sistema valida JSON
    ↓
13. Se erro: mostra mensagem
    ↓
14. Se OK: cria curso com estrutura completa
    ↓
15. Redireciona para /course/{id}
```

### Fluxo 3: Acompanhar Progresso

```
1. Usuário em CourseView
   ↓
2. Seleciona módulo na sidebar
   ↓
3. Lista de aulas atualiza
   ↓
4. Clica em uma aula
   ↓
5. Video carrega no player
   ↓
6. Assiste a aula
   ↓
7. Clica [Marcar como Concluída]
   ↓
8. Ícone de ✓ aparece na lista
   ↓
9. Contador de progresso atualiza
   ↓
10. Barra de progresso anima
    ↓
11. Dados persistem em localStorage
    ↓
12. Mesmo após fechar/reabrir, progress mantém
```

### Fluxo 4: Buscar Aula

```
1. Usuário em CourseView
   ↓
2. Digita na barra de busca (sidebar)
   ↓
3. Sistema filtra aulas em tempo real
   ↓
4. Mostra apenas aulas que combinam
   ↓
5. Usuário clica em aula
   ↓
6. Video carrega normalmente
   ↓
7. Usuário clica [Esc] ou limpa busca
   ↓
8. Lista volta a mostrar todas as aulas do módulo
```

---

## 📱 Responsividade

### Desktop (1200px+)
- 3 painéis lado a lado
- Sidebar visível sempre
- Fonte padrão
- Espaçamento confortável

### Tablet (768px - 1200px)
- 2 colunas (sidebar + conteúdo)
- Sidebar pode ser colapsada
- Fonte ajustada
- Botões maiores para touch

### Mobile (< 768px)
- Single column layout
- Sidebar hamburger (colapsível)
- Sidebar em overlay quando aberto
- Fonte grande para legibilidade
- Botões otimizados para toque (44px min)

---

## 🔒 Segurança e Privacidade

### Dados Locais
- ✅ Nenhum dado é enviado para servidores
- ✅ Tudo fica no localStorage do navegador
- ✅ Sem coleta de dados pessoais
- ✅ Sem análise ou rastreamento

### Limpeza de Dados
- ⚠️ Limpar cache/cookies do navegador remove tudo
- ⚠️ Exportar dados antes de limpar (quando feature existir)
- ✅ Cada domínio tem seu próprio localStorage isolado

### Iframes do YouTube
- Usa embedded iframes padrão (domain-restricted)
- Sem acesso a dados do localStorage do app
- YouTube é uma terceira parte, tem sua política

---

## 🌐 Compatibilidade

### Navegadores Suportados
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### APIs Necessárias
- localStorage
- ES6+ (arrow functions, template literals, etc)
- Fetch API (para iframes)
- DOM APIs padrão

### Fallbacks
- Sem localStorage: App não funciona (graceful degradation)
- Sem Fetch: Iframes do YouTube não carregam

---

---

## 🛠️ Desenvolvimento

### Stack Tecnológico
- **HTML5**: Semântica
- **CSS3**: Grid, Flexbox, Media Queries, Custom Properties
- **JavaScript ES6+**: Vanilla (sem frameworks)
- **localStorage**: Persistência
- **Fonts**: Google Fonts (Inter)
- **Icons**: Inline SVG

### Dependências Externas
- Google Fonts (CDN)
- YouTube (para iframes de videos)
- **Nenhuma dependência npm!**

### Estrutura de Arquivos

#### `index.html`
- Único arquivo HTML
- 2 views: `#home-view`, `#course-view`
- Modais para criar/editar
- Scripts inline carregam em ordem

#### `styles.css`
- CSS Modules pattern (sem scoping)
- CSS Custom Properties para cores
- Media queries organizadas
- Tema claro/escuro com `.dark` class

#### `app.js`
- Bootstrap da aplicação
- Inicializa router e views
- Setup de event listeners globais
- Migração de dados legados

#### `store.js`
- Data access layer
- CRUD de cursos, módulos, aulas
- Cálculo de progresso
- Importação/exportação

#### `router.js`
- SPA Router customizado
- Hash-based routing (#/home, #/course/:id)
- Suporta deep linking
- History API nativa

#### `home.js`
- HomeView component
- Renderiza grid de cursos
- Gerencia modais de criação/importação
- Alternador de tema

#### `course.js`
- CourseView component
- Renderiza 3 painéis
- Gerencia seleção de módulo/aula
- Atualiza player de video

---

## 📝 Funcionalidades Planejadas

### v1.1
- [ ] Editar nome/descrição de cursos
- [ ] Deletar cursos com confirmação
- [ ] Reordenar módulos e aulas (drag & drop)
- [ ] Editar módulos e aulas
- [ ] Duplicar curso

### v1.2
- [ ] Exportar curso como JSON
- [ ] Importar JSON de arquivo
- [ ] Estatísticas de progresso (tempo/velocidade)
- [ ] Certificados simples
- [ ] Tags/categorias de cursos

### v1.3
- [ ] Sincronização com nuvem (Google Drive/Dropbox)
- [ ] Multi-dispositivo
- [ ] Compartilhamento de cursos
- [ ] Discussões por aula (comentários)
- [ ] Notas por aula

---

## 🐛 Known Issues (Versão 1.0)

- [ ] Busca não funciona em tempo real sem debounce (pode ficar lento com muitas aulas)
- [ ] Modo escuro não tem transição suave
- [ ] Iframes do YouTube não são lazy-loaded
- [ ] Sem suporte para offline de videos (sempre requer internet)

---

## 🚀 Deployment

### Como Usar
1. Abra `index.html` no navegador
2. Nenhuma build necessária
3. Nenhum servidor necessário
4. Funciona como arquivo local (file://) ou hospedado

### Opções de Hospedagem
- GitHub Pages (grátis)
- Netlify (grátis)
- Vercel (grátis)
- Qualquer hosting estático

### Instruções (GitHub Pages)
```bash
# 1. Crie repositório
# 2. Coloque arquivos em /rota-do-estudo
# 3. Ative Pages em Settings → Pages
# 4. Deploy automático quando fazer push
# 5. Acesse em https://usuario.github.io/repo/rota-do-estudo/
```

---

## 📖 Documentação do Usuário

### Para Usuários Finais
- Ver: `README.md` na pasta do app
- Covers: Como usar, atalhos, troubleshooting

### Para Desenvolvedores
- **Store API**: `store.js` tem todos os métodos
- **Router API**: `router.js` define rotas
- **View API**: `home.js` e `course.js` são exemplos

---

## 📞 Suporte

### Problemas Comuns

**Os videos não carregam?**
- Verifique conexão com internet
- YouTube pode estar bloqueado em sua rede
- Tente em outro navegador

**Perdi meu progresso?**
- Limpar cache/cookies remove dados
- localStorage é por domínio
- Use exportação quando feature chegar

**Aula não aparece na busca?**
- Busca é case-insensitive
- Tente buscar por palavra-chave
- Verifique se está no módulo certo

---

## 📄 Versioning

### v1.0 (Atual)
- ✅ Create/Import cursos
- ✅ Organize com módulos e aulas
- ✅ Rastreamento de progresso
- ✅ Player YouTube embutido
- ✅ Busca global
- ✅ Tema claro/escuro
- ✅ Responsivo
- ✅ Offline-first
- ✅ Atalhos de teclado

---

## 🎓 Créditos

- **Projeto**: Rota do Estudo (rotadoestudo.com.br)
- **Ano**: 2026

---

## 📋 Checklist de Funcionalidades

### Essenciais ✅
- [x] Home com lista de cursos
- [x] Criar novo curso
- [x] Importar playlist YouTube
- [x] Visualizar aulas
- [x] Player de vídeo
- [x] Marcar como concluído
- [x] Rastreador de progresso
- [x] Busca global
- [x] Tema claro/escuro
- [x] Responsivo
- [x] Persistência offline
- [x] Atalhos de teclado

### Importantes ⏳
- [ ] Editar/deletar cursos
- [ ] Reordenar aulas
- [ ] Notas por aula
- [ ] Estatísticas

### Nice-to-Have 🚀
- [ ] Sincronização nuvem
- [ ] Certificados
- [ ] Compartilhamento
- [ ] Discussões
- [ ] App mobile

---

**Documento criado em:** Fevereiro 2026
**Última atualização:** 2026-02-09
**Próxima revisão:** v1.1 ou quando major feature ser adicionada
