const storageKey = "way-tools-tampermonkey-setup";
const checklist = document.querySelectorAll("#setup-checklist input[type='checkbox']");
const progressValue = document.querySelector("#progress-value");
const progressBar = document.querySelector("#progress-bar");
const progressMessage = document.querySelector("#progress-message");

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveProgress() {
  const values = {};
  checklist.forEach((item) => {
    values[item.dataset.step] = item.checked;
  });
  localStorage.setItem(storageKey, JSON.stringify(values));
}

function updateProgress() {
  const completed = [...checklist].filter((item) => item.checked).length;
  const percentage = Math.round((completed / checklist.length) * 100);

  progressValue.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;

  if (percentage === 100) {
    progressMessage.textContent = "Tudo pronto — seu navegador está preparado.";
  } else if (completed > 0) {
    progressMessage.textContent = `${completed} de ${checklist.length} etapas concluídas.`;
  } else {
    progressMessage.textContent = "Marque cada item à medida que concluir.";
  }
}

const savedProgress = readProgress();
checklist.forEach((item) => {
  item.checked = Boolean(savedProgress[item.dataset.step]);
  item.addEventListener("change", () => {
    saveProgress();
    updateProgress();
  });
});
updateProgress();

const copyButton = document.querySelector("#copy-extensions-url");
const extensionsUrl = document.querySelector("#extensions-url").textContent;

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(extensionsUrl);
  } catch {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = extensionsUrl;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    temporaryInput.remove();
  }

  const label = copyButton.querySelector("span:last-child");
  copyButton.classList.add("copied");
  label.textContent = "Endereço copiado";

  window.setTimeout(() => {
    copyButton.classList.remove("copied");
    label.textContent = "Copiar endereço";
  }, 2200);
});
