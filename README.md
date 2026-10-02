# Way Tools

Extensão Chrome Manifest V3 com ferramentas internas predefinidas. Ela inclui **Mensagens Personalizadas v3.7** no ChatWoot; **Matrix — Mensagens Personalizadas v1.0**, com os mesmos 16 comandos nativos; **ERP — Copiar Dados v1.6**; **ERP — Gerador de Relato v1.1**, com rota dinâmica por motivo e produto; interfaces compactas independentes para ERP e Matrix; temas opcionais separados; **Matrix — Corrigir Colagem v3.5**; e **Corretor Ortográfico PRO v3.2** para ChatWoot, ERP e Matrix.

Por padrão, **ERP — Gerador de Relato**, **ERP — Interface Compacta**, **Matrix — Mensagens Personalizadas**, **Matrix — Interface Compacta** e **Matrix — Corrigir Colagem** iniciam ativados. Os temas do ERP e do Matrix permanecem desativados até que o usuário os habilite manualmente. **ERP — Tema Claro/Escuro** continua identificado com a etiqueta **BETA**. As escolhas feitas no painel ficam preservadas no navegador.

O modo escuro do ERP inclui uma camada adaptativa para telas e modais carregados dinamicamente. Ela corrige superfícies claras, textos escuros e bordas incompatíveis, preservando as cores funcionais de alertas, estados e ações.

Os recursos do Matrix ficam em módulos próprios e não compartilham chave de ativação, configurações ou execução com o ERP. Interface compacta, tema e correção de colagem podem ser ativados separadamente. A correção de colagem preserva quebras de linha, negrito e a colagem nativa de imagens.

No modelo clássico do Matrix, digitar `!` no campo de mensagem abre os comandos do Way Tools. O catálogo de mensagens é único e compartilhado com o ChatWoot: inclusões, edições, exclusões, importações e restaurações feitas em qualquer um dos sistemas aparecem no outro, inclusive quando as duas páginas já estão abertas. O botão com o ícone da extensão, inserido na barra de ações do atendimento, abre a configuração das mensagens, importação e exportação JSON. As tags `{{nome}}`, `{{nomecliente}}`, `{{email}}`, `{{telefone}}`, `{{cpf}}`, `{{endereco}}` e `{{protocolo}}` são preenchidas com os dados disponíveis no atendimento; `{{nome}}` utiliza somente o primeiro nome do atendente.

O Corretor Ortográfico PRO funciona nos campos de mensagem do ChatWoot, ERP e Matrix. Ele possui mais de 500 correções seguras, termos padronizados de atendimento, redes e telecom, proteção de URLs, e-mails, IPs e códigos, alertas para palavras ambíguas e um único dicionário pessoal armazenado somente no navegador.

No editor de relato do ERP, o botão **Gerar relato** abre um assistente com etapas para identificar o cliente, classificar produtos e problemas, registrar solicitações, verificações, medições, ajustes, resultado e eventual visita técnica. A prévia somente é inserida no campo após confirmação e permanece editável antes de salvar o atendimento.

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

Na tela **Alertas de inatividade** do ChatWoot, cada nível gera uma notificação própria quando o atendimento entra em 🟡 Atenção aos 2 minutos, 🟠 Atenção elevada aos 5 minutos ou 🔴 Crítico aos 10 minutos. As três opções vêm ativadas por padrão, podem ser configuradas de forma independente e continuam respeitando qualquer escolha já salva pelo usuário.

A soma de não lidas no título da aba continua refletindo os cards carregados da área **Minhas**. Já as notificações de novas mensagens e inatividade usam os eventos em tempo real e a lista autenticada de conversas atribuídas ao atendente, por isso continuam funcionando em outras telas do ChatWoot, em outra aba do navegador ou com a janela minimizada. Conversas de outros atendentes, não atribuídas, encerradas ou atribuídas a robôs são ignoradas.

O título da aba do ChatWoot mostra, em tempo real, a soma das mensagens não visualizadas de todos os cards carregados. Quando não há mensagens pendentes, o contador é removido automaticamente.

No ERP, o botão de lua/sol no canto inferior direito alterna rapidamente entre os temas claro e escuro. O painel da extensão também oferece os comandos **Tema claro**, **Tema escuro** e **Tema automático**. O atalho `Alt+D` alterna entre claro e escuro.

## Estrutura

- `Way Tools/manifest.json`: manifesto da extensão.
- `Way Tools/128.png`: logotipo de 128 × 128 pixels.
- `Way Tools/config/scripts.js`: catálogo exibido no painel.
- `Way Tools/data/mensagens-nativas.json`: fonte das mensagens instaladas por padrão.
- `Way Tools/config/default-messages.js`: catálogo nativo gerado do JSON.
- `Way Tools/config/spelling-dictionary.js`: vocabulário nativo do corretor.
- `Way Tools/content/runtime.js`: ativação, armazenamento isolado por script e catálogo compartilhado entre ChatWoot e Matrix.
- `Way Tools/content/chatwoot-realtime-bridge.js`: ponte local e sanitizada para eventos em tempo real e conversas atribuídas no ChatWoot.
- `Way Tools/content/message-notification-policy.js`: detecção e deduplicação de novas mensagens.
- `Way Tools/content/spelling-engine.js`: motor ortográfico independente e testável.
- `Way Tools/background/service-worker.js`: notificações do sistema e retorno à aba do atendimento.
- `Way Tools/scripts/way-mensagens.js`: script original adaptado.
- `Way Tools/scripts/way-erp-copiar-dados.js`: ferramentas de cópia do ERP.
- `Way Tools/scripts/way-erp-gerador-relato.js`: assistente com rota dinâmica para compor e inserir o relato no editor do ERP.
- `Way Tools/scripts/way-interface-compacta.js`: interface compacta exclusiva do ERP.
- `Way Tools/scripts/way-erp-temas.js`: temas claro, escuro e automático exclusivos do ERP.
- `Way Tools/scripts/matrix-mensagens.js`: comandos, tags e configuração de mensagens no Matrix clássico.
- `Way Tools/scripts/matrix-interface-compacta.js`: interface compacta exclusiva do Matrix.
- `Way Tools/scripts/matrix-temas.js`: temas claro, escuro e automático exclusivos do Matrix.
- `Way Tools/scripts/matrix-corrigir-colagem.js`: preservação de formatação e imagens ao colar no Matrix.
- `Way Tools/scripts/way-corretor-ortografico-pro.js`: correção automática PT-BR no ChatWoot, ERP e Matrix.
- `Way Tools/popup/`: painel da extensão.
- `docs/index.html`: política de privacidade pública, pronta para GitHub Pages.
- `store-assets/`: imagens usadas na ficha da Chrome Web Store.

Os dados ficam em `chrome.storage.local`, no perfil do navegador. A extensão solicita acesso somente ao domínio configurado no script.

O painel da extensão permite adicionar correções pessoais e exceções em **Dicionário pessoal**. As alterações são sincronizadas imediatamente com as páginas compatíveis que já estiverem abertas, sem exigir recarregamento.

Em uma instalação nova, os scripts usam as mensagens nativas automaticamente. Se o usuário já tiver mensagens salvas no ChatWoot, elas são migradas para o catálogo compartilhado, têm prioridade e não são substituídas durante uma atualização. A importação JSON continua disponível para restauração de backups e conjuntos personalizados.

## Validar

```powershell
npm test
```

## Conferir alterações desde o último commit

```powershell
npm run commit:context
```

O comando usa o último commit do Git como marco e mostra sua data, título, versão atual e todos os arquivos modificados ou criados depois dele. Assim que um novo commit for realizado, ele se torna automaticamente a próxima referência para gerar títulos e descrições completos.

## Gerar pacote

```powershell
npm run package
```

O pacote é criado em `release/way-tools-v0.6.9.zip`.

## Antes de publicar

1. Teste a extensão no Chrome com **Carregar sem compactação** e confirme o funcionamento dentro do sistema autenticado.
2. Se a publicação exigir a vinculação ao domínio da organização, verifique a propriedade do site no Google Search Console.
3. No Painel do desenvolvedor da Chrome Web Store, escolha a visibilidade adequada: pública, não listada, particular ou por grupos.
4. Envie `release/way-tools-v0.6.9.zip` para a Chrome Web Store.
5. Para distribuição corporativa, configure a instalação e as permissões no Google Admin Console ou por Política de Grupo do Windows.

A publicação e as políticas administrativas exigem acesso às contas da organização e não são realizadas automaticamente pelo projeto.
