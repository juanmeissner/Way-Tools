/*
 * Way Tools - ERP Gerador de Relato v1.13
 * Assistente em etapas para compor e inserir relatos no editor DevExtreme/Quill do ERP.
 */

globalThis.WayToolsRuntime.run("way-erp-gerador-relato", () => {
  "use strict";

  const EDITOR_SELECTOR =
    '.dx-htmleditor .ql-editor.dx-htmleditor-content[contenteditable="true"]';
  const ROOT_ID = "way-erp-report-generator-root";
  const STYLE_ID = "way-erp-report-generator-style";
  const BUTTON_CLASS = "way-erp-report-generator-button";
  const NO_INTERACTION_CONTACT = "Chat sem interação";
  const SLOWNESS_ISSUE = "Lentidão";
  const DRAFT_STORAGE_PREFIX = "way-tools:erp-report-draft:v1:";
  let CONTACT_TYPES = Object.freeze([
    "Problema técnico",
    "Solicitação",
    "Dúvida ou orientação",
    "Acompanhamento de atendimento",
    "Reclamação",
    NO_INTERACTION_CONTACT
  ]);
  let NO_INTERACTION_OPTIONS = Object.freeze({
    reasons: Object.freeze([
      "Cliente não iniciou interação após a abertura do atendimento.",
      "Cliente deixou de responder durante o atendimento.",
      "Cliente não retornou após solicitação de teste ou informação."
    ]),
    attempts: Object.freeze([
      { value: "", label: "Sem interação" },
      "Foi realizada uma tentativa de contato, sem retorno.",
      "Foram realizadas duas tentativas de contato, sem retorno.",
      "Foram realizadas três tentativas de contato, sem retorno."
    ]),
    results: Object.freeze([
      "O atendimento foi encerrado por ausência de interação.",
      "O atendimento permanece aguardando retorno do cliente."
    ])
  });
  let SCOPE_OPTIONS = Object.freeze([
    { value: "", label: "Não informado" },
    "Apenas um dispositivo",
    "Vários dispositivos",
    "Todos os dispositivos",
    "Apenas um cômodo/local",
    "Toda a residência/empresa",
    "Possível problema regional"
  ]);
  let FREQUENCY_OPTIONS = Object.freeze([
    { value: "", label: "Não informado" },
    "Constante",
    "Intermitente",
    "Em horários específicos",
    "Ocorreu uma única vez"
  ]);
  let WIFI_BAND_OPTIONS = Object.freeze([
    { value: "", label: "Ainda não identificado" },
    "2,4 GHz",
    "5 GHz",
    "Ambas as frequências"
  ]);
  let MEASUREMENT_FIELDS = Object.freeze([
    { id: "optical_signal", label: "Sinal óptico", products: ["internet", "roteador", "telefonia"], placeholder: "Ex.: -19,8 dBm; link loss" },
    { id: "speed_test", label: "Teste de velocidade", products: ["internet", "roteador", "dados_moveis", "way_vision"], placeholder: "Ex.: 480 Mbps download / 230 Mbps upload" },
    { id: "latency", label: "Latência e perda", products: ["internet", "roteador", "dados_moveis", "way_vision"], placeholder: "Ex.: 12 ms, sem perda de pacotes" },
    { id: "vision_wifi_signal", label: "Sinal Wi-Fi da câmera", products: ["way_vision"], placeholder: "Ex.: -58 dBm; sinal bom" },
    { id: "vision_storage_status", label: "Armazenamento da câmera", products: ["way_vision"], placeholder: "Ex.: cartão de 64 GB reconhecido, 18 GB livres" },
    { id: "vision_video_quality", label: "Qualidade de vídeo configurada", products: ["way_vision"], placeholder: "Ex.: 1080p, qualidade alta" }
  ]);

  let PRODUCTS = Object.freeze({
    internet: {
      label: "Internet",
      icon: "🌐",
      issues: [
        { id: "internet_no_access", label: "Sem acesso à internet" },
        "Conexão intermitente",
        { id: "internet_slowness", label: "Lentidão" },
        "Latência elevada",
        "Perda de pacotes",
        "Acesso parcial a sites ou aplicativos",
        "Problema apenas via Wi-Fi",
        "Problema apenas via cabo",
        "Quedas em horários específicos",
        "Link loss ou ausência de sinal óptico"
      ]
    },
    dados_moveis: {
      label: "Dados móveis",
      icon: "📱",
      issues: [
        "Sem acesso aos dados móveis",
        "Sinal móvel ausente ou fraco",
        "Conexão móvel intermitente",
        "Lentidão nos dados móveis",
        "APN incorreta ou não configurada",
        "Chip não reconhecido",
        "Problema em chamadas ou SMS",
        "Problema após troca de aparelho"
      ]
    },
    tv: {
      label: "TV",
      icon: "📺",
      issues: [
        "Sem sinal",
        "Canais indisponíveis",
        "Imagem travando ou pixelizando",
        "Imagem sem áudio",
        "Áudio sem imagem",
        "Aplicativo de TV não abre",
        "Erro de autenticação",
        "Problema em canal específico"
      ]
    },
    tv_box: {
      label: "TV Box",
      icon: "📦",
      issues: [
        "Equipamento não liga",
        "Travado na inicialização",
        "Sem conexão com a internet",
        "Controle remoto não responde",
        "Aplicativos não abrem",
        "Imagem ou áudio com falhas",
        "Saída HDMI sem sinal",
        "Reinicializações inesperadas"
      ]
    },
    roteador: {
      label: "Roteador",
      icon: "📡",
      issues: [
        "Roteador não liga",
        "LEDs em estado anormal",
        "Rede Wi-Fi não aparece",
        "Senha não é aceita",
        "Baixo alcance do Wi-Fi",
        "Dispositivos não recebem IP",
        "Portas LAN sem comunicação",
        "Reinicializações inesperadas",
        "Configuração perdida ou incorreta"
      ]
    },
    telefonia: {
      label: "Telefonia",
      icon: "☎️",
      issues: [
        "Linha sem sinal",
        "Não realiza chamadas",
        "Não recebe chamadas",
        "Áudio unilateral",
        "Ruídos ou cortes",
        "Número não registrado",
        "Equipamento não sincroniza"
      ]
    },
    way_vision: {
      label: "Way Vision",
      icon: "📹",
      issues: [
        "Câmera offline ou sem comunicação",
        "Equipamento não liga",
        "Câmera reiniciando ou desconectando",
        "Sem imagem ao vivo",
        "Imagem travando ou intermitente",
        "Imagem borrada ou com baixa qualidade",
        "Imagem escura ou visão noturna não funciona",
        "Câmera não conecta ao Wi-Fi",
        "Acesso remoto indisponível",
        "Aplicativo Way Vision não abre ou não autentica",
        "Câmera não aparece ou não está vinculada à conta",
        "Não grava imagens",
        "Não localiza ou não reproduz gravações",
        "Cartão de memória ou armazenamento indisponível",
        "Detecção de movimento não funciona",
        "Notificações de eventos não chegam",
        "Áudio, microfone ou alto-falante não funciona",
        "Data ou horário das gravações incorretos",
        "Compartilhamento com outro usuário não funciona",
        "Movimentação ou controle PTZ não responde"
      ]
    }
  });

  let REQUESTS = Object.freeze([
    { id: "wifi_password", label: "Troca de senha do Wi-Fi", products: ["internet", "roteador"] },
    { id: "wifi_name", label: "Alteração do nome da rede Wi-Fi", products: ["internet", "roteador"] },
    { id: "device_connection", label: "Orientação de conexão de equipamento", products: ["*"] },
    { id: "port_forwarding", label: "Liberação ou redirecionamento de porta", products: ["internet", "roteador"] },
    { id: "dns_change", label: "Alteração de DNS", products: ["internet", "roteador", "dados_moveis"] },
    { id: "plan_information", label: "Informações sobre plano ou serviço", products: ["*"] },
    { id: "financial_copy", label: "Segunda via ou orientação financeira", products: ["*"] },
    { id: "trust_unlock", label: "Desbloqueio de confiança", products: ["internet", "roteador"] },
    { id: "registration_update", label: "Atualização cadastral", products: ["*"] },
    { id: "address_change", label: "Mudança de endereço", products: ["*"] },
    { id: "equipment_exchange", label: "Troca ou devolução de equipamento", products: ["internet", "roteador", "tv", "tv_box", "telefonia", "dados_moveis", "way_vision"] },
    { id: "tv_box_remote_exchange_damage", label: "Troca do controle remoto da TV Box por danos", products: ["tv_box"] },
    { id: "vision_installation", label: "Instalação ou configuração de câmera Way Vision", products: ["way_vision"] },
    { id: "vision_wifi_change", label: "Alteração da rede Wi-Fi da câmera", products: ["way_vision"] },
    { id: "vision_pairing", label: "Vinculação da câmera ao aplicativo Way Vision", products: ["way_vision"] },
    { id: "vision_share", label: "Compartilhamento de acesso à câmera", products: ["way_vision"] },
    { id: "vision_recording_guidance", label: "Orientação sobre gravações e armazenamento", products: ["way_vision"] },
    { id: "vision_notifications", label: "Configuração de detecção e notificações", products: ["way_vision"] },
    { id: "service_cancellation", label: "Cancelamento de serviço", products: ["*"] }
  ]);

  const TECHNICAL_CONTACTS = Object.freeze([
    "Problema técnico",
    "Reclamação",
    "Acompanhamento de atendimento"
  ]);

  let CHECKS = Object.freeze([
    { id: "identity", label: "Confirmados os dados do titular e do contrato", products: ["*"] },
    { id: "financial", label: "Verificado o status financeiro e cadastral", products: ["*"] },
    { id: "regional", label: "Verificada indisponibilidade ou manutenção na região", products: ["internet", "tv", "tv_box", "telefonia", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "regional_compare", label: "Comparado o cenário com outros clientes da região", products: ["internet", "tv", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { id: "olt", label: "Verificado o status da conexão na OLT/ONU", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { id: "optical", label: "Verificados os níveis de sinal óptico", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { id: "link_loss", label: "Verificado link loss ou perda de comunicação", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    {
      id: "radius_auth",
      label: "Consultado o log RADIUS e verificada a autenticação da conexão",
      products: ["internet", "roteador"],
      contacts: TECHNICAL_CONTACTS,
      triggers: { issues: ["internet_no_access"] },
      priority: { enabled: true, order: 4 }
    },
    {
      id: "nme_nce_link",
      label: "Verificado no NME/NCE se a conexão está linkando",
      products: ["internet", "roteador"],
      contacts: TECHNICAL_CONTACTS,
      triggers: { issues: ["internet_no_access"] },
      priority: { enabled: true, order: 5 }
    },
    { id: "uptime", label: "Verificado o tempo de atividade do equipamento", products: ["internet", "roteador", "tv_box", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "logs", label: "Analisados logs de quedas e reinicializações", products: ["internet", "roteador", "tv_box", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "leds", label: "Verificados os LEDs e o estado físico dos equipamentos", products: ["internet", "roteador", "tv_box", "telefonia", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "cables", label: "Verificados cabos, conectores e fonte de alimentação", products: ["internet", "roteador", "tv", "tv_box", "telefonia", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "devices", label: "Verificados dispositivos conectados ao roteador", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "connection_type", label: "Confirmado se a lentidão ocorre no Wi-Fi, no cabo ou em ambos", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { id: "wifi_connected_band", label: "Confirmada a frequência Wi-Fi conectada no dispositivo (2,4 GHz ou 5 GHz)", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "wifi_bands", label: "Verificadas as redes de 2,4 GHz e 5 GHz", products: ["internet", "roteador", "tv_box", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "wifi_channel", label: "Verificados canal, largura de canal e interferências do Wi-Fi", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "wifi_signal", label: "Verificados intensidade do sinal, distância e obstáculos do Wi-Fi", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "ethernet_link", label: "Verificados porta LAN, cabo e velocidade negociada do dispositivo", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "speed_cable", label: "Realizado teste de velocidade via cabo", products: ["internet", "roteador", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "speed_wireless", label: "Realizado teste de velocidade via Wi-Fi", products: ["internet", "roteador", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "ping", label: "Realizados testes de ping, latência e perda de pacotes", products: ["internet", "roteador", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "dns", label: "Realizado teste de navegação e resolução DNS", products: ["internet", "roteador", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "other_device", label: "Realizado teste em outro dispositivo", products: ["internet", "roteador", "dados_moveis", "tv", "tv_box", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "other_service", label: "Realizado teste em outro site ou aplicativo", products: ["internet", "dados_moveis", "tv", "tv_box", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "apn", label: "Verificada a configuração de APN e rede móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { id: "mobile_signal", label: "Verificados chip, cobertura e intensidade do sinal móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { id: "tv_service", label: "Verificados canais, autenticação e sinal do serviço de TV", products: ["tv"], contacts: TECHNICAL_CONTACTS },
    { id: "tv_box", label: "Verificados HDMI, energia e controle remoto da TV Box", products: ["tv_box"], contacts: TECHNICAL_CONTACTS },
    {
      id: "tv_box_remote_damage",
      label: "Verificados os danos físicos e o funcionamento do controle remoto da TV Box",
      products: ["tv_box"],
      contacts: ["Solicitação"],
      triggers: { requests: ["tv_box_remote_exchange_damage"] },
      priority: { enabled: true, order: 1 }
    },
    { id: "telephony", label: "Verificados registro, chamadas e qualidade de áudio", products: ["telefonia"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_power", label: "Verificados alimentação, fonte, cabos e LEDs da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_network", label: "Verificado se a câmera está conectada e recebe endereço IP na rede", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_wifi", label: "Verificados rede Wi-Fi, senha, frequência, sinal e alcance até a câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_app", label: "Verificado o funcionamento e a versão do aplicativo Way Vision", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_account", label: "Verificados login, permissões e autenticação da conta Way Vision", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_pairing", label: "Verificada a vinculação da câmera à conta do cliente", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_live", label: "Testada a visualização da imagem ao vivo", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_quality", label: "Verificadas resolução, qualidade, lente, foco e campo de visão", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_night", label: "Testados visão noturna, infravermelho e funcionamento em baixa luminosidade", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_recording", label: "Testadas gravação, reprodução e linha do tempo de eventos", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_storage", label: "Verificados cartão de memória, armazenamento e espaço disponível", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_motion", label: "Verificadas detecção de movimento, sensibilidade e áreas de detecção", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_notifications", label: "Verificados notificações do aplicativo e permissões do celular", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_audio", label: "Testados microfone, alto-falante e áudio bidirecional", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_datetime", label: "Verificados data, hora e fuso horário da câmera e das gravações", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_firmware", label: "Verificados modelo, versão e atualização de firmware da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_remote", label: "Testado o acesso remoto em outra rede e pelo aplicativo móvel", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_share", label: "Verificados compartilhamento e permissões de outros usuários", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_ptz", label: "Testados movimentação, posições e controle PTZ da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_physical", label: "Inspecionados lente, suporte, posicionamento e possíveis danos físicos", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    {
      id: "selfie",
      label: "Selfie com Documento",
      order: -1,
      products: ["internet", "roteador"],
      contacts: ["Solicitação"],
      triggers: { requests: ["wifi_password", "wifi_name"] },
      priority: { enabled: true, order: 1 }
    }
  ]);

  let CHECK_RECOMMENDATION_RULES = Object.freeze([
    { product: "internet", issues: ["Sem acesso à internet", "Link loss ou ausência de sinal óptico"], checks: ["regional", "regional_compare", "olt", "optical", "link_loss", "leds", "cables"] },
    { product: "internet", issues: ["Sem acesso à internet"], checks: ["radius_auth", "nme_nce_link"] },
    { product: "internet", issues: ["Conexão intermitente", "Quedas em horários específicos"], checks: ["regional", "optical", "uptime", "logs", "cables", "ping"] },
    { product: "internet", issues: [SLOWNESS_ISSUE], checks: ["regional", "devices", "connection_type", "ping", "other_device"] },
    { product: "internet", issues: ["Latência elevada", "Perda de pacotes"], checks: ["regional", "speed_cable", "ping", "other_device"] },
    { product: "internet", issues: ["Acesso parcial a sites ou aplicativos"], checks: ["dns", "other_device", "other_service"] },
    { product: "internet", issues: ["Problema apenas via Wi-Fi"], checks: ["devices", "wifi_bands", "wifi_channel", "speed_wireless", "other_device"] },
    { product: "internet", issues: ["Problema apenas via cabo"], checks: ["cables", "devices", "speed_cable", "other_device"] },
    { product: "roteador", issues: ["Roteador não liga", "LEDs em estado anormal"], checks: ["leds", "cables"] },
    { product: "roteador", issues: ["Rede Wi-Fi não aparece", "Senha não é aceita"], checks: ["leds", "wifi_bands", "other_device"] },
    { product: "roteador", issues: ["Baixo alcance do Wi-Fi"], checks: ["devices", "wifi_bands", "wifi_channel", "speed_wireless", "other_device"] },
    { product: "roteador", issues: ["Dispositivos não recebem IP", "Portas LAN sem comunicação"], checks: ["devices", "cables", "other_device"] },
    { product: "roteador", issues: ["Reinicializações inesperadas"], checks: ["uptime", "logs", "leds", "cables"] },
    { product: "roteador", issues: ["Configuração perdida ou incorreta"], checks: ["devices", "wifi_bands", "wifi_channel"] },
    { product: "dados_moveis", issues: ["Sem acesso aos dados móveis", "APN incorreta ou não configurada", "Problema após troca de aparelho"], checks: ["apn", "mobile_signal", "other_device"] },
    { product: "dados_moveis", issues: ["Sinal móvel ausente ou fraco", "Chip não reconhecido", "Problema em chamadas ou SMS"], checks: ["mobile_signal", "other_device"] },
    { product: "dados_moveis", issues: ["Conexão móvel intermitente", "Lentidão nos dados móveis"], checks: ["regional", "mobile_signal", "speed_wireless", "ping", "other_device"] },
    { product: "tv", issues: ["Sem sinal", "Canais indisponíveis", "Problema em canal específico", "Erro de autenticação"], checks: ["regional", "regional_compare", "tv_service", "cables", "other_device"] },
    { product: "tv", issues: ["Imagem travando ou pixelizando", "Imagem sem áudio", "Áudio sem imagem", "Aplicativo de TV não abre"], checks: ["tv_service", "cables", "other_device", "other_service"] },
    { product: "tv_box", issues: ["Equipamento não liga", "Travado na inicialização", "Controle remoto não responde", "Saída HDMI sem sinal"], checks: ["tv_box", "leds", "cables"] },
    { product: "tv_box", issues: ["Sem conexão com a internet", "Aplicativos não abrem", "Imagem ou áudio com falhas"], checks: ["tv_box", "wifi_bands", "other_device", "other_service"] },
    { product: "tv_box", issues: ["Reinicializações inesperadas"], checks: ["tv_box", "uptime", "logs", "cables"] },
    { product: "telefonia", issues: ["Linha sem sinal", "Número não registrado", "Equipamento não sincroniza"], checks: ["regional", "olt", "optical", "link_loss", "leds", "cables", "telephony"] },
    { product: "telefonia", issues: ["Não realiza chamadas", "Não recebe chamadas", "Áudio unilateral", "Ruídos ou cortes"], checks: ["regional", "cables", "telephony"] },
    { product: "way_vision", issues: ["Câmera offline ou sem comunicação", "Equipamento não liga", "Câmera reiniciando ou desconectando"], checks: ["regional", "vision_power", "vision_network", "vision_wifi", "vision_firmware", "uptime", "logs", "cables"] },
    { product: "way_vision", issues: ["Sem imagem ao vivo", "Imagem travando ou intermitente", "Acesso remoto indisponível"], checks: ["vision_live", "vision_network", "vision_wifi", "vision_remote", "ping", "speed_wireless", "other_device"] },
    { product: "way_vision", issues: ["Imagem borrada ou com baixa qualidade", "Imagem escura ou visão noturna não funciona"], checks: ["vision_quality", "vision_night", "vision_physical", "vision_firmware"] },
    { product: "way_vision", issues: ["Câmera não conecta ao Wi-Fi"], checks: ["vision_network", "vision_wifi", "wifi_connected_band", "wifi_signal", "wifi_channel", "ping"] },
    { product: "way_vision", issues: ["Aplicativo Way Vision não abre ou não autentica", "Câmera não aparece ou não está vinculada à conta", "Compartilhamento com outro usuário não funciona"], checks: ["vision_app", "vision_account", "vision_pairing", "vision_share", "vision_remote", "other_device"] },
    { product: "way_vision", issues: ["Não grava imagens", "Não localiza ou não reproduz gravações", "Cartão de memória ou armazenamento indisponível", "Data ou horário das gravações incorretos"], checks: ["vision_recording", "vision_storage", "vision_datetime", "vision_firmware"] },
    { product: "way_vision", issues: ["Detecção de movimento não funciona", "Notificações de eventos não chegam"], checks: ["vision_motion", "vision_notifications", "vision_datetime", "vision_app"] },
    { product: "way_vision", issues: ["Áudio, microfone ou alto-falante não funciona"], checks: ["vision_audio", "vision_app", "vision_firmware"] },
    { product: "way_vision", issues: ["Movimentação ou controle PTZ não responde"], checks: ["vision_ptz", "vision_firmware", "vision_physical"] }
  ]);

  let ACTIONS = Object.freeze([
    { label: "Reiniciado o roteador/ONU", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Reprovisionado o equipamento", products: ["internet", "roteador", "tv", "tv_box", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Recriada a autenticação da conexão", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Alterados nome e/ou senha do Wi-Fi", products: ["internet", "roteador"], contacts: ["Solicitação", "Problema técnico"] },
    { label: "Separadas as redes de 2,4 GHz e 5 GHz", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Ajustados canal e largura de canal do Wi-Fi", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Alterado o modo de segurança do Wi-Fi", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Alterados os servidores DNS", products: ["internet", "roteador", "dados_moveis"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { label: "Ajustadas configurações de DHCP ou rede local", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado redirecionamento/liberação de porta", products: ["internet", "roteador"], contacts: ["Solicitação"] },
    { label: "Restaurado o equipamento para o padrão de fábrica", products: ["roteador", "tv_box", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { label: "Atualizado o firmware ou aplicativo", products: ["roteador", "tv", "tv_box", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { label: "Reconfigurada a APN/rede móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Reenviado sinal ou comando de ativação", products: ["tv", "tv_box", "telefonia", "internet"], contacts: TECHNICAL_CONTACTS },
    { label: "Limpos cache e dados do aplicativo", products: ["tv", "tv_box", "dados_moveis", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { label: "Refeito o pareamento do controle remoto", products: ["tv_box", "tv"], contacts: TECHNICAL_CONTACTS },
    { label: "Substituídos cabos ou conexões durante o teste", products: ["internet", "roteador", "tv", "tv_box", "telefonia", "way_vision"], contacts: TECHNICAL_CONTACTS },
    { label: "Orientado o cliente sobre posicionamento e alcance do Wi-Fi", products: ["internet", "roteador", "way_vision"], contacts: ["Problema técnico", "Dúvida ou orientação"] },
    {
      id: "wifi_band_usage_guidance",
      label: "Orientado o cliente sobre as diferenças e o uso adequado das redes de 2,4 GHz e 5 GHz",
      products: ["internet"],
      contacts: TECHNICAL_CONTACTS,
      triggers: { issues: ["internet_slowness"] },
      priority: { enabled: true, order: 5 }
    },
    { id: "vision_restart", label: "Reiniciada a câmera Way Vision", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_wifi_reconnect", label: "Reconectada a câmera à rede Wi-Fi", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação"] },
    { id: "vision_relink", label: "Removida e vinculada novamente a câmera no aplicativo Way Vision", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação"] },
    { id: "vision_login_adjust", label: "Regularizados acesso, autenticação ou permissões da conta Way Vision", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { id: "vision_video_adjust", label: "Ajustadas resolução, qualidade e parâmetros de imagem da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_recording_adjust", label: "Configuradas gravação, reprodução e armazenamento da câmera", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { id: "vision_storage_format", label: "Formatado ou reinicializado o armazenamento da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_motion_adjust", label: "Configuradas detecção, sensibilidade e áreas de movimento", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { id: "vision_notification_adjust", label: "Ativadas notificações e permissões do aplicativo Way Vision", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { id: "vision_datetime_adjust", label: "Corrigidos data, hora e fuso horário da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_audio_adjust", label: "Ajustados microfone, alto-falante e áudio bidirecional", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_ptz_adjust", label: "Recalibrados movimentação e controle PTZ da câmera", products: ["way_vision"], contacts: TECHNICAL_CONTACTS },
    { id: "vision_reposition", label: "Orientado reposicionamento da câmera, lente ou suporte", products: ["way_vision"], contacts: ["Problema técnico", "Solicitação", "Dúvida ou orientação"] },
    { label: "Orientado o cliente a acompanhar o serviço", products: ["*"], contacts: TECHNICAL_CONTACTS },
    { label: "Aberto chamado interno ou escalonado para outra equipe", products: ["*"], contacts: TECHNICAL_CONTACTS }
  ]);

  let VISIT_REASONS = Object.freeze([
    { label: "Link loss/ausência de sinal óptico", products: ["internet", "roteador", "telefonia"] },
    { label: "Sinal óptico fora dos parâmetros", products: ["internet", "roteador", "telefonia"] },
    { label: "Possível defeito no roteador, ONU ou fonte", products: ["internet", "roteador"] },
    { label: "Possível defeito no receptor ou TV Box", products: ["tv", "tv_box"] },
    { label: "Possível problema em cabo ou conector", products: ["internet", "roteador", "tv", "tv_box", "telefonia", "way_vision"] },
    { label: "Falha na infraestrutura interna ou externa", products: ["internet", "roteador", "telefonia"] },
    { label: "Equipamento sem comunicação e sem acesso remoto", products: ["internet", "roteador", "tv_box", "telefonia", "way_vision"] },
    { id: "vision_camera_defect", label: "Possível defeito na câmera, fonte ou alimentação", products: ["way_vision"] },
    { id: "vision_wifi_coverage", label: "Sinal Wi-Fi insuficiente no local de instalação da câmera", products: ["way_vision"] },
    { id: "vision_storage_defect", label: "Possível defeito no cartão de memória ou armazenamento", products: ["way_vision"] },
    { id: "vision_physical_adjustment", label: "Necessidade de ajuste físico, suporte ou reposicionamento da câmera", products: ["way_vision"] },
    { id: "vision_physical_damage", label: "Possível dano físico, umidade ou comprometimento da lente", products: ["way_vision"] },
    { label: "Problema recorrente após ajustes remotos", products: ["*"] },
    { label: "Necessidade de testes presenciais", products: ["*"] },
    { label: "Solicitação de troca ou instalação de equipamento", products: ["*"] }
  ]);

  let OUTCOME_VALIDATION = Object.freeze({
    resolvido: "Cliente realizou os testes e confirmou a solução do problema.",
    normalizado: "Cliente confirmou a normalização do serviço após os ajustes.",
    solicitacao: "Solicitação realizada conforme solicitado pelo cliente.",
    orientado: "Cliente recebeu as orientações necessárias e ficou ciente das informações.",
    monitoramento: "Cliente orientado a acompanhar o funcionamento do serviço.",
    aguardando: "Atendimento permanece aguardando teste ou retorno do cliente.",
    ativo: "Será realizado contato ativo com o cliente para continuidade do atendimento.",
    escalonado: "Cliente informado sobre o encaminhamento para a equipe responsável.",
    visita: "Cliente informado sobre a necessidade de atendimento presencial.",
    nao_concluido: "Atendimento não concluído; detalhes registrados nas observações finais."
  });

  let OUTCOMES = Object.freeze([
    ["resolvido", "Problema solucionado durante o atendimento", TECHNICAL_CONTACTS],
    ["normalizado", "Serviço normalizado após os ajustes", TECHNICAL_CONTACTS],
    ["solicitacao", "Solicitação concluída", ["Solicitação"]],
    ["orientado", "Cliente orientado, sem falha identificada", ["Problema técnico", "Solicitação", "Dúvida ou orientação"]],
    ["monitoramento", "Serviço em monitoramento", TECHNICAL_CONTACTS],
    ["aguardando", "Aguardando retorno ou teste do cliente", ["*"]],
    ["ativo", "Será realizado contato ativo com o cliente", ["*"]],
    ["escalonado", "Atendimento escalonado para outra equipe", TECHNICAL_CONTACTS],
    ["visita", "Necessário agendamento de visita técnica", TECHNICAL_CONTACTS],
    ["nao_concluido", "Atendimento não concluído", ["*"]]
  ]);
  let OUTCOME_ROUTES = Object.freeze({});

  function applyDeveloperCatalogOverride() {
    const catalog = globalThis.WAY_TOOLS_REPORT_GENERATOR_DEVELOPER_OVERRIDE;
    if (location.protocol !== "chrome-extension:" || !catalog || !Array.isArray(catalog.stages)) {
      return;
    }
    const categories = new Map(catalog.stages
      .flatMap((stage) => Array.isArray(stage.categories) ? stage.categories : [])
      .filter((category) => category && typeof category.id === "string")
      .map((category) => [category.id, category]));
    const options = (categoryId) => Array.isArray(categories.get(categoryId)?.options)
      ? orderedItems(cloneForDeveloper(categories.get(categoryId).options))
      : null;

    const contactTypes = options("contact_types");
    if (contactTypes) CONTACT_TYPES = Object.freeze(contactTypes.map((option) => option.label).filter(Boolean));

    const productOptions = options("products");
    if (productOptions) {
      PRODUCTS = Object.freeze(Object.fromEntries(productOptions.map((product) => {
        const issueOptions = options(`issues_${product.id}`) || [];
        return [product.id, {
          label: product.label,
          icon: product.icon || "•",
          issues: issueOptions.map((issue) => ({ ...issue }))
        }];
      })));
    }

    const requestOptions = options("requests");
    if (requestOptions) REQUESTS = Object.freeze(requestOptions);
    const checkOptions = options("checks");
    if (checkOptions) CHECKS = Object.freeze(checkOptions);
    const recommendationOptions = options("recommendations");
    if (recommendationOptions) {
      CHECK_RECOMMENDATION_RULES = Object.freeze(recommendationOptions.map((option) => ({
        product: option.product,
        issues: Array.isArray(option.issues) ? option.issues : [],
        checks: Array.isArray(option.checks) ? option.checks : []
      })));
    }
    const measurementOptions = options("measurements");
    if (measurementOptions) MEASUREMENT_FIELDS = Object.freeze(measurementOptions);
    const actionOptions = options("actions");
    if (actionOptions) ACTIONS = Object.freeze(actionOptions);
    const visitOptions = options("visit_reasons");
    if (visitOptions) VISIT_REASONS = Object.freeze(visitOptions);

    const scopeOptions = options("scope");
    if (scopeOptions) SCOPE_OPTIONS = Object.freeze(scopeOptions.map((option) => ({ value: option.value ?? option.label, label: option.label })));
    const frequencyOptions = options("frequency");
    if (frequencyOptions) FREQUENCY_OPTIONS = Object.freeze(frequencyOptions.map((option) => ({ value: option.value ?? option.label, label: option.label })));
    const wifiBandOptions = options("wifi_bands");
    if (wifiBandOptions) WIFI_BAND_OPTIONS = Object.freeze(wifiBandOptions.map((option) => ({ value: option.value ?? option.label, label: option.label })));

    const noInteractionReasons = options("no_interaction_reasons");
    const noInteractionAttempts = options("no_interaction_attempts");
    const noInteractionResults = options("no_interaction_results");
    NO_INTERACTION_OPTIONS = Object.freeze({
      reasons: Object.freeze((noInteractionReasons || NO_INTERACTION_OPTIONS.reasons).map((option) => option.label || option)),
      attempts: Object.freeze((noInteractionAttempts || NO_INTERACTION_OPTIONS.attempts).map((option) =>
        typeof option === "string"
          ? option
          : { value: option.value ?? option.label, label: option.label }
      )),
      results: Object.freeze((noInteractionResults || NO_INTERACTION_OPTIONS.results).map((option) => option.label || option))
    });

    const outcomeOptions = options("outcomes");
    if (outcomeOptions) {
      OUTCOME_ROUTES = Object.freeze(Object.fromEntries(outcomeOptions.map((option) => [
        option.id,
        {
          products: Array.isArray(option.products) && option.products.length ? option.products : ["*"],
          triggers: cloneForDeveloper(option.triggers || {}),
          priority: cloneForDeveloper(option.priority || {}),
          order: numericOrder(option.order, 10)
        }
      ])));
      OUTCOMES = Object.freeze(outcomeOptions.map((option) => [
        option.id,
        option.label,
        Array.isArray(option.contacts) && option.contacts.length ? option.contacts : ["*"]
      ]));
      OUTCOME_VALIDATION = Object.freeze(Object.fromEntries(outcomeOptions.map((option) => [
        option.id,
        option.validation || ""
      ])));
    }
  }

  applyDeveloperCatalogOverride();

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function stableDraftId(value) {
    let hash = 2166136261;
    for (const character of String(value || "way-tools")) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function reportDraftStorageKey(client, editor) {
    const identifiedClient = [
      normalizeText(client.protocol),
      normalizeText(client.contract),
      normalizeText(client.name)
    ].filter(Boolean);
    if (!identifiedClient.length && editor) {
      editor.dataset.wayReportDraftIdentity ||= globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      identifiedClient.push(editor.dataset.wayReportDraftIdentity);
    }
    const identity = [...identifiedClient, location.pathname].join("|");
    return `${DRAFT_STORAGE_PREFIX}${stableDraftId(identity)}`;
  }

  function serializeReportDraft(form, currentPage) {
    const fields = {};
    for (const element of form.elements) {
      if (!element.name || element.disabled) {
        continue;
      }
      if (element.type === "checkbox") {
        if (!Array.isArray(fields[element.name])) {
          fields[element.name] = [];
        }
        if (element.checked) {
          fields[element.name].push(element.value);
        }
      } else if (element.type === "radio") {
        if (!Object.prototype.hasOwnProperty.call(fields, element.name)) {
          fields[element.name] = "";
        }
        if (element.checked) {
          fields[element.name] = element.value;
        }
      } else {
        fields[element.name] = element.value;
      }
    }
    return { version: 1, currentPage, fields, updatedAt: Date.now() };
  }

  function saveReportDraft(storageKey, form, currentPage) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(serializeReportDraft(form, currentPage)));
      return true;
    } catch (error) {
      console.warn("[Way ERP] Não foi possível salvar o rascunho do relato:", error);
      return false;
    }
  }

  function loadReportDraft(storageKey) {
    try {
      const draft = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      return draft?.version === 1 && draft.fields && typeof draft.fields === "object"
        ? draft
        : null;
    } catch (error) {
      console.warn("[Way ERP] Não foi possível restaurar o rascunho do relato:", error);
      return null;
    }
  }

  function removeReportDraft(storageKey) {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("[Way ERP] Não foi possível remover o rascunho do relato:", error);
    }
  }

  function restoreReportDraft(form, draft) {
    if (!draft) {
      return;
    }
    for (const element of form.elements) {
      if (!element.name || !Object.prototype.hasOwnProperty.call(draft.fields, element.name)) {
        continue;
      }
      const storedValue = draft.fields[element.name];
      if (element.type === "checkbox") {
        element.checked = Array.isArray(storedValue) && storedValue.includes(element.value);
      } else if (element.type === "radio") {
        element.checked = storedValue === element.value;
      } else if (typeof storedValue === "string") {
        element.value = storedValue;
      }
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function selectOptions(items, selectedValue = "") {
    return items.map((item) => {
      const option = typeof item === "string" ? { value: item, label: item } : item;
      const selected = option.value === selectedValue ? " selected" : "";
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join("");
  }

  function cloneForDeveloper(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function numericOrder(value, fallback) {
    const order = Number(value);
    return Number.isFinite(order) ? order : fallback;
  }

  function orderedEntries(items) {
    return items.map((item, index) => ({ item, index }))
      .sort((left, right) =>
        numericOrder(left.item?.order, (left.index + 1) * 10) -
        numericOrder(right.item?.order, (right.index + 1) * 10) ||
        left.index - right.index
      );
  }

  function orderedItems(items) {
    return orderedEntries(items).map(({ item }) => item);
  }

  function developerOptions(items, prefix) {
    return items.map((item, index) => {
      if (typeof item === "string") {
        return { id: `${prefix}_${index + 1}`, label: item, order: (index + 1) * 10 };
      }
      return {
        ...cloneForDeveloper(item),
        id: item.id || `${prefix}_${index + 1}`,
        order: numericOrder(item.order, (index + 1) * 10)
      };
    });
  }

  function buildDeveloperCatalog() {
    const productOptions = Object.entries(PRODUCTS).map(([id, product], index) => ({
      id,
      label: product.label,
      icon: product.icon,
      order: numericOrder(product.order, (index + 1) * 10)
    }));
    const problemCategories = Object.entries(PRODUCTS).map(([id, product]) => ({
      id: `issues_${id}`,
      label: `Problemas — ${product.label}`,
      description: `Problemas exibidos quando o produto ${product.label} está selecionado.`,
      options: developerOptions(product.issues, `issues_${id}`)
    }));
    const outcomeOptions = OUTCOMES.map(([id, label, contacts], index) => ({
      id,
      label,
      contacts: cloneForDeveloper(contacts),
      validation: OUTCOME_VALIDATION[id] || "",
      ...cloneForDeveloper(OUTCOME_ROUTES[id] || {}),
      order: numericOrder(OUTCOME_ROUTES[id]?.order, (index + 1) * 10)
    }));
    const recommendationOptions = CHECK_RECOMMENDATION_RULES.map((rule, index) => ({
      id: `recommendation_${index + 1}`,
      label: `${PRODUCTS[rule.product]?.label || rule.product} — ${rule.issues.join(" / ")}`,
      order: (index + 1) * 10,
      product: rule.product,
      issues: cloneForDeveloper(rule.issues),
      checks: cloneForDeveloper(rule.checks)
    }));

    return {
      schemaVersion: 3,
      generatorVersion: "1.13",
      title: "Way Tools — Catálogo de desenvolvimento do Gerador de Relato",
      note: "Proposta editável. A exportação não altera automaticamente o gerador instalado.",
      stages: [
        {
          id: "attendance",
          label: "1. Atendimento",
          description: "Identificação, motivo do contato e produtos envolvidos.",
          categories: [
            { id: "client_fields", label: "Campos do cliente", options: developerOptions([
              { id: "client_name", label: "Nome do cliente", type: "text" },
              { id: "phone", label: "Telefone", type: "text" },
              { id: "protocol", label: "Protocolo", type: "text" },
              { id: "contract", label: "Contrato", type: "text" }
            ], "client") },
            { id: "contact_types", label: "Motivos do contato", options: developerOptions(CONTACT_TYPES, "contact") },
            { id: "products", label: "Produtos ou serviços", options: productOptions },
            { id: "no_interaction_reasons", label: "Chat sem interação — cenários", options: developerOptions(NO_INTERACTION_OPTIONS.reasons, "no_interaction_reason") },
            { id: "no_interaction_attempts", label: "Chat sem interação — tentativas", options: developerOptions(NO_INTERACTION_OPTIONS.attempts, "no_interaction_attempt") },
            { id: "no_interaction_results", label: "Chat sem interação — finalizações", options: developerOptions(NO_INTERACTION_OPTIONS.results, "no_interaction_result") }
          ]
        },
        {
          id: "problem",
          label: "2. Problema ou solicitação",
          description: "Problemas por produto, solicitações e contexto técnico.",
          categories: [
            ...problemCategories,
            { id: "requests", label: "Solicitações", options: developerOptions(REQUESTS, "request") },
            { id: "scope", label: "Abrangência", options: developerOptions(SCOPE_OPTIONS, "scope") },
            { id: "frequency", label: "Frequência", options: developerOptions(FREQUENCY_OPTIONS, "frequency") },
            { id: "slowness_connections", label: "Lentidão — tipo de conexão", options: [
              { id: "wifi", label: "Wi-Fi", icon: "📶" },
              { id: "cable", label: "Cabo de rede", icon: "🔌" }
            ] },
            { id: "wifi_bands", label: "Lentidão — frequência Wi-Fi", options: developerOptions(WIFI_BAND_OPTIONS, "wifi_band") }
          ]
        },
        {
          id: "checks",
          label: "3. Verificações",
          description: "Verificações realizadas, medições e regras de prioridade.",
          categories: [
            { id: "checks", label: "Verificações disponíveis", options: developerOptions(CHECKS, "check") },
            { id: "recommendations", label: "Regras de verificações importantes", description: "Relaciona produtos e problemas aos IDs das verificações que devem receber destaque.", options: recommendationOptions },
            { id: "measurements", label: "Medições técnicas", options: developerOptions(MEASUREMENT_FIELDS, "measurement") }
          ]
        },
        {
          id: "actions",
          label: "4. Ações",
          description: "Ajustes e orientações realizados durante o atendimento.",
          categories: [
            { id: "actions", label: "Ações e ajustes", options: developerOptions(ACTIONS, "actions") }
          ]
        },
        {
          id: "finalization",
          label: "5. Finalização",
          description: "Resultados, validações e motivos de visita técnica.",
          categories: [
            { id: "outcomes", label: "Resultados do atendimento", options: outcomeOptions },
            { id: "visit_reasons", label: "Motivos da visita técnica", options: developerOptions(VISIT_REASONS, "visit_reasons") }
          ]
        },
        {
          id: "preview",
          label: "6. Prévia",
          description: "Ordem das seções usadas na composição do texto final.",
          categories: [
            { id: "report_sections", label: "Seções do relato", options: developerOptions([
              "Relato do atendimento",
              "Identificação do cliente",
              "Descrição inicial",
              "Produtos/serviços envolvidos",
              "Problemas informados",
              "Solicitações",
              "Cenário identificado",
              "Verificações realizadas",
              "Resultados dos testes",
              "Ações e ajustes realizados",
              "Finalização",
              "Motivo da visita técnica",
              "Observações finais"
            ], "report_section") }
          ]
        }
      ]
    };
  }

  function checkedList(items, name, extra = "") {
    return orderedEntries(items).map(({ item, index }) => {
      const option = typeof item === "string" ? { label: item } : item;
      const routeProducts = Array.isArray(option.products) ? option.products.join("|") : "*";
      const routeContacts = Array.isArray(option.contacts) ? option.contacts.join("|") : "*";
      const routeRequests = Array.isArray(option.triggers?.requests) ? option.triggers.requests.join("|") : "*";
      const routeIssues = Array.isArray(option.triggers?.issues) ? option.triggers.issues.join("|") : "*";
      const optionId = normalizeText(option.id) || `${name}_${index + 1}`;
      const optionOrder = numericOrder(option.order, (index + 1) * 10);
      const priorityOrder = numericOrder(option.priority?.order, optionOrder);
      const configuredPriority = option.priority?.enabled === true
        ? "true"
        : option.priority?.enabled === false ? "false" : "";
      const priorityBadge = name === "checks" || configuredPriority === "true"
        ? '<small class="way-report-priority" aria-label="Opção prioritária">Prioritária</small>'
        : "";
      return `
      <label class="way-report-check" data-route-products="${escapeHtml(routeProducts)}" data-route-contacts="${escapeHtml(routeContacts)}" data-route-requests="${escapeHtml(routeRequests)}" data-route-issues="${escapeHtml(routeIssues)}" data-option-id="${escapeHtml(optionId)}" data-option-order="${optionOrder}" data-priority-enabled="${configuredPriority}" data-priority-order="${priorityOrder}" style="order:${optionOrder}">
        <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(option.label)}" data-option-id="${escapeHtml(optionId)}" ${extra}>
        <span class="way-report-check-copy"><span>${escapeHtml(option.label)}</span>${priorityBadge}</span>
      </label>
    `;
    }).join("");
  }

  function selectedValues(form, name) {
    return [...form.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`)]
      .map((input) => normalizeText(input.value))
      .filter(Boolean);
  }

  function selectedProductIds(form) {
    return [...form.querySelectorAll('input[name="products"]:checked')]
      .map((input) => input.dataset.product)
      .filter(Boolean);
  }

  function selectedOptionIds(form, name) {
    return [...form.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`)]
      .map((input) => normalizeText(input.dataset.optionId))
      .filter(Boolean);
  }

  function selectedIssueIds(form) {
    return selectedProductIds(form).flatMap((productId) => selectedOptionIds(form, `issues_${productId}`));
  }

  function selectedIssueEntries(form) {
    return selectedProductIds(form).flatMap((productId) =>
      selectedValues(form, `issues_${productId}`).map((issue) => ({ productId, issue }))
    );
  }

  function recommendedCheckIds(form) {
    const selectedIssues = selectedIssueEntries(form);
    const selectedRequests = new Set(selectedOptionIds(form, "requests"));
    const selectedIssueOptionIds = new Set(selectedIssueIds(form));
    const recommendations = new Set();

    for (const rule of CHECK_RECOMMENDATION_RULES) {
      if (selectedIssues.some(({ productId, issue }) =>
        productId === rule.product && rule.issues.includes(issue)
      )) {
        rule.checks.forEach((checkId) => recommendations.add(checkId));
      }
    }

    for (const check of CHECKS) {
      const requestTriggers = Array.isArray(check.triggers?.requests) ? check.triggers.requests : [];
      const issueTriggers = Array.isArray(check.triggers?.issues) ? check.triggers.issues : [];
      if (requestTriggers.some((id) => selectedRequests.has(id)) ||
          issueTriggers.some((id) => selectedIssueOptionIds.has(id))) {
        recommendations.add(check.id);
      }
    }

    const hasInternetSlowness = selectedIssues.some(({ productId, issue }) =>
      productId === "internet" && issue === SLOWNESS_ISSUE
    );
    if (hasInternetSlowness) {
      const connectionIds = new Set(
        [...form.querySelectorAll('input[name="slowness_connections"]:checked')]
          .map((input) => input.dataset.slownessConnection)
          .filter(Boolean)
      );

      if (connectionIds.has("wifi")) {
        ["wifi_connected_band", "wifi_bands", "wifi_channel", "wifi_signal", "speed_wireless"]
          .forEach((checkId) => recommendations.add(checkId));
      }
      if (connectionIds.has("cable")) {
        ["cables", "ethernet_link", "speed_cable"]
          .forEach((checkId) => recommendations.add(checkId));
      }
    }

    return recommendations;
  }

  function routeAllows(element, productIds, contactType, requestIds = [], issueIds = []) {
    const productRoutes = String(element.dataset.routeProducts || "*").split("|");
    const contactRoutes = String(element.dataset.routeContacts || "*").split("|");
    const requestRoutes = String(element.dataset.routeRequests || "*").split("|");
    const issueRoutes = String(element.dataset.routeIssues || "*").split("|");
    const productMatches = productRoutes.includes("*") || productRoutes.some((id) => productIds.includes(id));
    const contactMatches = contactRoutes.includes("*") || contactRoutes.includes(contactType);
    const requestMatches = requestRoutes.includes("*") || requestRoutes.some((id) => requestIds.includes(id));
    const issueMatches = issueRoutes.includes("*") || issueRoutes.some((id) => issueIds.includes(id));
    return productMatches && contactMatches && requestMatches && issueMatches;
  }

  function firstVisibleEditor() {
    return [...document.querySelectorAll(EDITOR_SELECTOR)].find((editor) =>
      editor.isConnected && editor.getClientRects().length > 0
    ) || document.querySelector(EDITOR_SELECTOR);
  }

  function textFromSelector(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const value = normalizeText(
        element?.dataset?.wayValue ||
        element?.dataset?.wayValor ||
        element?.textContent
      );
      if (value) {
        return value.replace(/^[^:]{1,80}:\s*/, "");
      }
    }
    return "";
  }

  function valueByLabel(labels) {
    const expected = labels.map((label) => label.toLocaleLowerCase("pt-BR"));
    for (const element of document.querySelectorAll("label, span, p, strong, dt")) {
      const text = normalizeText(element.textContent).replace(/:$/, "").toLocaleLowerCase("pt-BR");
      if (!expected.includes(text)) {
        continue;
      }
      const container = element.closest(".MuiGrid-root, .form-group, .row, dd, div") || element.parentElement;
      const input = container?.querySelector("input, textarea, select");
      const inputValue = normalizeText(input?.value);
      if (inputValue) {
        return inputValue;
      }
      const fullText = normalizeText(container?.textContent);
      const value = normalizeText(fullText.slice(normalizeText(element.textContent).length)).replace(/^:\s*/, "");
      if (value && value !== fullText) {
        return value;
      }
    }
    return "";
  }

  function extractFromEditor(editor, label) {
    const lines = String(editor?.innerText || editor?.textContent || "").split(/\r?\n/);
    const expression = new RegExp(`^\\s*(?:[^\\p{L}\\p{N}]+\\s*)?${label}\\s*:\\s*(.+)$`, "iu");
    for (const line of lines) {
      const match = normalizeText(line).match(expression);
      if (match?.[1]) {
        return normalizeText(match[1]);
      }
    }
    return "";
  }

  function detectClientData(editor) {
    return {
      name: extractFromEditor(editor, "Nome") ||
        textFromSelector(['[data-way-value="nome"]', ".way-erp-copy-cliente", ".contato-nome"]) ||
        valueByLabel(["Cliente", "Nome do cliente", "Nome"]),
      phone: extractFromEditor(editor, "Telefone") ||
        textFromSelector(['[data-way-value="telefone"]', ".contato-telefone"]) ||
        valueByLabel(["Telefone", "Celular"]),
      protocol: extractFromEditor(editor, "Protocolo") ||
        textFromSelector(['[data-way-value="protocolo"]', ".way-erp-copy-protocolo-top", ".atendimento-protocolo"]) ||
        valueByLabel(["Número de protocolo", "Protocolo"]),
      contract: textFromSelector(['[data-way-value="contrato"]', ".way-erp-copy-contrato"]) ||
        valueByLabel(["Contrato", "Número do contrato"])
    };
  }

  function listSection(title, items) {
    if (!items.length) {
      return [];
    }
    return [title, ...items.map((item) => `• ${item}`), ""];
  }

  function appendClientIdentification(lines, form, contactType) {
    const fields = [
      ["Cliente", form.elements.client_name.value],
      ["Telefone", form.elements.phone.value],
      ["Protocolo", form.elements.protocol.value],
      ["Contrato", form.elements.contract.value]
    ];

    for (const [label, value] of fields) {
      if (normalizeText(value)) {
        lines.push(`${label}: ${normalizeText(value)}`);
      }
    }

    lines.push(`Tipo de contato: ${contactType}`, "");
  }

  function generateNoInteractionReport(form) {
    const lines = ["RELATO DO ATENDIMENTO", ""];
    appendClientIdentification(lines, form, NO_INTERACTION_CONTACT);
    lines.push("CHAT SEM INTERAÇÃO");
    lines.push(...[
      form.elements.no_interaction_reason.value,
      form.elements.no_interaction_attempts.value,
      form.elements.no_interaction_result.value
    ].map(normalizeText).filter(Boolean));

    const notes = normalizeText(form.elements.no_interaction_notes.value);
    if (notes) {
      lines.push("", "OBSERVAÇÕES", notes);
    }

    return lines.filter((line, index, list) => line || list[index - 1]).join("\n").trim();
  }

  function generateReport(form) {
    const contactType = form.elements.contact_type.value;

    if (contactType === NO_INTERACTION_CONTACT) {
      return generateNoInteractionReport(form);
    }

    const products = selectedValues(form, "products");
    const productIds = selectedProductIds(form);
    const requests = selectedValues(form, "requests");
    const checks = selectedValues(form, "checks");
    const actions = selectedValues(form, "actions");
    const visitReasons = selectedValues(form, "visit_reasons");
    const showTechnicalProblems = ["Problema técnico", "Reclamação", "Acompanhamento de atendimento"].includes(contactType);
    const outcomeValue = form.elements.outcome.value;
    const outcome = OUTCOMES.find(([value]) => value === outcomeValue)?.[1] || "Não informado";
    const lines = ["RELATO DO ATENDIMENTO", ""];

    appendClientIdentification(lines, form, contactType);

    const summary = normalizeText(form.elements.initial_summary.value);
    const clientReference = normalizeText(form.elements.client_name.value) || "Cliente";
    const productReference = products.length ? products.join(", ") : "o serviço contratado";
    const automaticOpening = contactType === "Problema técnico"
      ? `${clientReference} entrou em contato relatando problema relacionado a ${productReference}.`
      : contactType === "Solicitação"
        ? `${clientReference} entrou em contato realizando uma solicitação relacionada a ${productReference}.`
        : `${clientReference} entrou em contato para ${contactType.toLocaleLowerCase("pt-BR")} referente a ${productReference}.`;
    lines.push("DESCRIÇÃO INICIAL", summary || automaticOpening, "");

    if (products.length) {
      lines.push("PRODUTOS/SERVIÇOS ENVOLVIDOS", products.join(", "), "");
    }

    const issueLines = [];
    for (const [id, product] of Object.entries(PRODUCTS)) {
      if (!showTechnicalProblems || !productIds.includes(id)) {
        continue;
      }
      const selected = selectedValues(form, `issues_${id}`);
      const details = normalizeText(form.elements[`details_${id}`]?.value);
      if (!selected.length && !details) {
        continue;
      }
      issueLines.push(`${product.label}: ${selected.length ? selected.join("; ") : "Detalhes informados"}${details ? `. ${details}` : ""}`);
    }
    const internetIssues = selectedValues(form, "issues_internet");
    if (internetIssues.includes(SLOWNESS_ISSUE)) {
      const slownessConnections = selectedValues(form, "slowness_connections");
      const wifiBand = normalizeText(form.elements.wifi_band?.value);
      const connectionDetails = slownessConnections.map((connection) =>
        connection === "Wi-Fi" && wifiBand
          ? `${connection} (dispositivo conectado em ${wifiBand})`
          : connection
      );
      if (connectionDetails.length) {
        issueLines.push(`Detalhes da lentidão: ${connectionDetails.join("; ")}`);
      }
    }
    lines.push(...listSection("PROBLEMAS INFORMADOS", issueLines));
    lines.push(...listSection("SOLICITAÇÕES", requests));

    const scenario = [
      normalizeText(form.elements.started_at.value) ? `Início/período: ${normalizeText(form.elements.started_at.value)}` : "",
      normalizeText(form.elements.scope.value) ? `Abrangência: ${normalizeText(form.elements.scope.value)}` : "",
      normalizeText(form.elements.devices.value) ? `Dispositivos afetados: ${normalizeText(form.elements.devices.value)}` : "",
      normalizeText(form.elements.frequency.value) ? `Frequência: ${normalizeText(form.elements.frequency.value)}` : ""
    ].filter(Boolean);
    lines.push(...listSection("CENÁRIO IDENTIFICADO", scenario));
    lines.push(...listSection("VERIFICAÇÕES REALIZADAS", checks));

    const measurements = [
      normalizeText(form.elements.optical_signal.value) ? `Sinal óptico: ${normalizeText(form.elements.optical_signal.value)}` : "",
      normalizeText(form.elements.speed_test.value) ? `Teste de velocidade: ${normalizeText(form.elements.speed_test.value)}` : "",
      normalizeText(form.elements.latency.value) ? `Latência/perda: ${normalizeText(form.elements.latency.value)}` : "",
      normalizeText(form.elements.technical_notes.value)
    ].filter(Boolean);
    lines.push(...listSection("RESULTADOS DOS TESTES", measurements));
    lines.push(...listSection("AÇÕES E AJUSTES REALIZADOS", actions));

    const changes = normalizeText(form.elements.configuration_changes.value);
    if (changes) {
      lines.push("DETALHES DOS AJUSTES", changes, "");
    }

    lines.push("FINALIZAÇÃO", outcome);
    const customerValidation = normalizeText(form.elements.customer_validation.value) || OUTCOME_VALIDATION[outcomeValue] || "";
    if (customerValidation) {
      lines.push(`Validação do cliente: ${customerValidation}`);
    }
    lines.push("");

    if (outcomeValue === "visita") {
      lines.push(...listSection("MOTIVO DA VISITA TÉCNICA", visitReasons));
      const visitNotes = normalizeText(form.elements.visit_notes.value);
      if (visitNotes) {
        lines.push("OBSERVAÇÕES PARA A VISITA", visitNotes, "");
      }
    }

    const finalNotes = normalizeText(form.elements.final_notes.value);
    if (finalNotes) {
      lines.push("OBSERVAÇÕES FINAIS", finalNotes, "");
    }

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function reportToHtml(report) {
    return report.split("\n").map((line) => {
      if (!line) {
        return "<p><br></p>";
      }
      if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ/ ]{4,}$/.test(line)) {
        return `<p><strong>${escapeHtml(line)}</strong></p>`;
      }
      const labelMatch = line.match(/^([^:]{2,40}):\s*(.*)$/);
      if (labelMatch) {
        return `<p><strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(labelMatch[2])}</p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    }).join("");
  }

  function insertReport(editor, report) {
    editor.focus();
    editor.innerHTML = reportToHtml(report);
    editor.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: null
    }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .dx-htmleditor{position:relative}.way-erp-report-generator-button{position:absolute;right:10px;bottom:10px;z-index:20;border:0;border-radius:9px;background:#075ea8;color:#fff;padding:8px 12px;font:600 12px/1.2 Arial,sans-serif;box-shadow:0 5px 18px rgba(0,0,0,.25);cursor:pointer}.way-erp-report-generator-button:hover{background:#0877c9}
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483647;font:14px/1.45 Inter,Segoe UI,Arial,sans-serif;color:#172033}#${ROOT_ID} *{box-sizing:border-box}#${ROOT_ID} .way-report-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(4,12,26,.72)}#${ROOT_ID} .way-report-modal{display:flex;flex-direction:column;width:min(1260px,97vw);height:min(900px,96vh);overflow:hidden;border:1px solid #cbd5e1;border-radius:18px;background:#f8fafc;box-shadow:0 30px 100px rgba(0,0,0,.38)}
      #${ROOT_ID} .way-report-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:18px 22px;background:linear-gradient(135deg,#06264a,#0b5b99);color:#fff}#${ROOT_ID} h2{margin:0;font-size:21px}#${ROOT_ID} .way-report-header p{margin:4px 0 0;color:#c8e5ff}#${ROOT_ID} .way-report-close{border:0;background:transparent;color:#fff;font-size:30px;line-height:1;cursor:pointer}
      #${ROOT_ID} .way-report-tabs{display:flex;overflow:auto;border-bottom:1px solid #d8e0ea;background:#fff;padding:0 12px}#${ROOT_ID} .way-report-tab{flex:0 0 auto;border:0;border-bottom:3px solid transparent;background:transparent;color:#526071;padding:13px 15px;font-weight:700;cursor:pointer}#${ROOT_ID} .way-report-tab.active{border-bottom-color:#0877c9;color:#075ea8}
      #${ROOT_ID} .way-report-route{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 22px;border-bottom:1px solid #d8e0ea;background:#eaf5ff;color:#17466f;font-size:12px}#${ROOT_ID} .way-report-route strong{font-weight:800}#${ROOT_ID} .way-report-draft-status{flex:0 0 auto;color:#47718f;font-size:11px;font-weight:700}
      #${ROOT_ID} .way-report-content{flex:1;min-height:0;overflow:auto;padding:20px 22px}#${ROOT_ID} .way-report-page{display:none}#${ROOT_ID} .way-report-page.active{display:block}#${ROOT_ID} .way-report-section{margin-bottom:18px;padding:16px;border:1px solid #d8e0ea;border-radius:13px;background:#fff}#${ROOT_ID} .way-report-section h3{margin:0 0 12px;color:#123a63;font-size:16px}#${ROOT_ID} .way-report-help{margin:-6px 0 12px;color:#64748b;font-size:12px}
      #${ROOT_ID} .way-report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#${ROOT_ID} .way-report-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}#${ROOT_ID} label.field{display:flex;flex-direction:column;gap:5px;color:#425166;font-weight:600}#${ROOT_ID} input[type=text],#${ROOT_ID} input[type=date],#${ROOT_ID} select,#${ROOT_ID} textarea{width:100%;border:1px solid #b9c6d6;border-radius:8px;background:#fff;color:#172033;padding:9px 10px;font:inherit}#${ROOT_ID} textarea{resize:vertical;min-height:78px}#${ROOT_ID} input:focus,#${ROOT_ID} select:focus,#${ROOT_ID} textarea:focus{outline:2px solid #79bff0;border-color:#0b78c4}
      #${ROOT_ID} .way-report-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#${ROOT_ID} .way-report-check{display:flex;align-items:flex-start;gap:8px;padding:9px;border:1px solid #d9e2ec;border-radius:9px;background:#f8fafc;cursor:pointer}#${ROOT_ID} .way-report-check:hover{border-color:#80b9df;background:#f0f8ff}#${ROOT_ID} .way-report-check input{margin-top:3px}#${ROOT_ID} .way-report-check-copy{display:flex;flex:1;align-items:flex-start;justify-content:space-between;gap:8px}#${ROOT_ID} .way-report-priority{display:none;flex:0 0 auto;padding:2px 6px;border-radius:999px;background:#fff2bf;color:#7a4b00;font-size:10px;font-weight:800}#${ROOT_ID} .way-report-check.recommended{order:-1;border-color:#e7a626;background:#fffaf0;box-shadow:inset 3px 0 #e7a626}#${ROOT_ID} .way-report-check.recommended .way-report-priority{display:inline-flex}#${ROOT_ID} [hidden]{display:none!important}
      #${ROOT_ID} .way-report-guidance{margin:0 0 12px;padding:11px 12px;border:1px solid #f0bf54;border-radius:10px;background:#fff8df;color:#694300}#${ROOT_ID} .way-report-guidance strong{display:block}#${ROOT_ID} .way-report-guidance p{margin:3px 0 0;font-size:12px}#${ROOT_ID} .way-report-quick{border-color:#66b995;background:#f1fff8}#${ROOT_ID} .way-report-quick h3{color:#087d52}#${ROOT_ID} .way-report-subroute{margin-top:12px;padding:13px;border:1px solid #9cc6e5;border-radius:10px;background:#f2f9ff}#${ROOT_ID} .way-report-subroute h4{margin:0 0 4px;color:#174d76;font-size:14px}#${ROOT_ID} .way-report-subroute>.way-report-help{margin:0 0 10px}#${ROOT_ID} .way-report-subroute-detail{margin-top:10px;padding-top:10px;border-top:1px solid #c9deed}
      #${ROOT_ID} details.way-report-optional{margin-top:12px;border:1px dashed #b9c6d6;border-radius:9px;background:#f8fafc}#${ROOT_ID} details.way-report-optional>summary{padding:10px 12px;color:#47627d;font-weight:700;cursor:pointer;list-style:none}#${ROOT_ID} details.way-report-optional>summary::-webkit-details-marker{display:none}#${ROOT_ID} details.way-report-optional>label{margin:0 12px 12px}
      #${ROOT_ID} .way-report-preview{min-height:480px;white-space:pre-wrap;border:1px solid #b8c7d8;border-radius:12px;background:#101827;color:#eef6ff;padding:18px;font:13px/1.55 Consolas,monospace}#${ROOT_ID} .way-report-footer{display:flex;justify-content:space-between;gap:10px;padding:14px 20px;border-top:1px solid #d8e0ea;background:#fff}#${ROOT_ID} .way-report-footer>div{display:flex;flex-wrap:wrap;gap:9px}#${ROOT_ID} button.action{border:1px solid #9eb0c4;border-radius:8px;background:#fff;color:#23334a;padding:9px 14px;font-weight:700;cursor:pointer}#${ROOT_ID} button.action.danger{border-color:#d4a3a3;color:#a12626}#${ROOT_ID} button.action.danger:hover{border-color:#c63f3f;background:#fff4f4}#${ROOT_ID} button.primary{border-color:#0877c9;background:#0877c9;color:#fff}#${ROOT_ID} button.success{border-color:#087d52;background:#087d52;color:#fff}
      html.way-erp-theme-dark #${ROOT_ID}{color:#e6eef8}html.way-erp-theme-dark #${ROOT_ID} .way-report-modal,html.way-erp-theme-dark #${ROOT_ID} .way-report-content{background:#101722}html.way-erp-theme-dark #${ROOT_ID} .way-report-tabs,html.way-erp-theme-dark #${ROOT_ID} .way-report-section,html.way-erp-theme-dark #${ROOT_ID} .way-report-footer{background:#172130;border-color:#334155}html.way-erp-theme-dark #${ROOT_ID} .way-report-section h3{color:#8dccff}html.way-erp-theme-dark #${ROOT_ID} .way-report-check{background:#111b29;border-color:#3a485c}html.way-erp-theme-dark #${ROOT_ID} input[type=text],html.way-erp-theme-dark #${ROOT_ID} input[type=date],html.way-erp-theme-dark #${ROOT_ID} select,html.way-erp-theme-dark #${ROOT_ID} textarea{background:#0c1420;color:#eef6ff;border-color:#46566b}html.way-erp-theme-dark #${ROOT_ID} label.field{color:#c7d3e2}
      html.way-erp-theme-dark #${ROOT_ID} .way-report-route{background:#10263a;color:#bfe0fb;border-color:#334155}html.way-erp-theme-dark #${ROOT_ID} details.way-report-optional{background:#111b29;border-color:#46566b}html.way-erp-theme-dark #${ROOT_ID} details.way-report-optional>summary{color:#b9cee4}html.way-erp-theme-dark #${ROOT_ID} .way-report-guidance{background:#33290f;color:#ffe29a;border-color:#8a6a22}html.way-erp-theme-dark #${ROOT_ID} .way-report-check.recommended{background:#2b2413;border-color:#a77b24}html.way-erp-theme-dark #${ROOT_ID} .way-report-priority{background:#60460e;color:#ffe6a3}html.way-erp-theme-dark #${ROOT_ID} .way-report-quick{background:#10291f;border-color:#33795e}html.way-erp-theme-dark #${ROOT_ID} .way-report-subroute{background:#10263a;border-color:#345c78}html.way-erp-theme-dark #${ROOT_ID} .way-report-subroute h4{color:#9bd3ff}html.way-erp-theme-dark #${ROOT_ID} .way-report-subroute-detail{border-color:#345c78}
      @media(max-width:760px){#${ROOT_ID} .way-report-overlay{padding:0}#${ROOT_ID} .way-report-modal{width:100vw;height:100vh;border-radius:0}#${ROOT_ID} .way-report-grid,#${ROOT_ID} .way-report-grid.three,#${ROOT_ID} .way-report-checks{grid-template-columns:1fr}#${ROOT_ID} .way-report-content{padding:14px}#${ROOT_ID} .way-report-route{align-items:flex-start;flex-direction:column}#${ROOT_ID} .way-report-footer{flex-wrap:wrap}}
    `;
    document.documentElement.appendChild(style);
  }

  function openGenerator(editor = firstVisibleEditor()) {
    if (!editor) {
      window.alert("Abra a tela do ERP que contém o campo de relato antes de usar o gerador.");
      return;
    }
    document.getElementById(ROOT_ID)?.remove();
    const client = detectClientData(editor);
    const root = document.createElement("div");
    root.id = ROOT_ID;
    const productChoices = Object.entries(PRODUCTS).map(([id, product]) => `
      <label class="way-report-check"><input type="checkbox" name="products" value="${escapeHtml(product.label)}" data-product="${id}"><span>${product.icon} ${escapeHtml(product.label)}</span></label>
    `).join("");
    const productPanels = Object.entries(PRODUCTS).map(([id, product]) => {
      const slownessDetails = id === "internet" ? `
        <div class="way-report-subroute" data-slowness-details hidden>
          <h4>Onde a lentidão acontece?</h4>
          <p class="way-report-help">Selecione uma ou as duas formas de conexão para receber as verificações corretas.</p>
          <div class="way-report-checks">
            <label class="way-report-check"><input type="checkbox" name="slowness_connections" value="Wi-Fi" data-slowness-connection="wifi"><span>📶 Wi-Fi</span></label>
            <label class="way-report-check"><input type="checkbox" name="slowness_connections" value="Cabo de rede" data-slowness-connection="cable"><span>🔌 Cabo de rede</span></label>
          </div>
          <div class="way-report-subroute-detail" data-wifi-band-section hidden>
            <label class="field">Em qual rede o dispositivo está conectado?
              <select name="wifi_band">${selectOptions(WIFI_BAND_OPTIONS)}</select>
            </label>
          </div>
        </div>
      ` : "";
      return `
        <section class="way-report-section way-report-product-panel" data-product-panel="${id}" hidden>
          <h3>${product.icon} ${escapeHtml(product.label)} — detalhes do problema</h3>
          <div class="way-report-checks">${checkedList(product.issues, `issues_${id}`)}</div>
          ${slownessDetails}
          <details class="way-report-optional"><summary>＋ Adicionar detalhes específicos</summary><label class="field">Complemento<textarea name="details_${id}" placeholder="Descreva sintomas, mensagens de erro, horários e demais informações..."></textarea></label></details>
        </section>
      `;
    }).join("");
    const outcomeChoices = OUTCOMES.map(([value, label, contacts], index) => {
      const routes = OUTCOME_ROUTES[value] || {};
      const optionOrder = numericOrder(routes.order, (index + 1) * 10);
      const priorityOrder = numericOrder(routes.priority?.order, optionOrder);
      const configuredPriority = routes.priority?.enabled === true
        ? "true"
        : routes.priority?.enabled === false ? "false" : "";
      const priorityBadge = configuredPriority === "true"
        ? '<small class="way-report-priority" aria-label="Resultado prioritário">Prioritária</small>'
        : "";
      return `
      <label class="way-report-check" data-outcome-contacts="${escapeHtml(contacts.join("|"))}" data-route-products="${escapeHtml((routes.products || ["*"]).join("|"))}" data-route-contacts="${escapeHtml(contacts.join("|"))}" data-route-requests="${escapeHtml((routes.triggers?.requests || ["*"]).join("|"))}" data-route-issues="${escapeHtml((routes.triggers?.issues || ["*"]).join("|"))}" data-option-id="${escapeHtml(value)}" data-option-order="${optionOrder}" data-priority-enabled="${configuredPriority}" data-priority-order="${priorityOrder}" style="order:${optionOrder}"><input type="radio" name="outcome" value="${escapeHtml(value)}" ${value === "resolvido" ? "checked" : ""}><span class="way-report-check-copy"><span>${escapeHtml(label)}</span>${priorityBadge}</span></label>
    `;
    }).join("");

    root.innerHTML = `
      <div class="way-report-overlay">
        <form class="way-report-modal">
          <header class="way-report-header"><div><h2>📝 Gerador de Relato — ERP</h2><p>Preencha as etapas e revise o texto antes de inserir no atendimento.</p></div><button type="button" class="way-report-close" aria-label="Fechar">×</button></header>
          <nav class="way-report-tabs">
            <button type="button" class="way-report-tab active" data-tab="0">1. Atendimento</button>
            <button type="button" class="way-report-tab" data-tab="1">2. Problema</button>
            <button type="button" class="way-report-tab" data-tab="2">3. Verificações</button>
            <button type="button" class="way-report-tab" data-tab="3">4. Ações</button>
            <button type="button" class="way-report-tab" data-tab="4">5. Finalização</button>
            <button type="button" class="way-report-tab" data-tab="5">6. Prévia</button>
          </nav>
          <div class="way-report-route"><span>Rota atual: <strong data-route-summary>Selecione o motivo e pelo menos um produto</strong></span><span class="way-report-draft-status" data-draft-status>Rascunho automático ativo</span></div>
          <main class="way-report-content">
            <section class="way-report-page active" data-page="0">
              <div class="way-report-section"><h3>Dados do atendimento</h3><p class="way-report-help">Os dados identificados automaticamente podem ser corrigidos.</p><div class="way-report-grid">
                <label class="field">Nome do cliente<input type="text" name="client_name" value="${escapeHtml(client.name)}"></label>
                <label class="field">Telefone<input type="text" name="phone" value="${escapeHtml(client.phone)}"></label>
                <label class="field">Protocolo<input type="text" name="protocol" value="${escapeHtml(client.protocol)}"></label>
                <label class="field">Contrato<input type="text" name="contract" value="${escapeHtml(client.contract)}"></label>
              </div></div>
              <div class="way-report-section"><h3>Motivo do contato</h3><label class="field">Tipo<select name="contact_type">${selectOptions(CONTACT_TYPES, "Problema técnico")}</select></label><details class="way-report-optional" data-standard-summary><summary>＋ Personalizar o texto inicial</summary><label class="field">Resumo inicial<textarea name="initial_summary" placeholder="Se ficar vazio, o Way Tools criará o texto automaticamente."></textarea></label></details></div>
              <div class="way-report-section way-report-quick" data-no-interaction-section hidden><h3>⚡ Relato rápido de falta de interação</h3><p class="way-report-help">Escolha o cenário. Produtos, verificações e ações técnicas não serão exigidos.</p><div class="way-report-grid">
                <label class="field">O que aconteceu?<select name="no_interaction_reason">${selectOptions(NO_INTERACTION_OPTIONS.reasons, NO_INTERACTION_OPTIONS.reasons[0])}</select></label>
                <label class="field">Tentativas de contato<select name="no_interaction_attempts">${selectOptions(NO_INTERACTION_OPTIONS.attempts, "")}</select></label>
                <label class="field">Situação final<select name="no_interaction_result">${selectOptions(NO_INTERACTION_OPTIONS.results, NO_INTERACTION_OPTIONS.results[0])}</select></label>
              </div><details class="way-report-optional"><summary>＋ Adicionar observação</summary><label class="field">Complemento<textarea name="no_interaction_notes" placeholder="Ex.: cliente visualizou as mensagens, mas não respondeu."></textarea></label></details></div>
              <div class="way-report-section" data-products-section><h3>Produtos ou serviços envolvidos</h3><div class="way-report-checks">${productChoices}</div></div>
            </section>
            <section class="way-report-page" data-page="1">
              ${productPanels}
              <div class="way-report-section" data-request-section hidden><h3 data-request-title>Solicitação realizada pelo cliente</h3><div class="way-report-checks">${checkedList(REQUESTS, "requests")}</div></div>
              <div class="way-report-section" data-scenario-section><h3>Cenário e abrangência</h3><div class="way-report-grid">
                <label class="field">Abrangência<select name="scope">${selectOptions(SCOPE_OPTIONS)}</select></label>
                <label class="field">Frequência<select name="frequency">${selectOptions(FREQUENCY_OPTIONS)}</select></label>
              </div><details class="way-report-optional"><summary>＋ Informar quando começou e dispositivos afetados</summary><div class="way-report-grid" style="padding:0 12px 12px"><label class="field">Quando começou?<input type="text" name="started_at" placeholder="Ex.: hoje pela manhã; há três dias"></label><label class="field">Dispositivos afetados<input type="text" name="devices" placeholder="Ex.: celular, notebook e Smart TV"></label></div></details></div>
            </section>
            <section class="way-report-page" data-page="2">
              <div class="way-report-section"><h3>Verificações realizadas <small data-visible-checks></small></h3><p class="way-report-help">As opções prioritárias são definidas pelos problemas e solicitações marcados. Marque somente o que foi realmente verificado.</p><div class="way-report-guidance" data-check-guidance hidden><strong>⭐ Verificações importantes para este caso</strong><p data-check-guidance-text></p></div><div class="way-report-checks" data-checks-list>${checkedList(CHECKS, "checks")}</div></div>
              <div class="way-report-section"><h3>Medições e observações técnicas</h3><div class="way-report-grid">
                ${MEASUREMENT_FIELDS.map((field) => `<label class="field" data-measure-products="${escapeHtml((field.products || ["*"]).join("|"))}" data-route-products="${escapeHtml((field.products || ["*"]).join("|"))}" data-route-contacts="${escapeHtml((field.contacts || ["*"]).join("|"))}" data-route-requests="${escapeHtml((field.triggers?.requests || ["*"]).join("|"))}" data-route-issues="${escapeHtml((field.triggers?.issues || ["*"]).join("|"))}">${escapeHtml(field.label)}<input type="text" name="${escapeHtml(field.id)}" placeholder="${escapeHtml(field.placeholder || "")}"></label>`).join("")}
              </div><details class="way-report-optional"><summary>＋ Adicionar observações técnicas</summary><label class="field">Complemento<textarea name="technical_notes" placeholder="Registre leituras, estados e comparações relevantes."></textarea></label></details></div>
            </section>
            <section class="way-report-page" data-page="3">
              <div class="way-report-section"><h3>Ações e ajustes realizados <small data-visible-actions></small></h3><p class="way-report-help">São exibidas apenas ações compatíveis com a rota escolhida.</p><div class="way-report-checks">${checkedList(ACTIONS, "actions")}</div><details class="way-report-optional"><summary>＋ Detalhar configurações ou orientações</summary><label class="field">Complemento<textarea name="configuration_changes" placeholder="Ex.: alterado canal da rede 2,4 GHz para o canal 6 e separadas as redes Wi-Fi."></textarea></label></details></div>
            </section>
            <section class="way-report-page" data-page="4">
              <div class="way-report-section"><h3>Como o atendimento foi finalizado?</h3><div class="way-report-checks">${outcomeChoices}</div><details class="way-report-optional"><summary>＋ Personalizar a validação do cliente</summary><label class="field">Validação<input type="text" name="customer_validation" placeholder="Se ficar vazio, o Way Tools usará um texto automático."></label></details></div>
              <div class="way-report-visit" hidden>
                <div class="way-report-section"><h3>Motivo da visita técnica</h3><div class="way-report-checks">${checkedList(VISIT_REASONS, "visit_reasons")}</div></div>
                <div class="way-report-section"><details class="way-report-optional"><summary>＋ Adicionar observação técnica para a visita</summary><label class="field">Complemento<textarea name="visit_notes" placeholder="Inclua somente informações técnicas úteis para a próxima etapa."></textarea></label></details></div>
              </div>
              <div class="way-report-section"><h3>Complementos opcionais</h3><details class="way-report-optional"><summary>＋ Adicionar observações finais</summary><label class="field">Complemento<textarea name="final_notes" placeholder="Inclua pendências, prazos, recusas ou informações adicionais."></textarea></label></details></div>
            </section>
            <section class="way-report-page" data-page="5"><div class="way-report-section"><h3>Prévia do relato</h3><p class="way-report-help">O texto poderá ser editado normalmente no ERP após a inserção.</p><div class="way-report-preview" data-preview></div></div></section>
          </main>
          <footer class="way-report-footer"><div><button type="button" class="action" data-cancel>Fechar</button><button type="button" class="action danger" data-reset>Resetar formulário</button></div><div><button type="button" class="action" data-previous>← Voltar</button><button type="button" class="action primary" data-next>Próxima →</button><button type="button" class="action success" data-insert hidden>Inserir relato no campo</button></div></footer>
        </form>
      </div>
    `;
    document.body.appendChild(root);
    const form = root.querySelector("form");
    const preview = root.querySelector("[data-preview]");
    const draftStatus = root.querySelector("[data-draft-status]");
    const draftStorageKey = reportDraftStorageKey(client, editor);
    const restoredDraft = loadReportDraft(draftStorageKey);
    restoreReportDraft(form, restoredDraft);
    let currentPage = Number.isInteger(restoredDraft?.currentPage)
      ? restoredDraft.currentPage
      : 0;

    function saveDraft() {
      const saved = saveReportDraft(draftStorageKey, form, currentPage);
      draftStatus.textContent = saved
        ? "Rascunho salvo nesta aba"
        : "Não foi possível salvar o rascunho";
    }

    function updateConditionalFields() {
      const productIds = selectedProductIds(form);
      const productLabels = selectedValues(form, "products");
      const contactType = form.elements.contact_type.value;
      const isNoInteraction = contactType === NO_INTERACTION_CONTACT;
      const showTechnicalProblems = ["Problema técnico", "Reclamação", "Acompanhamento de atendimento"].includes(contactType);
      const showRequests = ["Solicitação", "Dúvida ou orientação"].includes(contactType);

      form.querySelector("[data-no-interaction-section]").hidden = !isNoInteraction;
      form.querySelector("[data-products-section]").hidden = isNoInteraction;
      form.querySelector("[data-standard-summary]").hidden = isNoInteraction;
      form.querySelectorAll('[data-tab="1"],[data-tab="2"],[data-tab="3"],[data-tab="4"]')
        .forEach((tab) => { tab.hidden = isNoInteraction; });
      form.querySelector('[data-tab="5"]').textContent = isNoInteraction
        ? "2. Prévia"
        : "6. Prévia";
      form.querySelector("[data-next]").textContent = isNoInteraction
        ? "Gerar relato rápido →"
        : "Próxima →";

      for (const checkbox of form.querySelectorAll("[data-product]")) {
        const panel = form.querySelector(`[data-product-panel="${checkbox.dataset.product}"]`);
        panel.hidden = !checkbox.checked || !showTechnicalProblems;
        if (panel.hidden && !isNoInteraction) {
          panel.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
        }
      }

      const internetSlownessSelected = showTechnicalProblems &&
        productIds.includes("internet") &&
        selectedValues(form, "issues_internet").includes(SLOWNESS_ISSUE);
      const slownessDetails = form.querySelector("[data-slowness-details]");
      slownessDetails.hidden = !internetSlownessSelected;
      if (!internetSlownessSelected) {
        slownessDetails.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      }
      const wifiSlownessSelected = internetSlownessSelected &&
        Boolean(form.querySelector('input[data-slowness-connection="wifi"]:checked'));
      const wifiBandSection = form.querySelector("[data-wifi-band-section]");
      wifiBandSection.hidden = !wifiSlownessSelected;
      if (!wifiSlownessSelected) {
        form.elements.wifi_band.value = "";
      }

      const requestSection = form.querySelector("[data-request-section]");
      requestSection.hidden = !showRequests;
      form.querySelector("[data-request-title]").textContent = contactType === "Dúvida ou orientação"
        ? "Dúvida ou orientação solicitada"
        : "Solicitação realizada pelo cliente";
      if (requestSection.hidden && !isNoInteraction) {
        requestSection.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      }

      const scenarioSection = form.querySelector("[data-scenario-section]");
      scenarioSection.hidden = !showTechnicalProblems;
      if (scenarioSection.hidden && !isNoInteraction) {
        scenarioSection.querySelectorAll("input,textarea,select").forEach((input) => {
          if (input.type !== "checkbox" && input.type !== "radio") input.value = "";
        });
      }

      const selectedRequestIds = selectedOptionIds(form, "requests");
      const selectedProblemIds = selectedIssueIds(form);
      for (const option of form.querySelectorAll("[data-route-products]:not([data-measure-products])")) {
        const visible = productIds.length > 0 && routeAllows(
          option,
          productIds,
          contactType,
          selectedRequestIds,
          selectedProblemIds
        );
        option.hidden = !visible;
        if (!visible && !isNoInteraction) {
          option.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
        }
      }

      for (const field of form.querySelectorAll("[data-measure-products]")) {
        const allowedProducts = field.dataset.measureProducts.split("|");
        const productMatches = allowedProducts.includes("*") || allowedProducts.some((id) => productIds.includes(id));
        const hasExplicitTrigger = field.dataset.routeRequests !== "*" || field.dataset.routeIssues !== "*";
        const visible = (showTechnicalProblems || hasExplicitTrigger) && productMatches && routeAllows(
          field,
          productIds,
          contactType,
          selectedRequestIds,
          selectedProblemIds
        );
        field.hidden = !visible;
        if (!visible && !isNoInteraction) {
          const input = field.querySelector("input,textarea,select");
          if (input) input.value = "";
        }
      }

      const outcomeOptions = [...form.querySelectorAll("[data-outcome-contacts]")];
      if (!isNoInteraction) {
        for (const option of outcomeOptions) {
          option.hidden = !routeAllows(
            option,
            productIds,
            contactType,
            selectedRequestIds,
            selectedProblemIds
          );
        }
        const selectedOutcome = form.querySelector('input[name="outcome"]:checked');
        if (!selectedOutcome || selectedOutcome.closest("[data-outcome-contacts]").hidden) {
          const preferredOutcome = contactType === "Solicitação"
            ? "solicitacao"
            : contactType === "Dúvida ou orientação" ? "orientado" : "resolvido";
          const preferredInput = form.querySelector(`input[name="outcome"][value="${preferredOutcome}"]`);
          const fallbackInput = outcomeOptions.find((option) => !option.hidden)?.querySelector('input[name="outcome"]');
          const nextOutcome = preferredInput || fallbackInput;
          if (nextOutcome) {
            nextOutcome.checked = true;
          }
        }
      }

      form.querySelector(".way-report-visit").hidden = isNoInteraction || form.elements.outcome.value !== "visita";

      const selectedIssues = selectedIssueEntries(form);
      const slownessConnections = selectedValues(form, "slowness_connections");
      const wifiBand = normalizeText(form.elements.wifi_band?.value);
      const slownessRoute = internetSlownessSelected && slownessConnections.length
        ? ` → lentidão em ${slownessConnections.join(" e ")}${wifiBand ? ` (${wifiBand})` : ""}`
        : "";
      const routeLabel = isNoInteraction
        ? "Chat sem interação → relato rápido"
        : productLabels.length
          ? `${contactType} → ${productLabels.join(", ")}${selectedIssues.length ? ` → ${selectedIssues.length} problema(s)` : ""}${slownessRoute}`
          : `${contactType} → selecione pelo menos um produto`;
      form.querySelector("[data-route-summary]").textContent = routeLabel;
      if (!isNoInteraction) {
        form.querySelector('[data-tab="1"]').textContent = showRequests
          ? "2. Solicitação"
          : showTechnicalProblems ? "2. Problema" : "2. Contexto";
      }

      const recommendations = isNoInteraction ? new Set() : recommendedCheckIds(form);
      for (const option of form.querySelectorAll(".way-report-check[data-option-order]")) {
        const configuredPriority = option.dataset.priorityEnabled === "true";
        const normalOrder = numericOrder(option.dataset.optionOrder, 10);
        const priorityOrder = numericOrder(option.dataset.priorityOrder, normalOrder);
        const activePriority = !option.hidden && configuredPriority;
        option.classList.toggle("recommended", activePriority);
        option.style.order = String(activePriority ? -100000 + priorityOrder : normalOrder);
      }
      let visibleRecommendedChecks = 0;
      for (const check of form.querySelectorAll('input[name="checks"]')) {
        const option = check.closest(".way-report-check");
        const priorityDisabled = option.dataset.priorityEnabled === "false";
        const configuredPriority = option.dataset.priorityEnabled === "true";
        const recommended = !option.hidden && !priorityDisabled &&
          (configuredPriority || recommendations.has(option.dataset.optionId));
        const normalOrder = numericOrder(option.dataset.optionOrder, 10);
        const priorityOrder = numericOrder(option.dataset.priorityOrder, normalOrder);
        option.classList.toggle("recommended", recommended);
        option.style.order = String(recommended ? -100000 + priorityOrder : normalOrder);
        if (recommended) {
          visibleRecommendedChecks += 1;
        }
      }

      const checkGuidance = form.querySelector("[data-check-guidance]");
      const recommendationSources = selectedIssues.length + selectedRequestIds.length;
      checkGuidance.hidden = recommendationSources === 0 || visibleRecommendedChecks === 0;
      form.querySelector("[data-check-guidance-text]").textContent = visibleRecommendedChecks
        ? `${visibleRecommendedChecks} opção(ões) foram priorizadas conforme a rota selecionada.`
        : "Selecione os problemas ou solicitações para receber recomendações.";

      const visibleChecks = [...form.querySelectorAll('input[name="checks"]')]
        .filter((input) => !input.closest(".way-report-check").hidden).length;
      const visibleActions = [...form.querySelectorAll('input[name="actions"]')]
        .filter((input) => !input.closest(".way-report-check").hidden).length;
      form.querySelector("[data-visible-checks]").textContent = visibleRecommendedChecks
        ? `(${visibleRecommendedChecks} prioritárias de ${visibleChecks})`
        : `(${visibleChecks} opções)`;
      form.querySelector("[data-visible-actions]").textContent = `(${visibleActions} opções)`;

      if (isNoInteraction && currentPage > 0 && currentPage < 5) {
        showPage(0);
      }
    }

    function updatePreview() {
      preview.textContent = generateReport(form);
    }

    function showPage(index) {
      const requestedPage = Math.max(0, Math.min(5, Number(index)));
      const isNoInteraction = form.elements.contact_type.value === NO_INTERACTION_CONTACT;
      currentPage = isNoInteraction && requestedPage > 0 && requestedPage < 5
        ? 5
        : requestedPage;
      form.querySelectorAll("[data-page]").forEach((page) => page.classList.toggle("active", Number(page.dataset.page) === currentPage));
      form.querySelectorAll("[data-tab]").forEach((tab) => tab.classList.toggle("active", Number(tab.dataset.tab) === currentPage));
      form.querySelector("[data-previous]").hidden = currentPage === 0;
      form.querySelector("[data-next]").hidden = currentPage === 5;
      form.querySelector("[data-insert]").hidden = currentPage !== 5;
      if (currentPage === 5) {
        updatePreview();
      }
      root.querySelector(".way-report-content").scrollTop = 0;
    }

    form.addEventListener("input", () => {
      updateConditionalFields();
      if (currentPage === 5) {
        updatePreview();
      }
      saveDraft();
    });
    form.addEventListener("change", () => {
      updateConditionalFields();
      if (currentPage === 5) {
        updatePreview();
      }
      saveDraft();
    });
    function canAdvanceTo(index) {
      if (form.elements.contact_type.value === NO_INTERACTION_CONTACT) {
        return true;
      }
      if (Number(index) > 0 && selectedProductIds(form).length === 0) {
        window.alert("Selecione pelo menos um produto ou serviço para montar a rota do relato.");
        return false;
      }
      const requiresSlownessRoute = Number(index) > 1 &&
        selectedValues(form, "issues_internet").includes(SLOWNESS_ISSUE);
      if (requiresSlownessRoute && selectedValues(form, "slowness_connections").length === 0) {
        window.alert("Para o problema de lentidão, informe se ele ocorre no Wi-Fi, no cabo ou em ambos.");
        return false;
      }
      return true;
    }

    form.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
      if (canAdvanceTo(tab.dataset.tab)) {
        showPage(tab.dataset.tab);
        saveDraft();
      }
    }));
    form.querySelector("[data-previous]").addEventListener("click", () => {
      showPage(form.elements.contact_type.value === NO_INTERACTION_CONTACT ? 0 : currentPage - 1);
      saveDraft();
    });
    form.querySelector("[data-next]").addEventListener("click", () => {
      const nextPage = form.elements.contact_type.value === NO_INTERACTION_CONTACT && currentPage === 0
        ? 5
        : currentPage + 1;
      if (canAdvanceTo(nextPage)) {
        showPage(nextPage);
        saveDraft();
      }
    });
    form.querySelector("[data-reset]").addEventListener("click", () => {
      if (!window.confirm("Deseja apagar todas as informações deste rascunho e reiniciar o formulário?")) {
        return;
      }
      removeReportDraft(draftStorageKey);
      form.reset();
      currentPage = 0;
      updateConditionalFields();
      showPage(0);
      draftStatus.textContent = "Rascunho removido";
    });
    form.querySelector("[data-insert]").addEventListener("click", () => {
      const report = generateReport(form);
      if (!report) {
        window.alert("Preencha pelo menos uma informação para gerar o relato.");
        return;
      }
      insertReport(editor, report);
      removeReportDraft(draftStorageKey);
      root.remove();
    });
    root.querySelectorAll(".way-report-close,[data-cancel]").forEach((button) => button.addEventListener("click", () => root.remove()));
    root.querySelector(".way-report-overlay").addEventListener("mousedown", (event) => {
      if (event.target === event.currentTarget) {
        root.remove();
      }
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        root.remove();
      }
    });
    updateConditionalFields();
    showPage(currentPage);
    if (restoredDraft) {
      draftStatus.textContent = "Rascunho restaurado";
    }
  }

  function configureEditor(editor) {
    const container = editor.closest(".dx-htmleditor");
    if (!container || container.querySelector(`.${BUTTON_CLASS}`)) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
    button.textContent = "📝 Gerar relato";
    button.title = "Abrir Gerador de Relato do Way Tools";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openGenerator(editor);
    });
    container.appendChild(button);
  }

  function configureAll() {
    document.querySelectorAll(EDITOR_SELECTOR).forEach(configureEditor);
  }

  function publishDeveloperInterface() {
    if (location.protocol !== "chrome-extension:") {
      return;
    }
    globalThis.WayToolsReportGeneratorDeveloper = Object.freeze({
      getCatalog: () => cloneForDeveloper(buildDeveloperCatalog()),
      openGenerator: () => openGenerator()
    });
    document.dispatchEvent(new CustomEvent("waytools:report-generator-developer-ready"));
  }

  function init() {
    addStyles();
    configureAll();
    new MutationObserver(configureAll).observe(document.documentElement, { childList: true, subtree: true });
    globalThis.WayToolsRuntime.registerMenuCommand(
      "way-erp-gerador-relato",
      "Abrir Gerador de Relato",
      () => openGenerator()
    );
    publishDeveloperInterface();
    console.info("[Way ERP] Gerador de Relato v1.13 ativo.");
  }

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }
});
