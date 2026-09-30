# Way Tools

Extensão Chrome Manifest V3 com ferramentas internas predefinidas. Ela inclui **Mensagens Personalizadas v3.4**, com as 16 mensagens fornecidas no backup JSON; **ERP — Copiar Dados v1.4**; **Interface Compacta v3.4 + Tema Matrix v1.1**; e **Corretor Ortográfico PRO v3.2** para IA NocoDB, Matrix e ERP, incluindo o editor ProseMirror do chat.

O Corretor Ortográfico PRO possui mais de 500 correções seguras, termos padronizados de atendimento, redes e telecom, proteção de URLs, e-mails, IPs e códigos, alertas para palavras ambíguas e um dicionário pessoal armazenado somente no navegador.

## Instalar no Chrome para teste

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `Way Tools` que fica dentro deste projeto.
5. Abra `https://ia-nocodb.internetway.com.br/` e recarregue a página.

O ícone do Way Tools permite ativar ou desativar cada script. Depois de alterar uma chave, use **Recarregar página** no próprio painel.

## Estrutura

- `Way Tools/manifest.json`: manifesto da extensão.
- `Way Tools/128.png`: logotipo de 128 × 128 pixels.
- `Way Tools/config/scripts.js`: catálogo exibido no painel.
- `Way Tools/data/mensagens-nativas.json`: fonte das mensagens instaladas por padrão.
- `Way Tools/config/default-messages.js`: catálogo nativo gerado do JSON.
- `Way Tools/config/spelling-dictionary.js`: vocabulário nativo do corretor.
- `Way Tools/content/runtime.js`: ativação e armazenamento isolado por script.
- `Way Tools/content/spelling-engine.js`: motor ortográfico independente e testável.
- `Way Tools/scripts/way-mensagens.js`: script original adaptado.
- `Way Tools/scripts/way-erp-copiar-dados.js`: ferramentas de cópia do ERP.
- `Way Tools/scripts/way-interface-compacta.js`: interface compacta para Matrix e ERP, com tema claro/escuro integrado somente no Matrix.
- `Way Tools/scripts/way-corretor-ortografico-pro.js`: correção automática PT-BR no IA NocoDB, Matrix e ERP.
- `Way Tools/popup/`: painel da extensão.
- `docs/index.html`: política de privacidade pública, pronta para GitHub Pages.
- `store-assets/`: imagens usadas na ficha da Chrome Web Store.

Os dados ficam em `chrome.storage.local`, no perfil do navegador. A extensão solicita acesso somente ao domínio configurado no script.

O painel da extensão permite adicionar correções pessoais e exceções em **Dicionário pessoal**. Depois de alterar o dicionário, recarregue a página do sistema para aplicar.

Em uma instalação nova, o script usa as mensagens nativas automaticamente. Se o usuário já tiver mensagens salvas, elas têm prioridade e não são substituídas durante uma atualização. A importação JSON continua disponível para restauração de backups e conjuntos personalizados.

## Validar

```powershell
npm test
```

## Gerar pacote

```powershell
npm run package
```

O pacote é criado em `release/way-tools-v0.7.0.zip`.

## Antes de publicar

1. Teste a extensão no Chrome com **Carregar sem compactação** e confirme o funcionamento dentro do sistema autenticado.
2. Se a publicação exigir a vinculação ao domínio da organização, verifique a propriedade do site no Google Search Console.
3. No Painel do desenvolvedor da Chrome Web Store, escolha a visibilidade adequada: pública, não listada, particular ou por grupos.
4. Envie `release/way-tools-v0.7.0.zip` para a Chrome Web Store.
5. Para distribuição corporativa, configure a instalação e as permissões no Google Admin Console ou por Política de Grupo do Windows.

A publicação e as políticas administrativas exigem acesso às contas da organização e não são realizadas automaticamente pelo projeto.
