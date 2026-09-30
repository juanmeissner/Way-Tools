(() => {
  "use strict";

  globalThis.WAY_TOOLS_SCRIPTS = Object.freeze([
    Object.freeze({
      id: "way-mensagens",
      name: "Mensagens Personalizadas",
      version: "3.4",
      description: "Mensagens, autocomplete, dados do cliente, visitas técnicas e alertas de inatividade.",
      matches: Object.freeze(["https://ia-nocodb.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-erp-copiar-dados",
      name: "ERP — Copiar Dados",
      version: "1.4",
      description: "Copia protocolo, cliente, contrato, conexão e IP diretamente no ERP Way.",
      matches: Object.freeze(["https://erp.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-interface-compacta",
      name: "Interface Compacta + Tema",
      version: "3.4 + 1.1",
      description: "Interface compacta no ERP e Matrix, com tema claro, escuro ou automático exclusivo do Matrix.",
      matches: Object.freeze([
        "https://wayinternet.matrixdobrasil.ai/*",
        "https://erp.internetway.com.br/*"
      ]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-corretor-ortografico-pro",
      name: "Corretor Ortográfico PRO",
      version: "3.2",
      description: "Correção PT-BR ampliada, termos de suporte e telecom, alertas contextuais e dicionário pessoal.",
      matches: Object.freeze([
        "https://wayinternet.matrixdobrasil.ai/*",
        "https://erp.internetway.com.br/*",
        "https://ia-nocodb.internetway.com.br/*"
      ]),
      defaultEnabled: true
    })
  ]);
})();
