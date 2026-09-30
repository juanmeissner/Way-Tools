/*
 * Way Tools - Mensagens Personalizadas v3.5
 * Adaptado do userscript fornecido para o runtime nativo da extensão.
 */

globalThis.WayToolsRuntime.run("way-mensagens", (storage) => {
    "use strict";

    const GM_getValue = storage.getValue;
    const GM_setValue = storage.setValue;
// ==UserScript==
// @name         Way - Mensagens Personalizadas
// @namespace    way-mensagens-personalizadas
// @version      3.5
// @description  Mensagens personalizadas com dados do cliente, tags globais, autocomplete, visita técnica, alertas de inatividade, notificações de novas mensagens e backup JSON
// @match        https://ia-nocodb.internetway.com.br/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';


    /* =========================================================
       CONFIGURAÇÕES
       ========================================================= */

    const CONFIG = {
        prefixoComando: '!',
        storageKey: 'way-mensagens-personalizadas-v1',
        storageAlertasKey: 'way-mensagens-alertas-inatividade-v1',

        intervaloVerificacao: 2500,
        intervaloTema: 1200,

        versaoBackup: 9,

        autocomplete: {
            maxResultadosBusca: 30,
            larguraMinima: 760,
            larguraMaxima: 1100,
            percentualTela: 0.82,
            alturaMaxima: 460
        }
    };


    const ALERTAS_INATIVIDADE_PADRAO = {
        ativo: true,
        amarelo: 2,
        laranja: 5,
        vermelho: 10,
        notificarAmarelo: false,
        notificarLaranja: false,
        notificarVermelho: false
    };


    const POLITICA_NOTIFICACOES =
        globalThis.WayToolsMessageNotificationPolicy;


    const ESTADO_NOTIFICACOES = {
        inicioAquecimento: 0,
        duracaoAquecimento: 5000,
        conversas: new Map(),
        idsElementos: new WeakMap(),
        proximoIdElemento: 1
    };


    const CHAVE_NOTIFICAR_EM_PRIMEIRO_PLANO =
        'wayTools.notifications.whenFocused';


    const PREFERENCIAS_NOTIFICACOES = {
        notificarEmPrimeiroPlano: false
    };


    const ESTADO_TITULO_NAO_LIDAS = {
        tituloBase: '',
        ultimoTituloAplicado: ''
    };


    const ESTADO_NOTIFICACOES_INATIVIDADE = {
        inicioAquecimento: 0,
        duracaoAquecimento: 5000,
        conversas: new Map()
    };


    const NIVEIS_NOTIFICACAO_INATIVIDADE = Object.freeze({
        yellow: {
            ordem: 1,
            configuracao: 'notificarAmarelo',
            rotulo: 'Atenção',
            icone: '🟡'
        },

        orange: {
            ordem: 2,
            configuracao: 'notificarLaranja',
            rotulo: 'Atenção elevada',
            icone: '🟠'
        },

        red: {
            ordem: 3,
            configuracao: 'notificarVermelho',
            rotulo: 'Crítico',
            icone: '🔴'
        }
    });


    /* =========================================================
       CATEGORIAS
       ========================================================= */

    const CATEGORIAS = {
        abertura: {
            label: '👋 Abertura de atendimento'
        },

        diagnostico: {
            label: '🔎 Diagnóstico inicial'
        },

        ajustes: {
            label: '🛠️ Ajustes na conexão'
        },

        agendamento: {
            label: '📅 Agendamento de visita técnica'
        },

        ausencia: {
            label: '⏳ Gestão de ausência'
        },

        encerramento: {
            label: '✅ Encerramento de atendimento'
        },

        iptv: {
            label: '📺 IPTV'
        },

        cameras: {
            label: '🎥 Câmeras'
        },

        documentos: {
            label: '📄 Solicitação de documentos'
        },

        velocidade: {
            label: '🚀 Teste de velocidade'
        },

        orientacoes: {
            label: '📡 Orientações'
        }
    };


    const CATEGORIA_SEM_CATEGORIA =
        '__sem_categoria__';


    /* =========================================================
       TAGS GLOBAIS
       ========================================================= */

    const TAGS_GLOBAIS = {
        nome: {
            label: 'Nome do atendente',
            icone: '👨‍💻'
        },

        nomecliente: {
            label: 'Nome do cliente',
            icone: '👤'
        },

        email: {
            label: 'E-mail do cliente',
            icone: '📧'
        },

        telefone: {
            label: 'Telefone do cliente',
            icone: '📱'
        },

        cpf: {
            label: 'CPF do cliente',
            icone: '🪪'
        },

        endereco: {
            label: 'Endereço do cliente',
            icone: '📍'
        },

        protocolo: {
            label: 'Protocolo do atendimento',
            icone: '🎫'
        }
    };


    /* =========================================================
       PERÍODOS
       ========================================================= */

    const PERIODOS_ATENDIMENTO = {
        manha: {
            nome: 'Manhã',
            inicio: '08:00h',
            fim: '12:00h'
        },

        tarde: {
            nome: 'Tarde',
            inicio: '13:00h',
            fim: '17:00h'
        },

        noite: {
            nome: 'Noite',
            inicio: '18:00h',
            fim: '20:00h'
        }
    };


    /* =========================================================
       TEMPLATE PADRÃO VISITA
       ========================================================= */

    const TEMPLATE_VISITA_PADRAO =
`✅ **Visita Técnica Agendada com Sucesso**

👤 **Nome:** {{nomecliente}}
📍 **Endereço:** {{endereco}}
📅 **Dia:** {{data}}
🌤️ **Período:** {{periodo}}
📱 **Telefone:** {{telefone}}
🕐 **Previsão de atendimento:** {{horario}}
🔢 **Protocolo:** {{protocolo}}

📲 **Confirmação da visita**
O setor de agendamento enviará uma mensagem via **WhatsApp** para confirmar a visita. **É importante responder à mensagem** para que o agendamento seja validado.

🚗 **Deslocamento do técnico**
Assim que o técnico iniciar o deslocamento até o endereço, você receberá um **SMS** com a **placa e os dados do veículo** do profissional responsável pela execução da ordem de serviço.

⚠️ **Importante:**
É necessário que haja **uma pessoa maior de 18 anos no local** para receber o técnico.

🔄 **Precisa reagendar?**
Caso não possa receber o técnico no período agendado, basta responder à mensagem de confirmação enviada pelo WhatsApp solicitando um novo horário ou entrar em contato com nossa equipe.

Estamos à disposição e teremos prazer em atendê-lo! 😊`;


    /* =========================================================
       TAGS VISITA
       ========================================================= */

    const TAGS_VISITA = {
        nomecliente: {
            label: 'Nome do cliente',
            icone: '👤',
            tipo: 'text'
        },

        email: {
            label: 'E-mail',
            icone: '📧',
            tipo: 'email'
        },

        telefone: {
            label: 'Telefone',
            icone: '📱',
            tipo: 'tel'
        },

        cpf: {
            label: 'CPF',
            icone: '🪪',
            tipo: 'text'
        },

        endereco: {
            label: 'Endereço',
            icone: '📍',
            tipo: 'textarea'
        },

        data: {
            label: 'Data da visita',
            icone: '📅',
            tipo: 'date'
        },

        periodo: {
            label: 'Período',
            icone: '🌤️',
            tipo: 'periodo'
        },

        horario: {
            label: 'Previsão de atendimento',
            icone: '🕐',
            tipo: 'text'
        },

        protocolo: {
            label: 'Protocolo',
            icone: '🎫',
            tipo: 'text'
        },

        nome: {
            label: 'Nome do atendente',
            icone: '👨‍💻',
            tipo: 'text'
        }
    };


    /* =========================================================
       ESTADO
       ========================================================= */

    let mensagemEmEdicaoId = null;

    let campoChatDisponibilidade = null;

    let campoChatVisita = null;

    let ultimoTemaDetectado = '';

    let abaConfiguracaoAtual =
        'mensagens';

    let configuracaoAlertasInatividadeCache =
        null;

    let observadorLayoutTelaAlertas =
        null;

    let handlerResizeTelaAlertas =
        null;

    let handlerCliqueNavegacaoTelaAlertas =
        null;


    const autocompleteState = {
        campo: null,
        popup: null,
        modo: 'categorias',
        categoriaSelecionada: '',
        categorias: [],
        mensagens: [],
        indice: 0
    };


    /* =========================================================
       HELPERS
       ========================================================= */

    function gerarId() {
        return (
            Date.now().toString(36) +
            '-' +
            Math.random().toString(36).slice(2, 9)
        );
    }


    function escaparHTML(
        texto
    ) {
        return String(
            texto ?? ''
        )
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );
    }


    function normalizarEspacos(
        texto
    ) {
        return String(
            texto ?? ''
        )
            .replace(
                /\s+/g,
                ' '
            )
            .trim();
    }


    function somenteNumeros(
        valor
    ) {
        return String(
            valor ?? ''
        )
            .replace(
                /\D/g,
                ''
            );
    }


    function truncarTexto(
        texto,
        limite = 220
    ) {
        texto =
            normalizarEspacos(
                texto
            );


        if (
            texto.length <=
            limite
        ) {
            return texto;
        }


        return (
            texto.slice(
                0,
                limite - 1
            ) +
            '…'
        );
    }


    function elementoVisivel(
        elemento
    ) {
        if (
            !elemento ||
            !elemento.isConnected
        ) {
            return false;
        }


        if (
            elemento.closest?.(
                '[hidden]'
            )
        ) {
            return false;
        }


        try {
            const estilo =
                getComputedStyle(
                    elemento
                );


            if (
                estilo.display ===
                    'none' ||
                estilo.visibility ===
                    'hidden'
            ) {
                return false;
            }

        } catch (erro) {
        }


        return true;
    }


    /* =========================================================
       CONFIGURAÇÃO DOS ALERTAS DE INATIVIDADE
       ========================================================= */

    function normalizarConfiguracaoAlertasInatividade(
        origem
    ) {
        const padrao =
            ALERTAS_INATIVIDADE_PADRAO;


        if (
            !origem ||
            typeof origem !==
                'object' ||
            Array.isArray(
                origem
            )
        ) {
            return {
                ...padrao
            };
        }


        const amarelo =
            Number(
                origem.amarelo
            );


        const laranja =
            Number(
                origem.laranja
            );


        const vermelho =
            Number(
                origem.vermelho
            );


        const configuracao = {
            ativo:
                origem.ativo !==
                false,

            notificarAmarelo:
                origem.notificarAmarelo ===
                true,

            notificarLaranja:
                origem.notificarLaranja ===
                true,

            notificarVermelho:
                origem.notificarVermelho ===
                true,

            amarelo:
                Number.isInteger(
                    amarelo
                ) &&
                amarelo >=
                    1
                    ?
                    amarelo
                    :
                    padrao.amarelo,

            laranja:
                Number.isInteger(
                    laranja
                ) &&
                laranja >=
                    1
                    ?
                    laranja
                    :
                    padrao.laranja,

            vermelho:
                Number.isInteger(
                    vermelho
                ) &&
                vermelho >=
                    1
                    ?
                    vermelho
                    :
                    padrao.vermelho
        };


        if (
            !(
                configuracao.amarelo <
                    configuracao.laranja &&
                configuracao.laranja <
                    configuracao.vermelho
            )
        ) {
            configuracao.amarelo =
                padrao.amarelo;

            configuracao.laranja =
                padrao.laranja;

            configuracao.vermelho =
                padrao.vermelho;
        }


        return configuracao;
    }


    function carregarConfiguracaoAlertasInatividade() {
        if (
            configuracaoAlertasInatividadeCache
        ) {
            return {
                ...configuracaoAlertasInatividadeCache
            };
        }


        try {
            const salva =
                GM_getValue(
                    CONFIG.storageAlertasKey,
                    null
                );


            configuracaoAlertasInatividadeCache =
                normalizarConfiguracaoAlertasInatividade(
                    salva
                );

        } catch (erro) {
            console.error(
                '[Way Mensagens] Erro ao carregar configuração dos alertas:',
                erro
            );


            configuracaoAlertasInatividadeCache = {
                ...ALERTAS_INATIVIDADE_PADRAO
            };
        }


        return {
            ...configuracaoAlertasInatividadeCache
        };
    }


    function salvarConfiguracaoAlertasInatividade(
        configuracao
    ) {
        const normalizada =
            normalizarConfiguracaoAlertasInatividade(
                configuracao
            );


        try {
            GM_setValue(
                CONFIG.storageAlertasKey,
                normalizada
            );


            configuracaoAlertasInatividadeCache =
                normalizada;


            return true;

        } catch (erro) {
            console.error(
                '[Way Mensagens] Erro ao salvar configuração dos alertas:',
                erro
            );


            return false;
        }
    }


    function obterNivelInatividade(
        minutos,
        configuracao
    ) {
        if (
            minutos ===
                null ||
            minutos ===
                undefined
        ) {
            return 'normal';
        }


        if (
            minutos >=
            configuracao.vermelho
        ) {
            return 'red';
        }


        if (
            minutos >=
            configuracao.laranja
        ) {
            return 'orange';
        }


        if (
            minutos >=
            configuracao.amarelo
        ) {
            return 'yellow';
        }


        return 'normal';
    }


    /* =========================================================
       ALERTA DE INATIVIDADE DOS CARDS
       ========================================================= */

    function converterTempoParaMinutos(
        valor
    ) {
        let texto =
            normalizarEspacos(
                valor
            )
                .toLowerCase();


        if (
            !texto
        ) {
            return null;
        }


        /*
         * Valores equivalentes a atividade recente.
         */

        if (
            texto === 'agora' ||
            texto === 'now'
        ) {
            return 0;
        }


        /*
         * Exemplo:
         *
         * <1m
         */

        if (
            /^<\s*1\s*m$/i
                .test(
                    texto
                )
        ) {
            return 0.5;
        }


        /*
         * Aceita:
         *
         * 7m
         * 15m
         * 1h
         * 1h 5m
         * 2h 30m
         * 1d
         * 1d 2h 15m
         * 30s
         */

        const regex =
            /(\d+(?:[.,]\d+)?)\s*(d|h|m|s)\b/gi;


        let resultado;

        let minutos =
            0;

        let encontrou =
            false;


        while (
            (
                resultado =
                    regex.exec(
                        texto
                    )
            )
        ) {
            encontrou =
                true;


            const numero =
                Number(
                    String(
                        resultado[1]
                    )
                        .replace(
                            ',',
                            '.'
                        )
                );


            const unidade =
                resultado[2]
                    .toLowerCase();


            if (
                !Number.isFinite(
                    numero
                )
            ) {
                continue;
            }


            if (
                unidade ===
                'd'
            ) {
                minutos +=
                    numero *
                    1440;
            }


            if (
                unidade ===
                'h'
            ) {
                minutos +=
                    numero *
                    60;
            }


            if (
                unidade ===
                'm'
            ) {
                minutos +=
                    numero;
            }


            if (
                unidade ===
                's'
            ) {
                minutos +=
                    numero /
                    60;
            }
        }


        if (
            !encontrou
        ) {
            return null;
        }


        return minutos;
    }


    function localizarTemposCard(
        card
    ) {
        if (
            !card
        ) {
            return null;
        }


        /*
         * Exemplo:
         *
         * 23m • 7m
         *
         * Procuramos preferencialmente um SPAN
         * sem outros spans internos.
         */

        const spans =
            Array.from(
                card.querySelectorAll(
                    'span'
                )
            );


        const candidatos =
            spans
                .filter(
                    span =>
                        !span.querySelector(
                            'span'
                        )
                );


        for (
            const span
            of candidatos
        ) {
            const texto =
                normalizarEspacos(
                    span.textContent
                );


            if (
                !texto.includes(
                    '•'
                )
            ) {
                continue;
            }


            const partes =
                texto
                    .split(
                        '•'
                    )
                    .map(
                        parte =>
                            normalizarEspacos(
                                parte
                            )
                    );


            if (
                partes.length !==
                2
            ) {
                continue;
            }


            const tempoTotal =
                converterTempoParaMinutos(
                    partes[0]
                );


            const ultimaAtividade =
                converterTempoParaMinutos(
                    partes[1]
                );


            /*
             * Precisamos conseguir interpretar
             * ambos para garantir que encontramos
             * exatamente o contador do atendimento.
             */

            if (
                tempoTotal ===
                    null ||
                ultimaAtividade ===
                    null
            ) {
                continue;
            }


            return {
                elemento:
                    span,

                texto:
                    texto,

                tempoTotalMinutos:
                    tempoTotal,

                tempoTotalTexto:
                    partes[0],

                ultimaAtividadeMinutos:
                    ultimaAtividade,

                ultimaAtividadeTexto:
                    partes[1]
            };
        }


        /*
         * Fallback:
         * procura também em DIVs caso o sistema
         * altere a estrutura.
         */

        const divs =
            Array.from(
                card.querySelectorAll(
                    'div'
                )
            );


        for (
            const div
            of divs
        ) {
            const texto =
                normalizarEspacos(
                    div.textContent
                );


            /*
             * Neste fallback aceitamos apenas
             * DIVs cujo conteúdo seja pequeno,
             * evitando capturar o card inteiro.
             */

            if (
                !texto.includes(
                    '•'
                ) ||
                texto.length >
                    40
            ) {
                continue;
            }


            const partes =
                texto
                    .split(
                        '•'
                    )
                    .map(
                        parte =>
                            normalizarEspacos(
                                parte
                            )
                    );


            if (
                partes.length !==
                2
            ) {
                continue;
            }


            const tempoTotal =
                converterTempoParaMinutos(
                    partes[0]
                );


            const ultimaAtividade =
                converterTempoParaMinutos(
                    partes[1]
                );


            if (
                tempoTotal ===
                    null ||
                ultimaAtividade ===
                    null
            ) {
                continue;
            }


            return {
                elemento:
                    div,

                texto:
                    texto,

                tempoTotalMinutos:
                    tempoTotal,

                tempoTotalTexto:
                    partes[0],

                ultimaAtividadeMinutos:
                    ultimaAtividade,

                ultimaAtividadeTexto:
                    partes[1]
            };
        }


        return null;
    }


    /* =========================================================
       NOTIFICAÇÕES DE NOVAS MENSAGENS
       ========================================================= */

    function localizarLinkConversa(
        card
    ) {
        return card?.closest?.(
            'a[href*="/conversation/"]'
        ) ||
            card?.querySelector?.(
                'a[href*="/conversation/"]'
            ) ||
            null;
    }


    function obterUrlConversa(
        card
    ) {
        const link =
            localizarLinkConversa(
                card
            );


        const href =
            link?.getAttribute?.(
                'href'
            );


        if (
            href
        ) {
            try {
                return new URL(
                    href,
                    window.location.href
                ).href;

            } catch (erro) {
            }
        }


        return window.location.href;
    }


    function extrairNomeClienteCardConversa(
        card
    ) {
        const seletores = [
            '.conversation--user',
            '[data-testid="conversation-contact-name"]',
            '[class*="conversation-user"]',
            'h4'
        ];


        for (
            const seletor
            of seletores
        ) {
            const elemento =
                card.querySelector(
                    seletor
                );


            const texto =
                normalizarEspacos(
                    elemento?.textContent
                );


            if (
                texto
            ) {
                return texto;
            }
        }


        return normalizarEspacos(
            card.querySelector(
                'img[alt]'
            )?.getAttribute(
                'alt'
            )
        );
    }


    function extrairPreviaMensagemCard(
        card,
        dadosTempo,
        nomeCliente
    ) {
        const seletores = [
            '[data-testid="conversation-message-preview"]',
            '.conversation--message-preview',
            '.conversation-message-preview',
            '.conversation--message',
            'div.overflow-hidden.text-ellipsis.whitespace-nowrap',
            'p.overflow-hidden.text-ellipsis.whitespace-nowrap'
        ];


        const candidatos = [];


        seletores.forEach(
            seletor => {
                card
                    .querySelectorAll(
                        seletor
                    )
                    .forEach(
                        elemento =>
                            candidatos.push(
                                elemento
                            )
                    );
            }
        );


        card
            .querySelectorAll(
                'p'
            )
            .forEach(
                elemento =>
                    candidatos.push(
                        elemento
                    )
            );


        const ignorados =
            new Set(
                [
                    normalizarEspacos(
                        nomeCliente
                    ),
                    normalizarEspacos(
                        dadosTempo?.texto
                    )
                ]
                    .filter(
                        Boolean
                    )
            );


        for (
            const elemento
            of candidatos
        ) {
            if (
                elemento.matches?.(
                    '.conversation--user'
                ) ||
                elemento.contains?.(
                    dadosTempo?.elemento
                )
            ) {
                continue;
            }


            const texto =
                normalizarEspacos(
                    elemento.textContent
                );


            if (
                texto &&
                !ignorados.has(
                    texto
                ) &&
                !texto.includes(
                    '•'
                )
            ) {
                return texto;
            }
        }


        return '';
    }


    function obterQuantidadeNaoLidasCard(
        card
    ) {
        const elemento =
            card.querySelector(
                [
                    '[data-testid="unread-badge"]',
                    '[aria-label*="não lida" i]',
                    '[aria-label*="unread" i]',
                    '.bg-n-teal-9.rounded-full.h-4'
                ].join(',')
            );


        const resultado =
            normalizarEspacos(
                elemento?.textContent
            )
                .match(
                    /\d+/
                );


        return resultado
            ?
            Number(
                resultado[0]
            )
            :
            0;
    }


    function obterRotuloDiretoElemento(
        elemento
    ) {
        return normalizarEspacos(
            Array.from(
                elemento?.childNodes ||
                []
            )
                .filter(
                    no =>
                        no.nodeType ===
                        3
                )
                .map(
                    no =>
                        no.textContent ||
                        ''
                )
                .join(
                    ' '
                )
        );
    }


    function localizarAbaConversas(
        rotuloProcurado
    ) {
        const rotuloNormalizado =
            normalizarEspacos(
                rotuloProcurado
            )
                .toLocaleLowerCase(
                    'pt-BR'
                );


        return Array.from(
            document.querySelectorAll(
                'a, button, [role="tab"]'
            )
        )
            .find(
                elemento => {
                    if (
                        obterRotuloDiretoElemento(
                            elemento
                        )
                            .toLocaleLowerCase(
                                'pt-BR'
                            ) !==
                            rotuloNormalizado
                    ) {
                        return false;
                    }


                    const lista =
                        elemento.closest(
                            'ul'
                        );


                    if (
                        !lista
                    ) {
                        return false;
                    }


                    const rotulosIrmaos =
                        Array.from(
                            lista.querySelectorAll(
                                'a, button, [role="tab"]'
                            )
                        )
                            .map(
                                obterRotuloDiretoElemento
                            )
                            .map(
                                rotulo =>
                                    rotulo.toLocaleLowerCase(
                                        'pt-BR'
                                    )
                            );


                    return rotulosIrmaos.includes(
                        'minhas'
                    ) &&
                    rotulosIrmaos.includes(
                        'todos'
                    );
                }
            ) ||
            null;
    }


    function abaConversasMinhasEstaAtiva() {
        const abaMinhas =
            localizarAbaConversas(
                'Minhas'
            );


        if (
            !abaMinhas
        ) {
            return false;
        }


        return (
            abaMinhas.getAttribute(
                'aria-selected'
            ) ===
                'true' ||
            [
                'page',
                'true'
            ].includes(
                abaMinhas.getAttribute(
                    'aria-current'
                )
            ) ||
            abaMinhas.getAttribute(
                'data-state'
            ) ===
                'active' ||
            abaMinhas.classList.contains(
                'after:bg-n-brand'
            ) &&
            abaMinhas.classList.contains(
                'after:opacity-100'
            )
        );
    }


    function obterTituloBaseChatWoot() {
        const tituloAtual =
            String(
                document.title || ''
            );


        const tituloSemContador =
            tituloAtual
                .replace(
                    /^\(\d+\+?\)\s*/,
                    ''
                )
                .trim();


        /*
         * O próprio ChatWoot pode mudar o título ao navegar.
         * Quando isso acontecer, preservamos o novo título como base,
         * removendo somente o contador aplicado pela extensão.
         */

        if (
            tituloSemContador &&
            tituloAtual !==
                ESTADO_TITULO_NAO_LIDAS
                    .ultimoTituloAplicado
        ) {
            ESTADO_TITULO_NAO_LIDAS
                .tituloBase =
                    tituloSemContador;
        }


        if (
            !ESTADO_TITULO_NAO_LIDAS
                .tituloBase
        ) {
            ESTADO_TITULO_NAO_LIDAS
                .tituloBase =
                    tituloSemContador ||
                    'ChatWoot';
        }


        return ESTADO_TITULO_NAO_LIDAS
            .tituloBase;
    }


    function atualizarTituloMensagensNaoLidas(
        cards
    ) {
        const quantidadeTotal =
            cards.reduce(
                (
                    total,
                    card
                ) =>
                    total +
                    obterQuantidadeNaoLidasCard(
                        card
                    ),
                0
            );


        const tituloBase =
            obterTituloBaseChatWoot();


        const proximoTitulo =
            quantidadeTotal > 0
                ?
                `(${quantidadeTotal}) ${tituloBase}`
                :
                tituloBase;


        ESTADO_TITULO_NAO_LIDAS
            .ultimoTituloAplicado =
                proximoTitulo;


        if (
            document.title !==
            proximoTitulo
        ) {
            document.title =
                proximoTitulo;
        }
    }


    function ultimaMensagemFoiDoAtendente(
        card
    ) {
        const conversaAberta =
            card.matches?.(
                '.active, .selected, [aria-current="true"]'
            );


        if (conversaAberta) {
            const paineis =
                Array.from(
                    document.querySelectorAll(
                        '.conversation-panel'
                    )
                );


            for (
                let indicePainel =
                    paineis.length - 1;
                indicePainel >= 0;
                indicePainel--
            ) {
                const painel =
                    paineis[indicePainel];


                if (
                    painel.hidden ||
                    painel.getAttribute(
                        'aria-hidden'
                    ) ===
                        'true'
                ) {
                    continue;
                }


                const mensagens =
                    Array.from(
                        painel.querySelectorAll(
                            '.message-bubble-container'
                        )
                    );


                for (
                    let indiceMensagem =
                        mensagens.length - 1;
                    indiceMensagem >= 0;
                    indiceMensagem--
                ) {
                    const mensagem =
                        mensagens[indiceMensagem];


                    if (
                        mensagem.querySelector(
                            '[data-bubble-name="activity"]'
                        ) ||
                        mensagem.classList.contains(
                            'justify-center'
                        )
                    ) {
                        continue;
                    }


                    if (
                        mensagem.querySelector(
                            '.right-bubble'
                        ) ||
                        mensagem.classList.contains(
                            'justify-end'
                        )
                    ) {
                        return true;
                    }


                    if (
                        mensagem.querySelector(
                            '.left-bubble'
                        ) ||
                        mensagem.classList.contains(
                            'justify-start'
                        )
                    ) {
                        return false;
                    }
                }
            }
        }


        return Boolean(
            card.matches?.(
                [
                    '.right-bubble',
                    '.justify-end',
                    '[data-message-direction="outgoing"]',
                    '[data-outgoing="true"]',
                    '[data-sender-type="agent" i]',
                    '[data-sender-type="user" i]'
                ].join(',')
            ) ||
            card.querySelector(
                [
                    '[icon="arrow-reply"]',
                    '[data-icon="arrow-reply"]',
                    '.icon-arrow-reply',
                    '[class*="arrow-reply"]',
                    '.right-bubble',
                    '.justify-end',
                    '[data-message-direction="outgoing"]',
                    '[data-outgoing="true"]',
                    '[data-sender-type="agent" i]',
                    '[data-sender-type="user" i]'
                ].join(',')
            )
        );
    }


    function paginaChatWootEstaEmUso() {
        return document.visibilityState ===
            'visible' &&
            (
                typeof document.hasFocus !==
                    'function' ||
                document.hasFocus()
            );
    }


    function iniciarSincronizacaoPreferenciasNotificacoes() {
        chrome.storage.local.get(
            {
                [CHAVE_NOTIFICAR_EM_PRIMEIRO_PLANO]:
                    false
            },

            valores => {
                if (
                    chrome.runtime.lastError
                ) {
                    console.warn(
                        '[Way Mensagens] Não foi possível carregar a preferência de notificações em primeiro plano:',
                        chrome.runtime.lastError.message
                    );

                    return;
                }


                PREFERENCIAS_NOTIFICACOES
                    .notificarEmPrimeiroPlano =
                        valores[
                            CHAVE_NOTIFICAR_EM_PRIMEIRO_PLANO
                        ] === true;
            }
        );


        chrome.storage.onChanged.addListener(
            (
                alteracoes,
                area
            ) => {
                if (
                    area !==
                        'local' ||
                    !Object.prototype.hasOwnProperty.call(
                        alteracoes,
                        CHAVE_NOTIFICAR_EM_PRIMEIRO_PLANO
                    )
                ) {
                    return;
                }


                PREFERENCIAS_NOTIFICACOES
                    .notificarEmPrimeiroPlano =
                        alteracoes[
                            CHAVE_NOTIFICAR_EM_PRIMEIRO_PLANO
                        ].newValue === true;
            }
        );
    }


    function obterChaveConversaCard(
        card,
        nomeCliente
    ) {
        const link =
            localizarLinkConversa(
                card
            );


        const href =
            link?.getAttribute?.(
                'href'
            ) ||
            '';


        const idHref =
            href.match(
                /\/conversation\/(\d+)/i
            )?.[1];


        if (
            idHref
        ) {
            return `conversation:${idHref}`;
        }


        const atributos = [
            'data-conversation-id',
            'data-conversation',
            'data-id'
        ];


        for (
            const atributo
            of atributos
        ) {
            const valor =
                normalizarEspacos(
                    card.getAttribute(
                        atributo
                    )
                );


            if (
                valor
            ) {
                return `conversation:${valor}`;
            }
        }


        const avatar =
            card.querySelector(
                'img'
            );


        const identificacaoContato =
            [
                normalizarEspacos(
                    nomeCliente
                ),
                normalizarEspacos(
                    avatar?.getAttribute(
                        'src'
                    )
                ),
                normalizarEspacos(
                    avatar?.getAttribute(
                        'alt'
                    )
                )
            ]
                .filter(
                    Boolean
                )
                .join('|');


        if (
            identificacaoContato
        ) {
            return `contact:${identificacaoContato}`;
        }


        if (
            !ESTADO_NOTIFICACOES
                .idsElementos
                .has(
                    card
                )
        ) {
            ESTADO_NOTIFICACOES
                .idsElementos
                .set(
                    card,
                    ESTADO_NOTIFICACOES
                        .proximoIdElemento++
                );
        }


        return `element:${ESTADO_NOTIFICACOES
            .idsElementos
            .get(
                card
            )}`;
    }


    function enviarNotificacaoNovaMensagem(
        dados
    ) {
        try {
            chrome.runtime.sendMessage(
                {
                    type:
                        'wayTools:iaMessageNotification',

                    conversationKey:
                        dados.chave,

                    fingerprint:
                        dados.assinatura,

                    customerName:
                        dados.nomeCliente,

                    preview:
                        dados.previa,

                    url:
                        dados.url
                },

                resposta => {
                    const erro =
                        chrome.runtime.lastError;


                    if (
                        erro
                    ) {
                        console.warn(
                            '[Way Mensagens] Não foi possível exibir a notificação:',
                            erro.message
                        );

                        return;
                    }


                    if (
                        resposta?.ok ===
                        false
                    ) {
                        console.warn(
                            '[Way Mensagens] Notificação recusada:',
                            resposta.error
                        );
                    }
                }
            );

        } catch (erro) {
            console.warn(
                '[Way Mensagens] Falha ao solicitar notificação:',
                erro
            );
        }
    }


    function monitorarNotificacaoInatividade(
        card,
        dadosTempo,
        nivel,
        configuracao
    ) {
        const instante =
            Date.now();


        if (
            !ESTADO_NOTIFICACOES_INATIVIDADE
                .inicioAquecimento
        ) {
            ESTADO_NOTIFICACOES_INATIVIDADE
                .inicioAquecimento =
                    instante;
        }


        const nomeCliente =
            extrairNomeClienteCardConversa(
                card
            );


        const chave =
            obterChaveConversaCard(
                card,
                nomeCliente
            );


        const estadoAnterior =
            ESTADO_NOTIFICACOES_INATIVIDADE
                .conversas
                .get(
                    chave
                );


        ESTADO_NOTIFICACOES_INATIVIDADE
            .conversas
            .set(
                chave,
                {
                    nivel:
                        nivel
                }
            );


        const detalhesNivel =
            NIVEIS_NOTIFICACAO_INATIVIDADE[
                nivel
            ];


        if (
            !detalhesNivel
        ) {
            return;
        }


        const primeiraObservacao =
            !estadoAnterior;


        const aquecendo =
            primeiraObservacao &&
            instante -
                ESTADO_NOTIFICACOES_INATIVIDADE
                    .inicioAquecimento <
                ESTADO_NOTIFICACOES_INATIVIDADE
                    .duracaoAquecimento;


        if (
            !POLITICA_NOTIFICACOES
                ?.shouldNotifyInactivityTransition?.(
                    estadoAnterior?.nivel ||
                        'normal',
                    nivel,
                    {
                        enabled:
                            configuracao[
                                detalhesNivel.configuracao
                            ] === true,

                        warmingUp:
                            aquecendo
                    }
                )
        ) {
            return;
        }


        if (
            !PREFERENCIAS_NOTIFICACOES
                .notificarEmPrimeiroPlano &&
            paginaChatWootEstaEmUso()
        ) {
            return;
        }


        const minutos =
            dadosTempo
                .ultimaAtividadeMinutos;


        const unidade =
            minutos === 1
                ?
                'minuto'
                :
                'minutos';


        enviarNotificacaoNovaMensagem(
            {
                chave:
                    chave,

                assinatura:
                    `${chave}|inatividade|${nivel}|${instante}`,

                nomeCliente:
                    nomeCliente ||
                    'Cliente',

                previa:
                    `${detalhesNivel.icone} ${detalhesNivel.rotulo}: atendimento sem nova atividade há ${minutos} ${unidade}.`,

                url:
                    obterUrlConversa(
                        card
                    )
            }
        );
    }


    function monitorarNovasMensagens(
        cards
    ) {
        if (
            !POLITICA_NOTIFICACOES ||
            !Array.isArray(
                cards
            ) ||
            cards.length ===
                0
        ) {
            return;
        }


        const agora =
            Date.now();


        if (
            !ESTADO_NOTIFICACOES
                .inicioAquecimento
        ) {
            ESTADO_NOTIFICACOES
                .inicioAquecimento =
                agora;
        }


        const aquecendo =
            agora -
                ESTADO_NOTIFICACOES
                    .inicioAquecimento <
            ESTADO_NOTIFICACOES
                .duracaoAquecimento;


        cards.forEach(
            card => {
                const dadosTempo =
                    localizarTemposCard(
                        card
                    );


                if (
                    !dadosTempo
                ) {
                    return;
                }


                const nomeCliente =
                    extrairNomeClienteCardConversa(
                        card
                    );


                const previa =
                    extrairPreviaMensagemCard(
                        card,
                        dadosTempo,
                        nomeCliente
                    );


                const chave =
                    obterChaveConversaCard(
                        card,
                        nomeCliente
                    );


                const quantidadeNaoLidas =
                    obterQuantidadeNaoLidasCard(
                        card
                    );


                const assinatura =
                    POLITICA_NOTIFICACOES
                        .createSignature(
                            {
                                conversationKey:
                                    chave,

                                preview:
                                    previa,

                                unreadCount:
                                    quantidadeNaoLidas
                            }
                        );


                const avaliacao =
                    POLITICA_NOTIFICACOES
                        .evaluate(
                            ESTADO_NOTIFICACOES
                                .conversas
                                .get(
                                    chave
                                ),

                            {
                                isNow:
                                    POLITICA_NOTIFICACOES
                                        .isCurrentActivityLabel(
                                            dadosTempo
                                                .ultimaAtividadeTexto
                                        ),

                                isOutgoing:
                                    ultimaMensagemFoiDoAtendente(
                                        card
                                    ),

                                signature:
                                    assinatura
                            },

                            {
                                now:
                                    agora,

                                warmingUp:
                                    aquecendo,

                                suppressNotification:
                                    !PREFERENCIAS_NOTIFICACOES
                                        .notificarEmPrimeiroPlano &&
                                    paginaChatWootEstaEmUso()
                            }
                        );


                ESTADO_NOTIFICACOES
                    .conversas
                    .set(
                        chave,
                        avaliacao.next
                    );


                if (
                    avaliacao.notify
                ) {
                    enviarNotificacaoNovaMensagem(
                        {
                            chave:
                                chave,

                            assinatura:
                                assinatura,

                            nomeCliente:
                                nomeCliente ||
                                'Cliente',

                            previa:
                                previa ||
                                'Nova mensagem recebida.',

                            url:
                                obterUrlConversa(
                                    card
                                )
                        }
                    );
                }
            }
        );


        ESTADO_NOTIFICACOES
            .conversas
            .forEach(
                (
                    estado,
                    chave
                ) => {
                    if (
                        agora -
                            estado.seenAt >
                        30 *
                            60 *
                            1000
                    ) {
                        ESTADO_NOTIFICACOES
                            .conversas
                            .delete(
                                chave
                            );
                    }
                }
            );
    }


    function removerAlertaInatividadeCard(
        card
    ) {
        if (
            !card
        ) {
            return;
        }


        /*
         * Remove tanto a classe antiga da v2.9
         * quanto os três novos níveis da v3.0.
         */

        card.classList.remove(
            'way-msg-inactivity-alert',
            'way-msg-inactivity-yellow',
            'way-msg-inactivity-orange',
            'way-msg-inactivity-red'
        );


        card.removeAttribute(
            'data-way-inactivity-minutes'
        );


        card.removeAttribute(
            'data-way-inactivity-level'
        );


        card
            .querySelectorAll(
                [
                    '.way-msg-inactivity-time-alert',
                    '.way-msg-inactivity-time',
                    '.way-msg-inactivity-time-yellow',
                    '.way-msg-inactivity-time-orange',
                    '.way-msg-inactivity-time-red'
                ].join(',')
            )
            .forEach(
                elemento => {
                    elemento.classList.remove(
                        'way-msg-inactivity-time-alert',
                        'way-msg-inactivity-time',
                        'way-msg-inactivity-time-yellow',
                        'way-msg-inactivity-time-orange',
                        'way-msg-inactivity-time-red'
                    );
                }
            );
    }


    function configurarAlertasInatividade() {
        const configuracao =
            carregarConfiguracaoAlertasInatividade();


        const cards =
            Array.from(
                document.querySelectorAll(
                    '.conversation'
                )
            );


        const abaMinhasAtiva =
            abaConversasMinhasEstaAtiva();


        const cardsParaNotificacoes =
            abaMinhasAtiva
                ?
                cards
                :
                [];


        atualizarTituloMensagensNaoLidas(
            cardsParaNotificacoes
        );


        monitorarNovasMensagens(
            cardsParaNotificacoes
        );


        cards.forEach(
            card => {
                const dadosTempo =
                    localizarTemposCard(
                        card
                    );


                /*
                 * Sempre limpamos o estado anterior.
                 * Assim, se o contador cair de 12m para 1m,
                 * o card volta imediatamente ao normal.
                 */

                removerAlertaInatividadeCard(
                    card
                );


                if (
                    !dadosTempo
                ) {
                    return;
                }


                /*
                 * IMPORTANTE:
                 *
                 * somente o SEGUNDO valor determina o alerta.
                 *
                 * 23m • 7m
                 *       ↑
                 *
                 * O primeiro valor continua sendo apenas
                 * o tempo total do atendimento.
                 */

                const nivel =
                    obterNivelInatividade(
                        dadosTempo
                            .ultimaAtividadeMinutos,
                        configuracao
                    );


                if (
                    abaMinhasAtiva
                ) {
                    monitorarNotificacaoInatividade(
                        card,
                        dadosTempo,
                        nivel,
                        configuracao
                    );
                }


                if (
                    !configuracao.ativo ||
                    nivel ===
                    'normal'
                ) {
                    return;
                }


                card.classList.add(
                    `way-msg-inactivity-${nivel}`
                );


                card.setAttribute(
                    'data-way-inactivity-minutes',
                    String(
                        dadosTempo
                            .ultimaAtividadeMinutos
                    )
                );


                card.setAttribute(
                    'data-way-inactivity-level',
                    nivel
                );


                dadosTempo
                    .elemento
                    .classList
                    .add(
                        'way-msg-inactivity-time',
                        `way-msg-inactivity-time-${nivel}`
                    );
            }
        );
    }



    /* =========================================================
       CLIPBOARD
       ========================================================= */

    async function copiarTexto(
        texto
    ) {
        texto =
            String(
                texto ?? ''
            );


        if (
            !texto
        ) {
            return false;
        }


        try {
            await navigator
                .clipboard
                .writeText(
                    texto
                );


            return true;

        } catch (erro) {
        }


        try {
            const textarea =
                document.createElement(
                    'textarea'
                );


            textarea.value =
                texto;


            textarea.setAttribute(
                'readonly',
                ''
            );


            textarea.style.position =
                'fixed';


            textarea.style.left =
                '-9999px';


            textarea.style.top =
                '0';


            textarea.style.opacity =
                '0';


            document.body.appendChild(
                textarea
            );


            textarea.focus();

            textarea.select();


            const sucesso =
                document.execCommand(
                    'copy'
                );


            textarea.remove();


            return sucesso;

        } catch (erro) {
            console.error(
                '[Way Mensagens] Erro ao copiar:',
                erro
            );


            return false;
        }
    }


    /* =========================================================
       TELEFONE
       ========================================================= */

    function formatarTelefoneBR(
        telefone
    ) {
        let numeros =
            somenteNumeros(
                telefone
            );


        if (
            numeros.startsWith(
                '55'
            ) &&
            numeros.length >
                11
        ) {
            numeros =
                numeros.slice(
                    2
                );
        }


        if (
            numeros.length ===
            11
        ) {
            return (
                `(${numeros.slice(0, 2)}) ` +
                `${numeros.slice(2, 7)}-` +
                `${numeros.slice(7)}`
            );
        }


        if (
            numeros.length ===
            10
        ) {
            return (
                `(${numeros.slice(0, 2)}) ` +
                `${numeros.slice(2, 6)}-` +
                `${numeros.slice(6)}`
            );
        }


        return numeros;
    }


    /* =========================================================
       CPF
       ========================================================= */

    function formatarCPF(
        cpf
    ) {
        const numeros =
            somenteNumeros(
                cpf
            );


        if (
            numeros.length !==
            11
        ) {
            return normalizarEspacos(
                cpf
            );
        }


        return (
            `${numeros.slice(0, 3)}.` +
            `${numeros.slice(3, 6)}.` +
            `${numeros.slice(6, 9)}-` +
            `${numeros.slice(9)}`
        );
    }


    /* =========================================================
       ENDEREÇO
       ========================================================= */

    function formatarCEPNoEndereco(
        endereco
    ) {
        endereco =
            normalizarEspacos(
                endereco
            );


        return endereco.replace(
            /\bCEP\s*:?\s*(\d{5})-?(\d{3})\b/gi,
            'CEP $1-$2'
        );
    }


    function limparTextoEndereco(
        texto
    ) {
        texto =
            normalizarEspacos(
                texto
            );


        texto =
            texto.replace(
                /^(endereço|endereco|address)\s*:?\s*/i,
                ''
            );


        texto =
            texto.replace(
                /\s*,\s*Brazil\s*$/i,
                ''
            );


        if (
            /^(indisponível|indisponivel|não informado|nao informado)$/i
                .test(
                    texto
                )
        ) {
            return '';
        }


        return formatarCEPNoEndereco(
            texto
        );
    }


    function extrairTextoLinhaEndereco(
        elemento
    ) {
        if (
            !elemento
        ) {
            return '';
        }


        const clone =
            elemento.cloneNode(
                true
            );


        clone
            .querySelectorAll?.(
                'button,svg,.fi'
            )
            .forEach(
                item =>
                    item.remove()
            );


        return limparTextoEndereco(
            clone.textContent
        );
    }


    function extrairTextoEnderecoDoSpan(
        span
    ) {
        if (
            !span
        ) {
            return '';
        }


        const clone =
            span.cloneNode(
                true
            );


        clone
            .querySelectorAll(
                '.fi, .fi-br'
            )
            .forEach(
                elemento =>
                    elemento.remove()
            );


        return limparTextoEndereco(
            clone.textContent
        );
    }


    /* =========================================================
       PROTOCOLO
       ========================================================= */

    function extrairProtocoloAtendimentoAtual() {
        const botoes =
            Array.from(
                document.querySelectorAll(
                    '.conversation--header--actions button'
                )
            );


        for (
            const botao
            of botoes
        ) {
            if (
                !elementoVisivel(
                    botao
                )
            ) {
                continue;
            }


            const texto =
                normalizarEspacos(
                    botao.textContent
                );


            const resultado =
                texto.match(
                    /^#\s*(\d+)$/
                );


            if (
                resultado
            ) {
                return resultado[1];
            }
        }


        const cabecalhos =
            Array.from(
                document.querySelectorAll(
                    [
                        '[class*="conversation"][class*="header"]',
                        '[class*="conversation-header"]',
                        '[class*="conversation--header"]'
                    ].join(',')
                )
            );


        for (
            const cabecalho
            of cabecalhos
        ) {
            if (
                !elementoVisivel(
                    cabecalho
                )
            ) {
                continue;
            }


            const candidatos =
                Array.from(
                    cabecalho.querySelectorAll(
                        'button'
                    )
                );


            for (
                const botao
                of candidatos
            ) {
                const texto =
                    normalizarEspacos(
                        botao.textContent
                    );


                const resultado =
                    texto.match(
                        /^#\s*(\d+)$/
                    );


                if (
                    resultado
                ) {
                    return resultado[1];
                }
            }
        }


        return '';
    }


    /* =========================================================
       CARTÃO CLIENTE
       ========================================================= */

    function localizarCartaoClientePorElemento(
        elemento
    ) {
        if (
            !elemento
        ) {
            return null;
        }


        let atual =
            elemento;


        /*
         * O cartão do contato nem sempre possui todos os campos.
         *
         * Exemplo real:
         * - nome disponível
         * - telefone disponível
         * - endereço disponível
         * - e-mail = "Indisponível"
         *
         * A versão anterior exigia simultaneamente nome + e-mail +
         * telefone. Quando o e-mail não existia como link mailto:,
         * o cartão inteiro deixava de ser reconhecido e, por isso,
         * {{nomecliente}}, {{telefone}} e {{endereco}} também ficavam
         * vazios no modal de Visita Técnica.
         *
         * Agora o nome continua sendo a âncora principal e basta
         * existir pelo menos UM marcador típico do cartão.
         */

        for (
            let nivel = 0;
            nivel < 18 &&
            atual;
            nivel++
        ) {
            if (
                typeof atual.querySelector ===
                'function'
            ) {
                const nome =
                    atual.querySelector(
                        'h3[title="Click to edit"]'
                    );


                const email =
                    atual.querySelector(
                        'a[href^="mailto:"]'
                    );


                const telefone =
                    atual.querySelector(
                        'a[href^="tel:"]'
                    );


                const endereco =
                    atual.querySelector(
                        'svg.map, .icon--font.map'
                    );


                const cpf =
                    atual.querySelector(
                        '.contact-identify'
                    );


                if (
                    nome &&
                    (
                        email ||
                        telefone ||
                        endereco ||
                        cpf
                    )
                ) {
                    return atual;
                }
            }


            atual =
                atual.parentElement;
        }


        return null;
    }


    function localizarCartaoClienteAtual() {
        /*
         * 1. Tenta primeiro pelo nome visível.
         */

        const nomes =
            Array.from(
                document.querySelectorAll(
                    'h3[title="Click to edit"]'
                )
            );


        for (
            const nome
            of nomes
        ) {
            if (
                !elementoVisivel(
                    nome
                )
            ) {
                continue;
            }


            const cartao =
                localizarCartaoClientePorElemento(
                    nome
                );


            if (
                cartao
            ) {
                return cartao;
            }
        }


        /*
         * 2. Fallbacks independentes.
         *
         * Isso permite localizar o cartão mesmo quando um dos
         * campos estiver indisponível no cadastro do cliente.
         */

        const seletoresFallback = [
            'a[href^="tel:"]',
            'svg.map',
            '.icon--font.map',
            '.contact-identify',
            'a[href^="mailto:"]'
        ];


        for (
            const seletor
            of seletoresFallback
        ) {
            const elementos =
                Array.from(
                    document.querySelectorAll(
                        seletor
                    )
                );


            for (
                const elemento
                of elementos
            ) {
                if (
                    !elementoVisivel(
                        elemento
                    )
                ) {
                    continue;
                }


                const cartao =
                    localizarCartaoClientePorElemento(
                        elemento
                    );


                if (
                    cartao
                ) {
                    return cartao;
                }
            }
        }


        return null;
    }


    /* =========================================================
       NOME CLIENTE
       ========================================================= */

    function extrairNomeCliente(
        cartao
    ) {
        if (
            !cartao
        ) {
            return '';
        }


        const elemento =
            cartao.querySelector(
                'h3[title="Click to edit"]'
            );


        return normalizarEspacos(
            elemento?.textContent
        );
    }


    /* =========================================================
       EMAIL CLIENTE
       ========================================================= */

    function extrairEmailCliente(
        cartao
    ) {
        if (
            !cartao
        ) {
            return '';
        }


        const link =
            cartao.querySelector(
                'a[href^="mailto:"]'
            );


        if (
            !link
        ) {
            return '';
        }


        const href =
            String(
                link.getAttribute(
                    'href'
                ) ||
                ''
            )
                .replace(
                    /^mailto:/i,
                    ''
                );


        try {
            return decodeURIComponent(
                href
            ).trim();

        } catch (erro) {
            return href.trim();
        }
    }


    /* =========================================================
       TELEFONE CLIENTE
       ========================================================= */

    function extrairTelefoneCliente(
        cartao
    ) {
        if (
            !cartao
        ) {
            return '';
        }


        const link =
            cartao.querySelector(
                'a[href^="tel:"]'
            );


        if (
            !link
        ) {
            return '';
        }


        const href =
            String(
                link.getAttribute(
                    'href'
                ) ||
                ''
            )
                .replace(
                    /^tel:/i,
                    ''
                );


        return formatarTelefoneBR(
            href ||
            link.textContent
        );
    }


    /* =========================================================
       CPF CLIENTE
       ========================================================= */

    function extrairCPFCliente(
        cartao
    ) {
        if (
            !cartao
        ) {
            return '';
        }


        const icone =
            cartao.querySelector(
                '.contact-identify'
            );


        if (
            icone
        ) {
            let linha =
                icone.parentElement;


            for (
                let nivel = 0;
                nivel < 4 &&
                linha;
                nivel++
            ) {
                const spans =
                    Array.from(
                        linha.querySelectorAll(
                            'span'
                        )
                    );


                for (
                    const span
                    of spans
                ) {
                    const texto =
                        normalizarEspacos(
                            span.textContent
                        );


                    const numeros =
                        somenteNumeros(
                            texto
                        );


                    if (
                        numeros.length ===
                        11
                    ) {
                        return formatarCPF(
                            numeros
                        );
                    }
                }


                linha =
                    linha.parentElement;
            }
        }


        const spans =
            Array.from(
                cartao.querySelectorAll(
                    'span'
                )
            );


        for (
            const span
            of spans
        ) {
            const texto =
                normalizarEspacos(
                    span.textContent
                );


            if (
                texto.includes(
                    '+55'
                )
            ) {
                continue;
            }


            const numeros =
                somenteNumeros(
                    texto
                );


            if (
                numeros.length ===
                    11 &&
                !texto.includes(
                    '('
                )
            ) {
                return formatarCPF(
                    numeros
                );
            }
        }


        return '';
    }


    /* =========================================================
       ENDEREÇO CLIENTE
       ========================================================= */

    function extrairEnderecoCliente(
        cartao
    ) {
        if (
            !cartao
        ) {
            return '';
        }


        /*
         * Fonte oficial:
         *
         * SVG com classe MAP.
         */

        const iconesMapa =
            Array.from(
                cartao.querySelectorAll(
                    'svg.map'
                )
            );


        for (
            const icone
            of iconesMapa
        ) {
            const linha =
                icone.parentElement;


            if (
                !linha
            ) {
                continue;
            }


            const spanEndereco =
                Array
                    .from(
                        linha.children
                    )
                    .find(
                        elemento =>
                            elemento.tagName ===
                            'SPAN'
                    );


            if (
                !spanEndereco
            ) {
                continue;
            }


            const endereco =
                extrairTextoEnderecoDoSpan(
                    spanEndereco
                );


            if (
                endereco &&
                endereco.length >
                    5
            ) {
                return endereco;
            }
        }


        const elementosMapa =
            Array.from(
                cartao.querySelectorAll(
                    '.icon--font.map, .map'
                )
            );


        for (
            const icone
            of elementosMapa
        ) {
            const linha =
                icone.parentElement;


            if (
                !linha
            ) {
                continue;
            }


            const spans =
                Array
                    .from(
                        linha.children
                    )
                    .filter(
                        elemento =>
                            elemento.tagName ===
                            'SPAN'
                    );


            for (
                const span
                of spans
            ) {
                const endereco =
                    extrairTextoEnderecoDoSpan(
                        span
                    );


                if (
                    endereco &&
                    endereco.length >
                        5
                ) {
                    return endereco;
                }
            }
        }


        const elementosSemanticos =
            Array.from(
                cartao.querySelectorAll(
                    [
                        '[data-testid]',
                        '[data-attribute-key]',
                        '[aria-label]'
                    ].join(',')
                )
            );


        for (
            const elemento
            of elementosSemanticos
        ) {
            const identificacao =
                [
                    elemento.getAttribute(
                        'data-testid'
                    ),

                    elemento.getAttribute(
                        'data-attribute-key'
                    ),

                    elemento.getAttribute(
                        'aria-label'
                    )
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        ' '
                    )
                    .toLowerCase();


            if (
                !identificacao.includes(
                    'address'
                ) &&
                !identificacao.includes(
                    'endereco'
                ) &&
                !identificacao.includes(
                    'endereço'
                )
            ) {
                continue;
            }


            const endereco =
                extrairTextoLinhaEndereco(
                    elemento
                );


            if (
                endereco &&
                endereco.length >
                    5
            ) {
                return endereco;
            }
        }


        return '';
    }


    /* =========================================================
       DADOS CLIENTE
       ========================================================= */

    function obterDadosClienteAtual() {
        const cartao =
            localizarCartaoClienteAtual();


        /*
         * Quando o cartão for encontrado, todas as extrações ficam
         * restritas a ele, evitando misturar dados de outros elementos
         * da página.
         */

        if (
            cartao
        ) {
            return {
                nome:
                    extrairNomeCliente(
                        cartao
                    ),

                email:
                    extrairEmailCliente(
                        cartao
                    ),

                telefone:
                    extrairTelefoneCliente(
                        cartao
                    ),

                cpf:
                    extrairCPFCliente(
                        cartao
                    ),

                endereco:
                    extrairEnderecoCliente(
                        cartao
                    ),

                protocolo:
                    extrairProtocoloAtendimentoAtual()
            };
        }


        /*
         * Fallback defensivo: se uma alteração futura no HTML impedir
         * a identificação do contêiner completo, ainda tentamos obter
         * nome, telefone e endereço pelos elementos visíveis atuais.
         *
         * Este fallback é usado apenas quando localizarCartaoClienteAtual()
         * realmente não encontrou nenhum cartão.
         */

        const nomeGlobal =
            Array.from(
                document.querySelectorAll(
                    'h3[title="Click to edit"]'
                )
            )
                .find(
                    elementoVisivel
                );


        const telefoneGlobal =
            Array.from(
                document.querySelectorAll(
                    'a[href^="tel:"]'
                )
            )
                .find(
                    elementoVisivel
                );


        const mapaGlobal =
            Array.from(
                document.querySelectorAll(
                    'svg.map, .icon--font.map'
                )
            )
                .find(
                    elementoVisivel
                );


        let enderecoGlobal =
            '';


        if (
            mapaGlobal?.parentElement
        ) {
            const spanEndereco =
                Array.from(
                    mapaGlobal.parentElement.children
                )
                    .find(
                        elemento =>
                            elemento.tagName ===
                            'SPAN'
                    );


            enderecoGlobal =
                extrairTextoEnderecoDoSpan(
                    spanEndereco
                );
        }


        return {
            nome:
                normalizarEspacos(
                    nomeGlobal?.textContent
                ),

            email:
                '',

            telefone:
                telefoneGlobal
                    ?
                    formatarTelefoneBR(
                        String(
                            telefoneGlobal.getAttribute(
                                'href'
                            ) ||
                            telefoneGlobal.textContent ||
                            ''
                        )
                            .replace(
                                /^tel:/i,
                                ''
                            )
                    )
                    :
                    '',

            cpf:
                '',

            endereco:
                enderecoGlobal,

            protocolo:
                extrairProtocoloAtendimentoAtual()
        };
    }


    /* =========================================================
       TEXTO COPIADO
       ========================================================= */

    function montarTextoDadosCliente(
        dados
    ) {
        return [
            `👤 Nome: ${dados.nome || 'Não informado'}`,
            `📧 E-mail: ${dados.email || 'Não informado'}`,
            `📱 Telefone: ${dados.telefone || 'Não informado'}`,
            `🪪 CPF: ${dados.cpf || 'Não informado'}`,
            `📍 Endereço: ${dados.endereco || 'Não informado'}`,
            `🎫 Protocolo: ${dados.protocolo || 'Não informado'}`
        ]
            .join(
                '\n'
            );
    }


    /* =========================================================
       FEEDBACK DO BOTÃO
       ========================================================= */

    function mostrarFeedbackBotaoCliente(
        botao
    ) {
        if (
            !botao
        ) {
            return;
        }


        const original =
            botao.innerHTML;


        botao.classList.add(
            'way-msg-client-copy-success'
        );


        botao.textContent =
            '✓';


        setTimeout(
            function () {
                botao.classList.remove(
                    'way-msg-client-copy-success'
                );


                botao.innerHTML =
                    original;
            },
            1300
        );
    }


    /* =========================================================
       ÍCONE COPIAR
       ========================================================= */

    function criarIconeCopiarCliente() {
        return `
            <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >

                <rect
                    x="8"
                    y="8"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="2"
                ></rect>

                <path
                    d="M16 8V6C16 4.89543 15.1046 4 14 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                ></path>

            </svg>
        `;
    }


    /* =========================================================
       BOTÃO COPIAR CLIENTE
       ========================================================= */

    function configurarBotaoCopiarDadosCliente() {
        const nomes =
            Array.from(
                document.querySelectorAll(
                    'h3[title="Click to edit"]'
                )
            );


        nomes.forEach(
            nome => {
                if (
                    !elementoVisivel(
                        nome
                    )
                ) {
                    return;
                }


                const cartao =
                    localizarCartaoClientePorElemento(
                        nome
                    );


                if (
                    !cartao
                ) {
                    return;
                }


                /*
                 * Não exigimos mais e-mail e telefone simultaneamente.
                 * O cliente pode ter e-mail indisponível e ainda assim
                 * possuir nome, telefone, CPF ou endereço válidos.
                 */

                const grupoNome =
                    nome.parentElement;


                if (
                    !grupoNome
                ) {
                    return;
                }


                const botaoExistente =
                    Array
                        .from(
                            grupoNome.children
                        )
                        .find(
                            elemento =>
                                elemento.classList
                                    ?.contains(
                                        'way-msg-copy-client-data'
                                    )
                        );


                if (
                    botaoExistente
                ) {
                    if (
                        !botaoExistente.querySelector(
                            'svg'
                        )
                    ) {
                        botaoExistente.innerHTML =
                            criarIconeCopiarCliente();
                    }


                    return;
                }


                const botao =
                    document.createElement(
                        'button'
                    );


                botao.type =
                    'button';


                botao.className =
                    'way-msg-copy-client-data';


                botao.dataset.wayCopyClient =
                    'true';


                botao.innerHTML =
                    criarIconeCopiarCliente();


                botao.title =
                    'Copiar dados formatados do cliente';


                botao.setAttribute(
                    'aria-label',
                    'Copiar dados formatados do cliente'
                );


                botao.addEventListener(
                    'mousedown',

                    function (
                        event
                    ) {
                        event.preventDefault();

                        event.stopPropagation();
                    }
                );


                botao.addEventListener(
                    'click',

                    async function (
                        event
                    ) {
                        event.preventDefault();

                        event.stopPropagation();


                        const dados = {
                            nome:
                                extrairNomeCliente(
                                    cartao
                                ),

                            email:
                                extrairEmailCliente(
                                    cartao
                                ),

                            telefone:
                                extrairTelefoneCliente(
                                    cartao
                                ),

                            cpf:
                                extrairCPFCliente(
                                    cartao
                                ),

                            endereco:
                                extrairEnderecoCliente(
                                    cartao
                                ),

                            protocolo:
                                extrairProtocoloAtendimentoAtual()
                        };


                        const texto =
                            montarTextoDadosCliente(
                                dados
                            );


                        const sucesso =
                            await copiarTexto(
                                texto
                            );


                        if (
                            sucesso
                        ) {
                            mostrarFeedbackBotaoCliente(
                                botao
                            );
                        }
                    }
                );


                grupoNome.appendChild(
                    botao
                );
            }
        );
    }


    /* =========================================================
       NOME ATENDENTE
       ========================================================= */

    function obterNomeUsuarioExibicao() {
        const botoes =
            document.querySelectorAll(
                'button'
            );


        const regexEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        for (
            const botao
            of botoes
        ) {
            const containers =
                botao.querySelectorAll(
                    'div.min-w-0'
                );


            for (
                const container
                of containers
            ) {
                const filhos =
                    Array.from(
                        container.children
                    );


                if (
                    filhos.length <
                    2
                ) {
                    continue;
                }


                const email =
                    filhos.find(
                        filho =>
                            regexEmail.test(
                                normalizarEspacos(
                                    filho.textContent
                                )
                            )
                    );


                if (
                    !email
                ) {
                    continue;
                }


                for (
                    const filho
                    of filhos
                ) {
                    if (
                        filho ===
                        email
                    ) {
                        continue;
                    }


                    const nome =
                        normalizarEspacos(
                            filho.textContent
                        );


                    if (
                        !nome ||
                        regexEmail.test(
                            nome
                        ) ||
                        nome.length >
                        100
                    ) {
                        continue;
                    }


                    return nome;
                }
            }
        }


        return '';
    }


    /* =========================================================
       TAGS GLOBAIS
       ========================================================= */

    function obterDadosGlobaisSistema() {
        const cliente =
            obterDadosClienteAtual();


        return {
            nome:
                obterNomeUsuarioExibicao(),

            nomecliente:
                cliente.nome,

            email:
                cliente.email,

            telefone:
                cliente.telefone,

            cpf:
                cliente.cpf,

            endereco:
                cliente.endereco,

            protocolo:
                cliente.protocolo
        };
    }


    function aplicarTagsGlobais(
        texto,
        dadosAdicionais = {}
    ) {
        texto =
            String(
                texto ?? ''
            );


        const valores = {
            ...obterDadosGlobaisSistema(),
            ...dadosAdicionais
        };


        return texto.replace(
            /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g,

            function (
                correspondencia,
                nomeTag
            ) {
                const tag =
                    String(
                        nomeTag
                    )
                        .trim()
                        .toLowerCase();


                if (
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            TAGS_GLOBAIS,
                            tag
                        )
                ) {
                    return correspondencia;
                }


                const valor =
                    valores[
                        tag
                    ];


                if (
                    valor ===
                        undefined ||
                    valor ===
                        null ||
                    String(
                        valor
                    )
                        .trim() ===
                        ''
                ) {
                    return correspondencia;
                }


                return String(
                    valor
                );
            }
        );
    }


    /* =========================================================
       TAGS TEMPLATE
       ========================================================= */

    function extrairTagsTemplate(
        template
    ) {
        const tags =
            [];


        const adicionadas =
            new Set();


        const regex =
            /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;


        let resultado;


        while (
            (
                resultado =
                    regex.exec(
                        String(
                            template ??
                            ''
                        )
                    )
            )
        ) {
            const tag =
                String(
                    resultado[1]
                )
                    .trim()
                    .toLowerCase();


            if (
                !tag ||
                adicionadas.has(
                    tag
                )
            ) {
                continue;
            }


            adicionadas.add(
                tag
            );


            tags.push(
                tag
            );
        }


        return tags;
    }


    function criarNomeAmigavelTag(
        tag
    ) {
        if (
            TAGS_VISITA[
                tag
            ]
        ) {
            return TAGS_VISITA[
                tag
            ].label;
        }


        if (
            TAGS_GLOBAIS[
                tag
            ]
        ) {
            return TAGS_GLOBAIS[
                tag
            ].label;
        }


        const texto =
            String(
                tag
            )
                .replace(
                    /[_-]+/g,
                    ' '
                )
                .trim();


        return (
            texto.charAt(0)
                .toUpperCase() +
            texto.slice(1)
        );
    }


    function obterDadosVisitaSistema() {
        return {
            ...obterDadosGlobaisSistema()
        };
    }


    /* =========================================================
       STORAGE
       ========================================================= */

    function obterMensagensNativas() {
        const mensagens =
            globalThis
                .WAY_TOOLS_NATIVE_MESSAGES;


        if (
            !Array.isArray(
                mensagens
            )
        ) {
            return [];
        }


        return mensagens.map(
            mensagem => ({
                ...mensagem
            })
        );
    }


    function carregarMensagens() {
        try {
            const dados =
                GM_getValue(
                    CONFIG.storageKey,
                    null
                );


            return Array.isArray(
                dados
            )
                ?
                dados
                :
                obterMensagensNativas();

        } catch (erro) {
            console.error(
                '[Way Mensagens] Erro ao carregar:',
                erro
            );


            return obterMensagensNativas();
        }
    }


    function salvarMensagens(
        mensagens
    ) {
        try {
            GM_setValue(
                CONFIG.storageKey,
                mensagens
            );


            return true;

        } catch (erro) {
            console.error(
                '[Way Mensagens] Erro ao salvar:',
                erro
            );


            return false;
        }
    }


    /* =========================================================
       COMANDO
       ========================================================= */

    function normalizarComando(
        comando
    ) {
        comando =
            String(
                comando ?? ''
            )
                .trim()
                .toLowerCase();


        if (
            comando.startsWith(
                CONFIG.prefixoComando
            )
        ) {
            comando =
                comando.slice(
                    CONFIG
                        .prefixoComando
                        .length
                );
        }


        return comando
            .replace(
                /\s+/g,
                ''
            )
            .replace(
                /[^a-z0-9_-]/gi,
                ''
            );
    }


    /* =========================================================
       CATEGORIAS
       ========================================================= */

    function obterNomeCategoria(
        categoria
    ) {
        if (
            categoria &&
            CATEGORIAS[
                categoria
            ]
        ) {
            return CATEGORIAS[
                categoria
            ].label;
        }


        return '⚪ Sem categoria';
    }


    function gerarOptionsCategorias(
        selecionada
    ) {
        let html = `
            <option value="">
                Selecione uma categoria...
            </option>
        `;


        Object.entries(
            CATEGORIAS
        )
            .forEach(
                ([
                    id,
                    categoria
                ]) => {
                    html += `
                        <option
                            value="${escaparHTML(id)}"
                            ${
                                selecionada ===
                                id
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            ${escaparHTML(
                                categoria.label
                            )}
                        </option>
                    `;
                }
            );


        return html;
    }


    function mensagemPertenceCategoria(
        mensagem,
        categoria
    ) {
        if (
            categoria ===
            CATEGORIA_SEM_CATEGORIA
        ) {
            return (
                !mensagem.categoria ||
                !CATEGORIAS[
                    mensagem.categoria
                ]
            );
        }


        return (
            mensagem.categoria ===
            categoria
        );
    }


    function obterCategoriasAutocomplete() {
        const mensagens =
            carregarMensagens();


        const resultado =
            [];


        Object.entries(
            CATEGORIAS
        )
            .forEach(
                ([
                    id,
                    categoria
                ]) => {
                    const comandos =
                        mensagens
                            .filter(
                                mensagem =>
                                    mensagemPertenceCategoria(
                                        mensagem,
                                        id
                                    )
                            )
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    String(
                                        a.comando
                                    )
                                        .localeCompare(
                                            String(
                                                b.comando
                                            )
                                        )
                            );


                    if (
                        !comandos.length
                    ) {
                        return;
                    }


                    resultado.push({
                        id,
                        label:
                            categoria.label,

                        quantidade:
                            comandos.length,

                        comandos
                    });
                }
            );


        const semCategoria =
            mensagens
                .filter(
                    mensagem =>
                        mensagemPertenceCategoria(
                            mensagem,
                            CATEGORIA_SEM_CATEGORIA
                        )
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        String(
                            a.comando
                        )
                            .localeCompare(
                                String(
                                    b.comando
                                )
                            )
                );


        if (
            semCategoria.length
        ) {
            resultado.push({
                id:
                    CATEGORIA_SEM_CATEGORIA,

                label:
                    '⚪ Sem categoria',

                quantidade:
                    semCategoria.length,

                comandos:
                    semCategoria
            });
        }


        return resultado;
    }


    function obterMensagensCategoria(
        categoria
    ) {
        return carregarMensagens()
            .filter(
                mensagem =>
                    mensagemPertenceCategoria(
                        mensagem,
                        categoria
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.comando
                    )
                        .localeCompare(
                            String(
                                b.comando
                            )
                        )
            );
    }


    /* =========================================================
       HORÁRIO
       ========================================================= */

    function obterPeriodoAtual() {
        const hora =
            new Date()
                .getHours();


        if (
            hora >= 5 &&
            hora < 12
        ) {
            return 'manha';
        }


        if (
            hora >= 12 &&
            hora < 18
        ) {
            return 'tarde';
        }


        return 'noite';
    }


    function obterNomePeriodoAtual() {
        const periodo =
            obterPeriodoAtual();


        if (
            periodo ===
            'manha'
        ) {
            return 'Manhã';
        }


        if (
            periodo ===
            'tarde'
        ) {
            return 'Tarde';
        }


        return 'Noite';
    }


    function obterHoraAtual() {
        const agora =
            new Date();


        return (
            String(
                agora.getHours()
            ).padStart(
                2,
                '0'
            ) +
            ':' +
            String(
                agora.getMinutes()
            ).padStart(
                2,
                '0'
            )
        );
    }


    function obterTextoMensagem(
        mensagem
    ) {
        if (
            !mensagem
        ) {
            return '';
        }


        let texto =
            '';


        if (
            mensagem.variacaoHorario
        ) {
            texto =
                mensagem[
                    obterPeriodoAtual()
                ] ||
                '';

        } else {
            texto =
                mensagem.mensagem ||
                '';
        }


        return aplicarTagsGlobais(
            texto
        );
    }


    /* =========================================================
       DATA
       ========================================================= */

    function obterDataHojeInput() {
        const hoje =
            new Date();


        return (
            hoje.getFullYear() +
            '-' +
            String(
                hoje.getMonth() + 1
            ).padStart(
                2,
                '0'
            ) +
            '-' +
            String(
                hoje.getDate()
            ).padStart(
                2,
                '0'
            )
        );
    }


    function criarDataLocal(
        valor
    ) {
        if (
            !valor
        ) {
            return null;
        }


        const partes =
            String(
                valor
            )
                .split(
                    '-'
                );


        if (
            partes.length !==
            3
        ) {
            return null;
        }


        return new Date(
            Number(
                partes[0]
            ),
            Number(
                partes[1]
            ) - 1,
            Number(
                partes[2]
            )
        );
    }


    function formatarDataCompleta(
        valor
    ) {
        const data =
            criarDataLocal(
                valor
            );


        if (
            !data ||
            Number.isNaN(
                data.getTime()
            )
        ) {
            return '';
        }


        const dias = [
            'Domingo',
            'Segunda-Feira',
            'Terça-Feira',
            'Quarta-Feira',
            'Quinta-Feira',
            'Sexta-Feira',
            'Sábado'
        ];


        return (
            dias[
                data.getDay()
            ] +
            ' ' +
            String(
                data.getDate()
            ).padStart(
                2,
                '0'
            ) +
            '/' +
            String(
                data.getMonth() + 1
            ).padStart(
                2,
                '0'
            ) +
            '/' +
            data.getFullYear()
        );
    }


    function obterReferenciaData(
        valor
    ) {
        const selecionada =
            criarDataLocal(
                valor
            );


        if (
            !selecionada
        ) {
            return '';
        }


        const hoje =
            new Date();


        hoje.setHours(
            0,
            0,
            0,
            0
        );


        selecionada.setHours(
            0,
            0,
            0,
            0
        );


        const diferenca =
            Math.round(
                (
                    selecionada -
                    hoje
                ) /
                86400000
            );


        if (
            diferenca ===
            0
        ) {
            return '**HOJE**';
        }


        if (
            diferenca ===
            1
        ) {
            return '**AMANHÃ**';
        }


        return '';
    }


    /* =========================================================
       DISPONIBILIDADE
       ========================================================= */

    function montarListaPeriodos(
        selecionados
    ) {
        const trechos =
            selecionados.map(
                chave => {
                    const periodo =
                        PERIODOS_ATENDIMENTO[
                            chave
                        ];


                    return (
                        `da **${periodo.nome.toLowerCase()}**, ` +
                        `das **${periodo.inicio.replace(':00', '')} às ${periodo.fim.replace(':00', '')}**`
                    );
                }
            );


        if (
            trechos.length ===
            1
        ) {
            return (
                'no período ' +
                trechos[0]
            );
        }


        if (
            trechos.length ===
            2
        ) {
            return (
                'nos períodos ' +
                trechos[0] +
                ', ou ' +
                trechos[1]
            );
        }


        return (
            'nos períodos ' +
            trechos[0] +
            ', ' +
            trechos[1] +
            ', ou ' +
            trechos[2]
        );
    }


    function gerarMensagemDisponibilidade(
        data,
        periodos
    ) {
        if (
            !data ||
            !periodos.length
        ) {
            return '';
        }


        const referencia =
            obterReferenciaData(
                data
            );


        const dataFormatada =
            formatarDataCompleta(
                data
            );


        const dataTexto =
            referencia
                ?
                `${referencia}, **${dataFormatada}**`
                :
                `**${dataFormatada}**`;


        const lista =
            montarListaPeriodos(
                periodos
            );


        const pergunta =
            periodos.length ===
                1
                ?
                'Esse período seria conveniente para você?'
                :
                'Qual desses períodos seria mais conveniente para você?';


        return (
`Temos disponibilidade para atendimento ${dataTexto} ${lista}. 😊 ${pergunta}

A previsão para realização do atendimento é dentro do período informado, não sendo possível definir um horário específico.`
        );
    }


    /* =========================================================
       VISITA
       ========================================================= */

    function formatarValorTagVisita(
        tag,
        valor
    ) {
        valor =
            String(
                valor ??
                ''
            );


        if (
            tag ===
            'data'
        ) {
            return formatarDataCompleta(
                valor
            );
        }


        if (
            tag ===
            'periodo'
        ) {
            return (
                PERIODOS_ATENDIMENTO[
                    valor
                ]?.nome ||
                valor
            );
        }


        return valor;
    }


    function gerarMensagemVisita(
        template,
        valores,
        manterTagsVazias = true
    ) {
        let resultado =
            String(
                template ??
                ''
            )
                .replace(
                    /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g,

                    function (
                        correspondencia,
                        tagOriginal
                    ) {
                        const tag =
                            String(
                                tagOriginal
                            )
                                .toLowerCase();


                        const bruto =
                            valores[
                                tag
                            ];


                        if (
                            bruto ===
                                undefined ||
                            bruto ===
                                null ||
                            String(
                                bruto
                            )
                                .trim() ===
                                ''
                        ) {
                            return manterTagsVazias
                                ?
                                correspondencia
                                :
                                '';
                        }


                        return formatarValorTagVisita(
                            tag,
                            bruto
                        );
                    }
                );


        resultado =
            aplicarTagsGlobais(
                resultado,
                valores
            );


        return resultado;
    }


    /* =========================================================
       TEMA
       ========================================================= */

    function limparClassesTemaWay(
        texto
    ) {
        return String(
            texto ||
            ''
        )
            .replace(
                /way-msg-theme-dark/gi,
                ''
            )
            .replace(
                /way-msg-theme-light/gi,
                ''
            );
    }


    function detectarTemaDeclarado(
        elemento
    ) {
        if (
            !elemento
        ) {
            return '';
        }


        const valores = [
            limparClassesTemaWay(
                elemento.className
            ),

            elemento.getAttribute?.(
                'data-theme'
            ),

            elemento.getAttribute?.(
                'data-color-scheme'
            ),

            elemento.getAttribute?.(
                'theme'
            ),

            elemento.getAttribute?.(
                'color-scheme'
            )
        ]
            .filter(
                Boolean
            )
            .join(
                ' '
            )
            .toLowerCase();


        if (
            /(^|[\s_-])(dark|escuro|night)(?=$|[\s_-])/i
                .test(
                    valores
                )
        ) {
            return 'dark';
        }


        if (
            /(^|[\s_-])(light|claro)(?=$|[\s_-])/i
                .test(
                    valores
                )
        ) {
            return 'light';
        }


        return '';
    }


    function converterCorRGB(
        cor
    ) {
        if (
            !cor ||
            cor ===
                'transparent'
        ) {
            return null;
        }


        const numeros =
            String(
                cor
            )
                .match(
                    /[\d.]+/g
                );


        if (
            !numeros ||
            numeros.length <
                3
        ) {
            return null;
        }


        const alpha =
            numeros.length >=
                4
                ?
                Number(
                    numeros[3]
                )
                :
                1;


        if (
            alpha <=
            0.05
        ) {
            return null;
        }


        return {
            r:
                Number(
                    numeros[0]
                ),

            g:
                Number(
                    numeros[1]
                ),

            b:
                Number(
                    numeros[2]
                )
        };
    }


    function calcularLuminancia(
        rgb
    ) {
        if (
            !rgb
        ) {
            return null;
        }


        return (
            (
                0.2126 *
                rgb.r
            ) +
            (
                0.7152 *
                rgb.g
            ) +
            (
                0.0722 *
                rgb.b
            )
        ) /
        255;
    }


    function detectarTemaAplicativo() {
        const declarado =
            detectarTemaDeclarado(
                document.documentElement
            ) ||
            detectarTemaDeclarado(
                document.body
            );


        if (
            declarado
        ) {
            return declarado;
        }


        const candidatos = [
            document.body,

            document.querySelector(
                '#app'
            ),

            document.querySelector(
                '#root'
            ),

            document.querySelector(
                '[data-v-app]'
            ),

            document.querySelector(
                'main'
            ),

            document.documentElement
        ]
            .filter(
                Boolean
            );


        for (
            const elemento
            of candidatos
        ) {
            try {
                const rgb =
                    converterCorRGB(
                        getComputedStyle(
                            elemento
                        )
                            .backgroundColor
                    );


                const luminancia =
                    calcularLuminancia(
                        rgb
                    );


                if (
                    luminancia !==
                    null
                ) {
                    return luminancia <
                        0.46
                        ?
                        'dark'
                        :
                        'light';
                }

            } catch (erro) {
            }
        }


        try {
            return window
                .matchMedia(
                    '(prefers-color-scheme: dark)'
                )
                .matches
                ?
                'dark'
                :
                'light';

        } catch (erro) {
            return 'light';
        }
    }


    function aplicarTemaAplicativo() {
        const root =
            document.documentElement;


        if (
            !root
        ) {
            return;
        }


        const tema =
            detectarTemaAplicativo();


        if (
            tema ===
            ultimoTemaDetectado
        ) {
            return;
        }


        ultimoTemaDetectado =
            tema;


        root.classList.toggle(
            'way-msg-theme-dark',
            tema ===
            'dark'
        );


        root.classList.toggle(
            'way-msg-theme-light',
            tema ===
            'light'
        );


        root.dataset.wayMsgTheme =
            tema;
    }


    function iniciarSincronizacaoTema() {
        aplicarTemaAplicativo();


        try {
            const media =
                window.matchMedia(
                    '(prefers-color-scheme: dark)'
                );


            media.addEventListener?.(
                'change',
                aplicarTemaAplicativo
            );

        } catch (erro) {
        }


        setInterval(
            aplicarTemaAplicativo,
            CONFIG.intervaloTema
        );
    }


    /* =========================================================
       CSS
       ========================================================= */

    function adicionarCSS() {
        if (
            document.getElementById(
                'way-msg-personalizadas-css'
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'way-msg-personalizadas-css';


        style.textContent = `

            :root,
            :root.way-msg-theme-dark {
                --way-page:#0f1115;
                --way-panel:#16181d;
                --way-panel-2:#1c1f25;
                --way-panel-3:#13151a;
                --way-input:#111318;
                --way-hover:#202b3a;
                --way-hover-2:#292d35;
                --way-border:#343942;
                --way-border-soft:#292d35;
                --way-text:#e5e7eb;
                --way-text-strong:#f8fafc;
                --way-text-soft:#9ca3af;
                --way-text-muted:#64748b;
                --way-blue:#3b82f6;
                --way-blue-bg:#2563eb;
                --way-blue-hover:#1d4ed8;
                --way-shadow:rgba(0,0,0,.58);
                --way-overlay:rgba(0,0,0,.76);
                --way-color-scheme:dark;

                --way-inactivity-yellow-bg:rgba(234,179,8,.08);
                --way-inactivity-yellow-bg-hover:rgba(234,179,8,.13);
                --way-inactivity-yellow-border:rgba(250,204,21,.34);
                --way-inactivity-yellow-text:#facc15;
                --way-inactivity-yellow-time-bg:rgba(234,179,8,.13);

                --way-inactivity-orange-bg:rgba(249,115,22,.11);
                --way-inactivity-orange-bg-hover:rgba(249,115,22,.17);
                --way-inactivity-orange-border:rgba(251,146,60,.45);
                --way-inactivity-orange-text:#fb923c;
                --way-inactivity-orange-time-bg:rgba(249,115,22,.16);

                --way-inactivity-red-bg:rgba(239,68,68,.13);
                --way-inactivity-red-bg-hover:rgba(239,68,68,.19);
                --way-inactivity-red-border:rgba(248,113,113,.52);
                --way-inactivity-red-text:#f87171;
                --way-inactivity-red-time-bg:rgba(239,68,68,.18);
            }


            :root.way-msg-theme-light {
                --way-page:#eef1f5;
                --way-panel:#ffffff;
                --way-panel-2:#f7f8fa;
                --way-panel-3:#f3f5f7;
                --way-input:#ffffff;
                --way-hover:#edf4ff;
                --way-hover-2:#e9edf2;
                --way-border:#d5dae1;
                --way-border-soft:#e3e6eb;
                --way-text:#27303f;
                --way-text-strong:#111827;
                --way-text-soft:#667085;
                --way-text-muted:#8892a0;
                --way-blue:#2563eb;
                --way-blue-bg:#2563eb;
                --way-blue-hover:#1d4ed8;
                --way-shadow:rgba(15,23,42,.20);
                --way-overlay:rgba(15,23,42,.36);
                --way-color-scheme:light;

                --way-inactivity-yellow-bg:rgba(250,204,21,.10);
                --way-inactivity-yellow-bg-hover:rgba(250,204,21,.16);
                --way-inactivity-yellow-border:rgba(202,138,4,.28);
                --way-inactivity-yellow-text:#a16207;
                --way-inactivity-yellow-time-bg:rgba(250,204,21,.16);

                --way-inactivity-orange-bg:rgba(249,115,22,.10);
                --way-inactivity-orange-bg-hover:rgba(249,115,22,.15);
                --way-inactivity-orange-border:rgba(234,88,12,.34);
                --way-inactivity-orange-text:#c2410c;
                --way-inactivity-orange-time-bg:rgba(249,115,22,.15);

                --way-inactivity-red-bg:rgba(239,68,68,.09);
                --way-inactivity-red-bg-hover:rgba(239,68,68,.14);
                --way-inactivity-red-border:rgba(220,38,38,.36);
                --way-inactivity-red-text:#dc2626;
                --way-inactivity-red-time-bg:rgba(239,68,68,.13);
            }


            /* =================================================
               ALERTA DE INATIVIDADE
               ================================================= */

            .conversation.way-msg-inactivity-yellow {
                background:
                    var(--way-inactivity-yellow-bg) !important;

                border-bottom-color:
                    var(--way-inactivity-yellow-border) !important;

                box-shadow:
                    inset 3px 0 0
                    var(--way-inactivity-yellow-text) !important;
            }


            .conversation.way-msg-inactivity-yellow:hover {
                background:
                    var(--way-inactivity-yellow-bg-hover) !important;
            }


            .conversation.way-msg-inactivity-orange {
                background:
                    var(--way-inactivity-orange-bg) !important;

                border-bottom-color:
                    var(--way-inactivity-orange-border) !important;

                box-shadow:
                    inset 3px 0 0
                    var(--way-inactivity-orange-text) !important;
            }


            .conversation.way-msg-inactivity-orange:hover {
                background:
                    var(--way-inactivity-orange-bg-hover) !important;
            }


            .conversation.way-msg-inactivity-red {
                background:
                    var(--way-inactivity-red-bg) !important;

                border-bottom-color:
                    var(--way-inactivity-red-border) !important;

                box-shadow:
                    inset 3px 0 0
                    var(--way-inactivity-red-text) !important;
            }


            .conversation.way-msg-inactivity-red:hover {
                background:
                    var(--way-inactivity-red-bg-hover) !important;
            }


            .conversation.way-msg-inactivity-yellow
            .conversation--user,
            .conversation.way-msg-inactivity-orange
            .conversation--user,
            .conversation.way-msg-inactivity-red
            .conversation--user {
                color:
                    var(--way-text-strong) !important;
            }


            .way-msg-inactivity-time {
                font-weight:
                    700 !important;

                border-radius:
                    5px !important;

                padding:
                    1px 4px !important;
            }


            .way-msg-inactivity-time-yellow {
                color:
                    var(--way-inactivity-yellow-text) !important;

                background:
                    var(--way-inactivity-yellow-time-bg) !important;

                box-shadow:
                    inset 0 0 0 1px
                    var(--way-inactivity-yellow-border) !important;
            }


            .way-msg-inactivity-time-orange {
                color:
                    var(--way-inactivity-orange-text) !important;

                background:
                    var(--way-inactivity-orange-time-bg) !important;

                box-shadow:
                    inset 0 0 0 1px
                    var(--way-inactivity-orange-border) !important;
            }


            .way-msg-inactivity-time-red {
                color:
                    var(--way-inactivity-red-text) !important;

                background:
                    var(--way-inactivity-red-time-bg) !important;

                font-weight:
                    800 !important;

                box-shadow:
                    inset 0 0 0 1px
                    var(--way-inactivity-red-border) !important;
            }


            /* =================================================
               BOTÃO COPIAR CLIENTE
               ================================================= */

            .way-msg-copy-client-data {
                display:inline-flex!important;
                align-items:center!important;
                justify-content:center!important;
                flex-shrink:0!important;

                width:27px!important;
                min-width:27px!important;
                height:27px!important;
                min-height:27px!important;

                padding:0!important;
                margin:0!important;

                border:
                    1px solid
                    rgba(59,130,246,.30)!important;

                border-radius:7px!important;

                background:
                    rgba(59,130,246,.08)!important;

                color:#3b82f6!important;

                cursor:pointer!important;
                outline:none!important;
                box-shadow:none!important;
            }


            .way-msg-copy-client-data:hover {
                background:
                    rgba(59,130,246,.16)!important;

                border-color:
                    #3b82f6!important;
            }


            .way-msg-copy-client-data:active {
                transform:
                    scale(.94)!important;
            }


            .way-msg-copy-client-data svg {
                display:block!important;
                width:16px!important;
                height:16px!important;
                min-width:16px!important;
                min-height:16px!important;
                pointer-events:none!important;
                stroke:currentColor!important;
            }


            .way-msg-client-copy-success {
                color:#16a34a!important;

                border-color:
                    rgba(22,163,74,.45)!important;

                background:
                    rgba(22,163,74,.12)!important;
            }


            /* =================================================
               MENU
               ================================================= */

            .way-msg-menu-item {
                position:relative!important;
            }


            .way-msg-menu-link {
                cursor:pointer!important;
            }


            /* =================================================
               MODAL PRINCIPAL
               ================================================= */

            .way-msg-overlay {
                position:fixed!important;
                inset:0!important;
                z-index:2147483646!important;

                display:flex!important;

                width:100vw!important;
                height:100vh!important;

                margin:0!important;
                padding:0!important;

                background:
                    var(--way-page)!important;

                color-scheme:
                    var(--way-color-scheme)!important;
            }


            .way-msg-modal {
                display:flex!important;
                flex-direction:column!important;

                width:100vw!important;
                height:100vh!important;

                overflow:hidden!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;

                font-family:
                    inherit!important;
            }


            .way-msg-header {
                display:flex!important;
                align-items:center!important;
                justify-content:space-between!important;

                min-height:68px!important;

                padding:
                    10px 18px!important;

                box-sizing:
                    border-box!important;

                background:
                    var(--way-panel-2)!important;

                border-bottom:
                    1px solid
                    var(--way-border)!important;

                gap:16px!important;
            }


            .way-msg-header-left {
                display:flex!important;
                flex-direction:column!important;

                min-width:0!important;

                gap:2px!important;
            }


            .way-msg-title {
                margin:0!important;

                color:
                    var(--way-text-strong)!important;

                font-size:18px!important;
                font-weight:700!important;
            }


            .way-msg-subtitle {
                color:
                    var(--way-text-soft)!important;

                font-size:11px!important;
            }


            .way-msg-header-actions {
                display:flex!important;
                align-items:center!important;

                gap:7px!important;
            }


            .way-msg-header-backup {
                display:inline-flex!important;
                align-items:center!important;

                gap:6px!important;

                padding-right:9px!important;

                border-right:
                    1px solid
                    var(--way-border)!important;
            }


            .way-msg-backup-button {
                min-height:32px!important;

                padding:
                    5px 10px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;

                cursor:pointer!important;

                font:inherit!important;
                font-size:10px!important;
                font-weight:600!important;
            }


            .way-msg-backup-button:hover {
                background:
                    var(--way-hover)!important;

                border-color:
                    var(--way-blue)!important;
            }


            .way-msg-export {
                color:#16a34a!important;
            }


            .way-msg-import {
                color:#3b82f6!important;
            }


            .way-msg-close {
                width:36px!important;
                height:36px!important;

                border:0!important;
                border-radius:7px!important;

                background:
                    transparent!important;

                color:
                    var(--way-text-soft)!important;

                cursor:pointer!important;

                font-size:24px!important;
            }


            .way-msg-close:hover {
                background:
                    var(--way-hover-2)!important;

                color:
                    var(--way-text-strong)!important;
            }


            .way-msg-backup-status {
                display:none!important;

                margin-top:3px!important;

                font-size:10px!important;
            }


            .way-msg-backup-status.success {
                display:block!important;
                color:#10b981!important;
            }


            .way-msg-backup-status.error {
                display:block!important;
                color:#ef4444!important;
            }


            /* =================================================
               ABAS DE CONFIGURAÇÃO
               ================================================= */

            .way-msg-config-tabs {
                display:flex!important;
                align-items:center!important;

                gap:6px!important;

                padding:
                    8px 18px!important;

                background:
                    var(--way-panel-2)!important;

                border-bottom:
                    1px solid
                    var(--way-border)!important;
            }


            .way-msg-config-tab {
                min-height:32px!important;

                padding:
                    5px 11px!important;

                border:
                    1px solid
                    transparent!important;

                border-radius:7px!important;

                background:
                    transparent!important;

                color:
                    var(--way-text-soft)!important;

                cursor:pointer!important;

                font:inherit!important;
                font-size:10px!important;
                font-weight:700!important;
            }


            .way-msg-config-tab:hover {
                background:
                    var(--way-hover)!important;

                color:
                    var(--way-text)!important;
            }


            .way-msg-config-tab.active {
                border-color:
                    rgba(59,130,246,.35)!important;

                background:
                    rgba(59,130,246,.12)!important;

                color:
                    var(--way-blue)!important;
            }


            .way-msg-body.way-msg-alertas-mode {
                grid-template-columns:
                    minmax(0,1fr)!important;
            }


            .way-msg-body.way-msg-alertas-mode
            .way-msg-sidebar {
                display:none!important;
            }



            /* =================================================
               TELA DE EXIBIÇÃO - ALERTAS DE INATIVIDADE
               Mantém a barra lateral nativa visível.
               ================================================= */

            .way-alert-display-screen {
                position:fixed!important;

                top:0!important;
                bottom:0!important;
                right:0;

                z-index:35!important;

                min-width:0!important;

                overflow:hidden!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;
            }


            .way-alert-display-scroll {
                width:100%!important;
                height:100%!important;

                min-width:0!important;

                box-sizing:border-box!important;
            }


            .way-alert-display-editor {
                min-height:0!important;

                padding:0!important;

                overflow:visible!important;

                background:
                    transparent!important;
            }


            [data-way-alert-menu="true"].way-alert-menu-active
            > .way-alert-menu-link {
                background:
                    var(--way-hover)!important;

                color:
                    var(--way-text-strong)!important;
            }


            [data-way-alert-menu="true"].way-alert-menu-active
            .i-lucide-clock-alert {
                color:
                    var(--way-blue)!important;
            }


            .way-alert-config {
                display:flex!important;
                flex-direction:column!important;

                max-width:980px!important;

                gap:16px!important;
            }


            .way-alert-config-title {
                margin:0!important;

                color:
                    var(--way-text-strong)!important;

                font-size:18px!important;
                font-weight:700!important;
            }


            .way-alert-config-description {
                color:
                    var(--way-text-soft)!important;

                font-size:11px!important;
                line-height:1.6!important;
            }


            .way-alert-toggle {
                display:flex!important;
                align-items:center!important;

                gap:10px!important;

                padding:12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-panel-2)!important;
            }


            .way-alert-toggle input {
                width:17px!important;
                height:17px!important;

                accent-color:
                    var(--way-blue)!important;
            }


            .way-alert-toggle-title {
                display:block!important;

                color:
                    var(--way-text-strong)!important;

                font-size:11px!important;
                font-weight:700!important;
            }


            .way-alert-toggle-description {
                display:block!important;

                margin-top:2px!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
            }


            .way-alert-levels {
                display:grid!important;

                grid-template-columns:
                    repeat(
                        3,
                        minmax(0,1fr)
                    )!important;

                gap:12px!important;
            }


            .way-alert-level {
                padding:14px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:9px!important;

                background:
                    var(--way-panel-2)!important;
            }


            .way-alert-level.yellow {
                border-left:
                    4px solid
                    var(--way-inactivity-yellow-text)!important;
            }


            .way-alert-level.orange {
                border-left:
                    4px solid
                    var(--way-inactivity-orange-text)!important;
            }


            .way-alert-level.red {
                border-left:
                    4px solid
                    var(--way-inactivity-red-text)!important;
            }


            .way-alert-level-title {
                margin-bottom:9px!important;

                color:
                    var(--way-text-strong)!important;

                font-size:11px!important;
                font-weight:700!important;
            }


            .way-alert-field {
                display:flex!important;
                flex-direction:column!important;

                gap:6px!important;
            }


            .way-alert-field label {
                color:
                    var(--way-text)!important;

                font-size:10px!important;
                font-weight:600!important;
            }


            .way-alert-field input {
                width:100%!important;
                min-height:38px!important;

                box-sizing:
                    border-box!important;

                padding:
                    8px 10px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                outline:none!important;

                background:
                    var(--way-input)!important;

                color:
                    var(--way-text)!important;

                color-scheme:
                    var(--way-color-scheme)!important;
            }


            .way-alert-notification-toggle {
                display:flex!important;
                align-items:flex-start!important;

                gap:8px!important;

                margin-top:12px!important;
                padding-top:10px!important;

                border-top:
                    1px solid
                    var(--way-border)!important;

                color:
                    var(--way-text)!important;

                cursor:pointer!important;

                font-size:9px!important;
                line-height:1.45!important;
            }


            .way-alert-notification-toggle input {
                width:15px!important;
                height:15px!important;

                flex:0 0 auto!important;

                margin-top:1px!important;

                accent-color:
                    var(--way-blue)!important;
            }


            .way-alert-notification-info {
                padding:10px 12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-blue-bg)!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
                line-height:1.55!important;
            }


            .way-alert-summary {
                padding:12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-panel-3)!important;

                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
                line-height:1.8!important;
            }


            .way-alert-preview {
                display:grid!important;

                grid-template-columns:
                    repeat(
                        3,
                        minmax(0,1fr)
                    )!important;

                gap:8px!important;
            }


            .way-alert-preview-card {
                padding:
                    10px 12px!important;

                border-radius:7px!important;

                color:
                    var(--way-text-strong)!important;

                font-size:10px!important;
            }


            .way-alert-preview-card.yellow {
                background:
                    var(--way-inactivity-yellow-bg)!important;

                border-left:
                    3px solid
                    var(--way-inactivity-yellow-text)!important;
            }


            .way-alert-preview-card.orange {
                background:
                    var(--way-inactivity-orange-bg)!important;

                border-left:
                    3px solid
                    var(--way-inactivity-orange-text)!important;
            }


            .way-alert-preview-card.red {
                background:
                    var(--way-inactivity-red-bg)!important;

                border-left:
                    3px solid
                    var(--way-inactivity-red-text)!important;
            }


            .way-alert-status {
                min-height:18px!important;

                font-size:11px!important;
            }


            .way-alert-status.success {
                color:#10b981!important;
            }


            .way-alert-status.error {
                color:#ef4444!important;
            }


            .way-alert-actions {
                display:flex!important;
                align-items:center!important;
                justify-content:flex-end!important;

                gap:8px!important;
            }


            .way-alert-actions button {
                min-height:35px!important;

                padding:
                    6px 13px!important;

                border-radius:7px!important;

                cursor:pointer!important;

                font-size:11px!important;
                font-weight:600!important;
            }


            .way-alert-reset {
                border:
                    1px solid
                    var(--way-border)!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-text)!important;
            }


            .way-alert-save {
                border:
                    1px solid
                    var(--way-blue)!important;

                background:
                    var(--way-blue-bg)!important;

                color:#fff!important;
            }


            /* =================================================
               CORPO
               ================================================= */

            .way-msg-body {
                display:grid!important;

                grid-template-columns:
                    370px
                    minmax(0,1fr)!important;

                flex:1 1 auto!important;

                min-height:0!important;

                overflow:hidden!important;
            }


            .way-msg-sidebar {
                display:flex!important;
                flex-direction:column!important;

                min-height:0!important;

                padding:16px!important;

                box-sizing:
                    border-box!important;

                background:
                    var(--way-panel-3)!important;

                border-right:
                    1px solid
                    var(--way-border)!important;
            }


            .way-msg-new {
                width:100%!important;

                min-height:38px!important;

                border:
                    1px solid
                    var(--way-blue)!important;

                border-radius:7px!important;

                background:
                    var(--way-blue-bg)!important;

                color:#fff!important;

                cursor:pointer!important;

                font-size:12px!important;
                font-weight:600!important;
            }


            .way-msg-new:hover {
                background:
                    var(--way-blue-hover)!important;
            }


            .way-msg-list {
                display:flex!important;
                flex-direction:column!important;

                flex:1 1 auto!important;

                min-height:0!important;

                gap:7px!important;

                margin-top:12px!important;

                overflow-y:auto!important;
            }


            .way-msg-empty {
                padding:
                    22px 10px!important;

                color:
                    var(--way-text-soft)!important;

                text-align:center!important;

                font-size:12px!important;
                line-height:1.5!important;
            }


            .way-msg-list-item {
                display:flex!important;
                align-items:flex-start!important;
                justify-content:space-between!important;

                gap:8px!important;

                padding:10px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                background:
                    var(--way-panel)!important;

                cursor:pointer!important;
            }


            .way-msg-list-item:hover,
            .way-msg-list-item.active {
                background:
                    var(--way-hover)!important;

                border-color:
                    var(--way-blue)!important;
            }


            .way-msg-list-item.active {
                box-shadow:
                    inset 3px 0 0
                    var(--way-blue)!important;
            }


            .way-msg-list-main {
                flex:1 1 auto!important;
                min-width:0!important;
            }


            .way-msg-command {
                display:block!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-strong)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-msg-list-description,
            .way-msg-list-category {
                display:block!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;
            }


            .way-msg-list-description {
                margin-top:3px!important;

                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
            }


            .way-msg-list-category {
                margin-top:5px!important;

                color:
                    var(--way-text-muted)!important;

                font-size:9px!important;
            }


            .way-msg-badge {
                flex-shrink:0!important;

                padding:
                    2px 6px!important;

                border-radius:999px!important;

                background:
                    rgba(14,165,233,.10)!important;

                color:#0284c7!important;

                font-size:9px!important;
                font-weight:700!important;
            }


            .way-msg-badge-agenda {
                color:#a855f7!important;

                background:
                    rgba(168,85,247,.10)!important;
            }


            .way-msg-badge-visita {
                color:#d97706!important;

                background:
                    rgba(245,158,11,.10)!important;
            }


            /* =================================================
               EDITOR
               ================================================= */

            .way-msg-editor {
                min-height:0!important;

                padding:
                    22px 28px!important;

                overflow-y:auto!important;

                background:
                    var(--way-panel)!important;
            }


            .way-msg-editor-placeholder {
                display:flex!important;
                align-items:center!important;
                justify-content:center!important;

                min-height:
                    calc(100vh - 130px)!important;

                color:
                    var(--way-text-soft)!important;

                text-align:center!important;

                font-size:13px!important;
            }


            .way-msg-form {
                display:flex!important;
                flex-direction:column!important;

                min-height:100%!important;

                gap:16px!important;
            }


            .way-msg-field,
            .way-visita-field {
                display:flex!important;
                flex-direction:column!important;

                gap:6px!important;
            }


            .way-msg-field label,
            .way-visita-field label {
                color:
                    var(--way-text)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-msg-field input,
            .way-msg-field select,
            .way-msg-field textarea,
            .way-msg-periodo-card textarea,
            .way-visita-field input,
            .way-visita-field select,
            .way-visita-field textarea {
                width:100%!important;

                box-sizing:
                    border-box!important;

                padding:
                    10px 12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                outline:none!important;

                background:
                    var(--way-input)!important;

                color:
                    var(--way-text)!important;

                caret-color:
                    var(--way-blue)!important;

                font-family:
                    inherit!important;

                font-size:13px!important;

                color-scheme:
                    var(--way-color-scheme)!important;
            }


            .way-msg-field input,
            .way-msg-field select {
                min-height:40px!important;
            }


            .way-msg-field textarea {
                min-height:280px!important;

                resize:vertical!important;

                line-height:1.5!important;
            }


            .way-msg-template-visita {
                min-height:440px!important;
            }


            .way-msg-command-wrapper {
                display:flex!important;
                align-items:stretch!important;
            }


            .way-msg-command-prefix {
                display:flex!important;
                align-items:center!important;
                justify-content:center!important;

                min-width:42px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-right:0!important;

                border-radius:
                    7px 0 0 7px!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-blue)!important;

                font-size:15px!important;
                font-weight:800!important;
            }


            .way-msg-command-wrapper input {
                border-radius:
                    0 7px 7px 0!important;
            }


            .way-msg-category-info {
                padding:
                    9px 11px!important;

                border:
                    1px solid
                    rgba(99,102,241,.25)!important;

                border-radius:7px!important;

                background:
                    rgba(99,102,241,.07)!important;

                color:#6366f1!important;

                font-size:10px!important;
                line-height:1.5!important;
            }


            /* =================================================
               TAGS
               ================================================= */

            .way-msg-tags-box,
            .way-msg-visita-tags-box {
                padding:12px!important;

                border:
                    1px solid
                    rgba(14,165,233,.30)!important;

                border-radius:8px!important;

                background:
                    rgba(14,165,233,.07)!important;
            }


            .way-msg-tags-title {
                display:block!important;

                margin-bottom:8px!important;

                color:#0284c7!important;

                font-size:11px!important;
                font-weight:700!important;
            }


            .way-msg-global-tags-grid {
                display:grid!important;

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    )!important;

                gap:7px!important;
            }


            .way-msg-global-tag {
                display:flex!important;
                align-items:center!important;

                gap:8px!important;

                min-width:0!important;

                padding:
                    7px 9px!important;

                border:
                    1px solid
                    var(--way-border-soft)!important;

                border-radius:7px!important;

                background:
                    var(--way-input)!important;
            }


            .way-msg-tag-code {
                flex-shrink:0!important;

                padding:
                    3px 7px!important;

                border:
                    1px solid
                    rgba(56,189,248,.30)!important;

                border-radius:5px!important;

                color:#0284c7!important;

                font-family:
                    Consolas,
                    Monaco,
                    monospace!important;

                font-size:10px!important;
                font-weight:700!important;

                user-select:all!important;
            }


            .way-msg-global-tag-main {
                min-width:0!important;

                display:flex!important;
                flex-direction:column!important;

                gap:2px!important;
            }


            .way-msg-global-tag-label {
                color:
                    var(--way-text)!important;

                font-size:10px!important;
                font-weight:600!important;
            }


            .way-msg-global-tag-value {
                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
            }


            .way-msg-global-tag-value.ok {
                color:#10b981!important;
            }


            .way-msg-global-tag-value.pending {
                color:#f59e0b!important;
            }


            .way-msg-visita-tag-list {
                display:flex!important;
                flex-wrap:wrap!important;

                gap:6px!important;
            }


            .way-msg-visita-tag {
                padding:
                    4px 7px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:6px!important;

                background:
                    var(--way-input)!important;

                color:#0284c7!important;

                cursor:pointer!important;

                font-family:
                    Consolas,
                    Monaco,
                    monospace!important;

                font-size:10px!important;
                font-weight:700!important;
            }


            .way-msg-tags-detectadas {
                margin-top:10px!important;
                padding-top:10px!important;

                border-top:
                    1px solid
                    var(--way-border-soft)!important;

                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
            }


            /* =================================================
               HORÁRIOS
               ================================================= */

            .way-msg-check {
                display:flex!important;
                align-items:center!important;

                gap:10px!important;

                padding:
                    11px 12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                background:
                    var(--way-panel-2)!important;

                cursor:pointer!important;
            }


            .way-msg-check input {
                width:17px!important;
                height:17px!important;

                accent-color:
                    var(--way-blue)!important;
            }


            .way-msg-check-text {
                display:flex!important;
                flex-direction:column!important;
            }


            .way-msg-check-title {
                color:
                    var(--way-text)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-msg-check-description {
                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
            }


            .way-msg-periodos {
                display:grid!important;

                grid-template-columns:
                    repeat(
                        3,
                        minmax(0,1fr)
                    )!important;

                gap:14px!important;
            }


            .way-msg-periodo-card {
                padding:13px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-panel-2)!important;
            }


            .way-msg-periodo-title {
                color:
                    var(--way-text-strong)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-msg-periodo-card textarea {
                min-height:340px!important;

                margin-top:8px!important;
            }


            .way-msg-special-info {
                padding:14px!important;

                border:
                    1px solid
                    rgba(168,85,247,.30)!important;

                border-radius:8px!important;

                background:
                    rgba(168,85,247,.07)!important;

                color:#a855f7!important;

                font-size:12px!important;
                line-height:1.6!important;
            }


            .way-msg-visita-info {
                color:#d97706!important;

                border-color:
                    rgba(245,158,11,.35)!important;

                background:
                    rgba(245,158,11,.08)!important;
            }


            .way-msg-current-period {
                align-self:flex-start!important;

                padding:
                    6px 10px!important;

                border:
                    1px solid
                    rgba(16,185,129,.25)!important;

                border-radius:7px!important;

                background:
                    rgba(16,185,129,.08)!important;

                color:#059669!important;

                font-size:11px!important;
                font-weight:600!important;
            }


            /* =================================================
               AÇÕES
               ================================================= */

            .way-msg-actions {
                display:flex!important;
                align-items:center!important;
                justify-content:flex-end!important;

                gap:9px!important;

                margin-top:auto!important;

                padding-top:12px!important;
            }


            .way-msg-actions button {
                min-height:36px!important;

                padding:
                    6px 14px!important;

                border-radius:7px!important;

                cursor:pointer!important;

                font-size:12px!important;
                font-weight:600!important;
            }


            .way-msg-delete {
                margin-right:auto!important;

                border:
                    1px solid
                    rgba(244,63,94,.4)!important;

                background:
                    rgba(244,63,94,.07)!important;

                color:#e11d48!important;
            }


            .way-msg-cancel {
                border:
                    1px solid
                    var(--way-border)!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-text)!important;
            }


            .way-msg-save,
            .way-special-insert {
                border:
                    1px solid
                    var(--way-blue)!important;

                background:
                    var(--way-blue-bg)!important;

                color:#fff!important;
            }


            .way-msg-status {
                min-height:18px!important;
                font-size:11px!important;
            }


            .way-msg-status.error {
                color:#ef4444!important;
            }


            .way-msg-status.success {
                color:#10b981!important;
            }


            /* =================================================
               AUTOCOMPLETE
               ================================================= */

            #way-msg-autocomplete {
                position:fixed!important;

                z-index:2147483645!important;

                display:flex!important;
                flex-direction:column!important;

                max-height:
                    ${CONFIG.autocomplete.alturaMaxima}px!important;

                overflow-y:auto!important;
                overflow-x:hidden!important;

                padding:6px!important;

                box-sizing:
                    border-box!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:10px!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;

                box-shadow:
                    0 14px 38px
                    var(--way-shadow)!important;

                font-family:
                    inherit!important;
            }


            .way-ac-header {
                display:flex!important;
                align-items:center!important;
                justify-content:space-between!important;

                gap:12px!important;

                padding:
                    7px 9px 10px!important;

                border-bottom:
                    1px solid
                    var(--way-border-soft)!important;
            }


            .way-ac-header-left {
                display:flex!important;
                align-items:center!important;

                min-width:0!important;

                gap:9px!important;
            }


            .way-ac-title-wrap {
                min-width:0!important;
            }


            .way-ac-title {
                display:block!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-strong)!important;

                font-size:11px!important;
                font-weight:700!important;
            }


            .way-ac-subtitle {
                display:block!important;

                margin-top:2px!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
            }


            .way-ac-count {
                flex-shrink:0!important;

                padding:
                    2px 7px!important;

                border-radius:999px!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
            }


            .way-ac-back {
                min-height:28px!important;

                padding:
                    3px 9px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:6px!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-text)!important;

                cursor:pointer!important;

                font-size:9px!important;
                font-weight:700!important;
            }


            .way-ac-categories,
            .way-ac-items {
                display:flex!important;
                flex-direction:column!important;

                gap:4px!important;

                padding-top:5px!important;
            }


            .way-ac-category-item {
                width:100%!important;

                display:grid!important;

                grid-template-columns:
                    minmax(0,1fr)
                    auto!important;

                align-items:center!important;

                gap:14px!important;

                padding:
                    10px 12px!important;

                box-sizing:
                    border-box!important;

                border:
                    1px solid
                    transparent!important;

                border-radius:8px!important;

                background:
                    transparent!important;

                color:
                    inherit!important;

                cursor:pointer!important;

                text-align:left!important;
                font-family:inherit!important;
            }


            .way-ac-category-item:hover,
            .way-ac-category-item.active,
            .way-ac-item:hover,
            .way-ac-item.active {
                background:
                    var(--way-hover)!important;

                border-color:
                    rgba(59,130,246,.45)!important;
            }


            .way-ac-category-main {
                min-width:0!important;
            }


            .way-ac-category-name {
                display:block!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-strong)!important;

                font-size:11px!important;
                font-weight:700!important;
            }


            .way-ac-category-preview {
                display:block!important;

                margin-top:3px!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-soft)!important;

                font-family:
                    Consolas,
                    Monaco,
                    monospace!important;

                font-size:9px!important;
            }


            .way-ac-category-side {
                display:flex!important;
                align-items:center!important;

                gap:8px!important;
            }


            .way-ac-category-count {
                padding:
                    2px 7px!important;

                border-radius:999px!important;

                background:
                    rgba(59,130,246,.10)!important;

                color:#3b82f6!important;

                font-size:9px!important;
                font-weight:700!important;
            }


            .way-ac-category-arrow {
                color:
                    var(--way-text-muted)!important;

                font-size:16px!important;
            }


            .way-ac-item {
                width:100%!important;

                display:grid!important;

                grid-template-columns:
                    minmax(120px,175px)
                    minmax(0,1fr)
                    auto!important;

                align-items:center!important;

                gap:14px!important;

                padding:
                    9px 11px!important;

                box-sizing:
                    border-box!important;

                border:
                    1px solid
                    transparent!important;

                border-radius:8px!important;

                background:
                    transparent!important;

                color:
                    inherit!important;

                cursor:pointer!important;

                text-align:left!important;
                font-family:inherit!important;
            }


            .way-ac-command {
                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-blue)!important;

                font-family:
                    Consolas,
                    Monaco,
                    monospace!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-ac-command-content {
                min-width:0!important;
            }


            .way-ac-preview {
                display:block!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text)!important;

                font-size:11px!important;
            }


            .way-ac-command-category {
                display:block!important;

                margin-top:3px!important;

                overflow:hidden!important;
                text-overflow:ellipsis!important;
                white-space:nowrap!important;

                color:
                    var(--way-text-muted)!important;

                font-size:8px!important;
            }


            .way-ac-type {
                flex-shrink:0!important;

                padding:
                    2px 7px!important;

                border-radius:999px!important;

                background:
                    rgba(14,165,233,.10)!important;

                color:#0284c7!important;

                font-size:9px!important;
                font-weight:700!important;
            }


            .way-ac-type.agenda {
                color:#a855f7!important;

                background:
                    rgba(168,85,247,.10)!important;
            }


            .way-ac-type.visita {
                color:#d97706!important;

                background:
                    rgba(245,158,11,.10)!important;
            }


            .way-ac-footer {
                display:flex!important;
                align-items:center!important;
                flex-wrap:wrap!important;

                gap:10px!important;

                padding:
                    8px 8px 3px!important;

                margin-top:4px!important;

                border-top:
                    1px solid
                    var(--way-border-soft)!important;

                color:
                    var(--way-text-muted)!important;

                font-size:9px!important;
            }


            .way-ac-key {
                display:inline-flex!important;
                align-items:center!important;
                justify-content:center!important;

                min-width:18px!important;
                height:17px!important;

                padding:
                    0 4px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:4px!important;

                background:
                    var(--way-panel-2)!important;

                color:
                    var(--way-text-soft)!important;

                font-size:9px!important;
            }


            /* =================================================
               MODAIS ESPECIAIS
               ================================================= */

            .way-special-overlay {
                position:fixed!important;
                inset:0!important;

                z-index:2147483647!important;

                display:flex!important;
                align-items:center!important;
                justify-content:center!important;

                padding:20px!important;

                background:
                    var(--way-overlay)!important;

                backdrop-filter:
                    blur(3px)!important;

                color-scheme:
                    var(--way-color-scheme)!important;
            }


            .way-special-modal {
                width:
                    min(
                        760px,
                        calc(100vw - 30px)
                    )!important;

                max-height:
                    calc(100vh - 40px)!important;

                display:flex!important;
                flex-direction:column!important;

                overflow:hidden!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:12px!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;

                box-shadow:
                    0 20px 65px
                    var(--way-shadow)!important;
            }


            .way-visita-modal {
                width:
                    min(
                        940px,
                        calc(100vw - 30px)
                    )!important;
            }


            .way-special-header {
                display:flex!important;
                align-items:center!important;
                justify-content:space-between!important;

                padding:
                    14px 16px!important;

                background:
                    var(--way-panel-2)!important;

                border-bottom:
                    1px solid
                    var(--way-border)!important;
            }


            .way-special-title {
                margin:0!important;

                color:
                    var(--way-text-strong)!important;

                font-size:16px!important;
                font-weight:700!important;
            }


            .way-special-subtitle {
                margin-top:2px!important;

                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
            }


            .way-special-close {
                width:32px!important;
                height:32px!important;

                border:0!important;
                border-radius:6px!important;

                background:
                    transparent!important;

                color:
                    var(--way-text-soft)!important;

                cursor:pointer!important;

                font-size:22px!important;
            }


            .way-special-body {
                padding:16px!important;

                overflow-y:auto!important;
            }


            .way-special-footer {
                display:flex!important;
                align-items:center!important;
                justify-content:flex-end!important;

                gap:8px!important;

                padding:
                    12px 16px!important;

                border-top:
                    1px solid
                    var(--way-border)!important;

                background:
                    var(--way-panel-2)!important;
            }


            .way-special-footer button {
                min-height:35px!important;

                padding:
                    6px 13px!important;

                border-radius:7px!important;

                cursor:pointer!important;

                font-size:12px!important;
                font-weight:600!important;
            }


            .way-special-cancel {
                border:
                    1px solid
                    var(--way-border)!important;

                background:
                    var(--way-panel)!important;

                color:
                    var(--way-text)!important;
            }


            .way-agenda-field {
                display:flex!important;
                flex-direction:column!important;

                gap:6px!important;

                margin-bottom:14px!important;
            }


            .way-agenda-field label {
                color:
                    var(--way-text)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-agenda-field input[type="date"] {
                width:100%!important;

                min-height:40px!important;

                box-sizing:
                    border-box!important;

                padding:
                    8px 10px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                background:
                    var(--way-input)!important;

                color:
                    var(--way-text)!important;

                color-scheme:
                    var(--way-color-scheme)!important;
            }


            .way-agenda-periods {
                display:grid!important;

                grid-template-columns:
                    repeat(
                        3,
                        minmax(0,1fr)
                    )!important;

                gap:10px!important;
            }


            .way-agenda-period {
                display:flex!important;
                align-items:center!important;

                gap:8px!important;

                padding:12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-panel-2)!important;

                cursor:pointer!important;
            }


            .way-agenda-period:hover,
            .way-agenda-period:has(input:checked) {
                border-color:
                    var(--way-blue)!important;
            }


            .way-agenda-period:has(input:checked) {
                background:
                    var(--way-hover)!important;
            }


            .way-agenda-period-text {
                display:flex!important;
                flex-direction:column!important;
            }


            .way-agenda-period-name {
                color:
                    var(--way-text-strong)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-agenda-period-hours {
                color:
                    var(--way-text-soft)!important;

                font-size:10px!important;
            }


            .way-special-preview-label {
                margin-top:15px!important;
                margin-bottom:6px!important;

                color:
                    var(--way-text)!important;

                font-size:12px!important;
                font-weight:700!important;
            }


            .way-special-preview {
                width:100%!important;

                min-height:190px!important;

                box-sizing:
                    border-box!important;

                padding:11px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:8px!important;

                background:
                    var(--way-input)!important;

                color:
                    var(--way-text)!important;

                font-family:
                    inherit!important;

                font-size:12px!important;
                line-height:1.5!important;

                resize:vertical!important;
            }


            .way-special-status {
                min-height:18px!important;

                margin-top:7px!important;

                color:#ef4444!important;

                font-size:11px!important;
            }


            .way-visita-layout {
                display:grid!important;

                grid-template-columns:
                    minmax(300px,390px)
                    minmax(0,1fr)!important;

                gap:18px!important;
            }


            .way-visita-fields {
                display:flex!important;
                flex-direction:column!important;

                gap:11px!important;
            }


            .way-visita-field textarea {
                min-height:70px!important;

                resize:vertical!important;
            }


            .way-visita-field-tag {
                margin-left:5px!important;

                color:
                    var(--way-text-muted)!important;

                font-family:
                    Consolas,
                    Monaco,
                    monospace!important;

                font-size:9px!important;
                font-weight:400!important;
            }


            .way-visita-field-auto {
                display:inline-flex!important;

                margin-left:5px!important;

                padding:
                    1px 5px!important;

                border-radius:999px!important;

                background:
                    rgba(16,185,129,.10)!important;

                color:#059669!important;

                font-size:8px!important;
            }


            .way-visita-preview {
                min-height:520px!important;
            }


            .way-visita-empty {
                padding:15px!important;

                border:
                    1px dashed
                    var(--way-border)!important;

                border-radius:8px!important;

                color:
                    var(--way-text-soft)!important;

                font-size:11px!important;

                text-align:center!important;
            }


            .way-import-modal {
                width:
                    min(
                        560px,
                        calc(100vw - 30px)
                    )!important;
            }


            .way-import-body {
                padding:17px!important;

                color:
                    var(--way-text)!important;

                font-size:12px!important;
                line-height:1.6!important;
            }


            .way-import-summary {
                margin:
                    12px 0!important;

                padding:
                    10px 12px!important;

                border:
                    1px solid
                    var(--way-border)!important;

                border-radius:7px!important;

                background:
                    var(--way-input)!important;
            }


            .way-import-warning {
                color:#d97706!important;
            }


            @media(max-width:900px) {

                .way-msg-body {
                    grid-template-columns:
                        1fr!important;

                    grid-template-rows:
                        260px
                        minmax(0,1fr)!important;
                }


                .way-msg-periodos,
                .way-agenda-periods,
                .way-visita-layout,
                .way-msg-global-tags-grid,
                .way-alert-levels,
                .way-alert-preview {
                    grid-template-columns:
                        1fr!important;
                }


                .way-ac-item {
                    grid-template-columns:
                        minmax(90px,120px)
                        minmax(0,1fr)
                        auto!important;
                }
            }

        `;


        document.documentElement.appendChild(
            style
        );
    }


    /* =========================================================
       BACKUP
       ========================================================= */

    function gerarNomeArquivoBackup() {
        const agora =
            new Date();


        return (
            'way-mensagens-personalizadas-' +
            agora.getFullYear() +
            '-' +
            String(
                agora.getMonth() + 1
            ).padStart(
                2,
                '0'
            ) +
            '-' +
            String(
                agora.getDate()
            ).padStart(
                2,
                '0'
            ) +
            '_' +
            String(
                agora.getHours()
            ).padStart(
                2,
                '0'
            ) +
            '-' +
            String(
                agora.getMinutes()
            ).padStart(
                2,
                '0'
            ) +
            '.json'
        );
    }


    function exportarMensagensJSON() {
        const mensagens =
            carregarMensagens();


        const backup = {
            aplicativo:
                'Way - Mensagens Personalizadas',

            versaoBackup:
                CONFIG.versaoBackup,

            exportadoEm:
                new Date()
                    .toISOString(),

            quantidade:
                mensagens.length,

            mensagens
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        backup,
                        null,
                        2
                    )
                ],
                {
                    type:
                        'application/json;charset=utf-8'
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                'a'
            );


        link.href =
            url;


        link.download =
            gerarNomeArquivoBackup();


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();


        setTimeout(
            function () {
                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );


        definirStatusBackup(
            `✓ ${mensagens.length} mensagem(ns) exportada(s).`,
            'success'
        );
    }


    function normalizarMensagemImportada(
        origem
    ) {
        if (
            !origem ||
            typeof origem !==
                'object' ||
            Array.isArray(
                origem
            )
        ) {
            throw new Error(
                'Existe uma mensagem inválida no arquivo.'
            );
        }


        const comando =
            normalizarComando(
                origem.comando
            );


        if (
            !comando
        ) {
            throw new Error(
                'Existe uma mensagem sem comando válido.'
            );
        }


        let tipo =
            'texto';


        if (
            origem.tipo ===
            'disponibilidade'
        ) {
            tipo =
                'disponibilidade';
        }


        if (
            origem.tipo ===
            'visita'
        ) {
            tipo =
                'visita';
        }


        let categoria =
            String(
                origem.categoria ??
                ''
            )
                .trim();


        if (
            categoria &&
            !CATEGORIAS[
                categoria
            ]
        ) {
            categoria =
                '';
        }


        return {
            id:
                typeof origem.id ===
                    'string' &&
                origem.id.trim()
                    ?
                    origem.id.trim()
                    :
                    gerarId(),

            comando,
            categoria,
            tipo,

            variacaoHorario:
                tipo ===
                    'texto' &&
                Boolean(
                    origem.variacaoHorario
                ),

            mensagem:
                String(
                    origem.mensagem ??
                    ''
                ),

            manha:
                String(
                    origem.manha ??
                    ''
                ),

            tarde:
                String(
                    origem.tarde ??
                    ''
                ),

            noite:
                String(
                    origem.noite ??
                    ''
                ),

            templateVisita:
                String(
                    origem.templateVisita ??
                    ''
                )
        };
    }


    function validarBackupImportado(
        dados
    ) {
        let lista =
            null;


        if (
            dados &&
            typeof dados ===
                'object' &&
            !Array.isArray(
                dados
            ) &&
            Array.isArray(
                dados.mensagens
            )
        ) {
            lista =
                dados.mensagens;
        }


        if (
            Array.isArray(
                dados
            )
        ) {
            lista =
                dados;
        }


        if (
            !lista
        ) {
            throw new Error(
                'O JSON não contém uma lista válida de mensagens.'
            );
        }


        const normalizadas =
            lista.map(
                normalizarMensagemImportada
            );


        const comandos =
            new Set();


        for (
            const item
            of normalizadas
        ) {
            if (
                comandos.has(
                    item.comando
                )
            ) {
                throw new Error(
                    `O comando !${item.comando} está duplicado no arquivo.`
                );
            }


            comandos.add(
                item.comando
            );
        }


        return normalizadas;
    }


    function selecionarArquivoImportacao() {
        const input =
            document.createElement(
                'input'
            );


        input.type =
            'file';


        input.accept =
            '.json,application/json';


        input.style.display =
            'none';


        document.body.appendChild(
            input
        );


        input.addEventListener(
            'change',

            async function () {
                const arquivo =
                    input.files?.[0];


                input.remove();


                if (
                    !arquivo
                ) {
                    return;
                }


                try {
                    const texto =
                        await arquivo.text();


                    const dados =
                        JSON.parse(
                            texto
                        );


                    const mensagens =
                        validarBackupImportado(
                            dados
                        );


                    abrirConfirmacaoImportacao(
                        mensagens,
                        arquivo.name
                    );

                } catch (erro) {
                    definirStatusBackup(
                        '⚠️ ' +
                        (
                            erro?.message ||
                            'Falha ao importar JSON.'
                        ),
                        'error'
                    );
                }
            }
        );


        input.click();
    }


    function abrirConfirmacaoImportacao(
        importadas,
        nomeArquivo
    ) {
        fecharConfirmacaoImportacao();


        const atuais =
            carregarMensagens();


        const overlay =
            document.createElement(
                'div'
            );


        overlay.id =
            'way-import-modal-root';


        overlay.className =
            'way-special-overlay';


        overlay.innerHTML = `

            <div class="way-special-modal way-import-modal">

                <div class="way-special-header">

                    <h3 class="way-special-title">
                        📥 Importar Mensagens
                    </h3>

                </div>

                <div class="way-import-body">

                    O arquivo foi validado.

                    <div class="way-import-summary">

                        📄 <strong>Arquivo:</strong>
                        ${escaparHTML(nomeArquivo)}

                        <br>

                        📥 <strong>Mensagens no arquivo:</strong>
                        ${importadas.length}

                        <br>

                        💬 <strong>Mensagens atuais:</strong>
                        ${atuais.length}

                    </div>

                    <strong>Mesclar:</strong>
                    mantém as mensagens existentes.

                    <br><br>

                    <span class="way-import-warning">

                        <strong>
                            Substituir tudo:
                        </strong>

                        remove as mensagens atuais e mantém apenas o backup.

                    </span>

                </div>

                <div class="way-special-footer">

                    <button
                        type="button"
                        class="way-special-cancel way-import-cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="way-special-insert way-import-merge"
                    >
                        🔀 Mesclar
                    </button>

                    <button
                        type="button"
                        class="way-special-insert way-import-replace"
                    >
                        ⚠️ Substituir tudo
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        overlay
            .querySelector(
                '.way-import-cancel'
            )
            .onclick =
                fecharConfirmacaoImportacao;


        overlay
            .querySelector(
                '.way-import-merge'
            )
            .onclick =
                function () {
                    importarMesclando(
                        importadas
                    );


                    fecharConfirmacaoImportacao();
                };


        overlay
            .querySelector(
                '.way-import-replace'
            )
            .onclick =
                function () {
                    importarSubstituindo(
                        importadas
                    );


                    fecharConfirmacaoImportacao();
                };
    }


    function fecharConfirmacaoImportacao() {
        document
            .getElementById(
                'way-import-modal-root'
            )
            ?.remove();
    }


    function importarMesclando(
        importadas
    ) {
        const mapa =
            new Map();


        carregarMensagens()
            .forEach(
                item =>
                    mapa.set(
                        item.comando,
                        item
                    )
            );


        importadas.forEach(
            item => {
                const existente =
                    mapa.get(
                        item.comando
                    );


                mapa.set(
                    item.comando,
                    {
                        ...item,

                        id:
                            existente?.id ||
                            item.id
                    }
                );
            }
        );


        const sucesso =
            salvarMensagens(
                Array.from(
                    mapa.values()
                )
            );


        if (
            !sucesso
        ) {
            definirStatusBackup(
                '⚠️ Não foi possível salvar o backup.',
                'error'
            );


            return;
        }


        mensagemEmEdicaoId =
            null;


        renderizarLista();


        definirStatusBackup(
            '✓ Backup mesclado com sucesso.',
            'success'
        );
    }


    function importarSubstituindo(
        importadas
    ) {
        const sucesso =
            salvarMensagens(
                importadas
            );


        if (
            !sucesso
        ) {
            definirStatusBackup(
                '⚠️ Não foi possível restaurar o backup.',
                'error'
            );


            return;
        }


        mensagemEmEdicaoId =
            null;


        renderizarLista();


        definirStatusBackup(
            '✓ Backup restaurado com sucesso.',
            'success'
        );
    }


    function definirStatusBackup(
        texto,
        tipo
    ) {
        const status =
            document.querySelector(
                '#way-msg-personalizadas-modal .way-msg-backup-status'
            );


        if (
            !status
        ) {
            return;
        }


        status.className =
            'way-msg-backup-status ' +
            (
                tipo ||
                ''
            );


        status.textContent =
            texto;
    }


    /* =========================================================
       MENU
       ========================================================= */

    function configurarItemMenu() {
        if (
            document.querySelector(
                '[data-way-msg-menu="true"]'
            )
        ) {
            return;
        }


        const settingsButton =
            document.querySelector(
                '[title="Configurações"][name="Settings"]'
            );


        if (
            !settingsButton
        ) {
            return;
        }


        const settingsLi =
            settingsButton.closest(
                'li'
            );


        if (
            !settingsLi
        ) {
            return;
        }


        const submenu =
            Array
                .from(
                    settingsLi.children
                )
                .find(
                    elemento =>
                        elemento.tagName ===
                        'UL'
                );


        if (
            !submenu
        ) {
            return;
        }


        const li =
            document.createElement(
                'li'
            );


        li.dataset.wayMsgMenu =
            'true';


        li.className =
            "way-msg-menu-item py-0.5 ps-2 ms-3 relative text-n-slate-11 min-w-0 child-item before:content-[''] before:absolute before:start-0 before:w-0.5 before:h-full before:bg-n-slate-4";


        li.innerHTML = `

            <a
                href="#"
                class="way-msg-menu-link flex h-8 items-center gap-2 px-2 py-1 rounded-lg group min-w-0"
                title="Mensagens Personalizadas"
            >

                <span class="size-4 grid place-content-center rounded-full">

                    <span
                        class="i-lucide-message-square-quote size-4 inline-block"
                    ></span>

                </span>

                <div class="flex-1 truncate min-w-0 text-sm">
                    Mensagens Personalizadas
                </div>

            </a>

        `;


        li
            .querySelector(
                '.way-msg-menu-link'
            )
            .addEventListener(
                'click',

                function (
                    event
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    abrirModalConfiguracao();
                }
            );


        submenu.appendChild(
            li
        );
    }


    function configurarItemMenuAlertas() {
        if (
            document.querySelector(
                '[data-way-alert-menu="true"]'
            )
        ) {
            return;
        }


        const settingsButton =
            document.querySelector(
                '[title="Configurações"][name="Settings"]'
            );


        if (
            !settingsButton
        ) {
            return;
        }


        const settingsLi =
            settingsButton.closest(
                'li'
            );


        if (
            !settingsLi
        ) {
            return;
        }


        const submenu =
            Array
                .from(
                    settingsLi.children
                )
                .find(
                    elemento =>
                        elemento.tagName ===
                        'UL'
                );


        if (
            !submenu
        ) {
            return;
        }


        const li =
            document.createElement(
                'li'
            );


        li.dataset.wayAlertMenu =
            'true';


        li.className =
            "way-msg-menu-item py-0.5 ps-2 ms-3 relative text-n-slate-11 min-w-0 child-item before:content-[''] before:absolute before:start-0 before:w-0.5 before:h-full before:bg-n-slate-4";


        li.innerHTML = `

            <a
                href="#"
                class="way-alert-menu-link flex h-8 items-center gap-2 px-2 py-1 rounded-lg group min-w-0"
                title="Alertas de inatividade"
            >

                <span class="size-4 grid place-content-center rounded-full">

                    <span
                        class="i-lucide-clock-alert size-4 inline-block"
                    ></span>

                </span>

                <div class="flex-1 truncate min-w-0 text-sm">
                    Alertas de inatividade
                </div>

            </a>

        `;


        li
            .querySelector(
                '.way-alert-menu-link'
            )
            .addEventListener(
                'click',

                function (
                    event
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    abrirModalConfiguracaoAlertas();
                }
            );


        submenu.appendChild(
            li
        );
    }


    /* =========================================================
       UI TAGS
       ========================================================= */

    function gerarHTMLTagsGlobais() {
        const dados =
            obterDadosGlobaisSistema();


        return Object.entries(
            TAGS_GLOBAIS
        )
            .map(
                ([
                    tag,
                    definicao
                ]) => {
                    const valor =
                        dados[
                            tag
                        ];


                    const resolvido =
                        valor !==
                            undefined &&
                        valor !==
                            null &&
                        String(
                            valor
                        ).trim() !==
                        '';


                    return `

                        <div class="way-msg-global-tag">

                            <span class="way-msg-tag-code">
                                {{${escaparHTML(tag)}}}
                            </span>

                            <div class="way-msg-global-tag-main">

                                <span class="way-msg-global-tag-label">

                                    ${escaparHTML(
                                        definicao.icone +
                                        ' ' +
                                        definicao.label
                                    )}

                                </span>

                                <span
                                    class="
                                        way-msg-global-tag-value
                                        ${
                                            resolvido
                                                ?
                                                'ok'
                                                :
                                                'pending'
                                        }
                                    "
                                >

                                    ${
                                        resolvido
                                            ?
                                            `Detectado: ${escaparHTML(valor)}`
                                            :
                                            'Não identificado'
                                    }

                                </span>

                            </div>

                        </div>

                    `;
                }
            )
            .join('');
    }


    /* =========================================================
       CONFIGURAÇÃO
       ========================================================= */

    function renderizarPlaceholderConfiguracaoMensagens() {
        const editor =
            document.querySelector(
                '#way-msg-personalizadas-modal .way-msg-editor'
            );


        if (
            !editor
        ) {
            return;
        }


        editor.innerHTML = `

            <div class="way-msg-editor-placeholder">

                Selecione uma mensagem ou clique em

                <strong>
                    &nbsp;Nova mensagem&nbsp;
                </strong>

                para começar.

            </div>

        `;
    }


    function trocarAbaConfiguracao(
        aba
    ) {
        const modal =
            document.getElementById(
                'way-msg-personalizadas-modal'
            );


        if (
            !modal
        ) {
            return;
        }


        abaConfiguracaoAtual =
            aba ===
                'alertas'
                ?
                'alertas'
                :
                'mensagens';


        modal
            .querySelectorAll(
                '[data-way-config-tab]'
            )
            .forEach(
                botao => {
                    botao.classList.toggle(
                        'active',
                        botao.dataset
                            .wayConfigTab ===
                            abaConfiguracaoAtual
                    );
                }
            );


        const body =
            modal.querySelector(
                '.way-msg-body'
            );


        body?.classList.toggle(
            'way-msg-alertas-mode',
            abaConfiguracaoAtual ===
                'alertas'
        );


        if (
            abaConfiguracaoAtual ===
            'alertas'
        ) {
            mensagemEmEdicaoId =
                null;


            renderizarLista();

            renderizarConfiguracaoAlertas();

            return;
        }


        mensagemEmEdicaoId =
            null;


        renderizarLista();

        renderizarPlaceholderConfiguracaoMensagens();
    }


    function renderizarConfiguracaoAlertas() {
        const editor =
            document.querySelector(
                '#way-alertas-inatividade-screen .way-msg-editor'
            );


        if (
            !editor
        ) {
            return;
        }


        const configuracao =
            carregarConfiguracaoAlertasInatividade();


        editor.innerHTML = `

            <form
                class="way-alert-config"
                autocomplete="off"
            >


                <label class="way-alert-toggle">

                    <input
                        type="checkbox"
                        name="ativo"
                        ${
                            configuracao.ativo
                                ?
                                'checked'
                                :
                                ''
                        }
                    >

                    <span>

                        <span class="way-alert-toggle-title">
                            Ativar alertas visuais nos cards
                        </span>

                        <span class="way-alert-toggle-description">
                            Ao desativar, todos os cards voltam imediatamente ao visual normal.
                        </span>

                    </span>

                </label>


                <div class="way-alert-levels">

                    <div class="way-alert-level yellow">

                        <div class="way-alert-level-title">
                            🟡 Atenção
                        </div>

                        <div class="way-alert-field">

                            <label>
                                A partir de quantos minutos?
                            </label>

                            <input
                                type="number"
                                name="amarelo"
                                min="1"
                                step="1"
                                value="${escaparHTML(configuracao.amarelo)}"
                            >

                        </div>

                        <label class="way-alert-notification-toggle">

                            <input
                                type="checkbox"
                                name="notificarAmarelo"
                                ${
                                    configuracao.notificarAmarelo
                                        ?
                                        'checked'
                                        :
                                        ''
                                }
                            >

                            <span>
                                Notificar ao entrar em Atenção
                            </span>

                        </label>

                    </div>


                    <div class="way-alert-level orange">

                        <div class="way-alert-level-title">
                            🟠 Atenção elevada
                        </div>

                        <div class="way-alert-field">

                            <label>
                                A partir de quantos minutos?
                            </label>

                            <input
                                type="number"
                                name="laranja"
                                min="1"
                                step="1"
                                value="${escaparHTML(configuracao.laranja)}"
                            >

                        </div>

                        <label class="way-alert-notification-toggle">

                            <input
                                type="checkbox"
                                name="notificarLaranja"
                                ${
                                    configuracao.notificarLaranja
                                        ?
                                        'checked'
                                        :
                                        ''
                                }
                            >

                            <span>
                                Notificar ao entrar em Atenção elevada
                            </span>

                        </label>

                    </div>


                    <div class="way-alert-level red">

                        <div class="way-alert-level-title">
                            🔴 Crítico
                        </div>

                        <div class="way-alert-field">

                            <label>
                                A partir de quantos minutos?
                            </label>

                            <input
                                type="number"
                                name="vermelho"
                                min="1"
                                step="1"
                                value="${escaparHTML(configuracao.vermelho)}"
                            >

                        </div>

                        <label class="way-alert-notification-toggle">

                            <input
                                type="checkbox"
                                name="notificarVermelho"
                                ${
                                    configuracao.notificarVermelho
                                        ?
                                        'checked'
                                        :
                                        ''
                                }
                            >

                            <span>
                                Notificar ao entrar em Crítico
                            </span>

                        </label>

                    </div>

                </div>


                <div class="way-alert-notification-info">
                    As notificações são independentes das cores dos cards, usam a duração escolhida no painel do Way Tools e respeitam a configuração de avisos com o ChatWoot em primeiro plano.
                </div>


                <div
                    class="way-alert-summary"
                    data-way-alert-summary
                ></div>


                <div class="way-alert-preview">

                    <div class="way-alert-preview-card yellow">
                        🟡 Cliente começando a aguardar atendimento
                    </div>

                    <div class="way-alert-preview-card orange">
                        🟠 Cliente aguardando há mais tempo
                    </div>

                    <div class="way-alert-preview-card red">
                        🔴 Cliente com inatividade crítica
                    </div>

                </div>


                <div class="way-alert-status"></div>


                <div class="way-alert-actions">

                    <button
                        type="button"
                        class="way-alert-reset"
                    >
                        ↺ Restaurar 2 / 5 / 10
                    </button>

                    <button
                        type="submit"
                        class="way-alert-save"
                    >
                        💾 Salvar alertas
                    </button>

                </div>

            </form>

        `;


        const form =
            editor.querySelector(
                '.way-alert-config'
            );


        const amarelo =
            form.querySelector(
                '[name="amarelo"]'
            );


        const laranja =
            form.querySelector(
                '[name="laranja"]'
            );


        const vermelho =
            form.querySelector(
                '[name="vermelho"]'
            );


        const resumo =
            form.querySelector(
                '[data-way-alert-summary]'
            );


        const status =
            form.querySelector(
                '.way-alert-status'
            );


        function atualizarResumo() {
            const a =
                Number(
                    amarelo.value
                );


            const l =
                Number(
                    laranja.value
                );


            const v =
                Number(
                    vermelho.value
                );


            if (
                !Number.isFinite(a) ||
                !Number.isFinite(l) ||
                !Number.isFinite(v)
            ) {
                resumo.textContent =
                    'Informe os três limites em minutos.';


                return;
            }


            resumo.innerHTML = `

                ⚪ <strong>Normal:</strong>
                menos de ${escaparHTML(a)} min

                <br>

                🟡 <strong>Amarelo:</strong>
                de ${escaparHTML(a)} até ${escaparHTML(Math.max(a, l - 1))} min

                <br>

                🟠 <strong>Laranja:</strong>
                de ${escaparHTML(l)} até ${escaparHTML(Math.max(l, v - 1))} min

                <br>

                🔴 <strong>Vermelho:</strong>
                ${escaparHTML(v)} min ou mais

            `;
        }


        [
            amarelo,
            laranja,
            vermelho
        ]
            .forEach(
                input => {
                    input.addEventListener(
                        'input',
                        atualizarResumo
                    );
                }
            );


        form
            .querySelector(
                '.way-alert-reset'
            )
            .addEventListener(
                'click',

                function () {
                    form.querySelector(
                        '[name="ativo"]'
                    ).checked =
                        true;


                    amarelo.value =
                        String(
                            ALERTAS_INATIVIDADE_PADRAO.amarelo
                        );


                    laranja.value =
                        String(
                            ALERTAS_INATIVIDADE_PADRAO.laranja
                        );


                    vermelho.value =
                        String(
                            ALERTAS_INATIVIDADE_PADRAO.vermelho
                        );


                    form.querySelector(
                        '[name="notificarAmarelo"]'
                    ).checked =
                        ALERTAS_INATIVIDADE_PADRAO
                            .notificarAmarelo;


                    form.querySelector(
                        '[name="notificarLaranja"]'
                    ).checked =
                        ALERTAS_INATIVIDADE_PADRAO
                            .notificarLaranja;


                    form.querySelector(
                        '[name="notificarVermelho"]'
                    ).checked =
                        ALERTAS_INATIVIDADE_PADRAO
                            .notificarVermelho;


                    status.className =
                        'way-alert-status';


                    status.textContent =
                        '';


                    atualizarResumo();
                }
            );


        form.addEventListener(
            'submit',

            function (
                event
            ) {
                event.preventDefault();


                const novaConfiguracao = {
                    ativo:
                        form.querySelector(
                            '[name="ativo"]'
                        ).checked,

                    amarelo:
                        Number(
                            amarelo.value
                        ),

                    laranja:
                        Number(
                            laranja.value
                        ),

                    vermelho:
                        Number(
                            vermelho.value
                        ),

                    notificarAmarelo:
                        form.querySelector(
                            '[name="notificarAmarelo"]'
                        ).checked,

                    notificarLaranja:
                        form.querySelector(
                            '[name="notificarLaranja"]'
                        ).checked,

                    notificarVermelho:
                        form.querySelector(
                            '[name="notificarVermelho"]'
                        ).checked
                };


                if (
                    !Number.isInteger(
                        novaConfiguracao.amarelo
                    ) ||
                    !Number.isInteger(
                        novaConfiguracao.laranja
                    ) ||
                    !Number.isInteger(
                        novaConfiguracao.vermelho
                    ) ||
                    novaConfiguracao.amarelo <
                        1 ||
                    novaConfiguracao.laranja <
                        1 ||
                    novaConfiguracao.vermelho <
                        1
                ) {
                    status.className =
                        'way-alert-status error';


                    status.textContent =
                        'Informe valores inteiros maiores que zero.';


                    return;
                }


                if (
                    !(
                        novaConfiguracao.amarelo <
                            novaConfiguracao.laranja &&
                        novaConfiguracao.laranja <
                            novaConfiguracao.vermelho
                    )
                ) {
                    status.className =
                        'way-alert-status error';


                    status.textContent =
                        'Os limites precisam seguir a ordem: amarelo < laranja < vermelho.';


                    return;
                }


                if (
                    !salvarConfiguracaoAlertasInatividade(
                        novaConfiguracao
                    )
                ) {
                    status.className =
                        'way-alert-status error';


                    status.textContent =
                        'Não foi possível salvar a configuração.';


                    return;
                }


                configurarAlertasInatividade();


                status.className =
                    'way-alert-status success';


                status.textContent =
                    '✓ Configuração salva e aplicada aos cards e notificações.';
            }
        );


        atualizarResumo();
    }


    function localizarBarraLateralPrincipal() {
        const settingsButton =
            document.querySelector(
                '[title="Configurações"][name="Settings"]'
            );


        return (
            settingsButton?.closest(
                'aside'
            ) ||
            document.querySelector(
                'aside'
            )
        );
    }


    function marcarMenuAlertasAtivo(
        ativo
    ) {
        const item =
            document.querySelector(
                '[data-way-alert-menu="true"]'
            );


        item?.classList.toggle(
            'way-alert-menu-active',
            Boolean(
                ativo
            )
        );
    }


    function posicionarTelaConfiguracaoAlertas() {
        const tela =
            document.getElementById(
                'way-alertas-inatividade-screen'
            );


        if (
            !tela
        ) {
            return;
        }


        const sidebar =
            localizarBarraLateralPrincipal();


        if (
            !sidebar
        ) {
            tela.style.left =
                '0px';

            tela.style.right =
                '0px';

            return;
        }


        const rect =
            sidebar.getBoundingClientRect();


        let direcao =
            'ltr';


        try {
            direcao =
                getComputedStyle(
                    document.documentElement
                ).direction ||
                'ltr';

        } catch (erro) {
        }


        if (
            direcao ===
            'rtl'
        ) {
            tela.style.left =
                '0px';

            tela.style.right =
                Math.max(
                    0,
                    window.innerWidth -
                    rect.left
                ) +
                'px';

            return;
        }


        tela.style.left =
            Math.max(
                0,
                rect.right
            ) +
            'px';

        tela.style.right =
            '0px';
    }


    function iniciarObservacaoLayoutTelaAlertas() {
        observadorLayoutTelaAlertas
            ?.disconnect?.();


        observadorLayoutTelaAlertas =
            null;


        if (
            handlerResizeTelaAlertas
        ) {
            window.removeEventListener(
                'resize',
                handlerResizeTelaAlertas
            );
        }


        handlerResizeTelaAlertas =
            posicionarTelaConfiguracaoAlertas;


        window.addEventListener(
            'resize',
            handlerResizeTelaAlertas
        );


        const sidebar =
            localizarBarraLateralPrincipal();


        if (
            sidebar &&
            typeof ResizeObserver !==
                'undefined'
        ) {
            observadorLayoutTelaAlertas =
                new ResizeObserver(
                    function () {
                        posicionarTelaConfiguracaoAlertas();
                    }
                );


            observadorLayoutTelaAlertas.observe(
                sidebar
            );
        }
    }


    function instalarFechamentoTelaAlertasPorNavegacao() {
        if (
            handlerCliqueNavegacaoTelaAlertas
        ) {
            document.removeEventListener(
                'click',
                handlerCliqueNavegacaoTelaAlertas,
                true
            );
        }


        handlerCliqueNavegacaoTelaAlertas =
            function (
                event
            ) {
                const tela =
                    document.getElementById(
                        'way-alertas-inatividade-screen'
                    );


                if (
                    !tela
                ) {
                    return;
                }


                if (
                    event.target.closest?.(
                        '[data-way-alert-menu="true"]'
                    )
                ) {
                    return;
                }


                const sidebar =
                    localizarBarraLateralPrincipal();


                if (
                    !sidebar ||
                    !sidebar.contains(
                        event.target
                    )
                ) {
                    return;
                }


                const acionavel =
                    event.target.closest?.(
                        'a,button,[role="button"]'
                    );


                if (
                    !acionavel
                ) {
                    return;
                }


                setTimeout(
                    fecharModalConfiguracaoAlertas,
                    0
                );
            };


        document.addEventListener(
            'click',
            handlerCliqueNavegacaoTelaAlertas,
            true
        );
    }


    function abrirModalConfiguracaoAlertas() {
        fecharModalConfiguracaoAlertas();

        fecharModalConfiguracao();

        fecharAutocomplete();

        aplicarTemaAplicativo();


        const tela =
            document.createElement(
                'section'
            );


        tela.id =
            'way-alertas-inatividade-screen';


        tela.className =
            'way-alert-display-screen';


        /*
         * A estrutura visual segue a mesma lógica
         * das páginas nativas de Configurações:
         *
         * - a barra lateral original permanece;
         * - somente a área à direita é ocupada;
         * - o conteúdo fica limitado a max-w-5xl;
         * - não há overlay sobre a navegação lateral.
         */

        tela.innerHTML = `

            <div
                class="flex flex-col w-full h-full m-0 pb-8 pt-4 px-6 overflow-auto bg-n-surface-1 way-alert-display-scroll"
            >

                <div
                    class="flex items-start w-full max-w-5xl mx-auto"
                >

                    <div
                        class="flex flex-col w-full h-full gap-4 font-inter"
                        feature-name="way-inactivity-alerts"
                    >

                        <div
                            class="flex flex-col items-start w-full"
                        >

                            <div
                                class="flex items-center justify-between w-full gap-4 min-h-8 mb-2"
                            >

                                <h1
                                    class="text-heading-1 text-n-slate-12"
                                >
                                    Alertas de inatividade
                                </h1>

                            </div>


                            <div
                                class="flex flex-col w-full gap-1.5 text-n-slate-11"
                            >

                                <p
                                    class="mb-0 line-clamp-5 sm:line-clamp-none max-w-3xl text-body-main"
                                >
                                    Configure os limites visuais usados para destacar atendimentos de acordo com o tempo desde a última atividade do cliente.
                                </p>

                            </div>

                        </div>


                        <main class="w-full">

                            <div
                                class="way-msg-editor way-alert-display-editor"
                            ></div>

                        </main>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            tela
        );


        marcarMenuAlertasAtivo(
            true
        );


        posicionarTelaConfiguracaoAlertas();

        iniciarObservacaoLayoutTelaAlertas();

        instalarFechamentoTelaAlertasPorNavegacao();


        requestAnimationFrame(
            posicionarTelaConfiguracaoAlertas
        );


        renderizarConfiguracaoAlertas();
    }


    function fecharModalConfiguracaoAlertas() {
        document
            .getElementById(
                'way-alertas-inatividade-screen'
            )
            ?.remove();


        marcarMenuAlertasAtivo(
            false
        );


        observadorLayoutTelaAlertas
            ?.disconnect?.();


        observadorLayoutTelaAlertas =
            null;


        if (
            handlerResizeTelaAlertas
        ) {
            window.removeEventListener(
                'resize',
                handlerResizeTelaAlertas
            );


            handlerResizeTelaAlertas =
                null;
        }


        if (
            handlerCliqueNavegacaoTelaAlertas
        ) {
            document.removeEventListener(
                'click',
                handlerCliqueNavegacaoTelaAlertas,
                true
            );


            handlerCliqueNavegacaoTelaAlertas =
                null;
        }
    }


    function abrirModalConfiguracao() {
        fecharModalConfiguracao();

        fecharModalConfiguracaoAlertas();

        fecharAutocomplete();

        aplicarTemaAplicativo();


        mensagemEmEdicaoId =
            null;


        const overlay =
            document.createElement(
                'div'
            );


        overlay.id =
            'way-msg-personalizadas-modal';


        overlay.className =
            'way-msg-overlay';


        overlay.innerHTML = `

            <div class="way-msg-modal">

                <div class="way-msg-header">

                    <div class="way-msg-header-left">

                        <h2 class="way-msg-title">
                            💬 Mensagens Personalizadas
                        </h2>

                        <div class="way-msg-subtitle">
                            Configure categorias, comandos, automações e tags globais.
                        </div>

                        <div class="way-msg-backup-status"></div>

                    </div>

                    <div class="way-msg-header-actions">

                        <div class="way-msg-header-backup">

                            <button
                                type="button"
                                class="way-msg-backup-button way-msg-export"
                            >
                                ⬇ Exportar JSON
                            </button>

                            <button
                                type="button"
                                class="way-msg-backup-button way-msg-import"
                            >
                                ⬆ Importar JSON
                            </button>

                        </div>

                        <button
                            type="button"
                            class="way-msg-close"
                        >
                            ×
                        </button>

                    </div>

                </div>

                <div class="way-msg-body">

                    <aside class="way-msg-sidebar">

                        <button
                            type="button"
                            class="way-msg-new"
                        >
                            ＋ Nova mensagem
                        </button>

                        <div class="way-msg-list"></div>

                    </aside>

                    <main class="way-msg-editor">

                        <div class="way-msg-editor-placeholder">

                            Selecione uma mensagem ou clique em

                            <strong>
                                &nbsp;Nova mensagem&nbsp;
                            </strong>

                            para começar.

                        </div>

                    </main>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        overlay
            .querySelector(
                '.way-msg-close'
            )
            .onclick =
                fecharModalConfiguracao;


        overlay
            .querySelector(
                '.way-msg-new'
            )
            .onclick =
                function () {
                    mensagemEmEdicaoId =
                        null;


                    renderizarLista();


                    renderizarFormulario(
                        null
                    );
                };


        overlay
            .querySelector(
                '.way-msg-export'
            )
            .onclick =
                exportarMensagensJSON;


        overlay
            .querySelector(
                '.way-msg-import'
            )
            .onclick =
                selecionarArquivoImportacao;


        renderizarLista();
    }


    function fecharModalConfiguracao() {
        document
            .getElementById(
                'way-msg-personalizadas-modal'
            )
            ?.remove();


        mensagemEmEdicaoId =
            null;
    }


    /* =========================================================
       LISTA
       ========================================================= */

    function renderizarLista() {
        const lista =
            document.querySelector(
                '#way-msg-personalizadas-modal .way-msg-list'
            );


        if (
            !lista
        ) {
            return;
        }


        const mensagens =
            carregarMensagens();


        lista.innerHTML =
            '';


        if (
            !mensagens.length
        ) {
            lista.innerHTML = `

                <div class="way-msg-empty">

                    Nenhuma mensagem cadastrada.

                    <br><br>

                    Exemplo:
                    <strong>!bomdia</strong>

                </div>

            `;


            return;
        }


        mensagens
            .slice()
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.comando
                    )
                        .localeCompare(
                            String(
                                b.comando
                            )
                        )
            )
            .forEach(
                mensagem => {
                    const item =
                        document.createElement(
                            'div'
                        );


                    item.className =
                        'way-msg-list-item';


                    if (
                        mensagem.id ===
                        mensagemEmEdicaoId
                    ) {
                        item.classList.add(
                            'active'
                        );
                    }


                    const tipo =
                        mensagem.tipo ||
                        'texto';


                    let descricao =
                        mensagem.mensagem ||
                        'Mensagem personalizada';


                    let badge =
                        '';


                    if (
                        tipo ===
                        'disponibilidade'
                    ) {
                        descricao =
                            'Selecionar data e períodos';


                        badge = `
                            <span class="way-msg-badge way-msg-badge-agenda">
                                Agenda
                            </span>
                        `;
                    }


                    if (
                        tipo ===
                        'visita'
                    ) {
                        descricao =
                            'Preencher dados da visita técnica';


                        badge = `
                            <span class="way-msg-badge way-msg-badge-visita">
                                Visita
                            </span>
                        `;
                    }


                    if (
                        tipo ===
                            'texto' &&
                        mensagem.variacaoHorario
                    ) {
                        descricao =
                            'Mensagem varia conforme o horário';


                        badge = `
                            <span class="way-msg-badge">
                                Horário
                            </span>
                        `;
                    }


                    item.innerHTML = `

                        <div class="way-msg-list-main">

                            <span class="way-msg-command">
                                !${escaparHTML(
                                    mensagem.comando
                                )}
                            </span>

                            <span class="way-msg-list-description">
                                ${escaparHTML(
                                    descricao
                                )}
                            </span>

                            <span class="way-msg-list-category">
                                ${escaparHTML(
                                    obterNomeCategoria(
                                        mensagem.categoria
                                    )
                                )}
                            </span>

                        </div>

                        ${badge}

                    `;


                    item.addEventListener(
                        'click',

                        function () {
                            mensagemEmEdicaoId =
                                mensagem.id;


                            renderizarLista();


                            renderizarFormulario(
                                mensagem
                            );
                        }
                    );


                    lista.appendChild(
                        item
                    );
                }
            );
    }


    /* =========================================================
       TAGS VISITA UI
       ========================================================= */

    function gerarHTMLTagsVisita() {
        return [
            'nomecliente',
            'email',
            'telefone',
            'cpf',
            'endereco',
            'data',
            'periodo',
            'horario',
            'protocolo',
            'nome'
        ]
            .map(
                tag => `

                    <button
                        type="button"
                        class="way-msg-visita-tag"
                        data-way-insert-tag="${escaparHTML(tag)}"
                    >
                        {{${escaparHTML(tag)}}}
                    </button>

                `
            )
            .join('');
    }


    /* =========================================================
       FORMULÁRIO
       ========================================================= */

    function renderizarFormulario(
        mensagem
    ) {
        const editor =
            document.querySelector(
                '#way-msg-personalizadas-modal .way-msg-editor'
            );


        if (
            !editor
        ) {
            return;
        }


        const dados =
            mensagem ||
            {
                id: '',
                comando: '',
                categoria: '',
                tipo: 'texto',
                variacaoHorario: false,
                mensagem: '',
                manha: '',
                tarde: '',
                noite: '',
                templateVisita: ''
            };


        const tipoInicial =
            dados.tipo ||
            'texto';


        editor.innerHTML = `

            <form
                class="way-msg-form"
                autocomplete="off"
            >

                <div class="way-msg-current-period">

                    🕐 Agora:
                    ${escaparHTML(
                        obterNomePeriodoAtual()
                    )}
                    —
                    ${escaparHTML(
                        obterHoraAtual()
                    )}

                </div>

                <div class="way-msg-field">

                    <label>
                        Categoria
                    </label>

                    <select name="categoria">
                        ${gerarOptionsCategorias(
                            dados.categoria ||
                            ''
                        )}
                    </select>

                </div>

                <div class="way-msg-category-info">

                    A categoria organiza os comandos exibidos ao digitar
                    <strong>!</strong> no chat.

                </div>

                <div class="way-msg-field">

                    <label>
                        Comando
                    </label>

                    <div class="way-msg-command-wrapper">

                        <span class="way-msg-command-prefix">
                            !
                        </span>

                        <input
                            type="text"
                            name="comando"
                            maxlength="40"
                            placeholder="bomdia"
                            value="${escaparHTML(
                                dados.comando
                            )}"
                        >

                    </div>

                </div>

                <div class="way-msg-field">

                    <label>
                        Tipo de automação
                    </label>

                    <select name="tipo">

                        <option
                            value="texto"
                            ${
                                tipoInicial ===
                                'texto'
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            Mensagem de texto
                        </option>

                        <option
                            value="disponibilidade"
                            ${
                                tipoInicial ===
                                'disponibilidade'
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            Disponibilidade de atendimento
                        </option>

                        <option
                            value="visita"
                            ${
                                tipoInicial ===
                                'visita'
                                    ?
                                    'selected'
                                    :
                                    ''
                            }
                        >
                            Visita Técnica
                        </option>

                    </select>

                </div>

                <div class="way-msg-tags-box">

                    <span class="way-msg-tags-title">
                        🏷 Tags globais — funcionam em qualquer mensagem
                    </span>

                    <div class="way-msg-global-tags-grid">
                        ${gerarHTMLTagsGlobais()}
                    </div>

                </div>

                <div class="way-msg-texto-options">

                    <label class="way-msg-check">

                        <input
                            type="checkbox"
                            name="variacaoHorario"
                            ${
                                dados.variacaoHorario
                                    ?
                                    'checked'
                                    :
                                    ''
                            }
                        >

                        <span class="way-msg-check-text">

                            <span class="way-msg-check-title">
                                Mensagem diferente de acordo com o horário
                            </span>

                            <span class="way-msg-check-description">
                                Manhã 05:00–11:59 ·
                                Tarde 12:00–17:59 ·
                                Noite 18:00–04:59
                            </span>

                        </span>

                    </label>

                    <div class="way-msg-normal-container">

                        <div class="way-msg-field">

                            <label>
                                Mensagem
                            </label>

                            <textarea
                                name="mensagem"
                            >${escaparHTML(
                                dados.mensagem
                            )}</textarea>

                        </div>

                    </div>

                    <div
                        class="way-msg-horarios-container"
                        style="display:none;"
                    >

                        <div class="way-msg-periodos">

                            <div class="way-msg-periodo-card">

                                <span class="way-msg-periodo-title">
                                    🌅 Manhã
                                </span>

                                <textarea
                                    name="manha"
                                >${escaparHTML(
                                    dados.manha
                                )}</textarea>

                            </div>

                            <div class="way-msg-periodo-card">

                                <span class="way-msg-periodo-title">
                                    ☀️ Tarde
                                </span>

                                <textarea
                                    name="tarde"
                                >${escaparHTML(
                                    dados.tarde
                                )}</textarea>

                            </div>

                            <div class="way-msg-periodo-card">

                                <span class="way-msg-periodo-title">
                                    🌙 Noite
                                </span>

                                <textarea
                                    name="noite"
                                >${escaparHTML(
                                    dados.noite
                                )}</textarea>

                            </div>

                        </div>

                    </div>

                </div>

                <div
                    class="way-msg-disponibilidade-options"
                    style="display:none;"
                >

                    <div class="way-msg-special-info">

                        <strong>
                            📅 Disponibilidade de atendimento
                        </strong>

                        <br><br>

                        Ao executar o comando será aberto
                        um seletor de data e períodos.

                    </div>

                </div>

                <div
                    class="way-msg-visita-options"
                    style="display:none;"
                >

                    <div class="way-msg-special-info way-msg-visita-info">

                        <strong>
                            🛠 Visita Técnica
                        </strong>

                        <br><br>

                        Nome, telefone, e-mail, CPF,
                        endereço e protocolo podem ser
                        preenchidos automaticamente.

                    </div>

                    <div class="way-msg-visita-tags-box">

                        <span class="way-msg-tags-title">
                            🏷 Tags disponíveis para a visita
                        </span>

                        <div class="way-msg-visita-tag-list">
                            ${gerarHTMLTagsVisita()}
                        </div>

                        <div class="way-msg-tags-detectadas">

                            <strong>
                                Tags detectadas:
                            </strong>

                            <span data-way-tags-detectadas>
                                Nenhuma
                            </span>

                        </div>

                    </div>

                    <div class="way-msg-field">

                        <label>
                            Texto padrão da visita
                        </label>

                        <textarea
                            name="templateVisita"
                            class="way-msg-template-visita"
                        >${escaparHTML(
                            dados.templateVisita ||
                            ''
                        )}</textarea>

                    </div>

                </div>

                <div class="way-msg-status"></div>

                <div class="way-msg-actions">

                    ${
                        mensagem
                            ?
                            `
                                <button
                                    type="button"
                                    class="way-msg-delete"
                                >
                                    🗑 Excluir
                                </button>
                            `
                            :
                            ''
                    }

                    <button
                        type="button"
                        class="way-msg-cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="way-msg-save"
                    >
                        💾 Salvar mensagem
                    </button>

                </div>

            </form>

        `;


        const form =
            editor.querySelector(
                '.way-msg-form'
            );


        const tipo =
            form.querySelector(
                '[name="tipo"]'
            );


        const checkHorario =
            form.querySelector(
                '[name="variacaoHorario"]'
            );


        const textoOptions =
            form.querySelector(
                '.way-msg-texto-options'
            );


        const disponibilidadeOptions =
            form.querySelector(
                '.way-msg-disponibilidade-options'
            );


        const visitaOptions =
            form.querySelector(
                '.way-msg-visita-options'
            );


        const normal =
            form.querySelector(
                '.way-msg-normal-container'
            );


        const horarios =
            form.querySelector(
                '.way-msg-horarios-container'
            );


        const textareaVisita =
            form.querySelector(
                '[name="templateVisita"]'
            );


        const tagsDetectadas =
            form.querySelector(
                '[data-way-tags-detectadas]'
            );


        function atualizarTagsDetectadas() {
            const tags =
                extrairTagsTemplate(
                    textareaVisita.value
                );


            tagsDetectadas.textContent =
                tags.length
                    ?
                    tags
                        .map(
                            tag =>
                                `{{${tag}}}`
                        )
                        .join(
                            ', '
                        )
                    :
                    'Nenhuma';
        }


        function atualizarInterface() {
            const valor =
                tipo.value;


            textoOptions.style.display =
                valor ===
                    'texto'
                    ?
                    'block'
                    :
                    'none';


            disponibilidadeOptions.style.display =
                valor ===
                    'disponibilidade'
                    ?
                    'block'
                    :
                    'none';


            visitaOptions.style.display =
                valor ===
                    'visita'
                    ?
                    'block'
                    :
                    'none';


            if (
                valor ===
                'texto'
            ) {
                normal.style.display =
                    checkHorario.checked
                        ?
                        'none'
                        :
                        'block';


                horarios.style.display =
                    checkHorario.checked
                        ?
                        'block'
                        :
                        'none';
            }


            if (
                valor ===
                    'visita' &&
                !textareaVisita.value
                    .trim()
            ) {
                textareaVisita.value =
                    TEMPLATE_VISITA_PADRAO;


                atualizarTagsDetectadas();
            }
        }


        tipo.addEventListener(
            'change',
            atualizarInterface
        );


        checkHorario.addEventListener(
            'change',
            atualizarInterface
        );


        textareaVisita.addEventListener(
            'input',
            atualizarTagsDetectadas
        );


        form
            .querySelectorAll(
                '[data-way-insert-tag]'
            )
            .forEach(
                botao => {
                    botao.addEventListener(
                        'click',

                        function () {
                            const tag =
                                botao.dataset
                                    .wayInsertTag;


                            const texto =
                                `{{${tag}}}`;


                            const inicio =
                                textareaVisita
                                    .selectionStart;


                            const fim =
                                textareaVisita
                                    .selectionEnd;


                            textareaVisita.value =
                                textareaVisita.value.slice(
                                    0,
                                    inicio
                                ) +
                                texto +
                                textareaVisita.value.slice(
                                    fim
                                );


                            textareaVisita.focus();


                            const posicao =
                                inicio +
                                texto.length;


                            textareaVisita
                                .setSelectionRange(
                                    posicao,
                                    posicao
                                );


                            atualizarTagsDetectadas();
                        }
                    );
                }
            );


        atualizarInterface();

        atualizarTagsDetectadas();


        form
            .querySelector(
                '.way-msg-cancel'
            )
            .onclick =
                function () {
                    mensagemEmEdicaoId =
                        null;


                    renderizarLista();


                    editor.innerHTML = `

                        <div class="way-msg-editor-placeholder">

                            Selecione uma mensagem ou clique em

                            <strong>
                                &nbsp;Nova mensagem&nbsp;
                            </strong>

                            para começar.

                        </div>

                    `;
                };


        form
            .querySelector(
                '.way-msg-delete'
            )
            ?.addEventListener(
                'click',

                function () {
                    excluirMensagem(
                        mensagem.id
                    );
                }
            );


        form.addEventListener(
            'submit',

            function (
                event
            ) {
                event.preventDefault();


                salvarFormulario(
                    form,
                    mensagem
                );
            }
        );
    }


    /* =========================================================
       SALVAR
       ========================================================= */

    function definirStatus(
        form,
        texto,
        tipo
    ) {
        const status =
            form.querySelector(
                '.way-msg-status'
            );


        status.className =
            'way-msg-status ' +
            (
                tipo ||
                ''
            );


        status.textContent =
            texto ||
            '';
    }


    function salvarFormulario(
        form,
        original
    ) {
        const categoria =
            form.querySelector(
                '[name="categoria"]'
            ).value;


        const comando =
            normalizarComando(
                form.querySelector(
                    '[name="comando"]'
                ).value
            );


        const tipo =
            form.querySelector(
                '[name="tipo"]'
            ).value;


        const variacaoHorario =
            form.querySelector(
                '[name="variacaoHorario"]'
            ).checked;


        const mensagem =
            form.querySelector(
                '[name="mensagem"]'
            )
                .value
                .trim();


        const manha =
            form.querySelector(
                '[name="manha"]'
            )
                .value
                .trim();


        const tarde =
            form.querySelector(
                '[name="tarde"]'
            )
                .value
                .trim();


        const noite =
            form.querySelector(
                '[name="noite"]'
            )
                .value
                .trim();


        const templateVisita =
            form.querySelector(
                '[name="templateVisita"]'
            )
                .value
                .trim();


        if (
            !categoria ||
            !CATEGORIAS[
                categoria
            ]
        ) {
            definirStatus(
                form,
                'Selecione uma categoria.',
                'error'
            );


            return;
        }


        if (
            !comando
        ) {
            definirStatus(
                form,
                'Informe um comando.',
                'error'
            );


            return;
        }


        if (
            tipo ===
                'texto' &&
            !variacaoHorario &&
            !mensagem
        ) {
            definirStatus(
                form,
                'Digite a mensagem.',
                'error'
            );


            return;
        }


        if (
            tipo ===
                'texto' &&
            variacaoHorario &&
            (
                !manha ||
                !tarde ||
                !noite
            )
        ) {
            definirStatus(
                form,
                'Preencha manhã, tarde e noite.',
                'error'
            );


            return;
        }


        if (
            tipo ===
                'visita' &&
            !templateVisita
        ) {
            definirStatus(
                form,
                'Digite o texto da visita técnica.',
                'error'
            );


            return;
        }


        const mensagens =
            carregarMensagens();


        const duplicado =
            mensagens.find(
                item =>
                    item.comando ===
                        comando &&
                    item.id !==
                        original?.id
            );


        if (
            duplicado
        ) {
            definirStatus(
                form,
                `O comando !${comando} já existe.`,
                'error'
            );


            return;
        }


        const registro = {
            id:
                original?.id ||
                gerarId(),

            comando,
            categoria,
            tipo,

            variacaoHorario:
                tipo ===
                    'texto'
                    ?
                    variacaoHorario
                    :
                    false,

            mensagem:
                tipo ===
                    'texto' &&
                !variacaoHorario
                    ?
                    mensagem
                    :
                    '',

            manha:
                tipo ===
                    'texto' &&
                variacaoHorario
                    ?
                    manha
                    :
                    '',

            tarde:
                tipo ===
                    'texto' &&
                variacaoHorario
                    ?
                    tarde
                    :
                    '',

            noite:
                tipo ===
                    'texto' &&
                variacaoHorario
                    ?
                    noite
                    :
                    '',

            templateVisita:
                tipo ===
                    'visita'
                    ?
                    templateVisita
                    :
                    ''
        };


        const indice =
            mensagens.findIndex(
                item =>
                    item.id ===
                    registro.id
            );


        if (
            indice >=
            0
        ) {
            mensagens[
                indice
            ] =
                registro;

        } else {
            mensagens.push(
                registro
            );
        }


        const sucesso =
            salvarMensagens(
                mensagens
            );


        if (
            !sucesso
        ) {
            definirStatus(
                form,
                'Não foi possível salvar a mensagem.',
                'error'
            );


            return;
        }


        mensagemEmEdicaoId =
            registro.id;


        definirStatus(
            form,
            '✓ Mensagem salva.',
            'success'
        );


        renderizarLista();
    }


    function excluirMensagem(
        id
    ) {
        if (
            !window.confirm(
                'Deseja excluir esta mensagem personalizada?'
            )
        ) {
            return;
        }


        salvarMensagens(
            carregarMensagens()
                .filter(
                    item =>
                        item.id !==
                        id
                )
        );


        mensagemEmEdicaoId =
            null;


        renderizarLista();
    }


    /* =========================================================
       CHAT
       ========================================================= */

    function obterValorCampo(
        campo
    ) {
        if (
            campo instanceof
                HTMLTextAreaElement ||
            campo instanceof
                HTMLInputElement
        ) {
            return (
                campo.value ||
                ''
            );
        }


        if (
            campo?.isContentEditable
        ) {
            return (
                campo.innerText ||
                campo.textContent ||
                ''
            );
        }


        return '';
    }


    function ehPossivelCampoChat(
        campo
    ) {
        if (
            !campo
        ) {
            return false;
        }


        if (
            campo.closest?.(
                [
                    '#way-msg-personalizadas-modal',
                    '#way-agenda-modal-root',
                    '#way-visita-modal-root',
                    '#way-import-modal-root',
                    '#way-msg-autocomplete'
                ].join(',')
            )
        ) {
            return false;
        }


        if (
            campo instanceof
            HTMLTextAreaElement
        ) {
            const placeholder =
                (
                    campo.getAttribute(
                        'placeholder'
                    ) ||
                    ''
                )
                    .toLowerCase();


            if (
                placeholder.includes(
                    'pesquisar'
                ) ||
                placeholder.includes(
                    'buscar'
                ) ||
                placeholder.includes(
                    'search'
                )
            ) {
                return false;
            }


            return true;
        }


        return Boolean(
            campo.isContentEditable
        );
    }


    function definirTextoCampo(
        campo,
        texto
    ) {
        if (
            !campo
        ) {
            return;
        }


        if (
            campo instanceof
            HTMLTextAreaElement
        ) {
            const setter =
                Object
                    .getOwnPropertyDescriptor(
                        HTMLTextAreaElement.prototype,
                        'value'
                    )
                    ?.set;


            if (
                setter
            ) {
                setter.call(
                    campo,
                    texto
                );

            } else {
                campo.value =
                    texto;
            }


            campo.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles:
                            true
                    }
                )
            );


            campo.dispatchEvent(
                new Event(
                    'change',
                    {
                        bubbles:
                            true
                    }
                )
            );


            campo.focus();


            campo.setSelectionRange(
                texto.length,
                texto.length
            );


            return;
        }


        if (
            campo.isContentEditable
        ) {
            campo.focus();


            campo.innerText =
                texto;


            campo.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles:
                            true
                    }
                )
            );


            try {
                const range =
                    document.createRange();


                range.selectNodeContents(
                    campo
                );


                range.collapse(
                    false
                );


                const selection =
                    window.getSelection();


                selection.removeAllRanges();


                selection.addRange(
                    range
                );

            } catch (erro) {
            }
        }
    }


    /* =========================================================
       AUTOCOMPLETE
       ========================================================= */

    function obterConsultaAutocomplete(
        campo
    ) {
        const texto =
            obterValorCampo(
                campo
            );


        if (
            !texto.startsWith(
                CONFIG.prefixoComando
            )
        ) {
            return null;
        }


        const consulta =
            texto.slice(
                CONFIG
                    .prefixoComando
                    .length
            );


        if (
            /\s/.test(
                consulta
            )
        ) {
            return null;
        }


        if (
            !/^[a-z0-9_-]*$/i
                .test(
                    consulta
                )
        ) {
            return null;
        }


        return consulta
            .toLowerCase();
    }


    function obterMensagensBuscaGlobal(
        consulta
    ) {
        return carregarMensagens()
            .filter(
                mensagem =>
                    String(
                        mensagem.comando ||
                        ''
                    )
                        .toLowerCase()
                        .startsWith(
                            consulta
                        )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.comando
                    )
                        .localeCompare(
                            String(
                                b.comando
                            )
                        )
            )
            .slice(
                0,
                CONFIG.autocomplete
                    .maxResultadosBusca
            );
    }


    function obterPreviewAutocomplete(
        mensagem
    ) {
        const tipo =
            mensagem.tipo ||
            'texto';


        if (
            tipo ===
            'disponibilidade'
        ) {
            return (
                '📅 Selecionar data e períodos disponíveis'
            );
        }


        if (
            tipo ===
            'visita'
        ) {
            return (
                '🛠 Preencher dados da visita técnica'
            );
        }


        return truncarTexto(
            obterTextoMensagem(
                mensagem
            ),
            220
        );
    }


    function obterPopupAutocomplete() {
        let popup =
            autocompleteState.popup;


        if (
            popup &&
            document.contains(
                popup
            )
        ) {
            return popup;
        }


        popup =
            document.createElement(
                'div'
            );


        popup.id =
            'way-msg-autocomplete';


        document.body.appendChild(
            popup
        );


        autocompleteState.popup =
            popup;


        return popup;
    }


    function fecharAutocomplete() {
        autocompleteState
            .popup
            ?.remove();


        autocompleteState.popup =
            null;

        autocompleteState.campo =
            null;

        autocompleteState.modo =
            'categorias';

        autocompleteState.categoriaSelecionada =
            '';

        autocompleteState.categorias =
            [];

        autocompleteState.mensagens =
            [];

        autocompleteState.indice =
            0;
    }


    function totalItensAutocomplete() {
        return autocompleteState.modo ===
            'categorias'
            ?
            autocompleteState.categorias.length
            :
            autocompleteState.mensagens.length;
    }


    function atualizarSelecaoAutocomplete() {
        const popup =
            autocompleteState.popup;


        if (
            !popup
        ) {
            return;
        }


        const itens =
            popup.querySelectorAll(
                '.way-ac-selectable'
            );


        itens.forEach(
            (
                item,
                indice
            ) => {
                item.classList.toggle(
                    'active',
                    indice ===
                    autocompleteState.indice
                );
            }
        );


        itens[
            autocompleteState.indice
        ]
            ?.scrollIntoView(
                {
                    block:
                        'nearest'
                }
            );
    }


    function moverAutocomplete(
        direcao
    ) {
        const total =
            totalItensAutocomplete();


        if (
            !total
        ) {
            return;
        }


        autocompleteState.indice +=
            direcao;


        if (
            autocompleteState.indice <
            0
        ) {
            autocompleteState.indice =
                total - 1;
        }


        if (
            autocompleteState.indice >=
            total
        ) {
            autocompleteState.indice =
                0;
        }


        atualizarSelecaoAutocomplete();
    }


    function posicionarAutocomplete() {
        const popup =
            autocompleteState.popup;


        const campo =
            autocompleteState.campo;


        if (
            !popup ||
            !campo ||
            !document.contains(
                campo
            )
        ) {
            fecharAutocomplete();

            return;
        }


        const rect =
            campo.getBoundingClientRect();


        const margem =
            12;


        const largura =
            Math.min(
                Math.max(
                    rect.width,
                    CONFIG.autocomplete
                        .larguraMinima,
                    window.innerWidth *
                    CONFIG.autocomplete
                        .percentualTela
                ),

                CONFIG.autocomplete
                    .larguraMaxima,

                window.innerWidth -
                margem *
                2
            );


        let esquerda =
            rect.left +
            (
                rect.width -
                largura
            ) /
            2;


        esquerda =
            Math.max(
                margem,
                esquerda
            );


        if (
            esquerda +
            largura >
            window.innerWidth -
            margem
        ) {
            esquerda =
                window.innerWidth -
                largura -
                margem;
        }


        popup.style.width =
            largura +
            'px';


        popup.style.left =
            esquerda +
            'px';


        const altura =
            Math.min(
                popup.offsetHeight,
                CONFIG.autocomplete
                    .alturaMaxima
            );


        if (
            rect.top >
            altura +
            8
        ) {
            popup.style.top =
                'auto';


            popup.style.bottom =
                (
                    window.innerHeight -
                    rect.top +
                    6
                ) +
                'px';

        } else {
            popup.style.bottom =
                'auto';


            popup.style.top =
                (
                    rect.bottom +
                    6
                ) +
                'px';
        }
    }


    function renderizarCategoriasAutocomplete(
        campo
    ) {
        const categorias =
            obterCategoriasAutocomplete();


        if (
            !categorias.length
        ) {
            fecharAutocomplete();

            return;
        }


        const popup =
            obterPopupAutocomplete();


        autocompleteState.campo =
            campo;

        autocompleteState.modo =
            'categorias';

        autocompleteState.categoriaSelecionada =
            '';

        autocompleteState.categorias =
            categorias;

        autocompleteState.mensagens =
            [];

        autocompleteState.indice =
            0;


        popup.innerHTML = `

            <div class="way-ac-header">

                <div class="way-ac-header-left">

                    <div class="way-ac-title-wrap">

                        <span class="way-ac-title">
                            💬 Mensagens Personalizadas
                        </span>

                        <span class="way-ac-subtitle">
                            Selecione uma categoria ou continue digitando
                        </span>

                    </div>

                </div>

                <span class="way-ac-count">
                    ${categorias.length} categorias
                </span>

            </div>

            <div class="way-ac-categories"></div>

            <div class="way-ac-footer">

                <span>
                    <span class="way-ac-key">↑</span>
                    <span class="way-ac-key">↓</span>
                    navegar
                </span>

                <span>
                    <span class="way-ac-key">Enter</span>
                    abrir
                </span>

                <span>
                    <span class="way-ac-key">Esc</span>
                    fechar
                </span>

            </div>

        `;


        const container =
            popup.querySelector(
                '.way-ac-categories'
            );


        categorias.forEach(
            (
                categoria,
                indice
            ) => {
                const item =
                    document.createElement(
                        'button'
                    );


                item.type =
                    'button';


                item.className =
                    'way-ac-category-item way-ac-selectable';


                if (
                    indice ===
                    0
                ) {
                    item.classList.add(
                        'active'
                    );
                }


                const preview =
                    categoria.comandos
                        .slice(
                            0,
                            6
                        )
                        .map(
                            mensagem =>
                                `!${mensagem.comando}`
                        )
                        .join(
                            ' · '
                        );


                item.innerHTML = `

                    <span class="way-ac-category-main">

                        <span class="way-ac-category-name">
                            ${escaparHTML(
                                categoria.label
                            )}
                        </span>

                        <span class="way-ac-category-preview">
                            ${escaparHTML(
                                preview
                            )}
                        </span>

                    </span>

                    <span class="way-ac-category-side">

                        <span class="way-ac-category-count">
                            ${categoria.quantidade}
                        </span>

                        <span class="way-ac-category-arrow">
                            ›
                        </span>

                    </span>

                `;


                item.addEventListener(
                    'mouseenter',

                    function () {
                        autocompleteState.indice =
                            indice;


                        atualizarSelecaoAutocomplete();
                    }
                );


                item.addEventListener(
                    'mousedown',

                    function (
                        event
                    ) {
                        event.preventDefault();

                        event.stopPropagation();


                        abrirCategoriaAutocomplete(
                            categoria.id,
                            campo
                        );
                    }
                );


                container.appendChild(
                    item
                );
            }
        );


        requestAnimationFrame(
            posicionarAutocomplete
        );
    }


    function abrirCategoriaAutocomplete(
        categoria,
        campo
    ) {
        const mensagens =
            obterMensagensCategoria(
                categoria
            );


        if (
            !mensagens.length
        ) {
            return;
        }


        autocompleteState.indice =
            0;


        renderizarComandosAutocomplete(
            campo,
            mensagens,
            {
                modo:
                    'categoria',

                categoria
            }
        );
    }


    function voltarCategoriasAutocomplete() {
        const campo =
            autocompleteState.campo;


        if (
            !campo
        ) {
            fecharAutocomplete();

            return;
        }


        autocompleteState.indice =
            0;


        renderizarCategoriasAutocomplete(
            campo
        );
    }


    function obterBadgeMensagem(
        mensagem
    ) {
        const tipo =
            mensagem.tipo ||
            'texto';


        if (
            tipo ===
            'disponibilidade'
        ) {
            return {
                texto: 'Agenda',
                classe: 'agenda'
            };
        }


        if (
            tipo ===
            'visita'
        ) {
            return {
                texto: 'Visita',
                classe: 'visita'
            };
        }


        if (
            mensagem.variacaoHorario
        ) {
            return {
                texto: 'Horário',
                classe: ''
            };
        }


        return {
            texto: 'Mensagem',
            classe: ''
        };
    }


    function renderizarComandosAutocomplete(
        campo,
        mensagens,
        opcoes = {}
    ) {
        if (
            !mensagens.length
        ) {
            fecharAutocomplete();

            return;
        }


        const popup =
            obterPopupAutocomplete();


        const modo =
            opcoes.modo ||
            'busca';


        const categoria =
            opcoes.categoria ||
            '';


        autocompleteState.campo =
            campo;

        autocompleteState.modo =
            modo;

        autocompleteState.categoriaSelecionada =
            modo ===
                'categoria'
                ?
                categoria
                :
                '';

        autocompleteState.mensagens =
            mensagens;

        autocompleteState.categorias =
            [];

        autocompleteState.indice =
            0;


        let titulo =
            '🔎 Resultados';


        let subtitulo =
            'Busca global de comandos';


        let botaoVoltar =
            '';


        if (
            modo ===
            'categoria'
        ) {
            titulo =
                categoria ===
                CATEGORIA_SEM_CATEGORIA
                    ?
                    '⚪ Sem categoria'
                    :
                    obterNomeCategoria(
                        categoria
                    );


            subtitulo =
                'Comandos desta categoria';


            botaoVoltar = `

                <button
                    type="button"
                    class="way-ac-back"
                    data-way-ac-back
                >
                    ← Categorias
                </button>

            `;
        }


        if (
            modo ===
            'busca'
        ) {
            titulo =
                `🔎 !${obterConsultaAutocomplete(campo)}`;


            subtitulo =
                'Resultados em todas as categorias';
        }


        popup.innerHTML = `

            <div class="way-ac-header">

                <div class="way-ac-header-left">

                    ${botaoVoltar}

                    <div class="way-ac-title-wrap">

                        <span class="way-ac-title">
                            ${escaparHTML(
                                titulo
                            )}
                        </span>

                        <span class="way-ac-subtitle">
                            ${escaparHTML(
                                subtitulo
                            )}
                        </span>

                    </div>

                </div>

                <span class="way-ac-count">
                    ${mensagens.length} comandos
                </span>

            </div>

            <div class="way-ac-items"></div>

            <div class="way-ac-footer">

                <span>
                    <span class="way-ac-key">↑</span>
                    <span class="way-ac-key">↓</span>
                    navegar
                </span>

                <span>
                    <span class="way-ac-key">Enter</span>
                    selecionar
                </span>

                <span>
                    <span class="way-ac-key">Esc</span>
                    ${
                        modo ===
                        'categoria'
                            ?
                            'voltar'
                            :
                            'fechar'
                    }
                </span>

            </div>

        `;


        popup
            .querySelector(
                '[data-way-ac-back]'
            )
            ?.addEventListener(
                'mousedown',

                function (
                    event
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    voltarCategoriasAutocomplete();
                }
            );


        const container =
            popup.querySelector(
                '.way-ac-items'
            );


        mensagens.forEach(
            (
                mensagem,
                indice
            ) => {
                const item =
                    document.createElement(
                        'button'
                    );


                item.type =
                    'button';


                item.className =
                    'way-ac-item way-ac-selectable';


                if (
                    indice ===
                    0
                ) {
                    item.classList.add(
                        'active'
                    );
                }


                const badge =
                    obterBadgeMensagem(
                        mensagem
                    );


                item.innerHTML = `

                    <span class="way-ac-command">
                        !${escaparHTML(
                            mensagem.comando
                        )}
                    </span>

                    <span class="way-ac-command-content">

                        <span class="way-ac-preview">
                            ${escaparHTML(
                                obterPreviewAutocomplete(
                                    mensagem
                                )
                            )}
                        </span>

                        <span class="way-ac-command-category">
                            ${escaparHTML(
                                obterNomeCategoria(
                                    mensagem.categoria
                                )
                            )}
                        </span>

                    </span>

                    <span class="way-ac-type ${badge.classe}">
                        ${escaparHTML(
                            badge.texto
                        )}
                    </span>

                `;


                item.addEventListener(
                    'mouseenter',

                    function () {
                        autocompleteState.indice =
                            indice;


                        atualizarSelecaoAutocomplete();
                    }
                );


                item.addEventListener(
                    'mousedown',

                    function (
                        event
                    ) {
                        event.preventDefault();

                        event.stopPropagation();


                        executarMensagemAutocomplete(
                            mensagem,
                            campo
                        );
                    }
                );


                container.appendChild(
                    item
                );
            }
        );


        requestAnimationFrame(
            posicionarAutocomplete
        );
    }


    function executarMensagemAutocomplete(
        mensagem,
        campo
    ) {
        if (
            !mensagem ||
            !campo
        ) {
            return;
        }


        fecharAutocomplete();


        const tipo =
            mensagem.tipo ||
            'texto';


        if (
            tipo ===
            'disponibilidade'
        ) {
            definirTextoCampo(
                campo,
                ''
            );


            abrirModalDisponibilidade(
                campo
            );


            return;
        }


        if (
            tipo ===
            'visita'
        ) {
            /*
             * Captura os dados do cliente ANTES de limpar
             * o comando digitado no campo do chat.
             *
             * O ChatWoot é reativo e pode reconstruir partes
             * do cartão do cliente após os eventos input/change
             * disparados por definirTextoCampo(). Guardando os
             * dados primeiro, a Visita Técnica não perde
             * {{nomecliente}}, {{endereco}}, {{telefone}} e as
             * demais informações já detectadas.
             */

            const dadosVisita =
                obterDadosVisitaSistema();


            definirTextoCampo(
                campo,
                ''
            );


            abrirModalVisita(
                campo,
                mensagem,
                dadosVisita
            );


            return;
        }


        const resposta =
            obterTextoMensagem(
                mensagem
            );


        if (
            resposta
        ) {
            definirTextoCampo(
                campo,
                resposta
            );
        }
    }


    function executarItemAutocompleteAtual() {
        if (
            autocompleteState.modo ===
            'categorias'
        ) {
            const categoria =
                autocompleteState
                    .categorias[
                        autocompleteState.indice
                    ];


            if (
                !categoria
            ) {
                return false;
            }


            abrirCategoriaAutocomplete(
                categoria.id,
                autocompleteState.campo
            );


            return true;
        }


        const mensagem =
            autocompleteState
                .mensagens[
                    autocompleteState.indice
                ];


        if (
            !mensagem
        ) {
            return false;
        }


        executarMensagemAutocomplete(
            mensagem,
            autocompleteState.campo
        );


        return true;
    }


    function atualizarAutocomplete(
        campo
    ) {
        if (
            !ehPossivelCampoChat(
                campo
            )
        ) {
            fecharAutocomplete();

            return;
        }


        const consulta =
            obterConsultaAutocomplete(
                campo
            );


        if (
            consulta ===
            null
        ) {
            fecharAutocomplete();

            return;
        }


        if (
            consulta ===
            ''
        ) {
            renderizarCategoriasAutocomplete(
                campo
            );


            return;
        }


        const mensagens =
            obterMensagensBuscaGlobal(
                consulta
            );


        if (
            !mensagens.length
        ) {
            fecharAutocomplete();

            return;
        }


        renderizarComandosAutocomplete(
            campo,
            mensagens,
            {
                modo:
                    'busca'
            }
        );
    }


    /* =========================================================
       MODAL DISPONIBILIDADE
       ========================================================= */

    function fecharModalDisponibilidade() {
        document
            .getElementById(
                'way-agenda-modal-root'
            )
            ?.remove();


        campoChatDisponibilidade =
            null;
    }


    function abrirModalDisponibilidade(
        campo
    ) {
        aplicarTemaAplicativo();


        campoChatDisponibilidade =
            campo;


        const overlay =
            document.createElement(
                'div'
            );


        overlay.id =
            'way-agenda-modal-root';


        overlay.className =
            'way-special-overlay';


        overlay.innerHTML = `

            <div class="way-special-modal">

                <div class="way-special-header">

                    <h3 class="way-special-title">
                        📅 Disponibilidade de Atendimento
                    </h3>

                    <button
                        type="button"
                        class="way-special-close"
                    >
                        ×
                    </button>

                </div>

                <div class="way-special-body">

                    <div class="way-agenda-field">

                        <label>
                            📅 Data
                        </label>

                        <input
                            type="date"
                            data-way-agenda="data"
                        >

                    </div>

                    <div class="way-agenda-field">

                        <label>
                            🕐 Períodos
                        </label>

                        <div class="way-agenda-periods">

                            <label class="way-agenda-period">

                                <input
                                    type="checkbox"
                                    value="manha"
                                    data-way-agenda-period
                                >

                                <span class="way-agenda-period-text">

                                    <span class="way-agenda-period-name">
                                        🌅 Manhã
                                    </span>

                                    <span class="way-agenda-period-hours">
                                        08h às 12h
                                    </span>

                                </span>

                            </label>

                            <label class="way-agenda-period">

                                <input
                                    type="checkbox"
                                    value="tarde"
                                    data-way-agenda-period
                                >

                                <span class="way-agenda-period-text">

                                    <span class="way-agenda-period-name">
                                        ☀️ Tarde
                                    </span>

                                    <span class="way-agenda-period-hours">
                                        13h às 17h
                                    </span>

                                </span>

                            </label>

                            <label class="way-agenda-period">

                                <input
                                    type="checkbox"
                                    value="noite"
                                    data-way-agenda-period
                                >

                                <span class="way-agenda-period-text">

                                    <span class="way-agenda-period-name">
                                        🌙 Noite
                                    </span>

                                    <span class="way-agenda-period-hours">
                                        18h às 20h
                                    </span>

                                </span>

                            </label>

                        </div>

                    </div>

                    <div class="way-special-preview-label">
                        👁 Pré-visualização
                    </div>

                    <textarea
                        class="way-special-preview"
                        data-way-agenda="preview"
                        readonly
                    ></textarea>

                    <div class="way-special-status"></div>

                </div>

                <div class="way-special-footer">

                    <button
                        type="button"
                        class="way-special-cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="way-special-insert"
                    >
                        💬 Inserir no chat
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const data =
            overlay.querySelector(
                '[data-way-agenda="data"]'
            );


        const preview =
            overlay.querySelector(
                '[data-way-agenda="preview"]'
            );


        const status =
            overlay.querySelector(
                '.way-special-status'
            );


        const periodos =
            Array.from(
                overlay.querySelectorAll(
                    '[data-way-agenda-period]'
                )
            );


        data.value =
            obterDataHojeInput();


        function obterSelecionados() {
            return periodos
                .filter(
                    item =>
                        item.checked
                )
                .map(
                    item =>
                        item.value
                );
        }


        function atualizarPreview() {
            preview.value =
                gerarMensagemDisponibilidade(
                    data.value,
                    obterSelecionados()
                );
        }


        data.onchange =
            atualizarPreview;


        periodos.forEach(
            item =>
                item.onchange =
                    atualizarPreview
        );


        overlay
            .querySelector(
                '.way-special-close'
            )
            .onclick =
                fecharModalDisponibilidade;


        overlay
            .querySelector(
                '.way-special-cancel'
            )
            .onclick =
                fecharModalDisponibilidade;


        overlay
            .querySelector(
                '.way-special-insert'
            )
            .onclick =
                function () {
                    const selecionados =
                        obterSelecionados();


                    if (
                        !selecionados.length
                    ) {
                        status.textContent =
                            '⚠️ Selecione pelo menos um período.';


                        return;
                    }


                    const texto =
                        gerarMensagemDisponibilidade(
                            data.value,
                            selecionados
                        );


                    definirTextoCampo(
                        campoChatDisponibilidade,
                        texto
                    );


                    fecharModalDisponibilidade();
                };


        atualizarPreview();
    }


    /* =========================================================
       MODAL VISITA
       ========================================================= */

    function fecharModalVisita() {
        document
            .getElementById(
                'way-visita-modal-root'
            )
            ?.remove();


        campoChatVisita =
            null;
    }


    function criarCampoVisitaHTML(
        tag,
        valorInicial
    ) {
        const definicao =
            TAGS_VISITA[
                tag
            ] ||
            {
                label:
                    criarNomeAmigavelTag(
                        tag
                    ),

                icone:
                    '🏷️',

                tipo:
                    'text'
            };


        const valor =
            escaparHTML(
                valorInicial ||
                ''
            );


        if (
            definicao.tipo ===
            'date'
        ) {
            return `

                <div class="way-visita-field">

                    <label>
                        ${definicao.icone}
                        ${escaparHTML(
                            definicao.label
                        )}

                        <span class="way-visita-field-tag">
                            {{${escaparHTML(tag)}}}
                        </span>
                    </label>

                    <input
                        type="date"
                        data-way-visita-input="${escaparHTML(tag)}"
                        value="${valor}"
                    >

                </div>

            `;
        }


        if (
            definicao.tipo ===
            'periodo'
        ) {
            return `

                <div class="way-visita-field">

                    <label>
                        ${definicao.icone}
                        ${escaparHTML(
                            definicao.label
                        )}

                        <span class="way-visita-field-tag">
                            {{${escaparHTML(tag)}}}
                        </span>
                    </label>

                    <select
                        data-way-visita-input="${escaparHTML(tag)}"
                    >

                        <option value="">
                            Selecione...
                        </option>

                        <option value="manha">
                            Manhã — 08h às 12h
                        </option>

                        <option value="tarde">
                            Tarde — 13h às 17h
                        </option>

                        <option value="noite">
                            Noite — 18h às 20h
                        </option>

                    </select>

                </div>

            `;
        }


        if (
            definicao.tipo ===
            'textarea'
        ) {
            return `

                <div class="way-visita-field">

                    <label>
                        ${definicao.icone}
                        ${escaparHTML(
                            definicao.label
                        )}

                        <span class="way-visita-field-tag">
                            {{${escaparHTML(tag)}}}
                        </span>
                    </label>

                    <textarea
                        data-way-visita-input="${escaparHTML(tag)}"
                    >${valor}</textarea>

                </div>

            `;
        }


        return `

            <div class="way-visita-field">

                <label>
                    ${definicao.icone}
                    ${escaparHTML(
                        definicao.label
                    )}

                    <span class="way-visita-field-tag">
                        {{${escaparHTML(tag)}}}
                    </span>

                    ${
                        tag ===
                        'horario'
                            ?
                            `
                                <span class="way-visita-field-auto">
                                    automático
                                </span>
                            `
                            :
                            ''
                    }
                </label>

                <input
                    type="${
                        definicao.tipo ===
                        'tel'
                            ?
                            'tel'
                            :
                            definicao.tipo ===
                            'email'
                                ?
                                'email'
                                :
                                'text'
                    }"
                    data-way-visita-input="${escaparHTML(tag)}"
                    value="${valor}"
                >

            </div>

        `;
    }


    function abrirModalVisita(
        campo,
        mensagem,
        dadosPreCarregados = null
    ) {
        fecharModalVisita();

        aplicarTemaAplicativo();


        campoChatVisita =
            campo;


        const template =
            mensagem.templateVisita ||
            TEMPLATE_VISITA_PADRAO;


        const tags =
            extrairTagsTemplate(
                template
            );


        const dadosSistema =
            dadosPreCarregados &&
            typeof dadosPreCarregados ===
                'object'
                ?
                dadosPreCarregados
                :
                obterDadosVisitaSistema();


        const valores =
            {};


        tags.forEach(
            tag => {
                valores[
                    tag
                ] =
                    dadosSistema[
                        tag
                    ] ??
                    '';
            }
        );


        if (
            tags.includes(
                'data'
            )
        ) {
            valores.data =
                obterDataHojeInput();
        }


        const overlay =
            document.createElement(
                'div'
            );


        overlay.id =
            'way-visita-modal-root';


        overlay.className =
            'way-special-overlay';


        const camposHTML =
            tags.length
                ?
                tags
                    .map(
                        tag =>
                            criarCampoVisitaHTML(
                                tag,
                                valores[
                                    tag
                                ]
                            )
                    )
                    .join('')
                :
                `
                    <div class="way-visita-empty">
                        O template não possui tags.
                    </div>
                `;


        overlay.innerHTML = `

            <div class="way-special-modal way-visita-modal">

                <div class="way-special-header">

                    <div>

                        <h3 class="way-special-title">
                            🛠 Visita Técnica
                        </h3>

                        <div class="way-special-subtitle">
                            Confira ou altere os dados antes de inserir a mensagem.
                        </div>

                    </div>

                    <button
                        type="button"
                        class="way-special-close"
                    >
                        ×
                    </button>

                </div>

                <div class="way-special-body">

                    <div class="way-visita-layout">

                        <div class="way-visita-fields">
                            ${camposHTML}
                        </div>

                        <div>

                            <div class="way-special-preview-label">
                                👁 Pré-visualização
                            </div>

                            <textarea
                                class="way-special-preview way-visita-preview"
                                data-way-visita-preview
                                readonly
                            ></textarea>

                            <div class="way-special-status"></div>

                        </div>

                    </div>

                </div>

                <div class="way-special-footer">

                    <button
                        type="button"
                        class="way-special-cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="way-special-insert"
                    >
                        💬 Inserir no chat
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const preview =
            overlay.querySelector(
                '[data-way-visita-preview]'
            );


        const status =
            overlay.querySelector(
                '.way-special-status'
            );


        const inputs =
            Array.from(
                overlay.querySelectorAll(
                    '[data-way-visita-input]'
                )
            );


        inputs.forEach(
            input => {
                const tag =
                    input.dataset
                        .wayVisitaInput;


                if (
                    tag ===
                    'periodo'
                ) {
                    input.value =
                        valores.periodo ||
                        '';
                }
            }
        );


        function coletarValores() {
            const resultado =
                {};


            inputs.forEach(
                input => {
                    resultado[
                        input.dataset
                            .wayVisitaInput
                    ] =
                        String(
                            input.value ??
                            ''
                        );
                }
            );


            return resultado;
        }


        function atualizarHorario() {
            const periodo =
                overlay.querySelector(
                    '[data-way-visita-input="periodo"]'
                );


            const horario =
                overlay.querySelector(
                    '[data-way-visita-input="horario"]'
                );


            if (
                !periodo ||
                !horario
            ) {
                return;
            }


            const dados =
                PERIODOS_ATENDIMENTO[
                    periodo.value
                ];


            horario.value =
                dados
                    ?
                    `${dados.inicio} às ${dados.fim}`
                    :
                    '';
        }


        function atualizarPreview() {
            preview.value =
                gerarMensagemVisita(
                    template,
                    coletarValores(),
                    true
                );
        }


        inputs.forEach(
            input => {
                input.addEventListener(
                    'input',
                    atualizarPreview
                );


                input.addEventListener(
                    'change',

                    function () {
                        if (
                            input.dataset
                                .wayVisitaInput ===
                            'periodo'
                        ) {
                            atualizarHorario();
                        }


                        atualizarPreview();
                    }
                );
            }
        );


        overlay
            .querySelector(
                '.way-special-close'
            )
            .onclick =
                fecharModalVisita;


        overlay
            .querySelector(
                '.way-special-cancel'
            )
            .onclick =
                fecharModalVisita;


        overlay
            .querySelector(
                '.way-special-insert'
            )
            .onclick =
                function () {
                    const atuais =
                        coletarValores();


                    const faltando =
                        tags.filter(
                            tag =>
                                !String(
                                    atuais[
                                        tag
                                    ] ??
                                    ''
                                )
                                    .trim()
                        );


                    if (
                        faltando.length
                    ) {
                        status.textContent =
                            '⚠️ Preencha: ' +
                            faltando
                                .map(
                                    criarNomeAmigavelTag
                                )
                                .join(
                                    ', '
                                );


                        return;
                    }


                    const texto =
                        gerarMensagemVisita(
                            template,
                            atuais,
                            false
                        );


                    definirTextoCampo(
                        campoChatVisita,
                        texto
                    );


                    fecharModalVisita();
                };


        atualizarHorario();

        atualizarPreview();
    }


    /* =========================================================
       MONITOR CHAT
       ========================================================= */

    function iniciarMonitorComandos() {
        document.addEventListener(
            'input',

            function (
                event
            ) {
                const campo =
                    event.target;


                if (
                    !ehPossivelCampoChat(
                        campo
                    )
                ) {
                    return;
                }


                atualizarAutocomplete(
                    campo
                );
            },

            true
        );


        document.addEventListener(
            'focusin',

            function (
                event
            ) {
                const campo =
                    event.target;


                if (
                    !ehPossivelCampoChat(
                        campo
                    )
                ) {
                    return;
                }


                atualizarAutocomplete(
                    campo
                );
            },

            true
        );


        document.addEventListener(
            'keydown',

            function (
                event
            ) {
                const campo =
                    event.target;


                if (
                    !ehPossivelCampoChat(
                        campo
                    )
                ) {
                    return;
                }


                const aberto =
                    Boolean(
                        autocompleteState.popup &&
                        autocompleteState.campo ===
                            campo &&
                        totalItensAutocomplete() >
                            0
                    );


                if (
                    !aberto
                ) {
                    return;
                }


                if (
                    event.key ===
                    'ArrowDown'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    moverAutocomplete(
                        1
                    );


                    return;
                }


                if (
                    event.key ===
                    'ArrowUp'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    moverAutocomplete(
                        -1
                    );


                    return;
                }


                if (
                    event.key ===
                        'ArrowRight' &&
                    autocompleteState.modo ===
                        'categorias'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    executarItemAutocompleteAtual();


                    return;
                }


                if (
                    event.key ===
                        'ArrowLeft' &&
                    autocompleteState.modo ===
                        'categoria'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    voltarCategoriasAutocomplete();


                    return;
                }


                if (
                    event.key ===
                    'Escape'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    if (
                        autocompleteState.modo ===
                        'categoria'
                    ) {
                        voltarCategoriasAutocomplete();

                    } else {
                        fecharAutocomplete();
                    }


                    return;
                }


                if (
                    event.key ===
                        'Enter' ||
                    event.key ===
                        'Tab'
                ) {
                    event.preventDefault();

                    event.stopPropagation();


                    executarItemAutocompleteAtual();


                    return;
                }
            },

            true
        );


        document.addEventListener(
            'mousedown',

            function (
                event
            ) {
                const popup =
                    autocompleteState.popup;


                if (
                    !popup
                ) {
                    return;
                }


                if (
                    popup.contains(
                        event.target
                    )
                ) {
                    return;
                }


                if (
                    autocompleteState.campo &&
                    (
                        event.target ===
                            autocompleteState.campo ||
                        autocompleteState.campo
                            .contains?.(
                                event.target
                            )
                    )
                ) {
                    return;
                }


                fecharAutocomplete();
            },

            true
        );


        window.addEventListener(
            'resize',
            posicionarAutocomplete
        );


        window.addEventListener(
            'scroll',
            posicionarAutocomplete,
            true
        );
    }


    /* =========================================================
       ELEMENTOS DINÂMICOS
       ========================================================= */

    function configurarTudo() {
        /*
         * Menu Mensagens Personalizadas.
         */

        configurarItemMenu();


        configurarItemMenuAlertas();


        posicionarTelaConfiguracaoAlertas();


        /*
         * Botão copiar dados do cliente.
         */

        configurarBotaoCopiarDadosCliente();


        /*
         * Cards com alertas configuráveis
         * pela última atividade.
         */

        configurarAlertasInatividade();
    }


    /* =========================================================
       OBSERVER
       ========================================================= */

    function iniciarObserver() {
        let agendado =
            false;


        const observer =
            new MutationObserver(
                function () {
                    if (
                        agendado
                    ) {
                        return;
                    }


                    agendado =
                        true;


                    requestAnimationFrame(
                        function () {
                            agendado =
                                false;


                            configurarTudo();
                        }
                    );
                }
            );


        observer.observe(
            document.documentElement,
            {
                /*
                 * Novos cards / reconstrução Vue.
                 */

                childList:
                    true,


                /*
                 * Mudanças dentro dos cards.
                 */

                subtree:
                    true,


                /*
                 * Muito importante para o contador:
                 *
                 * 1m -> 2m -> 5m -> 10m
                 *
                 * Se o sistema apenas alterar o nó
                 * de texto, conseguimos detectar.
                 */

                characterData:
                    true
            }
        );
    }


    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    function registrarComandoTesteNotificacao() {
        globalThis.WayToolsRuntime
            .registerMenuCommand(
                'way-mensagens',
                'Testar notificação de mensagem',
                function () {
                    const instante =
                        Date.now();


                    enviarNotificacaoNovaMensagem(
                        {
                            chave:
                                'way-tools-notification-test',

                            assinatura:
                                `way-tools-notification-test-${instante}`,

                            nomeCliente:
                                'Teste Way Tools',

                            previa:
                                'As notificações do ChatWoot estão funcionando.',

                            url:
                                window.location.href
                        }
                    );
                }
            );
    }

    function iniciar() {
        aplicarTemaAplicativo();


        adicionarCSS();


        iniciarSincronizacaoTema();


        iniciarSincronizacaoPreferenciasNotificacoes();


        configurarTudo();


        iniciarObserver();


        iniciarMonitorComandos();


        registrarComandoTesteNotificacao();


        /*
         * Fallback periódico.
         *
         * Mesmo que o sistema altere o contador
         * de uma forma não capturada pelo observer,
         * a checagem é refeita.
         */

        setInterval(
            configurarTudo,
            CONFIG.intervaloVerificacao
        );


        console.log(
            '[Way Mensagens] v3.5 ativa.'
        );


        console.log(
            '[Way Mensagens] Botão de copiar dados ativo.'
        );


        console.log(
            '[Way Mensagens] Endereço identificado pelo campo svg.map.'
        );


        console.log(
            '[Way Mensagens] Alertas de inatividade configuráveis ativos: padrão 2 / 5 / 10 minutos.'
        );


        console.log(
            '[Way Mensagens] Notificações de novas mensagens ativas.'
        );


        console.log(
            '[Way Mensagens] Tela de alertas usa somente a área de exibição e mantém a barra lateral nativa aberta.'
        );
    }


    if (
        document.documentElement
    ) {
        iniciar();

    } else {
        document.addEventListener(
            'DOMContentLoaded',
            iniciar
        );
    }

})();
});
