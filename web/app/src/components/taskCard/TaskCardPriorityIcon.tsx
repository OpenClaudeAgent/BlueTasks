import {ChevronsDown, ChevronsUp, Equal} from 'lucide-react';
import type {TaskPriority} from '../../types';

export function TaskCardPriorityIcon({priority}: {priority: TaskPriority}) {
  if (priority === 'high') {
    return <ChevronsUp className="taskCard__priorityGlyph taskCard__priorityGlyph--high" size={14} strokeWidth={2.5} />;
  }
  if (priority === 'low') {
    return <ChevronsDown className="taskCard__priorityGlyph taskCard__priorityGlyph--low" size={14} strokeWidth={2.5} />;
  }
  return <Equal className="taskCard__priorityGlyph" size={14} strokeWidth={2.5} />;
}
