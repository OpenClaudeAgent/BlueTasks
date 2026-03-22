import * as Popover from '@radix-ui/react-popover';
import {useRef, useState, type MouseEvent} from 'react';
import {Timer} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {formatDurationLabel} from '../../lib/taskCardFormat';
import {
  breakDownSeconds,
  composeSeconds,
  parseTimerField,
} from '../../lib/taskTimerEdit';
import type {TaskDraftUpdate} from '../../types';

export type TaskCardFooterTimerButtonProps = {
  taskId: string;
  timerStartedAt: string | null;
  timeSpentSeconds: number;
  trackedSeconds: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterTimerButton({
  taskId,
  timerStartedAt,
  timeSpentSeconds,
  trackedSeconds,
  onChange,
}: TaskCardFooterTimerButtonProps) {
  const {t} = useTranslation();
  const lastToggleAtRef = useRef(0);
  const [editOpen, setEditOpen] = useState(false);
  const [fieldH, setFieldH] = useState('0');
  const [fieldM, setFieldM] = useState('0');
  const [fieldS, setFieldS] = useState('0');

  function syncFieldsFromTracked() {
    const b = breakDownSeconds(trackedSeconds);
    setFieldH(String(b.hours));
    setFieldM(String(b.minutes));
    setFieldS(String(b.seconds));
  }

  function handleEditOpenChange(open: boolean) {
    if (open) {
      syncFieldsFromTracked();
    }
    setEditOpen(open);
  }

  function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (now - lastToggleAtRef.current < 500) {
      return;
    }
    lastToggleAtRef.current = now;

    if (timerStartedAt) {
      const start = Date.parse(timerStartedAt);
      const add = Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
      onChange(taskId, {
        timeSpentSeconds: (timeSpentSeconds ?? 0) + add,
        timerStartedAt: null,
      });
    } else {
      onChange(taskId, {timerStartedAt: new Date(now).toISOString()});
    }
  }

  function handleSaveEdit() {
    const total = composeSeconds(
      parseTimerField(fieldH),
      parseTimerField(fieldM),
      parseTimerField(fieldS),
    );
    onChange(taskId, {timeSpentSeconds: total, timerStartedAt: null});
    setEditOpen(false);
  }

  return (
    <div className="taskCard__timerControl">
      <button
        aria-label={timerStartedAt ? t('timerStop') : t('timerStart')}
        className={`taskCard__iconBtn taskCard__iconBtn--timer ${timerStartedAt ? 'is-active' : ''}`}
        onClick={toggleTimer}
        title={timerStartedAt ? t('timerStop') : t('timerStart')}
        type="button"
      >
        <Timer aria-hidden size={16} />
      </button>

      <Popover.Root onOpenChange={handleEditOpenChange} open={editOpen}>
        <Popover.Trigger asChild>
          <button
            aria-label={t('timerEditTracked')}
            className={`taskCard__timerLabelBtn ${timerStartedAt ? 'is-active' : ''}`}
            onClick={(event) => event.stopPropagation()}
            type="button"
          >
            <span aria-hidden className="taskCard__timerLabel">
              {formatDurationLabel(trackedSeconds)}
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            className="footerPopover footerPopover--timerEdit"
            collisionPadding={12}
            onClick={(event) => event.stopPropagation()}
            sideOffset={6}
          >
            <div className="footerPopover__title">{t('timerEditTitle')}</div>
            {timerStartedAt ? (
              <p className="footerPopover__timerNote">{t('timerEditStopNote')}</p>
            ) : null}
            <div className="footerPopover__timerFields">
              <label className="footerPopover__timerField">
                <span className="footerPopover__timerFieldLabel">{t('timerEditHours')}</span>
                <input
                  aria-label={t('timerEditHours')}
                  className="footerPopover__timerInput"
                  inputMode="numeric"
                  onChange={(event) => setFieldH(event.target.value)}
                  type="text"
                  value={fieldH}
                />
              </label>
              <label className="footerPopover__timerField">
                <span className="footerPopover__timerFieldLabel">{t('timerEditMinutes')}</span>
                <input
                  aria-label={t('timerEditMinutes')}
                  className="footerPopover__timerInput"
                  inputMode="numeric"
                  onChange={(event) => setFieldM(event.target.value)}
                  type="text"
                  value={fieldM}
                />
              </label>
              <label className="footerPopover__timerField">
                <span className="footerPopover__timerFieldLabel">{t('timerEditSeconds')}</span>
                <input
                  aria-label={t('timerEditSeconds')}
                  className="footerPopover__timerInput"
                  inputMode="numeric"
                  onChange={(event) => setFieldS(event.target.value)}
                  type="text"
                  value={fieldS}
                />
              </label>
            </div>
            <div className="footerPopover__timerActions">
              <button
                className="footerPopover__timerActionBtn footerPopover__timerActionBtn--primary"
                onClick={handleSaveEdit}
                type="button"
              >
                {t('timerEditSave')}
              </button>
              <button
                className="footerPopover__timerActionBtn"
                onClick={() => setEditOpen(false)}
                type="button"
              >
                {t('timerEditCancel')}
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
