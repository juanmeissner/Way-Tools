(() => {
  "use strict";

  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function preserveCapitalization(original, corrected) {
    if (original.length > 1 && original === original.toLocaleUpperCase("pt-BR")) {
      return corrected.toLocaleUpperCase("pt-BR");
    }

    if (original.length > 0 && original[0] === original[0].toLocaleUpperCase("pt-BR")) {
      return corrected.charAt(0).toLocaleUpperCase("pt-BR") + corrected.slice(1);
    }

    return corrected;
  }

  function cleanToken(token) {
    return token.replace(/^[\s("'`*[\]{<]+|[\s)"'`*\]},;!?}>]+$/g, "");
  }

  function create({ dictionary, personal = {} }) {
    if (!dictionary?.terms || !dictionary?.corrections) {
      throw new Error("Dicionário ortográfico indisponível.");
    }

    const personalCorrections = Object.create(null);
    for (const [source, target] of Object.entries(personal.corrections || {})) {
      const key = String(source).trim().toLocaleLowerCase("pt-BR");
      const value = String(target).trim();
      if (key && value) {
        personalCorrections[key] = value;
      }
    }

    const ignored = new Set([
      ...dictionary.ignored,
      ...(Array.isArray(personal.ignored) ? personal.ignored : [])
    ].map((word) => String(word).trim().toLocaleLowerCase("pt-BR")).filter(Boolean));

    const contextualRules = dictionary.contextualRules.map((rule) => ({
      regex: new RegExp(rule.pattern, rule.flags || "i"),
      message: rule.message
    }));

    function tokenProtected(token, word) {
      if (!token) {
        return true;
      }

      const cleaned = cleanToken(token);
      if (cleaned.toLocaleLowerCase("pt-BR") === word.toLocaleLowerCase("pt-BR")) {
        return false;
      }

      if (/\{\{[^{}]+\}\}/.test(token) || /<[^<>]+>/.test(token)) {
        return true;
      }

      if (/^https?:\/\//i.test(cleaned) || /^www\./i.test(cleaned)) {
        return true;
      }

      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        return true;
      }

      if (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(cleaned)) {
        return true;
      }

      if (/^(?:[a-f\d]{0,4}:){2,7}[a-f\d]{0,4}$/i.test(cleaned)) {
        return true;
      }

      if (/^(?:[A-F\d]{2}[:-]){5}[A-F\d]{2}$/i.test(cleaned)) {
        return true;
      }

      if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._/-]{4,}$/.test(cleaned)) {
        return true;
      }

      return cleaned.includes("\\") || cleaned.includes("/") || cleaned.startsWith("#") || cleaned.startsWith("@");
    }

    function correctWord(word, fullToken = word) {
      if (!word) {
        return null;
      }

      const key = word.toLocaleLowerCase("pt-BR");
      if (ignored.has(key) || tokenProtected(fullToken, word)) {
        return null;
      }

      if (hasOwn(personalCorrections, key)) {
        const corrected = preserveCapitalization(word, personalCorrections[key]);
        return corrected === word ? null : corrected;
      }

      if (hasOwn(dictionary.terms, key)) {
        const corrected = dictionary.terms[key];
        return corrected === word ? null : corrected;
      }

      if (!hasOwn(dictionary.corrections, key)) {
        return null;
      }

      const corrected = preserveCapitalization(word, dictionary.corrections[key]);
      return corrected === word ? null : corrected;
    }

    function tokenAround(text, start, end) {
      let left = start;
      let right = end;
      while (left > 0 && !/\s/.test(text[left - 1])) {
        left -= 1;
      }
      while (right < text.length && !/\s/.test(text[right])) {
        right += 1;
      }
      return text.substring(left, right);
    }

    function normalizePunctuation(text) {
      return text
        .replace(/[ \t]+([,.;!?])/g, "$1")
        .replace(/([,;!?])(?=\p{L})/gu, "$1 ")
        .replace(/[ \t]+\n/g, "\n");
    }

    function correctText(input, options = {}) {
      let text = String(input || "");
      text = text.replace(/[\p{L}\p{N}][\p{L}\p{N}\p{M}-]*/gu, (word, offset) => {
        return correctWord(word, tokenAround(text, offset, offset + word.length)) || word;
      });
      return options.normalizePunctuation === false ? text : normalizePunctuation(text);
    }

    function contextualSuggestions(text) {
      return contextualRules
        .filter((rule) => rule.regex.test(String(text || "")))
        .map((rule) => rule.message);
    }

    return Object.freeze({
      correctWord,
      correctText,
      contextualSuggestions,
      counts: Object.freeze({
        terms: Object.keys(dictionary.terms).length,
        corrections: Object.keys(dictionary.corrections).length,
        personalCorrections: Object.keys(personalCorrections).length,
        ignored: ignored.size
      })
    });
  }

  globalThis.WayToolsSpellingEngine = Object.freeze({ create, preserveCapitalization });
})();
