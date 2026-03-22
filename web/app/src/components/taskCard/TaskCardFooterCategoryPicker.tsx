import * as Popover from '@radix-ui/react-popover';
import {useMemo, useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {Category, TaskDraftUpdate} from '../../types';
import {categoryNameByIdMap} from './taskCardModel';

export type TaskCardFooterCategoryPickerProps = {
  taskId: string;
  categoryId: string | null | undefined;
  categories: Category[];
  /** Resolved in the parent so the icon component is not created inside this child render. */
  categoryGlyph: LucideIcon;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterCategoryPicker({
  taskId,
  categoryId,
  categories,
  categoryGlyph: CategoryGlyph,
  onChange,
}: TaskCardFooterCategoryPickerProps) {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);

  const nameById = useMemo(() => categoryNameByIdMap(categories), [categories]);
  const displayName = categoryId ? (nameById[categoryId] ?? null) : null;

  const footerLabel = categoryId ? (displayName ?? t('categoryMissing')) : t('categoryNone');

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button
          className="taskCard__footerCategoryTrigger"
          title={t('categoryLabel')}
          type="button"
        >
          <CategoryGlyph aria-hidden size={14} strokeWidth={2} />
          <span className="taskCard__footerCategoryTriggerText">{footerLabel}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          aria-label={t('categoryLabel')}
          className="footerPopover"
          sideOffset={8}
        >
          <div className="footerPopover__title">{t('categoryLabel')}</div>
          <div className="footerPopover__options">
            <button
              className={!categoryId ? 'is-selected' : undefined}
              onClick={() => {
                onChange(taskId, {categoryId: null});
                setOpen(false);
              }}
              type="button"
            >
              {t('categoryNone')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={categoryId === c.id ? 'is-selected' : undefined}
                onClick={() => {
                  onChange(taskId, {categoryId: c.id});
                  setOpen(false);
                }}
                type="button"
              >
                {c.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
