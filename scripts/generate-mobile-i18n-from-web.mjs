#!/usr/bin/env node
/**
 * Generates Compose Multiplatform string resources from web locale files
 * (web/app/src/locales/<lang>.ts). Keeps key parity with values/strings.xml.
 *
 * Run from repo root: node scripts/generate-mobile-i18n-from-web.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'web/app/src/locales');
const OUT_DIR = path.join(
  ROOT,
  'mobile/composeApp/src/commonMain/composeResources',
);
const BASE_STRINGS = path.join(OUT_DIR, 'values/strings.xml');

const LANGS = ['fr', 'de', 'es', 'it', 'nl', 'pl', 'pt', 'ja'];

/** Mobile-only or wording that must match the Android app (not 1:1 web copy). */
const MOBILE_EXTRA = {
  fr: {
    settings_content_desc: 'Ouvrir les paramètres',
    connect: 'Connexion',
    server_url_hint: 'URL du serveur (http://hôte:8787)',
    settings_data_intro:
      'URL du serveur pour cet appareil. Connectez-vous après un changement d’adresse.',
    section_nav_content_desc: 'Section du tableau',
    task_editor_title: 'Tâche',
    task_field_title: 'Titre',
    task_field_due_date: 'Valeur de la date',
    task_due_date_support:
      'AAAA-MM-JJ (UTC). Touchez le calendrier pour choisir, ou saisissez la date.',
    task_due_date_invalid: 'Date invalide — utilisez AAAA-MM-JJ.',
    task_date_shortcuts: 'Raccourcis',
    task_section_timer: 'Épingle et minuteur',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Temps passé : %1$s',
    task_estimate_min: 'Estimation (minutes)',
    task_estimate_menu_cd: 'Ouvrir la liste d’estimations',
    settings_delete_category_title: 'Supprimer la catégorie ?',
    settings_delete_category_message:
      'Supprimer « %1$s » ? Les tâches passeront sans catégorie.',
    settings_delete_category_with_tasks:
      'Supprimer « %1$s » ? Elle contient %2$d tâches ; elles passeront sans catégorie.',
    import_replace_title: 'Remplacer la base sur le serveur ?',
    import_replace_confirm: 'Remplacer',
    notes_checklist_progress: 'Checklist %1$d/%2$d',
    task_done: 'Terminé',
    task_undo: 'Annuler',
    task_delete: 'Supprimer la tâche',
    settings_rename: 'Renommer',
    settings_new_category: 'Nouvelle catégorie',
  },
  de: {
    settings_content_desc: 'Einstellungen öffnen',
    connect: 'Verbinden',
    server_url_hint: 'Server-URL (http://host:8787)',
    settings_data_intro:
      'Server-URL für dieses Gerät. Nach einer Adressänderung erneut verbinden.',
    section_nav_content_desc: 'Board-Bereich',
    task_editor_title: 'Aufgabe',
    task_field_title: 'Titel',
    task_field_due_date: 'Datumswert',
    task_due_date_support:
      'JJJJ-MM-TT (UTC). Kalender antippen oder eingeben.',
    task_due_date_invalid: 'Ungültiges Datum — JJJJ-MM-TT verwenden.',
    task_date_shortcuts: 'Schnellauswahl',
    task_section_timer: 'Anheften & Timer',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Zeitaufwand: %1$s',
    task_estimate_min: 'Schätzung (Minuten)',
    task_estimate_menu_cd: 'Schätzungsliste öffnen',
    settings_delete_category_title: 'Kategorie löschen?',
    settings_delete_category_message:
      '„%1$s“ löschen? Aufgaben werden ohne Kategorie sein.',
    settings_delete_category_with_tasks:
      '„%1$s“ löschen? Sie enthält %2$d Aufgaben; diese werden ohne Kategorie sein.',
    import_replace_title: 'Server-Datenbank ersetzen?',
    import_replace_confirm: 'Ersetzen',
    notes_checklist_progress: 'Checkliste %1$d/%2$d',
    task_done: 'Erledigt',
    task_undo: 'Rückgängig',
    task_delete: 'Aufgabe löschen',
    settings_rename: 'Umbenennen',
    settings_new_category: 'Neue Kategorie',
  },
  es: {
    settings_content_desc: 'Abrir ajustes',
    connect: 'Conectar',
    server_url_hint: 'URL del servidor (http://host:8787)',
    settings_data_intro:
      'URL del servidor para este dispositivo. Vuelve a conectarte si cambias la dirección.',
    section_nav_content_desc: 'Sección del tablero',
    task_editor_title: 'Tarea',
    task_field_title: 'Título',
    task_field_due_date: 'Valor de la fecha',
    task_due_date_support:
      'AAAA-MM-DD (UTC). Toca el calendario o escribe la fecha.',
    task_due_date_invalid: 'Fecha no válida — usa AAAA-MM-DD.',
    task_date_shortcuts: 'Accesos rápidos',
    task_section_timer: 'Fijar y temporizador',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Tiempo dedicado: %1$s',
    task_estimate_min: 'Estimación (minutos)',
    task_estimate_menu_cd: 'Abrir lista de estimaciones',
    settings_delete_category_title: '¿Eliminar categoría?',
    settings_delete_category_message:
      '¿Eliminar «%1$s»? Las tareas quedarán sin categoría.',
    settings_delete_category_with_tasks:
      '¿Eliminar «%1$s»? Tiene %2$d tareas; quedarán sin categoría.',
    import_replace_title: '¿Reemplazar la base de datos del servidor?',
    import_replace_confirm: 'Reemplazar',
    notes_checklist_progress: 'Lista %1$d/%2$d',
    task_done: 'Hecho',
    task_undo: 'Deshacer',
    task_delete: 'Eliminar tarea',
    settings_rename: 'Renombrar',
    settings_new_category: 'Nueva categoría',
  },
  it: {
    settings_content_desc: 'Apri impostazioni',
    connect: 'Connetti',
    server_url_hint: 'URL del server (http://host:8787)',
    settings_data_intro:
      'URL del server per questo dispositivo. Riconnettiti dopo aver cambiato indirizzo.',
    section_nav_content_desc: 'Sezione bacheca',
    task_editor_title: 'Attività',
    task_field_title: 'Titolo',
    task_field_due_date: 'Valore data',
    task_due_date_support:
      'AAAA-MM-GG (UTC). Tocca il calendario o digita la data.',
    task_due_date_invalid: 'Data non valida — usa AAAA-MM-GG.',
    task_date_shortcuts: 'Scorciatoie',
    task_section_timer: 'Fissa e timer',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Tempo trascorso: %1$s',
    task_estimate_min: 'Stima (minuti)',
    task_estimate_menu_cd: 'Apri elenco stime',
    settings_delete_category_title: 'Eliminare la categoria?',
    settings_delete_category_message:
      'Eliminare «%1$s»? Le attività diventeranno senza categoria.',
    settings_delete_category_with_tasks:
      'Eliminare «%1$s»? Contiene %2$d attività; diventeranno senza categoria.',
    import_replace_title: 'Sostituire il database sul server?',
    import_replace_confirm: 'Sostituisci',
    notes_checklist_progress: 'Checklist %1$d/%2$d',
    task_done: 'Fatto',
    task_undo: 'Annulla',
    task_delete: 'Elimina attività',
    settings_rename: 'Rinomina',
    settings_new_category: 'Nuova categoria',
  },
  nl: {
    settings_content_desc: 'Instellingen openen',
    connect: 'Verbinden',
    server_url_hint: 'Server-URL (http://host:8787)',
    settings_data_intro:
      'Server-URL voor dit apparaat. Maak opnieuw verbinding na een adreswijziging.',
    section_nav_content_desc: 'Bordsectie',
    task_editor_title: 'Taak',
    task_field_title: 'Titel',
    task_field_due_date: 'Datumwaarde',
    task_due_date_support:
      'JJJJ-MM-DD (UTC). Tik op de kalender of typ de datum.',
    task_due_date_invalid: 'Ongeldige datum — gebruik JJJJ-MM-DD.',
    task_date_shortcuts: 'Snelle keuzes',
    task_section_timer: 'Vastmaken & timer',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Bestede tijd: %1$s',
    task_estimate_min: 'Schatting (minuten)',
    task_estimate_menu_cd: 'Schattingenlijst openen',
    settings_delete_category_title: 'Categorie verwijderen?',
    settings_delete_category_message:
      '«%1$s» verwijderen? Taken worden zonder categorie.',
    settings_delete_category_with_tasks:
      '«%1$s» verwijderen? Deze heeft %2$d taken; ze worden zonder categorie.',
    import_replace_title: 'Serverdatabase vervangen?',
    import_replace_confirm: 'Vervangen',
    notes_checklist_progress: 'Checklist %1$d/%2$d',
    task_done: 'Klaar',
    task_undo: 'Ongedaan maken',
    task_delete: 'Taak verwijderen',
    settings_rename: 'Hernoemen',
    settings_new_category: 'Nieuwe categorie',
  },
  pl: {
    settings_content_desc: 'Otwórz ustawienia',
    connect: 'Połącz',
    server_url_hint: 'Adres serwera (http://host:8787)',
    settings_data_intro:
      'Adres serwera dla tego urządzenia. Po zmianie adresu połącz się ponownie.',
    section_nav_content_desc: 'Sekcja tablicy',
    task_editor_title: 'Zadanie',
    task_field_title: 'Tytuł',
    task_field_due_date: 'Wartość daty',
    task_due_date_support:
      'RRRR-MM-DD (UTC). Dotknij kalendarza lub wpisz datę.',
    task_due_date_invalid: 'Nieprawidłowa data — użyj RRRR-MM-DD.',
    task_date_shortcuts: 'Szybkie ustawienia',
    task_section_timer: 'Przypięcie i minutnik',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Czas: %1$s',
    task_estimate_min: 'Szacunek (minuty)',
    task_estimate_menu_cd: 'Otwórz listę szacunków',
    settings_delete_category_title: 'Usunąć kategorię?',
    settings_delete_category_message:
      'Usunąć „%1$s”? Zadania staną się bez kategorii.',
    settings_delete_category_with_tasks:
      'Usunąć „%1$s”? Ma %2$d zadania; staną się bez kategorii.',
    import_replace_title: 'Zastąpić bazę na serwerze?',
    import_replace_confirm: 'Zastąp',
    notes_checklist_progress: 'Lista %1$d/%2$d',
    task_done: 'Gotowe',
    task_undo: 'Cofnij',
    task_delete: 'Usuń zadanie',
    settings_rename: 'Zmień nazwę',
    settings_new_category: 'Nowa kategoria',
  },
  pt: {
    settings_content_desc: 'Abrir definições',
    connect: 'Ligar',
    server_url_hint: 'URL do servidor (http://host:8787)',
    settings_data_intro:
      'URL do servidor para este dispositivo. Volte a ligar após alterar o endereço.',
    section_nav_content_desc: 'Secção do quadro',
    task_editor_title: 'Tarefa',
    task_field_title: 'Título',
    task_field_due_date: 'Valor da data',
    task_due_date_support:
      'AAAA-MM-DD (UTC). Toque no calendário ou escreva a data.',
    task_due_date_invalid: 'Data inválida — use AAAA-MM-DD.',
    task_date_shortcuts: 'Atalhos',
    task_section_timer: 'Fixar e temporizador',
    task_date_picker_confirm: 'OK',
    task_time_spent: 'Tempo gasto: %1$s',
    task_estimate_min: 'Estimativa (minutos)',
    task_estimate_menu_cd: 'Abrir lista de estimativas',
    settings_delete_category_title: 'Eliminar categoria?',
    settings_delete_category_message:
      'Eliminar «%1$s»? As tarefas ficam sem categoria.',
    settings_delete_category_with_tasks:
      'Eliminar «%1$s»? Tem %2$d tarefas; ficam sem categoria.',
    import_replace_title: 'Substituir a base de dados no servidor?',
    import_replace_confirm: 'Substituir',
    notes_checklist_progress: 'Lista %1$d/%2$d',
    task_done: 'Feito',
    task_undo: 'Desfazer',
    task_delete: 'Eliminar tarefa',
    settings_rename: 'Renomear',
    settings_new_category: 'Nova categoria',
  },
  ja: {
    settings_content_desc: '設定を開く',
    connect: '接続',
    server_url_hint: 'サーバーURL（http://ホスト:8787）',
    settings_data_intro:
      'この端末のサーバーURLです。アドレスを変更したら再接続してください。',
    section_nav_content_desc: 'ボードのセクション',
    task_editor_title: 'タスク',
    task_field_title: 'タイトル',
    task_field_due_date: '日付',
    task_due_date_support:
      'YYYY-MM-DD（UTC）。カレンダーで選ぶか入力してください。',
    task_due_date_invalid: '日付が無効です。YYYY-MM-DD で入力してください。',
    task_date_shortcuts: 'クイック選択',
    task_section_timer: 'ピンとタイマー',
    task_date_picker_confirm: 'OK',
    task_time_spent: '記録時間：%1$s',
    task_estimate_min: '見積り（分）',
    task_estimate_menu_cd: '見積りリストを開く',
    settings_delete_category_title: 'カテゴリを削除しますか？',
    settings_delete_category_message:
      '「%1$s」を削除しますか？タスクは未分類になります。',
    settings_delete_category_with_tasks:
      '「%1$s」を削除しますか？%2$d 件のタスクがあり、未分類になります。',
    import_replace_title: 'サーバーのデータベースを置き換えますか？',
    import_replace_confirm: '置き換え',
    notes_checklist_progress: 'チェックリスト %1$d/%2$d',
    task_done: '完了',
    task_undo: '戻す',
    task_delete: 'タスクを削除',
    settings_rename: '名前を変更',
    settings_new_category: '新しいカテゴリ',
  },
};

function readSingleQuoted(ts, start) {
  let i = start;
  let out = '';
  while (i < ts.length) {
    const c = ts[i];
    if (c === '\\') {
      i++;
      if (i >= ts.length) {
        break;
      }
      out += ts[i];
      i++;
      continue;
    }
    if (c === "'") {
      return out;
    }
    out += c;
    i++;
  }
  return null;
}

function readDoubleQuoted(ts, start) {
  let i = start;
  let out = '';
  while (i < ts.length) {
    const c = ts[i];
    if (c === '\\') {
      i++;
      if (i >= ts.length) {
        break;
      }
      out += ts[i];
      i++;
      continue;
    }
    if (c === '"') {
      return out;
    }
    out += c;
    i++;
  }
  return null;
}

function extractKey(ts, key) {
  if (!ts) {
    return null;
  }
  const re = new RegExp(`\\b${key}:\\s*`);
  const m = re.exec(ts);
  if (!m) {
    return null;
  }
  let i = m.index + m[0].length;
  while (i < ts.length && /\s/.test(ts[i])) {
    i++;
  }
  if (ts[i] === "'") {
    return readSingleQuoted(ts, i + 1);
  }
  if (ts[i] === '"') {
    return readDoubleQuoted(ts, i + 1);
  }
  return null;
}

function extractBracedBlock(ts, key) {
  const re = new RegExp(`\\b${key}:\\s*\\{`);
  const m = re.exec(ts);
  if (!m) {
    return null;
  }
  let i = m.index + m[0].length;
  let depth = 1;
  const start = i;
  while (i < ts.length && depth > 0) {
    const c = ts[i];
    if (c === "'" || c === '"') {
      const q = c;
      i++;
      while (i < ts.length) {
        if (ts[i] === '\\') {
          i += 2;
          continue;
        }
        if (ts[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
    }
    i++;
  }
  return ts.slice(start, i - 1);
}

function replaceCount(s) {
  return s.replaceAll('{{count}}', '%1$d');
}

function replaceMinutes(s) {
  return s.replaceAll('{{minutes}}', '%1$d');
}

function parseResourceNames(xml) {
  const re = /<string name="([^"]+)">/g;
  const names = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function xmlEscapeInner(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, "\\'");
}

function buildRow(lang, ts, extra) {
  const sections = extractBracedBlock(ts, 'sections');
  const priorityShort = extractBracedBlock(ts, 'priorityShort');
  const editor = extractBracedBlock(ts, 'editor');
  const e = (k) => extractKey(ts, k);
  const s = (k) => extractKey(sections, k);
  const p = (k) => extractKey(priorityShort, k);
  const ed = (k) => extractKey(editor, k);

  return {
    app_name: e('appName'),
    settings: e('settingsTitle'),
    settings_content_desc: extra.settings_content_desc,
    connect: extra.connect,
    loading: e('loading'),
    server_url_hint: extra.server_url_hint,
    quick_capture_hint: e('quickCapturePlaceholder'),
    add_task: e('addTask'),
    general_tab: e('settingsSectionGeneral'),
    categories_tab: e('settingsSectionCategories'),
    export_db: e('settingsExportDb'),
    import_db: e('settingsImportDb'),
    notes_hint: e('notesTitle'),
    notes_preview_empty: e('emptyNoteHint'),
    notes_open_editor_desc: ed('richTextAriaLabel'),
    notes_checklist_progress: extra.notes_checklist_progress,

    section_today: s('today'),
    section_upcoming: s('upcoming'),
    section_anytime: s('anytime'),
    section_done: s('done'),
    section_all: s('all'),
    section_nav_content_desc: extra.section_nav_content_desc,

    filter_all: s('all'),
    filter_none: e('categoryNone'),
    task_done: extra.task_done,
    task_undo: extra.task_undo,
    task_open_content_desc: e('openTask'),

    task_editor_title: extra.task_editor_title,
    task_field_title: extra.task_field_title,
    task_section_due_date: e('dueDate'),
    task_field_due_date: extra.task_field_due_date,
    task_due_date_support: extra.task_due_date_support,
    task_due_date_invalid: extra.task_due_date_invalid,
    task_date_shortcuts: extra.task_date_shortcuts,
    task_section_priority: e('footerPriority'),
    task_section_timer: extra.task_section_timer,
    task_date_pick_cd: e('datePickerAriaLabel'),
    task_date_picker_confirm: extra.task_date_picker_confirm,
    task_date_today: e('today'),
    task_date_tomorrow: e('tomorrow'),
    task_date_in_one_week: e('nextWeek'),
    task_date_in_one_month: e('nextMonth'),
    task_date_clear: e('clearDate'),
    task_pin: e('pin'),
    task_timer_start: e('timerStart'),
    task_timer_stop: e('timerStop'),
    task_time_spent: extra.task_time_spent,
    task_section_estimate: e('footerEstimate'),
    task_estimate_none: e('footerNoEstimate'),
    task_estimate_menu_cd: extra.task_estimate_menu_cd,
    estimate_days: replaceCount(e('estimateDays')),
    estimate_hours: replaceCount(e('estimateHours')),
    estimate_minutes_short: replaceCount(e('estimateMinutesShort')),
    task_estimate_min: extra.task_estimate_min,
    task_recurrence: e('recurrence'),
    recurrence_none: e('recurrenceOff'),
    recurrence_daily: e('recurrenceDaily'),
    recurrence_weekly: e('recurrenceWeekly'),
    recurrence_biweekly: e('recurrenceBiweekly'),
    recurrence_monthly: e('recurrenceMonthly'),
    recurrence_yearly: e('recurrenceYearly'),
    task_category: e('categoryLabel'),
    task_delete: extra.task_delete,
    priority_low: p('low'),
    priority_normal: p('normal'),
    priority_high: p('high'),

    settings_new_category: extra.settings_new_category,
    settings_category_icon: e('settingsCategoryIconLabel'),
    settings_add_category: e('settingsAddCategory'),
    settings_rename: extra.settings_rename,
    settings_save: e('save'),
    settings_delete: e('delete'),
    settings_category_tasks_count: replaceCount(e('settingsCategoryTaskCount')),
    settings_delete_category_title: extra.settings_delete_category_title,
    settings_delete_category_message: extra.settings_delete_category_message,
    settings_delete_category_with_tasks: extra.settings_delete_category_with_tasks,
    cancel: e('cancel'),

    import_replace_title: extra.import_replace_title,
    import_replace_message: e('settingsImportDbHelp'),
    import_replace_confirm: extra.import_replace_confirm,

    settings_data_intro: extra.settings_data_intro,
  };
}

function emitStringsXml(rows) {
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
  ];
  for (const [name, value] of rows) {
    if (value == null || value === '') {
      throw new Error(`Missing string: ${name}`);
    }
    lines.push(`    <string name="${name}">${xmlEscapeInner(value)}</string>`);
  }
  lines.push('</resources>');
  return `${lines.join('\n')}\n`;
}

function main() {
  const baseXml = fs.readFileSync(BASE_STRINGS, 'utf8');
  const names = parseResourceNames(baseXml);
  if (names.length === 0) {
    throw new Error(`No strings found in ${BASE_STRINGS}`);
  }

  for (const lang of LANGS) {
    const tsPath = path.join(LOCALES_DIR, `${lang}.ts`);
    if (!fs.existsSync(tsPath)) {
      throw new Error(`Missing locale: ${tsPath}`);
    }
    const ts = fs.readFileSync(tsPath, 'utf8');
    const extra = MOBILE_EXTRA[lang];
    if (!extra) {
      throw new Error(`MOBILE_EXTRA missing for ${lang}`);
    }
    const rowObj = buildRow(lang, ts, extra);
    const rows = names.map((n) => {
      const v = rowObj[n];
      return [n, v];
    });
    const outFolder = path.join(OUT_DIR, `values-${lang}`);
    fs.mkdirSync(outFolder, { recursive: true });
    const outFile = path.join(outFolder, 'strings.xml');
    fs.writeFileSync(outFile, emitStringsXml(rows), 'utf8');
    console.warn(`Wrote ${outFile}`);
  }
}

main();
