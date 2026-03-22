import type {PointerEventHandler} from 'react';
import {
  Calendar,
  CalendarClock,
  CalendarOff,
  CheckCheck,
  Folder,
  Layers,
  ListChecks,
  ListTodo,
  Settings,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {getCategoryIconComponent} from '../lib/categoryIcons';
import {sectionOrder} from '../lib/tasks';
import {CATEGORY_FILTER_ALL, CATEGORY_FILTER_UNCATEGORIZED} from '../types';
import type {Category, CategoryFilter, SectionId, TaskCounts} from '../types';

const sectionIcons = {
  /** Full task list across sections */
  all: ListChecks,
  /** Focus on this calendar day */
  today: Calendar,
  /** Due dates ahead */
  upcoming: CalendarClock,
  /** Backlog without a scheduled date */
  anytime: CalendarOff,
  done: CheckCheck,
} as const;

export type CategorySidebarCounts = {
  all: number;
  uncategorized: number;
  byId: Record<string, number>;
};

type SidebarProps = {
  selectedSection: SectionId;
  counts: TaskCounts;
  onSelect: (section: SectionId) => void;
  categories: Category[];
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  categoryRowCounts: CategorySidebarCounts;
  onOpenSettings: () => void;
  sidebarWidth: number;
  minSidebarWidth: number;
  maxSidebarWidth: number;
  onResizePointerDown: PointerEventHandler<HTMLDivElement>;
};

export function Sidebar({
  selectedSection,
  counts,
  onSelect,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  categoryRowCounts,
  onOpenSettings,
  sidebarWidth,
  minSidebarWidth,
  maxSidebarWidth,
  onResizePointerDown,
}: SidebarProps) {
  const {t} = useTranslation();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brandMark" aria-hidden="true">
          <ListTodo size={22} strokeWidth={2.1} />
        </div>
        <div>
          <div className="sidebar__brandName">{t('appName')}</div>
          <div className="sidebar__brandSubtitle">{t('brandSubtitle')}</div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label={t('primaryNavigation')}>
        {sectionOrder.map((section) => {
          const Icon = sectionIcons[section];
          return (
            <button
              key={section}
              className={`sidebar__item ${selectedSection === section ? 'is-active' : ''}`}
              onClick={() => onSelect(section)}
              type="button"
            >
              <span className="sidebar__itemIcon">
                <Icon size={18} />
              </span>
              <span className="sidebar__itemLabel">{t(`sections.${section}`)}</span>
              <span className="sidebar__itemCount">{counts[section]}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__categories">
        <div className="sidebar__categoriesLabel" id="sidebar-categories-heading">
          {t('categoriesNavLabel')}
        </div>
        <div
          className="sidebar__categoriesNav"
          role="group"
          aria-labelledby="sidebar-categories-heading"
        >
          <button
            className={`sidebar__item ${categoryFilter === CATEGORY_FILTER_ALL ? 'is-active' : ''}`}
            onClick={() => onCategoryFilterChange(CATEGORY_FILTER_ALL)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Layers size={18} />
            </span>
            <span className="sidebar__itemLabel">{t('categoriesAll')}</span>
            <span className="sidebar__itemCount">{categoryRowCounts.all}</span>
          </button>
          <button
            className={`sidebar__item ${categoryFilter === CATEGORY_FILTER_UNCATEGORIZED ? 'is-active' : ''}`}
            onClick={() => onCategoryFilterChange(CATEGORY_FILTER_UNCATEGORIZED)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Folder size={18} />
            </span>
            <span className="sidebar__itemLabel">{t('categoriesUncategorized')}</span>
            <span className="sidebar__itemCount">{categoryRowCounts.uncategorized}</span>
          </button>
          {categories.map((c) => {
            const CatIcon = getCategoryIconComponent(c.icon);
            return (
              <button
                key={c.id}
                className={`sidebar__item ${categoryFilter === c.id ? 'is-active' : ''}`}
                onClick={() => onCategoryFilterChange(c.id)}
                type="button"
              >
                <span className="sidebar__itemIcon">
                  <CatIcon size={18} />
                </span>
                <span className="sidebar__itemLabel">{c.name}</span>
                <span className="sidebar__itemCount">{categoryRowCounts.byId[c.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar__footer">
        <button className="sidebar__settingsBtn" onClick={onOpenSettings} type="button">
          <Settings aria-hidden size={18} />
          <span>{t('settingsOpen')}</span>
        </button>
      </div>

      <div
        aria-orientation="vertical"
        aria-label={t('sidebarResizeHandle')}
        aria-valuemax={maxSidebarWidth}
        aria-valuemin={minSidebarWidth}
        aria-valuenow={Math.round(sidebarWidth)}
        className="appShell__resizeHandle"
        onPointerDown={onResizePointerDown}
        role="separator"
      />
    </aside>
  );
}
