import type { AppState } from "@/lib/store";
import { DEFAULT_ACHIEVEMENTS } from "@/lib/store";

// ─── Subjects ─────────────────────────────────────────────────────────────────

const SUBJECT_ABA = {
  id: "sub_aba",
  name: "Analise de Comportamento",
  color: "#7C6AF7",
  icon: "brain",
  createdAt: "2026-05-01T08:00:00.000Z",
};

const SUBJECT_METODOLOGIA = {
  id: "sub_met",
  name: "Metodologia da Pesquisa",
  color: "#F76A6A",
  icon: "flask",
  createdAt: "2026-05-01T08:05:00.000Z",
};

const SUBJECT_PSICO_DEV = {
  id: "sub_psdev",
  name: "Psicologia do Desenvolvimento",
  color: "#3EC9A7",
  icon: "book",
  createdAt: "2026-05-01T08:10:00.000Z",
};

// ─── Study Plan ───────────────────────────────────────────────────────────────

const STUDY_PLAN_ABA = {
  id: "plan_aba_01",
  subjectId: "sub_aba",
  title: "Introducao ao Behaviorismo",
  steps: [
    {
      id: "step_01",
      label: "Ler capitulo 1: Fundamentos do Behaviorismo",
      icon: "read",
      completed: false,
    },
    {
      id: "step_02",
      label: "Fazer resumo dos conceitos principais",
      icon: "write",
      completed: false,
    },
    {
      id: "step_03",
      label: "Responder questoes de fixacao",
      icon: "question",
      completed: false,
    },
    {
      id: "step_04",
      label: "Revisar anotacoes e mapa mental",
      icon: "review",
      completed: false,
    },
    {
      id: "step_05",
      label: "Simulado final do capitulo",
      icon: "final",
      completed: false,
    },
  ],
  createdAt: "2026-05-10T09:00:00.000Z",
};

// ─── Notes ────────────────────────────────────────────────────────────────────

const NOTES = [
  {
    id: "note_01",
    subjectId: "sub_aba",
    title: "Conceitos de Reforco e Punicao",
    content: `<p>O reforco positivo ocorre quando um estimulo agradavel e adicionado apos uma resposta, aumentando a probabilidade de que ela se repita.</p>
<p>O reforco negativo ocorre quando um estimulo aversivo e removido apos uma resposta, tambem aumentando a probabilidade da resposta.</p>
<p>A punicao, ao contrario, diminui a frequencia de uma resposta — podendo ser positiva (adicao de aversivo) ou negativa (remocao de algo agradavel).</p>`,
    createdAt: "2026-05-12T10:00:00.000Z",
    updatedAt: "2026-05-14T15:30:00.000Z",
  },
  {
    id: "note_02",
    subjectId: "sub_met",
    title: "Tipos de Pesquisa",
    content: `<p><strong>Pesquisa quantitativa:</strong> baseia-se em dados numericos e analise estatistica.</p>
<p><strong>Pesquisa qualitativa:</strong> explora fenomenos subjetivos por meio de entrevistas, observacoes e analise de discurso.</p>
<p><strong>Pesquisa mista:</strong> combina ambas as abordagens para uma visao mais abrangente do fenomeno estudado.</p>`,
    createdAt: "2026-05-15T11:00:00.000Z",
    updatedAt: "2026-05-15T11:00:00.000Z",
  },
];

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "q_01",
    subjectId: "sub_aba",
    studyPlanId: "plan_aba_01",
    question:
      "O que e reforco positivo na Analise do Comportamento Aplicada (ABA)?",
    options: [
      "Remocao de um estimulo aversivo apos a resposta",
      "Adicao de um estimulo agradavel apos a resposta",
      "Punicao de um comportamento indesejado",
      "Extincao de um comportamento pelo nao-reforco",
    ],
    correctAnswer: "Adicao de um estimulo agradavel apos a resposta",
    explanation:
      "O reforco positivo envolve a apresentacao de um estimulo apetitivo imediatamente apos a ocorrencia de uma resposta, o que aumenta a probabilidade futura dessa resposta.",
  },
  {
    id: "q_02",
    subjectId: "sub_aba",
    studyPlanId: "plan_aba_01",
    question: "Qual e a diferenca entre reforco negativo e punicao negativa?",
    options: [
      "Nao ha diferenca; ambos reduzem o comportamento",
      "Reforco negativo aumenta o comportamento; punicao negativa diminui",
      "Reforco negativo diminui o comportamento; punicao negativa aumenta",
      "Ambos aumentam o comportamento em contextos diferentes",
    ],
    correctAnswer:
      "Reforco negativo aumenta o comportamento; punicao negativa diminui",
    explanation:
      "O reforco negativo fortalece o comportamento pela remocao de um estimulo aversivo. A punicao negativa enfraquece o comportamento pela remocao de um estimulo apetitivo.",
  },
  {
    id: "q_03",
    subjectId: "sub_aba",
    question: "O que e condicionamento operante, segundo Skinner?",
    options: [
      "Aprendizagem por associacao entre dois estimulos",
      "Aprendizagem moldada pelas consequencias do comportamento",
      "Processo de imitacao de modelos sociais",
      "Resposta reflexa a estimulos incondicionados",
    ],
    correctAnswer:
      "Aprendizagem moldada pelas consequencias do comportamento",
    explanation:
      "Skinner propoe que o comportamento e controlado por suas consequencias: respostas seguidas de reforco tendem a se repetir, enquanto respostas seguidas de punicao tendem a diminuir.",
  },
  {
    id: "q_04",
    subjectId: "sub_aba",
    question: "O que e extincao no contexto do condicionamento operante?",
    options: [
      "Apresentacao de um estimulo aversivo",
      "Remocao do reforco que mantinha o comportamento",
      "Generalizacao do estimulo para novos contextos",
      "Apresentacao de um novo reforco alternativo",
    ],
    correctAnswer: "Remocao do reforco que mantinha o comportamento",
    explanation:
      "A extincao ocorre quando o reforco que antes mantinha um comportamento deixa de ser apresentado, levando gradualmente a reducao ou eliminacao desse comportamento.",
  },
  {
    id: "q_05",
    subjectId: "sub_aba",
    question:
      "Qual procedimento e utilizado para ensinar comportamentos complexos dividindo-os em etapas menores?",
    options: [
      "Extincao",
      "Generalizacao",
      "Modelagem (shaping)",
      "Discriminacao de estimulos",
    ],
    correctAnswer: "Modelagem (shaping)",
    explanation:
      "A modelagem consiste em reforcar aproximacoes sucessivas ao comportamento-alvo, partindo de respostas ja presentes no repertorio do individuo e avancando progressivamente ate o comportamento desejado.",
  },
];

// ─── Reminders ────────────────────────────────────────────────────────────────

// Dates relative to 2026-05-26 (today)
const REMINDERS = [
  {
    id: "rem_01",
    subjectId: "sub_aba",
    title: "Estudar Capitulo 2: Condicionamento Operante",
    date: "2026-05-27T18:00:00.000Z",
    done: false,
    notify3d: true, notify1d: true, notifyMorning: true, notifyBefore: true,
  },
  {
    id: "rem_02",
    subjectId: "sub_met",
    title: "Entregar esboço do projeto de pesquisa",
    date: "2026-05-28T23:59:00.000Z",
    done: false,
    notify3d: true, notify1d: true, notifyMorning: true, notifyBefore: true,
  },
  {
    id: "rem_03",
    subjectId: "sub_psdev",
    title: "Revisar teorias de Piaget e Vygotsky",
    date: "2026-05-30T10:00:00.000Z",
    done: false,
    notify3d: true, notify1d: true, notifyMorning: true, notifyBefore: true,
  },
];

// ─── Assembled Mock State ─────────────────────────────────────────────────────

export const MOCK_STATE: AppState = {
  subjects: [SUBJECT_ABA, SUBJECT_METODOLOGIA, SUBJECT_PSICO_DEV],
  studyPlans: [STUDY_PLAN_ABA],
  notes: NOTES,
  questions: QUESTIONS,
  achievements: DEFAULT_ACHIEVEMENTS,
  reminders: REMINDERS,
  slides: [],
  streak: { current: 0, lastStudyDate: "" },
};
