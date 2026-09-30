/*
 * Way Tools - ERP Copiar Dados v1.6
 * Adaptado do userscript fornecido para o runtime nativo da extensão.
 */

globalThis.WayToolsRuntime.run("way-erp-copiar-dados", () => {
    "use strict";
// ==UserScript==
// @name         Way ERP - Copiar Dados
// @namespace    way-erp-copiar-dados
// @version      1.6
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

    const ROTULOS_BARRA_SUPERIOR =
        new Set([
            'protocolo',
            'cliente',
            'contrato'
        ]);

    let diagnosticoBarraRegistrado =
        false;

    let modalAbertoAnterior =
        false;


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
               CAMADA ESTÁVEL DA BARRA SUPERIOR
               ================================================= */

            #way-erp-copy-layer {

                position:
                    fixed !important;

                inset:
                    0 !important;

                z-index:
                    1200 !important;

                pointer-events:
                    none !important;
            }


            #way-erp-copy-layer[hidden] {

                display:
                    none !important;
            }


            #way-erp-copy-layer
            > .way-erp-copy-floating {

                position:
                    fixed !important;

                margin:
                    0 !important;

                pointer-events:
                    auto !important;
            }


            #way-erp-copy-layer
            > .way-erp-copy-floating[hidden] {

                display:
                    none !important;
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


    function existeModalVisivel() {

        const seletores = [
            '[role="dialog"]',
            '[aria-modal="true"]',
            '.MuiDialog-root',
            '.MuiModal-root:not(.MuiPopover-root)',
            '.modal.show'
        ];


        return Array
            .from(
                document.querySelectorAll(
                    seletores.join(', ')
                )
            )
            .some(
                modal => {

                    if (
                        elementoEstaOculto(
                            modal
                        )
                    ) {

                        return false;
                    }


                    const retangulo =
                        modal.getBoundingClientRect();


                    return (
                        retangulo.width >
                            0 &&
                        retangulo.height >
                            0
                    );
                }
            );
    }


    function atualizarVisibilidadeCamadaBarra() {

        const camada =
            document.getElementById(
                'way-erp-copy-layer'
            );


        if (
            !camada
        ) {

            return;
        }


        const modalAberto =
            existeModalVisivel();


        camada.hidden =
            modalAberto;


        document.documentElement.dataset
            .wayErpCopyModal =
                modalAberto
                    ?
                    'aberto'
                    :
                    'fechado';


        if (
            modalAberto ===
                modalAbertoAnterior
        ) {

            return;
        }


        modalAbertoAnterior =
            modalAberto;


        console.info(
            modalAberto
                ?
                '[Way ERP] Botões da barra ocultos enquanto o modal está aberto.'
                :
                '[Way ERP] Botões da barra restaurados após o fechamento do modal.'
        );
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

    function normalizarTextoBarra(
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


    function obterCamadaBotoesBarra() {

        if (
            !document.body
        ) {

            return null;
        }


        let camada =
            document.getElementById(
                'way-erp-copy-layer'
            );


        if (
            camada
        ) {

            return camada;
        }


        camada =
            document.createElement(
                'div'
            );


        camada.id =
            'way-erp-copy-layer';


        camada.setAttribute(
            'aria-label',
            'Ferramentas de cópia do Way ERP'
        );


        document.body.appendChild(
            camada
        );


        return camada;
    }


    function obterCandidatosValor(
        container,
        rotulo
    ) {

        const candidatos =
            [];


        const adicionar =
            elemento => {

                if (
                    !elemento ||
                    elemento ===
                        rotulo ||
                    elemento.contains(
                        rotulo
                    ) ||
                    elemento.closest(
                        '#way-erp-copy-layer'
                    ) ||
                    elemento.matches(
                        'button, hr, svg, path'
                    )
                ) {

                    return;
                }


                if (
                    !candidatos.includes(
                        elemento
                    )
                ) {

                    candidatos.push(
                        elemento
                    );
                }
            };


        container
            .querySelectorAll(
                'a, [role="link"]'
            )
            .forEach(
                adicionar
            );


        Array
            .from(
                container.children
            )
            .forEach(
                filho => {

                    adicionar(
                        filho
                    );


                    filho
                        .querySelectorAll(
                            'a, [role="link"], span, p'
                        )
                        .forEach(
                            adicionar
                        );
                }
            );


        return candidatos;
    }


    function localizarCampoBarraSuperior(
        rotuloEsperado,
        extrairValor
    ) {

        const esperado =
            normalizarTextoBarra(
                rotuloEsperado
            )
                .toLowerCase();


        const rotulos =
            document.querySelectorAll(
                'span, p, label'
            );


        for (
            const rotulo
            of rotulos
        ) {

            if (
                elementoEstaOculto(
                    rotulo
                )
            ) {

                continue;
            }


            const textoRotulo =
                normalizarTextoBarra(
                    rotulo.textContent
                )
                    .toLowerCase();


            if (
                textoRotulo !==
                    esperado
            ) {

                continue;
            }


            const container =
                rotulo.closest(
                    '.MuiBox-root'
                )
                ||
                rotulo.parentElement;


            if (
                !container
            ) {

                continue;
            }


            const candidatos =
                obterCandidatosValor(
                    container,
                    rotulo
                );


            for (
                const elementoValor
                of candidatos
            ) {

                if (
                    elementoEstaOculto(
                        elementoValor
                    )
                ) {

                    continue;
                }


                const texto =
                    normalizarTextoBarra(
                        elementoValor.textContent
                    );


                if (
                    !texto ||
                    ROTULOS_BARRA_SUPERIOR.has(
                        texto.toLowerCase()
                    )
                ) {

                    continue;
                }


                const valor =
                    extrairValor(
                        texto
                    );


                if (
                    valor
                ) {

                    return {
                        container,
                        elementoValor,
                        rotulo,
                        valor
                    };
                }
            }
        }


        return null;
    }


    function posicionarBotaoBarra(
        botao,
        elementoValor
    ) {

        const retangulo =
            elementoValor
                .getBoundingClientRect();


        const visivel =
            retangulo.width >
                0 &&
            retangulo.height >
                0 &&
            retangulo.bottom >
                0 &&
            retangulo.right >
                0 &&
            retangulo.top <
                window.innerHeight &&
            retangulo.left <
                window.innerWidth;


        botao.hidden =
            !visivel;


        if (
            !visivel
        ) {

            return;
        }


        const tamanho =
            24;


        const esquerda =
            Math.min(
                Math.max(
                    4,
                    retangulo.right +
                        4
                ),
                window.innerWidth -
                    tamanho -
                    4
            );


        const topo =
            Math.min(
                Math.max(
                    4,
                    retangulo.top +
                        (
                            retangulo.height -
                            tamanho
                        ) /
                        2
                ),
                window.innerHeight -
                    tamanho -
                    4
            );


        botao.style.left =
            `${Math.round(
                esquerda
            )}px`;


        botao.style.top =
            `${Math.round(
                topo
            )}px`;
    }


    function configurarCampoBarraSuperior({
        rotuloEsperado,
        classeBotao,
        tituloBotao,
        extrairValor,
        montarTexto
    }) {

        const camada =
            obterCamadaBotoesBarra();


        if (
            !camada
        ) {

            return false;
        }


        const campo =
            localizarCampoBarraSuperior(
                rotuloEsperado,
                extrairValor
            );


        let botao =
            camada.querySelector(
                `:scope > .${classeBotao}`
            );


        if (
            !campo
        ) {

            if (
                botao
            ) {

                botao.remove();
            }


            return false;
        }


        campo.container.classList.add(
            'way-erp-top-dado'
        );


        if (
            !botao
        ) {

            botao =
                criarBotaoMini(
                    tituloBotao
                );


            botao.classList.add(
                classeBotao,
                'way-erp-copy-floating'
            );


            botao.addEventListener(
                'click',

                async function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();


                    const campoAtual =
                        localizarCampoBarraSuperior(
                            rotuloEsperado,
                            extrairValor
                        );


                    const atual =
                        campoAtual
                            ?.valor
                        ||
                        botao
                            .dataset
                            .wayValor
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


            camada.appendChild(
                botao
            );
        }


        botao.dataset.wayValor =
            campo.valor;


        posicionarBotaoBarra(
            botao,
            campo.elementoValor
        );


        return true;
    }
    /* =========================================================
       PROTOCOLO - BARRA SUPERIOR
       ========================================================= */

    function configurarProtocolosBarraSuperior() {

        return configurarCampoBarraSuperior({

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

        return configurarCampoBarraSuperior({

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

        return configurarCampoBarraSuperior({

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

    function executarConfiguracao(
        nome,
        callback
    ) {

        try {

            return callback();

        } catch (erro) {

            console.error(
                `[Way ERP] Falha ao configurar ${nome}:`,
                erro
            );


            return false;
        }
    }


    function configurarTudo() {

        /*
         * Protocolo no modal.
         */

        executarConfiguracao(
            'protocolo do modal',
            configurarProtocolosModal
        );


        /*
         * Protocolo da barra superior.
         */

        const camposBarra = [
            executarConfiguracao(
                'protocolo da barra superior',
                configurarProtocolosBarraSuperior
            ),


        /*
         * Nome do cliente.
         *
         * Resultado copiado:
         *
         * 👤 *Nome:* Roberto Rodrigues de Andrade
         */

            executarConfiguracao(
                'cliente da barra superior',
                configurarClienteBarraSuperior
            ),


        /*
         * Número do contrato.
         *
         * Resultado copiado:
         *
         * 📄 *Contrato:* 0163835
         */

            executarConfiguracao(
                'contrato da barra superior',
                configurarContratoBarraSuperior
            )
        ]
            .filter(
                Boolean
            )
            .length;


        document.documentElement.dataset
            .wayErpCopyBarra =
                String(
                    camposBarra
                );


        if (
            camposBarra >
                0 &&
            !diagnosticoBarraRegistrado
        ) {

            diagnosticoBarraRegistrado =
                true;


            console.info(
                `[Way ERP] Barra superior: ${camposBarra}/3 campo(s) com botão de cópia.`
            );
        }


        /*
         * Número da conexão.
         */

        executarConfiguracao(
            'número da conexão',
            configurarBotaoConexao
        );


        /*
         * IP:
         *
         * 📋 copiar
         * 🌐 abrir
         */

        executarConfiguracao(
            'IP do cliente',
            configurarBotaoIP
        );


        executarConfiguracao(
            'visibilidade durante modais',
            atualizarVisibilidadeCamadaBarra
        );
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


        window.addEventListener(
            'resize',
            agendar,
            {
                passive:
                    true
            }
        );


        window.addEventListener(
            'scroll',
            agendar,
            {
                capture:
                    true,

                passive:
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
            '[Way ERP] Copiar Dados v1.6 ativo.'
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
