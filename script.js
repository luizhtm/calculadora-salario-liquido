const CONFIG = {
  dependentDeduction: 189.59,
  simplifiedDeduction: 607.2,
  privatePensionDeductionRate: 0.12,
  inssBands: [
    { limit: 1621.0, rate: 0.075 },
    { limit: 2902.84, rate: 0.09 },
    { limit: 4354.27, rate: 0.12 },
    { limit: 8475.55, rate: 0.14 },
  ],
  irBands: [
    { limit: 2428.8, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15, deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.73 },
  ],
};

const form = document.querySelector("#salary-form");
const resetButton = document.querySelector("#reset-button");

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

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateProgressiveTax(value, bands) {
  let previousLimit = 0;
  let total = 0;

  for (const band of bands) {
    const taxable = Math.min(value, band.limit) - previousLimit;

    if (taxable > 0) {
      total += taxable * band.rate;
    }

    if (value <= band.limit) break;
    previousLimit = band.limit;
  }

  return roundMoney(total);
}

function getIrBand(base) {
  return CONFIG.irBands.find((band) => base <= band.limit) ?? CONFIG.irBands.at(-1);
}

function calculateMonthlyReduction(grossSalary, calculatedTax) {
  let reduction = 0;

  if (grossSalary <= 5000) {
    reduction = calculatedTax;
  } else if (grossSalary <= 7350) {
    reduction = 978.62 - 0.133145 * grossSalary;
  }

  return roundMoney(Math.max(0, Math.min(calculatedTax, reduction)));
}

function calculatePrivatePensionLimit(grossSalary) {
  return roundMoney(grossSalary * CONFIG.privatePensionDeductionRate);
}

function chooseDeduction({ mode, inss, dependents, pension, privatePensionDeductible }) {
  const legalDeduction =
    inss + dependents * CONFIG.dependentDeduction + pension + privatePensionDeductible;

  if (mode === "legal") {
    return { value: legalDeduction, label: "Deduções legais" };
  }

  if (mode === "simplified") {
    return { value: CONFIG.simplifiedDeduction, label: "Desconto simplificado" };
  }

  if (CONFIG.simplifiedDeduction > legalDeduction) {
    return { value: CONFIG.simplifiedDeduction, label: "Desconto simplificado" };
  }

  return { value: legalDeduction, label: "Deduções legais" };
}

function calculateSalary() {
  const grossSalary = parseMoney(fields.grossSalary.value);
  const dependents = Math.max(Number.parseInt(fields.dependents.value, 10) || 0, 0);
  const otherDiscounts = parseMoney(fields.otherDiscounts.value);
  const benefits = parseMoney(fields.benefits.value);
  const pension = parseMoney(fields.pension.value);
  const privatePension = parseMoney(fields.privatePension.value);
  const healthPlan = parseMoney(fields.healthPlan.value);

  const inss = calculateProgressiveTax(grossSalary, CONFIG.inssBands);
  const privatePensionLimit = calculatePrivatePensionLimit(grossSalary);
  const privatePensionDeductible = Math.min(privatePension, privatePensionLimit);
  const privatePensionExceeded = privatePension > privatePensionLimit;
  const deduction = chooseDeduction({
    mode: fields.deductionMode.value,
    inss,
    dependents,
    pension,
    privatePensionDeductible,
  });
  const irBase = Math.max(0, grossSalary - deduction.value);
  const irBand = getIrBand(irBase);
  const irBeforeReduction = roundMoney(Math.max(0, irBase * irBand.rate - irBand.deduction));
  const irReduction = calculateMonthlyReduction(grossSalary, irBeforeReduction);
  const irrf = roundMoney(Math.max(0, irBeforeReduction - irReduction));
  const totalPayrollDiscounts =
    inss + irrf + otherDiscounts + pension + privatePension + healthPlan;
  const netSalary = roundMoney(grossSalary - totalPayrollDiscounts + benefits);
  const effectiveRate = grossSalary > 0 ? totalPayrollDiscounts / grossSalary : 0;

  output.netSalary.value = currency.format(netSalary);
  output.netSalary.textContent = currency.format(netSalary);
  output.inss.textContent = currency.format(inss);
  output.irrf.textContent = currency.format(irrf);
  output.discounts.textContent = currency.format(otherDiscounts);
  output.pension.textContent = currency.format(pension);
  output.privatePension.textContent = currency.format(privatePension);
  output.healthPlan.textContent = currency.format(healthPlan);
  output.benefits.textContent = currency.format(benefits);
  output.effectiveRate.textContent = percent.format(effectiveRate);
  output.irBase.textContent = currency.format(irBase);
  output.deductionUsed.textContent = `${currency.format(deduction.value)} · ${deduction.label}`;
  output.privatePensionLimit.textContent =
    `Limite dedutível estimado: ${currency.format(privatePensionLimit)}`;
  output.privatePensionDeductible.textContent = currency.format(privatePensionDeductible);
  output.privatePensionWarning.hidden = !privatePensionExceeded;

  if (privatePensionExceeded) {
    const excess = roundMoney(privatePension - privatePensionLimit);
    fields.privatePension.setAttribute("aria-invalid", "true");
    output.privatePensionWarning.textContent =
      `${currency.format(excess)} excede o limite estimado e não reduz o IRRF nesta simulação.`;
  } else {
    fields.privatePension.removeAttribute("aria-invalid");
  }

  output.irReduction.textContent = currency.format(irReduction);
  output.irRate.textContent = percent.format(irBand.rate);
}

function resetForm() {
  fields.grossSalary.value = "";
  fields.dependents.value = "0";
  fields.otherDiscounts.value = "";
  fields.benefits.value = "";
  fields.pension.value = "";
  fields.privatePension.value = "";
  fields.healthPlan.value = "";
  fields.deductionMode.value = "auto";
  calculateSalary();
  fields.grossSalary.focus();
}

form.addEventListener("input", calculateSalary);
form.addEventListener("change", calculateSalary);
resetButton.addEventListener("click", resetForm);

calculateSalary();
