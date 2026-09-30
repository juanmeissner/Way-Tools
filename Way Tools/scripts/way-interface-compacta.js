/*
 * Way Tools - Interface Compacta v3.4 + Temas v1.2
 * Componentes incorporados no mesmo módulo e controlados por uma única chave.
 */

globalThis.WayToolsRuntime.run("way-interface-compacta", (storage) => {
    "use strict";

    const GM_getValue = storage.getValue;
    const GM_setValue = storage.setValue;
    const GM_registerMenuCommand = (label, callback) =>
        globalThis.WayToolsRuntime.registerMenuCommand("way-interface-compacta", label, callback);
// ==UserScript==
// @name         Way - Interface Compacta
// @namespace    way-interface
// @version      3.4
// @description  Interface compacta com resumo, cópia rica e visita técnica com rascunho isolado por atendimento
// @match        https://wayinternet.matrixdobrasil.ai/*
// @match        https://erp.internetway.com.br/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';


    /* =========================================================
       CONFIGURAÇÕES
       ========================================================= */

    const CONFIG = {
        alturaCampoMensagem: 82,
        tamanhoBotoesAcoes: 38,
        ocultarTags: true,
        removerImagemRodape: true,
        exibirResumoCliente: true
    };


    /* =========================================================
       PERÍODOS DA VISITA
       ========================================================= */

    const PERIODOS_VISITA = {

        manha: {
            nome: 'Manhã',
            inicio: '08:00',
            fim: '12:00'
        },

        tarde: {
            nome: 'Tarde',
            inicio: '13:00',
            fim: '17:00'
        },

        noite: {
            nome: 'Noite',
            inicio: '18:00',
            fim: '20:00'
        }
    };


    /* =========================================================
       POSIÇÃO DAS ABAS
       ========================================================= */

    const STORAGE_POSICAO_ABAS =
        'way-interface-posicao-abas';


    let POSICAO_ABAS =
        GM_getValue(
            STORAGE_POSICAO_ABAS,
            'topo'
        );


    /* =========================================================
       CACHE DA VISITA
       =========================================================

       IMPORTANTE:

       O cache usa sessionStorage.

       Isso significa:

       Atendimento 7028224:
       way-visita-tecnica-7028224

       Atendimento 7029000:
       way-visita-tecnica-7029000

       Cada atendimento tem seus próprios dados.

       Ao fechar a ABA DO NAVEGADOR, o sessionStorage
       normalmente é descartado.

       Nenhum dado de visita é armazenado via
       localStorage ou GM_setValue.
       ========================================================= */

    const CACHE_VISITA_PREFIXO =
        'way-visita-tecnica-';


    /* =========================================================
       SELETORES
       ========================================================= */

    const CLASSE_TAGS =
        '.atendimento-tags';

    const CLASSE_CABECALHO =
        '.cabecalho_msg';

    const SELETOR_RODAPE =
        'img[src*="/public/uploads/rodape.jpg"]';

    const SELETOR_ABAS =
        '#tabs';

    const SELETOR_CONTEUDO_ABAS =
        '#Abas';

    const SELETOR_ACOES =
        '.acoes-agente';


    /* =========================================================
       CSS
       ========================================================= */

    function adicionarCSS() {

        if (
            document.getElementById(
                'way-interface-css'
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'way-interface-css';


        style.textContent = `

            /* =================================================
               RESUMO DO CLIENTE
               ================================================= */

            .way-customer-summary {

                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;

                gap: 6px 14px !important;

                width: 100% !important;

                margin: 0 0 5px 0 !important;
                padding: 6px 8px !important;

                box-sizing: border-box !important;

                background:
                    var(
                        --way-bg-tertiary,
                        #f6f8fa
                    ) !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #d9dee5
                    ) !important;

                border-radius: 5px !important;

                color:
                    var(
                        --way-text,
                        #333
                    ) !important;

                font-size: 12px !important;
                line-height: 22px !important;

                clear: both !important;
            }


            .way-summary-item {

                display: inline-flex !important;
                align-items: center !important;

                gap: 4px !important;

                min-height: 24px !important;

                white-space: nowrap !important;
            }


            .way-summary-icon {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                width: 18px !important;

                font-size: 14px !important;

                line-height: 1 !important;
            }


            .way-summary-label {

                color:
                    var(
                        --way-text,
                        #333
                    ) !important;

                font-weight: 700 !important;
            }


            .way-summary-value {

                color:
                    var(
                        --way-text,
                        #333
                    ) !important;

                font-weight: 700 !important;

                user-select: text !important;
            }


            /* =================================================
               AÇÕES DO RESUMO
               ================================================= */

            .way-summary-actions {

                display: inline-flex !important;

                align-items: center !important;

                gap: 6px !important;

                margin-left: auto !important;
            }


            /* =================================================
               BOTÃO DE CÓPIA INDIVIDUAL
               ================================================= */

            .way-summary-copy {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                width: 24px !important;
                height: 24px !important;

                min-width: 24px !important;

                padding: 0 !important;

                margin: 0 0 0 2px !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #d0d5db
                    ) !important;

                border-radius: 4px !important;

                background:
                    var(
                        --way-surface,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-text-secondary,
                        #555
                    ) !important;

                cursor: pointer !important;

                font-size: 12px !important;

                box-shadow: none !important;
            }


            .way-summary-copy:hover {

                background:
                    var(
                        --way-surface-hover,
                        #eceff2
                    ) !important;
            }


            /* =================================================
               BOTÕES PRINCIPAIS
               ================================================= */

            .way-copy-all,
            .way-technical-visit {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                gap: 4px !important;

                min-height: 27px !important;

                padding: 3px 9px !important;

                margin: 0 !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #d0d5db
                    ) !important;

                border-radius: 4px !important;

                background:
                    var(
                        --way-surface,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-text,
                        #333
                    ) !important;

                cursor: pointer !important;

                font-size: 11px !important;

                font-weight: 600 !important;

                box-shadow: none !important;
            }


            .way-copy-all:hover,
            .way-technical-visit:hover {

                background:
                    var(
                        --way-surface-hover,
                        #eceff2
                    ) !important;
            }


            .way-technical-visit {

                border-color:
                    var(
                        --way-primary,
                        #1687d9
                    ) !important;
            }


            /* =================================================
               CAMPOS ORIGINAIS
               ================================================= */

            .contato-nome.way-resumo-original-oculto,
            .contato-telefone.way-resumo-original-oculto,
            .atendimento-protocolo.way-resumo-original-oculto {

                display: none !important;
            }


            /* =================================================
               MODAL DE VISITA
               ================================================= */

            .way-visit-overlay {

                position: fixed !important;

                inset: 0 !important;

                z-index: 2147483646 !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                padding: 20px !important;

                background:
                    rgba(0, 0, 0, .62) !important;

                backdrop-filter:
                    blur(2px);
            }


            .way-visit-modal {

                width:
                    min(
                        760px,
                        calc(100vw - 30px)
                    ) !important;

                max-height:
                    calc(100vh - 40px) !important;

                display: flex !important;

                flex-direction: column !important;

                background:
                    var(
                        --way-bg-secondary,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-text,
                        #222
                    ) !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #d4d9df
                    ) !important;

                border-radius: 10px !important;

                box-shadow:
                    0 18px 55px
                    rgba(0, 0, 0, .35) !important;

                overflow: hidden !important;
            }


            .way-visit-header {

                display: flex !important;

                align-items: center !important;
                justify-content: space-between !important;

                gap: 10px !important;

                padding: 12px 15px !important;

                background:
                    var(
                        --way-bg-tertiary,
                        #f5f7f9
                    ) !important;

                border-bottom:
                    1px solid
                    var(
                        --way-border,
                        #d4d9df
                    ) !important;
            }


            .way-visit-title {

                margin: 0 !important;

                color:
                    var(
                        --way-text,
                        #222
                    ) !important;

                font-size: 16px !important;

                font-weight: 700 !important;
            }


            .way-visit-close {

                width: 30px !important;
                height: 30px !important;

                padding: 0 !important;

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                background:
                    transparent !important;

                color:
                    var(
                        --way-text-secondary,
                        #666
                    ) !important;

                border:
                    1px solid transparent !important;

                border-radius: 5px !important;

                cursor: pointer !important;

                font-size: 21px !important;

                line-height: 1 !important;
            }


            .way-visit-close:hover {

                background:
                    var(
                        --way-surface-hover,
                        #eceff2
                    ) !important;

                border-color:
                    var(
                        --way-border,
                        #d4d9df
                    ) !important;
            }


            .way-visit-body {

                padding: 14px !important;

                overflow-y: auto !important;
            }


            .way-visit-grid {

                display: grid !important;

                grid-template-columns:
                    repeat(
                        2,
                        minmax(
                            0,
                            1fr
                        )
                    ) !important;

                gap: 11px 14px !important;
            }


            .way-visit-field {

                display: flex !important;

                flex-direction: column !important;

                gap: 5px !important;
            }


            .way-visit-field-full {

                grid-column:
                    1 / -1 !important;
            }


            .way-visit-field label {

                margin: 0 !important;

                color:
                    var(
                        --way-text,
                        #222
                    ) !important;

                font-size: 12px !important;

                font-weight: 700 !important;
            }


            .way-visit-field input,
            .way-visit-field select,
            .way-visit-field textarea {

                width: 100% !important;

                box-sizing:
                    border-box !important;

                padding:
                    7px 9px !important;

                background:
                    var(
                        --way-input-bg,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-input-text,
                        #222
                    ) !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #ccd2d8
                    ) !important;

                border-radius: 5px !important;

                outline: none !important;

                font-family:
                    inherit !important;

                font-size: 12px !important;
            }


            .way-visit-field input:focus,
            .way-visit-field select:focus,
            .way-visit-field textarea:focus {

                border-color:
                    var(
                        --way-primary,
                        #1687d9
                    ) !important;

                box-shadow:
                    0 0 0 1px
                    var(
                        --way-primary,
                        #1687d9
                    ) !important;
            }


            .way-visit-preview {

                min-height: 320px !important;

                resize: vertical !important;

                white-space: pre-wrap !important;

                line-height: 1.45 !important;
            }


            .way-visit-cache-info {

                display: flex !important;

                align-items: center !important;

                gap: 5px !important;

                margin: 0 0 8px 0 !important;

                padding: 6px 8px !important;

                background:
                    var(
                        --way-bg-tertiary,
                        #f5f7f9
                    ) !important;

                color:
                    var(
                        --way-text-secondary,
                        #666
                    ) !important;

                border:
                    1px solid
                    var(
                        --way-border-soft,
                        #e1e5e9
                    ) !important;

                border-radius: 5px !important;

                font-size: 11px !important;
            }


            .way-visit-status {

                min-height: 18px !important;

                margin: 8px 0 0 0 !important;

                color:
                    var(
                        --way-text-secondary,
                        #666
                    ) !important;

                font-size: 11px !important;
            }


            .way-visit-status.success {

                color:
                    #2e8b57 !important;
            }


            .way-visit-status.error {

                color:
                    #d9534f !important;
            }


            .way-visit-footer {

                display: flex !important;

                align-items: center !important;
                justify-content: flex-end !important;

                gap: 8px !important;

                padding: 11px 14px !important;

                background:
                    var(
                        --way-bg-tertiary,
                        #f5f7f9
                    ) !important;

                border-top:
                    1px solid
                    var(
                        --way-border,
                        #d4d9df
                    ) !important;
            }


            .way-visit-footer button {

                min-height: 31px !important;

                padding: 5px 12px !important;

                border-radius: 5px !important;

                cursor: pointer !important;

                font-size: 12px !important;

                font-weight: 600 !important;
            }


            .way-visit-clear {

                margin-right: auto !important;

                background:
                    transparent !important;

                color:
                    #d9534f !important;

                border:
                    1px solid
                    rgba(
                        217,
                        83,
                        79,
                        .5
                    ) !important;
            }


            .way-visit-clear:hover {

                background:
                    rgba(
                        217,
                        83,
                        79,
                        .08
                    ) !important;
            }


            .way-visit-cancel {

                background:
                    var(
                        --way-surface,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-text,
                        #333
                    ) !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #ccd2d8
                    ) !important;
            }


            .way-visit-copy {

                background:
                    var(
                        --way-primary,
                        #1687d9
                    ) !important;

                color:
                    #fff !important;

                border:
                    1px solid
                    var(
                        --way-primary,
                        #1687d9
                    ) !important;
            }


            .way-visit-copy:hover {

                filter:
                    brightness(.94);
            }


            @media (
                max-width: 650px
            ) {

                .way-visit-grid {

                    grid-template-columns:
                        1fr !important;
                }


                .way-visit-field-full {

                    grid-column:
                        auto !important;
                }


                .way-visit-footer {

                    flex-wrap:
                        wrap !important;
                }


                .way-visit-clear {

                    width:
                        100% !important;

                    margin-right:
                        0 !important;
                }
            }


            /* =================================================
               TAGS
               ================================================= */

            .atendimento-tags.way-tags-ocultas {

                display: none !important;
            }


            img[src*="/public/uploads/rodape.jpg"] {

                display: none !important;
            }


            .way-toggle-tags {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                gap: 4px !important;

                padding: 2px 7px !important;

                margin: 0 4px 2px 0 !important;

                border:
                    1px solid
                    var(
                        --way-border,
                        #d5d5d5
                    ) !important;

                border-radius: 4px !important;

                background:
                    var(
                        --way-surface,
                        #fff
                    ) !important;

                color:
                    var(
                        --way-text-secondary,
                        #666
                    ) !important;

                font-size: 11px !important;

                line-height: 18px !important;

                cursor: pointer !important;

                float: right !important;
            }


            .way-toggle-tags:hover {

                background:
                    var(
                        --way-surface-hover,
                        #f5f5f5
                    ) !important;
            }


            .way-toggle-tags.way-tags-abertas {

                font-weight: 600 !important;
            }


            /* =================================================
               CHAT
               ================================================= */

            .conversa > .slimScrollDiv,
            .conversa .slimScrollDiv.scroll-active {

                padding-bottom: 4px !important;
            }


            .conversa .messages i.fa,
            .conversa .messages i.fas,
            .conversa .messages i.far,
            .conversa .messages i.fab,
            .conversa .messages i.fa-solid,
            .conversa .messages i.fa-regular,
            .conversa .scroll-button i,
            .conversa .msg-responder i,
            .conversa .header-msg-responder i,
            .conversa .label-tools i,
            .conversa span[rel="tooltip"] > i {

                display: inline-block !important;

                visibility: visible !important;

                opacity: 1 !important;

                width: auto !important;
                height: auto !important;

                min-width: 0 !important;
                min-height: 0 !important;

                max-width: none !important;
                max-height: none !important;

                margin: 0 !important;
                padding: 0 !important;

                line-height: normal !important;

                vertical-align: baseline !important;

                transform: none !important;

                overflow: visible !important;
            }


            .conversa .messages i::before,
            .conversa .scroll-button i::before,
            .conversa .msg-responder i::before,
            .conversa .label-tools i::before,
            .conversa span[rel="tooltip"] > i::before {

                display: inline-block !important;

                visibility: visible !important;

                opacity: 1 !important;
            }


            .conversa .messages-input-form {

                margin-top: 0 !important;
                margin-bottom: 0 !important;

                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }


            .conversa .messages-input-form form {

                margin: 0 !important;
                padding: 0 !important;
            }


            .conversa
            .messages-input-form
            .faketextbox[contenteditable="true"] {

                height:
                    ${CONFIG.alturaCampoMensagem}px !important;

                min-height:
                    ${CONFIG.alturaCampoMensagem}px !important;

                max-height: 120px !important;

                overflow-y: auto !important;

                box-sizing: border-box !important;
            }


            .conversa
            .messages-input-form
            textarea {

                height:
                    ${CONFIG.alturaCampoMensagem}px !important;

                min-height:
                    ${CONFIG.alturaCampoMensagem}px !important;

                max-height: 120px !important;

                box-sizing: border-box !important;
            }


            .conversa .group-msg {

                display: flex !important;

                align-items: flex-end !important;

                gap: 4px !important;
            }


            .conversa .group-msg .input {

                margin-right: 0 !important;
            }


            .conversa
            .messages-input-form
            .hsm_buttons {

                margin: 0 3px 3px 0 !important;

                padding: 0 !important;
            }


            .conversa
            .messages-input-form
            .hsm_buttons > a {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                margin: 0 3px !important;

                padding: 2px !important;

                font-size: 15px !important;

                line-height: 1 !important;
            }


            .conversa
            .messages-input-form
            .hsm_buttons > a > i {

                display: inline-block !important;

                visibility: visible !important;

                opacity: 1 !important;

                width: auto !important;
                height: auto !important;

                margin: 0 !important;
                padding: 0 !important;

                line-height: 1 !important;
            }


            .conversa
            .messages-input-form
            .buttons {

                display: flex !important;

                align-items: flex-end !important;

                margin: 0 !important;
                padding: 0 !important;
            }


            .conversa
            .messages-input-form
            button[data-rel="enviarMsg"] {

                width: 36px !important;
                min-width: 36px !important;

                height: 36px !important;
                min-height: 36px !important;

                padding: 0 !important;

                margin: 0 0 2px 0 !important;

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                line-height: 1 !important;

                box-sizing: border-box !important;
            }


            .conversa
            .messages-input-form
            button[data-rel="enviarMsg"] > i {

                display: inline-block !important;

                visibility: visible !important;

                opacity: 1 !important;

                width: auto !important;
                height: auto !important;

                margin: 0 !important;
                padding: 0 !important;

                line-height: 1 !important;
            }


            .conversa div:has(
                > b[data-limit-caracter]
            ),

            .conversa div:has(
                > b[data-total-caracter]
            ) {

                font-size: 10px !important;

                line-height: 12px !important;

                min-height: 12px !important;

                margin: 1px 2px 0 0 !important;

                padding: 0 !important;

                text-align: right !important;

                color: #999 !important;
            }


            .way-gap-acoes {

                display: none !important;
            }


            /* =================================================
               BOTÕES INFERIORES
               ================================================= */

            .acoes-agente {

                display: flex !important;

                justify-content: center !important;
                align-items: center !important;

                flex-wrap: wrap !important;

                gap: 6px !important;

                margin: 3px 0 0 0 !important;

                padding: 0 !important;

                min-height:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;
            }


            .acoes-agente
            > .btn.btn-circle.btn-xlarge {

                width:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                min-width:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                max-width:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                height:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                min-height:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                max-height:
                    ${CONFIG.tamanhoBotoesAcoes}px !important;

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                padding: 0 !important;
                margin: 0 !important;

                line-height: 1 !important;

                font-size: 15px !important;

                border-radius: 50% !important;

                box-sizing: border-box !important;
            }


            .acoes-agente
            > .btn.btn-circle.btn-xlarge
            > i {

                display: inline-flex !important;

                align-items: center !important;
                justify-content: center !important;

                width: 100% !important;
                height: 100% !important;

                margin: 0 !important;
                padding: 0 !important;

                line-height: 1 !important;

                position: static !important;

                transform: none !important;

                visibility: visible !important;

                opacity: 1 !important;
            }


            .acoes-agente
            > .btn.btn-circle.btn-xlarge
            > i::before {

                display: inline-block !important;

                visibility: visible !important;

                opacity: 1 !important;

                margin: 0 !important;
                padding: 0 !important;

                line-height: 1 !important;
            }


            /* =================================================
               ABAS
               ================================================= */

            .tabbable.way-layout-tabs-bottom {

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;
            }


            .tabbable.way-layout-tabs-bottom
            > #Abas {

                order: 10 !important;

                width: 100% !important;
            }


            .tabbable.way-layout-tabs-bottom
            > #tabs {

                order: 20 !important;

                width: 100% !important;

                margin: 5px 0 0 0 !important;

                padding: 0 !important;

                flex-shrink: 0 !important;
            }


            .tabbable.way-layout-tabs-bottom
            > #search-extras {

                order: 0 !important;
            }


            #tabs.way-tabs-bottom {

                width: 100% !important;

                clear: both !important;
            }


            #tabs.way-tabs-bottom > li {

                margin-bottom: 0 !important;
            }


            #tabs.way-tabs-bottom > li > a {

                margin-top: 0 !important;
                margin-bottom: 0 !important;
            }


            #Abas .tab-pane {

                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
            }

        `;


        document.documentElement
            .appendChild(
                style
            );
    }


    /* =========================================================
       EXTRAI VALOR
       ========================================================= */

    function extrairValorCampo(
        cabecalho,
        seletor,
        rotulo
    ) {

        const elemento =
            cabecalho.querySelector(
                seletor
            );


        if (!elemento) {
            return '';
        }


        const clone =
            elemento.cloneNode(
                true
            );


        clone
            .querySelectorAll(
                [
                    'i',
                    'button',
                    '.fa',
                    '.fas',
                    '.far',
                    '.fab',
                    '.fa-solid',
                    '.fa-regular',
                    '[rel="tooltip"]',
                    '[data-toggle="tooltip"]'
                ].join(',')
            )
            .forEach(
                elementoExtra => {

                    elementoExtra.remove();
                }
            );


        let texto =
            clone.textContent ||
            '';


        texto =
            texto
                .replace(
                    /\s+/g,
                    ' '
                )
                .trim();


        texto =
            texto.replace(
                rotulo,
                ''
            );


        return texto.trim();
    }


    /* =========================================================
       LIMPA NOME
       ========================================================= */

    function limparNomeCliente(
        nome
    ) {

        if (!nome) {
            return '';
        }


        return String(
            nome
        )
            .replace(
                /\uFFFD/g,
                ''
            )
            .replace(
                /\s+\?+\s*$/,
                ''
            )
            .replace(
                /\s+/g,
                ' '
            )
            .trim();
    }


    /* =========================================================
       FORMATA TELEFONE
       ========================================================= */

    function formatarTelefone(
        telefone
    ) {

        if (!telefone) {
            return '';
        }


        let numeros =
            String(
                telefone
            )
                .replace(
                    /\D/g,
                    ''
                );


        if (
            numeros.startsWith('55') &&
            (
                numeros.length === 12 ||
                numeros.length === 13
            )
        ) {

            numeros =
                numeros.substring(2);
        }


        if (
            numeros.length === 11
        ) {

            return (
                '(' +
                numeros.substring(0, 2) +
                ') ' +
                numeros.substring(2, 7) +
                '-' +
                numeros.substring(7)
            );
        }


        if (
            numeros.length === 10
        ) {

            return (
                '(' +
                numeros.substring(0, 2) +
                ') ' +
                numeros.substring(2, 6) +
                '-' +
                numeros.substring(6)
            );
        }


        return telefone;
    }


    /* =========================================================
       ESCAPA HTML
       ========================================================= */

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


    /* =========================================================
       CÓPIA SIMPLES
       ========================================================= */

    async function copiarTextoSimples(
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

            return false;
        }
    }


    /* =========================================================
       CÓPIA RICA
       ========================================================= */

    async function copiarConteudoRico(
        textoPlano,
        html
    ) {

        if (
            navigator.clipboard &&
            navigator.clipboard.write &&
            typeof ClipboardItem !==
                'undefined'
        ) {

            try {

                const item =
                    new ClipboardItem(
                        {
                            'text/plain':
                                new Blob(
                                    [
                                        textoPlano
                                    ],
                                    {
                                        type:
                                            'text/plain'
                                    }
                                ),

                            'text/html':
                                new Blob(
                                    [
                                        html
                                    ],
                                    {
                                        type:
                                            'text/html'
                                    }
                                )
                        }
                    );


                await navigator
                    .clipboard
                    .write(
                        [
                            item
                        ]
                    );


                return true;

            } catch (erro) {

                console.warn(
                    '[Way Interface] Clipboard HTML indisponível.',
                    erro
                );
            }
        }


        return copiarTextoSimples(
            textoPlano
        );
    }


    /* =========================================================
       FEEDBACK
       ========================================================= */

    function mostrarFeedbackCopia(
        botao
    ) {

        if (!botao) {
            return;
        }


        const original =
            botao.innerHTML;


        botao.innerHTML =
            '✓';


        setTimeout(
            function () {

                botao.innerHTML =
                    original;
            },

            800
        );
    }


    /* =========================================================
       DATA ATUAL
       ========================================================= */

    function obterDataHojeInput() {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const dia =
            String(
                hoje.getDate()
            ).padStart(
                2,
                '0'
            );


        return (
            `${ano}-${mes}-${dia}`
        );
    }


    /* =========================================================
       FORMATA DATA
       ========================================================= */

    function formatarDataVisita(
        valor
    ) {

        if (!valor) {
            return '';
        }


        const partes =
            valor.split(
                '-'
            );


        if (
            partes.length !== 3
        ) {

            return '';
        }


        const ano =
            Number(
                partes[0]
            );


        const mes =
            Number(
                partes[1]
            );


        const dia =
            Number(
                partes[2]
            );


        const data =
            new Date(
                ano,
                mes - 1,
                dia
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return '';
        }


        const diasSemana = [
            'Domingo',
            'Segunda-Feira',
            'Terça-Feira',
            'Quarta-Feira',
            'Quinta-Feira',
            'Sexta-Feira',
            'Sábado'
        ];


        const nomeDia =
            diasSemana[
                data.getDay()
            ];


        const dataFormatada =
            String(
                dia
            ).padStart(
                2,
                '0'
            ) +
            '/' +
            String(
                mes
            ).padStart(
                2,
                '0'
            ) +
            '/' +
            ano;


        return (
            nomeDia +
            ' ' +
            dataFormatada
        );
    }


    /* =========================================================
       IDENTIFICA O ATENDIMENTO
       ========================================================= */

    function obterCodigoAtendimento(
        cabecalho
    ) {

        if (!cabecalho) {
            return '';
        }


        const pane =
            cabecalho.closest(
                '.tab-pane[id^="aba-"]'
            );


        if (!pane) {
            return '';
        }


        const codigo =
            pane.id.replace(
                /^aba-/,
                ''
            );


        /*
         * Aceita apenas números.
         *
         * Caso o código não seja confiável,
         * o cache simplesmente não será usado.
         */

        if (
            !/^\d+$/.test(
                codigo
            )
        ) {

            return '';
        }


        return codigo;
    }


    /* =========================================================
       CHAVE DO CACHE
       ========================================================= */

    function obterChaveCacheVisita(
        codigoAtendimento
    ) {

        if (
            !codigoAtendimento
        ) {

            return '';
        }


        return (
            CACHE_VISITA_PREFIXO +
            codigoAtendimento
        );
    }


    /* =========================================================
       CARREGA CACHE
       ========================================================= */

    function carregarCacheVisita(
        codigoAtendimento
    ) {

        const chave =
            obterChaveCacheVisita(
                codigoAtendimento
            );


        if (!chave) {

            return null;
        }


        try {

            const valor =
                sessionStorage.getItem(
                    chave
                );


            if (!valor) {

                return null;
            }


            const dados =
                JSON.parse(
                    valor
                );


            if (
                !dados ||
                typeof dados !==
                    'object' ||
                Array.isArray(
                    dados
                )
            ) {

                return null;
            }


            return dados;

        } catch (erro) {

            console.warn(
                '[Way Interface] Não foi possível carregar o rascunho da visita.',
                erro
            );


            return null;
        }
    }


    /* =========================================================
       SALVA CACHE
       ========================================================= */

    function salvarCacheVisita(
        codigoAtendimento,
        dados
    ) {

        const chave =
            obterChaveCacheVisita(
                codigoAtendimento
            );


        /*
         * Segurança:
         *
         * Sem ID de atendimento confiável,
         * NADA é armazenado.
         */

        if (!chave) {

            return false;
        }


        try {

            const cache = {

                nome:
                    String(
                        dados.nome ||
                        ''
                    ),

                telefone:
                    String(
                        dados.telefone ||
                        ''
                    ),

                endereco:
                    String(
                        dados.endereco ||
                        ''
                    ),

                data:
                    String(
                        dados.data ||
                        ''
                    ),

                periodo:
                    String(
                        dados.periodo ||
                        ''
                    ),

                protocolo:
                    String(
                        dados.protocolo ||
                        ''
                    ),

                /*
                 * Apenas informativo.
                 */

                atualizadoEm:
                    Date.now()
            };


            sessionStorage.setItem(
                chave,
                JSON.stringify(
                    cache
                )
            );


            return true;

        } catch (erro) {

            console.warn(
                '[Way Interface] Não foi possível salvar o rascunho da visita.',
                erro
            );


            return false;
        }
    }


    /* =========================================================
       APAGA CACHE DE UM ATENDIMENTO
       ========================================================= */

    function apagarCacheVisita(
        codigoAtendimento
    ) {

        const chave =
            obterChaveCacheVisita(
                codigoAtendimento
            );


        if (!chave) {

            return false;
        }


        try {

            sessionStorage.removeItem(
                chave
            );


            return true;

        } catch (erro) {

            return false;
        }
    }


    /* =========================================================
       GERA TEXTO DA VISITA
       ========================================================= */

    function gerarTextoVisita(
        dados
    ) {

        const periodo =
            PERIODOS_VISITA[
                dados.periodo
            ];


        const dia =
            formatarDataVisita(
                dados.data
            );


        const horario =
            periodo
                ?
                `das *${periodo.inicio}h às ${periodo.fim}h*`
                :
                '';


        return `✅ *Visita Técnica Agendada com Sucesso*

👤 *Nome:* ${dados.nome}
📍 *Endereço:* ${dados.endereco}
📅 *Dia:* ${dia}
🌤️ *Período:* ${periodo?.nome || ''}
📱 *Telefone:* ${dados.telefone}
🕐 *Previsão de atendimento:* ${horario}
🔢 *Protocolo:* *${dados.protocolo}*

📲 *Confirmação da visita*
O setor de agendamento enviará uma mensagem via *WhatsApp* para confirmar a visita. *É importante responder à mensagem* para que o agendamento seja validado.

🚗 *Deslocamento do técnico*
Assim que o técnico iniciar o deslocamento até o endereço, você receberá um *SMS* com a *placa e os dados do veículo* do profissional responsável pela execução da ordem de serviço.

⚠️ *Importante:*
É necessário que haja *uma pessoa maior de 18 anos no local* para receber o técnico.

🔄 *Precisa reagendar?*
Caso não possa receber o técnico no período agendado, basta responder à mensagem de confirmação enviada pelo WhatsApp solicitando um novo horário ou entrar em contato com nossa equipe.

Estamos à disposição e teremos prazer em atendê-lo! 😊`;
    }


    /* =========================================================
       FECHA MODAL
       ========================================================= */

    function fecharModalVisita() {

        document
            .querySelector(
                '.way-visit-overlay'
            )
            ?.remove();
    }


    /* =========================================================
       ABRE MODAL
       ========================================================= */

    function abrirModalVisita(
        cabecalho,
        resumo
    ) {

        /*
         * Remove apenas a interface do modal anterior.
         *
         * O rascunho permanece no sessionStorage,
         * vinculado ao atendimento correto.
         */

        fecharModalVisita();


        /* =====================================================
           ID DO ATENDIMENTO
           ===================================================== */

        const codigoAtendimento =
            obterCodigoAtendimento(
                cabecalho
            );


        /* =====================================================
           DADOS ATUAIS DO CABEÇALHO
           ===================================================== */

        const nomeAtual =
            resumo
                .querySelector(
                    '[data-way-value="nome"]'
                )
                ?.textContent
                .trim()
            ||
            '';


        const telefoneAtual =
            resumo
                .querySelector(
                    '[data-way-value="telefone"]'
                )
                ?.textContent
                .trim()
            ||
            '';


        /* =====================================================
           CACHE EXCLUSIVO DESTE ATENDIMENTO
           ===================================================== */

        const cache =
            carregarCacheVisita(
                codigoAtendimento
            );


        /*
         * Se existir cache deste atendimento:
         *
         * usa o que foi digitado anteriormente.
         *
         * Se NÃO existir:
         *
         * Nome = cliente atual
         * Telefone = cliente atual
         * Endereço = vazio
         * Data = hoje
         * Período = vazio
         * Protocolo = vazio
         */

        const valoresIniciais = {

            nome:
                cache
                    ? cache.nome ?? nomeAtual
                    : nomeAtual,

            telefone:
                cache
                    ? cache.telefone ?? telefoneAtual
                    : telefoneAtual,

            endereco:
                cache
                    ? cache.endereco ?? ''
                    : '',

            data:
                cache
                    ? cache.data || obterDataHojeInput()
                    : obterDataHojeInput(),

            periodo:
                cache
                    ? cache.periodo ?? ''
                    : '',

            protocolo:
                cache
                    ? cache.protocolo ?? ''
                    : ''
        };


        /* =====================================================
           OVERLAY
           ===================================================== */

        const overlay =
            document.createElement(
                'div'
            );


        overlay.className =
            'way-visit-overlay';


        /* =====================================================
           MODAL
           ===================================================== */

        const modal =
            document.createElement(
                'div'
            );


        modal.className =
            'way-visit-modal';


        modal.innerHTML = `

            <div class="way-visit-header">

                <h3 class="way-visit-title">
                    🛠 Visita Técnica
                </h3>

                <button
                    type="button"
                    class="way-visit-close"
                    title="Fechar"
                >
                    ×
                </button>

            </div>


            <div class="way-visit-body">

                <div class="way-visit-cache-info">

                    💾

                    <span>
                        ${
                            codigoAtendimento
                                ?
                                `Rascunho exclusivo do atendimento ${escaparHTML(codigoAtendimento)}.`
                                :
                                'Atendimento não identificado: o rascunho não será armazenado.'
                        }
                    </span>

                </div>


                <div class="way-visit-grid">


                    <!-- NOME -->

                    <div class="way-visit-field">

                        <label>
                            👤 Nome
                        </label>

                        <input
                            type="text"
                            data-way-visit="nome"
                            placeholder="Nome do cliente"
                            autocomplete="off"
                        >

                    </div>


                    <!-- TELEFONE -->

                    <div class="way-visit-field">

                        <label>
                            📱 Telefone
                        </label>

                        <input
                            type="text"
                            data-way-visit="telefone"
                            placeholder="Telefone do cliente"
                            autocomplete="off"
                        >

                    </div>


                    <!-- ENDEREÇO -->

                    <div
                        class="
                            way-visit-field
                            way-visit-field-full
                        "
                    >

                        <label>
                            📍 Endereço
                        </label>

                        <input
                            type="text"
                            data-way-visit="endereco"
                            placeholder="Digite o endereço do cliente"
                            autocomplete="off"
                        >

                    </div>


                    <!-- DATA -->

                    <div class="way-visit-field">

                        <label>
                            📅 Data da visita
                        </label>

                        <input
                            type="date"
                            data-way-visit="data"
                        >

                    </div>


                    <!-- PERÍODO -->

                    <div class="way-visit-field">

                        <label>
                            🌤️ Período
                        </label>

                        <select
                            data-way-visit="periodo"
                        >

                            <option value="">
                                Selecione...
                            </option>

                            <option value="manha">
                                Manhã — 08:00 às 12:00
                            </option>

                            <option value="tarde">
                                Tarde — 13:00 às 17:00
                            </option>

                            <option value="noite">
                                Noite — 18:00 às 20:00
                            </option>

                        </select>

                    </div>


                    <!-- PROTOCOLO -->

                    <div
                        class="
                            way-visit-field
                            way-visit-field-full
                        "
                    >

                        <label>
                            🔢 Protocolo
                        </label>

                        <input
                            type="text"
                            data-way-visit="protocolo"
                            placeholder="Cole aqui o protocolo da visita"
                            autocomplete="off"
                        >

                    </div>


                    <!-- PREVIEW -->

                    <div
                        class="
                            way-visit-field
                            way-visit-field-full
                        "
                    >

                        <label>
                            📄 Pré-visualização
                        </label>

                        <textarea
                            class="way-visit-preview"
                            data-way-visit="preview"
                            readonly
                        ></textarea>

                    </div>

                </div>


                <div
                    class="way-visit-status"
                    data-way-visit="status"
                ></div>

            </div>


            <div class="way-visit-footer">

                <button
                    type="button"
                    class="way-visit-clear"
                    title="Apagar somente o rascunho deste atendimento"
                >
                    🗑 Limpar rascunho
                </button>

                <button
                    type="button"
                    class="way-visit-cancel"
                >
                    Fechar
                </button>

                <button
                    type="button"
                    class="way-visit-copy"
                >
                    📋 Copiar relatório
                </button>

            </div>

        `;


        overlay.appendChild(
            modal
        );


        document.body.appendChild(
            overlay
        );


        /* =====================================================
           CAMPOS
           ===================================================== */

        const campoNome =
            modal.querySelector(
                '[data-way-visit="nome"]'
            );


        const campoTelefone =
            modal.querySelector(
                '[data-way-visit="telefone"]'
            );


        const campoEndereco =
            modal.querySelector(
                '[data-way-visit="endereco"]'
            );


        const campoData =
            modal.querySelector(
                '[data-way-visit="data"]'
            );


        const campoPeriodo =
            modal.querySelector(
                '[data-way-visit="periodo"]'
            );


        const campoProtocolo =
            modal.querySelector(
                '[data-way-visit="protocolo"]'
            );


        const campoPreview =
            modal.querySelector(
                '[data-way-visit="preview"]'
            );


        const status =
            modal.querySelector(
                '[data-way-visit="status"]'
            );


        /* =====================================================
           PREENCHIMENTO INICIAL
           ===================================================== */

        campoNome.value =
            valoresIniciais.nome;


        campoTelefone.value =
            valoresIniciais.telefone;


        campoEndereco.value =
            valoresIniciais.endereco;


        campoData.value =
            valoresIniciais.data;


        campoPeriodo.value =
            valoresIniciais.periodo;


        campoProtocolo.value =
            valoresIniciais.protocolo;


        /* =====================================================
           DADOS DO FORMULÁRIO
           ===================================================== */

        function obterDadosFormulario() {

            return {

                nome:
                    campoNome
                        .value
                        .trim(),

                telefone:
                    campoTelefone
                        .value
                        .trim(),

                endereco:
                    campoEndereco
                        .value
                        .trim(),

                data:
                    campoData
                        .value,

                periodo:
                    campoPeriodo
                        .value,

                protocolo:
                    campoProtocolo
                        .value
                        .trim()
            };
        }


        /* =====================================================
           SALVA RASCUNHO
           ===================================================== */

        function salvarRascunhoAtual() {

            if (
                !codigoAtendimento
            ) {

                return;
            }


            salvarCacheVisita(
                codigoAtendimento,
                obterDadosFormulario()
            );
        }


        /* =====================================================
           PREVIEW
           ===================================================== */

        function atualizarPreview() {

            const dados =
                obterDadosFormulario();


            campoPreview.value =
                gerarTextoVisita(
                    dados
                );
        }


        /* =====================================================
           ALTERAÇÕES DO FORMULÁRIO
           ===================================================== */

        let timerCache =
            null;


        function campoAlterado() {

            atualizarPreview();


            /*
             * Debounce pequeno para não escrever
             * no sessionStorage a cada tecla.
             */

            clearTimeout(
                timerCache
            );


            timerCache =
                setTimeout(
                    salvarRascunhoAtual,
                    250
                );
        }


        [
            campoNome,
            campoTelefone,
            campoEndereco,
            campoData,
            campoPeriodo,
            campoProtocolo
        ]
            .forEach(
                campo => {

                    campo.addEventListener(
                        'input',
                        campoAlterado
                    );


                    campo.addEventListener(
                        'change',
                        campoAlterado
                    );
                }
            );


        atualizarPreview();


        /* =====================================================
           FECHAMENTO
           ===================================================== */

        function fecharModalSalvando() {

            /*
             * Garante que o último caractere digitado
             * também foi salvo antes de fechar.
             */

            clearTimeout(
                timerCache
            );


            salvarRascunhoAtual();


            fecharModalVisita();
        }


        modal
            .querySelector(
                '.way-visit-close'
            )
            .addEventListener(
                'click',
                fecharModalSalvando
            );


        modal
            .querySelector(
                '.way-visit-cancel'
            )
            .addEventListener(
                'click',
                fecharModalSalvando
            );


        /*
         * Clique fora NÃO fecha.
         */

        overlay.addEventListener(
            'click',

            function (
                event
            ) {

                if (
                    event.target ===
                    overlay
                ) {

                    event.preventDefault();

                    event.stopPropagation();
                }
            }
        );


        /*
         * ESC NÃO fecha.
         */

        overlay.addEventListener(
            'keydown',

            function (
                event
            ) {

                if (
                    event.key ===
                        'Escape'
                ) {

                    event.preventDefault();

                    event.stopPropagation();
                }
            },

            true
        );


        /* =====================================================
           LIMPAR RASCUNHO
           ===================================================== */

        modal
            .querySelector(
                '.way-visit-clear'
            )
            .addEventListener(
                'click',

                function () {

                    /*
                     * Só remove o cache do atendimento atual.
                     */

                    apagarCacheVisita(
                        codigoAtendimento
                    );


                    /*
                     * Volta ao estado padrão.
                     *
                     * Nome e telefone:
                     * dados atuais do cliente.
                     *
                     * Endereço:
                     * vazio.
                     *
                     * Data:
                     * hoje.
                     *
                     * Período:
                     * vazio.
                     *
                     * Protocolo:
                     * vazio.
                     */

                    campoNome.value =
                        nomeAtual;


                    campoTelefone.value =
                        telefoneAtual;


                    campoEndereco.value =
                        '';


                    campoData.value =
                        obterDataHojeInput();


                    campoPeriodo.value =
                        '';


                    campoProtocolo.value =
                        '';


                    atualizarPreview();


                    status.textContent =
                        '✓ Rascunho deste atendimento apagado.';


                    status.className =
                        'way-visit-status success';


                    campoEndereco.focus();
                }
            );


        /* =====================================================
           COPIAR RELATÓRIO
           ===================================================== */

        modal
            .querySelector(
                '.way-visit-copy'
            )
            .addEventListener(
                'click',

                async function () {

                    const dados =
                        obterDadosFormulario();


                    const faltando =
                        [];


                    if (!dados.nome) {

                        faltando.push(
                            'nome'
                        );
                    }


                    if (!dados.endereco) {

                        faltando.push(
                            'endereço'
                        );
                    }


                    if (!dados.data) {

                        faltando.push(
                            'data'
                        );
                    }


                    if (!dados.periodo) {

                        faltando.push(
                            'período'
                        );
                    }


                    if (!dados.telefone) {

                        faltando.push(
                            'telefone'
                        );
                    }


                    if (!dados.protocolo) {

                        faltando.push(
                            'protocolo'
                        );
                    }


                    if (
                        faltando.length
                    ) {

                        status.textContent =
                            '⚠️ Preencha: ' +
                            faltando.join(
                                ', '
                            ) +
                            '.';


                        status.className =
                            'way-visit-status error';


                        return;
                    }


                    /*
                     * Salva antes de copiar.
                     */

                    salvarRascunhoAtual();


                    const texto =
                        gerarTextoVisita(
                            dados
                        );


                    const sucesso =
                        await copiarTextoSimples(
                            texto
                        );


                    if (
                        sucesso
                    ) {

                        status.textContent =
                            '✓ Relatório copiado. Rascunho deste atendimento mantido.';


                        status.className =
                            'way-visit-status success';


                        const botao =
                            modal.querySelector(
                                '.way-visit-copy'
                            );


                        const original =
                            botao.innerHTML;


                        botao.innerHTML =
                            '✓ Copiado';


                        setTimeout(
                            function () {

                                botao.innerHTML =
                                    original;
                            },

                            1200
                        );

                    } else {

                        status.textContent =
                            'Não foi possível copiar o relatório.';


                        status.className =
                            'way-visit-status error';
                    }
                }
            );


        /* =====================================================
           FOCO INICIAL
           ===================================================== */

        setTimeout(
            function () {

                /*
                 * Se já existe rascunho,
                 * não força o endereço.
                 *
                 * Se é primeira abertura e endereço
                 * está vazio, deixa o cursor nele.
                 */

                if (
                    !campoEndereco.value
                ) {

                    campoEndereco.focus();

                } else if (
                    !campoPeriodo.value
                ) {

                    campoPeriodo.focus();

                } else if (
                    !campoProtocolo.value
                ) {

                    campoProtocolo.focus();
                }
            },

            50
        );
    }


    /* =========================================================
       ITEM DO RESUMO
       ========================================================= */

    function criarItemResumo(
        tipo,
        emoji,
        label
    ) {

        const item =
            document.createElement(
                'div'
            );


        item.className =
            'way-summary-item';


        item.dataset.wayKey =
            tipo;


        const icone =
            document.createElement(
                'span'
            );


        icone.className =
            'way-summary-icon';


        icone.textContent =
            emoji;


        const rotulo =
            document.createElement(
                'span'
            );


        rotulo.className =
            'way-summary-label';


        rotulo.textContent =
            label + ':';


        const valor =
            document.createElement(
                'span'
            );


        valor.className =
            'way-summary-value';


        valor.dataset.wayValue =
            tipo;


        valor.textContent =
            '—';


        const copiar =
            document.createElement(
                'button'
            );


        copiar.type =
            'button';


        copiar.className =
            'way-summary-copy';


        copiar.dataset.wayCopy =
            tipo;


        copiar.innerHTML =
            '📋';


        copiar.title =
            'Copiar ' +
            label.toLowerCase();


        item.append(
            icone,
            rotulo,
            valor,
            copiar
        );


        return item;
    }


    /* =========================================================
       CRIA RESUMO
       ========================================================= */

    function criarResumoCliente(
        cabecalho
    ) {

        const resumo =
            document.createElement(
                'div'
            );


        resumo.className =
            'way-customer-summary';


        resumo.appendChild(
            criarItemResumo(
                'nome',
                '👤',
                'Nome'
            )
        );


        resumo.appendChild(
            criarItemResumo(
                'telefone',
                '📱',
                'Telefone'
            )
        );


        resumo.appendChild(
            criarItemResumo(
                'protocolo',
                '🎫',
                'Protocolo'
            )
        );


        /* =====================================================
           AÇÕES
           ===================================================== */

        const acoes =
            document.createElement(
                'div'
            );


        acoes.className =
            'way-summary-actions';


        const visitaTecnica =
            document.createElement(
                'button'
            );


        visitaTecnica.type =
            'button';


        visitaTecnica.className =
            'way-technical-visit';


        visitaTecnica.innerHTML =
            '🛠 Visita Técnica';


        visitaTecnica.title =
            'Gerar relatório de visita técnica';


        const copiarTudo =
            document.createElement(
                'button'
            );


        copiarTudo.type =
            'button';


        copiarTudo.className =
            'way-copy-all';


        copiarTudo.innerHTML =
            '📋 Copiar tudo';


        copiarTudo.title =
            'Copiar nome, telefone e protocolo';


        acoes.append(
            visitaTecnica,
            copiarTudo
        );


        resumo.appendChild(
            acoes
        );


        /* =====================================================
           VISITA
           ===================================================== */

        visitaTecnica.addEventListener(
            'click',

            function (
                event
            ) {

                event.preventDefault();

                event.stopPropagation();


                abrirModalVisita(
                    cabecalho,
                    resumo
                );
            }
        );


        /* =====================================================
           CÓPIA
           ===================================================== */

        resumo.addEventListener(
            'click',

            async function (
                event
            ) {

                const botaoIndividual =
                    event.target.closest(
                        '[data-way-copy]'
                    );


                if (
                    botaoIndividual
                ) {

                    event.preventDefault();

                    event.stopPropagation();


                    const tipo =
                        botaoIndividual
                            .dataset
                            .wayCopy;


                    const valorElemento =
                        resumo.querySelector(
                            `[data-way-value="${tipo}"]`
                        );


                    if (
                        !valorElemento
                    ) {

                        return;
                    }


                    const valor =
                        valorElemento
                            .textContent
                            .trim();


                    if (
                        !valor ||
                        valor === '—'
                    ) {

                        return;
                    }


                    let emoji =
                        '';

                    let label =
                        '';


                    if (
                        tipo ===
                        'nome'
                    ) {

                        emoji =
                            '👤';

                        label =
                            'Nome';

                    } else if (
                        tipo ===
                        'telefone'
                    ) {

                        emoji =
                            '📱';

                        label =
                            'Telefone';

                    } else if (
                        tipo ===
                        'protocolo'
                    ) {

                        emoji =
                            '🎫';

                        label =
                            'Protocolo';

                    } else {

                        return;
                    }


                    const textoPlano =
                        `${emoji} ${label}: ${valor}`;


                    const html =
                        `${emoji} <strong>${label}:</strong> ${escaparHTML(valor)}`;


                    const sucesso =
                        await copiarConteudoRico(
                            textoPlano,
                            html
                        );


                    if (
                        sucesso
                    ) {

                        mostrarFeedbackCopia(
                            botaoIndividual
                        );
                    }


                    return;
                }


                /* =================================================
                   COPIAR TUDO
                   ================================================= */

                const botaoTudo =
                    event.target.closest(
                        '.way-copy-all'
                    );


                if (
                    !botaoTudo
                ) {

                    return;
                }


                event.preventDefault();

                event.stopPropagation();


                const nome =
                    resumo.querySelector(
                        '[data-way-value="nome"]'
                    )
                        ?.textContent
                        .trim()
                    ||
                    '—';


                const telefone =
                    resumo.querySelector(
                        '[data-way-value="telefone"]'
                    )
                        ?.textContent
                        .trim()
                    ||
                    '—';


                const protocolo =
                    resumo.querySelector(
                        '[data-way-value="protocolo"]'
                    )
                        ?.textContent
                        .trim()
                    ||
                    '—';


                const textoPlano =
`👤 Nome: ${nome}
📱 Telefone: ${telefone}
🎫 Protocolo: ${protocolo}`;


                const html =
`<div>👤 <strong>Nome:</strong> ${escaparHTML(nome)}</div>
<div>📱 <strong>Telefone:</strong> ${escaparHTML(telefone)}</div>
<div>🎫 <strong>Protocolo:</strong> ${escaparHTML(protocolo)}</div>`;


                const sucesso =
                    await copiarConteudoRico(
                        textoPlano,
                        html
                    );


                if (
                    sucesso
                ) {

                    const original =
                        botaoTudo.innerHTML;


                    botaoTudo.innerHTML =
                        '✓ Copiado';


                    setTimeout(
                        function () {

                            botaoTudo.innerHTML =
                                original;
                        },

                        1000
                    );
                }
            }
        );


        const row =
            cabecalho.querySelector(
                ':scope > .row'
            );


        if (
            row
        ) {

            cabecalho.insertBefore(
                resumo,
                row
            );

        } else {

            cabecalho.appendChild(
                resumo
            );
        }


        return resumo;
    }


    /* =========================================================
       CONFIGURA RESUMO
       ========================================================= */

    function configurarResumoCliente(
        cabecalho
    ) {

        if (
            !CONFIG.exibirResumoCliente ||
            !cabecalho
        ) {

            return;
        }


        const nome =
            limparNomeCliente(
                extrairValorCampo(
                    cabecalho,
                    '.contato-nome',
                    /^Nome:\s*/i
                )
            );


        const telefone =
            formatarTelefone(
                extrairValorCampo(
                    cabecalho,
                    '.contato-telefone',
                    /^Telefone:\s*/i
                )
            );


        const protocolo =
            extrairValorCampo(
                cabecalho,
                '.atendimento-protocolo',
                /^(Número de protocolo|Protocolo):\s*/i
            );


        let resumo =
            cabecalho.querySelector(
                ':scope > .way-customer-summary'
            );


        if (
            !resumo
        ) {

            resumo =
                criarResumoCliente(
                    cabecalho
                );
        }


        const campoNome =
            resumo.querySelector(
                '[data-way-value="nome"]'
            );


        const campoTelefone =
            resumo.querySelector(
                '[data-way-value="telefone"]'
            );


        const campoProtocolo =
            resumo.querySelector(
                '[data-way-value="protocolo"]'
            );


        if (
            campoNome
        ) {

            campoNome.textContent =
                nome ||
                '—';
        }


        if (
            campoTelefone
        ) {

            campoTelefone.textContent =
                telefone ||
                '—';
        }


        if (
            campoProtocolo
        ) {

            campoProtocolo.textContent =
                protocolo ||
                '—';
        }


        cabecalho
            .querySelector(
                '.contato-nome'
            )
            ?.classList.add(
                'way-resumo-original-oculto'
            );


        cabecalho
            .querySelector(
                '.contato-telefone'
            )
            ?.classList.add(
                'way-resumo-original-oculto'
            );


        cabecalho
            .querySelector(
                '.atendimento-protocolo'
            )
            ?.classList.add(
                'way-resumo-original-oculto'
            );
    }


    /* =========================================================
       RODAPÉ
       ========================================================= */

    function removerRodape(
        contexto = document
    ) {

        if (
            !CONFIG.removerImagemRodape
        ) {

            return;
        }


        contexto
            .querySelectorAll?.(
                SELETOR_RODAPE
            )
            .forEach(
                imagem => {

                    imagem.remove();
                }
            );
    }


    /* =========================================================
       TAGS
       ========================================================= */

    function definirEstadoTags(
        tags,
        botao,
        mostrar
    ) {

        if (
            mostrar
        ) {

            tags.classList.remove(
                'way-tags-ocultas'
            );


            botao.innerHTML =
                '🏷 Ocultar tags';


            botao.classList.add(
                'way-tags-abertas'
            );

        } else {

            tags.classList.add(
                'way-tags-ocultas'
            );


            botao.innerHTML =
                '🏷 Mostrar tags';


            botao.classList.remove(
                'way-tags-abertas'
            );
        }
    }


    /* =========================================================
       CABEÇALHO
       ========================================================= */

    function configurarCabecalho(
        cabecalho
    ) {

        if (!cabecalho) {
            return;
        }


        configurarResumoCliente(
            cabecalho
        );


        const tags =
            cabecalho.querySelector(
                CLASSE_TAGS
            );


        if (!tags) {
            return;
        }


        if (
            cabecalho.querySelector(
                ':scope > .way-toggle-tags'
            )
        ) {

            return;
        }


        if (
            CONFIG.ocultarTags
        ) {

            tags.classList.add(
                'way-tags-ocultas'
            );
        }


        const botao =
            document.createElement(
                'button'
            );


        botao.type =
            'button';


        botao.className =
            'way-toggle-tags';


        botao.innerHTML =
            '🏷 Mostrar tags';


        botao.addEventListener(
            'click',

            function (
                event
            ) {

                event.preventDefault();

                event.stopPropagation();


                definirEstadoTags(
                    tags,
                    botao,
                    tags.classList.contains(
                        'way-tags-ocultas'
                    )
                );
            }
        );


        cabecalho.insertBefore(
            botao,
            cabecalho.firstChild
        );
    }


    /* =========================================================
       COMPACTA BOTTOM
       ========================================================= */

    function compactarBottom(
        contexto = document
    ) {

        contexto
            .querySelectorAll?.(
                SELETOR_ACOES
            )
            .forEach(
                toolbar => {

                    if (
                        toolbar.dataset
                            .wayCompacta ===
                            'true'
                    ) {

                        return;
                    }


                    toolbar.dataset
                        .wayCompacta =
                        'true';


                    const anterior =
                        toolbar
                            .previousElementSibling;


                    if (
                        anterior &&
                        anterior.tagName ===
                            'BR'
                    ) {

                        anterior
                            .classList
                            .add(
                                'way-gap-acoes'
                            );
                    }
                }
            );
    }


    /* =========================================================
       ABAS
       ========================================================= */

    function restaurarEstruturaAbas() {

        const tabs =
            document.querySelector(
                SELETOR_ABAS
            );


        const abas =
            document.querySelector(
                SELETOR_CONTEUDO_ABAS
            );


        if (
            !tabs ||
            !abas
        ) {

            return null;
        }


        const container =
            abas.parentElement;


        if (!container) {

            return null;
        }


        if (
            tabs.parentElement !==
                container ||
            tabs.nextElementSibling !==
                abas
        ) {

            container.insertBefore(
                tabs,
                abas
            );
        }


        document
            .getElementById(
                'way-tabs-placeholder'
            )
            ?.remove();


        return {
            tabs,
            abas,
            container
        };
    }


    function aplicarPosicaoAbas() {

        const estrutura =
            restaurarEstruturaAbas();


        if (!estrutura) {

            return;
        }


        const {
            tabs,
            abas,
            container
        } = estrutura;


        const tabbable =
            container
                .classList
                .contains(
                    'tabbable'
                )
                ?
                container
                :
                abas.closest(
                    '.tabbable'
                );


        if (!tabbable) {

            return;
        }


        if (
            POSICAO_ABAS ===
                'baixo'
        ) {

            tabbable
                .classList
                .add(
                    'way-layout-tabs-bottom'
                );


            tabs
                .classList
                .add(
                    'way-tabs-bottom'
                );

        } else {

            tabbable
                .classList
                .remove(
                    'way-layout-tabs-bottom'
                );


            tabs
                .classList
                .remove(
                    'way-tabs-bottom'
                );
        }
    }


    function definirPosicaoAbas(
        posicao
    ) {

        POSICAO_ABAS =
            posicao;


        GM_setValue(
            STORAGE_POSICAO_ABAS,
            posicao
        );


        aplicarPosicaoAbas();
    }


    /* =========================================================
       MENU
       ========================================================= */

    function criarMenuTampermonkey() {

        GM_registerMenuCommand(
            '⬆ Abas no topo',

            () =>

                definirPosicaoAbas(
                    'topo'
                )
        );


        GM_registerMenuCommand(
            '⬇ Abas embaixo',

            () =>

                definirPosicaoAbas(
                    'baixo'
                )
        );
    }


    /* =========================================================
       CONFIGURA TUDO
       ========================================================= */

    function configurarTodos() {

        document
            .querySelectorAll(
                CLASSE_CABECALHO
            )
            .forEach(
                configurarCabecalho
            );


        removerRodape();


        compactarBottom();


        aplicarPosicaoAbas();
    }


    /* =========================================================
       OBSERVER
       ========================================================= */

    function iniciarObserver() {

        let agendado =
            false;


        function atualizar() {

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


                    configurarTodos();
                }
            );
        }


        const observer =
            new MutationObserver(
                atualizar
            );


        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );
    }


    /* =========================================================
       ALT + T
       ========================================================= */

    document.addEventListener(
        'keydown',

        function (
            event
        ) {

            if (
                !event.altKey ||
                event.key
                    .toLowerCase() !==
                    't'
            ) {

                return;
            }


            event.preventDefault();


            const conversa =
                Array
                    .from(
                        document
                            .querySelectorAll(
                                '.conversa'
                            )
                    )
                    .find(
                        elemento =>
                            elemento
                                .offsetParent !==
                            null
                    );


            if (!conversa) {

                return;
            }


            const tags =
                conversa.querySelector(
                    CLASSE_TAGS
                );


            const botao =
                conversa.querySelector(
                    '.way-toggle-tags'
                );


            if (
                !tags ||
                !botao
            ) {

                return;
            }


            definirEstadoTags(
                tags,
                botao,
                tags
                    .classList
                    .contains(
                        'way-tags-ocultas'
                    )
            );
        },

        true
    );


    /* =========================================================
       ALT + B
       ========================================================= */

    document.addEventListener(
        'keydown',

        function (
            event
        ) {

            if (
                !event.altKey ||
                event.key
                    .toLowerCase() !==
                    'b'
            ) {

                return;
            }


            event.preventDefault();


            definirPosicaoAbas(
                POSICAO_ABAS ===
                    'topo'
                    ?
                    'baixo'
                    :
                    'topo'
            );
        },

        true
    );


    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    function iniciar() {

        adicionarCSS();


        criarMenuTampermonkey();


        configurarTodos();


        iniciarObserver();


        setInterval(
            configurarTodos,
            2500
        );


        console.log(
            '[Way Interface] Interface Compacta 3.4 ativa.'
        );


        console.log(
            '[Way Interface] Rascunho de Visita Técnica isolado por código de atendimento.'
        );


        console.log(
            '[Way Interface] Cache de visita usa somente sessionStorage.'
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
/*
 * O tema pertence somente ao Matrix. A Interface Compacta acima também é
 * usada no ERP, por isso o segundo componente fica protegido pelo domínio.
 */
if (window.location.hostname === "wayinternet.matrixdobrasil.ai") {
// ==UserScript==
// @name         Way Matrix - Light / Dark Mode
// @namespace    way-matrix-theme
// @version      1.1
// @description  Tema Light/Dark completo para o Matrix Way
// @match        https://wayinternet.matrixdobrasil.ai/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';


    /* =========================================================
       CONFIGURAÇÃO
       ========================================================= */

    const STORAGE_THEME =
        'way-matrix-theme';


    /*
     * Valores:
     *
     * light
     * dark
     * auto
     */
    let TEMA =
        GM_getValue(
            STORAGE_THEME,
            'auto'
        );


    /* =========================================================
       CSS
       ========================================================= */

    const CSS = `

        /* =====================================================
           VARIÁVEIS - LIGHT
           ===================================================== */

        :root,
        html.way-theme-light {

            --way-bg: #f4f6f8;
            --way-bg-secondary: #ffffff;
            --way-bg-tertiary: #f8f9fa;

            --way-surface: #ffffff;
            --way-surface-hover: #f1f3f5;
            --way-surface-active: #e8eef6;

            --way-border: #d9dee5;
            --way-border-soft: #e7eaee;

            --way-text: #252a30;
            --way-text-secondary: #616975;
            --way-text-muted: #89919c;

            --way-primary: #1687d9;
            --way-primary-hover: #0876c1;

            --way-input-bg: #ffffff;
            --way-input-text: #252a30;

            --way-message-client: #ffffff;
            --way-message-agent: #e7f3ff;

            --way-scrollbar: #bcc3cc;
            --way-scrollbar-hover: #9ca5b1;

            --way-shadow:
                0 2px 8px rgba(0, 0, 0, 0.08);

            color-scheme: light;
        }


        /* =====================================================
           VARIÁVEIS - DARK
           ===================================================== */

        html.way-theme-dark {

            --way-bg: #111418;
            --way-bg-secondary: #181c21;
            --way-bg-tertiary: #1d2228;

            --way-surface: #20252b;
            --way-surface-hover: #292f36;
            --way-surface-active: #303945;

            --way-border: #343b44;
            --way-border-soft: #2b3138;

            --way-text: #e7eaee;
            --way-text-secondary: #b8c0ca;
            --way-text-muted: #858f9b;

            --way-primary: #3a9ae8;
            --way-primary-hover: #57aaf0;

            --way-input-bg: #181d22;
            --way-input-text: #edf0f3;

            --way-message-client: #232930;
            --way-message-agent: #173653;

            --way-scrollbar: #444d57;
            --way-scrollbar-hover: #5c6773;

            --way-shadow:
                0 2px 10px rgba(0, 0, 0, 0.45);

            color-scheme: dark;
        }


        /* =====================================================
           FUNDO PRINCIPAL DO SISTEMA
           ===================================================== */

        html,
        body {

            background:
                var(--way-bg) !important;

            color:
                var(--way-text) !important;
        }


        .login-page:before,
        .error-page:before,
        #main-content {

            background:
                var(--way-bg) !important;
        }


        #main-content,
        #main-content > .row,
        #main-content > .row > [class*="col-"] {

            background-color:
                var(--way-bg) !important;
        }


        /*
         * Sobrescreve especificamente a regra original:
         *
         * .login-page:before,
         * .error-page:before,
         * #main-content {
         *     background: #e9f0f9;
         * }
         */

        html.way-theme-dark .login-page:before,
        html.way-theme-dark .error-page:before,
        html.way-theme-dark #main-content {

            background:
                #111418 !important;
        }


        /* =====================================================
           SCROLLBAR
           ===================================================== */

        body,
        body * {

            scrollbar-color:
                var(--way-scrollbar)
                transparent;
        }


        ::-webkit-scrollbar {

            width:
                9px;

            height:
                9px;
        }


        ::-webkit-scrollbar-track {

            background:
                transparent;
        }


        ::-webkit-scrollbar-thumb {

            background:
                var(--way-scrollbar);

            border-radius:
                10px;
        }


        ::-webkit-scrollbar-thumb:hover {

            background:
                var(--way-scrollbar-hover);
        }


        /* =====================================================
           TEXTO
           ===================================================== */

        body,
        p,
        span,
        small,
        label,
        strong,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {

            color:
                var(--way-text);
        }


        a {

            color:
                var(--way-primary);
        }


        a:hover {

            color:
                var(--way-primary-hover);
        }


        /* =====================================================
           CONTAINER PRINCIPAL
           ===================================================== */

        .box,
        .box-content,
        .tabbable,
        #Abas,
        .tab-content,
        .tab-pane {

            background:
                var(--way-bg-secondary) !important;

            color:
                var(--way-text) !important;
        }


        .box {

            border-color:
                var(--way-border) !important;

            box-shadow:
                var(--way-shadow) !important;
        }


        /* =====================================================
           CABEÇALHO
           ===================================================== */

        .cabecalho_msg,
        .well,
        .well-sm {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;

            box-shadow:
                none !important;
        }


        .cabecalho_msg small,
        .cabecalho_msg strong,
        .cabecalho_msg span {

            color:
                var(--way-text) !important;
        }


        /* =====================================================
           ABAS
           ===================================================== */

        #tabs {

            background:
                var(--way-bg-secondary) !important;

            border-color:
                var(--way-border) !important;
        }


        #tabs.nav-tabs {

            border-bottom-color:
                var(--way-border) !important;
        }


        #tabs > li {

            background:
                transparent !important;
        }


        #tabs > li > a {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text-secondary) !important;

            border-color:
                var(--way-border) !important;
        }


        #tabs > li > a:hover {

            background:
                var(--way-surface-hover) !important;

            color:
                var(--way-text) !important;
        }


        #tabs > li.active > a,
        #tabs > li.active > a:hover,
        #tabs > li.active > a:focus {

            background:
                var(--way-surface-active) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;

            border-bottom-color:
                var(--way-surface-active) !important;
        }


        #tabs .info small,
        #tabs .info label {

            color:
                var(--way-text) !important;
        }


        /* =====================================================
           CONVERSA
           ===================================================== */

        .conversa,
        .slimScrollDiv,
        ul.messages {

            background:
                var(--way-bg-secondary) !important;

            color:
                var(--way-text) !important;
        }


        /* =====================================================
           MENSAGENS
           ===================================================== */

        .messages > li {

            color:
                var(--way-text) !important;
        }


        .messages #body-msg {

            background:
                var(--way-message-client) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;

            box-shadow:
                0 1px 3px
                rgba(0, 0, 0, .25) !important;
        }


        .messages li.stripped-right #body-msg {

            background:
                var(--way-message-agent) !important;
        }


        .messages #body-msg p,
        .messages #body-msg span,
        .messages #body-msg h5,
        .messages #body-msg div {

            color:
                var(--way-text) !important;
        }


        .messages .time {

            color:
                var(--way-text-muted) !important;
        }


        html.way-theme-dark
        .messages
        .stripped-right
        .time {

            background:
                var(--way-message-agent) !important;

            color:
                var(--way-text-muted) !important;
        }


        html.way-theme-dark
        .messages
        li:not(.stripped-right)
        .time {

            background:
                var(--way-message-client) !important;

            color:
                var(--way-text-muted) !important;
        }


        /* =====================================================
           RESPOSTA CITADA
           ===================================================== */

        html.way-theme-dark
        .msg-resposta {

            background:
                #20262d !important;

            border:
                1px solid
                var(--way-border) !important;

            color:
                var(--way-text) !important;
        }


        html.way-theme-dark
        .msg-resposta .nom_membro,
        html.way-theme-dark
        .msg-resposta p,
        html.way-theme-dark
        .msg-resposta span {

            color:
                var(--way-text-secondary) !important;
        }


        /* =====================================================
           RESPONDENDO MENSAGEM
           ===================================================== */

        html.way-theme-dark
        .msg-responder {

            background:
                var(--way-bg-tertiary) !important;

            border:
                1px solid
                var(--way-border) !important;

            border-bottom:
                none !important;
        }


        html.way-theme-dark
        .body-msg-resp {

            background:
                var(--way-message-client) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;
        }


        /* =====================================================
           CAMPO DE MENSAGEM
           ===================================================== */

        .messages-input-form {

            background:
                var(--way-bg-secondary) !important;

            color:
                var(--way-text) !important;
        }


        .faketextbox,
        .faketextbox[contenteditable="true"],
        .txtMsg,
        textarea {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-input-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            border-radius:
                5px !important;

            caret-color:
                var(--way-text) !important;
        }


        .faketextbox:focus,
        textarea:focus,
        input:focus {

            border-color:
                var(--way-primary) !important;

            outline:
                none !important;

            box-shadow:
                0 0 0 1px
                var(--way-primary) !important;
        }


        input::placeholder,
        textarea::placeholder {

            color:
                var(--way-text-muted) !important;

            opacity:
                1 !important;
        }


        /* =====================================================
           ÍCONES DO CAMPO
           ===================================================== */

        .hsm_buttons a {

            color:
                var(--way-text-secondary) !important;
        }


        .hsm_buttons a:hover {

            color:
                var(--way-primary) !important;
        }


        /* =====================================================
           BOTÕES
           ===================================================== */

        .btn {

            border-color:
                var(--way-border);

            box-shadow:
                none !important;
        }


        .btn-default {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .btn-default:hover {

            background:
                var(--way-surface-hover) !important;
        }


        .acoes-agente {

            background:
                var(--way-bg-secondary) !important;
        }


        /* =====================================================
           INPUTS
           ===================================================== */

        input,
        textarea,
        select,
        .form-control {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-input-text) !important;

            border-color:
                var(--way-border) !important;

            box-shadow:
                none !important;
        }


        input[disabled],
        textarea[disabled],
        select[disabled] {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text-muted) !important;
        }


        .input-group-addon {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text-secondary) !important;

            border-color:
                var(--way-border) !important;
        }


        /* =====================================================
           DROPDOWN
           ===================================================== */

        .dropdown-menu {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                var(--way-shadow) !important;
        }


        .dropdown-menu > li > a {

            color:
                var(--way-text) !important;
        }


        .dropdown-menu > li > a:hover,
        .dropdown-menu > li > a:focus {

            background:
                var(--way-surface-hover) !important;

            color:
                var(--way-text) !important;
        }


        .dropdown-menu .divider {

            background:
                var(--way-border) !important;
        }


        /* =====================================================
           MODAIS
           ===================================================== */

        .modal-content {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                var(--way-shadow) !important;
        }


        .modal-header {

            border-bottom:
                1px solid
                var(--way-border) !important;
        }


        .modal-footer {

            border-top:
                1px solid
                var(--way-border) !important;
        }


        .modal-header .close {

            color:
                var(--way-text) !important;

            opacity:
                .8 !important;
        }


        /* =====================================================
           POPOVER
           ===================================================== */

        .popover {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                var(--way-shadow) !important;
        }


        .popover-title {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text) !important;

            border-bottom-color:
                var(--way-border) !important;
        }


        .popover-content {

            color:
                var(--way-text) !important;
        }


        /* =====================================================
           SETAS DO POPOVER
           ===================================================== */

        html.way-theme-dark
        .popover.top > .arrow {

            border-top-color:
                var(--way-border) !important;
        }


        html.way-theme-dark
        .popover.top > .arrow::after {

            border-top-color:
                var(--way-surface) !important;
        }


        html.way-theme-dark
        .popover.bottom > .arrow {

            border-bottom-color:
                var(--way-border) !important;
        }


        html.way-theme-dark
        .popover.bottom > .arrow::after {

            border-bottom-color:
                var(--way-surface) !important;
        }


        html.way-theme-dark
        .popover.left > .arrow {

            border-left-color:
                var(--way-border) !important;
        }


        html.way-theme-dark
        .popover.left > .arrow::after {

            border-left-color:
                var(--way-surface) !important;
        }


        html.way-theme-dark
        .popover.right > .arrow {

            border-right-color:
                var(--way-border) !important;
        }


        html.way-theme-dark
        .popover.right > .arrow::after {

            border-right-color:
                var(--way-surface) !important;
        }


        /* =====================================================
           TOOLTIP
           ===================================================== */

        .tooltip-inner {

            background:
                var(--way-text) !important;

            color:
                var(--way-bg-secondary) !important;
        }


        /* =====================================================
           CHOSEN
           ===================================================== */

        .chosen-container
        .chosen-choices,

        .chosen-container
        .chosen-single {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                none !important;
        }


        .chosen-container
        .chosen-drop {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border:
                1px solid
                var(--way-border) !important;
        }


        .chosen-container
        .chosen-results li {

            color:
                var(--way-text) !important;
        }


        .chosen-container
        .chosen-results li.highlighted {

            background:
                var(--way-primary) !important;

            color:
                #fff !important;
        }


        /* =====================================================
           SELECT2
           ===================================================== */

        .select2-container
        .select2-selection {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-input-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                none !important;
        }


        .select2-dropdown {

            background:
                var(--way-surface) !important;

            border:
                1px solid
                var(--way-border) !important;

            color:
                var(--way-text) !important;
        }


        .select2-search__field {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-input-text) !important;

            border:
                1px solid
                var(--way-border) !important;
        }


        .select2-results__option {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;
        }


        .select2-results__option--highlighted {

            background:
                var(--way-primary) !important;

            color:
                #fff !important;
        }


        /* =====================================================
           BOOTSTRAP TAGS INPUT
           ===================================================== */

        .bootstrap-tagsinput {

            background:
                var(--way-input-bg) !important;

            color:
                var(--way-input-text) !important;

            border:
                1px solid
                var(--way-border) !important;

            box-shadow:
                none !important;
        }


        /* =====================================================
           TABELAS
           ===================================================== */

        table {

            color:
                var(--way-text) !important;
        }


        .table {

            background:
                var(--way-bg-secondary) !important;

            border-color:
                var(--way-border) !important;
        }


        .table > thead > tr > th {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .table > tbody > tr > th,
        .table > tbody > tr > td {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .table-hover > tbody > tr:hover > td {

            background:
                var(--way-surface-hover) !important;
        }


        /* =====================================================
           ALERTAS
           ===================================================== */

        .alert {

            border-width:
                1px !important;

            box-shadow:
                none !important;
        }


        html.way-theme-dark
        .alert-warning {

            background:
                #493d1d !important;

            color:
                #f5dc8d !important;

            border-color:
                #665521 !important;
        }


        html.way-theme-dark
        .alert-info {

            background:
                #173c50 !important;

            color:
                #a9dff9 !important;

            border-color:
                #27566f !important;
        }


        html.way-theme-dark
        .alert-success {

            background:
                #173c2b !important;

            color:
                #a5e4bd !important;

            border-color:
                #265a3c !important;
        }


        html.way-theme-dark
        .alert-danger {

            background:
                #4a2024 !important;

            color:
                #f3b2b7 !important;

            border-color:
                #713038 !important;
        }


        /* =====================================================
           PAINÉIS
           ===================================================== */

        .panel,
        .panel-default {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .panel-heading {

            background:
                var(--way-bg-tertiary) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .panel-body {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;
        }


        .list-group-item {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        /* =====================================================
           PAGINAÇÃO
           ===================================================== */

        .pagination > li > a,
        .pagination > li > span {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;
        }


        .pagination > li > a:hover {

            background:
                var(--way-surface-hover) !important;
        }


        /* =====================================================
           FILTRO FLUTUANTE
           ===================================================== */

        #search-extras
        .search-extras-container {

            background:
                var(--way-surface) !important;

            color:
                var(--way-text) !important;

            border-color:
                var(--way-border) !important;

            box-shadow:
                var(--way-shadow) !important;
        }


        #search-extras
        .box-content {

            background:
                var(--way-surface) !important;
        }


        /* =====================================================
           HR / FIELDSET
           ===================================================== */

        hr {

            border-color:
                var(--way-border) !important;
        }


        fieldset {

            border-color:
                var(--way-border) !important;
        }


        /* =====================================================
           DARK MODE - CORREÇÃO DE BORDAS CLARAS
           ===================================================== */

        html.way-theme-dark .box,
        html.way-theme-dark .box-content,
        html.way-theme-dark .well,
        html.way-theme-dark .well-sm,
        html.way-theme-dark .panel,
        html.way-theme-dark .panel-default,
        html.way-theme-dark .panel-heading,
        html.way-theme-dark .panel-body,
        html.way-theme-dark .modal-content,
        html.way-theme-dark .modal-header,
        html.way-theme-dark .modal-footer,
        html.way-theme-dark .dropdown-menu,
        html.way-theme-dark .popover,
        html.way-theme-dark .list-group-item,
        html.way-theme-dark .tab-content,
        html.way-theme-dark .tab-pane,
        html.way-theme-dark #Abas,
        html.way-theme-dark #tabs,
        html.way-theme-dark .cabecalho_msg {

            border-color:
                var(--way-border) !important;
        }


        /*
         * Remove sombras claras do Bootstrap.
         */

        html.way-theme-dark .box,
        html.way-theme-dark .well,
        html.way-theme-dark .panel,
        html.way-theme-dark .form-control,
        html.way-theme-dark input,
        html.way-theme-dark textarea,
        html.way-theme-dark select,
        html.way-theme-dark .bootstrap-tagsinput,
        html.way-theme-dark .chosen-container .chosen-choices,
        html.way-theme-dark .chosen-container .chosen-single,
        html.way-theme-dark .select2-selection,
        html.way-theme-dark .select2-dropdown {

            box-shadow:
                none !important;

            -webkit-box-shadow:
                none !important;
        }


        /* =====================================================
           DARK - FUNDO DOS CONTAINERS
           ===================================================== */

        html.way-theme-dark
        #main-content,

        html.way-theme-dark
        #main-content > .row,

        html.way-theme-dark
        #main-content .col-md-12,

        html.way-theme-dark
        #main-content .col-lg-12,

        html.way-theme-dark
        .box-content {

            background-color:
                var(--way-bg) !important;
        }


        /*
         * O box-content do atendimento em si precisa
         * continuar utilizando uma superfície.
         */

        html.way-theme-dark
        .box > .box-content {

            background:
                var(--way-bg-secondary) !important;
        }


        /* =====================================================
           SELEÇÃO
           ===================================================== */

        ::selection {

            background:
                var(--way-primary);

            color:
                #fff;
        }


        /* =====================================================
           TRANSIÇÕES
           ===================================================== */

        body,
        #main-content,
        .box,
        .well,
        #tabs,
        #Abas,
        .conversa,
        .messages-input-form,
        .modal-content,
        .dropdown-menu {

            transition:
                background-color .18s ease,
                color .18s ease,
                border-color .18s ease;
        }


        /* =====================================================
           BOTÃO FLUTUANTE
           ===================================================== */

        #way-theme-toggle {

            position:
                fixed;

            right:
                16px;

            bottom:
                16px;

            z-index:
                99999999;

            width:
                38px;

            height:
                38px;

            border:
                1px solid
                var(--way-border);

            border-radius:
                50%;

            background:
                var(--way-surface);

            color:
                var(--way-text);

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            cursor:
                pointer;

            font-size:
                17px;

            box-shadow:
                var(--way-shadow);

            opacity:
                .88;

            transition:
                transform .15s ease,
                opacity .15s ease,
                background .15s ease;
        }


        #way-theme-toggle:hover {

            opacity:
                1;

            transform:
                scale(1.07);

            background:
                var(--way-surface-hover);
        }

    `;


    /* =========================================================
       INJETA CSS
       ========================================================= */

    function adicionarCSS() {

        if (
            document.getElementById(
                'way-matrix-theme-css'
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'way-matrix-theme-css';


        style.textContent =
            CSS;


        document.documentElement
            .appendChild(
                style
            );
    }


    /* =========================================================
       TEMA AUTOMÁTICO
       ========================================================= */

    function temaAutomatico() {

        return window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
            ?
            'dark'
            :
            'light';
    }


    function obterTemaReal() {

        if (
            TEMA ===
            'auto'
        ) {

            return temaAutomatico();
        }


        return TEMA;
    }


    /* =========================================================
       APLICA TEMA
       ========================================================= */

    function aplicarTema() {

        const html =
            document.documentElement;


        const real =
            obterTemaReal();


        html.classList.remove(
            'way-theme-light',
            'way-theme-dark'
        );


        html.classList.add(
            real === 'dark'
                ?
                'way-theme-dark'
                :
                'way-theme-light'
        );


        html.dataset.wayTheme =
            real;


        html.dataset.wayThemeMode =
            TEMA;


        atualizarBotaoTema();
    }


    /* =========================================================
       DEFINE TEMA
       ========================================================= */

    function definirTema(
        novoTema
    ) {

        if (
            ![
                'light',
                'dark',
                'auto'
            ].includes(
                novoTema
            )
        ) {

            return;
        }


        TEMA =
            novoTema;


        GM_setValue(
            STORAGE_THEME,
            TEMA
        );


        aplicarTema();
    }


    /* =========================================================
       ALTERNA LIGHT / DARK
       ========================================================= */

    function alternarTema() {

        const atual =
            obterTemaReal();


        definirTema(
            atual === 'dark'
                ?
                'light'
                :
                'dark'
        );
    }


    /* =========================================================
       BOTÃO FLUTUANTE
       ========================================================= */

    function criarBotaoTema() {

        if (
            document.getElementById(
                'way-theme-toggle'
            )
        ) {

            return;
        }


        if (
            !document.body
        ) {

            return;
        }


        const botao =
            document.createElement(
                'button'
            );


        botao.id =
            'way-theme-toggle';


        botao.type =
            'button';


        botao.addEventListener(
            'click',
            alternarTema
        );


        document.body.appendChild(
            botao
        );


        atualizarBotaoTema();
    }


    function atualizarBotaoTema() {

        const botao =
            document.getElementById(
                'way-theme-toggle'
            );


        if (!botao) {
            return;
        }


        const real =
            obterTemaReal();


        botao.textContent =
            real === 'dark'
                ?
                '☀'
                :
                '☾';


        botao.title =
            real === 'dark'
                ?
                'Ativar modo claro'
                :
                'Ativar modo escuro';
    }


    /* =========================================================
       MENU DO TAMPERMONKEY
       ========================================================= */

    function criarMenu() {

        GM_registerMenuCommand(
            '☀ Tema claro',
            function () {

                definirTema(
                    'light'
                );
            }
        );


        GM_registerMenuCommand(
            '☾ Tema escuro',
            function () {

                definirTema(
                    'dark'
                );
            }
        );


        GM_registerMenuCommand(
            '◐ Tema automático',
            function () {

                definirTema(
                    'auto'
                );
            }
        );
    }


    /* =========================================================
       ALT + D
       ========================================================= */

    document.addEventListener(
        'keydown',

        function (
            event
        ) {

            if (
                event.altKey &&
                event.key
                    .toLowerCase() ===
                    'd'
            ) {

                event.preventDefault();

                alternarTema();
            }
        },

        true
    );


    /* =========================================================
       ALTERAÇÃO DO TEMA DO WINDOWS
       ========================================================= */

    const mediaDark =
        window.matchMedia(
            '(prefers-color-scheme: dark)'
        );


    mediaDark.addEventListener?.(
        'change',

        function () {

            if (
                TEMA ===
                'auto'
            ) {

                aplicarTema();
            }
        }
    );


    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    function iniciar() {

        adicionarCSS();

        aplicarTema();

        criarMenu();


        if (
            document.body
        ) {

            criarBotaoTema();

        } else {

            document.addEventListener(
                'DOMContentLoaded',
                criarBotaoTema,
                {
                    once: true
                }
            );
        }


        console.log(
            '[Way Matrix Theme] Light/Dark Mode 1.1 ativo.'
        );


        console.log(
            '[Way Matrix Theme] Modo:',
            TEMA
        );


        console.log(
            '[Way Matrix Theme] Tema aplicado:',
            obterTemaReal()
        );
    }


    iniciar();

})();
}

/*
 * Tema exclusivo do ERP. As regras alteram somente cores, fundos, bordas
 * e sombras, preservando a estrutura e as dimensões definidas pelo sistema.
 */
if (window.location.hostname === "erp.internetway.com.br") {
// ==UserScript==
// @name         Way ERP - Light / Dark Mode
// @namespace    way-erp-theme
// @version      1.0
// @description  Tema claro, escuro ou automático para o ERP Way
// @match        https://erp.internetway.com.br/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_THEME_ERP =
        'way-erp-theme';

    const STYLE_ID_ERP =
        'way-erp-theme-css';

    const BUTTON_ID_ERP =
        'way-erp-theme-toggle';

    const EH_FRAME_PRINCIPAL =
        window.top === window.self;

    let TEMA_ERP =
        GM_getValue(
            STORAGE_THEME_ERP,
            'auto'
        );

    const CSS_ERP = `

        :root,
        html.way-erp-theme-light {
            --way-erp-bg: #f5f7fa;
            --way-erp-surface: #ffffff;
            --way-erp-surface-soft: #f2f5f8;
            --way-erp-surface-hover: #e9eef4;
            --way-erp-border: #d7dde5;
            --way-erp-border-soft: #e7ebf0;
            --way-erp-text: #242a31;
            --way-erp-text-secondary: #5f6975;
            --way-erp-text-muted: #808b98;
            --way-erp-primary: #1976d2;
            --way-erp-primary-hover: #125ea9;
            --way-erp-input-bg: #ffffff;
            --way-erp-shadow: 0 4px 16px rgba(25, 40, 55, .12);
            color-scheme: light;
        }

        html.way-erp-theme-dark {
            --way-erp-bg: #0f141a;
            --way-erp-surface: #171d24;
            --way-erp-surface-soft: #1d252e;
            --way-erp-surface-hover: #26313c;
            --way-erp-border: #34404d;
            --way-erp-border-soft: #293440;
            --way-erp-text: #edf2f7;
            --way-erp-text-secondary: #b8c2cd;
            --way-erp-text-muted: #8f9aa7;
            --way-erp-primary: #58a6ff;
            --way-erp-primary-hover: #7ab8ff;
            --way-erp-input-bg: #131a21;
            --way-erp-shadow: 0 6px 22px rgba(0, 0, 0, .42);
            color-scheme: dark;
        }

        /* Base do ERP moderno */
        html.way-erp-theme-dark,
        html.way-erp-theme-dark body,
        html.way-erp-theme-dark #root,
        html.way-erp-theme-dark #app,
        html.way-erp-theme-dark main {
            background-color: var(--way-erp-bg) !important;
            color: var(--way-erp-text) !important;
        }

        html.way-erp-theme-dark header,
        html.way-erp-theme-dark nav,
        html.way-erp-theme-dark aside {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        /* Superfícies Material UI */
        html.way-erp-theme-dark .MuiPaper-root:not(.MuiAlert-root),
        html.way-erp-theme-dark .MuiDrawer-paper,
        html.way-erp-theme-dark .MuiCard-root,
        html.way-erp-theme-dark .MuiAccordion-root,
        html.way-erp-theme-dark .MuiDialog-paper,
        html.way-erp-theme-dark .MuiPopover-paper,
        html.way-erp-theme-dark .MuiMenu-paper,
        html.way-erp-theme-dark .MuiTableContainer-root {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
            box-shadow: var(--way-erp-shadow) !important;
        }

        /* Painéis React do ERP usam classes JSS numéricas que mudam a cada build. */
        html.way-erp-theme-dark .MuiDialogContent-root,
        html.way-erp-theme-dark div[role="presentation"] > .MuiBox-root,
        html.way-erp-theme-dark div[role="presentation"] > div > .MuiBox-root:not([style*="background"]),
        html.way-erp-theme-dark div[role="presentation"] > .MuiBox-root + div {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .MuiDialogContent-root > div,
        html.way-erp-theme-dark .MuiDialogContent-root > div > div,
        html.way-erp-theme-dark .MuiDialogContent-root .MuiGrid-root,
        html.way-erp-theme-dark .MuiDialogContent-root .MuiBox-root:not([style*="background"]) {
            background-color: transparent !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border-soft) !important;
        }

        html.way-erp-theme-dark .MuiStepper-root,
        html.way-erp-theme-dark .MuiStep-root,
        html.way-erp-theme-dark .MuiStepButton-root,
        html.way-erp-theme-dark .MuiStepLabel-root {
            background-color: transparent !important;
            color: var(--way-erp-text) !important;
        }

        html.way-erp-theme-dark .MuiStepConnector-line {
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .MuiStepIcon-root.MuiStepIcon-active {
            color: var(--way-erp-primary) !important;
        }

        html.way-erp-theme-dark .MuiTypography-root,
        html.way-erp-theme-dark .MuiFormLabel-root,
        html.way-erp-theme-dark .MuiInputLabel-root,
        html.way-erp-theme-dark .MuiFormControlLabel-label,
        html.way-erp-theme-dark .MuiSvgIcon-root {
            color: var(--way-erp-text) !important;
        }

        html.way-erp-theme-dark .MuiTypography-colorTextSecondary {
            color: var(--way-erp-text-secondary) !important;
        }

        html.way-erp-theme-dark a,
        html.way-erp-theme-dark .MuiLink-root,
        html.way-erp-theme-dark .MuiButton-textPrimary,
        html.way-erp-theme-dark .MuiIconButton-colorPrimary {
            color: var(--way-erp-primary) !important;
        }

        html.way-erp-theme-dark a:hover,
        html.way-erp-theme-dark .MuiLink-root:hover {
            color: var(--way-erp-primary-hover) !important;
        }

        html.way-erp-theme-dark .MuiDivider-root,
        html.way-erp-theme-dark hr {
            background-color: var(--way-erp-border) !important;
            border-color: var(--way-erp-border) !important;
        }

        /* Campos de formulário */
        html.way-erp-theme-dark .MuiInputBase-root,
        html.way-erp-theme-dark .MuiOutlinedInput-root,
        html.way-erp-theme-dark .MuiFilledInput-root,
        html.way-erp-theme-dark input,
        html.way-erp-theme-dark textarea,
        html.way-erp-theme-dark select {
            background-color: var(--way-erp-input-bg) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .MuiOutlinedInput-notchedOutline,
        html.way-erp-theme-dark fieldset {
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .MuiInputBase-input::placeholder,
        html.way-erp-theme-dark input::placeholder,
        html.way-erp-theme-dark textarea::placeholder {
            color: var(--way-erp-text-muted) !important;
            opacity: 1 !important;
        }

        html.way-erp-theme-dark .MuiSelect-icon,
        html.way-erp-theme-dark .MuiInputAdornment-root {
            color: var(--way-erp-text-secondary) !important;
        }

        /* Listas, menus, tabelas e abas */
        html.way-erp-theme-dark .MuiListItem-root,
        html.way-erp-theme-dark .MuiMenuItem-root,
        html.way-erp-theme-dark .MuiTableCell-root,
        html.way-erp-theme-dark .MuiTab-root {
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border-soft) !important;
        }

        html.way-erp-theme-dark .MuiListItem-button:hover,
        html.way-erp-theme-dark .MuiMenuItem-root:hover,
        html.way-erp-theme-dark .MuiTableRow-root:hover,
        html.way-erp-theme-dark .MuiListItem-root.Mui-selected {
            background-color: var(--way-erp-surface-hover) !important;
        }

        html.way-erp-theme-dark .MuiTableHead-root,
        html.way-erp-theme-dark .MuiTableCell-head {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text-secondary) !important;
        }

        /* Tabelas React exibidas nos detalhes de contratos e conexões. */
        html.way-erp-theme-dark .ReactTable,
        html.way-erp-theme-dark .ReactTable .rt-table,
        html.way-erp-theme-dark .ReactTable .rt-tbody,
        html.way-erp-theme-dark .ReactTable .rt-tr-group,
        html.way-erp-theme-dark .ReactTable .pagination-bottom,
        html.way-erp-theme-dark .ReactTable .-loading,
        html.way-erp-theme-dark .ReactTable .-loading-inner {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .ReactTable .rt-thead,
        html.way-erp-theme-dark .ReactTable .rt-th {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text-secondary) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .ReactTable .rt-tr,
        html.way-erp-theme-dark .ReactTable .rt-td {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border-soft) !important;
        }

        html.way-erp-theme-dark .ReactTable .rt-tr.-even,
        html.way-erp-theme-dark .ReactTable .rt-tr-group:nth-child(even) .rt-tr {
            background-color: var(--way-erp-surface-soft) !important;
        }

        html.way-erp-theme-dark .ReactTable .rt-tr.-even > .rt-td,
        html.way-erp-theme-dark .ReactTable .rt-tr-group:nth-child(even) .rt-td {
            background-color: var(--way-erp-surface-soft) !important;
        }

        html.way-erp-theme-dark .ReactTable.-highlight .rt-tbody .rt-tr:hover,
        html.way-erp-theme-dark .ReactTable.-highlight .rt-tbody .rt-tr:hover > .rt-td {
            background-color: var(--way-erp-surface-hover) !important;
        }

        /* Editor de relato DevExtreme/Quill incorporado às solicitações. */
        html.way-erp-theme-dark .dx-htmleditor,
        html.way-erp-theme-dark .dx-htmleditor-toolbar-wrapper,
        html.way-erp-theme-dark .dx-htmleditor-toolbar,
        html.way-erp-theme-dark .dx-toolbar-items-container,
        html.way-erp-theme-dark .dx-quill-container,
        html.way-erp-theme-dark .ql-editor,
        html.way-erp-theme-dark .dx-overlay-content,
        html.way-erp-theme-dark .dx-popup-title,
        html.way-erp-theme-dark .dx-popup-content,
        html.way-erp-theme-dark .dx-popup-bottom,
        html.way-erp-theme-dark .dx-form,
        html.way-erp-theme-dark .dx-layout-manager {
            background-color: var(--way-erp-input-bg) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .dx-button,
        html.way-erp-theme-dark .dx-toolbar-button,
        html.way-erp-theme-dark .dx-dropdownmenu-button {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .dx-button:hover,
        html.way-erp-theme-dark .dx-toolbar-button:hover,
        html.way-erp-theme-dark .dx-dropdownmenu-button:hover {
            background-color: var(--way-erp-surface-hover) !important;
        }

        html.way-erp-theme-dark .dx-icon,
        html.way-erp-theme-dark .dx-button-text {
            color: var(--way-erp-text-secondary) !important;
        }

        html.way-erp-theme-dark .MuiButton-outlined,
        html.way-erp-theme-dark .MuiButton-text,
        html.way-erp-theme-dark .MuiIconButton-root {
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .MuiButton-outlined:hover,
        html.way-erp-theme-dark .MuiButton-text:hover,
        html.way-erp-theme-dark .MuiIconButton-root:hover {
            background-color: var(--way-erp-surface-hover) !important;
        }

        /* Componentes legados carregados pelo ERP */
        html.way-erp-theme-dark .content-wrapper,
        html.way-erp-theme-dark .main-content,
        html.way-erp-theme-dark .container-fluid,
        html.way-erp-theme-dark .box,
        html.way-erp-theme-dark .box-content,
        html.way-erp-theme-dark .panel,
        html.way-erp-theme-dark .panel-heading,
        html.way-erp-theme-dark .panel-body,
        html.way-erp-theme-dark .well,
        html.way-erp-theme-dark .modal-content,
        html.way-erp-theme-dark .modal-header,
        html.way-erp-theme-dark .modal-footer,
        html.way-erp-theme-dark .dropdown-menu,
        html.way-erp-theme-dark .popover,
        html.way-erp-theme-dark .list-group-item,
        html.way-erp-theme-dark .tab-content {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .table,
        html.way-erp-theme-dark .table > thead > tr > th,
        html.way-erp-theme-dark .table > tbody > tr > td,
        html.way-erp-theme-dark .table > tfoot > tr > td {
            background-color: transparent !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border-soft) !important;
        }

        html.way-erp-theme-dark .table-hover > tbody > tr:hover > td {
            background-color: var(--way-erp-surface-hover) !important;
        }

        html.way-erp-theme-dark .form-control,
        html.way-erp-theme-dark .select2-selection,
        html.way-erp-theme-dark .select2-dropdown,
        html.way-erp-theme-dark .chosen-container .chosen-single,
        html.way-erp-theme-dark .chosen-container .chosen-choices {
            background-color: var(--way-erp-input-bg) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .nav-tabs {
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .nav-tabs > li > a {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text-secondary) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .nav-tabs > li.active > a,
        html.way-erp-theme-dark .nav-tabs > li.active > a:hover {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-primary) !important;
        }

        html.way-erp-theme-dark .btn-default {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        /* Painel de tarefas e indicadores do ERP legado */
        html.way-erp-theme-dark .panel-content,
        html.way-erp-theme-dark #tasksLists,
        html.way-erp-theme-dark #tasks-indicators,
        html.way-erp-theme-dark ul.font-indicators.tasks-list {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark ul.font-indicators.tasks-list > li {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text-secondary) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark ul.font-indicators.tasks-list > li:hover,
        html.way-erp-theme-dark ul.font-indicators.tasks-list > li.selected {
            background-color: var(--way-erp-surface-hover) !important;
            color: var(--way-erp-text) !important;
        }

        html.way-erp-theme-dark ul.font-indicators.tasks-list > li p,
        html.way-erp-theme-dark ul.font-indicators.tasks-list > li span,
        html.way-erp-theme-dark ul.font-indicators.tasks-list > li i,
        html.way-erp-theme-dark ul.font-indicators.tasks-list > li .icon-check-empty {
            color: inherit !important;
            border-color: currentColor !important;
        }

        /* Mantém o significado visual dos estados sem clarear o painel. */
        html.way-erp-theme-dark .light-color {
            color: var(--way-erp-text-muted) !important;
        }

        html.way-erp-theme-dark .error-color {
            color: #ff7b72 !important;
        }

        html.way-erp-theme-dark .alert-color {
            color: #f2c94c !important;
        }

        html.way-erp-theme-dark .blue-color {
            color: var(--way-erp-primary) !important;
        }

        /* DataTables usado dentro do painel de tarefas */
        html.way-erp-theme-dark .datatable-container,
        html.way-erp-theme-dark .dataTables_wrapper,
        html.way-erp-theme-dark .dataTables_scroll,
        html.way-erp-theme-dark .dataTables_scrollHead,
        html.way-erp-theme-dark .dataTables_scrollHeadInner,
        html.way-erp-theme-dark .dataTables_scrollBody,
        html.way-erp-theme-dark .dataTables_toolbar,
        html.way-erp-theme-dark table.dataTable,
        html.way-erp-theme-dark table.synsuite-datatable {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark table.dataTable thead th,
        html.way-erp-theme-dark table.synsuite-datatable thead th {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text-secondary) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark table.dataTable tbody tr,
        html.way-erp-theme-dark table.dataTable tbody td,
        html.way-erp-theme-dark table.synsuite-datatable tbody tr,
        html.way-erp-theme-dark table.synsuite-datatable tbody td {
            background-color: var(--way-erp-surface) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border-soft) !important;
        }

        html.way-erp-theme-dark table.dataTable tbody tr:hover td,
        html.way-erp-theme-dark table.dataTable tbody tr.row_selected td,
        html.way-erp-theme-dark table.synsuite-datatable tbody tr:hover td,
        html.way-erp-theme-dark table.synsuite-datatable tbody tr.row_selected td {
            background-color: var(--way-erp-surface-hover) !important;
        }

        html.way-erp-theme-dark .dataTables_toolbar .button,
        html.way-erp-theme-dark .dataTables_toolbar button,
        html.way-erp-theme-dark .dataTables_filter,
        html.way-erp-theme-dark .dataTables_filter .add-on,
        html.way-erp-theme-dark .dataTables_info,
        html.way-erp-theme-dark .dataTables_processing {
            background-color: var(--way-erp-surface-soft) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark .dataTables_toolbar button:hover {
            background-color: var(--way-erp-surface-hover) !important;
        }

        html.way-erp-theme-dark .dataTables_toolbar svg path {
            fill: currentColor !important;
        }

        html.way-erp-theme-dark .dataTables_filter input {
            background-color: var(--way-erp-input-bg) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        html.way-erp-theme-dark pre,
        html.way-erp-theme-dark code {
            background-color: var(--way-erp-input-bg) !important;
            color: var(--way-erp-text) !important;
            border-color: var(--way-erp-border) !important;
        }

        /* Correção adaptativa para componentes com classes JSS dinâmicas. */
        html.way-erp-theme-dark .way-erp-adaptive-surface {
            background-color: var(--way-erp-surface) !important;
        }

        html.way-erp-theme-dark .way-erp-adaptive-surface-soft {
            background-color: var(--way-erp-surface-soft) !important;
        }

        html.way-erp-theme-dark .way-erp-adaptive-input {
            background-color: var(--way-erp-input-bg) !important;
        }

        html.way-erp-theme-dark .way-erp-adaptive-text {
            color: var(--way-erp-text) !important;
        }

        html.way-erp-theme-dark .way-erp-adaptive-text-secondary {
            color: var(--way-erp-text-secondary) !important;
        }

        html.way-erp-theme-dark .way-erp-adaptive-border {
            border-color: var(--way-erp-border) !important;
        }

        /* Rolagem */
        html.way-erp-theme-dark {
            scrollbar-color: #465564 transparent;
        }

        html.way-erp-theme-dark ::-webkit-scrollbar {
            width: 9px;
            height: 9px;
        }

        html.way-erp-theme-dark ::-webkit-scrollbar-track {
            background: transparent;
        }

        html.way-erp-theme-dark ::-webkit-scrollbar-thumb {
            background: #465564;
            border-radius: 10px;
        }

        /* Botão do tema: único elemento estrutural criado pelo recurso */
        #way-erp-theme-toggle {
            position: fixed;
            right: 16px;
            bottom: 16px;
            z-index: 1200;
            width: 38px;
            height: 38px;
            padding: 0;
            border: 1px solid var(--way-erp-border);
            border-radius: 50%;
            background: var(--way-erp-surface);
            color: var(--way-erp-text);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font: 600 17px/1 sans-serif;
            box-shadow: var(--way-erp-shadow);
            opacity: .9;
            transition:
                transform .15s ease,
                opacity .15s ease,
                background-color .15s ease;
        }

        #way-erp-theme-toggle:hover {
            opacity: 1;
            transform: scale(1.07);
            background: var(--way-erp-surface-hover);
        }

        body,
        .MuiPaper-root,
        .MuiInputBase-root,
        .box,
        .panel,
        .modal-content {
            transition:
                background-color .18s ease,
                color .18s ease,
                border-color .18s ease;
        }
    `;

    function adicionarCSSErp() {
        if (document.getElementById(STYLE_ID_ERP)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            STYLE_ID_ERP;

        style.textContent =
            CSS_ERP;

        document.documentElement.appendChild(style);
    }

    const SELETOR_ADAPTATIVO_ERP = [
        'body',
        'main',
        'header',
        'nav',
        'aside',
        'section',
        'article',
        'form',
        'fieldset',
        'div',
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'ul',
        'ol',
        'li',
        'label',
        'p',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'input',
        'textarea',
        'select',
        'button',
        '[contenteditable="true"]'
    ].join(',');

    const CLASSES_ADAPTATIVAS_ERP = [
        'way-erp-adaptive-surface',
        'way-erp-adaptive-surface-soft',
        'way-erp-adaptive-input',
        'way-erp-adaptive-text',
        'way-erp-adaptive-text-secondary',
        'way-erp-adaptive-border'
    ];

    const SELETOR_CORES_PRESERVADAS_ERP = [
        '.MuiAlert-root',
        '.MuiSnackbarContent-root',
        '.MuiBadge-badge',
        '.MuiChip-colorPrimary',
        '.MuiChip-colorSecondary',
        '.MuiButton-containedPrimary',
        '.MuiButton-containedSecondary',
        '.alert-success',
        '.alert-warning',
        '.alert-danger',
        '.alert-info',
        '.success-color',
        '.error-color',
        '.alert-color',
        '.blue-color'
    ].join(',');

    const RAIZ_ADAPTATIVA_ERP = new Set();

    let quadroAdaptativoErp =
        0;

    let observadorAdaptativoErp =
        null;

    function interpretarCorErp(valor) {
        const correspondencia =
            String(valor || '').match(
                /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
            );

        if (!correspondencia) {
            return null;
        }

        const vermelho =
            Number(correspondencia[1]);

        const verde =
            Number(correspondencia[2]);

        const azul =
            Number(correspondencia[3]);

        const alfa =
            correspondencia[4] === undefined
                ? 1
                : Number(correspondencia[4]);

        const canais = [
            vermelho,
            verde,
            azul
        ];

        const maximo =
            Math.max(...canais);

        const minimo =
            Math.min(...canais);

        const saturacao =
            maximo === 0
                ? 0
                : (maximo - minimo) / maximo;

        const linearizar = canal => {
            const normalizado =
                canal / 255;

            return normalizado <= 0.03928
                ? normalizado / 12.92
                : Math.pow(
                    (normalizado + 0.055) / 1.055,
                    2.4
                );
        };

        const luminancia =
            0.2126 * linearizar(vermelho) +
            0.7152 * linearizar(verde) +
            0.0722 * linearizar(azul);

        return {
            alfa,
            luminancia,
            saturacao
        };
    }

    function ehCorClaraNeutraErp(cor) {
        return Boolean(
            cor &&
            cor.alfa > 0.08 &&
            cor.luminancia >= 0.72 &&
            cor.saturacao <= 0.09
        );
    }

    function ehCorEscuraNeutraErp(cor) {
        return Boolean(
            cor &&
            cor.alfa > 0.08 &&
            cor.luminancia <= 0.32 &&
            cor.saturacao <= 0.16
        );
    }

    function devePreservarCorErp(elemento) {
        return Boolean(
            elemento.id === BUTTON_ID_ERP ||
            elemento.closest(`#${BUTTON_ID_ERP}`) ||
            elemento.matches(SELETOR_CORES_PRESERVADAS_ERP) ||
            elemento.closest(SELETOR_CORES_PRESERVADAS_ERP)
        );
    }

    function classeSuperficieAdaptativaErp(elemento) {
        if (
            elemento.matches(
                'input, textarea, select, [contenteditable="true"], .MuiInputBase-root, .MuiOutlinedInput-root, .MuiFilledInput-root, .dx-texteditor, .ql-editor'
            )
        ) {
            return 'way-erp-adaptive-input';
        }

        if (
            elemento.matches(
                'header, nav, thead, th, .MuiAppBar-root, .MuiToolbar-root, .MuiDialogTitle-root, .MuiDialogActions-root, .MuiTableHead-root, .rt-thead, .pagination-bottom, .dx-toolbar'
            )
        ) {
            return 'way-erp-adaptive-surface-soft';
        }

        return 'way-erp-adaptive-surface';
    }

    function normalizarElementoErp(elemento) {
        if (
            !(elemento instanceof Element) ||
            !elemento.isConnected ||
            elemento.matches(
                'html, script, style, link, meta, img, picture, video, canvas, iframe, svg, path, mask'
            ) ||
            devePreservarCorErp(elemento)
        ) {
            return;
        }

        let estilo;

        try {
            estilo =
                window.getComputedStyle(elemento);
        } catch (erro) {
            return;
        }

        const fundo =
            interpretarCorErp(
                estilo.backgroundColor
            );

        const texto =
            interpretarCorErp(
                estilo.color
            );

        if (ehCorClaraNeutraErp(fundo)) {
            elemento.classList.add(
                classeSuperficieAdaptativaErp(
                    elemento
                )
            );
        }

        if (ehCorEscuraNeutraErp(texto)) {
            elemento.classList.add(
                texto.luminancia <= 0.08
                    ? 'way-erp-adaptive-text'
                    : 'way-erp-adaptive-text-secondary'
            );
        }

        const coresDeBorda = [
            estilo.borderTopColor,
            estilo.borderRightColor,
            estilo.borderBottomColor,
            estilo.borderLeftColor
        ].map(interpretarCorErp);

        if (
            coresDeBorda.some(
                cor =>
                    ehCorClaraNeutraErp(cor) ||
                    ehCorEscuraNeutraErp(cor)
            )
        ) {
            elemento.classList.add(
                'way-erp-adaptive-border'
            );
        }
    }

    function normalizarSubarvoreErp(raiz) {
        if (!(raiz instanceof Element)) {
            return;
        }

        if (raiz.matches(SELETOR_ADAPTATIVO_ERP)) {
            normalizarElementoErp(raiz);
        }

        raiz
            .querySelectorAll(
                SELETOR_ADAPTATIVO_ERP
            )
            .forEach(normalizarElementoErp);
    }

    function executarNormalizacaoAdaptativaErp() {
        quadroAdaptativoErp =
            0;

        if (obterTemaRealErp() !== 'dark') {
            RAIZ_ADAPTATIVA_ERP.clear();
            return;
        }

        const raizes =
            Array.from(
                RAIZ_ADAPTATIVA_ERP
            );

        RAIZ_ADAPTATIVA_ERP.clear();

        raizes.forEach(
            normalizarSubarvoreErp
        );
    }

    function agendarNormalizacaoAdaptativaErp(raiz) {
        const elemento =
            raiz instanceof Element
                ? raiz
                : document.body ||
                    document.documentElement;

        if (!elemento) {
            return;
        }

        for (const raizPendente of RAIZ_ADAPTATIVA_ERP) {
            if (raizPendente.contains(elemento)) {
                return;
            }

            if (elemento.contains(raizPendente)) {
                RAIZ_ADAPTATIVA_ERP.delete(
                    raizPendente
                );
            }
        }

        RAIZ_ADAPTATIVA_ERP.add(
            elemento
        );

        if (quadroAdaptativoErp) {
            return;
        }

        quadroAdaptativoErp =
            window.requestAnimationFrame(
                executarNormalizacaoAdaptativaErp
            );
    }

    function observarNovasTelasErp() {
        if (
            observadorAdaptativoErp ||
            !document.documentElement
        ) {
            return;
        }

        observadorAdaptativoErp =
            new MutationObserver(
                mutacoes => {
                    if (
                        obterTemaRealErp() !==
                        'dark'
                    ) {
                        return;
                    }

                    mutacoes.forEach(
                        mutacao => {
                            if (
                                mutacao.type ===
                                'attributes'
                            ) {
                                agendarNormalizacaoAdaptativaErp(
                                    mutacao.target
                                );
                                return;
                            }

                            mutacao.addedNodes.forEach(
                                no => {
                                    if (no instanceof Element) {
                                        agendarNormalizacaoAdaptativaErp(
                                            no
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            );

        observadorAdaptativoErp.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'style'
                ]
            }
        );
    }

    function temaAutomaticoErp() {
        return window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
            ? 'dark'
            : 'light';
    }

    function obterTemaRealErp() {
        return TEMA_ERP === 'auto'
            ? temaAutomaticoErp()
            : TEMA_ERP;
    }

    function atualizarBotaoTemaErp() {
        const botao =
            document.getElementById(
                BUTTON_ID_ERP
            );

        if (!botao) {
            return;
        }

        const real =
            obterTemaRealErp();

        botao.textContent =
            real === 'dark'
                ? '☀'
                : '☾';

        botao.title =
            real === 'dark'
                ? 'ERP: ativar modo claro'
                : 'ERP: ativar modo escuro';

        botao.setAttribute(
            'aria-label',
            botao.title
        );
    }

    function aplicarTemaErp() {
        const html =
            document.documentElement;

        const real =
            obterTemaRealErp();

        html.classList.remove(
            'way-erp-theme-light',
            'way-erp-theme-dark'
        );

        html.classList.add(
            real === 'dark'
                ? 'way-erp-theme-dark'
                : 'way-erp-theme-light'
        );

        html.dataset.wayErpTheme =
            real;

        html.dataset.wayErpThemeMode =
            TEMA_ERP;

        atualizarBotaoTemaErp();

        if (real === 'dark') {
            agendarNormalizacaoAdaptativaErp(
                document.body ||
                    document.documentElement
            );
        }
    }

    function comunicarTemaAosFrames() {
        if (!EH_FRAME_PRINCIPAL) {
            return;
        }

        document
            .querySelectorAll('iframe')
            .forEach(
                frame => {
                    try {
                        frame.contentWindow?.postMessage(
                            {
                                source: 'way-tools',
                                type: 'way-erp-theme',
                                theme: TEMA_ERP
                            },
                            window.location.origin
                        );
                    } catch (erro) {
                        /* O frame pode pertencer a outro domínio. */
                    }
                }
            );
    }

    function definirTemaErp(
        novoTema
    ) {
        if (
            ![
                'light',
                'dark',
                'auto'
            ].includes(
                novoTema
            )
        ) {
            return;
        }

        TEMA_ERP =
            novoTema;

        GM_setValue(
            STORAGE_THEME_ERP,
            TEMA_ERP
        );

        aplicarTemaErp();
        comunicarTemaAosFrames();
    }

    function alternarTemaErp() {
        definirTemaErp(
            obterTemaRealErp() === 'dark'
                ? 'light'
                : 'dark'
        );
    }

    function criarBotaoTemaErp() {
        if (
            !EH_FRAME_PRINCIPAL ||
            !document.body ||
            document.getElementById(
                BUTTON_ID_ERP
            )
        ) {
            return;
        }

        const botao =
            document.createElement('button');

        botao.id =
            BUTTON_ID_ERP;

        botao.type =
            'button';

        botao.addEventListener(
            'click',
            alternarTemaErp
        );

        document.body.appendChild(
            botao
        );

        atualizarBotaoTemaErp();
    }

    function criarMenuTemaErp() {
        if (!EH_FRAME_PRINCIPAL) {
            return;
        }

        GM_registerMenuCommand(
            'ERP: ☀ Tema claro',
            () => definirTemaErp('light')
        );

        GM_registerMenuCommand(
            'ERP: ☾ Tema escuro',
            () => definirTemaErp('dark')
        );

        GM_registerMenuCommand(
            'ERP: ◐ Tema automático',
            () => definirTemaErp('auto')
        );
    }

    window.addEventListener(
        'message',
        event => {
            const dados =
                event.data;

            if (
                event.origin !==
                    window.location.origin ||
                dados?.source !==
                    'way-tools' ||
                dados?.type !==
                    'way-erp-theme' ||
                ![
                    'light',
                    'dark',
                    'auto'
                ].includes(
                    dados.theme
                )
            ) {
                return;
            }

            TEMA_ERP =
                dados.theme;

            aplicarTemaErp();
        }
    );

    if (EH_FRAME_PRINCIPAL) {
        document.addEventListener(
            'keydown',
            event => {
                if (
                    event.altKey &&
                    event.key
                        .toLowerCase() ===
                        'd'
                ) {
                    event.preventDefault();
                    alternarTemaErp();
                }
            },
            true
        );
    }

    const mediaDarkErp =
        window.matchMedia(
            '(prefers-color-scheme: dark)'
        );

    mediaDarkErp.addEventListener?.(
        'change',
        () => {
            if (TEMA_ERP === 'auto') {
                aplicarTemaErp();
            }
        }
    );

    function iniciarTemaErp() {
        adicionarCSSErp();
        aplicarTemaErp();
        observarNovasTelasErp();
        criarMenuTemaErp();

        if (document.body) {
            criarBotaoTemaErp();
        } else {
            document.addEventListener(
                'DOMContentLoaded',
                criarBotaoTemaErp,
                {
                    once: true
                }
            );
        }

        console.log(
            '[Way ERP Theme] Light/Dark Mode 1.0 ativo.'
        );

        console.log(
            '[Way ERP Theme] Modo:',
            TEMA_ERP
        );

        console.log(
            '[Way ERP Theme] Tema aplicado:',
            obterTemaRealErp()
        );
    }

    iniciarTemaErp();
})();
}

});
