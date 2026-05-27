import * as pdfjsLib from "pdfjs-dist";
import type { Question, StudyPlanStep } from "./store";
import { generateId } from "./store";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPdf(dataUrl: string): Promise<string> {
  const data = atob(dataUrl.split(",")[1]);
  const uint8 = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    uint8[i] = data.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    texts.push(`[Slide ${i}] ${pageText}`);
  }

  return texts.join("\n\n");
}

export function generateSummaryFromText(text: string): string {
  const slides = text.split(/\[Slide \d+\]/).filter((s) => s.trim());
  const topics = slides
    .map((s) => {
      const words = s.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return null;
      return words.slice(0, 15).join(" ") + (words.length > 15 ? "..." : "");
    })
    .filter(Boolean);

  if (topics.length === 0) {
    return "Nao foi possivel extrair conteudo suficiente do PDF para gerar um resumo.";
  }

  let summary = "Resumo dos Slides:\n\n";
  topics.forEach((topic, i) => {
    summary += `${i + 1}. ${topic}\n`;
  });
  summary += `\nTotal de slides analisados: ${topics.length}`;
  summary += `\nPalavras totais: ${text.split(/\s+/).length}`;

  return summary;
}

export function generateQuestionsFromText(
  text: string,
  subjectId: string
): Question[] {
  const slides = text.split(/\[Slide \d+\]/).filter((s) => s.trim());
  const questions: Question[] = [];

  const keyPhrases = slides
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 5);

  keyPhrases.slice(0, 5).forEach((phrase, i) => {
    const words = phrase.split(/\s+/).filter(Boolean);
    const keyWord = words.find((w) => w.length > 4) || words[0] || "conceito";
    const context = words.slice(0, 20).join(" ");

    questions.push({
      id: generateId(),
      subjectId,
      question: `Com base no slide ${i + 1}, qual o significado ou importancia de "${keyWord}"?`,
      options: [
        `E o conceito principal abordado: ${context.slice(0, 40)}...`,
        `E um termo secundario sem relevancia direta`,
        `Refere-se a uma excecao da regra geral`,
        `Nenhuma das alternativas`,
      ],
      correctAnswer: `E o conceito principal abordado: ${context.slice(0, 40)}...`,
      explanation: `Este conceito aparece no contexto: "${context}"`,
    });
  });

  if (questions.length === 0) {
    questions.push({
      id: generateId(),
      subjectId,
      question:
        "Quais sao os principais topicos abordados nestes slides?",
      correctAnswer: "Revisao geral do conteudo",
      explanation:
        "Revise os slides para identificar os topicos principais.",
      options: [
        "Revisao geral do conteudo",
        "Apenas introducao",
        "Somente exercicios",
        "Nenhum topico relevante",
      ],
    });
  }

  return questions;
}

export function generateScheduleFromText(text: string): StudyPlanStep[] {
  const slides = text.split(/\[Slide \d+\]/).filter((s) => s.trim());
  const totalSlides = slides.length;

  if (totalSlides === 0) {
    return [
      { id: generateId(), label: "Ler o material", icon: "read", completed: false },
      { id: generateId(), label: "Fazer anotacoes", icon: "write", completed: false },
      { id: generateId(), label: "Revisar", icon: "review", completed: false },
    ];
  }

  const steps: StudyPlanStep[] = [];

  // Split slides into study sessions
  const slidesPerSession = Math.max(1, Math.ceil(totalSlides / 3));
  for (let i = 0; i < totalSlides; i += slidesPerSession) {
    const end = Math.min(i + slidesPerSession, totalSlides);
    steps.push({
      id: generateId(),
      label: `Estudar slides ${i + 1}-${end}`,
      icon: "read",
      completed: false,
    });
  }

  steps.push(
    { id: generateId(), label: "Fazer resumo do conteudo", icon: "write", completed: false },
    { id: generateId(), label: "Responder questoes geradas", icon: "question", completed: false },
    { id: generateId(), label: "Revisao final", icon: "review", completed: false }
  );

  return steps;
}
