# Backlog — Abril 2026

> Criado em: 2026-04-07
> Legenda: ✅ Feito | 🔄 Em andamento | ❌ Pendente

---

## PRIORIDADE 1 — Kanban / Temporizador de entrega

- [ ] ❌ **Horário na criação da OS** — salvar hora além da data em `data_criacao` (já é `DateTimeField`, só garantir que o frontend exibe hh:mm)
- [ ] ❌ **Prazo de entrega com hora** — campo `prazo_entrega` hoje é `DateField`; migrar para `DateTimeField` e atualizar frontend para input de data+hora
- [ ] ❌ **Temporizador no card do Kanban** — exibir "X h restantes" ou "X dias restantes" abaixo do prazo; mudar cor conforme urgência:
  - Verde → mais de 24h
  - Amarelo → entre 6h e 24h
  - Vermelho piscando → menos de 6h ou atrasado

---

## PRIORIDADE 2 — Edição de OS e Clientes

- [ ] ❌ **OSDetailsModal editável** — ao abrir detalhes da OS, habilitar edição dos campos (cliente, serviço, valores, prazo, status, foto); botão "Salvar" chama `PATCH /api/ordens-servico/{id}/`
- [ ] ❌ **Editar cliente** — botão "Editar" na listagem de clientes abre modal com os dados preenchidos para atualização
- [ ] ❌ **Excluir cliente** — botão "Excluir" (soft delete, marca `ativo=False`) com confirmação antes de remover

---

## PRIORIDADE 3 — WhatsApp

- [ ] ❌ **Envio de foto via WhatsApp** — ao criar OS com foto, o backend está caindo no path de "URL não pública" e enviando só texto; precisa gerar URL pública do Railway e chamar `enviar_imagem` corretamente
- [ ] ❌ **Espaçamento excessivo na mensagem** — `formatar_nota_whatsapp` em `whatsapp/views.py` tem linhas em branco duplas/triplas entre campos; reduzir para espaçamento simples

---

## PRIORIDADE 4 — Exportação e Relatórios

- [ ] ❌ **Exportar conta do cliente parceiro (PDF/Excel)** — na tela de Histórico, ao filtrar por um cliente, botão "Exportar conta" gera relatório só com as OS daquele cliente (nome, número, valor, status, data); PDF ou Excel
- [ ] ❌ **Export PDF geral** — backend retorna erro hardcoded "não implementado" em `ordens_servico/views.py:567`; implementar com `reportlab` ou `weasyprint`

---

## PRIORIDADE 5 — Faturamento / Saídas de Caixa

- [ ] ❌ **Registrar saída de caixa** — criar model `SaidaCaixa` (descrição, valor, data, categoria) com endpoint REST; frontend adiciona formulário na tela de Faturamento para lançar saídas
- [ ] ❌ **Exibir saídas no dashboard financeiro** — métricas de faturamento devem mostrar: Receita bruta, Total de saídas, Lucro líquido (receita - saídas); gráfico de 12 meses inclui linha de saídas

---

## Resumo de status

| Prioridade | Área | Total | Feitos | Pendentes |
|---|---|---|---|---|
| P1 | Kanban / Temporizador | 3 | 0 | 3 |
| P2 | Edição OS e Clientes | 3 | 0 | 3 |
| P3 | WhatsApp | 2 | 0 | 2 |
| P4 | Exportação | 2 | 0 | 2 |
| P5 | Faturamento / Saídas | 2 | 0 | 2 |
| **Total** | | **12** | **0** | **12** |
