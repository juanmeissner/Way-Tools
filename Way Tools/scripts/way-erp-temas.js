/*
 * Way Tools - ERP Tema Claro/Escuro v1.0
 * Tema visual do ERP isolado da Interface Compacta.
 */

globalThis.WayToolsRuntime.run("way-erp-temas", (storage) => {
    "use strict";

    const GM_getValue = storage.getValue;
    const GM_setValue = storage.setValue;
    const GM_registerMenuCommand = (label, callback) =>
        globalThis.WayToolsRuntime.registerMenuCommand("way-erp-temas", label, callback);

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
