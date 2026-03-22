import type {TFunction} from 'i18next';

export type LexicalEditorLabels = {
  bold: string;
  italic: string;
  heading: string;
  checklist: string;
  bulletList: string;
  quote: string;
  code: string;
  horizontalRule: string;
  insertTable: string;
  addTableColumn: string;
  addTableRow: string;
  deleteTable: string;
  deleteTableConfirm: string;
  codeLanguage: string;
};

export function buildLexicalEditorLabels(t: TFunction): LexicalEditorLabels {
  return {
    bold: t('editor.bold'),
    italic: t('editor.italic'),
    heading: t('editor.heading'),
    checklist: t('editor.checklist'),
    bulletList: t('editor.bulletList'),
    quote: t('editor.quote'),
    code: t('editor.code'),
    horizontalRule: t('editor.horizontalRule'),
    insertTable: t('editor.insertTable'),
    addTableColumn: t('editor.addTableColumn'),
    addTableRow: t('editor.addTableRow'),
    deleteTable: t('editor.deleteTable'),
    deleteTableConfirm: t('editor.deleteTableConfirm'),
    codeLanguage: t('editor.codeLanguage'),
  };
}
