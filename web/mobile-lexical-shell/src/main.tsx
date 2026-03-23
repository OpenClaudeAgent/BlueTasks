import {createRoot} from 'react-dom/client';
import {StrictMode, useCallback, useEffect, useRef, useState} from 'react';
import {LexicalTaskEditor} from '@app/components/LexicalTaskEditor';
import {createEmptyEditorState, type EditorChangePayload} from '@app/lib/editorState';
import type {LexicalEditorLabels} from '@app/components/taskCard/lexicalEditorLabels';
import '@app/lexicalMobileShell.css';

const defaultLabels: LexicalEditorLabels = {
  bold: 'Bold',
  italic: 'Italic',
  heading: 'Heading',
  checklist: 'Checklist',
  bulletList: 'Bullet list',
  quote: 'Quote',
  code: 'Code',
  horizontalRule: 'Horizontal rule',
  insertTable: 'Insert table',
  addTableColumn: 'Add column',
  addTableRow: 'Add row',
  deleteTable: 'Delete table',
  deleteTableConfirm: 'Delete this table?',
  codeLanguage: 'Code language',
  richTextAriaLabel: 'Task notes',
};

type NativeCommand =
  | {
      type: 'setDocument';
      contentJson: string;
      placeholder?: string;
      labels?: Partial<LexicalEditorLabels>;
    }
  | {type: 'ping'};

type NativeToWeb = NativeCommand;

type WebToNative =
  | {
      type: 'change';
      json: string;
      plainText: string;
      checklistTotal: number;
      checklistCompleted: number;
    }
  | {type: 'ready'};

declare global {
  interface Window {
    BlueTasksLexicalBridge?: {postPayload: (json: string) => void};
    __BT_LEXICAL_RECEIVE__?: (json: string) => void;
  }
}

const DEBOUNCE_MS = 400;

function notifyNative(payload: WebToNative): void {
  try {
    if (window.BlueTasksLexicalBridge?.postPayload) {
      window.BlueTasksLexicalBridge.postPayload(JSON.stringify(payload));
      return;
    }
  } catch (e) {
    console.error('BlueTasksLexicalBridge.postPayload failed', e);
  }
  try {
    const w = window as unknown as {
      webkit?: {messageHandlers?: {blueTasksLexical?: {postMessage: (msg: unknown) => void}}};
    };
    w.webkit?.messageHandlers?.blueTasksLexical?.postMessage(JSON.stringify(payload));
  } catch (e2) {
    console.error('webkit.messageHandlers.blueTasksLexical failed', e2);
  }
}

function App() {
  const [value, setValue] = useState(() => createEmptyEditorState());
  const [placeholder, setPlaceholder] = useState('Notes');
  const [editorLabels, setEditorLabels] = useState<LexicalEditorLabels>(defaultLabels);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<string>('');

  const flushChange = useCallback((p: EditorChangePayload) => {
    const key = `${p.json}\0${p.checklistTotal}\0${p.checklistCompleted}`;
    if (key === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = key;
    notifyNative({
      type: 'change',
      json: p.json,
      plainText: p.plainText,
      checklistTotal: p.checklistTotal,
      checklistCompleted: p.checklistCompleted,
    });
  }, []);

  const onEditorChange = useCallback(
    (p: EditorChangePayload) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        flushChange(p);
      }, DEBOUNCE_MS);
    },
    [flushChange],
  );

  const applyCommand = useCallback((raw: string) => {
    let cmd: NativeToWeb;
    try {
      cmd = JSON.parse(raw) as NativeToWeb;
    } catch {
      return;
    }
    if (cmd.type === 'ping') {
      return;
    }
    if (cmd.type === 'setDocument') {
      const next =
        cmd.contentJson?.trim() && cmd.contentJson.trim().length > 0
          ? cmd.contentJson
          : createEmptyEditorState();
      setValue(next);
      if (cmd.placeholder) {
        setPlaceholder(cmd.placeholder);
      }
      if (cmd.labels) {
        setEditorLabels((prev) => ({...prev, ...cmd.labels}));
      }
    }
  }, []);

  useEffect(() => {
    window.__BT_LEXICAL_RECEIVE__ = (json: string) => {
      applyCommand(json);
    };
    notifyNative({type: 'ready'});
    return () => {
      delete window.__BT_LEXICAL_RECEIVE__;
    };
  }, [applyCommand]);

  return (
    <LexicalTaskEditor
      labels={editorLabels}
      onChange={onEditorChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
