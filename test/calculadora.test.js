const assert = require("node:assert/strict");
const test = require("node:test");

let DEFAULT_TAX_YEAR;
let TAX_TABLES;
let calculateSalaryBreakdown;
let getTaxTable;

test.before(async () => {
  ({ DEFAULT_TAX_YEAR, TAX_TABLES, calculateSalaryBreakdown, getTaxTable } =
    await import("../calculator.mjs"));
});

function calculate(overrides = {}) {
  return calculateSalaryBreakdown({
    grossSalary: 6500,
    dependents: 0,
    otherDiscounts: 0,
    benefits: 0,
    pension: 0,
    privatePension: 0,
    healthPlan: 0,
    deductionMode: "auto",
    taxYear: DEFAULT_TAX_YEAR,
    ...overrides,
  });
}

test("calcula o cenário inicial com salário bruto de R$ 6.500,00", () => {
  const result = calculate();

  assert.equal(result.inss, 711.51);
  assert.equal(result.irrf, 569.92);
  assert.equal(result.netSalary, 5218.57);
  assert.equal(result.privatePensionLimit, 780);
  assert.equal(result.privatePensionExceeded, false);
  assert.equal(result.taxYear, 2026);
});

test("pensão alimentícia judicial reduz IRRF e também o salário líquido", () => {
  const result = calculate({ pension: 500 });

  assert.equal(result.irBase, 5288.49);
  assert.equal(result.irrf, 432.42);
  assert.equal(result.pension, 500);
  assert.equal(result.netSalary, 4856.07);
});

test("plano de saúde descontado em folha reduz o líquido, mas não a base do IRRF", () => {
  const result = calculate({ healthPlan: 300 });

  assert.equal(result.irBase, 5788.49);
  assert.equal(result.irrf, 569.92);
  assert.equal(result.healthPlan, 300);
  assert.equal(result.netSalary, 4918.57);
});

test("PGBL dentro do limite reduz a base do IRRF e o líquido integralmente", () => {
  const result = calculate({ privatePension: 500 });

  assert.equal(result.privatePensionDeductible, 500);
  assert.equal(result.privatePensionExceeded, false);
  assert.equal(result.irBase, 5288.49);
  assert.equal(result.irrf, 432.42);
  assert.equal(result.netSalary, 4856.07);
});

test("PGBL acima do limite só deduz a parcela permitida e mostra excedente", () => {
  const result = calculate({ privatePension: 1000 });

  assert.equal(result.privatePensionDeductible, 780);
  assert.equal(result.privatePensionExceeded, true);
  assert.equal(result.privatePensionExcess, 220);
  assert.equal(result.irBase, 5008.49);
  assert.equal(result.irrf, 355.42);
  assert.equal(result.netSalary, 4433.07);
});

test("modo automático usa o desconto simplificado quando ele é maior que as deduções legais", () => {
  const result = calculate({ grossSalary: 3000 });

  assert.equal(result.deduction.value, 607.2);
  assert.equal(result.deduction.label, "Desconto simplificado");
  assert.equal(result.irrf, 0);
  assert.equal(result.netSalary, 2751.4);
});

test("tabelas tributárias são versionadas por ano", () => {
  assert.equal(DEFAULT_TAX_YEAR, 2026);
  assert.deepEqual(getTaxTable(2026), TAX_TABLES[2026]);
  assert.throws(() => getTaxTable(2027), /Tabela tributária não configurada para 2027/);
});
