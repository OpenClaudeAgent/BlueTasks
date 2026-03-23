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
import {SIDEBAR_COMPACT_MAX_WIDTH_PX} from '../lib/sidebarLayout';
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
}: SidebarProps) {
  const {t} = useTranslation();
  const sidebarCompact = sidebarWidth <= SIDEBAR_COMPACT_MAX_WIDTH_PX;

  return (
    <aside className={`sidebar${sidebarCompact ? ' sidebar--compact' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__brandMark" aria-hidden="true">
          <ListTodo size={26} strokeWidth={2.1} />
        </div>
        <div>
          <div className="sidebar__brandName">{t('appName')}</div>
          <div className="sidebar__brandSubtitle">{t('brandSubtitle')}</div>
        </div>
      </div>

      <div className="sidebar__scrollRegion">
        <nav className="sidebar__nav" aria-label={t('primaryNavigation')}>
        {sectionOrder.map((section) => {
          const Icon = sectionIcons[section];
          return (
            <button
              key={section}
              aria-label={
                sidebarCompact ? `${t(`sections.${section}`)}, ${counts[section]}` : undefined
              }
              className={`sidebar__item ${selectedSection === section ? 'is-active' : ''}`}
              onClick={() => onSelect(section)}
              type="button"
            >
              <span className="sidebar__itemIcon">
                <Icon size={22} />
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
          aria-label={sidebarCompact ? t('categoriesNavLabel') : undefined}
          aria-labelledby={sidebarCompact ? undefined : 'sidebar-categories-heading'}
          className="sidebar__categoriesNav"
          role="group"
        >
          <button
            aria-label={
              sidebarCompact ? `${t('categoriesAll')}, ${categoryRowCounts.all}` : undefined
            }
            className={`sidebar__item ${categoryFilter === CATEGORY_FILTER_ALL ? 'is-active' : ''}`}
            onClick={() => onCategoryFilterChange(CATEGORY_FILTER_ALL)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Layers size={22} />
            </span>
            <span className="sidebar__itemLabel">{t('categoriesAll')}</span>
            <span className="sidebar__itemCount">{categoryRowCounts.all}</span>
          </button>
          <button
            aria-label={
              sidebarCompact
                ? `${t('categoriesUncategorized')}, ${categoryRowCounts.uncategorized}`
                : undefined
            }
            className={`sidebar__item ${categoryFilter === CATEGORY_FILTER_UNCATEGORIZED ? 'is-active' : ''}`}
            onClick={() => onCategoryFilterChange(CATEGORY_FILTER_UNCATEGORIZED)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Folder size={22} />
            </span>
            <span className="sidebar__itemLabel">{t('categoriesUncategorized')}</span>
            <span className="sidebar__itemCount">{categoryRowCounts.uncategorized}</span>
          </button>
          {categories.map((c) => {
            const CatIcon = getCategoryIconComponent(c.icon);
            return (
              <button
                key={c.id}
                aria-label={
                  sidebarCompact ? `${c.name}, ${categoryRowCounts.byId[c.id] ?? 0}` : undefined
                }
                className={`sidebar__item ${categoryFilter === c.id ? 'is-active' : ''}`}
                onClick={() => onCategoryFilterChange(c.id)}
                type="button"
              >
                <span className="sidebar__itemIcon">
                  <CatIcon size={22} />
                </span>
                <span className="sidebar__itemLabel">{c.name}</span>
                <span className="sidebar__itemCount">{categoryRowCounts.byId[c.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <div className="sidebar__footer">
        <button
          aria-label={sidebarCompact ? t('settingsOpen') : undefined}
          className="sidebar__settingsBtn"
          onClick={onOpenSettings}
          type="button"
        >
          <Settings aria-hidden size={22} />
          <span>{t('settingsOpen')}</span>
        </button>
      </div>
    </aside>
  );
}
