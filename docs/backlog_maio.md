# Backlog — Maio 2026

> Criado em: 2026-04-08 | Última atualização: 2026-04-08
> Legenda: ✅ Feito | 🔄 Em andamento | ❌ Pendente

---

## PRIORIDADE 1 — Bugs críticos

### [BUG] Pendurar conta não funciona
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Quando o usuário escolhe "Adicionar à conta do parceiro" no modal de faturamento,
  o `faturar()` nunca é chamado — a OS fica no kanban ao invés de sair para os Débitos.
- **Causa raiz:** `ImprimirNotaModal.tsx` linha ~130 chama `onClose()` sem chamar `onConfirm()`
  quando `ehParceiro && adicionarAConta` é true. A forma de pagamento também é enviada como
  `undefined` (ignorada pelo JSON.stringify) então não altera nada no backend.
- **Correção:** Chamar `onConfirm()` antes de fechar quando pendurar é escolhido.

---

## PRIORIDADE 2 — Funcionalidades novas

### Caixa disponível para funcionário (sem acesso ao faturamento)
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Nova página `/caixa` acessível a todos os usuários. Funcionário registra entradas
  e saídas e vê apenas os próprios lançamentos. Admin vê tudo na tela de Faturamento com coluna
  "Registrado por". Campo `tipo` (entrada/saída) adicionado ao model `SaidaCaixa`.

### Cancelar OS com motivo
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Na edição de uma OS, adicionar botão "Cancelar OS" que exige preenchimento
  de um motivo de cancelamento antes de excluir. Restrito ao patrão (is_staff).
- **Detalhes:**
  - Modal de confirmação com campo de texto obrigatório "Motivo do cancelamento"
  - Registrar o motivo no campo `observacoes` da OS antes de deletar (para histórico)
  - Chamar `DELETE /api/ordens-servico/{id}/`

### Mensagem WhatsApp final com endereço da loja
- **Status:** ❌ Aguardando endereço
- **Descrição:** Incluir o endereço físico da loja na mensagem enviada ao cliente quando
  a OS é finalizada (`enviar-nota-os`).
- **Pendência:** Usuário precisa fornecer o endereço correto para incluir.

### Reformatar nota final (WhatsApp de OS finalizada)
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Melhorar a mensagem do WhatsApp de finalização (`enviar-nota-os`) para exibir:
  - Pagamento final (valor total)
  - Forma de pagamento registrada
  - Serviço realizado
  - Layout mais bonito/legível

### Observações na nota de impressão
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Incluir o campo `observacoes` da OS na impressão da nota (função
  `imprimirNota` / `formatarNotaTermica` em `printHelpers.ts`). Atualmente o campo
  existe no modelo mas não aparece na nota impressa.

### Enviar foto no WhatsApp de criação da OS
- **Status:** ✅ Feito (2026-04-08)
- **Descrição:** Quando a OS é criada e o WhatsApp de confirmação é enviado (`enviar-os-criada`),
  incluir a foto da OS se ela estiver disponível. O backend já tenta mas cai no fallback
  "URL não pública". Precisa gerar URL pública do Railway corretamente.
- **Detalhes backend:** `whatsapp/views.py` → `enviar_os_criada` — verificar
  `RAILWAY_PUBLIC_DOMAIN` e montar URL corretamente.

---

## Resumo de status

| Item | Área | Status |
|---|---|---|
| Bug: pendurar conta | Débitos / Kanban | ❌ Pendente |
| Caixa para funcionário | Caixa / Permissões | ✅ Feito |
| Cancelar OS com motivo | OS / Kanban | ❌ Pendente |
| Endereço na mensagem final | WhatsApp | ❌ Aguardando endereço |
| Reformatar nota final | WhatsApp | ❌ Pendente |
| Observações na impressão | Impressão | ❌ Pendente |
| Foto no WhatsApp de criação | WhatsApp | ❌ Pendente |

**Total: 6 feitos / 1 pendente (aguardando endereço da loja)**
