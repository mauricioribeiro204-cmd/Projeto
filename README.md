# Meu Controle 2.0 — Dark Premium

Aplicativo PWA para finanças pessoais e hábitos, preparado para instalação na tela inicial do iPhone.

## Publicação com GitHub Pages

1. Este repositório contém somente o código do aplicativo, **sem os lançamentos financeiros pessoais**.
2. Em **Settings → General → Danger Zone → Change repository visibility**, altere o repositório para **Public** (confirme a mudança).
3. Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/(root)` e salve.
4. Depois da publicação, abra `https://mauricioribeiro204-cmd.github.io/Projeto/` no Safari do iPhone.
5. No Safari, toque em **Compartilhar → Adicionar à Tela de Início** e ative **Abrir como App**.
6. No aplicativo instalado, vá a **Ajustes → Importar meus dados** e selecione o backup JSON privado armazenado no app Arquivos.

## Privacidade

- **Não publique** o arquivo `MEUS_DADOS_PRIVADO_NAO_ENVIAR_GITHUB.json`, seus backups, planilhas financeiras, capturas de tela com informações privadas ou versões antigas do aplicativo que incluam dados pessoais.
- O endereço do GitHub Pages e o código do aplicativo serão públicos. Os dados importados são guardados no armazenamento local do dispositivo; eles não são enviados ao GitHub nem sincronizados automaticamente.
- O armazenamento local não possui criptografia própria nem login. Exporte backups periódicos e mantenha o iPhone protegido por senha/biometria.
- Importar um backup JSON no iPhone **substitui** os dados locais do aplicativo. Guarde uma cópia antes de importar.

## Verificação da publicação

Após configurar **Settings → Pages → Deploy from a branch → main → /(root)**, aguarde o primeiro deploy. Se o endereço mostrar 404, confirme a configuração na página de Pages e consulte a aba **Actions** para conferir a implantação. Os dados financeiros privados não fazem parte deste repositório.
