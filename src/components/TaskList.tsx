import React from 'react';

import type {DealTask, DealTaskStatus, ParticipantType} from '../api';

type Props = {
  tasks: DealTask[];
  pendingTaskId: number | null;
  audience?: ParticipantType;
  onToggleStatus: (taskId: number, next: DealTaskStatus) => Promise<void> | void;
  emptyMessage?: string;
};

export function TaskList({
  tasks,
  pendingTaskId,
  audience,
  onToggleStatus,
  emptyMessage = 'No outstanding tasks.',
}: Props) {
  const visible = audience
    ? tasks.filter(task => task.assigneeType === audience)
    : tasks;

  if (visible.length === 0) {
    return <p className="task-list-empty">{emptyMessage}</p>;
  }

  const open = visible.filter(task => task.status !== 'COMPLETED' && task.status !== 'CANCELED');
  const done = visible.filter(task => task.status === 'COMPLETED');

  return (
    <ul className="task-list">
      {open.map(task => {
        const pending = pendingTaskId === task.id;
        return (
          <li key={task.id} className="task-list-item">
            <button
              type="button"
              className="task-list-check"
              aria-label={`Mark ${task.title} complete`}
              disabled={pending}
              onClick={() => {
                Promise.resolve(onToggleStatus(task.id, 'COMPLETED')).catch(() => {});
              }}>
              <span className="task-list-check-box" aria-hidden="true" />
            </button>
            <div className="task-list-body">
              <strong>{task.title}</strong>
              {task.description ? <span>{task.description}</span> : null}
              <span className="task-list-meta">
                {task.dueAt ? `Due ${formatDate(task.dueAt)} · ` : ''}
                {formatLabel(task.assigneeType)}
              </span>
            </div>
          </li>
        );
      })}
      {done.map(task => {
        const pending = pendingTaskId === task.id;
        return (
          <li key={task.id} className="task-list-item done">
            <button
              type="button"
              className="task-list-check checked"
              aria-label={`Reopen ${task.title}`}
              disabled={pending}
              onClick={() => {
                Promise.resolve(onToggleStatus(task.id, 'OPEN')).catch(() => {});
              }}>
              <span className="task-list-check-box" aria-hidden="true">
                ✓
              </span>
            </button>
            <div className="task-list-body">
              <strong>{task.title}</strong>
              <span className="task-list-meta">Completed</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}
