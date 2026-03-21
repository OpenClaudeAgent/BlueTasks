import * as Popover from '@radix-ui/react-popover';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {formatEstimateMinutesLabel} from '../../lib/taskCardFormat';
import type {TaskDraftUpdate} from '../../types';
import {ESTIMATE_PRESETS} from './constants';

export type TaskCardFooterEstimatePickerProps = {
  taskId: string;
  estimateMinutes: number | null | undefined;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterEstimatePicker({
  taskId,
  estimateMinutes,
  onChange,
}: TaskCardFooterEstimatePickerProps) {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);

  const label =
    estimateMinutes != null && estimateMinutes > 0
      ? formatEstimateMinutesLabel(estimateMinutes, t)
      : t('footerNoEstimate');

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button className="taskCard__footerEstimateTrigger" title={t('footerEstimate')} type="button">
          <span className="taskCard__srOnly">{t('footerEstimate')}</span>
          {label}
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
                  onChange(taskId, {estimateMinutes: minutes});
                  setOpen(false);
                }}
                type="button"
              >
                {formatEstimateMinutesLabel(minutes, t)}
              </button>
            ))}
            <button
              className="footerPopover__optionMuted"
              onClick={() => {
                onChange(taskId, {estimateMinutes: null});
                setOpen(false);
              }}
              type="button"
            >
              {t('footerNoEstimate')}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
