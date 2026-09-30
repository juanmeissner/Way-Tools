# Way Tools

Extensão Chrome Manifest V3 com ferramentas internas predefinidas. Ela inclui **Mensagens Personalizadas v3.5**, com as 16 mensagens fornecidas no backup JSON, alertas de inatividade e notificações de novas mensagens; **ERP — Copiar Dados v1.6**; **Interface Compacta v3.4 + Temas v1.2 para Matrix e ERP**; **Matrix — Corrigir Colagem v3.5**; e **Corretor Ortográfico PRO v3.2** para ChatWoot, Matrix e ERP, incluindo o editor ProseMirror do chat.

O modo escuro do ERP inclui uma camada adaptativa para telas e modais carregados dinamicamente. Ela corrige superfícies claras, textos escuros e bordas incompatíveis, preservando as cores funcionais de alertas, estados e ações.

O Corretor Ortográfico PRO possui mais de 500 correções seguras, termos padronizados de atendimento, redes e telecom, proteção de URLs, e-mails, IPs e códigos, alertas para palavras ambíguas e um dicionário pessoal armazenado somente no navegador.

## Instalar no Chrome para teste

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `Way Tools` que fica dentro deste projeto.
5. Abra `https://ia-nocodb.internetway.com.br/` e recarregue a página.

O ícone do Way Tools permite ativar ou desativar cada script. Depois de alterar uma chave, use **Recarregar página** no próprio painel.

O painel também permite configurar as notificações de novas mensagens do ChatWoot: desativadas, padrão do Windows, 1 segundo, 2 segundos, 5 segundos, 10 segundos, 30 segundos, 1 minuto ou persistentes até clicar/fechar. O padrão para novas configurações é **5 segundos**, e qualquer preferência já salva pelo usuário continua sendo respeitada. A configuração é aplicada imediatamente às próximas notificações.

As notificações diferenciam mensagens recebidas do cliente das mensagens enviadas pelo atendente. Por padrão, elas são silenciadas enquanto a aba do ChatWoot está visível e em foco, evitando avisos durante o próprio atendimento. O painel permite liberar também os avisos em primeiro plano, se o usuário preferir.

Cada aviso usa somente o nome do cliente como título e exibe a prévia da mensagem logo abaixo.

Na tela **Alertas de inatividade** do ChatWoot, cada nível pode gerar uma notificação própria quando o atendimento entrar em 🟡 Atenção, 🟠 Atenção elevada ou 🔴 Crítico. As três opções são independentes, vêm desativadas por padrão e usam os limites em minutos definidos pelo usuário.

A soma de não lidas no título da aba e as notificações de novas mensagens ou inatividade consideram somente as conversas exibidas na aba **Minhas**. As demais abas do ChatWoot são ignoradas para notificações.

O título da aba do ChatWoot mostra, em tempo real, a soma das mensagens não visualizadas de todos os cards carregados. Quando não há mensagens pendentes, o contador é removido automaticamente.

No ERP e no Matrix, o botão de lua/sol no canto inferior direito alterna rapidamente entre os temas claro e escuro. O painel da extensão também oferece os comandos **Tema claro**, **Tema escuro** e **Tema automático**. O atalho `Alt+D` alterna entre claro e escuro.

## Estrutura

- `Way Tools/manifest.json`: manifesto da extensão.
- `Way Tools/128.png`: logotipo de 128 × 128 pixels.
- `Way Tools/config/scripts.js`: catálogo exibido no painel.
- `Way Tools/data/mensagens-nativas.json`: fonte das mensagens instaladas por padrão.
- `Way Tools/config/default-messages.js`: catálogo nativo gerado do JSON.
- `Way Tools/config/spelling-dictionary.js`: vocabulário nativo do corretor.
- `Way Tools/content/runtime.js`: ativação e armazenamento isolado por script.
- `Way Tools/content/message-notification-policy.js`: detecção e deduplicação de novas mensagens.
- `Way Tools/content/spelling-engine.js`: motor ortográfico independente e testável.
- `Way Tools/background/service-worker.js`: notificações do sistema e retorno à aba do atendimento.
- `Way Tools/scripts/way-mensagens.js`: script original adaptado.
- `Way Tools/scripts/way-erp-copiar-dados.js`: ferramentas de cópia do ERP.
- `Way Tools/scripts/way-interface-compacta.js`: interface compacta para Matrix e ERP, com temas claro, escuro e automático integrados nos dois sistemas.
- `Way Tools/scripts/matrix-corrigir-colagem.js`: preserva quebras, negrito e imagens durante a colagem no Matrix.
- `Way Tools/scripts/way-corretor-ortografico-pro.js`: correção automática PT-BR no ChatWoot, Matrix e ERP.
- `Way Tools/popup/`: painel da extensão.
- `docs/index.html`: política de privacidade pública, pronta para GitHub Pages.
- `store-assets/`: imagens usadas na ficha da Chrome Web Store.

Os dados ficam em `chrome.storage.local`, no perfil do navegador. A extensão solicita acesso somente ao domínio configurado no script.

O painel da extensão permite adicionar correções pessoais e exceções em **Dicionário pessoal**. As alterações são sincronizadas imediatamente com as páginas compatíveis que já estiverem abertas, sem exigir recarregamento.

Em uma instalação nova, o script usa as mensagens nativas automaticamente. Se o usuário já tiver mensagens salvas, elas têm prioridade e não são substituídas durante uma atualização. A importação JSON continua disponível para restauração de backups e conjuntos personalizados.

## Validar

```powershell
npm test
```

## Gerar pacote

```powershell
npm run package
```

O pacote é criado em `release/way-tools-v0.6.6.zip`.

## Antes de publicar

1. Teste a extensão no Chrome com **Carregar sem compactação** e confirme o funcionamento dentro do sistema autenticado.
2. Se a publicação exigir a vinculação ao domínio da organização, verifique a propriedade do site no Google Search Console.
3. No Painel do desenvolvedor da Chrome Web Store, escolha a visibilidade adequada: pública, não listada, particular ou por grupos.
4. Envie `release/way-tools-v0.6.6.zip` para a Chrome Web Store.
5. Para distribuição corporativa, configure a instalação e as permissões no Google Admin Console ou por Política de Grupo do Windows.

A publicação e as políticas administrativas exigem acesso às contas da organização e não são realizadas automaticamente pelo projeto.
