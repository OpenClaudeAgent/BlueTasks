import {DEFAULT_CODE_LANGUAGE} from '@lexical/code';
import type {LexicalEditor} from 'lexical';
import {
  getCodeLanguageOptions,
  normalizeCodeLanguage,
  registerCodeHighlighting,
  ShikiTokenizer,
  type Tokenizer,
} from '@lexical/code-shiki';

/** Dark theme aligned with `.editor__codeBlock`; shared by LexicalTaskEditor and tests. */
export const taskEditorShikiTokenizer: Tokenizer = {
  ...ShikiTokenizer,
  defaultTheme: 'github-dark',
};

export function registerTaskEditorCodeHighlighting(editor: LexicalEditor): () => void {
  return registerCodeHighlighting(editor, taskEditorShikiTokenizer);
}

/**
 * Shiki ids we surface in the task editor — order = toolbar dropdown order.
 * Exported so tests can assert stable ordering vs {@link getTaskEditorCodeLanguageOptions}.
 */
export const TASK_EDITOR_CODE_LANGUAGE_IDS = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'json',
  'python',
  'html',
  'css',
  'scss',
  'shellscript',
  'powershell',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'sql',
  'yaml',
  'markdown',
  'xml',
  'diff',
  'docker',
] as const;

export type TaskEditorCodeLanguageOption = {id: string; label: string};

/** Curated languages for the task editor toolbar (avoids listing all 200+ Shiki grammars). */
export function getTaskEditorCodeLanguageOptions(): TaskEditorCodeLanguageOption[] {
  const byId = new Map(getCodeLanguageOptions());
  const out: TaskEditorCodeLanguageOption[] = [];
  for (const id of TASK_EDITOR_CODE_LANGUAGE_IDS) {
    const label = byId.get(id);
    if (label !== undefined) {
      out.push({id, label});
    }
  }
  return out;
}

/** Same rules as the toolbar listener: empty/whitespace → Lexical default, else Shiki-normalized id. */
export function resolveTaskEditorCodeLanguageValue(raw: string | undefined | null): string {
  return raw !== undefined && raw !== null && String(raw).trim() !== ''
    ? normalizeCodeLanguage(String(raw))
    : DEFAULT_CODE_LANGUAGE;
}

export {normalizeCodeLanguage};
