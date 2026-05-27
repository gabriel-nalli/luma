# Prompt para Claude Code — PDFs + Animações de Conclusão (Luma)

Cole tudo abaixo da linha tracejada no Claude Code, com a raiz do repositório `luma-app/` aberta.

---

# Contexto do que já existe (NÃO recriar do zero)

Você está continuando o projeto **Luma** (app de estudos PWA para uma estudante de Psicologia). Antes de qualquer coisa, leia e respeite:

- `package.json` — stack atual: Next.js **16.2.6**, React 19, TypeScript, Tailwind v4, Framer Motion, canvas-confetti. **Não troque versões.** **Não adicione shadcn/ui** agora. **Não adicione Supabase** agora.
- `src/lib/store.ts` — hook `useStore()` com localStorage. Já tem tipos `Subject`, `StudyPlan`, `StudyPlanStep`, `Note`, `Question`, `Reminder`, `Achievement`, `AppState`. Persistência via `STORAGE_KEY = "luma_app_state"`. Checagem de achievements automática em `commit()`. Mantenha esse padrão (estado imutável + `commit`).
- `src/lib/mockData.ts` — `MOCK_STATE` é semeado no primeiro load.
- `src/app/globals.css` — tema usa CSS variables: `--accent-purple`, `--accent-pink`, `--glass-bg`, `--glass-border`, `--text-primary`, `--text-secondary`, `--success-gold`. **Use sempre essas variáveis**, nunca cores hardcoded.
- `src/components/ui/GlassCard.tsx` — card padrão com efeito glass. Use em listagens.
- `src/components/icons/` — família de ícones animados próprios (`AnimatedCheck`, `AnimatedStar`, `AnimatedHeart`, `AnimatedMedal`, `AnimatedBook`, `AnimatedLamp`, `AnimatedRocket`, `AnimatedSun`, `AnimatedMoon`, `ConfettiEffect`). Reutilize antes de criar ícones novos.
- `src/components/layout/BottomNav.tsx` — bottom nav já existente, mantida em todas as páginas.
- `src/app/materias/[id]/page.tsx` — página de detalhe da matéria, com tabs `Cronogramas | Notas | Questoes`. O confete já dispara em `handleToggleStep` quando o plano fica 100%, via `ConfettiEffect`.
- `src/app/page.tsx`, `src/app/materias/page.tsx`, `src/app/chat/page.tsx`, `src/app/caderno/page.tsx`, `src/app/agenda/page.tsx` — telas existentes.

Mantenha o **tom de voz** já presente (pt-BR carinhoso, sem jargão: "Mandou bem! ⭐", "Mais uma! 🌟", etc.).

Trabalhe **commit por feature** e, ao final, rode `npm run build` para garantir que compila.

---

# Escopo desta entrega

Duas partes:

1. **PDFs por matéria** — upload, listagem e visualização. Sem backend: armazenar localmente.
2. **Animações de conclusão que ainda não existem** — adicionar feedback visual nos eventos de "completude" que hoje passam em branco.

---

## Parte 1 — PDFs por matéria

### 1.1 Modelo de dados (em `src/lib/store.ts`)

Adicione o tipo e estenda `AppState`:

```ts
export interface PdfDoc {
  id: string;
  subjectId: string;
  name: string;          // nome original do arquivo
  sizeBytes: number;
  pageCount?: number;    // preenchido após render
  // Arquivo em si guardado como data URL para sobreviver ao reload no localStorage.
  // Em produção isso vai pro Supabase Storage; aqui é só o protótipo.
  dataUrl: string;       // "data:application/pdf;base64,..."
  uploadedAt: string;    // ISO
}

export interface AppState {
  // ...existentes
  pdfs: PdfDoc[];
}
```

Atualize:

- `DEFAULT_STATE` → `pdfs: []`
- `getState()` → garantir `parsed.pdfs ??= []` (forward compat para usuários que já têm state salvo).
- `useStore()` → expor:
  - `addPdf(pdf: Omit<PdfDoc, "id" | "uploadedAt">)`
  - `updatePdfPageCount(id: string, pageCount: number)`
  - `deletePdf(id: string)`
- `deleteSubject(id)` → também remover `pdfs` da matéria.

⚠️ **Limite de tamanho**: localStorage tem ~5 MB. No `addPdf`, se `sizeBytes > 4_500_000` (4.5 MB), rejeite com um `throw new Error("PDF acima de 4,5 MB...")`. Quem chamar trata o erro e mostra toast/inline.

### 1.2 Mock

Em `src/lib/mockData.ts` deixe `pdfs: []` (não tente embutir base64 nos mocks).

### 1.3 Componente de upload

Crie `src/components/pdf/PdfUploader.tsx`:

- Client component.
- Props: `{ subjectId: string }`.
- Aceita arquivos via `<input type="file" accept="application/pdf">` **e** via drag-and-drop (`onDragOver`, `onDrop`).
- Área grande, `rounded-2xl`, borda tracejada `var(--accent-purple)`, microcopy: **"Solte um PDF aqui ou toque para escolher"**. Altura mínima ~160px (touch-friendly em tablet).
- Ao receber arquivo: ler como data URL com `FileReader`, chamar `addPdf({ subjectId, name, sizeBytes, dataUrl })`.
- Estado interno: `idle | reading | error`. Durante `reading`, mostrar um pulse no card e a microcopy **"Lendo seu PDF..."**.
- Em erro (>4.5 MB ou MIME errado): inline message vermelha-suave usando `#F4845F`, **"Eita, esse aqui passou de 4,5 MB. Tenta um menor?"**.
- Em sucesso: pequena animação spring (scale 1 → 1.04 → 1) + microcopy **"Pronto! Subiu lindo."** por 1.5s.

### 1.4 Visualizador de PDF

**Não use** `react-pdf` nem `pdfjs-dist` (dependências pesadas e instáveis com Next 16). Use **`<iframe src={dataUrl}>`** + fallback `<embed>`. O Chrome/Safari renderiza PDFs nativamente, o que é suficiente para o protótipo no tablet.

Crie `src/components/pdf/PdfViewerModal.tsx`:

- Modal full-screen no mesmo padrão dos modais já existentes na página de matérias (`backdrop` com blur, painel central, `framer-motion` com spring stiffness 380 damping 28).
- Header com nome do arquivo, botão fechar (`X`), e botão "Compartilhar" que faz `navigator.share({ files: [...] })` quando disponível, fallback: `<a href={dataUrl} download={name}>`.
- Corpo: `<iframe>` ocupando 100% do espaço, `border: 0`, `rounded-xl`.
- `aria-label` no botão fechar, foco inicial nele.
- Esc fecha (use `useEffect` com `keydown`).

### 1.5 Nova tab "PDFs" na página da matéria

Em `src/app/materias/[id]/page.tsx`:

- Estenda o tipo `Tab` para `"Cronogramas" | "PDFs" | "Notas" | "Questoes"` e o array `tabs` na mesma ordem. **PDFs vai como segunda tab.**
- Conteúdo da tab:
  - Topo: `<PdfUploader subjectId={id} />`.
  - Grid de cards (1 col mobile, 2 cols `md:`) com cada PDF: ícone outline de documento, nome (truncate), `sizeKb` e data formatada em pt-BR (`new Intl.DateTimeFormat("pt-BR")`).
  - Tap no card → abre `PdfViewerModal`. Long press / hover ≥ 600ms → mostra menu com "Excluir" (confirmação inline, sem `confirm()` nativo).
  - Estado vazio: ilustração leve (use `AnimatedBook` size 56) + microcopy **"Nenhum PDF por aqui ainda — bora começar?"**.

Mantenha animações já usadas (`AnimatePresence` por tab, stagger de 0.04–0.06s nos items).

---

## Parte 2 — Animações de conclusão que faltam

Hoje só dispara confete quando um plano fica 100% e o `AnimatedCheck` anima o checkbox. Falta feedback em vários outros eventos. Adicione, com sutileza (200–400ms, `ease-out` ou spring suave). Não exagere — nada de confete em tudo.

### 2.1 Helper global de toast/celebração

Crie `src/components/feedback/Celebration.tsx`:

- Toast minimalista que aparece no topo (mobile) ou no canto sup. direito (md:+), `position: fixed`, `z-50`.
- API via hook:
  ```ts
  // src/lib/celebrate.tsx
  export function useCelebrate(): (msg: string, opts?: { icon?: "star"|"heart"|"medal"|"check"|"flame"; haptic?: boolean }) => void;
  ```
- Implementação simples: um `Provider` no `src/app/layout.tsx` que segura `useState<CelebrationItem[]>` e renderiza com `AnimatePresence`.
- Entrada: `y: -20 → 0`, `scale: 0.9 → 1`, spring. Auto-dismiss em 1.8s. Saída: `opacity → 0, y: -10`.
- Se `opts?.haptic !== false` e `"vibrate" in navigator`: `navigator.vibrate(10)`.
- Cor do ícone: `var(--accent-purple)` (padrão), `var(--success-gold)` para `medal/star`, `#FB7185` para `heart`, `#F59E0B` para `flame`.

### 2.2 Ganchos por evento

Use `useCelebrate()` nos lugares abaixo. **Não** dispare confete; reserve confete só para "fim de plano" (já existe).

| Evento | Onde | Mensagem | Ícone |
|---|---|---|---|
| Step de cronograma concluído (mas plano ainda não 100%) | `handleToggleStep` em `materias/[id]/page.tsx` | "Mais uma! 🌟" | `star` |
| Plano 100% | mesmo handler, complementando o confete | "Arrasou! Mandou bem demais." | `medal` |
| Questão respondida CORRETA | `handleSubmitAnswer` | "Acertou! 💜" | `heart` |
| Questão respondida ERRADA | mesmo | "Tudo certo, tenta de novo — erro também ensina." | `check` (sem haptic) |
| Nota criada | `handleAddNote` | "Nota salva 📝" | `check` |
| Matéria criada | `handleCreate` em `materias/page.tsx` | "Matéria nova no caderno ✨" | `star` |
| Lembrete marcado como feito | `toggleReminder` (chamada em `agenda/page.tsx`) | "Riscou da lista! ✅" | `check` |
| Upload de PDF concluído | callback de sucesso do `PdfUploader` | "PDF pronto pra estudar 📄" | `star` |
| Achievement desbloqueado | criar `useEffect` no `Provider` que compara `state.achievements` com o snapshot anterior e dispara para cada `unlockedAt` novo | "Conquista desbloqueada: {title}" | `medal` |

### 2.3 Animação extra do streak (chama)

No card de "Sequência de estudos" em `src/app/page.tsx`:

- Substitua o SVG estático de raio por um `AnimatedFlame` novo em `src/components/icons/AnimatedFlame.tsx`.
- A chama deve ter um leve `scaleY` 1 → 1.06 → 1 em loop infinito (`duration: 1.6s`, `ease: easeInOut`), e mudar de altura aparente conforme `currentStreak`:
  - 0–2 dias: tom apagado (`opacity: 0.45`)
  - 3–6 dias: `opacity: 0.75`
  - 7+ dias: `opacity: 1` + leve `filter: drop-shadow(0 0 6px rgba(251,191,36,0.5))`
- Quando o streak incrementa (compare via `useRef`), dispara `celebrate("Streak: {N} dias 🔥", { icon: "flame" })`.

### 2.4 Detalhes em animações já existentes

- `AnimatedCheck`: ao virar `active=true`, além do que já faz, emitir 4–6 partículas pequenas (`<motion.span>` absolutos com `background: var(--success-gold)`, `width: 4px`, `height: 4px`, `borderRadius: 9999`) que sobem e fadeout em 500ms (use `Math.cos/sin` para espalhar). Se já tiver isso, não duplicar.
- Cards de matéria em `materias/page.tsx`: ao hover, `scale: 1.02` + sombra mais pronunciada. Já tem `hoverable` no `GlassCard`; só confirmar que está com `whileHover={{ scale: 1.02 }}` e revisar a sombra.

### 2.5 Preferências do usuário

Em `src/lib/store.ts`, dentro do `AppState`, adicione:

```ts
preferences: {
  reduceMotion: boolean;     // default: respeitar matchMedia("(prefers-reduced-motion: reduce)")
  haptics: boolean;          // default: true
  sounds: boolean;           // default: false (placeholder; não toque áudio agora)
};
```

E faça `useCelebrate` respeitar `reduceMotion` (sem spring, só fade) e `haptics` (não vibrar). Crie no header da página `src/app/page.tsx` (ou em `agenda` se já houver settings) um pequeno bloco "Preferências" com toggles para esses três. Sons fica desabilitado com tag "em breve".

---

## Critérios de pronto

- Subir um PDF de exemplo (qualquer arquivo ≤ 4 MB) em uma matéria, vê-lo na lista, abrir o visualizador e fechar. Sobrevive a F5 (localStorage).
- Tentar subir um PDF > 4.5 MB mostra a microcopy de erro, sem quebrar.
- Marcar steps de um cronograma faz aparecer o toast "Mais uma! 🌟" e, no último, mantém o confete + toast "Arrasou!".
- Responder questão certa → toast "Acertou! 💜"; errada → toast neutro.
- Streak no card da home anima conforme o número de dias.
- `prefers-reduced-motion: reduce` no sistema desativa springs (mas o toast continua aparecendo, em fade).
- `npm run build` passa sem erros TS.

## Anti-objetivos (NÃO faça nesta entrega)

- Não adicionar Supabase, autenticação, ou backend.
- Não usar `pdfjs-dist`/`react-pdf` — fica para depois.
- Não chamar API da Anthropic ainda — geração de cronograma/questões via IA é a próxima entrega.
- Não trocar a stack (continua Next 16, Tailwind 4, sem shadcn).
- Não criar página de PDFs separada — eles vivem dentro da matéria.

## Estrutura final esperada de arquivos novos

```
src/
  components/
    pdf/
      PdfUploader.tsx
      PdfViewerModal.tsx
    feedback/
      Celebration.tsx
    icons/
      AnimatedFlame.tsx
  lib/
    celebrate.tsx     // hook + provider
```

E alterações em: `src/lib/store.ts`, `src/lib/mockData.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/materias/page.tsx`, `src/app/materias/[id]/page.tsx`, `src/components/icons/AnimatedCheck.tsx` (se faltarem as partículas).

---

Antes de codar, me liste rapidamente: (a) os arquivos novos que vai criar, (b) as funções a adicionar em `useStore`, e (c) onde vai injetar o `CelebrationProvider`. Depois segue.
