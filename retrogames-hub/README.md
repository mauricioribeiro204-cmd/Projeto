# RetroGames Hub

Biblioteca visual em HTML, CSS e JavaScript para quatro clássicos do PlayStation 2:

- Need for Speed Underground 2
- Grand Theft Auto: San Andreas
- Bully
- Black

## Abrir
Com o GitHub Pages do repositório `mauricioribeiro204-cmd/Projeto` configurado para publicar `main` / `(root)`, abra:

https://mauricioribeiro204-cmd.github.io/Projeto/retrogames-hub/

A página é independente de `/Projeto/index.html` (Meu Controle), que **não foi alterado**.

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
- `app.js`: ações dos botões, busca, favoritos, detecção de gamepad e abertura do emulador.
- `manifest.webmanifest`: dados do app/atalho.
- `icon.svg`: ícone próprio.

Fontes: [Play!.js](https://playjs.purei.org/) e [código do Play!](https://github.com/jpd002/Play-).

Esta biblioteca é independente, sem afiliação com Sony, Rockstar Games, EA Games ou Criterion Games.
