/*
 * Way Tools - Matrix Corrigir Colagem v3.5
 * Preserva quebras, negrito e a colagem nativa de imagens no Matrix.
 */

globalThis.WayToolsRuntime.run("matrix-corrigir-colagem", () => {
    "use strict";

// ==UserScript==
// @name         Matrix - Corrigir Colagem
// @namespace    matrix-way
// @version      3.5
// @description  Preserva quebras, negrito e permite colar imagens com Ctrl+V
// @match        https://wayinternet.matrixdobrasil.ai/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const SELETOR =
        '.faketextbox.pastable[contenteditable="true"], div[id^="message-"][contenteditable="true"]';


    /*
     * Prepara visualmente o campo.
     *
     * IMPORTANTE:
     * Não removemos mais o onpaste original.
     *
     * Isso permite que o próprio sistema continue
     * recebendo eventos relacionados a imagens.
     */
    function corrigirCampo(campo) {

        if (!campo) return;

        campo.style.whiteSpace = 'pre-wrap';
        campo.style.overflowWrap = 'break-word';
        campo.style.wordBreak = 'break-word';
    }


    function corrigirTodos() {

        document
            .querySelectorAll(SELETOR)
            .forEach(corrigirCampo);
    }


    /*
     * Adiciona quantidade controlada
     * de quebras de linha.
     */
    function adicionarQuebras(pai, quantidade) {

        let existentes = 0;
        let atual = pai.lastChild;

        while (
            atual &&
            atual.nodeName === 'BR'
        ) {

            existentes++;
            atual = atual.previousSibling;
        }


        for (
            let i = existentes;
            i < quantidade;
            i++
        ) {

            pai.appendChild(
                document.createElement('br')
            );
        }
    }


    /*
     * Limpa HTML copiado.
     *
     * Mantém:
     *
     * - texto
     * - espaços
     * - STRONG / B
     * - BR
     * - parágrafos
     * - listas
     *
     * Remove:
     *
     * - cores
     * - backgrounds
     * - fontes
     * - estilos
     * - spans
     * - links
     */
    function limparHTML(html) {

        const origem =
            document.createElement('div');

        origem.innerHTML = html;


        const destino =
            document.createElement('div');


        function processar(node, pai) {

            /*
             * TEXTO
             *
             * Não usamos trim(),
             * pois os espaços precisam permanecer.
             */
            if (
                node.nodeType === Node.TEXT_NODE
            ) {

                pai.appendChild(
                    document.createTextNode(
                        node.textContent
                    )
                );

                return;
            }


            if (
                node.nodeType !== Node.ELEMENT_NODE
            ) {

                return;
            }


            const tag =
                node.tagName.toUpperCase();


            /*
             * Elementos descartados.
             */
            if (
                [
                    'SCRIPT',
                    'STYLE',
                    'META',
                    'LINK',
                    'IFRAME',
                    'OBJECT',
                    'SVG'
                ].includes(tag)
            ) {

                return;
            }


            /*
             * NEGRITO
             */
            if (
                tag === 'STRONG' ||
                tag === 'B'
            ) {

                const strong =
                    document.createElement('strong');


                node.childNodes.forEach(
                    filho => {

                        processar(
                            filho,
                            strong
                        );

                    }
                );


                if (
                    strong.textContent.length > 0
                ) {

                    pai.appendChild(
                        strong
                    );
                }

                return;
            }


            /*
             * BR
             */
            if (
                tag === 'BR'
            ) {

                pai.appendChild(
                    document.createElement('br')
                );

                return;
            }


            /*
             * PARÁGRAFO
             *
             * Dois BR = uma linha vazia
             * entre os parágrafos.
             */
            if (
                tag === 'P'
            ) {

                node.childNodes.forEach(
                    filho => {

                        processar(
                            filho,
                            pai
                        );

                    }
                );


                if (
                    node.textContent.trim().length > 0 ||
                    node.querySelector('br')
                ) {

                    adicionarQuebras(
                        pai,
                        2
                    );
                }

                return;
            }


            /*
             * DIV
             *
             * Uma quebra simples.
             */
            if (
                tag === 'DIV'
            ) {

                node.childNodes.forEach(
                    filho => {

                        processar(
                            filho,
                            pai
                        );

                    }
                );


                if (
                    node.textContent.trim().length > 0 ||
                    node.querySelector('br')
                ) {

                    adicionarQuebras(
                        pai,
                        1
                    );
                }

                return;
            }


            /*
             * ITEM DE LISTA
             */
            if (
                tag === 'LI'
            ) {

                pai.appendChild(
                    document.createTextNode('• ')
                );


                node.childNodes.forEach(
                    filho => {

                        processar(
                            filho,
                            pai
                        );

                    }
                );


                adicionarQuebras(
                    pai,
                    1
                );

                return;
            }


            /*
             * UL / OL
             */
            if (
                tag === 'UL' ||
                tag === 'OL'
            ) {

                node.childNodes.forEach(
                    filho => {

                        processar(
                            filho,
                            pai
                        );

                    }
                );

                return;
            }


            /*
             * SPAN / A / FONT / EM etc.
             *
             * A tag é descartada,
             * mas o conteúdo permanece.
             */
            node.childNodes.forEach(
                filho => {

                    processar(
                        filho,
                        pai
                    );

                }
            );
        }


        origem.childNodes.forEach(
            node => {

                processar(
                    node,
                    destino
                );

            }
        );


        /*
         * Detecta texto vazio somente
         * nas extremidades.
         */
        function textoSoEspaco(node) {

            return (
                node &&
                node.nodeType === Node.TEXT_NODE &&
                node.textContent.trim() === ''
            );
        }


        /*
         * Remove BR/espaços do começo.
         */
        while (
            destino.firstChild &&
            (
                destino.firstChild.nodeName === 'BR' ||
                textoSoEspaco(
                    destino.firstChild
                )
            )
        ) {

            destino.removeChild(
                destino.firstChild
            );
        }


        /*
         * Remove BR/espaços do final.
         */
        while (
            destino.lastChild &&
            (
                destino.lastChild.nodeName === 'BR' ||
                textoSoEspaco(
                    destino.lastChild
                )
            )
        ) {

            destino.removeChild(
                destino.lastChild
            );
        }


        /*
         * No máximo 2 BR consecutivos.
         */
        let consecutivos = 0;

        Array.from(
            destino.childNodes
        ).forEach(
            node => {

                if (
                    node.nodeName === 'BR'
                ) {

                    consecutivos++;

                    if (
                        consecutivos > 2
                    ) {

                        node.remove();
                    }

                } else {

                    consecutivos = 0;
                }

            }
        );


        return destino.innerHTML;
    }


    /*
     * Texto puro -> HTML.
     */
    function textoParaHTML(texto) {

        texto =
            texto
                .replace(
                    /\r\n/g,
                    '\n'
                )
                .replace(
                    /\r/g,
                    '\n'
                );


        /*
         * Remove linhas vazias somente
         * das extremidades.
         */
        texto =
            texto
                .replace(
                    /^\n+/,
                    ''
                )
                .replace(
                    /\n+$/,
                    ''
                );


        /*
         * Escapa HTML.
         */
        texto =
            texto
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
                );


        /*
         * Cada quebra vira BR.
         */
        return texto.replace(
            /\n/g,
            '<br>'
        );
    }


    /*
     * Insere conteúdo no cursor.
     */
    function inserirHTMLNoCursor(
        campo,
        html
    ) {

        campo.focus();


        const selection =
            window.getSelection();


        let range;


        if (
            selection.rangeCount > 0
        ) {

            range =
                selection.getRangeAt(0);

        } else {

            range =
                document.createRange();

            range.selectNodeContents(
                campo
            );

            range.collapse(false);

            selection.removeAllRanges();

            selection.addRange(
                range
            );
        }


        /*
         * Se o cursor estiver fora do campo,
         * posiciona no final.
         */
        if (
            !campo.contains(
                range.commonAncestorContainer
            ) &&
            campo !==
                range.commonAncestorContainer
        ) {

            range =
                document.createRange();

            range.selectNodeContents(
                campo
            );

            range.collapse(false);

            selection.removeAllRanges();

            selection.addRange(
                range
            );
        }


        range.deleteContents();


        const template =
            document.createElement('template');

        template.innerHTML =
            html;


        const fragment =
            template.content.cloneNode(true);


        const ultimo =
            fragment.lastChild;


        range.insertNode(
            fragment
        );


        if (
            ultimo
        ) {

            range.setStartAfter(
                ultimo
            );

            range.collapse(true);

            selection.removeAllRanges();

            selection.addRange(
                range
            );
        }
    }


    /*
     * Detecta se o clipboard contém
     * uma imagem ou arquivo.
     */
    function clipboardTemImagem(clipboard) {

        if (!clipboard) {
            return false;
        }


        /*
         * Método principal:
         * verifica os DataTransferItem.
         */
        if (
            clipboard.items &&
            clipboard.items.length
        ) {

            for (
                const item
                of clipboard.items
            ) {

                /*
                 * PNG, JPEG, WEBP etc.
                 */
                if (
                    item.type &&
                    item.type.startsWith('image/')
                ) {

                    return true;
                }


                /*
                 * Alguns programas colocam
                 * o conteúdo como arquivo.
                 */
                if (
                    item.kind === 'file'
                ) {

                    const arquivo =
                        item.getAsFile?.();

                    if (
                        arquivo &&
                        arquivo.type &&
                        arquivo.type.startsWith(
                            'image/'
                        )
                    ) {

                        return true;
                    }
                }
            }
        }


        /*
         * Fallback pelos files.
         */
        if (
            clipboard.files &&
            clipboard.files.length
        ) {

            for (
                const arquivo
                of clipboard.files
            ) {

                if (
                    arquivo.type &&
                    arquivo.type.startsWith(
                        'image/'
                    )
                ) {

                    return true;
                }
            }
        }


        return false;
    }


    /*
     * EVENTO DE COLAGEM
     */
    document.addEventListener(
        'paste',

        function (event) {

            let campo =
                event.target;


            if (
                !(campo instanceof Element)
            ) {

                campo =
                    campo?.parentElement;
            }


            campo =
                campo?.closest?.(
                    SELETOR
                );


            if (
                !campo
            ) {

                return;
            }


            corrigirCampo(
                campo
            );


            const clipboard =
                event.clipboardData;


            if (
                !clipboard
            ) {

                return;
            }


            /*
             * =========================================
             * IMAGEM
             * =========================================
             *
             * Se o Ctrl+V contém imagem:
             *
             * NÃO usamos preventDefault().
             * NÃO usamos stopPropagation().
             * NÃO usamos stopImmediatePropagation().
             *
             * O evento continua normalmente para
             * o Matrix/ERP processar o upload.
             */
            if (
                clipboardTemImagem(
                    clipboard
                )
            ) {

                console.log(
                    '[Matrix Fix] Imagem detectada. Colagem nativa liberada.',
                    campo.id
                );

                return;
            }


            /*
             * =========================================
             * TEXTO
             * =========================================
             *
             * Para texto continuamos assumindo
             * o controle da colagem.
             */
            event.preventDefault();

            event.stopImmediatePropagation();


            const html =
                clipboard.getData(
                    'text/html'
                );


            const texto =
                clipboard.getData(
                    'text/plain'
                );


            let resultado;


            if (
                html
            ) {

                resultado =
                    limparHTML(
                        html
                    );

            } else {

                resultado =
                    textoParaHTML(
                        texto
                    );
            }


            if (
                !resultado ||
                resultado.trim() === ''
            ) {

                return;
            }


            inserirHTMLNoCursor(
                campo,
                resultado
            );


            /*
             * Informa ao sistema que
             * o conteúdo foi alterado.
             */
            campo.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );


            console.log(
                '[Matrix Fix] Texto colado com STRONG e quebras:',
                campo.id
            );

        },

        true
    );


    /*
     * OBSERVADOR
     *
     * Agora não precisamos mais observar
     * mudanças em "onpaste".
     *
     * Só precisamos detectar campos novos.
     */
    function iniciarObserver() {

        if (
            !document.documentElement
        ) {

            return;
        }


        const observer =
            new MutationObserver(
                function (mutations) {

                    for (
                        const mutation
                        of mutations
                    ) {

                        if (
                            mutation.type ===
                                'childList'
                        ) {

                            mutation.addedNodes
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

                                            corrigirCampo(
                                                node
                                            );
                                        }


                                        node
                                            .querySelectorAll?.(
                                                SELETOR
                                            )
                                            .forEach(
                                                corrigirCampo
                                            );

                                    }
                                );
                        }
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


        console.log(
            '[Matrix Fix] Observador iniciado.'
        );
    }


    iniciarObserver();


    /*
     * Segurança adicional.
     */
    setInterval(
        corrigirTodos,
        500
    );


    document.addEventListener(
        'DOMContentLoaded',
        corrigirTodos
    );


    window.addEventListener(
        'load',
        corrigirTodos
    );

})();
});
