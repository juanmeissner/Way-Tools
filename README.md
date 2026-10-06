# Way Tools

Extensão Chrome Manifest V3 com ferramentas internas predefinidas. Ela inclui **Mensagens Personalizadas v3.10** no ChatWoot; **Matrix — Mensagens Personalizadas v1.1**, com catálogo compartilhado; **ERP — Copiar Dados v1.6**; **ERP — Gerador de Relato v1.13**, com rota dinâmica, suporte ao Way Vision, rascunho automático e estúdio visual de desenvolvimento; interfaces compactas independentes para ERP e Matrix; temas opcionais separados; **Matrix — Corrigir Colagem v3.5**; e **Corretor Ortográfico PRO v3.2** para ChatWoot, ERP e Matrix.

Por padrão, **ERP — Gerador de Relato**, **ERP — Interface Compacta**, **Matrix — Mensagens Personalizadas**, **Matrix — Interface Compacta**, **Matrix — Tema Claro/Escuro** e **Matrix — Corrigir Colagem** iniciam ativados. O tema do ERP permanece desativado até que o usuário o habilite manualmente e continua identificado com a etiqueta **BETA**. As escolhas feitas no painel ficam preservadas no navegador.

## Atualização 0.7.2 — resumo desde a versão 0.6.9

### Mensagens e perfis de atendimento

- Separa os catálogos **N2** e **SAC**, preserva a escolha do setor após atualizações e mantém personalizações, exclusões e mensagens criadas pelo usuário em uma camada independente dos padrões oficiais.
- Centraliza categorias, pesquisa por conteúdo, sinônimos e palavras relacionadas, além de favoritos, usados recentemente, ordem personalizada, duplicação, pré-visualização, aviso de tags pendentes e histórico local para desfazer alterações.
- Compartilha imediatamente o catálogo ativo entre ChatWoot e Matrix, inclusive quando as duas páginas já estão abertas.
- Adiciona ao N2 e ao SAC os comandos `!enviarimagem`, que anexa uma imagem nativa sem enviá-la automaticamente, e `!ocorrencia`, com a orientação de indisponibilidade regional.
- Adapta o menu de comandos ao zoom e à área visível do navegador, escolhendo automaticamente onde abrir no ChatWoot e no Matrix.
- Acrescenta a variação `{{genero:masculino|feminino}}` e um seletor acessível por clique, setas e Enter. O `!agradecimento` passa a inserir “ajudá-lo” ou “ajudá-la” conforme a escolha, sem enviar a mensagem automaticamente.
- Cria um estúdio de desenvolvimento para montar, revisar, ordenar, auditar, importar e exportar catálogos N2 e SAC. O rascunho inicial reúne 42 comandos planejados para o SAC, mantendo inativos os textos que ainda aguardam aprovação.

### ChatWoot, notificações e diagnóstico

- Torna o acompanhamento de conversas atribuídas ao atendente independente da tela atualmente aberta, usando eventos em tempo real e a lista autenticada de atendimentos do próprio usuário.
- Mantém os alertas de novas mensagens e de inatividade funcionando em outras páginas, abas ou com o navegador minimizado, sem considerar conversas de outros atendentes, robôs, filas gerais ou atendimentos encerrados.
- Agenda os alertas de inatividade, por padrão, apenas quando a última mensagem foi enviada pelo agente; o comportamento dos alertas visuais continua configurável separadamente.
- Corrige o encerramento das notificações, o clique para abrir a conversa, a reconciliação de alarmes e o tratamento seguro de páginas abertas durante a atualização da extensão.
- Detecta instalações simultâneas do Way Tools e elege apenas uma responsável pelas notificações, evitando avisos duplicados quando coexistirem a versão da Chrome Web Store e uma instalação manual.
- Adiciona uma central de diagnóstico com perfil ativo, módulos habilitados, estado dos catálogos, conexão em tempo real e possíveis conflitos entre instalações.

### Gerador de Relato do ERP

- Evolui o Gerador de Relato para a versão **1.13**, com rotas dinâmicas, opções prioritárias, rascunho automático por atendimento, botão de reset e inserção somente após confirmação.
- Cria o relato rápido de **Chat sem interação**, com a opção padrão **Sem interação** para atendimentos receptivos sem tentativa ativa de contato.
- Separa a lentidão entre Wi-Fi e cabo, identifica redes de **2,4 GHz** e **5 GHz** e prioriza as verificações e orientações adequadas à rota selecionada.
- Adiciona o produto **Way Vision**, com problemas, verificações, medições, ações, solicitações e motivos de visita próprios para câmeras de segurança.
- Inclui troca do controle remoto da TV Box por danos, contato ativo como finalização e diversas regras de destaque contextual.
- Para **Internet → Sem acesso à internet**, prioriza a consulta ao log **RADIUS** para verificar autenticação e a conferência no **NME/NCE** para confirmar se a conexão está linkando.
- Cria um estúdio visual no modo desenvolvedor para editar etapas, categorias, opções, vínculos, prioridades e ordens, testar o modal e exportar o catálogo completo em JSON.

### Configuração, backup e documentação

- Cria um backup completo do Way Tools com exportação, restauração por mesclagem ou substituição e possibilidade de desfazer a última importação sem atingir dados externos à extensão.
- Divide responsabilidades antes concentradas em arquivos grandes, separando gerenciamento de catálogos, experiência das mensagens, backup, diagnóstico e estilos do ChatWoot.
- Mantém duas cópias sincronizadas da política de privacidade: a principal dentro da extensão e a versão pública destinada ao GitHub Pages.
- Ativa por padrão o **Matrix — Tema Claro/Escuro** em novas instalações, mantendo o tema do ERP opcional, desativado e identificado como **BETA**.

### Qualidade e empacotamento

- Atualiza o Manifest V3 e o pacote para **0.7.2**, Mensagens Personalizadas para **3.10**, Matrix Mensagens para **1.1** e ERP Gerador de Relato para **1.13**.
- Amplia a validação estrutural para 26 arquivos JavaScript e 27 recursos e adiciona 14 testes funcionais para catálogos, preferências, atualizações, backup, segurança e integrações entre ChatWoot e Matrix.
- Integra a geração do catálogo nativo e a sincronização da política de privacidade ao processo de empacotamento.

O modo escuro do ERP inclui uma camada adaptativa para telas e modais carregados dinamicamente. Ela corrige superfícies claras, textos escuros e bordas incompatíveis, preservando as cores funcionais de alertas, estados e ações.

Os recursos do Matrix ficam em módulos próprios e não compartilham chave de ativação, configurações ou execução com o ERP. Interface compacta, tema e correção de colagem podem ser ativados separadamente. A correção de colagem preserva quebras de linha, negrito e a colagem nativa de imagens.

No modelo clássico do Matrix, digitar `!` no campo de mensagem abre os comandos do Way Tools. O catálogo ativo é compartilhado com o ChatWoot: inclusões, edições, exclusões, importações e restaurações feitas em qualquer um dos sistemas aparecem no outro, inclusive quando as duas páginas já estão abertas. O botão com o ícone da extensão, inserido na barra de ações do atendimento, abre a configuração das mensagens, importação e exportação JSON. As tags `{{nome}}`, `{{nomecliente}}`, `{{email}}`, `{{telefone}}`, `{{cpf}}`, `{{endereco}}` e `{{protocolo}}` são preenchidas com os dados disponíveis no atendimento; `{{nome}}` utiliza somente o primeiro nome do atendente.

Mensagens podem usar a variação `{{genero:texto masculino|texto feminino}}`. Antes da inserção, o ChatWoot e o Matrix exibem um seletor grande de masculino ou feminino, operado por clique, setas e Enter. O comando `!agradecimento` usa esse recurso para inserir automaticamente “ajudá-lo” ou “ajudá-la”, mantendo também a saudação adequada para manhã, tarde ou noite e sem enviar a mensagem ao cliente.

O menu aberto ao digitar `!` adapta sua largura, altura e posição ao zoom do Chrome. No ChatWoot e no Matrix, ele escolhe automaticamente o lado com mais espaço, limita a lista à área visível e se reposiciona durante zoom, rolagem ou redimensionamento da janela.

Na primeira abertura do painel, o usuário escolhe entre os perfis **N2** e **SAC**. O N2 mantém as mensagens padrão atuais; o SAC começa com os comandos oficiais `!enviarimagem` e `!ocorrencia` enquanto o restante do catálogo textual aguarda aprovação. Cada perfil possui versão, categorias e estado de personalização independentes, e a troca em **Configurações → Setor de atendimento** é aplicada imediatamente no ChatWoot e no Matrix. A escolha fica preservada localmente e em uma preferência sincronizada do Chrome; após atualizar a extensão, o Way Tools restaura o perfil automaticamente e só volta a perguntar quando nenhuma escolha válida puder ser recuperada.

Na categoria **Orientações**, o comando `!enviarimagem` está disponível para N2 e SAC. Ele carrega `assets/mensagens/enviarimagem.png` e anexa o arquivo ao compositor do ChatWoot ou do Matrix para conferência, sem enviar a mensagem automaticamente.

Também em **Orientações**, `!ocorrencia` informa que uma ocorrência regional já está sendo tratada pela equipe técnica, com previsão de normalização em até quatro horas. O texto é compartilhado pelos perfis N2 e SAC.

O perfil ativo fica identificado no painel da extensão e nos editores de mensagens. A busca dos comandos aceita palavras do conteúdo, categoria, sinônimos e palavras relacionadas, ignorando diferenças de acentuação. ChatWoot e Matrix também compartilham favoritos, atalhos usados recentemente, ordem personalizada de categorias e mensagens, pré-visualização antes da inserção e avisos para tags que não puderam ser preenchidas. O editor permite duplicar uma mensagem para criar variações e mantém até 20 estados anteriores do catálogo para desfazer alterações acidentais.

A **Central de diagnóstico**, disponível nas configurações, apresenta versão instalada, perfil ativo, quantidade de módulos habilitados, tamanho dos catálogos, última alteração compartilhada, estado da conexão em tempo real do ChatWoot e possíveis conflitos entre instalações.

Em **Configurações → Backup completo**, o usuário pode exportar todos os dados persistentes do Way Tools para um único JSON e restaurá-los em outro perfil do Chrome. A importação oferece os modos **Mesclar** e **Substituir** e sempre cria um ponto de restauração local antes de alterar os dados. O botão **Desfazer última importação** recupera esse estado anterior. Chaves externas à extensão nunca são exportadas nem removidas.

O modo desenvolvedor inclui um **Estúdio de Catálogos de Mensagens** isolado dos atendimentos. Nele é possível alternar entre SAC e N2, criar, editar, duplicar, excluir e ordenar mensagens, alterar seus textos, variações por horário, automações de disponibilidade, visita e imagem, sinônimos, palavras relacionadas, tags e estado de aprovação. O mesmo ambiente cria e edita categorias compartilhadas ou exclusivas de cada perfil, mantém versões independentes, apresenta pré-visualização e auditoria estrutural, aceita importação e exporta um JSON compatível com o catálogo nativo. O rascunho é salvo em `chrome.storage.local`, sobrevive às atualizações da extensão e não altera o ChatWoot ou o Matrix até ser revisado e incorporado ao código.

Na primeira abertura do estúdio, o arquivo `mensagens-sac-rascunho.json` é combinado com o catálogo nativo para disponibilizar os 42 comandos SAC planejados e o primeiro pacote recomendado de 12 mensagens. Textos ainda não elaborados aparecem como pendências, mas não impedem a exportação do rascunho. Como esses conteúdos dependem de validação comercial e contratual, nenhuma mensagem desse rascunho é ativada antes da aprovação; somente os comandos já incorporados oficialmente ficam disponíveis.

Os pacotes oficiais usam IDs estáveis e uma camada de personalização separada. Quando uma atualização acrescentar mensagens ao N2 ou ao SAC, as novidades serão mescladas automaticamente sem substituir mensagens editadas ou criadas pelo usuário. Exclusões de mensagens oficiais também são lembradas. As categorias ficam em uma única fonte compartilhada e podem ser destinadas ao N2, ao SAC ou aos dois setores, evitando diferenças entre o ChatWoot e o Matrix.

Ao evoluir `mensagens-nativas.json`, a versão do perfil deve ser incrementada e os IDs existentes não devem ser alterados. A lista `idsNativosLegados` representa somente os IDs que já existiam antes da adoção do catálogo versionado e deve permanecer congelada; mensagens oficiais novas recebem IDs inéditos, preferencialmente iniciados pelo setor, como `sac-...`.

O Corretor Ortográfico PRO funciona nos campos de mensagem do ChatWoot, ERP e Matrix. Ele possui mais de 500 correções seguras, termos padronizados de atendimento, redes e telecom, proteção de URLs, e-mails, IPs e códigos, alertas para palavras ambíguas e um único dicionário pessoal armazenado somente no navegador.

No editor de relato do ERP, o botão **Gerar relato** abre um assistente com etapas para identificar o cliente, classificar produtos e problemas, registrar solicitações, verificações, medições, ajustes, resultado e eventual visita técnica. O modo **Chat sem interação** cria um relato curto sem exigir produto ou etapas técnicas. Ao marcar **Internet → Lentidão**, o assistente pergunta se o problema ocorre no **Wi-Fi**, no **cabo** ou em ambos; para Wi-Fi, também registra se o dispositivo está conectado em **2,4 GHz**, **5 GHz** ou nas duas frequências. A rota selecionada prioriza testes específicos de rádio ou de rede cabeada na aba de verificações, mas eles só entram no relato quando o atendente confirma que foram realizados. A finalização também permite registrar que **será realizado contato ativo com o cliente**.

Ao selecionar **Internet → Sem acesso à internet**, a etapa de verificações prioriza a consulta ao **log RADIUS**, para confirmar se a conexão está autenticando, e a conferência no **NME/NCE**, para verificar se ela está linkando. As duas opções ficam restritas a esse cenário e somente entram no relato quando o atendente marcar que realizou cada análise.

Na rota **Solicitação → TV Box**, o assistente oferece **Troca do controle remoto da TV Box por danos**. Quando selecionada, a verificação dos danos físicos e do funcionamento do controle remoto aparece como recomendação prioritária antes da conclusão do relato.

No relato rápido de **Chat sem interação**, a opção padrão de tentativas fica como **Sem interação**, adequada ao atendimento receptivo em que o cliente abriu a conversa, mas não enviou mensagem. Como seu valor é vazio, nenhuma frase de tentativa é incluída no relato. Na rota **Internet → Lentidão**, a etapa de ações oferece e prioriza a orientação sobre as diferenças e o uso adequado das redes de **2,4 GHz e 5 GHz**.

O produto **Way Vision** possui uma rota própria para câmeras de segurança, com problemas de energia, conectividade, imagem ao vivo, gravações, armazenamento, visão noturna, detecção de movimento, notificações, áudio, acesso remoto, compartilhamento e controle PTZ. Cada cenário prioriza as verificações correspondentes e oferece medições, solicitações, ações corretivas e motivos de visita técnica específicos para câmeras.

O Gerador de Relato mantém um rascunho automático separado por atendimento na sessão da aba. Se o modal for fechado sem inserir o relato, todos os campos marcados e preenchidos, além da etapa atual, são restaurados ao abrir novamente. O rascunho é removido ao inserir o relato, ao clicar em **Resetar formulário** e confirmar a limpeza ou ao encerrar a aba do ERP; assim, dados de atendimentos diferentes não são misturados nem mantidos indefinidamente.

O painel possui um modo desenvolvedor oculto para validar e planejar o Gerador de Relato sem abrir um atendimento real. Ele é liberado ao clicar sete vezes, em até quatro segundos, sobre o número da versão no cabeçalho. Em **Configurações → Modo desenvolvedor**, o botão **Testar Gerador de Relato** abre um estúdio interno com as seis etapas, busca, prévia e edição de etapas, categorias e opções. Um editor visual permite relacionar cada opção a produtos, motivos do contato, solicitações e problemas por meio de caixas de seleção; por exemplo, uma verificação pode aparecer somente após marcar troca de senha ou alteração do nome do Wi-Fi. Cada opção também possui ordem normal, ordem entre prioritárias e uma escolha que define se ela deve receber destaque ao ficar disponível. Novas opções compatíveis começam como prioritárias, mas essa marcação pode ser desativada sem remover seus vínculos. Os botões **Subir** e **Descer** reorganizam a lista sem exigir números manuais. As alterações ficam salvas localmente e o botão **Simular modal atual** recarrega o gerador usando imediatamente a proposta editada. Também é possível copiar ou exportar o JSON completo, auditar referências e restaurar o catálogo original do código. O projeto não altera o gerador usado no ERP até que o JSON seja revisado e incorporado ao código.

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

Por padrão, esses alertas do Chrome são agendados somente quando a última mensagem da conversa foi enviada pelo agente. Se a última mensagem foi enviada pelo cliente, qualquer agendamento de inatividade é cancelado. Essa regra pode ser alterada na própria tela **Alertas de inatividade** pela opção **Notificar somente após mensagem do agente**.

Os alertas visuais dos cards continuam, por padrão, indicando inatividade tanto após mensagens do cliente quanto do agente. A opção separada **Alertas visuais somente após mensagem do agente** permite restringir também as cores dos cards, mas inicia desativada.

A soma de não lidas no título da aba continua refletindo os cards carregados da área **Minhas**. Já as notificações de novas mensagens e inatividade usam os eventos em tempo real e a lista autenticada de conversas atribuídas ao atendente, por isso continuam funcionando em outras telas do ChatWoot, em outra aba do navegador ou com a janela minimizada. Conversas de outros atendentes, não atribuídas, encerradas ou atribuídas a robôs são ignoradas.

Quando o Chrome atualiza ou recarrega a extensão enquanto o ChatWoot permanece aberto, a página antiga deixa de fazer chamadas ao contexto encerrado e mostra apenas um aviso para recarregar a aba. Após a recarga, o Way Tools reconcilia os alertas persistentes com a lista atual de conversas atribuídas, removendo agendamentos que ficaram obsoletos.

Se duas instalações do Way Tools estiverem ativas no mesmo ChatWoot, elas identificam uma à outra pelo ID e versão publicados somente na própria página. Apenas uma instalação permanece responsável pelas notificações: a extensão oficial da Chrome Web Store tem prioridade; sem ela, vence a versão mais recente e, em empate, um critério fixo pelo ID. A outra cópia pausa seus avisos, remove seus alarmes pendentes e apresenta uma orientação para desinstalar a duplicata, sem solicitar a permissão `management`.

O título da aba do ChatWoot mostra, em tempo real, a soma das mensagens não visualizadas de todos os cards carregados. Quando não há mensagens pendentes, o contador é removido automaticamente.

No ERP, o botão de lua/sol no canto inferior direito alterna rapidamente entre os temas claro e escuro. O painel da extensão também oferece os comandos **Tema claro**, **Tema escuro** e **Tema automático**. O atalho `Alt+D` alterna entre claro e escuro.

## Estrutura

- `Way Tools/manifest.json`: manifesto da extensão.
- `Way Tools/128.png`: logotipo de 128 × 128 pixels.
- `Way Tools/assets/mensagens/`: imagens nativas anexadas pelos comandos de atendimento; `enviarimagem.png` é utilizada pelo comando `!enviarimagem`.
- `Way Tools/config/scripts.js`: catálogo exibido no painel.
- `Way Tools/data/mensagens-nativas.json`: fonte das mensagens instaladas por padrão.
- `Way Tools/config/default-messages.js`: catálogo nativo gerado do JSON.
- `Way Tools/content/message-catalog-manager.js`: migração versionada e mesclagem segura de mensagens oficiais, personalizações e exclusões dos perfis N2 e SAC.
- `Way Tools/content/message-experience.js`: pesquisa, sinônimos, favoritos, recentes, ordenação, histórico e validação de tags dos catálogos.
- `Way Tools/content/backup-manager.js`: exportação, validação, restauração e rollback do backup completo.
- `Way Tools/config/spelling-dictionary.js`: vocabulário nativo do corretor.
- `Way Tools/content/runtime.js`: ativação, armazenamento isolado por script e catálogo compartilhado entre ChatWoot e Matrix.
- `Way Tools/content/instance-coordinator.js`: detecta instalações simultâneas e elege uma única responsável pelas notificações do ChatWoot.
- `Way Tools/content/chatwoot-realtime-bridge.js`: ponte local e sanitizada para eventos em tempo real e conversas atribuídas no ChatWoot.
- `Way Tools/content/message-notification-policy.js`: detecção e deduplicação de novas mensagens.
- `Way Tools/content/spelling-engine.js`: motor ortográfico independente e testável.
- `Way Tools/background/service-worker.js`: notificações do sistema e retorno à aba do atendimento.
- `Way Tools/scripts/way-mensagens.js`: script original adaptado.
- `Way Tools/styles/way-mensagens.css`: camada visual do módulo de mensagens do ChatWoot, separada da lógica principal.
- `Way Tools/scripts/way-erp-copiar-dados.js`: ferramentas de cópia do ERP.
- `Way Tools/scripts/way-erp-gerador-relato.js`: assistente com rota dinâmica para compor e inserir o relato no editor do ERP.
- `Way Tools/scripts/way-interface-compacta.js`: interface compacta exclusiva do ERP.
- `Way Tools/scripts/way-erp-temas.js`: temas claro, escuro e automático exclusivos do ERP.
- `Way Tools/scripts/matrix-mensagens.js`: comandos, tags e configuração de mensagens no Matrix clássico.
- `Way Tools/scripts/matrix-interface-compacta.js`: interface compacta exclusiva do Matrix.
- `Way Tools/scripts/matrix-temas.js`: temas claro, escuro e automático exclusivos do Matrix.
- `Way Tools/scripts/matrix-corrigir-colagem.js`: preservação de formatação e imagens ao colar no Matrix.
- `Way Tools/scripts/way-corretor-ortografico-pro.js`: correção automática PT-BR no ChatWoot, ERP e Matrix.
- `Way Tools/data/mensagens-sac-rascunho.json`: proposta estruturada do catálogo SAC, sem ativação automática.
- `Way Tools/developer/`: ambientes internos para testar o Gerador de Relato e desenvolver os catálogos SAC e N2 sem alterar os atendimentos.
- `Way Tools/popup/`: painel da extensão, com diagnóstico isolado em módulo próprio.
- `Way Tools/docs/index.html`: política de privacidade principal, acessível diretamente pelo painel da extensão.
- `docs/index.html`: cópia sincronizada da política principal, pronta para GitHub Pages.
- `store-assets/`: imagens usadas na ficha da Chrome Web Store.

Os dados ficam em `chrome.storage.local`, no perfil do navegador. Esse armazenamento não é apagado durante atualizações normais da extensão, portanto mensagens criadas ou modificadas continuam disponíveis na versão seguinte. Os catálogos N2 e SAC são preservados separadamente; eles só podem ser perdidos se a extensão for desinstalada, os dados do perfil forem removidos ou o navegador for redefinido. A extensão solicita acesso somente ao domínio configurado no script.

O painel da extensão permite adicionar correções pessoais e exceções em **Dicionário pessoal**. As alterações são sincronizadas imediatamente com as páginas compatíveis que já estiverem abertas, sem exigir recarregamento.

Em uma instalação nova, o perfil N2 usa as mensagens nativas automaticamente. Se o usuário já tiver mensagens salvas em uma versão anterior, elas são migradas para o catálogo N2, têm prioridade e não são substituídas durante uma atualização. O perfil SAC começa com os comandos oficiais `!enviarimagem` e `!ocorrencia` e mantém suas próprias mensagens. Novas mensagens oficiais são incorporadas conforme a versão do pacote, preservando substituições, exclusões e mensagens pessoais. A importação JSON continua disponível para restauração de backups e conjuntos personalizados no perfil que estiver ativo.

## Validar

```powershell
npm test
```

Além da validação estrutural da extensão, o comando executa testes funcionais dos catálogos N2 e SAC. Eles simulam ChatWoot e Matrix usando o mesmo armazenamento, troca e isolamento de perfis, atualizações oficiais futuras, preservação de personalizações e exclusões, inicialização no `chrome.storage.local`, pesquisa por sinônimos e conteúdo, favoritos, recentes, ordenação, histórico para desfazer, identificação de tags pendentes e proteção contra IDs ou comandos duplicados. O backup também é testado nos modos de exportação, mesclagem, substituição e rollback, incluindo a preservação de dados externos à extensão. O catálogo SAC é validado para garantir que seus rascunhos não sejam ativados antes da aprovação.

## Conferir alterações desde o último commit

```powershell
npm run commit:context
```

O comando usa o último commit do Git como marco e mostra sua data, título, versão atual e todos os arquivos modificados ou criados depois dele. Assim que um novo commit for realizado, ele se torna automaticamente a próxima referência para gerar títulos e descrições completos.

## Gerar pacote

```powershell
npm run package
```

O pacote é criado em `release/way-tools-v0.7.2.zip`.

## Antes de publicar

1. Teste a extensão no Chrome com **Carregar sem compactação** e confirme o funcionamento dentro do sistema autenticado.
2. Se a publicação exigir a vinculação ao domínio da organização, verifique a propriedade do site no Google Search Console.
3. No Painel do desenvolvedor da Chrome Web Store, escolha a visibilidade adequada: pública, não listada, particular ou por grupos.
4. Envie `release/way-tools-v0.7.2.zip` para a Chrome Web Store.
5. Para distribuição corporativa, configure a instalação e as permissões no Google Admin Console ou por Política de Grupo do Windows.

A publicação e as políticas administrativas exigem acesso às contas da organização e não são realizadas automaticamente pelo projeto.
