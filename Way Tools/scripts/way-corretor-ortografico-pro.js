/*
 * Way Tools - Corretor Ortográfico PRO v3.0
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
// @version      3.0
// @description  Corretor automático PT-BR focado em atendimento, suporte técnico e telecom
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
        'textarea'
    ].join(',');


    function encontrarCampo(target) {

        if (!(target instanceof Element)) {
            target = target?.parentElement;
        }

        return target?.closest?.(SELETOR) || null;
    }


    /* =========================================================
       TERMOS QUE DEVEM TER CAPITALIZAÇÃO EXATA
       ========================================================= */

    const TERMOS_PADRAO = {

        "wifi": "Wi-Fi",
        "wi-fi": "Wi-Fi",

        "ip": "IP",
        "ipv4": "IPv4",
        "ipv6": "IPv6",

        "dns": "DNS",
        "dhcp": "DHCP",

        "nat": "NAT",
        "cgnat": "CGNAT",
        "dmz": "DMZ",

        "mac": "MAC",
        "ssid": "SSID",

        "lan": "LAN",
        "wan": "WAN",

        "vpn": "VPN",

        "pppoe": "PPPoE",

        "onu": "ONU",
        "ont": "ONT",
        "olt": "OLT",

        "ftth": "FTTH",
        "pon": "PON",
        "gpon": "GPON",

        "los": "LOS",

        "dbm": "dBm",

        "iptv": "IPTV",

        "smarttv": "Smart TV",
        "smartbox": "Smart Box",

        "webrtc": "WebRTC",

        "api": "API",

        "tcp": "TCP",
        "udp": "UDP",

        "http": "HTTP",
        "https": "HTTPS",

        "way": "Way",

        "matrix": "Matrix",

        "huawei": "Huawei",
        "intelbras": "Intelbras",
        "mikrotik": "MikroTik",
        "zte": "ZTE",

        "whatsapp": "WhatsApp",
        "android": "Android",
        "iphone": "iPhone",

        "windows": "Windows",
        "chrome": "Chrome",

        "google": "Google",
        "youtube": "YouTube",
        "netflix": "Netflix"
    };


    /* =========================================================
       DICIONÁRIO DE CORREÇÕES SEGURAS
       ========================================================= */

    const CORRECOES = {

        /* -----------------------------------------------------
           PORTUGUÊS / ACENTUAÇÃO
           ----------------------------------------------------- */

        "nao": "não",
        "voce": "você",
        "voces": "vocês",

        "tambem": "também",
        "ja": "já",
        "ate": "até",

        "apos": "após",
        "atraves": "através",
        "alem": "além",

        "possivel": "possível",
        "impossivel": "impossível",

        "disponivel": "disponível",
        "disponiveis": "disponíveis",

        "necessario": "necessário",
        "necessaria": "necessária",
        "necessarios": "necessários",
        "necessarias": "necessárias",

        "proximo": "próximo",
        "proxima": "próxima",
        "proximos": "próximos",
        "proximas": "próximas",

        "ultimo": "último",
        "ultima": "última",
        "ultimos": "últimos",
        "ultimas": "últimas",

        "facil": "fácil",
        "dificil": "difícil",

        "unico": "único",
        "unica": "única",

        "publico": "público",
        "publica": "pública",

        "automatico": "automático",
        "automatica": "automática",

        "basico": "básico",
        "basica": "básica",

        "especifico": "específico",
        "especifica": "específica",

        "tecnico": "técnico",
        "tecnica": "técnica",
        "tecnicos": "técnicos",
        "tecnicas": "técnicas",

        "fisico": "físico",
        "fisica": "física",

        "eletrico": "elétrico",
        "eletrica": "elétrica",

        "eletronico": "eletrônico",
        "eletronica": "eletrônica",

        "logico": "lógico",
        "logica": "lógica",

        "rapido": "rápido",
        "rapida": "rápida",

        "maximo": "máximo",
        "maxima": "máxima",

        "minimo": "mínimo",
        "minima": "mínima",

        "medio": "médio",
        "media": "média",

        "otimo": "ótimo",
        "otima": "ótima",

        "numero": "número",
        "numeros": "números",

        "codigo": "código",
        "codigos": "códigos",

        "endereco": "endereço",
        "enderecos": "endereços",

        "horario": "horário",
        "horarios": "horários",

        "periodo": "período",
        "periodos": "períodos",

        "area": "área",
        "areas": "áreas",

        "nivel": "nível",
        "niveis": "níveis",

        "duvida": "dúvida",
        "duvidas": "dúvidas",

        "residencia": "residência",
        "residencias": "residências",

        "predio": "prédio",
        "predios": "prédios",

        "comodo": "cômodo",
        "comodos": "cômodos",

        "usuario": "usuário",
        "usuarios": "usuários",

        "responsavel": "responsável",
        "responsaveis": "responsáveis",

        "localizacao": "localização",

        "autorizacao": "autorização",
        "autorizacoes": "autorizações",

        "condominio": "condomínio",
        "condominios": "condomínios",


        /* -----------------------------------------------------
           ATENDIMENTO
           ----------------------------------------------------- */

        "atencao": "atenção",

        "solicitacao": "solicitação",
        "solicitacoes": "solicitações",

        "informacao": "informação",
        "informacoes": "informações",

        "orientacao": "orientação",
        "orientacoes": "orientações",

        "confirmacao": "confirmação",
        "confirmacoes": "confirmações",

        "validacao": "validação",
        "validacoes": "validações",

        "verificacao": "verificação",
        "verificacoes": "verificações",

        "identificacao": "identificação",

        "finalizacao": "finalização",

        "normalizacao": "normalização",

        "regularizacao": "regularização",

        "situacao": "situação",
        "situacoes": "situações",

        "alteracao": "alteração",
        "alteracoes": "alterações",

        "atualizacao": "atualização",
        "atualizacoes": "atualizações",

        "comunicacao": "comunicação",

        "interacao": "interação",
        "interacoes": "interações",

        "compreensao": "compreensão",

        "disposicao": "disposição",

        "preferencia": "preferência",

        "previsao": "previsão",
        "previsoes": "previsões",

        "manha": "manhã",

        "agradeco": "agradeço",

        "protocolo": "protocolo",

        "atendimento": "atendimento",

        "agendamento": "agendamento",

        "comparecimento": "comparecimento",

        "deslocamento": "deslocamento",


        /* -----------------------------------------------------
           INTERNET / REDE
           ----------------------------------------------------- */

        "conexao": "conexão",
        "conexoes": "conexões",

        "desconexao": "desconexão",
        "desconexoes": "desconexões",

        "reconexao": "reconexão",

        "oscilacao": "oscilação",
        "oscilacoes": "oscilações",

        "intermitencia": "intermitência",
        "intermitencias": "intermitências",

        "latencia": "latência",

        "potencia": "potência",
        "potencias": "potências",

        "atenuacao": "atenuação",

        "optico": "óptico",
        "optica": "óptica",
        "opticos": "ópticos",
        "opticas": "ópticas",

        "saturacao": "saturação",

        "transmissao": "transmissão",

        "televisao": "televisão",

        "instalacao": "instalação",
        "instalacoes": "instalações",

        "manutencao": "manutenção",


        /* -----------------------------------------------------
           CONFIGURAÇÃO / SISTEMAS
           ----------------------------------------------------- */

        "configuracao": "configuração",
        "configuracoes": "configurações",

        "reconfiguracao": "reconfiguração",

        "reinicializacao": "reinicialização",

        "restauracao": "restauração",

        "sincronizacao": "sincronização",

        "autenticacao": "autenticação",

        "aplicacao": "aplicação",
        "aplicacoes": "aplicações",

        "integracao": "integração",
        "integracoes": "integrações",

        "versao": "versão",
        "versoes": "versões",

        "notificacao": "notificação",
        "notificacoes": "notificações",

        "camera": "câmera",
        "cameras": "câmeras",

        "gravacao": "gravação",
        "gravacoes": "gravações",

        "visualizacao": "visualização",


        /* -----------------------------------------------------
           DIAGNÓSTICO
           ----------------------------------------------------- */

        "diagnostico": "diagnóstico",
        "diagnosticos": "diagnósticos",

        "analise": "análise",
        "analises": "análises",

        "solucao": "solução",
        "solucoes": "soluções",

        "resolucao": "resolução",

        "estavel": "estável",

        "indisponivel": "indisponível",

        "inacessivel": "inacessível",

        "acessivel": "acessível",

        "lentidao": "lentidão",


        /* -----------------------------------------------------
           ERROS DE DIGITAÇÃO COMUNS
           ----------------------------------------------------- */

        "concerteza": "com certeza",
        "comcerteza": "com certeza",

        "derrepente": "de repente",
        "derepente": "de repente",

        "apartir": "a partir",

        "porfavor": "por favor",

        "denovo": "de novo",

        "enchergar": "enxergar",

        "excessao": "exceção",
        "excessoes": "exceções",

        "excecao": "exceção",
        "excecoes": "exceções",

        "conecao": "conexão",
        "coneccao": "conexão",
        "conexxao": "conexão",

        "roteadro": "roteador",
        "roteaor": "roteador",
        "roteaodr": "roteador",

        "internt": "internet",
        "intenret": "internet",
        "interent": "internet",
        "internte": "internet",

        "sianl": "sinal",
        "siinal": "sinal",

        "velociade": "velocidade",
        "velocidae": "velocidade",

        "instabilidae": "instabilidade",
        "instabilidde": "instabilidade",

        "reinicar": "reiniciar",
        "reinciar": "reiniciar",
        "reiniciaar": "reiniciar",

        "verifcar": "verificar",
        "verficar": "verificar",
        "veriifcar": "verificar",

        "verifquei": "verifiquei",
        "verfiiquei": "verifiquei",

        "realziar": "realizar",
        "relaizar": "realizar",

        "realziado": "realizado",
        "realziada": "realizada",

        "normalziado": "normalizado",
        "normalziada": "normalizada",

        "solucioando": "solucionado",
        "solucioanda": "solucionada",

        "configruacao": "configuração",
        "configraucao": "configuração",

        "atualziacao": "atualização",

        "agendametno": "agendamento",
        "agendamneto": "agendamento",

        "disponiblidade": "disponibilidade",
        "disponibildiade": "disponibilidade",

        "necessairo": "necessário",
        "necessairo": "necessário",

        "informcao": "informação",
        "inforamcao": "informação",

        "orientaçao": "orientação",

        "atendimetno": "atendimento",
        "atendimneto": "atendimento",

        "retornor": "retorno",

        "clietne": "cliente",
        "cliene": "cliente",

        "residnecia": "residência",

        "tecncio": "técnico",
        "tecinco": "técnico",

        "potecia": "potência",
        "potenica": "potência",

        "oscilcao": "oscilação",

        "latenciaa": "latência",

        "probelma": "problema",
        "probelmas": "problemas",

        "procediemnto": "procedimento",
        "procedimetno": "procedimento",

        "equipametno": "equipamento",

        "dispositvo": "dispositivo",
        "dispostivo": "dispositivo",

        "retorono": "retorno",

        "contaot": "contato",

        "solictacao": "solicitação",
        "solicitcao": "solicitação",

        "validcao": "validação",

        "verificcao": "verificação",

        "normalizcao": "normalização",

        "configrado": "configurado",
        "configrada": "configurada",

        "reinciado": "reiniciado",

        "agendda": "agendada",
        "agenddo": "agendado",

        "horairo": "horário",
        "horairo": "horário",

        "perioddo": "período",

        "enderecoo": "endereço"
    };


    /* =========================================================
       PALAVRAS QUE NÃO DEVEM SER ALTERADAS
       ========================================================= */

    const IGNORAR = new Set([
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "node",
        "nodejs",
        "json",
        "xml",
        "sql",
        "ssh",
        "ftp",
        "sftp",
        "smtp",
        "imap",
        "pop3",
        "vlan",
        "qos",
        "mesh"
    ]);


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
       CAPITALIZAÇÃO
       ========================================================= */

    function preservarCapitalizacao(
        original,
        corrigida
    ) {

        /*
         * Correção que contém espaços.
         *
         * Exemplo:
         *
         * Concerteza -> Com certeza
         */
        if (
            original.length > 0 &&
            original[0] ===
                original[0].toUpperCase()
        ) {

            return (
                corrigida
                    .charAt(0)
                    .toUpperCase() +
                corrigida.slice(1)
            );
        }


        if (
            original.length > 1 &&
            original ===
                original.toUpperCase()
        ) {

            return corrigida
                .toUpperCase();
        }


        return corrigida;
    }


    /* =========================================================
       PROTEÇÃO DE DADOS TÉCNICOS
       ========================================================= */

    function limparPontuacaoToken(
        token
    ) {

        return token.replace(
            /^[("'[\]{]+|[)"'\]},;!?]+$/g,
            ''
        );
    }


    function tokenProtegido(
        token
    ) {

        if (!token) {
            return true;
        }


        const limpo =
            limparPontuacaoToken(
                token
            );


        const chave =
            limpo.toLowerCase();


        /*
         * Se conhecemos a palavra,
         * ela pode ser corrigida mesmo
         * contendo número.
         *
         * Exemplo:
         *
         * ipv4
         */
        if (
            Object.prototype
                .hasOwnProperty.call(
                    TERMOS_PADRAO,
                    chave
                ) ||
            Object.prototype
                .hasOwnProperty.call(
                    CORRECOES,
                    chave
                )
        ) {

            return false;
        }


        /*
         * URL
         */
        if (
            /^https?:\/\//i.test(
                limpo
            ) ||
            /^www\./i.test(
                limpo
            )
        ) {

            return true;
        }


        /*
         * E-mail
         */
        if (
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                limpo
            )
        ) {

            return true;
        }


        /*
         * IPv4
         */
        if (
            /^(?:\d{1,3}\.){3}\d{1,3}$/.test(
                limpo
            )
        ) {

            return true;
        }


        /*
         * MAC
         */
        if (
            /^(?:[A-F0-9]{2}[:-]){5}[A-F0-9]{2}$/i.test(
                limpo
            )
        ) {

            return true;
        }


        /*
         * Serial / modelo / firmware:
         *
         * EG8041X6-10
         * V5R023C00S204
         * YU111612678BR
         */
        if (
            /(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9._/-]{4,}/.test(
                limpo
            )
        ) {

            return true;
        }


        /*
         * Caminhos / domínios / códigos
         */
        if (
            limpo.includes('\\') ||
            limpo.includes('/') ||
            limpo.startsWith('#')
        ) {

            return true;
        }


        return false;
    }


    /* =========================================================
       OBTÉM CORREÇÃO
       ========================================================= */

    function obterCorrecao(
        palavra,
        tokenCompleto = palavra
    ) {

        if (!palavra) {
            return null;
        }


        const chave =
            palavra.toLowerCase();


        /*
         * Termos técnicos possuem
         * capitalização fixa.
         */
        if (
            Object.prototype
                .hasOwnProperty.call(
                    TERMOS_PADRAO,
                    chave
                )
        ) {

            const novo =
                TERMOS_PADRAO[chave];


            if (
                palavra === novo
            ) {

                return null;
            }


            return novo;
        }


        if (
            IGNORAR.has(
                chave
            )
        ) {

            return null;
        }


        if (
            tokenProtegido(
                tokenCompleto
            )
        ) {

            return null;
        }


        if (
            !Object.prototype
                .hasOwnProperty.call(
                    CORRECOES,
                    chave
                )
        ) {

            return null;
        }


        const corrigida =
            CORRECOES[chave];


        if (
            palavra === corrigida
        ) {

            return null;
        }


        return preservarCapitalizacao(
            palavra,
            corrigida
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

        if (
            !texto
        ) {

            return texto;
        }


        /*
         * Letras + números.
         *
         * Permite:
         *
         * ipv4
         * wifi
         * conexao
         */
        texto =
            texto.replace(
                /[\p{L}\p{N}][\p{L}\p{N}\p{M}-]*/gu,

                function (
                    palavra,
                    offset
                ) {

                    const token =
                        tokenAoRedor(
                            texto,
                            offset,
                            offset +
                                palavra.length
                        );


                    const correcao =
                        obterCorrecao(
                            palavra,
                            token
                        );


                    return correcao ||
                        palavra;
                }
            );


        if (
            CONFIG.normalizarPontuacao
        ) {

            texto =
                normalizarPontuacao(
                    texto
                );
        }


        return texto;
    }


    /* =========================================================
       NORMALIZA PONTUAÇÃO
       ========================================================= */

    function normalizarPontuacao(
        texto
    ) {

        /*
         * Remove espaço antes de:
         *
         * , . ; ! ?
         *
         * "Olá , tudo bem ?"
         *
         * ->
         *
         * "Olá, tudo bem?"
         */
        texto =
            texto.replace(
                /[ \t]+([,.;!?])/g,
                '$1'
            );


        /*
         * Adiciona espaço depois de:
         *
         * vírgula
         * ;
         * !
         * ?
         *
         * apenas quando o próximo
         * caractere for uma letra.
         *
         * Evitamos mexer em "." para não
         * danificar domínios/IPs.
         */
        texto =
            texto.replace(
                /([,;!?])(?=\p{L})/gu,
                '$1 '
            );


        /*
         * Remove espaço sobrando
         * antes de quebra de linha.
         */
        texto =
            texto.replace(
                /[ \t]+\n/g,
                '\n'
            );


        return texto;
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

        const texto =
            textoDoCampo(
                campo
            );


        /*
         * Não corrigimos automaticamente
         * essas situações porque dependem
         * de contexto.
         */

        if (
            /\bagente\b/i.test(
                texto
            )
        ) {

            setTimeout(
                () => {

                    mostrarToast(
                        '⚠ Revise “agente”: se significar “nós”, use “a gente”.',
                        3500
                    );

                },
                500
            );

            return;
        }


        if (
            /\besta\b/i.test(
                texto
            )
        ) {

            setTimeout(
                () => {

                    mostrarToast(
                        '⚠ Revise “esta”: pode ser “esta” ou “está”, dependendo da frase.',
                        3500
                    );

                },
                500
            );
        }
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
            Object.keys(
                CORRECOES
            ).length,
            'correções ortográficas.'
        );


        console.log(
            '[Way AutoCorrect PRO]',
            Object.keys(
                TERMOS_PADRAO
            ).length,
            'termos técnicos padronizados.'
        );


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