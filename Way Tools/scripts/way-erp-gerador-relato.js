/*
 * Way Tools - ERP Gerador de Relato v1.1
 * Assistente em etapas para compor e inserir relatos no editor DevExtreme/Quill do ERP.
 */

globalThis.WayToolsRuntime.run("way-erp-gerador-relato", () => {
  "use strict";

  const EDITOR_SELECTOR =
    '.dx-htmleditor .ql-editor.dx-htmleditor-content[contenteditable="true"]';
  const ROOT_ID = "way-erp-report-generator-root";
  const STYLE_ID = "way-erp-report-generator-style";
  const BUTTON_CLASS = "way-erp-report-generator-button";

  const PRODUCTS = Object.freeze({
    internet: {
      label: "Internet",
      icon: "🌐",
      issues: [
        "Sem acesso à internet",
        "Conexão intermitente",
        "Lentidão",
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
    }
  });

  const REQUESTS = Object.freeze([
    { label: "Troca de senha do Wi-Fi", products: ["internet", "roteador"] },
    { label: "Alteração do nome da rede Wi-Fi", products: ["internet", "roteador"] },
    { label: "Orientação de conexão de equipamento", products: ["*"] },
    { label: "Liberação ou redirecionamento de porta", products: ["internet", "roteador"] },
    { label: "Alteração de DNS", products: ["internet", "roteador", "dados_moveis"] },
    { label: "Informações sobre plano ou serviço", products: ["*"] },
    { label: "Segunda via ou orientação financeira", products: ["*"] },
    { label: "Desbloqueio de confiança", products: ["internet", "roteador"] },
    { label: "Atualização cadastral", products: ["*"] },
    { label: "Mudança de endereço", products: ["*"] },
    { label: "Troca ou devolução de equipamento", products: ["internet", "roteador", "tv", "tv_box", "telefonia", "dados_moveis"] },
    { label: "Cancelamento de serviço", products: ["*"] }
  ]);

  const TECHNICAL_CONTACTS = Object.freeze([
    "Problema técnico",
    "Reclamação",
    "Acompanhamento de atendimento"
  ]);

  const CHECKS = Object.freeze([
    { label: "Confirmados os dados do titular e do contrato", products: ["*"] },
    { label: "Verificado o status financeiro e cadastral", products: ["*"] },
    { label: "Verificada indisponibilidade ou manutenção na região", products: ["internet", "tv", "tv_box", "telefonia", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Comparado o cenário com outros clientes da região", products: ["internet", "tv", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificado o status da conexão na OLT/ONU", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados os níveis de sinal óptico", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificado link loss ou perda de comunicação", products: ["internet", "roteador", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificado o tempo de atividade do equipamento", products: ["internet", "roteador", "tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Analisados logs de quedas e reinicializações", products: ["internet", "roteador", "tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados os LEDs e o estado físico dos equipamentos", products: ["internet", "roteador", "tv_box", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados cabos, conectores e fonte de alimentação", products: ["internet", "roteador", "tv", "tv_box", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados dispositivos conectados ao roteador", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificadas as redes de 2,4 GHz e 5 GHz", products: ["internet", "roteador", "tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados canal, largura de canal e interferências do Wi-Fi", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado teste de velocidade via cabo", products: ["internet", "roteador"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado teste de velocidade via Wi-Fi", products: ["internet", "roteador", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizados testes de ping, latência e perda de pacotes", products: ["internet", "roteador", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado teste de navegação e resolução DNS", products: ["internet", "roteador", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado teste em outro dispositivo", products: ["internet", "roteador", "dados_moveis", "tv", "tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Realizado teste em outro site ou aplicativo", products: ["internet", "dados_moveis", "tv", "tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificada a configuração de APN e rede móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados chip, cobertura e intensidade do sinal móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados canais, autenticação e sinal do serviço de TV", products: ["tv"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados HDMI, energia e controle remoto da TV Box", products: ["tv_box"], contacts: TECHNICAL_CONTACTS },
    { label: "Verificados registro, chamadas e qualidade de áudio", products: ["telefonia"], contacts: TECHNICAL_CONTACTS }
  ]);

  const ACTIONS = Object.freeze([
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
    { label: "Restaurado o equipamento para o padrão de fábrica", products: ["roteador", "tv_box", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Atualizado o firmware ou aplicativo", products: ["roteador", "tv", "tv_box", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Reconfigurada a APN/rede móvel", products: ["dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Reenviado sinal ou comando de ativação", products: ["tv", "tv_box", "telefonia", "internet"], contacts: TECHNICAL_CONTACTS },
    { label: "Limpos cache e dados do aplicativo", products: ["tv", "tv_box", "dados_moveis"], contacts: TECHNICAL_CONTACTS },
    { label: "Refeito o pareamento do controle remoto", products: ["tv_box", "tv"], contacts: TECHNICAL_CONTACTS },
    { label: "Substituídos cabos ou conexões durante o teste", products: ["internet", "roteador", "tv", "tv_box", "telefonia"], contacts: TECHNICAL_CONTACTS },
    { label: "Orientado o cliente sobre posicionamento e alcance do Wi-Fi", products: ["internet", "roteador"], contacts: ["Problema técnico", "Dúvida ou orientação"] },
    { label: "Orientado o cliente a acompanhar o serviço", products: ["*"], contacts: TECHNICAL_CONTACTS },
    { label: "Aberto chamado interno ou escalonado para outra equipe", products: ["*"], contacts: TECHNICAL_CONTACTS }
  ]);

  const VISIT_REASONS = Object.freeze([
    { label: "Link loss/ausência de sinal óptico", products: ["internet", "roteador", "telefonia"] },
    { label: "Sinal óptico fora dos parâmetros", products: ["internet", "roteador", "telefonia"] },
    { label: "Possível defeito no roteador, ONU ou fonte", products: ["internet", "roteador"] },
    { label: "Possível defeito no receptor ou TV Box", products: ["tv", "tv_box"] },
    { label: "Possível problema em cabo ou conector", products: ["internet", "roteador", "tv", "tv_box", "telefonia"] },
    { label: "Falha na infraestrutura interna ou externa", products: ["internet", "roteador", "telefonia"] },
    { label: "Equipamento sem comunicação e sem acesso remoto", products: ["internet", "roteador", "tv_box", "telefonia"] },
    { label: "Problema recorrente após ajustes remotos", products: ["*"] },
    { label: "Necessidade de testes presenciais", products: ["*"] },
    { label: "Solicitação de troca ou instalação de equipamento", products: ["*"] }
  ]);

  const OUTCOME_VALIDATION = Object.freeze({
    resolvido: "Cliente realizou os testes e confirmou a solução do problema.",
    normalizado: "Cliente confirmou a normalização do serviço após os ajustes.",
    solicitacao: "Solicitação realizada conforme solicitado pelo cliente.",
    orientado: "Cliente recebeu as orientações necessárias e ficou ciente das informações.",
    monitoramento: "Cliente orientado a acompanhar o funcionamento do serviço.",
    aguardando: "Atendimento permanece aguardando teste ou retorno do cliente.",
    escalonado: "Cliente informado sobre o encaminhamento para a equipe responsável.",
    visita: "Cliente informado sobre a necessidade de atendimento presencial.",
    nao_concluido: "Atendimento não concluído; detalhes registrados nas observações finais."
  });

  const OUTCOMES = Object.freeze([
    ["resolvido", "Problema solucionado durante o atendimento", TECHNICAL_CONTACTS],
    ["normalizado", "Serviço normalizado após os ajustes", TECHNICAL_CONTACTS],
    ["solicitacao", "Solicitação concluída", ["Solicitação"]],
    ["orientado", "Cliente orientado, sem falha identificada", ["Problema técnico", "Solicitação", "Dúvida ou orientação"]],
    ["monitoramento", "Serviço em monitoramento", TECHNICAL_CONTACTS],
    ["aguardando", "Aguardando retorno ou teste do cliente", ["*"]],
    ["escalonado", "Atendimento escalonado para outra equipe", TECHNICAL_CONTACTS],
    ["visita", "Necessário agendamento de visita técnica", TECHNICAL_CONTACTS],
    ["nao_concluido", "Atendimento não concluído", ["*"]]
  ]);

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function checkedList(items, name, extra = "") {
    return items.map((item) => {
      const option = typeof item === "string" ? { label: item } : item;
      const routeProducts = Array.isArray(option.products) ? option.products.join("|") : "*";
      const routeContacts = Array.isArray(option.contacts) ? option.contacts.join("|") : "*";
      return `
      <label class="way-report-check" data-route-products="${escapeHtml(routeProducts)}" data-route-contacts="${escapeHtml(routeContacts)}">
        <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(option.label)}" ${extra}>
        <span>${escapeHtml(option.label)}</span>
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

  function routeAllows(element, productIds, contactType) {
    const productRoutes = String(element.dataset.routeProducts || "*").split("|");
    const contactRoutes = String(element.dataset.routeContacts || "*").split("|");
    const productMatches = productRoutes.includes("*") || productRoutes.some((id) => productIds.includes(id));
    const contactMatches = contactRoutes.includes("*") || contactRoutes.includes(contactType);
    return productMatches && contactMatches;
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

  function generateReport(form) {
    const products = selectedValues(form, "products");
    const productIds = selectedProductIds(form);
    const requests = selectedValues(form, "requests");
    const checks = selectedValues(form, "checks");
    const actions = selectedValues(form, "actions");
    const visitReasons = selectedValues(form, "visit_reasons");
    const contactType = form.elements.contact_type.value;
    const showTechnicalProblems = ["Problema técnico", "Reclamação", "Acompanhamento de atendimento"].includes(contactType);
    const outcomeValue = form.elements.outcome.value;
    const outcome = OUTCOMES.find(([value]) => value === outcomeValue)?.[1] || "Não informado";
    const lines = ["RELATO DO ATENDIMENTO", ""];

    if (normalizeText(form.elements.client_name.value)) {
      lines.push(`Cliente: ${normalizeText(form.elements.client_name.value)}`);
    }
    if (normalizeText(form.elements.phone.value)) {
      lines.push(`Telefone: ${normalizeText(form.elements.phone.value)}`);
    }
    if (normalizeText(form.elements.protocol.value)) {
      lines.push(`Protocolo: ${normalizeText(form.elements.protocol.value)}`);
    }
    if (normalizeText(form.elements.contract.value)) {
      lines.push(`Contrato: ${normalizeText(form.elements.contract.value)}`);
    }
    lines.push(`Tipo de contato: ${contactType}`, "");

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
      #${ROOT_ID} .way-report-route{padding:9px 22px;border-bottom:1px solid #d8e0ea;background:#eaf5ff;color:#17466f;font-size:12px}#${ROOT_ID} .way-report-route strong{font-weight:800}
      #${ROOT_ID} .way-report-content{flex:1;min-height:0;overflow:auto;padding:20px 22px}#${ROOT_ID} .way-report-page{display:none}#${ROOT_ID} .way-report-page.active{display:block}#${ROOT_ID} .way-report-section{margin-bottom:18px;padding:16px;border:1px solid #d8e0ea;border-radius:13px;background:#fff}#${ROOT_ID} .way-report-section h3{margin:0 0 12px;color:#123a63;font-size:16px}#${ROOT_ID} .way-report-help{margin:-6px 0 12px;color:#64748b;font-size:12px}
      #${ROOT_ID} .way-report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#${ROOT_ID} .way-report-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}#${ROOT_ID} label.field{display:flex;flex-direction:column;gap:5px;color:#425166;font-weight:600}#${ROOT_ID} input[type=text],#${ROOT_ID} input[type=date],#${ROOT_ID} select,#${ROOT_ID} textarea{width:100%;border:1px solid #b9c6d6;border-radius:8px;background:#fff;color:#172033;padding:9px 10px;font:inherit}#${ROOT_ID} textarea{resize:vertical;min-height:78px}#${ROOT_ID} input:focus,#${ROOT_ID} select:focus,#${ROOT_ID} textarea:focus{outline:2px solid #79bff0;border-color:#0b78c4}
      #${ROOT_ID} .way-report-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#${ROOT_ID} .way-report-check{display:flex;align-items:flex-start;gap:8px;padding:9px;border:1px solid #d9e2ec;border-radius:9px;background:#f8fafc;cursor:pointer}#${ROOT_ID} .way-report-check:hover{border-color:#80b9df;background:#f0f8ff}#${ROOT_ID} .way-report-check input{margin-top:3px}#${ROOT_ID} [hidden]{display:none!important}
      #${ROOT_ID} details.way-report-optional{margin-top:12px;border:1px dashed #b9c6d6;border-radius:9px;background:#f8fafc}#${ROOT_ID} details.way-report-optional>summary{padding:10px 12px;color:#47627d;font-weight:700;cursor:pointer;list-style:none}#${ROOT_ID} details.way-report-optional>summary::-webkit-details-marker{display:none}#${ROOT_ID} details.way-report-optional>label{margin:0 12px 12px}
      #${ROOT_ID} .way-report-preview{min-height:480px;white-space:pre-wrap;border:1px solid #b8c7d8;border-radius:12px;background:#101827;color:#eef6ff;padding:18px;font:13px/1.55 Consolas,monospace}#${ROOT_ID} .way-report-footer{display:flex;justify-content:space-between;gap:10px;padding:14px 20px;border-top:1px solid #d8e0ea;background:#fff}#${ROOT_ID} .way-report-footer>div{display:flex;gap:9px}#${ROOT_ID} button.action{border:1px solid #9eb0c4;border-radius:8px;background:#fff;color:#23334a;padding:9px 14px;font-weight:700;cursor:pointer}#${ROOT_ID} button.primary{border-color:#0877c9;background:#0877c9;color:#fff}#${ROOT_ID} button.success{border-color:#087d52;background:#087d52;color:#fff}
      html.way-erp-theme-dark #${ROOT_ID}{color:#e6eef8}html.way-erp-theme-dark #${ROOT_ID} .way-report-modal,html.way-erp-theme-dark #${ROOT_ID} .way-report-content{background:#101722}html.way-erp-theme-dark #${ROOT_ID} .way-report-tabs,html.way-erp-theme-dark #${ROOT_ID} .way-report-section,html.way-erp-theme-dark #${ROOT_ID} .way-report-footer{background:#172130;border-color:#334155}html.way-erp-theme-dark #${ROOT_ID} .way-report-section h3{color:#8dccff}html.way-erp-theme-dark #${ROOT_ID} .way-report-check{background:#111b29;border-color:#3a485c}html.way-erp-theme-dark #${ROOT_ID} input[type=text],html.way-erp-theme-dark #${ROOT_ID} input[type=date],html.way-erp-theme-dark #${ROOT_ID} select,html.way-erp-theme-dark #${ROOT_ID} textarea{background:#0c1420;color:#eef6ff;border-color:#46566b}html.way-erp-theme-dark #${ROOT_ID} label.field{color:#c7d3e2}
      html.way-erp-theme-dark #${ROOT_ID} .way-report-route{background:#10263a;color:#bfe0fb;border-color:#334155}html.way-erp-theme-dark #${ROOT_ID} details.way-report-optional{background:#111b29;border-color:#46566b}html.way-erp-theme-dark #${ROOT_ID} details.way-report-optional>summary{color:#b9cee4}
      @media(max-width:760px){#${ROOT_ID} .way-report-overlay{padding:0}#${ROOT_ID} .way-report-modal{width:100vw;height:100vh;border-radius:0}#${ROOT_ID} .way-report-grid,#${ROOT_ID} .way-report-grid.three,#${ROOT_ID} .way-report-checks{grid-template-columns:1fr}#${ROOT_ID} .way-report-content{padding:14px}#${ROOT_ID} .way-report-footer{flex-wrap:wrap}}
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
    const productPanels = Object.entries(PRODUCTS).map(([id, product]) => `
      <section class="way-report-section way-report-product-panel" data-product-panel="${id}" hidden>
        <h3>${product.icon} ${escapeHtml(product.label)} — detalhes do problema</h3>
        <div class="way-report-checks">${checkedList(product.issues, `issues_${id}`)}</div>
        <details class="way-report-optional"><summary>＋ Adicionar detalhes específicos</summary><label class="field">Complemento<textarea name="details_${id}" placeholder="Descreva sintomas, mensagens de erro, horários e demais informações..."></textarea></label></details>
      </section>
    `).join("");
    const outcomeChoices = OUTCOMES.map(([value, label, contacts]) => `
      <label class="way-report-check" data-outcome-contacts="${escapeHtml(contacts.join("|"))}"><input type="radio" name="outcome" value="${escapeHtml(value)}" ${value === "resolvido" ? "checked" : ""}><span>${escapeHtml(label)}</span></label>
    `).join("");

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
          <div class="way-report-route">Rota atual: <strong data-route-summary>Selecione o motivo e pelo menos um produto</strong></div>
          <main class="way-report-content">
            <section class="way-report-page active" data-page="0">
              <div class="way-report-section"><h3>Dados do atendimento</h3><p class="way-report-help">Os dados identificados automaticamente podem ser corrigidos.</p><div class="way-report-grid">
                <label class="field">Nome do cliente<input type="text" name="client_name" value="${escapeHtml(client.name)}"></label>
                <label class="field">Telefone<input type="text" name="phone" value="${escapeHtml(client.phone)}"></label>
                <label class="field">Protocolo<input type="text" name="protocol" value="${escapeHtml(client.protocol)}"></label>
                <label class="field">Contrato<input type="text" name="contract" value="${escapeHtml(client.contract)}"></label>
              </div></div>
              <div class="way-report-section"><h3>Motivo do contato</h3><label class="field">Tipo<select name="contact_type"><option>Problema técnico</option><option>Solicitação</option><option>Dúvida ou orientação</option><option>Acompanhamento de atendimento</option><option>Reclamação</option></select></label><details class="way-report-optional"><summary>＋ Personalizar o texto inicial</summary><label class="field">Resumo inicial<textarea name="initial_summary" placeholder="Se ficar vazio, o Way Tools criará o texto automaticamente."></textarea></label></details></div>
              <div class="way-report-section"><h3>Produtos ou serviços envolvidos</h3><div class="way-report-checks">${productChoices}</div></div>
            </section>
            <section class="way-report-page" data-page="1">
              ${productPanels}
              <div class="way-report-section" data-request-section hidden><h3 data-request-title>Solicitação realizada pelo cliente</h3><div class="way-report-checks">${checkedList(REQUESTS, "requests")}</div></div>
              <div class="way-report-section" data-scenario-section><h3>Cenário e abrangência</h3><div class="way-report-grid">
                <label class="field">Abrangência<select name="scope"><option value="">Não informado</option><option>Apenas um dispositivo</option><option>Vários dispositivos</option><option>Todos os dispositivos</option><option>Apenas um cômodo/local</option><option>Toda a residência/empresa</option><option>Possível problema regional</option></select></label>
                <label class="field">Frequência<select name="frequency"><option value="">Não informado</option><option>Constante</option><option>Intermitente</option><option>Em horários específicos</option><option>Ocorreu uma única vez</option></select></label>
              </div><details class="way-report-optional"><summary>＋ Informar quando começou e dispositivos afetados</summary><div class="way-report-grid" style="padding:0 12px 12px"><label class="field">Quando começou?<input type="text" name="started_at" placeholder="Ex.: hoje pela manhã; há três dias"></label><label class="field">Dispositivos afetados<input type="text" name="devices" placeholder="Ex.: celular, notebook e Smart TV"></label></div></details></div>
            </section>
            <section class="way-report-page" data-page="2">
              <div class="way-report-section"><h3>Verificações realizadas <small data-visible-checks></small></h3><p class="way-report-help">São exibidas apenas verificações compatíveis com os produtos selecionados.</p><div class="way-report-checks">${checkedList(CHECKS, "checks")}</div></div>
              <div class="way-report-section"><h3>Medições e observações técnicas</h3><div class="way-report-grid">
                <label class="field" data-measure-products="internet|roteador|telefonia">Sinal óptico<input type="text" name="optical_signal" placeholder="Ex.: -19,8 dBm; link loss"></label>
                <label class="field" data-measure-products="internet|roteador|dados_moveis">Teste de velocidade<input type="text" name="speed_test" placeholder="Ex.: 480 Mbps download / 230 Mbps upload"></label>
                <label class="field" data-measure-products="internet|roteador|dados_moveis">Latência e perda<input type="text" name="latency" placeholder="Ex.: 12 ms, sem perda de pacotes"></label>
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
          <footer class="way-report-footer"><button type="button" class="action" data-cancel>Cancelar</button><div><button type="button" class="action" data-previous>← Voltar</button><button type="button" class="action primary" data-next>Próxima →</button><button type="button" class="action success" data-insert hidden>Inserir relato no campo</button></div></footer>
        </form>
      </div>
    `;
    document.body.appendChild(root);
    const form = root.querySelector("form");
    const preview = root.querySelector("[data-preview]");
    let currentPage = 0;

    function updateConditionalFields() {
      const productIds = selectedProductIds(form);
      const productLabels = selectedValues(form, "products");
      const contactType = form.elements.contact_type.value;
      const showTechnicalProblems = ["Problema técnico", "Reclamação", "Acompanhamento de atendimento"].includes(contactType);
      const showRequests = ["Solicitação", "Dúvida ou orientação"].includes(contactType);

      for (const checkbox of form.querySelectorAll("[data-product]")) {
        const panel = form.querySelector(`[data-product-panel="${checkbox.dataset.product}"]`);
        panel.hidden = !checkbox.checked || !showTechnicalProblems;
        if (panel.hidden) {
          panel.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
        }
      }

      const requestSection = form.querySelector("[data-request-section]");
      requestSection.hidden = !showRequests;
      form.querySelector("[data-request-title]").textContent = contactType === "Dúvida ou orientação"
        ? "Dúvida ou orientação solicitada"
        : "Solicitação realizada pelo cliente";
      if (requestSection.hidden) {
        requestSection.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      }

      const scenarioSection = form.querySelector("[data-scenario-section]");
      scenarioSection.hidden = !showTechnicalProblems;
      if (scenarioSection.hidden) {
        scenarioSection.querySelectorAll("input,textarea,select").forEach((input) => {
          if (input.type !== "checkbox" && input.type !== "radio") input.value = "";
        });
      }

      for (const option of form.querySelectorAll("[data-route-products]")) {
        const visible = productIds.length > 0 && routeAllows(option, productIds, contactType);
        option.hidden = !visible;
        if (!visible) {
          option.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
        }
      }

      for (const field of form.querySelectorAll("[data-measure-products]")) {
        const allowedProducts = field.dataset.measureProducts.split("|");
        const visible = showTechnicalProblems && allowedProducts.some((id) => productIds.includes(id));
        field.hidden = !visible;
        if (!visible) {
          const input = field.querySelector("input,textarea,select");
          if (input) input.value = "";
        }
      }

      const outcomeOptions = [...form.querySelectorAll("[data-outcome-contacts]")];
      for (const option of outcomeOptions) {
        const allowedContacts = option.dataset.outcomeContacts.split("|");
        option.hidden = !(allowedContacts.includes("*") || allowedContacts.includes(contactType));
      }
      const selectedOutcome = form.querySelector('input[name="outcome"]:checked');
      if (!selectedOutcome || selectedOutcome.closest("[data-outcome-contacts]").hidden) {
        const preferredOutcome = contactType === "Solicitação"
          ? "solicitacao"
          : contactType === "Dúvida ou orientação" ? "orientado" : "resolvido";
        const preferredInput = form.querySelector(`input[name="outcome"][value="${preferredOutcome}"]`);
        const fallbackInput = outcomeOptions.find((option) => !option.hidden)?.querySelector('input[name="outcome"]');
        (preferredInput || fallbackInput).checked = true;
      }

      form.querySelector(".way-report-visit").hidden = form.elements.outcome.value !== "visita";

      const routeLabel = productLabels.length
        ? `${contactType} → ${productLabels.join(", ")}`
        : `${contactType} → selecione pelo menos um produto`;
      form.querySelector("[data-route-summary]").textContent = routeLabel;
      form.querySelector('[data-tab="1"]').textContent = showRequests
        ? "2. Solicitação"
        : showTechnicalProblems ? "2. Problema" : "2. Contexto";

      const visibleChecks = [...form.querySelectorAll('input[name="checks"]')]
        .filter((input) => !input.closest(".way-report-check").hidden).length;
      const visibleActions = [...form.querySelectorAll('input[name="actions"]')]
        .filter((input) => !input.closest(".way-report-check").hidden).length;
      form.querySelector("[data-visible-checks]").textContent = `(${visibleChecks} opções)`;
      form.querySelector("[data-visible-actions]").textContent = `(${visibleActions} opções)`;
    }

    function updatePreview() {
      preview.textContent = generateReport(form);
    }

    function showPage(index) {
      currentPage = Math.max(0, Math.min(5, Number(index)));
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
    });
    form.addEventListener("change", () => {
      updateConditionalFields();
      if (currentPage === 5) {
        updatePreview();
      }
    });
    function canAdvanceTo(index) {
      if (Number(index) > 0 && selectedProductIds(form).length === 0) {
        window.alert("Selecione pelo menos um produto ou serviço para montar a rota do relato.");
        return false;
      }
      return true;
    }

    form.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
      if (canAdvanceTo(tab.dataset.tab)) showPage(tab.dataset.tab);
    }));
    form.querySelector("[data-previous]").addEventListener("click", () => showPage(currentPage - 1));
    form.querySelector("[data-next]").addEventListener("click", () => {
      if (canAdvanceTo(currentPage + 1)) showPage(currentPage + 1);
    });
    form.querySelector("[data-insert]").addEventListener("click", () => {
      const report = generateReport(form);
      if (!report) {
        window.alert("Preencha pelo menos uma informação para gerar o relato.");
        return;
      }
      insertReport(editor, report);
      root.remove();
    });
    root.querySelectorAll(".way-report-close,[data-cancel]").forEach((button) => button.addEventListener("click", () => root.remove()));
    root.querySelector(".way-report-overlay").addEventListener("mousedown", (event) => {
      if (event.target === event.currentTarget) {
        root.remove();
      }
    });
    updateConditionalFields();
    showPage(0);
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

  function init() {
    addStyles();
    configureAll();
    new MutationObserver(configureAll).observe(document.documentElement, { childList: true, subtree: true });
    globalThis.WayToolsRuntime.registerMenuCommand(
      "way-erp-gerador-relato",
      "Abrir Gerador de Relato",
      () => openGenerator()
    );
    console.info("[Way ERP] Gerador de Relato v1.1 ativo.");
  }

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }
});
