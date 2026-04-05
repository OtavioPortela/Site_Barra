# Checklist — O que falta no projeto

> Última atualização: 2026-04-05
> Legenda: ✅ Feito | 🔄 Em andamento | ❌ Pendente

---

## PRIORIDADE 1 — Crítico / Core da aplicação

- [ ] ❌ **Envio via WhatsApp (substituir Twilio)** — trocar a integração atual por alternativa funcional (Z-API ou Evolution API)
- [ ] ❌ **Configurações da empresa** — criar model + endpoint no backend e conectar o frontend (campos Nome, CNPJ, Email, Telefone existem no front mas não salvam nada)
- [ ] ❌ **OSDetailsModal editável** — poder editar a OS, marcar entrega, upload de foto e trocar status direto pela modal (hoje é só leitura)

---

## PRIORIDADE 2 — Erros silenciosos no backend

- [ ] ❌ **`except: pass` em faturamento** — `faturamento/views.py` linhas 36 e 48, erros de parse de data engolidos sem log
- [ ] ❌ **`except: pass` em ordens_servico** — `ordens_servico/views.py` linhas 97, 104, 248, 255, mesma situação
- [ ] ❌ **`except: pass` em whatsapp** — `whatsapp/views.py` linhas 165, 271, 311, falhas do provider silenciadas

---

## PRIORIDADE 3 — Funcionalidades incompletas

- [ ] ❌ **Export PDF** — backend retorna erro hardcoded "ainda não implementado" (`ordens_servico/views.py:567`); Excel funciona mas PDF não
- [ ] ❌ **Débitos — reverter pagamento** — só é possível marcar como pago, sem opção de desfazer/reverter

---

## PRIORIDADE 4 — Qualidade de código

- [ ] ❌ **Remover console.logs** — `OSBoard.tsx` linhas 57-71, logs de debug com `eslint-disable` em produção
- [ ] ❌ **Corrigir import hack** — `NewOSModal.tsx` linha 8, usando `(apiModule as any).servicoService` para contornar problema de TypeScript
- [ ] ❌ **Remover modelo não utilizado** — `ItemOrdemServico` em `models.py:180` existe mas nunca é usado (sobra de design anterior)

---

## PRIORIDADE 5 — Melhorias e boas práticas

- [ ] ❌ **Validação de telefone no frontend** — `CreateClienteModal.tsx:162`, campo sem máscara/validação de formato
- [ ] ❌ **WhatsApp falha silenciosa se Twilio não configurado** — serviço apenas loga warning, deveria retornar erro claro ao usuário
- [ ] ❌ **Documentar variáveis obrigatórias vs opcionais** — separar claramente no `.env.backup` o que quebra a app e o que é opcional

---

## Resumo de status

| Prioridade | Total | Feitos | Pendentes |
|---|---|---|---|
| P1 — Crítico | 3 | 0 | 3 |
| P2 — Erros silenciosos | 3 | 0 | 3 |
| P3 — Incompleto | 2 | 0 | 2 |
| P4 — Qualidade | 3 | 0 | 3 |
| P5 — Melhorias | 3 | 0 | 3 |
| **Total** | **14** | **0** | **14** |
