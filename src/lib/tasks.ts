import type { TaskType } from "./pricing";

export interface TaskMeta {
  id: TaskType;
  label: string;
  glyph: string;
  desc: string;
}

export const TASKS: TaskMeta[] = [
  { id: "TEXT_GENERATION", label: "Text generation", glyph: "T", desc: "Prompt → text output" },
  { id: "SUMMARIZATION", label: "Summarization", glyph: "S", desc: "Long text → summary" },
  { id: "EMBEDDING", label: "Embedding", glyph: "E", desc: "Text → vector" },
  { id: "CLASSIFICATION", label: "Classification", glyph: "C", desc: "Input → label + confidence" },
  { id: "CODE_REVIEW", label: "Code review", glyph: "{ }", desc: "Code snippet → review" },
];

export const MODELS = [
  "llama3.1:8b",
  "llama3.1:70b",
  "mistral:7b",
  "qwen2.5:14b",
  "deepseek-coder:6.7b",
];

export function taskLabel(id: string): string {
  return TASKS.find((t) => t.id === id)?.label ?? id;
}
