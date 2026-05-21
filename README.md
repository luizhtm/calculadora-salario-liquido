# Salário Líquido Hoje

Calculadora de salário líquido CLT feita só com HTML, CSS e JavaScript. A proposta é ser simples de publicar em GitHub Pages, Netlify, Vercel ou qualquer hospedagem estática.

## Stack

- HTML sem build step
- CSS próprio com [Pico CSS](https://picocss.com/) via CDN
- JavaScript puro

Escolhi o Pico CSS como framework minimalista porque ele é opinativo o suficiente para deixar formulários bonitos rapidamente, mas não exige Node, bundler, compilação ou configuração.

## O que a calculadora faz

- Calcula INSS progressivo para empregado CLT.
- Calcula IRRF mensal com tabela vigente em 2026.
- Considera dependentes, pensão alimentícia judicial, previdência complementar/PGBL, plano de saúde descontado em folha, outros descontos e benefícios.
- Aplica o desconto simplificado mensal de R$ 607,20 quando ele for mais vantajoso, ou permite escolher manualmente.
- Aplica a redução da Lei 15.270/2025 para rendimentos mensais até R$ 7.350,00.
- Permite copiar um link compartilhável com os campos da simulação preenchidos.

## Sobre plano de saúde e IRRF

Plano de saúde pago pelo contribuinte pode ser despesa médica dedutível na declaração anual do Imposto de Renda. Quando o plano é empresarial, a Receita Federal orienta que é necessário comprovar que o efetivo pagamento foi feito pelo titular ou por seus dependentes.

Para o cálculo mensal do IRRF em folha, porém, as deduções comuns são INSS, dependentes, pensão alimentícia judicial, previdência complementar em condições específicas e o desconto simplificado mensal. Por isso, nesta calculadora o plano de saúde reduz o salário líquido, mas não reduz a base mensal do IRRF.

## Sobre previdência complementar e PGBL

Contribuições para previdência complementar/PGBL podem ser usadas como dedução legal do Imposto de Renda, observadas as condições legais. Na declaração anual, a Receita Federal informa o limite de 12% dos rendimentos tributáveis.

Nesta calculadora, o campo `Previdência complementar / PGBL` reduz a base mensal do IRRF quando a opção de deduções legais for usada ou quando ela for mais vantajosa que o desconto simplificado mensal. O valor também reduz o salário líquido, porque representa desconto/aporte pago pelo trabalhador.

Para a simulação mensal, o limite dedutível estimado é calculado como 12% do salário bruto informado. Se o valor digitado passar desse limite, apenas a parcela estimada como dedutível reduz a base do IRRF; o valor integral continua reduzindo o salário líquido.

## Como rodar localmente

Como o JavaScript usa módulos ES, rode por HTTP local para evitar bloqueios de `file://` no navegador.

```bash
npx serve .
```

ou, com Python:

```bash
python3 -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

## Como rodar os testes

Os testes usam o test runner nativo do Node.js, sem dependências externas:

```bash
node --test
```

Se você tiver `npm` disponível, também pode rodar:

```bash
npm test
```

## SEO e domínio

O projeto inclui `canonical`, metadados Open Graph/Twitter, `robots.txt`, `sitemap.xml` e favicon. A URL configurada é:

```text
https://luizhtm.github.io/calculadora-salario-liquido/
```

Se você usar um domínio próprio no GitHub Pages, atualize essa URL em `index.html`, `robots.txt` e `sitemap.xml`.

## Atualização das tabelas

As regras usadas estão concentradas no objeto `TAX_TABLES`, no começo de `calculator.mjs`.

Cada ano tem seu próprio bloco de configuração. A calculadora usa `DEFAULT_TAX_YEAR` como ano padrão.

Quando INSS ou IRRF mudarem, atualize:

- `inssBands`
- `irBands`
- `dependentDeduction`
- `simplifiedDeduction`
- fórmula de redução, se a legislação mudar

Fontes consultadas em 20/05/2026:

- INSS: tabela de contribuição mensal válida a partir da competência janeiro/2026.
- Receita Federal: exemplos de aplicação da Lei 15.270/2025.
- Lei 15.270/2025: redução mensal do imposto para rendimentos até R$ 7.350,00.

## Observação

Esta calculadora é uma estimativa informativa. O cálculo real do holerite pode ter rubricas específicas, acordos coletivos, benefícios tributáveis, adicionais, faltas, horas extras, férias, 13º e outros detalhes.
