import {ChevronsDown, ChevronsUp, Equal} from 'lucide-react';
import type {TaskPriority} from '../../types';

export function TaskCardPriorityIcon({
  priority,
  size = 14,
}: {
  priority: TaskPriority;
  size?: number;
}) {
  if (priority === 'high') {
    return <ChevronsUp className="taskCard__priorityGlyph taskCard__priorityGlyph--high" size={size} strokeWidth={2.5} />;
  }
  if (priority === 'low') {
    return <ChevronsDown className="taskCard__priorityGlyph taskCard__priorityGlyph--low" size={size} strokeWidth={2.5} />;
  }
  return <Equal className="taskCard__priorityGlyph" size={size} strokeWidth={2.5} />;
}
