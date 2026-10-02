/*
 * Way Tools - Matrix Tema Claro/Escuro v1.1
 * Tema do Matrix isolado da interface compacta e dos módulos do ERP.
 */

globalThis.WayToolsRuntime.run("matrix-temas", (storage) => {
    "use strict";

    const GM_getValue = storage.getValue;
    const GM_setValue = storage.setValue;
    const GM_registerMenuCommand = (label, callback) =>
        globalThis.WayToolsRuntime.registerMenuCommand("matrix-temas", label, callback);

/*
 * Tema do Matrix incorporado ao módulo exclusivo de interface do Matrix.
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

});
