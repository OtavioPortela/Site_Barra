# Backlog — Maio 2026

> Criado em: 2026-04-08 | Última atualização: 2026-04-09
> Legenda: ✅ Feito | 🔄 Em andamento | ❌ Pendente

---

## PRIORIDADE 1 — Bugs críticos

### [BUG] Pendurar conta não funciona
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Quando o usuário escolhe "Adicionar à conta do parceiro" no modal de faturamento,
  o `faturar()` nunca era chamado — a OS ficava no kanban ao invés de sair para os Débitos.
- **Causa raiz:** `ImprimirNotaModal.tsx` chamava `onClose()` sem chamar `onConfirm()`
  quando `ehParceiro && adicionarAConta` era true.
- **Correção:** Adicionado `await onConfirm()` antes de `onClose()` no bloco de pendurar conta.

---

## PRIORIDADE 2 — Funcionalidades novas

### Caixa disponível para funcionário (sem acesso ao faturamento)
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Nova página `/caixa` acessível a todos os usuários autenticados.
  Funcionário registra entradas e saídas e vê apenas os próprios lançamentos.
  Admin vê tudo na tela de Faturamento com coluna "Registrado por".
- **Detalhes:**
  - Model `SaidaCaixa` recebeu campo `tipo` (entrada/saída) e FK `criado_por`
  - `SaidaCaixaViewSet` filtra por `criado_por` para não-staff
  - Página `Caixa.tsx` com toggle entrada/saída, cards de resumo e CRUD
  - Sidebar com link para `/caixa` sem `requiresStaff`

### Cancelar OS com motivo
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Na edição de uma OS, botão "Cancelar OS" (restrito ao patrão) que exige
  preenchimento de motivo antes de excluir.
- **Detalhes:**
  - Modal de confirmação com textarea obrigatório
  - Motivo salvo em `observacoes` como `[CANCELADA] Motivo: ...` antes de deletar
  - Chama `DELETE /api/ordens-servico/{id}/`
  - Visível apenas para `is_staff` e OS não faturada

### Mensagem WhatsApp final com endereço da loja
- **Status:** ✅ Feito (2026-04-09)
- **Descrição:** Endereço da loja incluído na mensagem de finalização (`enviar-nota-os`).
- **Endereço:** R. Curitiba, 705 - Centro, Belo Horizonte - MG, 30170-120

### Reformatar nota final (WhatsApp de OS finalizada)
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Mensagem do WhatsApp de finalização (`enviar-nota-os`) reformatada para exibir:
  - Serviço realizado
  - Valor total formatado (R$ X.XXX,XX)
  - Forma de pagamento
  - Separadores ━━━ para visual mais limpo
  - Link do Google Maps e Instagram no rodapé

### Observações na nota de impressão
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Campo `observacoes` da OS incluído na impressão da nota.
  Adicionada seção `OBSERVACOES` em `formatarNotaTermica` (`printHelpers.ts`).

### Enviar foto no WhatsApp de criação da OS
- **Status:** ✅ Feito (2026-04-09)
- **Descrição:** WhatsApp de criação da OS (`enviar-os-criada`) envia a foto se disponível.
- **Solução:** Lê o arquivo diretamente do disco e codifica em base64 — sem depender de URL pública.
  Se o envio da imagem falhar, cai no fallback de envio de texto.
- **Validado em produção:** 2026-04-09 — mensagem recebida com sucesso.

---

## PRIORIDADE 3 — Infra / Deploy

### Integração WhatsApp Z-API
- **Status:** ✅ Estável (2026-04-09)
- **Descrição:** Migração de Twilio para Z-API concluída. Instância conectada, assinatura PAGA.
- **Problema encontrado:** Assinatura Z-API havia expirado em produção, causando erro 400
  `"To continue sending a message, you must subscribe to this instance again"` nos logs.
  Após renovação da assinatura, envios de texto e imagem funcionam normalmente.
- **Variáveis de ambiente (Railway):**
  - `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`

### Migrations aplicadas em produção
- **Status:** ✅ Feito (2026-04-08)
- **Detalhes:**
  - `faturamento/0002` — campos `tipo` e `criado_por` em `SaidaCaixa`
  - `faturamento/0003` — verbose_name e BigAutoField
  - `ordens_servico/0012` — `prazo_entrega` para DateTimeField, remoção de `ItemOrdemServico`

---

## Resumo de status

| Item | Área | Status |
|---|---|---|
| Bug: pendurar conta | Débitos / Kanban | ✅ Feito |
| Caixa para funcionário | Caixa / Permissões | ✅ Feito |
| Cancelar OS com motivo | OS / Kanban | ✅ Feito |
| Endereço na mensagem final | WhatsApp | ✅ Feito |
| Reformatar nota final | WhatsApp | ✅ Feito |
| Observações na impressão | Impressão | ✅ Feito |
| Foto no WhatsApp de criação | WhatsApp | ✅ Feito |
| Z-API estável em produção | Infra | ✅ Feito |

**Total: 8 feitos / 0 pendentes — backlog maio concluído ✅**
