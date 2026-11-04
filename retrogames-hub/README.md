# RetroGames Hub

Biblioteca visual em HTML, CSS e JavaScript para cinco clássicos do PlayStation 2:

- Need for Speed Underground 2
- Grand Theft Auto: San Andreas
- Bully
- Black
- Guitar Hero III: Legends of Rock

## Abrir
Com o GitHub Pages do repositório `mauricioribeiro204-cmd/Projeto` configurado para publicar `main` / `(root)`, abra:

https://mauricioribeiro204-cmd.github.io/Projeto/retrogames-hub/

A página é independente de `/Projeto/index.html` (Meu Controle), que **não foi alterado**.

## Pasta de ISOs lembrada

Na seção **Minha pasta de ISOs**, clique em **Conectar pasta**, escolha uma pasta no Windows (por exemplo, `D:\\RetroGames\\PS2`) e autorize o acesso. O navegador lista jogos com extensões `.iso`, `.chd`, `.cso`, `.isz`, `.bin` e `.elf` (inclusive em subpastas até três níveis). Os cinco clássicos são vinculados automaticamente quando o nome do arquivo é reconhecido; você pode escolher a correspondência manualmente nos menus **Vincular a**.

O projeto guarda **a referência à pasta** no armazenamento IndexedDB deste navegador, não o caminho completo em texto e não os arquivos ISO. Ao abrir novamente o site, ele tenta ler a pasta e atualizar a lista. Se a permissão tiver expirado, use **Reconectar pasta** e permita a leitura. No Chrome recente, conceder acesso permanente ou instalar o app pode permitir uma experiência com menos solicitações. As permissões dependem do navegador e do usuário.

**Privacidade:** a pasta e os títulos dos arquivos são lidos só no dispositivo. Não há servidor, upload de ISO ou envio de BIOS ao GitHub. Desconectar remove a referência à pasta e os vínculos locais, mas não apaga os arquivos físicos.

**Compatibilidade:** o acesso persistente a diretórios exige desktop Chrome ou Edge. Em navegadores sem `showDirectoryPicker`, o aplicativo oferece uma seleção de pasta *temporária*, que precisa ser repetida após recarregar.

**Limite atual:** o Play!.js oficial está em outro domínio e **não recebe automaticamente** as ISOs identificadas aqui. O botão Jogar abre seu emulador oficial em outra aba, e você escolhe o arquivo local no seletor dele. Para executar automaticamente o jogo já vinculado, seria necessária uma versão do motor Play! hospedada no próprio projeto, adaptada para consumir esses arquivos e validada para cada jogo.

## Mostrar somente os jogos presentes na pasta

A biblioteca fica **vazia até o usuário conceder acesso a uma pasta local**. Após conectar, aparecem **somente os títulos que tenham uma ISO reconhecida e vinculada**: Need for Speed Underground 2, GTA San Andreas, Bully, Black e Guitar Hero III. Os arquivos são reconhecidos pelo nome; arquivos com nome genérico podem ser associados pelo menu **Vincular a**.

O destaque principal muda de acordo com o jogo selecionado e a interface utiliza um visual minimalista inspirado em consoles modernos, sem reproduzir marcas/ativos da interface oficial do PS5.

Se a pasta estiver vazia, for desconectada ou o navegador não puder mais lê-la, as capas desaparecem até que o acesso seja restabelecido. A busca e os favoritos filtram **apenas** os jogos localizados. Jogos ausentes não são oferecidos como se estivessem disponíveis.

## Como jogar
1. Abra a biblioteca no computador.
2. Clique na capa ou no botão **Jogar**.
3. A página oficial do emulador [Play!.js](https://playjs.purei.org/) abre em outra aba.
4. Escolha a **ISO local de um jogo que você possui** no seletor de arquivos do emulador.
5. Use o teclado indicado na própria página do emulador.

O Play!.js **não exige BIOS externa**; utiliza emulação de BIOS em alto nível. Não é possível passar automaticamente o arquivo ISO de um domínio GitHub Pages para o domínio do Play!.js. O botão abre o emulador, mas não inicia automaticamente o jogo selecionado. Para emulação na mesma página é preciso integrar/buildar o motor web do Play! (WebAssembly + JavaScript) no projeto, além de testar compatibilidade e desempenho jogo a jogo.

O Play!.js é experimental; a compatibilidade com esses quatro títulos **não foi validada nesta integração**. Priorize um computador com Chrome/Firefox recente. O indicador de controle nesta biblioteca detecta gamepads conectados, mas **não garante** que o player oficial use o gamepad — os controles de teclado estão na página do Play!.

## Privacidade e direitos autorais
O repositório contém **somente código, ilustrações originais em CSS/SVG e configuração do site**. Não hospeda nem distribui jogos, BIOS ou ISOs. Arquivos comerciais devem ser obtidos legalmente pelo usuário e carregados diretamente no emulador. Favoritos e último jogo aberto são gravados apenas no `localStorage` deste navegador. Isso não sincroniza os dados entre aparelhos e pode ser apagado ao limpar os dados do site.

## Instalar como atalho
No navegador, escolha **Adicionar à tela inicial** / **Instalar aplicativo**, quando a opção estiver disponível. A biblioteca pode abrir como app; **jogar PS2 no iPhone não é garantido**, pois a versão web do emulador é experimental e seu principal modo de controle é o teclado.

## Projeto
- `index.html`: biblioteca e interface.
- `styles.css`: visual responsivo e ilustrações dos jogos feitas com CSS/SVG.
- `app.js`: ações dos botões, seleção de jogos disponíveis, busca, favoritos, detecção de gamepad e abertura do emulador.
- `iso-folder.js`: seleção/lembrança de pasta no IndexedDB, varredura de ISOs, permissões, vínculos por jogo.
- `iso-folder.css`: apresentação dos arquivos encontrados na pasta.
- `ps5.css`: estilo minimalista inspirado em consoles atuais.
- `manifest.webmanifest`: dados do app/atalho.
- `icon.svg`: ícone próprio.

Fontes: [Play!.js](https://playjs.purei.org/) e [código do Play!](https://github.com/jpd002/Play-).

Esta biblioteca é independente, sem afiliação com Sony, Rockstar Games, EA Games ou Criterion Games.
