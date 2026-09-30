/*
 * Way Tools - ERP Copiar Dados v1.4
 * Adaptado do userscript fornecido para o runtime nativo da extensão.
 */

globalThis.WayToolsRuntime.run("way-erp-copiar-dados", () => {
    "use strict";
// ==UserScript==
// @name         Way ERP - Copiar Dados
// @namespace    way-erp-copiar-dados
// @version      1.4
// @description  Copia protocolo, cliente, contrato, conexão e IP e permite abrir o IP em nova aba no ERP Way
// @match        https://erp.internetway.com.br/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        mensagemProtocolo:
            '🎫 *Este atendimento gerou o protocolo:*',

        mensagemCliente:
            '👤 *Nome:*',

        mensagemContrato:
            '📄 *Contrato:*'
    };


    /* =========================================================
       CSS
       ========================================================= */

    function adicionarCSS() {

        if (
            document.getElementById(
                'way-erp-copy-tools-css'
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'way-erp-copy-tools-css';


        style.textContent = `

            /* =================================================
               PROTOCOLO DO MODAL
               ================================================= */

            .way-erp-protocolo-container {

                display:
                    flex !important;

                align-items:
                    center !important;

                flex-wrap:
                    wrap !important;

                gap:
                    8px !important;
            }


            .way-erp-protocolo-container
            > .way-erp-protocolo-titulo {

                margin:
                    0 !important;

                flex:
                    0 1 auto !important;
            }


            .way-erp-protocolo-container
            > hr {

                flex-basis:
                    100% !important;

                width:
                    100% !important;
            }


            /* =================================================
               BOTÃO GRANDE DO PROTOCOLO
               ================================================= */

            .way-erp-copy-protocolo {

                display:
                    inline-flex !important;

                align-items:
                    center !important;

                justify-content:
                    center !important;

                gap:
                    5px !important;

                min-height:
                    28px !important;

                padding:
                    4px 9px !important;

                margin:
                    0 !important;

                border:
                    1px solid
                    rgba(
                        25,
                        118,
                        210,
                        .55
                    ) !important;

                border-radius:
                    5px !important;

                background:
                    rgba(
                        25,
                        118,
                        210,
                        .07
                    ) !important;

                color:
                    #1976d2 !important;

                font-family:
                    inherit !important;

                font-size:
                    12px !important;

                font-weight:
                    600 !important;

                line-height:
                    18px !important;

                white-space:
                    nowrap !important;

                cursor:
                    pointer !important;

                outline:
                    none !important;

                box-shadow:
                    none !important;
            }


            .way-erp-copy-protocolo:hover {

                background:
                    rgba(
                        25,
                        118,
                        210,
                        .14
                    ) !important;

                border-color:
                    #1976d2 !important;
            }


            /* =================================================
               BOTÕES COMPACTOS
               ================================================= */

            .way-erp-copy-mini {

                display:
                    inline-flex !important;

                align-items:
                    center !important;

                justify-content:
                    center !important;

                width:
                    24px !important;

                min-width:
                    24px !important;

                height:
                    24px !important;

                min-height:
                    24px !important;

                padding:
                    0 !important;

                margin:
                    0 0 0 5px !important;

                border:
                    1px solid
                    rgba(
                        25,
                        118,
                        210,
                        .40
                    ) !important;

                border-radius:
                    4px !important;

                background:
                    rgba(
                        25,
                        118,
                        210,
                        .06
                    ) !important;

                color:
                    #1976d2 !important;

                font-family:
                    inherit !important;

                font-size:
                    13px !important;

                line-height:
                    1 !important;

                vertical-align:
                    middle !important;

                cursor:
                    pointer !important;

                outline:
                    none !important;

                box-shadow:
                    none !important;

                text-decoration:
                    none !important;

                transition:
                    background .15s ease,
                    border-color .15s ease,
                    transform .05s ease !important;
            }


            .way-erp-copy-mini:hover {

                background:
                    rgba(
                        25,
                        118,
                        210,
                        .15
                    ) !important;

                border-color:
                    #1976d2 !important;
            }


            .way-erp-copy-mini:active,
            .way-erp-copy-protocolo:active {

                transform:
                    scale(.95) !important;
            }


            /* =================================================
               BOTÃO ABRIR IP
               ================================================= */

            .way-erp-open-ip {

                color:
                    #1565c0 !important;

                border-color:
                    rgba(
                        21,
                        101,
                        192,
                        .45
                    ) !important;

                background:
                    rgba(
                        21,
                        101,
                        192,
                        .07
                    ) !important;
            }


            .way-erp-open-ip:hover {

                background:
                    rgba(
                        21,
                        101,
                        192,
                        .16
                    ) !important;

                border-color:
                    #1565c0 !important;
            }


            /* =================================================
               DADOS DA BARRA SUPERIOR
               ================================================= */

            .way-erp-top-protocolo,
            .way-erp-top-dado {

                display:
                    inline-flex !important;

                align-items:
                    center !important;

                gap:
                    4px !important;
            }


            .way-erp-top-dado {

                flex-wrap:
                    nowrap !important;
            }


            /* =================================================
               CONEXÃO
               ================================================= */

            #userSelected.way-erp-conexao {

                display:
                    flex !important;

                align-items:
                    center !important;

                flex-wrap:
                    wrap !important;

                gap:
                    3px !important;
            }


            /* =================================================
               ÁREA DO IP
               ================================================= */

            .way-erp-ip-container {

                display:
                    inline-flex !important;

                align-items:
                    center !important;

                flex-wrap:
                    wrap !important;

                gap:
                    1px !important;
            }


            /* =================================================
               FEEDBACK
               ================================================= */

            .way-erp-copiado {

                color:
                    #2e7d32 !important;

                border-color:
                    rgba(
                        46,
                        125,
                        50,
                        .55
                    ) !important;

                background:
                    rgba(
                        46,
                        125,
                        50,
                        .08
                    ) !important;
            }

        `;


        document.documentElement.appendChild(
            style
        );
    }


    /* =========================================================
       COPIAR TEXTO
       ========================================================= */

    async function copiarTexto(
        texto
    ) {

        texto =
            String(
                texto ?? ''
            );


        try {

            await navigator
                .clipboard
                .writeText(
                    texto
                );


            return true;

        } catch (erro) {

            /*
             * Usa fallback abaixo.
             */
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
                '[Way ERP] Erro ao copiar:',
                erro
            );


            return false;
        }
    }


    /* =========================================================
       ELEMENTO OCULTO
       ========================================================= */

    function elementoEstaOculto(
        elemento
    ) {

        if (
            !elemento
        ) {

            return true;
        }


        if (
            elemento.closest(
                '[hidden]'
            )
        ) {

            return true;
        }


        try {

            const style =
                getComputedStyle(
                    elemento
                );


            if (
                style.display ===
                    'none' ||
                style.visibility ===
                    'hidden'
            ) {

                return true;
            }

        } catch (erro) {

            /*
             * Mantém processamento.
             */
        }


        return false;
    }


    /* =========================================================
       FEEDBACK
       ========================================================= */

    function mostrarFeedback(
        botao,
        compacto = true
    ) {

        if (
            !botao
        ) {

            return;
        }


        const original =
            botao.innerHTML;


        botao.classList.add(
            'way-erp-copiado'
        );


        botao.innerHTML =
            compacto
                ?
                '✓'
                :
                '✓ Copiado';


        setTimeout(
            function () {

                botao.classList.remove(
                    'way-erp-copiado'
                );


                botao.innerHTML =
                    original;

            },
            1200
        );
    }


    /* =========================================================
       CRIA BOTÃO COMPACTO
       ========================================================= */

    function criarBotaoMini(
        titulo
    ) {

        const botao =
            document.createElement(
                'button'
            );


        botao.type =
            'button';


        botao.className =
            'way-erp-copy-mini';


        botao.innerHTML =
            '📋';


        botao.title =
            titulo;


        botao.setAttribute(
            'aria-label',
            titulo
        );


        return botao;
    }


    /* =========================================================
       VALIDADORES
       ========================================================= */

    function validarNumero(
        valor
    ) {

        const texto =
            String(
                valor ?? ''
            )
                .trim();


        return /^\d+$/.test(
            texto
        )
            ?
            texto
            :
            '';
    }


    function validarProtocolo(
        valor
    ) {

        return validarNumero(
            valor
        );
    }


    function validarContrato(
        valor
    ) {

        /*
         * O contrato é mantido como STRING.
         *
         * Isso é importante para preservar
         * zeros à esquerda.
         *
         * Exemplo:
         *
         * 0163835
         */

        return validarNumero(
            valor
        );
    }


    function normalizarNomeCliente(
        valor
    ) {

        return String(
            valor ?? ''
        )
            .replace(
                /\s+/g,
                ' '
            )
            .trim();
    }


    /* =========================================================
       PROTOCOLO
       ========================================================= */

    function extrairProtocoloTitulo(
        texto
    ) {

        if (
            !texto
        ) {

            return '';
        }


        const resultado =
            String(
                texto
            )
                .match(
                    /^\s*Protocolo\s+(\d+)\b/i
                );


        return resultado
            ?
            resultado[1]
            :
            '';
    }


    function montarTextoProtocolo(
        protocolo
    ) {

        protocolo =
            validarProtocolo(
                protocolo
            );


        if (
            !protocolo
        ) {

            return '';
        }


        return (
            `${CONFIG.mensagemProtocolo} ${protocolo}`
        );
    }


    function montarTextoCliente(
        nome
    ) {

        nome =
            normalizarNomeCliente(
                nome
            );


        if (
            !nome
        ) {

            return '';
        }


        return (
            `${CONFIG.mensagemCliente} ${nome}`
        );
    }


    function montarTextoContrato(
        contrato
    ) {

        contrato =
            validarContrato(
                contrato
            );


        if (
            !contrato
        ) {

            return '';
        }


        return (
            `${CONFIG.mensagemContrato} ${contrato}`
        );
    }


    async function copiarProtocolo(
        protocolo,
        botao,
        compacto = true
    ) {

        const texto =
            montarTextoProtocolo(
                protocolo
            );


        if (
            !texto
        ) {

            return;
        }


        const sucesso =
            await copiarTexto(
                texto
            );


        if (
            sucesso
        ) {

            mostrarFeedback(
                botao,
                compacto
            );
        }
    }


    /* =========================================================
       PROTOCOLO - MODAL
       ========================================================= */

    function configurarProtocolosModal() {

        const elementos =
            document.querySelectorAll(
                'p.MuiTypography-body1.MuiTypography-colorPrimary'
            );


        elementos.forEach(
            titulo => {

                if (
                    elementoEstaOculto(
                        titulo
                    )
                ) {

                    return;
                }


                const protocolo =
                    extrairProtocoloTitulo(
                        titulo.textContent
                    );


                if (
                    !protocolo
                ) {

                    return;
                }


                const container =
                    titulo.parentElement;


                if (
                    !container
                ) {

                    return;
                }


                let botao =
                    container.querySelector(
                        ':scope > .way-erp-copy-protocolo'
                    );


                if (
                    botao
                ) {

                    botao.dataset.protocolo =
                        protocolo;


                    return;
                }


                container.classList.add(
                    'way-erp-protocolo-container'
                );


                titulo.classList.add(
                    'way-erp-protocolo-titulo'
                );


                botao =
                    document.createElement(
                        'button'
                    );


                botao.type =
                    'button';


                botao.className =
                    'way-erp-copy-protocolo';


                botao.dataset.protocolo =
                    protocolo;


                botao.innerHTML =
                    '📋 Copiar protocolo';


                botao.title =
                    'Copiar protocolo do atendimento';


                botao.addEventListener(
                    'click',

                    async function (
                        event
                    ) {

                        event.preventDefault();

                        event.stopPropagation();


                        const atual =
                            extrairProtocoloTitulo(
                                titulo.textContent
                            )
                            ||
                            botao.dataset.protocolo;


                        await copiarProtocolo(
                            atual,
                            botao,
                            false
                        );
                    }
                );


                const proximo =
                    titulo.nextElementSibling;


                if (
                    proximo
                ) {

                    container.insertBefore(
                        botao,
                        proximo
                    );

                } else {

                    container.appendChild(
                        botao
                    );
                }
            }
        );
    }


    /* =========================================================
       CAMPOS DA BARRA SUPERIOR
       ========================================================= */

    function configurarCampoBarraSuperior({
        rotuloEsperado,
        classeBotao,
        classeContainer =
            'way-erp-top-dado',
        tituloBotao,
        extrairValor,
        montarTexto
    }) {

        /*
         * Não utiliza classes como:
         *
         * jss109
         * jss110
         *
         * pois elas podem mudar.
         *
         * O campo é identificado pelo texto
         * do rótulo:
         *
         * Protocolo
         * Cliente
         * Contrato
         */

        const rotulos =
            document.querySelectorAll(
                'span.MuiTypography-root.MuiTypography-body1'
            );


        rotulos.forEach(
            rotulo => {

                if (
                    elementoEstaOculto(
                        rotulo
                    )
                ) {

                    return;
                }


                const textoRotulo =
                    String(
                        rotulo.textContent ||
                        ''
                    )
                        .replace(
                            /\s+/g,
                            ' '
                        )
                        .trim()
                        .toLowerCase();


                if (
                    textoRotulo !==
                    rotuloEsperado
                        .toLowerCase()
                ) {

                    return;
                }


                const container =
                    rotulo.parentElement;


                if (
                    !container
                ) {

                    return;
                }


                /*
                 * O valor é o link <a>
                 * pertencente ao mesmo bloco
                 * do rótulo.
                 */

                const link =
                    Array
                        .from(
                            container.children
                        )
                        .find(
                            elemento => {

                                if (
                                    elemento.tagName !==
                                    'A'
                                ) {

                                    return false;
                                }


                                return Boolean(
                                    extrairValor(
                                        elemento.textContent
                                    )
                                );
                            }
                        );


                if (
                    !link
                ) {

                    return;
                }


                const valor =
                    extrairValor(
                        link.textContent
                    );


                if (
                    !valor
                ) {

                    return;
                }


                container.classList.add(
                    classeContainer
                );


                let botao =
                    container.querySelector(
                        `:scope > .${classeBotao}`
                    );


                if (
                    botao
                ) {

                    botao.dataset.wayValor =
                        valor;


                    return;
                }


                botao =
                    criarBotaoMini(
                        tituloBotao
                    );


                botao.classList.add(
                    classeBotao
                );


                botao.dataset.wayValor =
                    valor;


                botao.addEventListener(
                    'click',

                    async function (
                        event
                    ) {

                        event.preventDefault();

                        event.stopPropagation();


                        /*
                         * Lê novamente o valor
                         * quando o usuário clicar.
                         *
                         * Assim, se o atendimento
                         * mudar, não utiliza o dado
                         * anterior.
                         */

                        const atual =
                            extrairValor(
                                link.textContent
                            )
                            ||
                            botao.dataset.wayValor
                            ||
                            '';


                        const texto =
                            montarTexto(
                                atual
                            );


                        if (
                            !texto
                        ) {

                            return;
                        }


                        const sucesso =
                            await copiarTexto(
                                texto
                            );


                        if (
                            sucesso
                        ) {

                            mostrarFeedback(
                                botao,
                                true
                            );
                        }
                    }
                );


                link.insertAdjacentElement(
                    'afterend',
                    botao
                );
            }
        );
    }


    /* =========================================================
       PROTOCOLO - BARRA SUPERIOR
       ========================================================= */

    function configurarProtocolosBarraSuperior() {

        configurarCampoBarraSuperior({

            rotuloEsperado:
                'Protocolo',

            classeBotao:
                'way-erp-copy-protocolo-top',

            classeContainer:
                'way-erp-top-protocolo',

            tituloBotao:
                'Copiar protocolo',

            extrairValor:
                validarProtocolo,

            montarTexto:
                montarTextoProtocolo
        });
    }


    /* =========================================================
       CLIENTE - BARRA SUPERIOR
       ========================================================= */

    function configurarClienteBarraSuperior() {

        configurarCampoBarraSuperior({

            rotuloEsperado:
                'Cliente',

            classeBotao:
                'way-erp-copy-cliente',

            tituloBotao:
                'Copiar nome do cliente',

            extrairValor:
                normalizarNomeCliente,

            montarTexto:
                montarTextoCliente
        });
    }


    /* =========================================================
       CONTRATO - BARRA SUPERIOR
       ========================================================= */

    function configurarContratoBarraSuperior() {

        configurarCampoBarraSuperior({

            rotuloEsperado:
                'Contrato',

            classeBotao:
                'way-erp-copy-contrato',

            tituloBotao:
                'Copiar número do contrato',

            extrairValor:
                validarContrato,

            montarTexto:
                montarTextoContrato
        });
    }


    /* =========================================================
       CONEXÃO
       ========================================================= */

    function configurarBotaoConexao() {

        const campos =
            document.querySelectorAll(
                'p#userSelected'
            );


        campos.forEach(
            container => {

                if (
                    elementoEstaOculto(
                        container
                    )
                ) {

                    return;
                }


                const authSpan =
                    container.querySelector(
                        '#authSpan'
                    );


                if (
                    !authSpan
                ) {

                    return;
                }


                const conexao =
                    String(
                        authSpan.textContent ||
                        ''
                    )
                        .trim();


                if (
                    !/^\d+$/.test(
                        conexao
                    )
                ) {

                    return;
                }


                container.classList.add(
                    'way-erp-conexao'
                );


                let botao =
                    container.querySelector(
                        ':scope > .way-erp-copy-conexao'
                    );


                if (
                    botao
                ) {

                    botao.dataset.conexao =
                        conexao;


                    return;
                }


                botao =
                    criarBotaoMini(
                        'Copiar número da conexão'
                    );


                botao.classList.add(
                    'way-erp-copy-conexao'
                );


                botao.dataset.conexao =
                    conexao;


                botao.addEventListener(
                    'click',

                    async function (
                        event
                    ) {

                        event.preventDefault();

                        event.stopPropagation();


                        const conexaoAtual =
                            String(
                                authSpan.textContent ||
                                ''
                            )
                                .trim();


                        if (
                            !/^\d+$/.test(
                                conexaoAtual
                            )
                        ) {

                            return;
                        }


                        const sucesso =
                            await copiarTexto(
                                conexaoAtual
                            );


                        if (
                            sucesso
                        ) {

                            mostrarFeedback(
                                botao,
                                true
                            );
                        }
                    }
                );


                authSpan.insertAdjacentElement(
                    'afterend',
                    botao
                );
            }
        );
    }


    /* =========================================================
       VALIDA IPV4
       ========================================================= */

    function validarIPv4(
        valor
    ) {

        if (
            !valor
        ) {

            return '';
        }


        const partes =
            String(
                valor
            )
                .trim()
                .split(
                    '.'
                );


        if (
            partes.length !==
            4
        ) {

            return '';
        }


        const valido =
            partes.every(
                parte => {

                    if (
                        !/^\d{1,3}$/.test(
                            parte
                        )
                    ) {

                        return false;
                    }


                    const numero =
                        Number(
                            parte
                        );


                    return (
                        numero >= 0 &&
                        numero <= 255
                    );
                }
            );


        return valido
            ?
            partes.join('.')
            :
            '';
    }


    /* =========================================================
       EXTRAI IPV4
       ========================================================= */

    function extrairIPv4(
        texto
    ) {

        if (
            !texto
        ) {

            return '';
        }


        const encontrados =
            String(
                texto
            )
                .match(
                    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
                );


        if (
            !encontrados
        ) {

            return '';
        }


        for (
            const candidato
            of encontrados
        ) {

            const ip =
                validarIPv4(
                    candidato
                );


            if (
                ip
            ) {

                return ip;
            }
        }


        return '';
    }


    /* =========================================================
       ABRIR IP EM NOVA ABA
       ========================================================= */

    function abrirIPEmNovaAba(
        ip
    ) {

        ip =
            validarIPv4(
                ip
            );


        if (
            !ip
        ) {

            console.warn(
                '[Way ERP] IP inválido para abertura.'
            );


            return;
        }


        const url =
            `http://${ip}`;


        const novaAba =
            window.open(
                url,
                '_blank'
            );


        if (
            novaAba
        ) {

            try {

                novaAba.opener =
                    null;

            } catch (erro) {

                /*
                 * Ignora caso o navegador
                 * não permita alterar opener.
                 */
            }
        }
    }


    /* =========================================================
       IP / CPE
       ========================================================= */

    function configurarBotaoIP() {

        const itens =
            document.querySelectorAll(
                'ul.font-indicators li.border-bottom'
            );


        itens.forEach(
            item => {

                if (
                    elementoEstaOculto(
                        item
                    )
                ) {

                    return;
                }


                const titulo =
                    item.querySelector(
                        'p.title'
                    );


                if (
                    !titulo
                ) {

                    return;
                }


                const textoTitulo =
                    String(
                        titulo.textContent ||
                        ''
                    )
                        .replace(
                            /\s+/g,
                            ' '
                        )
                        .trim()
                        .toLowerCase();


                if (
                    !textoTitulo.includes(
                        'informações do cliente'
                    ) &&
                    !textoTitulo.includes(
                        'informacoes do cliente'
                    )
                ) {

                    return;
                }


                const spans =
                    Array.from(
                        item.querySelectorAll(
                            ':scope > span'
                        )
                    );


                const spanIP =
                    spans.find(
                        span =>
                            extrairIPv4(
                                span.textContent
                            )
                    );


                if (
                    !spanIP
                ) {

                    return;
                }


                const ip =
                    extrairIPv4(
                        spanIP.textContent
                    );


                if (
                    !ip
                ) {

                    return;
                }


                spanIP.classList.add(
                    'way-erp-ip-container'
                );


                /* =================================================
                   BOTÃO COPIAR IP
                   ================================================= */

                let botaoCopiar =
                    spanIP.querySelector(
                        ':scope > .way-erp-copy-ip'
                    );


                if (
                    botaoCopiar
                ) {

                    botaoCopiar.dataset.ip =
                        ip;

                } else {

                    botaoCopiar =
                        criarBotaoMini(
                            'Copiar IP'
                        );


                    botaoCopiar.classList.add(
                        'way-erp-copy-ip'
                    );


                    botaoCopiar.dataset.ip =
                        ip;


                    botaoCopiar.addEventListener(
                        'click',

                        async function (
                            event
                        ) {

                            event.preventDefault();

                            event.stopPropagation();


                            const ipAtual =
                                extrairIPv4(
                                    spanIP.textContent
                                )
                                ||
                                botaoCopiar.dataset.ip;


                            if (
                                !ipAtual
                            ) {

                                return;
                            }


                            const sucesso =
                                await copiarTexto(
                                    ipAtual
                                );


                            if (
                                sucesso
                            ) {

                                mostrarFeedback(
                                    botaoCopiar,
                                    true
                                );
                            }
                        }
                    );


                    spanIP.appendChild(
                        botaoCopiar
                    );
                }


                /* =================================================
                   BOTÃO ABRIR IP
                   ================================================= */

                let botaoAbrir =
                    spanIP.querySelector(
                        ':scope > .way-erp-open-ip'
                    );


                if (
                    botaoAbrir
                ) {

                    botaoAbrir.dataset.ip =
                        ip;

                } else {

                    botaoAbrir =
                        criarBotaoMini(
                            'Abrir IP em nova aba'
                        );


                    botaoAbrir.classList.add(
                        'way-erp-open-ip'
                    );


                    botaoAbrir.innerHTML =
                        '🌐';


                    botaoAbrir.dataset.ip =
                        ip;


                    botaoAbrir.addEventListener(
                        'click',

                        function (
                            event
                        ) {

                            event.preventDefault();

                            event.stopPropagation();


                            const ipAtual =
                                extrairIPv4(
                                    spanIP.textContent
                                )
                                ||
                                botaoAbrir.dataset.ip;


                            if (
                                !ipAtual
                            ) {

                                return;
                            }


                            abrirIPEmNovaAba(
                                ipAtual
                            );
                        }
                    );


                    spanIP.appendChild(
                        botaoAbrir
                    );
                }
            }
        );
    }


    /* =========================================================
       CONFIGURA TUDO
       ========================================================= */

    function configurarTudo() {

        /*
         * Protocolo no modal.
         */

        configurarProtocolosModal();


        /*
         * Protocolo da barra superior.
         */

        configurarProtocolosBarraSuperior();


        /*
         * Nome do cliente.
         *
         * Resultado copiado:
         *
         * 👤 *Nome:* Roberto Rodrigues de Andrade
         */

        configurarClienteBarraSuperior();


        /*
         * Número do contrato.
         *
         * Resultado copiado:
         *
         * 📄 *Contrato:* 0163835
         */

        configurarContratoBarraSuperior();


        /*
         * Número da conexão.
         */

        configurarBotaoConexao();


        /*
         * IP:
         *
         * 📋 copiar
         * 🌐 abrir
         */

        configurarBotaoIP();
    }


    /* =========================================================
       MUTATION OBSERVER
       ========================================================= */

    function iniciarObserver() {

        let agendado =
            false;


        function agendar() {

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


        const observer =
            new MutationObserver(
                agendar
            );


        observer.observe(
            document.documentElement,
            {
                childList:
                    true,

                subtree:
                    true,

                characterData:
                    true
            }
        );
    }


    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    function iniciar() {

        adicionarCSS();


        configurarTudo();


        iniciarObserver();


        /*
         * Backup para conteúdos carregados
         * dinamicamente pelo ERP.
         */

        setInterval(
            configurarTudo,
            2000
        );


        console.log(
            '[Way ERP] Copiar Dados v1.4 ativo.'
        );


        console.log(
            '[Way ERP] Protocolo, cliente, contrato, conexão e IP disponíveis para cópia.'
        );


        console.log(
            '[Way ERP] IP também pode ser aberto em uma nova aba.'
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