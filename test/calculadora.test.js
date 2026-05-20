const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const scriptSource = fs.readFileSync(path.join(rootDir, "script.js"), "utf8");

const elementIds = [
  "salary-form",
  "reset-button",
  "gross-salary",
  "dependents",
  "other-discounts",
  "benefits",
  "pension",
  "private-pension",
  "health-plan",
  "deduction-mode",
  "net-salary",
  "inss-value",
  "irrf-value",
  "discounts-value",
  "pension-value",
  "private-pension-value",
  "health-plan-value",
  "benefits-value",
  "effective-rate",
  "ir-base",
  "deduction-used",
  "private-pension-limit",
  "private-pension-warning",
  "private-pension-deductible",
  "ir-reduction",
  "ir-rate",
];

function createElement() {
  return {
    attrs: {},
    hidden: false,
    textContent: "",
    value: "",
    addEventListener() {},
    focus() {},
    removeAttribute(name) {
      delete this.attrs[name];
    },
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
}

function createCalculator() {
  const elements = Object.fromEntries(elementIds.map((id) => [id, createElement()]));

  elements["gross-salary"].value = "6500,00";
  elements.dependents.value = "0";
  elements["deduction-mode"].value = "auto";

  const context = {
    document: {
      querySelector(selector) {
        return elements[selector.slice(1)];
      },
    },
    Event: function Event() {},
    Intl,
    Math,
    Number,
  };

  vm.createContext(context);
  vm.runInContext(scriptSource, context);

  return {
    calculate: context.calculateSalary,
    elements,
    set(id, value) {
      elements[id].value = value;
      context.calculateSalary();
    },
    text(id) {
      return elements[id].textContent.replace(/\u00a0/g, " ");
    },
    attr(id, name) {
      return elements[id].attrs[name] ?? null;
    },
  };
}

test("calcula o cenário inicial com salário bruto de R$ 6.500,00", () => {
  const calculator = createCalculator();

  assert.equal(calculator.text("inss-value"), "R$ 711,51");
  assert.equal(calculator.text("irrf-value"), "R$ 569,92");
  assert.equal(calculator.text("net-salary"), "R$ 5.218,57");
  assert.equal(calculator.text("private-pension-limit"), "Limite dedutível estimado: R$ 780,00");
  assert.equal(calculator.attr("private-pension", "aria-invalid"), null);
});

test("pensão alimentícia judicial reduz IRRF e também o salário líquido", () => {
  const calculator = createCalculator();

  calculator.set("pension", "500,00");

  assert.equal(calculator.text("ir-base"), "R$ 5.288,49");
  assert.equal(calculator.text("irrf-value"), "R$ 432,42");
  assert.equal(calculator.text("pension-value"), "R$ 500,00");
  assert.equal(calculator.text("net-salary"), "R$ 4.856,07");
});

test("plano de saúde descontado em folha reduz o líquido, mas não a base do IRRF", () => {
  const calculator = createCalculator();

  calculator.set("health-plan", "300,00");

  assert.equal(calculator.text("ir-base"), "R$ 5.788,49");
  assert.equal(calculator.text("irrf-value"), "R$ 569,92");
  assert.equal(calculator.text("health-plan-value"), "R$ 300,00");
  assert.equal(calculator.text("net-salary"), "R$ 4.918,57");
});

test("PGBL dentro do limite reduz a base do IRRF e o líquido integralmente", () => {
  const calculator = createCalculator();

  calculator.set("private-pension", "500,00");

  assert.equal(calculator.text("private-pension-deductible"), "R$ 500,00");
  assert.equal(calculator.text("ir-base"), "R$ 5.288,49");
  assert.equal(calculator.text("irrf-value"), "R$ 432,42");
  assert.equal(calculator.text("net-salary"), "R$ 4.856,07");
  assert.equal(calculator.elements["private-pension-warning"].hidden, true);
});

test("PGBL acima do limite só deduz a parcela permitida e mostra alerta", () => {
  const calculator = createCalculator();

  calculator.set("private-pension", "1000,00");

  assert.equal(calculator.text("private-pension-deductible"), "R$ 780,00");
  assert.equal(calculator.text("ir-base"), "R$ 5.008,49");
  assert.equal(calculator.text("irrf-value"), "R$ 355,42");
  assert.equal(calculator.text("net-salary"), "R$ 4.433,07");
  assert.equal(calculator.elements["private-pension-warning"].hidden, false);
  assert.equal(calculator.attr("private-pension", "aria-invalid"), "true");
});

test("modo automático usa o desconto simplificado quando ele é maior que as deduções legais", () => {
  const calculator = createCalculator();

  calculator.set("gross-salary", "3000,00");

  assert.equal(calculator.text("deduction-used"), "R$ 607,20 · Desconto simplificado");
  assert.equal(calculator.text("irrf-value"), "R$ 0,00");
  assert.equal(calculator.text("net-salary"), "R$ 2.751,40");
});
