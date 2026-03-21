import {lazy, Suspense, useEffect, useMemo, useRef, useState, type MouseEvent} from 'react';
import * as Popover from '@radix-ui/react-popover';
import {DayPicker} from 'react-day-picker';
import {enUS, fr as frLocale} from 'date-fns/locale';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Equal,
  LoaderCircle,
  Pin,
  RotateCw,
  Timer,
  Trash2,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {addDaysToKey, formatDateKey, formatTaskDatePill, getDateTone, parseTaskDate, todayKey} from '../lib/date';
import {getAreaIconComponent} from '../lib/areaIcons';
import {createEmptyEditorState, lexicalDocsContentEqual} from '../lib/editorState';
import {coercePinned, coerceRecurrence} from '../lib/tasks';
import type {Area, RecurrenceKind, Task, TaskDraftUpdate, TaskPriority} from '../types';

const ESTIMATE_PRESETS = [30, 60, 120, 240, 1440] as const;

const RECURRENCE_OPTIONS: {kind: RecurrenceKind | null; labelKey: string}[] = [
  {kind: null, labelKey: 'recurrenceOff'},
  {kind: 'daily', labelKey: 'recurrenceDaily'},
  {kind: 'weekly', labelKey: 'recurrenceWeekly'},
  {kind: 'biweekly', labelKey: 'recurrenceBiweekly'},
  {kind: 'monthly', labelKey: 'recurrenceMonthly'},
  {kind: 'yearly', labelKey: 'recurrenceYearly'},
];

function formatEstimateMinutesLabel(minutes: number, t: (key: string, opts?: {count: number}) => string): string {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return t('estimateDays', {count: days});
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return t('estimateHours', {count: minutes / 60});
  }
  return t('estimateMinutesShort', {count: minutes});
}

function formatTrackedSeconds(task: Task, nowMs: number): number {
  const base = task.timeSpentSeconds ?? 0;
  if (!task.timerStartedAt) {
    return base;
  }
  const start = Date.parse(task.timerStartedAt);
  if (Number.isNaN(start)) {
    return base;
  }
  return base + Math.max(0, Math.floor((nowMs - start) / 1000));
}

function formatDurationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const LazyLexicalTaskEditor = lazy(async () => {
  const module = await import('./LexicalTaskEditor');
  return {default: module.LexicalTaskEditor};
});

const PRIORITY_ORDER: TaskPriority[] = ['low', 'normal', 'high'];

function nextPriority(current: TaskPriority): TaskPriority {
  const index = PRIORITY_ORDER.indexOf(current);
  return PRIORITY_ORDER[(index + 1) % PRIORITY_ORDER.length];
}

function PriorityIcon({priority}: {priority: TaskPriority}) {
  if (priority === 'high') {
    return <ChevronsUp className="taskCard__priorityGlyph taskCard__priorityGlyph--high" size={14} strokeWidth={2.5} />;
  }
  if (priority === 'low') {
    return <ChevronsDown className="taskCard__priorityGlyph taskCard__priorityGlyph--low" size={14} strokeWidth={2.5} />;
  }
  return <Equal className="taskCard__priorityGlyph" size={14} strokeWidth={2.5} />;
}

type TaskCardProps = {
  task: Task;
  areas: Area[];
  expanded: boolean;
  /** Premier rendu étendu : focus sur le champ titre (ex. après « Ajouter »). */
  autoFocusTitle?: boolean;
  onAutoFocusTitleConsumed?: () => void;
  isSaving: boolean;
  onToggleExpand: () => void;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
};

export function TaskCard({
  task,
  areas,
  expanded,
  autoFocusTitle = false,
  onAutoFocusTitleConsumed,
  isSaving,
  onToggleExpand,
  onChange,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const {t, i18n} = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [, setTimerTick] = useState(0);
  const lastTimerToggleAtRef = useRef(0);
  const dateTone = getDateTone(task.taskDate);
  const priority = task.priority ?? 'normal';
  const pinned = coercePinned(task.pinned);
  const recurrence = coerceRecurrence(task.recurrence);

  useEffect(() => {
    if (!task.timerStartedAt) {
      return;
    }
    const id = window.setInterval(() => setTimerTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [task.timerStartedAt, task.id]);

  const focusTitleConsumedRef = useRef(onAutoFocusTitleConsumed);
  focusTitleConsumedRef.current = onAutoFocusTitleConsumed;

  useEffect(() => {
    if (!expanded || !autoFocusTitle) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const el = titleInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
      focusTitleConsumedRef.current?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expanded, autoFocusTitle, task.id]);

  const trackedSeconds = formatTrackedSeconds(task, Date.now());
  const estimateLabel =
    task.estimateMinutes != null && task.estimateMinutes > 0
      ? formatEstimateMinutesLabel(task.estimateMinutes, t)
      : t('footerNoEstimate');

  const checklistRatio = useMemo(() => {
    if (!task.checklistTotal) {
      return 0;
    }

    return Math.round((task.checklistCompleted / task.checklistTotal) * 100);
  }, [task.checklistCompleted, task.checklistTotal]);

  const datePillLabel = task.taskDate ? formatTaskDatePill(task.taskDate, i18n.language) : null;

  const areaNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of areas) {
      map[a.id] = a.name;
    }
    return map;
  }, [areas]);

  const areaDisplayName = task.areaId ? areaNameById[task.areaId] ?? null : null;

  const AreaGlyph = useMemo(
    () => getAreaIconComponent(task.areaId ? areas.find((a) => a.id === task.areaId)?.icon : undefined),
    [areas, task.areaId],
  );

  const areaFooterLabel = task.areaId
    ? (areaDisplayName ?? t('areaMissing'))
    : t('areaNone');

  const priorityLabel =
    priority === 'low' ? t('priorityShort.low') : priority === 'high' ? t('priorityShort.high') : t('priorityShort.normal');

  return (
    <article className={`taskCard ${expanded ? 'is-expanded' : ''} ${task.status === 'completed' ? 'is-completed' : ''}`}>
      <div className={`taskCard__row ${expanded ? '' : 'taskCard__row--collapsible'}`}>
        <button
          aria-label={
            task.status === 'completed'
              ? t('markAsOpen')
              : recurrence
                ? t('markRecurrenceDone')
                : t('markAsDone')
          }
          className={`taskCard__status ${task.status === 'completed' ? 'is-checked' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleStatus(task.id);
          }}
          type="button"
        >
          <Check size={12} strokeWidth={2.5} />
        </button>

        <div className="taskCard__titleZone">
          {expanded ? (
            <input
              ref={titleInputRef}
              aria-label={t('taskTitle')}
              className="taskCard__titleInput taskCard__titleInput--inline"
              onBlur={() => onChange(task.id, {title: task.title.trim()})}
              onChange={(event) => onChange(task.id, {title: event.target.value})}
              onClick={(event) => event.stopPropagation()}
              placeholder={t('untitledTask')}
              value={task.title}
            />
          ) : (
            <button className="taskCard__titleButton" onClick={onToggleExpand} type="button">
              <span className="taskCard__title">{task.title || t('untitledTask')}</span>
            </button>
          )}
        </div>

        <div className="taskCard__rowTrailing">
          {task.areaId ? (
            <span className="taskCard__chip taskCard__chip--area" title={t('areaLabel')}>
              <AreaGlyph aria-hidden size={11} strokeWidth={2.5} />
              <span className="taskCard__areaChipText">{areaDisplayName ?? t('areaMissing')}</span>
            </span>
          ) : null}
          {pinned ? (
            <span className="taskCard__chip taskCard__chip--pin" title={t('pin')}>
              <Pin aria-hidden size={11} strokeWidth={2.5} />
              {t('pinnedBadge')}
            </span>
          ) : null}
          {recurrence ? (
            <span className="taskCard__chip taskCard__chip--recurring" title={t('recurrence')}>
              <RotateCw aria-hidden size={11} strokeWidth={2.5} />
              {t(`recurrenceChip.${recurrence}`)}
            </span>
          ) : null}
          {task.timerStartedAt ? (
            <span className="taskCard__chip taskCard__chip--timer" title={t('timerRunning')}>
              <Timer aria-hidden size={11} strokeWidth={2.5} />
              {formatDurationLabel(trackedSeconds)}
            </span>
          ) : null}

          <Popover.Root onOpenChange={setDateOpen} open={dateOpen}>
            <Popover.Trigger asChild>
              <button
                className={`taskCard__datePill ${task.taskDate ? `taskCard__datePill--${dateTone}` : 'taskCard__datePill--empty'} ${recurrence ? 'taskCard__datePill--recurring' : ''}`}
                onClick={(event) => event.stopPropagation()}
                type="button"
              >
                <span className="taskCard__datePillInner">
                  {datePillLabel ?? t('noDateShort')}
                  {recurrence ? <RotateCw aria-hidden className="taskCard__datePillRepeat" size={11} strokeWidth={2.5} /> : null}
                </span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="end" className="datePopover" sideOffset={8}>
                <div className="datePopover__quickActions">
                  <button onClick={() => updateDate(todayKey())} type="button">
                    {t('today')}
                  </button>
                  <button onClick={() => updateDate(addDaysToKey(todayKey(), 1))} type="button">
                    {t('tomorrow')}
                  </button>
                  <button onClick={() => updateDate(addDaysToKey(todayKey(), 7))} type="button">
                    {t('nextWeek')}
                  </button>
                  <button onClick={() => updateDate(null)} type="button">
                    {t('clearDate')}
                  </button>
                </div>

                <DayPicker
                  locale={i18n.language === 'fr' ? frLocale : enUS}
                  mode="single"
                  onSelect={(date) => updateDate(date ? formatDateKey(date) : null)}
                  selected={task.taskDate ? parseTaskDate(task.taskDate) : undefined}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        <button
          aria-expanded={expanded}
          aria-label={expanded ? t('collapseTask') : t('expandTask')}
          className="taskCard__chevronBtn"
          onClick={onToggleExpand}
          type="button"
        >
          <ChevronDown className={`taskCard__chevron ${expanded ? 'is-open' : ''}`} size={18} />
        </button>
      </div>

      {expanded ? (
        <div className="taskCard__body">
          <Suspense fallback={<div className="editorLoading">{t('editorLoading')}</div>}>
            <LazyLexicalTaskEditor
              key={task.id}
              value={task.contentJson?.trim() || createEmptyEditorState()}
              labels={{
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
              }}
              onChange={(payload) => {
                const currentJson = task.contentJson?.trim() || createEmptyEditorState();
                if (
                  lexicalDocsContentEqual(payload.json, currentJson) &&
                  payload.checklistTotal === task.checklistTotal &&
                  payload.checklistCompleted === task.checklistCompleted
                ) {
                  return;
                }
                onChange(task.id, {
                  contentJson: payload.json,
                  contentText: payload.plainText,
                  checklistTotal: payload.checklistTotal,
                  checklistCompleted: payload.checklistCompleted,
                });
              }}
              placeholder={t('editorPlaceholder')}
            />
          </Suspense>

          <div className="taskCard__progressTrack" aria-hidden="true">
            <span style={{width: `${checklistRatio}%`}} />
          </div>

          <footer className="taskCard__footerBar">
            <div className="taskCard__footerLeft">
              {!task.taskDate ? <span className="taskCard__footerMeta">{t('later')}</span> : null}

              <Popover.Root onOpenChange={setEstimateOpen} open={estimateOpen}>
                <Popover.Trigger asChild>
                  <button
                    className="taskCard__footerEstimateTrigger"
                    title={t('footerEstimate')}
                    type="button"
                  >
                    <span className="taskCard__srOnly">{t('footerEstimate')}</span>
                    {estimateLabel}
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content align="start" className="footerPopover" sideOffset={8}>
                    <div className="footerPopover__title">{t('footerEstimate')}</div>
                    <div className="footerPopover__options">
                      {ESTIMATE_PRESETS.map((minutes) => (
                        <button
                          key={minutes}
                          onClick={() => {
                            onChange(task.id, {estimateMinutes: minutes});
                            setEstimateOpen(false);
                          }}
                          type="button"
                        >
                          {formatEstimateMinutesLabel(minutes, t)}
                        </button>
                      ))}
                      <button
                        className="footerPopover__optionMuted"
                        onClick={() => {
                          onChange(task.id, {estimateMinutes: null});
                          setEstimateOpen(false);
                        }}
                        type="button"
                      >
                        {t('footerNoEstimate')}
                      </button>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              <Popover.Root onOpenChange={setAreaOpen} open={areaOpen}>
                <Popover.Trigger asChild>
                  <button className="taskCard__footerAreaTrigger" title={t('areaLabel')} type="button">
                    <AreaGlyph aria-hidden size={14} strokeWidth={2} />
                    <span className="taskCard__footerAreaTriggerText">{areaFooterLabel}</span>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content align="start" className="footerPopover" sideOffset={8}>
                    <div className="footerPopover__title">{t('areaLabel')}</div>
                    <div className="footerPopover__options">
                      <button
                        className={!task.areaId ? 'is-selected' : undefined}
                        onClick={() => {
                          onChange(task.id, {areaId: null});
                          setAreaOpen(false);
                        }}
                        type="button"
                      >
                        {t('areaNone')}
                      </button>
                      {areas.map((a) => (
                        <button
                          key={a.id}
                          className={task.areaId === a.id ? 'is-selected' : undefined}
                          onClick={() => {
                            onChange(task.id, {areaId: a.id});
                            setAreaOpen(false);
                          }}
                          type="button"
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              <button
                className="taskCard__footerPriority"
                onClick={() => onChange(task.id, {priority: nextPriority(priority)})}
                title={t('footerCyclePriority')}
                type="button"
              >
                <PriorityIcon priority={priority} />
                <span className="taskCard__footerMeta">{t('footerPriority')}</span>
                <span className={`taskCard__footerMeta taskCard__footerMeta--priority-${priority}`}>{priorityLabel}</span>
              </button>

              <span className="taskCard__footerMeta">
                {task.checklistTotal
                  ? t('footerSubtasksPercent', {percent: checklistRatio})
                  : t('footerNoSubtasks')}
              </span>

              <span className={`taskCard__saveState ${isSaving ? 'is-saving' : ''}`}>
                {isSaving ? <LoaderCircle className="is-spinning" size={12} /> : null}
                {isSaving ? t('saving') : t('allChangesSaved')}
              </span>
            </div>

            <div className="taskCard__footerRight">
              <button
                className={`taskCard__iconBtn ${pinned ? 'is-active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(task.id, {pinned: !pinned});
                }}
                title={pinned ? t('unpin') : t('pin')}
                type="button"
              >
                <Pin size={16} />
              </button>
              <button
                className="taskCard__iconBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  setDateOpen(true);
                }}
                title={t('dueDate')}
                type="button"
              >
                <CalendarDays size={16} />
              </button>
              <Popover.Root onOpenChange={setRecurrenceOpen} open={recurrenceOpen}>
                <Popover.Trigger asChild>
                  <button
                    className={`taskCard__iconBtn ${recurrence ? 'is-active' : ''}`}
                    title={t('recurrence')}
                    type="button"
                  >
                    <RotateCw size={16} />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content align="end" className="footerPopover" sideOffset={8}>
                    <div className="footerPopover__title">{t('recurrence')}</div>
                    <div className="footerPopover__options">
                      {RECURRENCE_OPTIONS.map(({kind, labelKey}) => (
                        <button
                          key={labelKey}
                          className={recurrence === kind ? 'is-selected' : undefined}
                          onClick={(event) => {
                            event.stopPropagation();
                            applyRecurrenceSelection(kind);
                          }}
                          type="button"
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
              <button
                aria-label={task.timerStartedAt ? t('timerStop') : t('timerStart')}
                className={`taskCard__iconBtn taskCard__iconBtn--timer ${task.timerStartedAt ? 'is-active' : ''}`}
                onClick={toggleTimer}
                title={task.timerStartedAt ? t('timerStop') : t('timerStart')}
                type="button"
              >
                <Timer aria-hidden size={16} />
                {trackedSeconds > 0 || task.timerStartedAt ? (
                  <span aria-hidden className="taskCard__timerLabel">
                    {formatDurationLabel(trackedSeconds)}
                  </span>
                ) : null}
              </button>
              <button
                className="taskCard__iconBtn taskCard__iconBtn--danger"
                onClick={(event) => {
                  event.stopPropagation();
                  if (window.confirm(t('deleteTaskConfirm', {title: task.title || t('untitledTask')}))) {
                    onDelete(task.id);
                  }
                }}
                title={t('delete')}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </footer>
        </div>
      ) : null}
    </article>
  );

  function updateDate(dateKey: string | null) {
    onChange(task.id, {taskDate: dateKey, recurrence: null});
    setDateOpen(false);
  }

  function applyRecurrenceSelection(kind: RecurrenceKind | null) {
    if (kind === null) {
      onChange(task.id, {recurrence: null});
    } else {
      onChange(task.id, {
        recurrence: kind,
        taskDate: task.taskDate ?? todayKey(),
      });
    }
    setRecurrenceOpen(false);
  }

  function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (now - lastTimerToggleAtRef.current < 500) {
      return;
    }
    lastTimerToggleAtRef.current = now;

    if (task.timerStartedAt) {
      const start = Date.parse(task.timerStartedAt);
      const add =
        Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
      onChange(task.id, {
        timeSpentSeconds: (task.timeSpentSeconds ?? 0) + add,
        timerStartedAt: null,
      });
    } else {
      onChange(task.id, {timerStartedAt: new Date(now).toISOString()});
    }
  }
}
