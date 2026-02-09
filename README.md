# Rota do Estudo

Transforme playlists do YouTube em cursos organizados e acompanhe seu progresso de estudos.

**Acesse agora:** [rota-do-estudo.vercel.app](https://rota-do-estudo.vercel.app/#/home)

Gratuito, sem cadastro, sem instalação. Tudo funciona direto no navegador.

---

## Como criar um curso

Você tem duas formas de criar um curso: importando uma playlist do YouTube ou adicionando vídeos manualmente.

### Importar playlist do YouTube (recomendado)

Esse método importa todos os vídeos de uma playlist de uma vez.

1. Abra a **playlist completa** no YouTube e role até o final para carregar todos os vídeos
2. No [Rota do Estudo](https://rota-do-estudo.vercel.app/#/home), clique em **"Novo Curso"** e depois na aba **"Importar JSON"**
3. Copie o código que aparece na caixa "Código para o Console"
4. Volte para a aba do YouTube, pressione `F12` para abrir o Console do navegador, cole o código e pressione `Enter`
5. Copie o resultado gerado (um bloco de texto em formato JSON)
6. Volte ao Rota do Estudo, cole no campo "Cole o JSON gerado aqui" e clique em **"Importar"**

Pronto! Seu curso foi criado com todos os vídeos organizados em módulos.

### Criar manualmente

1. Clique em **"Novo Curso"**
2. Digite um nome para o curso e clique em **"Criar Curso"**
3. Dentro do curso, clique em **"+"** ao lado de "Módulos" para criar um módulo
4. Clique em **"+"** ao lado de "Aulas do Módulo" para adicionar aulas com links do YouTube

---

## Como estudar

1. Na tela inicial, clique no curso que você quer estudar
2. Selecione um **módulo** na barra lateral esquerda
3. Clique em uma **aula** para assistir o vídeo
4. Quando terminar, clique em **"Marcar como Concluída"**
5. Acompanhe seu progresso pela barra de progresso na lateral

---

## Exportar e importar backup

Você pode exportar todos os seus cursos, módulos, aulas e progresso em um único arquivo JSON. Isso permite transferir seus dados para outro navegador ou dispositivo.

### Exportar

1. Na tela inicial, clique no ícone de **engrenagem** no canto superior direito
2. Clique em **"Exportar"**
3. Um arquivo `rota-do-estudo-backup-YYYY-MM-DD.json` será baixado no seu computador

### Importar

1. Na tela inicial, clique no ícone de **engrenagem**
2. Clique em **"Importar"**
3. Selecione o arquivo `.json` do backup
4. Todos os cursos do arquivo serão adicionados aos seus cursos existentes

---

## Dicas

**Atalhos de teclado:**
- `Alt` + `→` = Próxima aula
- `Alt` + `←` = Aula anterior
- `Alt` + `M` = Marcar como concluída

**Busca:** Use o campo de busca na barra lateral para encontrar qualquer aula pelo nome.

**Tema escuro:** Clique no ícone de **engrenagem** no canto superior direito e selecione **"Modo Escuro"** ou **"Modo Claro"**.

**Extensão Chrome:** Existe uma extensão que permite adicionar vídeos ao seu curso com um clique direto do YouTube. [Veja como instalar](INSTALL_EXTENSION.md).

---

## Perguntas frequentes

**Meu progresso fica salvo?**
Sim. Tudo é salvo automaticamente no seu navegador. Se você fechar a página e voltar depois, seu progresso estará lá. Mas se você limpar o cache/dados do navegador, os dados serão apagados. Para evitar perder seus dados, use a função de **exportar backup**.

**Funciona no celular?**
Sim. A interface se adapta a qualquer tamanho de tela.

**É grátis?**
Sim, 100% grátis e open source.

**Meus dados são compartilhados?**
Não. Tudo fica salvo localmente no seu navegador. Nenhum dado é enviado para servidores.

**Um vídeo não carrega, e agora?**
Alguns criadores bloqueiam a incorporação do vídeo em outros sites. Nesse caso, use o botão "Abrir no YouTube" para assistir direto na plataforma.

---

Feito por [Lucas Boni](https://github.com/lucasbonidm) | [Código fonte](https://github.com/lucasbonidm/rota-do-estudo)
