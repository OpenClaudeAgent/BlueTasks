import {useEffect, useRef, useState, type ChangeEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Database, FolderOpen, Globe, Pencil, Plus, Settings, Trash2, X} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {categoriesApi, downloadDatabaseExport, uploadDatabaseImport} from '../api';
import {DEFAULT_CATEGORY_ICON, type CategoryIconId, getCategoryIconComponent} from '../lib/categoryIcons';
import type {Category} from '../types';
import {CategoryIconPicker} from './CategoryIconPicker';
import {normalizeUiLanguageCode} from '../locales/uiLanguages';
import {LanguageSwitcher} from './LanguageSwitcher';

type SettingsSection = 'general' | 'categories';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  taskCountByCategoryId: Record<string, number>;
  onCategoriesUpdated: () => Promise<void>;
};

export function SettingsDialog({
  open,
  onOpenChange,
  categories,
  taskCountByCategoryId,
  onCategoriesUpdated,
}: SettingsDialogProps) {
  const {t, i18n} = useTranslation();
  const [section, setSection] = useState<SettingsSection>('categories');
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<CategoryIconId>(DEFAULT_CATEGORY_ICON);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editIcon, setEditIcon] = useState<CategoryIconId>(DEFAULT_CATEGORY_ICON);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setNewName('');
      setNewIcon(DEFAULT_CATEGORY_ICON);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name || busy) {
      return;
    }
    setBusy(true);
    try {
      await categoriesApi.create({name, icon: newIcon});
      setNewName('');
      setNewIcon(DEFAULT_CATEGORY_ICON);
      await onCategoriesUpdated();
    } catch {
      /* parent shows errors */
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(id: string) {
    const name = editValue.trim();
    if (!name || busy) {
      return;
    }
    setBusy(true);
    try {
      await categoriesApi.update(id, {name, icon: editIcon});
      setEditingId(null);
      await onCategoriesUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function handleExportDb() {
    if (exportBusy) {
      return;
    }
    setExportBusy(true);
    try {
      await downloadDatabaseExport();
    } catch {
      window.alert(t('settingsExportDbError'));
    } finally {
      setExportBusy(false);
    }
  }

  function handleImportPickClick() {
    if (importBusy || exportBusy) {
      return;
    }
    importInputRef.current?.click();
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || importBusy) {
      return;
    }
    if (!window.confirm(t('settingsImportDbConfirm'))) {
      return;
    }
    setImportBusy(true);
    try {
      await uploadDatabaseImport(file);
      await onCategoriesUpdated();
    } catch {
      window.alert(t('settingsImportDbError'));
    } finally {
      setImportBusy(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const n = taskCountByCategoryId[id] ?? 0;
    const msg =
      n > 0
        ? t('settingsDeleteCategoryWithTasks', {name, count: n})
        : t('settingsDeleteCategoryConfirm', {name});
    if (!window.confirm(msg)) {
      return;
    }
    setBusy(true);
    try {
      await categoriesApi.remove(id);
      await onCategoriesUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="settingsDialog__overlay" />
        <Dialog.Content
          className="settingsDialog__content settingsDialog__content--split"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="settingsDialog__header">
            <div className="settingsDialog__titleRow">
              <Settings aria-hidden className="settingsDialog__titleIcon" size={20} />
              <Dialog.Title className="settingsDialog__title">{t('settingsTitle')}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button aria-label={t('close')} className="settingsDialog__close" type="button">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="settingsDialog__split">
            <nav className="settingsDialog__sideNav" aria-label={t('settingsNavLabel')}>
              <button
                className={`settingsDialog__navBtn ${section === 'general' ? 'is-active' : ''}`}
                onClick={() => setSection('general')}
                type="button"
              >
                <Globe aria-hidden size={18} />
                <span>{t('settingsSectionGeneral')}</span>
              </button>
              <button
                className={`settingsDialog__navBtn ${section === 'categories' ? 'is-active' : ''}`}
                onClick={() => setSection('categories')}
                type="button"
              >
                <FolderOpen aria-hidden size={18} />
                <span>{t('settingsSectionCategories')}</span>
              </button>
            </nav>

            <div className="settingsDialog__panel">
              {section === 'general' ? (
                <>
                  <Dialog.Description asChild>
                    <div className="settingsDialog__panelIntro settingsDialog__panelIntro--solo">
                      <h3 className="settingsDialog__panelHeading">
                        {t('settingsGeneralHeading')}
                      </h3>
                      <p>{t('settingsGeneralIntro')}</p>
                      <p className="settingsDialog__panelHint">{t('settingsSidebarHint')}</p>
                    </div>
                  </Dialog.Description>
                  <div className="settingsDialog__languageBlock">
                    <LanguageSwitcher
                      label={t('language')}
                      language={normalizeUiLanguageCode(i18n.language)}
                      onChange={(code) => {
                        void i18n.changeLanguage(code);
                      }}
                    />
                  </div>
                  <div className="settingsDialog__dataBlock">
                    <h3 className="settingsDialog__panelHeading">{t('settingsDataHeading')}</h3>
                    <p className="settingsDialog__panelHint">{t('settingsExportDbHelp')}</p>
                    <p className="settingsDialog__panelHint">{t('settingsImportDbHelp')}</p>
                    <input
                      accept=".sqlite,application/vnd.sqlite3,application/octet-stream"
                      aria-label={t('settingsImportDb')}
                      className="visuallyHidden"
                      data-testid="settings-sqlite-import-input"
                      onChange={(e) => void handleImportFileChange(e)}
                      ref={importInputRef}
                      tabIndex={-1}
                      type="file"
                    />
                    <div className="settingsDialog__dataActions">
                      <button
                        className="settingsDialog__exportBtn"
                        disabled={exportBusy || importBusy}
                        onClick={() => void handleExportDb()}
                        type="button"
                      >
                        <Database aria-hidden size={18} />
                        {exportBusy ? t('settingsExporting') : t('settingsExportDb')}
                      </button>
                      <button
                        className="settingsDialog__importBtn"
                        disabled={exportBusy || importBusy}
                        onClick={() => handleImportPickClick()}
                        type="button"
                      >
                        <Database aria-hidden size={18} />
                        {importBusy ? t('settingsImporting') : t('settingsImportDb')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Dialog.Description asChild>
                    <p className="settingsDialog__panelIntro">{t('settingsCategoriesIntro')}</p>
                  </Dialog.Description>

                  <div className="settingsDialog__categoryNew">
                    <div className="settingsDialog__fieldLabel" id="settings-new-category-icon">
                      {t('settingsCategoryIconLabel')}
                    </div>
                    <CategoryIconPicker
                      disabled={busy}
                      labelledBy="settings-new-category-icon"
                      onChange={setNewIcon}
                      value={newIcon}
                    />
                    <p className="settingsDialog__fieldHint">{t('settingsCategoryIconHint')}</p>
                    <div className="settingsDialog__addRow">
                      <input
                        className="settingsDialog__input"
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleAdd();
                          }
                        }}
                        placeholder={t('settingsNewCategoryPlaceholder')}
                        value={newName}
                      />
                      <button
                        className="settingsDialog__addBtn"
                        disabled={busy || !newName.trim()}
                        onClick={() => void handleAdd()}
                        type="button"
                      >
                        <Plus aria-hidden size={16} strokeWidth={2.25} />
                        <span>{t('settingsAddCategory')}</span>
                      </button>
                    </div>
                  </div>

                  <ul className="settingsDialog__list">
                    {categories.length === 0 ? (
                      <li className="settingsDialog__empty">{t('settingsNoCategoriesYet')}</li>
                    ) : (
                      categories.map((cat) => {
                        const RowIcon = getCategoryIconComponent(cat.icon);
                        return (
                          <li className="settingsDialog__row" key={cat.id}>
                            {editingId === cat.id ? (
                              <div className="settingsDialog__rowEdit">
                                <div
                                  className="settingsDialog__fieldLabel"
                                  id={`edit-category-icon-${cat.id}`}
                                >
                                  {t('settingsCategoryIconLabel')}
                                </div>
                                <CategoryIconPicker
                                  disabled={busy}
                                  labelledBy={`edit-category-icon-${cat.id}`}
                                  onChange={setEditIcon}
                                  value={editIcon}
                                />
                                <div className="settingsDialog__editInline">
                                  <input
                                    ref={editInputRef}
                                    className="settingsDialog__input settingsDialog__input--grow"
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void handleSaveEdit(cat.id);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingId(null);
                                      }
                                    }}
                                    value={editValue}
                                  />
                                  <button
                                    className="settingsDialog__iconBtn"
                                    disabled={busy}
                                    onClick={() => void handleSaveEdit(cat.id)}
                                    type="button"
                                  >
                                    {t('save')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="settingsDialog__rowIcon" title={cat.icon}>
                                  <RowIcon aria-hidden size={17} strokeWidth={2} />
                                </span>
                                <span className="settingsDialog__categoryName">{cat.name}</span>
                                <span className="settingsDialog__categoryMeta">
                                  {t('settingsCategoryTaskCount', {
                                    count: taskCountByCategoryId[cat.id] ?? 0,
                                  })}
                                </span>
                                <button
                                  aria-label={t('settingsRenameCategory')}
                                  className="settingsDialog__iconBtn"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditingId(cat.id);
                                    setEditValue(cat.name);
                                    setEditIcon(cat.icon);
                                  }}
                                  type="button"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  aria-label={t('delete')}
                                  className="settingsDialog__iconBtn settingsDialog__iconBtn--danger"
                                  disabled={busy}
                                  onClick={() => void handleDelete(cat.id, cat.name)}
                                  type="button"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
