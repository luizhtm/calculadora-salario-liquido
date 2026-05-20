export const DEFAULT_TAX_YEAR = 2026;

export const TAX_TABLES = {
  2026: {
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
  },
};

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateProgressiveTax(value, bands) {
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

export function calculateSalaryBreakdown(input) {
  const taxYear = Number(input.taxYear) || DEFAULT_TAX_YEAR;
  const taxTable = getTaxTable(taxYear);
  const grossSalary = normalizeNumber(input.grossSalary);
  const dependents = Math.max(Number.parseInt(input.dependents, 10) || 0, 0);
  const otherDiscounts = normalizeNumber(input.otherDiscounts);
  const benefits = normalizeNumber(input.benefits);
  const pension = normalizeNumber(input.pension);
  const privatePension = normalizeNumber(input.privatePension);
  const healthPlan = normalizeNumber(input.healthPlan);
  const deductionMode = input.deductionMode ?? "auto";

  const inss = calculateProgressiveTax(grossSalary, taxTable.inssBands);
  const privatePensionLimit = calculatePrivatePensionLimit(grossSalary, taxTable);
  const privatePensionDeductible = Math.min(privatePension, privatePensionLimit);
  const privatePensionExceeded = privatePension > privatePensionLimit;
  const deduction = chooseDeduction({
    mode: deductionMode,
    inss,
    dependents,
    pension,
    privatePensionDeductible,
    taxTable,
  });
  const irBase = roundMoney(Math.max(0, grossSalary - deduction.value));
  const irBand = getIrBand(irBase, taxTable);
  const irBeforeReduction = roundMoney(Math.max(0, irBase * irBand.rate - irBand.deduction));
  const irReduction = calculateMonthlyReduction(grossSalary, irBeforeReduction);
  const irrf = roundMoney(Math.max(0, irBeforeReduction - irReduction));
  const totalPayrollDiscounts =
    inss + irrf + otherDiscounts + pension + privatePension + healthPlan;
  const netSalary = roundMoney(grossSalary - totalPayrollDiscounts + benefits);
  const effectiveRate = grossSalary > 0 ? totalPayrollDiscounts / grossSalary : 0;

  return {
    benefits,
    deduction,
    effectiveRate,
    grossSalary,
    healthPlan,
    inss,
    irBase,
    irBand,
    irBeforeReduction,
    irReduction,
    irrf,
    netSalary,
    otherDiscounts,
    pension,
    privatePension,
    privatePensionDeductible,
    privatePensionExceeded,
    privatePensionExcess: roundMoney(Math.max(0, privatePension - privatePensionLimit)),
    privatePensionLimit,
    taxYear,
    totalPayrollDiscounts: roundMoney(totalPayrollDiscounts),
  };
}

export function getTaxTable(year = DEFAULT_TAX_YEAR) {
  const taxTable = TAX_TABLES[year];

  if (!taxTable) {
    throw new Error(`Tabela tributária não configurada para ${year}.`);
  }

  return taxTable;
}

function normalizeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0;
}

function getIrBand(base, taxTable) {
  return taxTable.irBands.find((band) => base <= band.limit) ?? taxTable.irBands.at(-1);
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

function calculatePrivatePensionLimit(grossSalary, taxTable) {
  return roundMoney(grossSalary * taxTable.privatePensionDeductionRate);
}

function chooseDeduction({
  mode,
  inss,
  dependents,
  pension,
  privatePensionDeductible,
  taxTable,
}) {
  const legalDeduction =
    inss + dependents * taxTable.dependentDeduction + pension + privatePensionDeductible;

  if (mode === "legal") {
    return { value: legalDeduction, label: "Deduções legais" };
  }

  if (mode === "simplified") {
    return { value: taxTable.simplifiedDeduction, label: "Desconto simplificado" };
  }

  if (taxTable.simplifiedDeduction > legalDeduction) {
    return { value: taxTable.simplifiedDeduction, label: "Desconto simplificado" };
  }

  return { value: legalDeduction, label: "Deduções legais" };
}
