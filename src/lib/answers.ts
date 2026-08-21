// Helpers de correcao de questoes. A IA as vezes devolve a resposta certa como
// "A", "A)", "Alternativa B" ou so o texto sem a letra; aqui normalizamos para
// que a resposta correta seja SEMPRE uma das alternativas exibidas.

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const stripLetter = (s: string) => norm(s).replace(/^(?:alternativa\s*)?[a-e]\s*[\)\.\:\-]\s*/, "");

export function resolveCorrectAnswer(options: string[] | undefined | null, correct: string): string {
  if (!options || options.length === 0) return correct;
  const c = norm(correct);
  if (!c) return correct;

  const exact = options.find((o) => norm(o) === c);
  if (exact) return exact;

  // So a letra: "a", "A)", "b.", "Alternativa C", "letra d"
  const letter = c.match(/^(?:alternativa|letra)?\s*([a-e])\s*[\)\.\:\-]?\s*$/)?.[1];
  if (letter) {
    const byLetter = options.find((o) => /^[a-e]\s*[\)\.\:\-]/.test(norm(o)) && norm(o)[0] === letter);
    if (byLetter) return byLetter;
    const idx = letter.charCodeAt(0) - 97;
    if (options[idx]) return options[idx];
  }

  // Mesmo texto, com ou sem o prefixo da letra
  const cText = stripLetter(correct);
  const byText = options.find((o) => stripLetter(o) === cText)
    || options.find((o) => cText.length > 3 && (stripLetter(o).includes(cText) || cText.includes(stripLetter(o))));
  return byText ?? correct;
}

export function isAnswerCorrect(q: { options?: string[] | null; correctAnswer: string }, answer: string): boolean {
  return norm(answer) === norm(resolveCorrectAnswer(q.options, q.correctAnswer));
}
