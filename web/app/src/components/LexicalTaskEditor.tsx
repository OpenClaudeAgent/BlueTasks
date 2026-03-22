import {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import type {MutableRefObject, ReactNode} from 'react';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
} from 'lexical';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {AutoLinkPlugin} from '@lexical/react/LexicalAutoLinkPlugin';
import {ClickableLinkPlugin} from '@lexical/react/LexicalClickableLinkPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import {HorizontalRulePlugin} from '@lexical/react/LexicalHorizontalRulePlugin';
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode} from '@lexical/rich-text';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {CodeNode, $createCodeNode} from '@lexical/code';
import {$setBlocksType} from '@lexical/selection';
import {TRANSFORMERS} from '@lexical/markdown';
import {LEXICAL_AUTO_LINK_MATCHERS} from '../lib/lexicalAutoLinkMatchers';
import {MARKDOWN_HORIZONTAL_RULE} from '../lib/lexicalMarkdownHorizontalRule';
import {
  INSERT_TABLE_COMMAND,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {$findMatchingParent} from '@lexical/utils';
import {
  Bold,
  Code2,
  Columns3,
  Heading1,
  Italic,
  List,
  ListChecks,
  MessageSquareQuote,
  Minus,
  Rows3,
  Table,
  Trash2,
} from 'lucide-react';
import {
  extractChecklistStats,
  lexicalDocsContentEqual,
  summarizeText,
  type EditorChangePayload,
} from '../lib/editorState';
import {registerCheckListAtomicCatchUp} from '../lib/lexicalCheckListAtomicCatchUp';
import {registerCheckListRichEmptyParagraphExit} from '../lib/lexicalCheckListRichEmptyParagraphExit';
import {registerParagraphLeadingTabCoalesce} from '../lib/lexicalParagraphLeadingTabCoalesce';
import {CHECK_LIST_FLAT_TABS} from '../lib/lexicalMarkdownCheckListFlatTabs';
import {registerTaskEditorTabCommands} from '../lib/lexicalTaskEditorTabCommands';
import {TaskImageNode} from '../lib/lexicalTaskImageNode';
import {registerTaskImagePaste} from '../lib/lexicalTaskImagePaste';

const MARKDOWN_TRANSFORMERS = [CHECK_LIST_FLAT_TABS, MARKDOWN_HORIZONTAL_RULE, ...TRANSFORMERS];

type Props = {
  value: string;
  placeholder: string;
  onChange: (payload: EditorChangePayload) => void;
  labels: {
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
  };
};

const theme = {
  paragraph: 'editor__paragraph',
  quote: 'editor__quote',
  heading: {
    h1: 'editor__heading editor__heading--h1',
    h2: 'editor__heading editor__heading--h2',
    h3: 'editor__heading editor__heading--h3',
  },
  list: {
    ol: 'editor__list editor__list--ordered',
    ul: 'editor__list editor__list--unordered',
    checklist: 'editor__list editor__list--check',
    listitem: 'editor__listItem',
    listitemChecked: 'editor__listItem editor__listItem--checked',
    listitemUnchecked: 'editor__listItem editor__listItem--unchecked',
    nested: {
      list: 'editor__list--nestedSublist',
      listitem: 'editor__listItem--nested',
    },
  },
  link: 'editor__links',
  text: {
    bold: 'editor__text--bold',
    italic: 'editor__text--italic',
    code: 'editor__text--code',
  },
  tab: 'editor__tab',
  code: 'editor__codeBlock',
  hr: 'editor__horizontalRule',
  hrSelected: 'editor__horizontalRule--selected',
  image: 'editor__imageWrap',
  table: 'editor__table',
  tableCell: 'editor__tableCell',
  tableCellHeader: 'editor__tableCellHeader',
  tableRow: 'editor__tableRow',
};

export function LexicalTaskEditor({value, placeholder, onChange, labels}: Props) {
  const editorValueRef = useRef<string | null>(null);

  const initialConfig = useMemo(
    () => ({
      namespace: 'BlueTasksTaskEditor',
      theme,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        HorizontalRuleNode,
        TaskImageNode,
        TableNode,
        TableRowNode,
        TableCellNode,
      ],
      onError(error: Error) {
        console.error(error);
      },
    }),
    [],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor">
        <ToolbarPlugin labels={labels} />
        <div className="editor__surface">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor__input" />}
            placeholder={<div className="editor__placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <TaskImagePastePlugin />
          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
          <CheckListAtomicCatchUpPlugin />
          <CheckListRichEmptyParagraphExitPlugin />
          <LinkPlugin />
          <ClickableLinkPlugin newTab />
          <AutoLinkPlugin matchers={LEXICAL_AUTO_LINK_MATCHERS} />
          <TablePlugin hasCellMerge hasTabHandler />
          <CoalesceLeadingTabInParagraphPlugin />
          <InsertTabAsTextPlugin />
          <HorizontalRulePlugin />
          <TabIndentationPlugin />
          <EditorSyncPlugin editorValueRef={editorValueRef} value={value} />
          <EditorChangePlugin editorValueRef={editorValueRef} onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}

function CoalesceLeadingTabInParagraphPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerParagraphLeadingTabCoalesce(editor), [editor]);

  return null;
}

function TaskImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerTaskImagePaste(editor), [editor]);

  return null;
}

function CheckListAtomicCatchUpPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCheckListAtomicCatchUp(editor), [editor]);

  return null;
}

function CheckListRichEmptyParagraphExitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCheckListRichEmptyParagraphExit(editor), [editor]);

  return null;
}

function InsertTabAsTextPlugin() {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => registerTaskEditorTabCommands(editor), [editor]);

  return null;
}

/** Toolbar clicks must not steal focus from the contenteditable, or Lexical loses RangeSelection and commands no-op. */
function runToolbarAction(editor: LexicalEditor, fn: () => void) {
  editor.focus(() => {
    fn();
  });
}

function ToolbarPlugin({labels}: Pick<Props, 'labels'>) {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="editor__toolbar">
      <ToolbarButton
        label={labels.bold}
        onClick={() => runToolbarAction(editor, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'))}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.italic}
        onClick={() => runToolbarAction(editor, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'))}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.heading}
        onClick={() =>
          runToolbarAction(editor, () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h1'));
              }
            }),
          )
        }
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.checklist}
        onClick={() => runToolbarAction(editor, () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined))}
      >
        <ListChecks size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.bulletList}
        onClick={() => runToolbarAction(editor, () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined))}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.quote}
        onClick={() =>
          runToolbarAction(editor, () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
              }
            }),
          )
        }
      >
        <MessageSquareQuote size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.code}
        onClick={() =>
          runToolbarAction(editor, () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createCodeNode());
              }
            }),
          )
        }
      >
        <Code2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.horizontalRule}
        onClick={() => runToolbarAction(editor, () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined))}
      >
        <Minus size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.insertTable}
        onClick={() =>
          runToolbarAction(editor, () =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              columns: '2',
              rows: '2',
            }),
          )
        }
      >
        <Table size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.addTableColumn}
        onClick={() =>
          runToolbarAction(editor, () => {
            editor.update(() => {
              $insertTableColumnAtSelection(true);
            });
          })
        }
      >
        <Columns3 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.addTableRow}
        onClick={() =>
          runToolbarAction(editor, () => {
            editor.update(() => {
              $insertTableRowAtSelection(true);
            });
          })
        }
      >
        <Rows3 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label={labels.deleteTable}
        onClick={() => {
          if (!window.confirm(labels.deleteTableConfirm)) {
            return;
          }
          runToolbarAction(editor, () =>
            editor.update(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return;
              const anchorNode = selection.anchor.getNode();
              const tableNode = $findMatchingParent(anchorNode, $isTableNode);
              if (tableNode) {
                const paragraph = $createParagraphNode();
                tableNode.replace(paragraph);
                paragraph.select();
              }
            }),
          );
        }}
      >
        <Trash2 size={14} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="editor__toolbarButton"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EditorSyncPlugin({
  value,
  editorValueRef,
}: {
  value: string;
  editorValueRef: MutableRefObject<string | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const safeValue = value?.trim() || '';
    if (!safeValue) {
      return;
    }

    if (
      editorValueRef.current !== null &&
      (editorValueRef.current === safeValue || lexicalDocsContentEqual(editorValueRef.current, safeValue))
    ) {
      editorValueRef.current = safeValue;
      return;
    }

    let currentSerialized: string;
    try {
      currentSerialized = JSON.stringify(editor.getEditorState().toJSON());
    } catch {
      currentSerialized = '';
    }

    const refVal = editorValueRef.current;
    const localMatchesLastEmit =
      refVal !== null &&
      currentSerialized &&
      lexicalDocsContentEqual(currentSerialized, refVal);
    const propBehindLocal =
      localMatchesLastEmit && !lexicalDocsContentEqual(safeValue, refVal);

    if (propBehindLocal) {
      return;
    }

    try {
      const state = editor.parseEditorState(safeValue);
      editor.setEditorState(state);
      editorValueRef.current = safeValue;
    } catch (error) {
      console.error('Failed to restore editor state', error);
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
      editorValueRef.current = safeValue;
    }
  }, [editor, editorValueRef, value]);

  return null;
}

function EditorChangePlugin({
  onChange,
  editorValueRef,
}: {
  onChange: (payload: EditorChangePayload) => void;
  editorValueRef: MutableRefObject<string | null>;
}) {
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        const plainText = editorState.read(() => summarizeText($getRoot().getTextContent()));
        const jsonValue = editorState.toJSON();
        const json = JSON.stringify(jsonValue);
        const stats = extractChecklistStats(jsonValue);

        editorValueRef.current = json;

        onChange({
          json,
          plainText,
          checklistTotal: stats.checklistTotal,
          checklistCompleted: stats.checklistCompleted,
        });
      }}
    />
  );
}
