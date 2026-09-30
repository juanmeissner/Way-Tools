(() => {
  "use strict";

  const terms = Object.create(null);
  const corrections = Object.create(null);

  function addTerm(variants, canonical) {
    for (const variant of variants) {
      const key = variant.toLocaleLowerCase("pt-BR");
      if (Object.prototype.hasOwnProperty.call(terms, key)) {
        throw new Error(`[Way Dictionary] Termo duplicado: ${key}`);
      }
      terms[key] = canonical;
    }
  }

  function addCorrection(source, target) {
    const key = source.toLocaleLowerCase("pt-BR");
    if (Object.prototype.hasOwnProperty.call(corrections, key)) {
      if (corrections[key] !== target) {
        throw new Error(`[Way Dictionary] Correção conflitante: ${key}`);
      }
      return;
    }
    corrections[key] = target;
  }

  function withoutDiacritics(word) {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function addAccentWords(words) {
    for (const target of words) {
      const source = withoutDiacritics(target).toLocaleLowerCase("pt-BR");
      if (source !== target.toLocaleLowerCase("pt-BR")) {
        addCorrection(source, target);
      }
    }
  }

  function addTypos(target, variants) {
    for (const variant of variants) {
      addCorrection(variant, target);
    }
  }

  const fixedTerms = {
    "Wi-Fi": ["wifi", "wi-fi"],
    "Wi-Fi 6": ["wifi6", "wi-fi6"],
    "IP": ["ip"],
    "IPv4": ["ipv4"],
    "IPv6": ["ipv6"],
    "DNS": ["dns"],
    "DHCP": ["dhcp"],
    "NAT": ["nat"],
    "CGNAT": ["cgnat"],
    "DMZ": ["dmz"],
    "MAC": ["mac"],
    "SSID": ["ssid"],
    "LAN": ["lan"],
    "WAN": ["wan"],
    "VPN": ["vpn"],
    "PPPoE": ["pppoe"],
    "ONU": ["onu"],
    "ONT": ["ont"],
    "OLT": ["olt"],
    "FTTH": ["ftth"],
    "PON": ["pon"],
    "GPON": ["gpon"],
    "LOS": ["los"],
    "dBm": ["dbm"],
    "IPTV": ["iptv"],
    "Smart TV": ["smarttv"],
    "Smart Box": ["smartbox"],
    "WebRTC": ["webrtc"],
    "API": ["api"],
    "TCP": ["tcp"],
    "UDP": ["udp"],
    "HTTP": ["http"],
    "HTTPS": ["https"],
    "HTML": ["html"],
    "CSS": ["css"],
    "JavaScript": ["javascript"],
    "TypeScript": ["typescript"],
    "JSON": ["json"],
    "XML": ["xml"],
    "SQL": ["sql"],
    "SSH": ["ssh"],
    "FTP": ["ftp"],
    "SFTP": ["sftp"],
    "SMTP": ["smtp"],
    "IMAP": ["imap"],
    "POP3": ["pop3"],
    "VLAN": ["vlan"],
    "QoS": ["qos"],
    "GHz": ["ghz"],
    "MHz": ["mhz"],
    "Kbps": ["kbps"],
    "Mbps": ["mbps"],
    "Gbps": ["gbps"],
    "RJ45": ["rj45", "rj-45"],
    "CTO": ["cto"],
    "NAP": ["nap"],
    "RX": ["rx"],
    "TX": ["tx"],
    "SLA": ["sla"],
    "VoIP": ["voip"],
    "PoE": ["poe"],
    "TR-069": ["tr069", "tr-069"],
    "ACS": ["acs"],
    "SMS": ["sms"],
    "Way": ["way"],
    "Matrix": ["matrix"],
    "NocoDB": ["nocodb"],
    "Chatwoot": ["chatwoot"],
    "Huawei": ["huawei"],
    "Intelbras": ["intelbras"],
    "MikroTik": ["mikrotik"],
    "ZTE": ["zte"],
    "TP-Link": ["tplink", "tp-link"],
    "Ubiquiti": ["ubiquiti"],
    "WhatsApp": ["whatsapp", "whats", "wpp"],
    "Android": ["android"],
    "iPhone": ["iphone"],
    "iOS": ["ios"],
    "Windows": ["windows"],
    "Linux": ["linux"],
    "Chrome": ["chrome"],
    "Firefox": ["firefox"],
    "Microsoft Edge": ["edge"],
    "Google": ["google"],
    "YouTube": ["youtube"],
    "Netflix": ["netflix"],
    "Bluetooth": ["bluetooth"],
    "Ethernet": ["ethernet"],
    "Speedtest": ["speedtest"],
    "Ookla": ["ookla"]
  };

  for (const [canonical, variants] of Object.entries(fixedTerms)) {
    addTerm(variants, canonical);
  }

  addAccentWords([
    "não", "você", "vocês", "também", "já", "até", "após", "através", "além",
    "possível", "impossível", "disponível", "disponíveis", "necessário", "necessária",
    "necessários", "necessárias", "próximo", "próxima", "próximos", "próximas",
    "último", "última", "últimos", "últimas", "fácil", "difícil", "único", "única",
    "automático", "automática", "automáticos", "automáticas", "básico", "básica",
    "específico", "específica", "específicos", "específicas", "técnico", "técnica",
    "técnicos", "técnicas", "físico", "física", "elétrico", "elétrica", "eletrônico",
    "eletrônica", "lógico", "lógica", "rápido", "rápida", "máximo", "máxima",
    "mínimo", "mínima", "médio", "ótimo", "ótima", "número", "números", "código",
    "códigos", "endereço", "endereços", "horário", "horários", "período", "períodos",
    "área", "áreas", "nível", "níveis", "dúvida", "dúvidas", "residência", "residências",
    "prédio", "prédios", "cômodo", "cômodos", "usuário", "usuários", "responsável",
    "responsáveis", "localização", "autorização", "autorizações", "condomínio", "condomínios",
    "serviço", "serviços", "início", "página", "páginas", "histórico", "históricos",
    "relatório", "relatórios", "pendência", "pendências", "sequência", "sequências",
    "urgência", "urgências", "experiência", "experiências", "benefício", "benefícios",
    "conteúdo", "conteúdos", "município", "municípios", "veículo", "veículos", "execução",
    "criação", "maiúscula", "minúscula", "olá", "saúde", "família", "diferença", "referência",
    "atenção", "solicitação", "solicitações", "informação", "informações",
    "orientação", "orientações", "confirmação", "confirmações", "validação", "validações",
    "verificação", "verificações", "identificação", "finalização", "normalização",
    "regularização", "situação", "situações", "alteração", "alterações", "atualização",
    "atualizações", "comunicação", "interação", "interações", "compreensão", "disposição",
    "preferência", "previsão", "previsões", "manhã", "agradeço", "satisfação", "avaliação",
    "participação", "segurança", "ausência", "ocorrência", "ocorrências", "transferência",
    "transferências", "negociação", "migração", "reativação", "inadimplência", "débito", "débitos",
    "crédito", "créditos", "cobrança", "conexão", "conexões", "desconexão", "desconexões", "reconexão",
    "oscilação", "oscilações", "intermitência", "intermitências", "latência", "latências", "potência",
    "potências", "atenuação", "atenuações", "óptico", "óptica", "ópticos", "ópticas", "saturação",
    "transmissão", "televisão", "instalação", "instalações", "manutenção", "configuração",
    "configurações", "reconfiguração", "reinicialização", "restauração", "sincronização",
    "autenticação", "aplicação", "aplicações", "integração", "integrações", "versão", "versões",
    "notificação", "notificações", "câmera", "câmeras", "gravação", "gravações", "visualização",
    "diagnóstico", "diagnósticos", "solução", "soluções", "resolução", "estável", "indisponível",
    "inacessível", "acessível", "lentidão", "navegação", "utilização", "estabilidade", "desempenho",
    "interferência", "interferências", "distância", "distribuição", "intensidade", "capacidade", "limitação",
    "limitações", "otimização", "compatível", "incompatível", "provisório", "provisória"
  ]);

  const typoGroups = {
    "com certeza": ["concerteza", "comcerteza"],
    "de repente": ["derrepente", "derepente"],
    "a partir": ["apartir"],
    "por favor": ["porfavor"],
    "de novo": ["denovo"],
    "enxergar": ["enchergar", "enxergarrr"],
    "exceção": ["excessao", "excessão", "excecao"],
    "exceções": ["excessoes", "excessões", "excecoes"],
    "conexão": ["conecao", "coneccao", "conexxao", "conecção", "coneção"],
    "conexões": ["conecoes", "coneccoes", "conexoes"],
    "roteador": ["roteadro", "roteaor", "roteaodr", "roetador", "rotedor", "roteadir"],
    "internet": ["internt", "intenret", "interent", "internte", "interente", "inernet"],
    "sinal": ["sianl", "siinal", "snial", "sinaal"],
    "velocidade": ["velociade", "velocidae", "velocdade", "velocidaade"],
    "instabilidade": ["instabilidae", "instabilidde", "instabildiade", "instablidade"],
    "reiniciar": ["reinicar", "reinciar", "reiniciaar", "reiniicar"],
    "reiniciado": ["reinciado", "reiniciadoo"],
    "reiniciada": ["reinciada", "reiniciadaa"],
    "verificar": ["verifcar", "verficar", "veriifcar", "verificarrr"],
    "verifiquei": ["verifquei", "verfiiquei", "verifiqueii"],
    "realizar": ["realziar", "relaizar", "realisar", "realizarr"],
    "realizado": ["realziado", "realisado", "realizdo"],
    "realizada": ["realziada", "realisada", "realizda"],
    "normalizado": ["normalziado", "normaliado", "normalisado"],
    "normalizada": ["normalziada", "normalisada"],
    "solucionado": ["solucioando", "solucionadoo", "solussionado"],
    "solucionada": ["solucioanda", "solucionadaa"],
    "configuração": ["configruacao", "configraucao", "configurcao", "configuacao", "confirugacao"],
    "configurações": ["configruacoes", "configrações", "configuracoes"],
    "configurado": ["configrado", "configurdo"],
    "configurada": ["configrada", "configurda"],
    "atualização": ["atualziacao", "atualizcao", "atualizaçao"],
    "agendamento": ["agendametno", "agendamneto", "agendameto"],
    "agendado": ["agenddo", "agendadoo"],
    "agendada": ["agendda", "agendadaa"],
    "disponibilidade": ["disponiblidade", "disponibildiade", "disponibiliade"],
    "necessário": ["necessairo", "nescessario", "necesario"],
    "necessária": ["necessairia", "nescessaria", "necesaria"],
    "informação": ["informcao", "inforamcao", "informaçao", "informassao"],
    "informações": ["informcoes", "informaçoes", "informassoes"],
    "orientação": ["orientaçao", "orientacaoo", "orientassao"],
    "atendimento": ["atendimetno", "atendimneto", "atendimeto", "atendimentoo"],
    "retorno": ["retornor", "retorono", "retunro"],
    "cliente": ["clietne", "cliene", "clinte", "cleinte"],
    "clientes": ["clietnes", "clienes", "clintes"],
    "residência": ["residnecia", "residenciaa", "residênciaa"],
    "técnico": ["tecncio", "tecinco", "tecnicoo"],
    "técnica": ["tecncia", "tecinica", "tecnicaa"],
    "potência": ["potecia", "potenica", "potenciaa"],
    "oscilação": ["oscilcao", "oscilaçao", "ossilacao"],
    "latência": ["latenciaa", "latênciaa", "latencai"],
    "problema": ["probelma", "probema", "prolema"],
    "problemas": ["probelmas", "probemas", "prolemas"],
    "procedimento": ["procediemnto", "procedimetno", "procedimeto"],
    "equipamento": ["equipametno", "equipamneto", "equimento"],
    "equipamentos": ["equipametnos", "equipamnetos"],
    "dispositivo": ["dispositvo", "dispostivo", "dispositivoo"],
    "dispositivos": ["dispositvos", "dispostivos"],
    "contato": ["contaot", "contatto", "conato"],
    "solicitação": ["solictacao", "solicitcao", "solicitaçao", "solicitaçãoo"],
    "validação": ["validcao", "validaçao", "validassao"],
    "verificação": ["verificcao", "verificaçao", "verificassao"],
    "normalização": ["normalizcao", "normalizaçao", "normalisacao"],
    "horário": ["horairo", "horarioo", "horraio"],
    "período": ["perioddo", "perido", "periodoo"],
    "endereço": ["enderecoo", "enderço"],
    "mensagem": ["menssagem", "mensgem", "mesnagem", "mensagemm"],
    "extensão": ["extenção", "extensaoo", "extençao", "estensao"],
    "identificação": ["indentificacao", "identificao", "identifcação"],
    "responsável": ["resposavel", "responssavel"],
    "encaminhado": ["encaminahdo", "encamihado", "encaminadoo"],
    "encaminhada": ["encaminahda", "encamihada"],
    "encaminhamento": ["encaminhamneto", "encaminhameto"],
    "financeiro": ["finaceiro", "financeirro", "financero"],
    "fatura": ["fatrura", "fautra", "faturaa"],
    "boleto": ["bolteo", "boletoo"],
    "pagamento": ["pagametno", "pagamneto", "pagameto"],
    "vencimento": ["vencimetno", "vencimneto"],
    "cancelamento": ["cancelametno", "cancelamneto"],
    "desbloqueio": ["desbloqeio", "desbloqueoi"],
    "bloqueio": ["bloqeio", "bloqueoi"],
    "titular": ["titualr", "titulaar"],
    "contrato": ["contarto", "contratto", "contratoo"],
    "cadastro": ["cadasrtro", "cadatsro", "cadastroo"],
    "protocolo": ["protcolo", "protoclo", "protocoloo"],
    "visita": ["visista", "vistia", "visitaa"],
    "manutenção": ["manutençao", "manutencaoo", "manuntenção"],
    "instalação": ["instalaçao", "instalacaoo", "instalassao"],
    "navegação": ["navegaçao", "navegacaoo", "navegassao"],
    "autenticação": ["autenticaçao", "autenticacaoo", "autentificação"],
    "sincronização": ["sincronizaçao", "sincronisacao", "sincroniação"],
    "interferência": ["interferenciaa", "interferênciaa", "interferncia"],
    "fibra": ["firba", "fibraa"],
    "cabo": ["caboo", "caob"],
    "conector": ["conecotr", "conectorr"],
    "download": ["donwload", "dowload", "downlaod"],
    "upload": ["uplod", "upoad", "uplaod"],
    "firmware": ["firmeware", "firwmare"],
    "gateway": ["gateaway", "gatway"],
    "jitter": ["jiter", "jitterr"],
    "velocidades": ["velociades", "velocidaes"],
    "aplicativo": ["aplicatvo", "aplicativoo"],
    "computador": ["computdor", "compuatdor"],
    "celular": ["celualr", "cellular"],
    "notebook": ["notebok", "notbook"],
    "televisão": ["televisaoo", "televizao"],
    "senha": ["senhaa", "sehna"],
    "acesso": ["acessso", "ascesso"],
    "suporte": ["suprote", "suportee"],
    "equipe": ["eqiupe", "equippe"],
    "retornar": ["retonar", "retornarr"],
    "aguardar": ["aguradar", "aguadard"],
    "continuidade": ["continuiddae", "continiudade"],
    "qualidade": ["qualidae", "qualidadde"],
    "segurança": ["seguranca", "segurançaa", "seguranssa"]
  };

  for (const [target, variants] of Object.entries(typoGroups)) {
    addTypos(target, variants);
  }

  const ignored = Object.freeze([
    "mesh", "ping", "traceroute", "jitter", "gateway", "firmware", "download", "upload",
    "throughput", "uptime", "downtime", "bridge", "dualband", "reset", "online", "offline",
    "login", "logout", "link", "backbone", "switch", "router", "modem", "splitter", "drop",
    "patchcord", "browser", "hardware", "software", "dashboard", "ticket", "backup", "restore",
    "proxy", "firewall", "hotspot", "roaming", "bandwidth", "broadcast", "unicast", "multicast"
  ]);

  const contextualRules = Object.freeze([
    Object.freeze({ pattern: "\\bagente\\b", flags: "i", message: "Revise 'agente': se significar 'nós', use 'a gente'." }),
    Object.freeze({ pattern: "\\besta\\b", flags: "i", message: "Revise 'esta': pode ser 'esta' ou 'está', dependendo da frase." }),
    Object.freeze({ pattern: "\\banalise\\b", flags: "i", message: "Revise 'analise': verbo sem acento; o substantivo é 'análise'." }),
    Object.freeze({ pattern: "\\bpublic(?:o|a|os|as)\\b", flags: "i", message: "Revise 'publico/publica': pode ser verbo ou 'público/pública'." }),
    Object.freeze({ pattern: "\\bmedia\\b", flags: "i", message: "Revise 'media': pode ser verbo ou o substantivo 'média'." }),
    Object.freeze({ pattern: "\\b(?:mas|mais)\\b", flags: "i", message: "Confirme 'mas/mais': oposição usa 'mas'; quantidade usa 'mais'." }),
    Object.freeze({ pattern: "\\b(?:mal|mau)\\b", flags: "i", message: "Confirme 'mal/mau': 'mal' se opõe a bem; 'mau' se opõe a bom." }),
    Object.freeze({ pattern: "\\b(?:onde|aonde)\\b", flags: "i", message: "Confirme 'onde/aonde': use 'aonde' com ideia de movimento." }),
    Object.freeze({ pattern: "\\b(?:sessão|seção|cessão)\\b", flags: "i", message: "Confirme sessão, seção ou cessão conforme o sentido." }),
    Object.freeze({ pattern: "\\b(?:trás|traz)\\b", flags: "i", message: "Confirme 'trás/traz': lugar usa 'trás'; verbo trazer usa 'traz'." }),
    Object.freeze({ pattern: "\\btem\\b", flags: "i", message: "Revise 'tem/têm': use 'têm' quando o sujeito estiver no plural." }),
    Object.freeze({ pattern: "\\b(?:porque|por que|porquê|por quê)\\b", flags: "i", message: "Revise o uso de porque, por que, porquê ou por quê conforme a frase." })
  ]);

  globalThis.WAY_TOOLS_SPELLING_DICTIONARY = Object.freeze({
    terms: Object.freeze(terms),
    corrections: Object.freeze(corrections),
    ignored,
    contextualRules
  });
})();
