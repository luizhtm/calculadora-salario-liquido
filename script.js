import { DEFAULT_TAX_YEAR, calculateSalaryBreakdown } from "./calculator.mjs";

const form = document.querySelector("#salary-form");
const resetButton = document.querySelector("#reset-button");
const shareLinkButton = document.querySelector("#share-link-button");
const shareFeedback = document.querySelector("#share-feedback");
const shareLinkFallback = document.querySelector("#share-link-fallback");
const shareLinkInput = document.querySelector("#share-link-input");
const copyMemoryButton = document.querySelector("#copy-memory-button");
const copyFeedback = document.querySelector("#copy-feedback");
const canonicalUrl = document.querySelector("link[rel='canonical']")?.href;
let currentResult;
let copyFeedbackTimer;
let shareFeedbackTimer;
let shouldSyncUrl = true;

const sharedFieldMap = {
  salario: "grossSalary",
  dependentes: "dependents",
  outros: "otherDiscounts",
  beneficios: "benefits",
  pensao: "pension",
  pgbl: "privatePension",
  saude: "healthPlan",
  deducao: "deductionMode",
};

const fields = {
  grossSalary: document.querySelector("#gross-salary"),
  dependents: document.querySelector("#dependents"),
  otherDiscounts: document.querySelector("#other-discounts"),
  benefits: document.querySelector("#benefits"),
  pension: document.querySelector("#pension"),
  privatePension: document.querySelector("#private-pension"),
  healthPlan: document.querySelector("#health-plan"),
  deductionMode: document.querySelector("#deduction-mode"),
};

const output = {
  netSalary: document.querySelector("#net-salary"),
  inss: document.querySelector("#inss-value"),
  irrf: document.querySelector("#irrf-value"),
  discounts: document.querySelector("#discounts-value"),
  pension: document.querySelector("#pension-value"),
  privatePension: document.querySelector("#private-pension-value"),
  healthPlan: document.querySelector("#health-plan-value"),
  benefits: document.querySelector("#benefits-value"),
  effectiveRate: document.querySelector("#effective-rate"),
  irBase: document.querySelector("#ir-base"),
  deductionUsed: document.querySelector("#deduction-used"),
  privatePensionLimit: document.querySelector("#private-pension-limit"),
  privatePensionWarning: document.querySelector("#private-pension-warning"),
  privatePensionDeductible: document.querySelector("#private-pension-deductible"),
  irReduction: document.querySelector("#ir-reduction"),
  irRate: document.querySelector("#ir-rate"),
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseMoney(value) {
  if (!value) return 0;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function getInputValues() {
  return {
    grossSalary: parseMoney(fields.grossSalary.value),
    dependents: fields.dependents.value,
    otherDiscounts: parseMoney(fields.otherDiscounts.value),
    benefits: parseMoney(fields.benefits.value),
    pension: parseMoney(fields.pension.value),
    privatePension: parseMoney(fields.privatePension.value),
    healthPlan: parseMoney(fields.healthPlan.value),
    deductionMode: fields.deductionMode.value,
    taxYear: DEFAULT_TAX_YEAR,
  };
}

function applySharedParams() {
  const params = new URLSearchParams(window.location.search);
  let applied = false;

  for (const [paramName, fieldName] of Object.entries(sharedFieldMap)) {
    const value = params.get(paramName);

    if (value === null || !(fieldName in fields)) continue;

    fields[fieldName].value = value;
    applied = true;
  }

  return applied;
}

function createSimulationUrl(baseUrl = window.location.href) {
  const url = new URL(baseUrl);
  const values = getInputValues();
  const params = createSimulationParams(values);

  url.search = params.toString();
  url.hash = "";
  return url.toString();
}

function createShareUrl() {
  return createSimulationUrl(canonicalUrl || window.location.href);
}

function createSimulationParams(values) {
  const params = new URLSearchParams();

  params.set("salario", fields.grossSalary.value.trim() || String(values.grossSalary));
  params.set("dependentes", String(Math.max(Number.parseInt(fields.dependents.value, 10) || 0, 0)));
  params.set("deducao", fields.deductionMode.value);

  setOptionalParam(params, "outros", fields.otherDiscounts.value);
  setOptionalParam(params, "beneficios", fields.benefits.value);
  setOptionalParam(params, "pensao", fields.pension.value);
  setOptionalParam(params, "pgbl", fields.privatePension.value);
  setOptionalParam(params, "saude", fields.healthPlan.value);

  return params;
}

function setOptionalParam(params, name, value) {
  const trimmed = value.trim();

  if (parseMoney(trimmed) > 0) {
    params.set(name, trimmed);
  }
}

function syncUrlWithSimulation() {
  if (!shouldSyncUrl) return;

  window.history.replaceState({}, "", createSimulationUrl());
}

function renderSalary(result) {
  currentResult = result;
  output.netSalary.value = currency.format(result.netSalary);
  output.netSalary.textContent = currency.format(result.netSalary);
  output.inss.textContent = currency.format(result.inss);
  output.irrf.textContent = currency.format(result.irrf);
  output.discounts.textContent = currency.format(result.otherDiscounts);
  output.pension.textContent = currency.format(result.pension);
  output.privatePension.textContent = currency.format(result.privatePension);
  output.healthPlan.textContent = currency.format(result.healthPlan);
  output.benefits.textContent = currency.format(result.benefits);
  output.effectiveRate.textContent = percent.format(result.effectiveRate);
  output.irBase.textContent = currency.format(result.irBase);
  output.deductionUsed.textContent =
    `${currency.format(result.deduction.value)} · ${result.deduction.label}`;
  output.privatePensionLimit.textContent =
    `Limite dedutível estimado: ${currency.format(result.privatePensionLimit)}`;
  output.privatePensionDeductible.textContent =
    currency.format(result.privatePensionDeductible);
  output.privatePensionWarning.hidden = !result.privatePensionExceeded;

  if (result.privatePensionExceeded) {
    fields.privatePension.setAttribute("aria-invalid", "true");
    output.privatePensionWarning.textContent =
      `${currency.format(result.privatePensionExcess)} excede o limite estimado e não reduz o IRRF nesta simulação.`;
  } else {
    fields.privatePension.removeAttribute("aria-invalid");
  }

  output.irReduction.textContent = currency.format(result.irReduction);
  output.irRate.textContent = percent.format(result.irBand.rate);
}

function calculateSalary() {
  renderSalary(calculateSalaryBreakdown(getInputValues()));
  syncUrlWithSimulation();
}

function createCalculationMemory(result) {
  return [
    "Memória de cálculo - Salário Líquido Hoje",
    `Ano das tabelas: ${result.taxYear}`,
    "",
    `Salário bruto: ${currency.format(result.grossSalary)}`,
    `INSS: ${currency.format(result.inss)}`,
    `IRRF: ${currency.format(result.irrf)}`,
    `Outros descontos: ${currency.format(result.otherDiscounts)}`,
    `Pensão alimentícia judicial: ${currency.format(result.pension)}`,
    `Previdência comp. (PGBL): ${currency.format(result.privatePension)}`,
    `PGBL dedutível estimado: ${currency.format(result.privatePensionDeductible)}`,
    `Plano de saúde em folha: ${currency.format(result.healthPlan)}`,
    `Benefícios adicionais: ${currency.format(result.benefits)}`,
    "",
    `Base do IRRF: ${currency.format(result.irBase)}`,
    `Dedução usada no IRRF: ${currency.format(result.deduction.value)} · ${result.deduction.label}`,
    `Redução Lei 15.270/2025: ${currency.format(result.irReduction)}`,
    `Alíquota marginal do IRRF: ${percent.format(result.irBand.rate)}`,
    `Desconto efetivo sobre o bruto: ${percent.format(result.effectiveRate)}`,
    "",
    `Salário líquido estimado: ${currency.format(result.netSalary)}`,
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded browsers expose Clipboard API but block writes.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

function showCopyFeedback(message) {
  window.clearTimeout(copyFeedbackTimer);
  copyFeedback.textContent = message;
  copyFeedbackTimer = window.setTimeout(() => {
    copyFeedback.textContent = "";
  }, 2600);
}

function showShareFeedback(message) {
  window.clearTimeout(shareFeedbackTimer);
  shareFeedback.textContent = message;
  shareFeedbackTimer = window.setTimeout(() => {
    shareFeedback.textContent = "";
  }, 2600);
}

async function copyCalculationMemory() {
  if (!currentResult) return;

  try {
    await copyText(createCalculationMemory(currentResult));
    showCopyFeedback("Memória copiada.");
  } catch {
    showCopyFeedback("Não foi possível copiar automaticamente neste navegador.");
  }
}

async function copySimulationLink() {
  const simulationUrl = createShareUrl();
  shareLinkInput.value = simulationUrl;

  try {
    await copyText(simulationUrl);
    shareLinkFallback.hidden = true;
    showShareFeedback("Link da simulação copiado.");
  } catch {
    shareLinkFallback.hidden = false;
    shareLinkInput.focus();
    shareLinkInput.select();
    showShareFeedback("Copie o link no campo abaixo.");
  }
}

function resetForm() {
  shouldSyncUrl = false;
  fields.grossSalary.value = "";
  fields.dependents.value = "0";
  fields.otherDiscounts.value = "";
  fields.benefits.value = "";
  fields.pension.value = "";
  fields.privatePension.value = "";
  fields.healthPlan.value = "";
  fields.deductionMode.value = "auto";
  window.history.replaceState({}, "", window.location.pathname);
  shouldSyncUrl = true;
  calculateSalary();
  fields.grossSalary.focus();
}

form.addEventListener("input", calculateSalary);
form.addEventListener("change", calculateSalary);
resetButton.addEventListener("click", resetForm);
shareLinkButton.addEventListener("click", copySimulationLink);
copyMemoryButton.addEventListener("click", copyCalculationMemory);

applySharedParams();
calculateSalary();
