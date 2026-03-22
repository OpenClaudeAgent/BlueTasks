import {CHECK_LIST} from '@lexical/markdown';
import type {ElementTransformer} from '@lexical/markdown';

/**
 * Lexical's CHECK_LIST regex starts with `(\s*)`; {@code listReplace} maps that prefix to
 * {@code listItem.setIndent(getIndent(...))}. Tabs inserted by the editor (literal Tab in text)
 * therefore become nesting depth and spawn extra checklist rows / invisible structure.
 *
 * Strip tab characters from the indent capture only — spaces still follow LIST_INDENT_SIZE (4)
 * for intentional markdown nesting.
 */
export const CHECK_LIST_FLAT_TABS: ElementTransformer = {
  ...CHECK_LIST,
  replace(parentNode, children, match, isImport) {
    const patched = [...match] as unknown as RegExpMatchArray;
    const leading = match[1] ?? '';
    patched[1] = leading.replace(/\t/g, '');
    CHECK_LIST.replace(parentNode, children, patched, isImport);
  },
};
