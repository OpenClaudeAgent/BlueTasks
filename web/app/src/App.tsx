import {useState} from 'react';
import {LoaderCircle, Plus} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {SettingsDialog} from './components/SettingsDialog';
import {Sidebar} from './components/Sidebar';
import {TaskCard} from './components/TaskCard';
import {useBlueTasksBoard} from './hooks/useBlueTasksBoard';

function App() {
  const {t} = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickCaptureValue, setQuickCaptureValue] = useState('');
  const board = useBlueTasksBoard();

  return (
    <div className="appShell">
      <Sidebar
        areaFilter={board.areaFilter}
        areaRowCounts={board.areaSidebarCounts}
        areas={board.areas}
        counts={board.counts}
        onAreaFilterChange={board.setAreaFilter}
        onOpenSettings={() => setSettingsOpen(true)}
        onSelect={board.setSelectedSection}
        selectedSection={board.selectedSection}
      />
      <SettingsDialog
        areas={board.areas}
        onAreasUpdated={board.refreshTasksAndAreas}
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
        taskCountByAreaId={board.taskCountByAreaId}
      />

      <main className="mainPanel">
        <header className="mainHeader">
          <div>
            <div className="mainHeader__eyebrow">{t('brandSubtitle')}</div>
            <h1 className="mainHeader__title">{t(`sections.${board.selectedSection}`)}</h1>
            <p className="mainHeader__subtitle">{t(`subtitles.${board.selectedSection}`)}</p>
          </div>

          <div className="mainHeader__actions">
            <div className="mainHeader__actionsRow">
              <input
                aria-label={t('quickCapturePlaceholder')}
                className="mainHeader__quickCapture"
                disabled={board.loading}
                onChange={(event) => setQuickCaptureValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') {
                    return;
                  }
                  event.preventDefault();
                  const next = quickCaptureValue.trim();
                  if (!next || board.loading) {
                    return;
                  }
                  void board.handleQuickCapture(next).finally(() => setQuickCaptureValue(''));
                }}
                placeholder={t('quickCapturePlaceholder')}
                type="text"
                value={quickCaptureValue}
              />
              <button
                aria-label={t('addTaskAria')}
                className="mainHeader__addBtn"
                disabled={board.loading}
                onClick={() => void board.handleAddTask()}
                type="button"
              >
                <Plus aria-hidden size={18} strokeWidth={2.25} />
                <span>{t('addTask')}</span>
              </button>
            </div>
          </div>
        </header>

        {board.errorMessage ? <div className="appError">{board.errorMessage}</div> : null}

        <section className="taskBoard">
          <div className="taskBoard__header">
            <div>
              <div className="taskBoard__eyebrow">{t('taskListLabel')}</div>
              <h2>{t(`sections.${board.selectedSection}`)}</h2>
            </div>
            <span className="taskBoard__count">{board.visibleTasks.length}</span>
          </div>

          <div className="taskBoard__list">
            {board.loading ? (
              <div className="emptyState emptyState--loading">
                <LoaderCircle className="is-spinning" size={18} />
                {t('loading')}
              </div>
            ) : board.visibleTasks.length ? (
              board.visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  areas={board.areas}
                  autoFocusTitle={board.titleFocusTaskId === task.id}
                  expanded={board.selectedTaskId === task.id}
                  isSaving={Boolean(board.savingIds[task.id])}
                  onAutoFocusTitleConsumed={() => board.setTitleFocusTaskId(null)}
                  onChange={board.handleTaskDraftChange}
                  onDelete={(taskId) => void board.handleDelete(taskId)}
                  onToggleExpand={() =>
                    board.setSelectedTaskId((current) => (current === task.id ? null : task.id))
                  }
                  onToggleStatus={board.handleToggleRecurringStatus}
                  task={task}
                />
              ))
            ) : (
              <div className="emptyState">{t(`empty.${board.selectedSection}`)}</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
