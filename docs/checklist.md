# Checklist — O que falta no projeto

> Última atualização: 2026-04-07
> Legenda: ✅ Feito | ❌ Pendente

---

## PRIORIDADE 1 — Crítico / Core da aplicação

- [x] ✅ **Envio via WhatsApp (substituir Twilio)** — Z-API integrada, pareada e funcionando em produção
- [x] ✅ **OSDetailsModal editável** — edição de OS, troca de status, upload de foto pela modal
- [x] ✅ **Configurações da empresa** — model `ConfiguracaoEmpresa` (singleton), endpoint PATCH `/api/faturamento/configuracao-empresa/`, frontend salva e carrega automaticamente

---

## PRIORIDADE 2 — Funcionalidades do backlog (concluídas)

- [x] ✅ **Editar/excluir clientes** — CRUD completo na página de Clientes
- [x] ✅ **Exportar conta do parceiro (Excel)** — botão por cliente em `/clientes`
- [x] ✅ **Excluir OS (admin)** — botão de lixeira disponível para `is_staff`
- [x] ✅ **Saídas de caixa** — model, CRUD endpoint, frontend com formulário e tabela; métricas de lucro líquido no dashboard de faturamento
- [x] ✅ **Temporizador no Kanban** — badge colorido no OSCard (verde/amarelo/vermelho) em horas/minutos; `prazo_entrega` migrado para `DateTimeField`

---

## PRIORIDADE 3 — Erros silenciosos no backend

- [x] ✅ **`except: pass` em faturamento** — substituído por `logger.warning` com detalhe do erro
- [x] ✅ **`except: pass` em ordens_servico** — já corrigido (possui `logger.warning`)
- [x] ✅ **`except: pass` em whatsapp** — substituído por `logger.warning(f"Não foi possível parsear resposta: {parse_err}")`

---

## PRIORIDADE 4 — Funcionalidades incompletas

- [x] ✅ **Export PDF** — implementado com `reportlab`; gera nota de débitos em PDF formatado
- [x] ✅ **Débitos — reverter pagamento** — action `reverter_pagamento` no backend; botão "Reverter" visível apenas para patrão no frontend

---

## PRIORIDADE 5 — Qualidade de código

- [x] ✅ **Remover console.logs** — removidos de `OSBoard.tsx`
- [x] ✅ **Corrigir import hack** — `servicoService` agora importado diretamente de `../../services/api` em `NewOSModal.tsx`
- [x] ✅ **Remover modelo não utilizado** — `ItemOrdemServico` removido de `models.py`, `serializers.py` e `admin.py`; migration de drop será aplicada no próximo deploy

---

## PRIORIDADE 6 — Melhorias e boas práticas

- [x] ✅ **Validação/máscara de telefone** — `CreateClienteModal.tsx` agora formata automaticamente `(XX) XXXXX-XXXX`
- [x] ✅ **WhatsApp erro claro** — erros de parse agora logados com `logger.warning`; respostas de erro 500 com mensagem descritiva já retornavam ao usuário
- [x] ✅ **Documentar variáveis de ambiente** — `.env.backup` atualizado com seções OBRIGATÓRIAS vs OPCIONAIS e descrição do impacto de cada variável

---

## Resumo de status

| Prioridade | Total | Feitos | Pendentes |
|---|---|---|---|
| P1 — Crítico | 3 | 3 | 0 |
| P2 — Backlog | 5 | 5 | 0 |
| P3 — Erros silenciosos | 3 | 3 | 0 |
| P4 — Incompleto | 2 | 2 | 0 |
| P5 — Qualidade | 3 | 3 | 0 |
| P6 — Melhorias | 3 | 3 | 0 |
| **Total** | **19** | **19** | **0** |
