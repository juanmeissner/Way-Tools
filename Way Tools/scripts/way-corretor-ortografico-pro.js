/*
 * Way Tools - Corretor Ortográfico PRO v3.2
 * Adaptado para ativação e armazenamento nativos da extensão.
 */

globalThis.WayToolsRuntime.run("way-corretor-ortografico-pro", (storage) => {
    "use strict";

    const localStorage = Object.freeze({
        getItem(key) {
            const value = storage.getValue(String(key), null);
            return value === null || value === undefined ? null : String(value);
        },

        setItem(key, value) {
            storage.setValue(String(key), String(value));
        }
    });
// ==UserScript==
// @name         Way - Corretor Ortográfico PRO
// @namespace    way-autocorrect
// @version      3.2
// @description  Corretor automático PT-BR focado em atendimento, suporte técnico e telecom
// @match        https://ia-nocodb.internetway.com.br/*
// @match        https://wayinternet.matrixdobrasil.ai/*
// @match        https://erp.internetway.com.br/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /* =========================================================
       CONFIGURAÇÕES
       ========================================================= */

    const CONFIG = {
        corrigirDigitacao: true,
        corrigirTextoColado: true,
        normalizarPontuacao: true,
        spellcheck: true,
        mostrarFeedback: true
    };

    const STORAGE_ATIVO = 'way-corretor-ativo';

    let CORRETOR_ATIVO =
        localStorage.getItem(STORAGE_ATIVO) !== 'false';

    /*
     * Atalhos:
     *
     * ALT + C
     * Liga/desliga o corretor.
     *
     * ALT + SHIFT + R
     * Revisa toda a mensagem atual.
     *
     * ALT + Z
     * Desfaz a última revisão completa.
     */


    /* =========================================================
       CAMPOS DE MENSAGEM
       ========================================================= */

    /*
     * Evitamos input[type=text] para não alterar:
     *
     * - CPF
     * - protocolo
     * - login
     * - e-mail
     * - pesquisa
     * - matrícula
     * - URLs
     *
     * Textareas continuam permitidos.
     */

    const SELETOR = [
        '.faketextbox.pastable[contenteditable="true"]',
        'div[id^="message-"][contenteditable="true"]',
        '.ProseMirror[contenteditable="true"]',
        'textarea'
    ].join(',');


    function encontrarCampo(target) {

        if (!(target instanceof Element)) {
            target = target?.parentElement;
        }

        return target?.closest?.(SELETOR) || null;
    }


    /* =========================================================
       DICIONÁRIO E MOTOR ORTOGRÁFICO
       ========================================================= */

    const STORAGE_DICIONARIO_PESSOAL =
        'way-corretor-dicionario-pessoal-v1';


    function carregarDicionarioPessoal() {

        const vazio = {
            corrections: {},
            ignored: []
        };


        try {

            const salvo =
                localStorage.getItem(
                    STORAGE_DICIONARIO_PESSOAL
                );


            if (!salvo) {
                return vazio;
            }


            const dados =
                JSON.parse(
                    salvo
                );


            return {
                corrections:
                    dados &&
                    typeof dados.corrections ===
                        'object' &&
                    !Array.isArray(
                        dados.corrections
                    )
                        ?
                        dados.corrections
                        :
                        {},
                ignored:
                    Array.isArray(
                        dados?.ignored
                    )
                        ?
                        dados.ignored
                        :
                        []
            };

        } catch (error) {

            console.warn(
                '[Way AutoCorrect PRO] Dicionário pessoal inválido:',
                error
            );

            return vazio;
        }
    }


    const DICIONARIO =
        globalThis
            .WAY_TOOLS_SPELLING_DICTIONARY;


    const MOTOR_FACTORY =
        globalThis
            .WayToolsSpellingEngine;


    if (
        !DICIONARIO ||
        !MOTOR_FACTORY
    ) {

        throw new Error(
            'Dicionário ou motor ortográfico não carregado.'
        );
    }


    const DICIONARIO_PESSOAL =
        carregarDicionarioPessoal();


    const MOTOR =
        MOTOR_FACTORY.create(
            {
                dictionary:
                    DICIONARIO,
                personal:
                    DICIONARIO_PESSOAL
            }
        );


    /* =========================================================
       CONTROLE DE REENTRADA
       ========================================================= */

    const EM_CORRECAO =
        new WeakSet();


    /* =========================================================
       HISTÓRICO DA REVISÃO COMPLETA
       ========================================================= */

    const HISTORICO =
        new WeakMap();


    /* =========================================================
       FEEDBACK VISUAL
       ========================================================= */

    function mostrarToast(
        mensagem,
        duracao = 1600
    ) {

        if (
            !CONFIG.mostrarFeedback
        ) {
            return;
        }


        let toast =
            document.getElementById(
                'way-autocorrect-toast'
            );


        if (!toast) {

            toast =
                document.createElement('div');


            toast.id =
                'way-autocorrect-toast';


            Object.assign(
                toast.style,
                {
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: '999999999',
                    padding: '9px 14px',
                    background: 'rgba(30,30,30,.92)',
                    color: '#fff',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontFamily: 'Arial, sans-serif',
                    boxShadow:
                        '0 3px 12px rgba(0,0,0,.25)',
                    pointerEvents: 'none',
                    transition:
                        'opacity .2s ease',
                    opacity: '0'
                }
            );


            document.documentElement
                .appendChild(
                    toast
                );
        }


        toast.textContent =
            mensagem;


        toast.style.opacity =
            '1';


        clearTimeout(
            toast._wayTimer
        );


        toast._wayTimer =
            setTimeout(
                () => {

                    toast.style.opacity =
                        '0';

                },
                duracao
            );
    }


    /* =========================================================
       OBTÉM CORREÇÃO
       ========================================================= */

    function obterCorrecao(
        palavra,
        tokenCompleto = palavra
    ) {

        return MOTOR.correctWord(
            palavra,
            tokenCompleto
        );
    }


    /* =========================================================
       ENCONTRA TOKEN COMPLETO
       ========================================================= */

    function tokenAoRedor(
        texto,
        inicio,
        fim
    ) {

        let esquerda =
            inicio;


        let direita =
            fim;


        while (
            esquerda > 0 &&
            !/\s/.test(
                texto[
                    esquerda - 1
                ]
            )
        ) {

            esquerda--;
        }


        while (
            direita < texto.length &&
            !/\s/.test(
                texto[
                    direita
                ]
            )
        ) {

            direita++;
        }


        return texto.substring(
            esquerda,
            direita
        );
    }


    /* =========================================================
       CORRIGE UM TEXTO COMPLETO
       ========================================================= */

    function corrigirTextoCompleto(
        texto
    ) {

        return MOTOR.correctText(
            texto,
            {
                normalizePunctuation:
                    CONFIG.normalizarPontuacao
            }
        );
    }


    /* =========================================================
       CORRIGE PALAVRA ANTES DO CURSOR - TEXTAREA
       ========================================================= */

    function corrigirPalavraTextarea(
        campo,
        exigirFinalizador = true
    ) {

        const posicao =
            campo.selectionStart;


        if (
            posicao === null
        ) {

            return;
        }


        const antes =
            campo.value.substring(
                0,
                posicao
            );


        const regex =
            exigirFinalizador
                ?
                /([\p{L}\p{N}][\p{L}\p{N}\p{M}-]*)([\s.,!?;:]+)$/u
                :
                /([\p{L}\p{N}][\p{L}\p{N}\p{M}-]*)$/u;


        const match =
            antes.match(
                regex
            );


        if (!match) {
            return;
        }


        const palavra =
            match[1];


        const final =
            match[2] || '';


        const inicio =
            posicao -
            palavra.length -
            final.length;


        const token =
            tokenAoRedor(
                campo.value,
                inicio,
                inicio +
                    palavra.length
            );


        const correcao =
            obterCorrecao(
                palavra,
                token
            );


        if (!correcao) {
            return;
        }


        EM_CORRECAO.add(
            campo
        );


        try {

            campo.setRangeText(
                correcao + final,
                inicio,
                posicao,
                'end'
            );

        } finally {

            EM_CORRECAO.delete(
                campo
            );
        }


        mostrarToast(
            `${palavra} → ${correcao}`
        );
    }


    /* =========================================================
       CORRIGE PALAVRA - CONTENTEDITABLE
       ========================================================= */

    function corrigirPalavraContentEditable(
        campo,
        exigirFinalizador = true
    ) {

        const selection =
            window.getSelection();


        if (
            !selection ||
            !selection.rangeCount
        ) {

            return;
        }


        const node =
            selection.focusNode;


        const offset =
            selection.focusOffset;


        if (
            !node ||
            node.nodeType !==
                Node.TEXT_NODE ||
            !campo.contains(
                node
            )
        ) {

            return;
        }


        const texto =
            node.nodeValue || '';


        const antes =
            texto.substring(
                0,
                offset
            );


        const regex =
            exigirFinalizador
                ?
                /([\p{L}\p{N}][\p{L}\p{N}\p{M}-]*)([\s.,!?;:]+)$/u
                :
                /([\p{L}\p{N}][\p{L}\p{N}\p{M}-]*)$/u;


        const match =
            antes.match(
                regex
            );


        if (!match) {
            return;
        }


        const palavra =
            match[1];


        const final =
            match[2] || '';


        const inicio =
            offset -
            palavra.length -
            final.length;


        const token =
            tokenAoRedor(
                texto,
                inicio,
                inicio +
                    palavra.length
            );


        const correcao =
            obterCorrecao(
                palavra,
                token
            );


        if (!correcao) {
            return;
        }


        /*
         * Seleciona palavra + espaço/pontuação.
         *
         * Usamos execCommand porque, apesar de
         * antigo, ainda é útil no Chrome para
         * preservar melhor o histórico Ctrl+Z
         * do contenteditable.
         */
        const range =
            document.createRange();


        range.setStart(
            node,
            inicio
        );


        range.setEnd(
            node,
            offset
        );


        selection.removeAllRanges();

        selection.addRange(
            range
        );


        EM_CORRECAO.add(
            campo
        );


        try {

            document.execCommand(
                'insertText',
                false,
                correcao + final
            );

        } finally {

            EM_CORRECAO.delete(
                campo
            );
        }


        mostrarToast(
            `${palavra} → ${correcao}`
        );
    }


    /* =========================================================
       CORRIGE PALAVRA DO CAMPO ATUAL
       ========================================================= */

    function corrigirPalavraAtual(
        campo,
        exigirFinalizador
    ) {

        if (
            campo instanceof
                HTMLTextAreaElement
        ) {

            corrigirPalavraTextarea(
                campo,
                exigirFinalizador
            );

            return;
        }


        if (
            campo.isContentEditable
        ) {

            corrigirPalavraContentEditable(
                campo,
                exigirFinalizador
            );
        }
    }


    /* =========================================================
       INPUT - CORREÇÃO APENAS APÓS FINALIZAR A PALAVRA
       ========================================================= */

    document.addEventListener(
        'input',

        function (event) {

            if (
                !CORRETOR_ATIVO ||
                !CONFIG.corrigirDigitacao
            ) {

                return;
            }


            const campo =
                encontrarCampo(
                    event.target
                );


            if (
                !campo ||
                EM_CORRECAO.has(
                    campo
                )
            ) {

                return;
            }


            /*
             * Só corrigimos automaticamente
             * quando o usuário FINALIZA
             * a palavra.
             *
             * Isso evita corrigir enquanto
             * ainda está digitando.
             */
            if (
                event.inputType ===
                    'insertText' &&
                event.data &&
                /^[\s.,!?;:]$/.test(
                    event.data
                )
            ) {

                corrigirPalavraAtual(
                    campo,
                    true
                );
            }

        },

        true
    );


    /* =========================================================
       ENTER
       ========================================================= */

    document.addEventListener(
        'keydown',

        function (event) {

            const campo =
                encontrarCampo(
                    event.target
                );


            if (!campo) {
                return;
            }


            /*
             * ENTER finaliza a palavra.
             */
            if (
                CORRETOR_ATIVO &&
                event.key === 'Enter'
            ) {

                corrigirPalavraAtual(
                    campo,
                    false
                );
            }


            /*
             * ALT + C
             *
             * Liga/desliga.
             */
            if (
                event.altKey &&
                !event.shiftKey &&
                event.key.toLowerCase() ===
                    'c'
            ) {

                event.preventDefault();


                CORRETOR_ATIVO =
                    !CORRETOR_ATIVO;


                localStorage.setItem(
                    STORAGE_ATIVO,
                    String(
                        CORRETOR_ATIVO
                    )
                );


                mostrarToast(
                    CORRETOR_ATIVO
                        ?
                        '✓ Corretor ativado'
                        :
                        '○ Corretor desativado',
                    2200
                );
            }


            /*
             * ALT + SHIFT + R
             *
             * Revisa mensagem inteira.
             */
            if (
                event.altKey &&
                event.shiftKey &&
                event.key.toLowerCase() ===
                    'r'
            ) {

                event.preventDefault();


                revisarCampoInteiro(
                    campo,
                    true
                );
            }


            /*
             * ALT + Z
             *
             * Desfaz última REVISÃO COMPLETA.
             *
             * Ctrl+Z continua reservado
             * ao comportamento nativo.
             */
            if (
                event.altKey &&
                !event.shiftKey &&
                event.key.toLowerCase() ===
                    'z'
            ) {

                event.preventDefault();


                desfazerRevisao(
                    campo
                );
            }

        },

        true
    );


    /* =========================================================
       REVISÃO DE TEXTAREA INTEIRO
       ========================================================= */

    function revisarTextarea(
        campo
    ) {

        const original =
            campo.value;


        const inicioSelecao =
            campo.selectionStart || 0;


        /*
         * Corrige também o texto anterior
         * ao cursor para estimar a nova
         * posição dele.
         */
        const prefixoOriginal =
            original.substring(
                0,
                inicioSelecao
            );


        const corrigido =
            corrigirTextoCompleto(
                original
            );


        if (
            corrigido === original
        ) {

            return false;
        }


        HISTORICO.set(
            campo,
            {
                tipo: 'textarea',
                conteudo: original,
                inicioSelecao:
                    campo.selectionStart,
                fimSelecao:
                    campo.selectionEnd
            }
        );


        const prefixoCorrigido =
            corrigirTextoCompleto(
                prefixoOriginal
            );


        EM_CORRECAO.add(
            campo
        );


        campo.value =
            corrigido;


        campo.setSelectionRange(
            prefixoCorrigido.length,
            prefixoCorrigido.length
        );


        EM_CORRECAO.delete(
            campo
        );


        campo.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );


        return true;
    }


    /* =========================================================
       REVISÃO DE CONTENTEDITABLE
       ========================================================= */

    function revisarContentEditable(
        campo
    ) {

        const selection =
            window.getSelection();


        const focusNode =
            selection?.focusNode;


        const focusOffset =
            selection?.focusOffset;


        const htmlOriginal =
            campo.innerHTML;


        HISTORICO.set(
            campo,
            {
                tipo:
                    'contenteditable',
                conteudo:
                    htmlOriginal
            }
        );


        const walker =
            document.createTreeWalker(
                campo,
                NodeFilter.SHOW_TEXT
            );


        const nodes = [];


        let atual;


        while (
            atual =
                walker.nextNode()
        ) {

            nodes.push(
                atual
            );
        }


        let alterou =
            false;


        let novoOffset =
            focusOffset;


        EM_CORRECAO.add(
            campo
        );


        try {

            nodes.forEach(
                node => {

                    const original =
                        node.nodeValue ||
                        '';


                    /*
                     * Se o cursor estiver dentro
                     * deste TextNode, calculamos
                     * o novo offset.
                     */
                    if (
                        node === focusNode &&
                        typeof focusOffset ===
                            'number'
                    ) {

                        const prefixo =
                            original.substring(
                                0,
                                focusOffset
                            );


                        novoOffset =
                            corrigirTextoCompleto(
                                prefixo
                            ).length;
                    }


                    const corrigido =
                        corrigirTextoCompleto(
                            original
                        );


                    if (
                        corrigido !==
                            original
                    ) {

                        node.nodeValue =
                            corrigido;


                        alterou =
                            true;
                    }
                }
            );

        } finally {

            EM_CORRECAO.delete(
                campo
            );
        }


        /*
         * Restaura cursor.
         */
        if (
            alterou &&
            focusNode &&
            focusNode.isConnected &&
            focusNode.nodeType ===
                Node.TEXT_NODE
        ) {

            try {

                const range =
                    document.createRange();


                const limite =
                    Math.min(
                        novoOffset,
                        focusNode.nodeValue
                            .length
                    );


                range.setStart(
                    focusNode,
                    limite
                );


                range.collapse(
                    true
                );


                selection.removeAllRanges();

                selection.addRange(
                    range
                );

            } catch (_) {
                // Ignora erro de cursor.
            }
        }


        if (
            alterou
        ) {

            campo.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );
        }


        return alterou;
    }


    /* =========================================================
       REVISÃO COMPLETA
       ========================================================= */

    function revisarCampoInteiro(
        campo,
        feedback = false
    ) {

        if (
            !campo ||
            !CORRETOR_ATIVO
        ) {

            return;
        }


        let alterou =
            false;


        if (
            campo instanceof
                HTMLTextAreaElement
        ) {

            alterou =
                revisarTextarea(
                    campo
                );

        } else if (
            campo.isContentEditable
        ) {

            alterou =
                revisarContentEditable(
                    campo
                );
        }


        if (
            feedback
        ) {

            mostrarToast(
                alterou
                    ?
                    '✓ Mensagem revisada'
                    :
                    '✓ Nenhuma correção necessária',
                2200
            );


            verificarContexto(
                campo
            );
        }
    }


    /* =========================================================
       DESFAZER REVISÃO COMPLETA
       ========================================================= */

    function desfazerRevisao(
        campo
    ) {

        const historico =
            HISTORICO.get(
                campo
            );


        if (
            !historico
        ) {

            mostrarToast(
                'Nenhuma revisão para desfazer'
            );

            return;
        }


        EM_CORRECAO.add(
            campo
        );


        try {

            if (
                historico.tipo ===
                    'textarea'
            ) {

                campo.value =
                    historico.conteudo;


                const inicio =
                    historico.inicioSelecao ??
                    campo.value.length;


                const fim =
                    historico.fimSelecao ??
                    inicio;


                campo.setSelectionRange(
                    inicio,
                    fim
                );

            } else {

                campo.innerHTML =
                    historico.conteudo;
            }

        } finally {

            EM_CORRECAO.delete(
                campo
            );
        }


        HISTORICO.delete(
            campo
        );


        campo.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );


        mostrarToast(
            '↶ Revisão desfeita'
        );
    }


    /* =========================================================
       TEXTO COLADO
       ========================================================= */

    function clipboardTemImagem(
        clipboard
    ) {

        if (
            !clipboard?.items
        ) {

            return false;
        }


        return Array.from(
            clipboard.items
        ).some(
            item =>
                item.type?.startsWith(
                    'image/'
                )
        );
    }


    /*
     * Usamos WINDOW em capture.
     *
     * Assim esta rotina é acionada antes
     * do listener de paste do outro
     * userscript responsável pela colagem.
     *
     * Não bloqueamos o evento.
     */
    window.addEventListener(
        'paste',

        function (event) {

            if (
                !CORRETOR_ATIVO ||
                !CONFIG.corrigirTextoColado
            ) {

                return;
            }


            /*
             * Não mexe na colagem de imagem.
             */
            if (
                clipboardTemImagem(
                    event.clipboardData
                )
            ) {

                return;
            }


            const campo =
                encontrarCampo(
                    event.target
                );


            if (!campo) {
                return;
            }


            /*
             * Espera o Chrome/Matrix/Tampermonkey
             * terminar a colagem.
             */
            setTimeout(
                () => {

                    revisarCampoInteiro(
                        campo,
                        false
                    );

                },
                20
            );

        },

        true
    );


    /* =========================================================
       SUGESTÕES CONTEXTUAIS
       ========================================================= */

    function textoDoCampo(
        campo
    ) {

        if (
            campo instanceof
                HTMLTextAreaElement
        ) {

            return campo.value;
        }


        return campo.innerText ||
            campo.textContent ||
            '';
    }


    function verificarContexto(
        campo
    ) {

        const sugestoes =
            MOTOR.contextualSuggestions(
                textoDoCampo(
                    campo
                )
            );


        if (
            sugestoes.length ===
                0
        ) {

            return;
        }


        const limite =
            sugestoes.slice(
                0,
                2
            );


        const complemento =
            sugestoes.length >
                limite.length
                ?
                ` • +${sugestoes.length - limite.length} ponto(s) para revisar`
                :
                '';


        setTimeout(
            () => {

                mostrarToast(
                    `⚠ ${limite.join(' • ')}${complemento}`,
                    6000
                );

            },
            350
        );
    }


    /* =========================================================
       SPELLCHECK
       ========================================================= */

    function prepararCampo(
        campo
    ) {

        if (
            CONFIG.spellcheck
        ) {

            campo.setAttribute(
                'spellcheck',
                'true'
            );


            campo.setAttribute(
                'lang',
                'pt-BR'
            );
        }


        campo.setAttribute(
            'autocapitalize',
            'sentences'
        );
    }


    function prepararCampos() {

        document
            .querySelectorAll(
                SELETOR
            )
            .forEach(
                prepararCampo
            );
    }


    /* =========================================================
       CAMPOS CRIADOS DINAMICAMENTE
       ========================================================= */

    function iniciarObserver() {

        const observer =
            new MutationObserver(
                function (mutations) {

                    for (
                        const mutation
                        of mutations
                    ) {

                        mutation
                            .addedNodes
                            .forEach(
                                node => {

                                    if (
                                        !(
                                            node instanceof
                                            Element
                                        )
                                    ) {

                                        return;
                                    }


                                    if (
                                        node.matches?.(
                                            SELETOR
                                        )
                                    ) {

                                        prepararCampo(
                                            node
                                        );
                                    }


                                    node
                                        .querySelectorAll?.(
                                            SELETOR
                                        )
                                        .forEach(
                                            prepararCampo
                                        );
                                }
                            );
                    }
                }
            );


        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );
    }


    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    function iniciar() {

        prepararCampos();

        iniciarObserver();


        /*
         * Segurança para sistemas que
         * recriam campos dinamicamente.
         */
        setInterval(
            prepararCampos,
            2000
        );


        console.log(
            '[Way AutoCorrect PRO] iniciado.'
        );


        console.log(
            '[Way AutoCorrect PRO]',
            MOTOR.counts.corrections,
            'correções ortográficas.'
        );


        console.log(
            '[Way AutoCorrect PRO]',
            MOTOR.counts.terms,
            'termos técnicos padronizados.'
        );


        if (
            MOTOR.counts
                .personalCorrections >
                0
        ) {

            console.log(
                '[Way AutoCorrect PRO]',
                MOTOR.counts
                    .personalCorrections,
                'correções pessoais carregadas.'
            );
        }


        console.log(
            '[Way AutoCorrect PRO] Estado:',
            CORRETOR_ATIVO
                ?
                'ATIVO'
                :
                'DESATIVADO'
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
