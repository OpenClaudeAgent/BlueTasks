import {
  CheckCheck,
  CircleDashed,
  Folder,
  Inbox,
  Layers,
  LayoutGrid,
  ListTodo,
  Settings,
  SunMedium,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {getAreaIconComponent} from '../lib/areaIcons';
import {sectionOrder} from '../lib/tasks';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from '../types';
import type {Area, AreaFilter, SectionId, TaskCounts} from '../types';

const sectionIcons = {
  all: LayoutGrid,
  today: SunMedium,
  upcoming: CircleDashed,
  anytime: Inbox,
  done: CheckCheck,
} as const;

export type AreaSidebarCounts = {
  all: number;
  uncategorized: number;
  byId: Record<string, number>;
};

type SidebarProps = {
  selectedSection: SectionId;
  counts: TaskCounts;
  onSelect: (section: SectionId) => void;
  areas: Area[];
  areaFilter: AreaFilter;
  onAreaFilterChange: (filter: AreaFilter) => void;
  areaRowCounts: AreaSidebarCounts;
  onOpenSettings: () => void;
};

export function Sidebar({
  selectedSection,
  counts,
  onSelect,
  areas,
  areaFilter,
  onAreaFilterChange,
  areaRowCounts,
  onOpenSettings,
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

      <div className="sidebar__areas">
        <div className="sidebar__areasLabel" id="sidebar-areas-heading">
          {t('areasNavLabel')}
        </div>
        <div className="sidebar__areasNav" role="group" aria-labelledby="sidebar-areas-heading">
          <button
            className={`sidebar__item ${areaFilter === AREA_FILTER_ALL ? 'is-active' : ''}`}
            onClick={() => onAreaFilterChange(AREA_FILTER_ALL)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Layers size={18} />
            </span>
            <span className="sidebar__itemLabel">{t('areasAll')}</span>
            <span className="sidebar__itemCount">{areaRowCounts.all}</span>
          </button>
          <button
            className={`sidebar__item ${areaFilter === AREA_FILTER_UNCATEGORIZED ? 'is-active' : ''}`}
            onClick={() => onAreaFilterChange(AREA_FILTER_UNCATEGORIZED)}
            type="button"
          >
            <span className="sidebar__itemIcon">
              <Folder size={18} />
            </span>
            <span className="sidebar__itemLabel">{t('areasUncategorized')}</span>
            <span className="sidebar__itemCount">{areaRowCounts.uncategorized}</span>
          </button>
          {areas.map((area) => {
            const AreaIcon = getAreaIconComponent(area.icon);
            return (
            <button
              key={area.id}
              className={`sidebar__item ${areaFilter === area.id ? 'is-active' : ''}`}
              onClick={() => onAreaFilterChange(area.id)}
              type="button"
            >
              <span className="sidebar__itemIcon">
                <AreaIcon size={18} />
              </span>
              <span className="sidebar__itemLabel">{area.name}</span>
              <span className="sidebar__itemCount">{areaRowCounts.byId[area.id] ?? 0}</span>
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
    </aside>
  );
}
