const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  const data = await res.json();
  return data.reply || "Desculpa, nao consegui responder.";
}

export async function generateSummaryAI(pdfSource: string, subjectName?: string): Promise<string> {
  const body: any = { action: "summary", subjectName };
  if (pdfSource.startsWith("http")) body.pdfUrl = pdfSource;
  else body.pdfBase64 = pdfSource;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.summary || "Nao foi possivel gerar o resumo.";
}

export async function generateQuestionsAI(
  pdfSource: string,
  subjectName?: string
): Promise<{ question: string; options: string[]; correctAnswer: string; explanation: string }[]> {
  const body: any = { action: "questions", subjectName };
  if (pdfSource.startsWith("http")) body.pdfUrl = pdfSource;
  else body.pdfBase64 = pdfSource;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.questions || [];
}

export async function generateScheduleAI(
  pdfSource: string,
  subjectName?: string
): Promise<{ label: string; icon: string }[]> {
  const body: any = { action: "schedule", subjectName };
  if (pdfSource.startsWith("http")) body.pdfUrl = pdfSource;
  else body.pdfBase64 = pdfSource;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.steps || [];
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64 }),
  });
  const data = await res.json();
  return data.text || "";
}

export async function generateTopicQuiz(
  topic: string,
  subjectName?: string
): Promise<{ question: string; options: string[]; correctAnswer: string; explanation: string }[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, subjectName }),
  });
  const data = await res.json();
  return data.questions || [];
}
