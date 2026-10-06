(() => {
  "use strict";

  globalThis.WAY_TOOLS_SCRIPTS = Object.freeze([
    Object.freeze({
      id: "way-mensagens",
      name: "Mensagens Personalizadas",
      version: "3.11",
      description: "Mensagens, autocomplete, dados do cliente, visitas técnicas, alertas de inatividade e notificações de novas mensagens.",
      matches: Object.freeze(["https://ia-nocodb.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-erp-copiar-dados",
      name: "ERP — Copiar Dados",
      version: "1.6",
      description: "Copia protocolo, cliente, contrato, conexão e IP diretamente no ERP Way.",
      matches: Object.freeze(["https://erp.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-erp-gerador-relato",
      name: "ERP — Gerador de Relato",
      version: "1.13",
      description: "Assistente dinâmico com rascunho automático, suporte ao Way Vision e estúdio visual para vincular, priorizar, ordenar e simular opções.",
      matches: Object.freeze(["https://erp.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-interface-compacta",
      name: "ERP — Interface Compacta",
      version: "3.4",
      description: "Interface compacta, resumo e apoio a visitas técnicas no ERP Way.",
      matches: Object.freeze(["https://erp.internetway.com.br/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-erp-temas",
      name: "ERP — Tema Claro/Escuro",
      version: "1.0",
      badge: "BETA",
      description: "Tema claro, escuro ou automático exclusivo do ERP Way.",
      matches: Object.freeze(["https://erp.internetway.com.br/*"]),
      defaultEnabled: false
    }),
    Object.freeze({
      id: "matrix-mensagens",
      name: "Matrix — Mensagens Personalizadas",
      version: "1.2",
      description: "Comandos com !, tags do cliente e configuração de mensagens no modelo clássico do Matrix.",
      matches: Object.freeze(["https://wayinternet.matrixdobrasil.ai/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "matrix-interface-compacta",
      name: "Matrix — Interface Compacta",
      version: "3.4",
      description: "Interface compacta, resumo e apoio a visitas técnicas no Matrix.",
      matches: Object.freeze(["https://wayinternet.matrixdobrasil.ai/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "matrix-temas",
      name: "Matrix — Tema Claro/Escuro",
      version: "1.1",
      description: "Tema claro, escuro ou automático exclusivo do Matrix.",
      matches: Object.freeze(["https://wayinternet.matrixdobrasil.ai/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "matrix-corrigir-colagem",
      name: "Matrix — Corrigir Colagem",
      version: "3.5",
      description: "Preserva quebras de linha, negrito e a colagem nativa de imagens no Matrix.",
      matches: Object.freeze(["https://wayinternet.matrixdobrasil.ai/*"]),
      defaultEnabled: true
    }),
    Object.freeze({
      id: "way-corretor-ortografico-pro",
      name: "Corretor Ortográfico PRO",
      version: "3.2",
      description: "Correção PT-BR ampliada, termos de suporte e telecom, alertas contextuais e dicionário pessoal.",
      matches: Object.freeze([
        "https://erp.internetway.com.br/*",
        "https://ia-nocodb.internetway.com.br/*",
        "https://wayinternet.matrixdobrasil.ai/*"
      ]),
      defaultEnabled: true
    })
  ]);
})();
