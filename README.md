# Salário Líquido Hoje

Calculadora de salário líquido CLT feita só com HTML, CSS e JavaScript. A proposta é ser simples de publicar em GitHub Pages, Netlify, Vercel ou qualquer hospedagem estática.

## Stack

- HTML sem build step
- CSS próprio com [Pico CSS](https://picocss.com/) via CDN
- JavaScript puro

Escolhi o Pico CSS como framework minimalista porque ele é opinativo o suficiente para deixar formulários bonitos rapidamente, mas não exige Node, bundler, compilação ou configuração.

## O que a calculadora faz

- Calcula INSS progressivo para empregado CLT, empregado doméstico e trabalhador avulso.
- Calcula IRRF mensal com tabela vigente em 2026.
- Considera dependentes, pensão alimentícia judicial, previdência complementar/PGBL, plano de saúde descontado em folha, outros descontos e benefícios.
- Aplica o desconto simplificado mensal de R$ 607,20 quando ele for mais vantajoso, ou permite escolher manualmente.
- Aplica a redução da Lei 15.270/2025 para rendimentos mensais até R$ 7.350,00.

## Sobre plano de saúde e IRRF

Plano de saúde pago pelo contribuinte pode ser despesa médica dedutível na declaração anual do Imposto de Renda. Quando o plano é empresarial, a Receita Federal orienta que é necessário comprovar que o efetivo pagamento foi feito pelo titular ou por seus dependentes.

Para o cálculo mensal do IRRF em folha, porém, as deduções comuns são INSS, dependentes, pensão alimentícia judicial, previdência complementar em condições específicas e o desconto simplificado mensal. Por isso, nesta calculadora o plano de saúde reduz o salário líquido, mas não reduz a base mensal do IRRF.

## Sobre previdência complementar e PGBL

Contribuições para previdência complementar/PGBL podem ser usadas como dedução legal do Imposto de Renda, observadas as condições legais. Na declaração anual, a Receita Federal informa o limite de 12% dos rendimentos tributáveis.

Nesta calculadora, o campo `Previdência complementar / PGBL` reduz a base mensal do IRRF quando a opção de deduções legais for usada ou quando ela for mais vantajosa que o desconto simplificado mensal. O valor também reduz o salário líquido, porque representa desconto/aporte pago pelo trabalhador.

Para a simulação mensal, o limite dedutível estimado é calculado como 12% do salário bruto informado. Se o valor digitado passar desse limite, apenas a parcela estimada como dedutível reduz a base do IRRF; o valor integral continua reduzindo o salário líquido.

## Como rodar localmente

Como é um site estático, você pode abrir o arquivo `index.html` direto no navegador.

Se preferir servir por HTTP:

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

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie estes arquivos para a branch principal:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. No GitHub, abra `Settings`.
4. Entre em `Pages`.
5. Em `Build and deployment`, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Salve e aguarde o GitHub gerar a URL.

## Atualização das tabelas

As regras usadas estão concentradas no objeto `CONFIG`, no começo de `script.js`.

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
