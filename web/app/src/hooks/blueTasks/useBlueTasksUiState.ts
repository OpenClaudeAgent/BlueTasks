import {useEffect, useState} from 'react';
import {CATEGORY_FILTER_ALL} from '../../types';
import type {CategoryFilter, SectionId} from '../../types';

const BOARD_SECTION_STORAGE_KEY = 'bluetasks.boardSection';
const BOARD_CATEGORY_FILTER_STORAGE_KEY = 'bluetasks.boardCategoryFilter';

const SECTION_IDS: readonly SectionId[] = ['today', 'upcoming', 'anytime', 'done', 'all'];

function readStoredSection(): SectionId {
  try {
    const raw = localStorage.getItem(BOARD_SECTION_STORAGE_KEY);
    if (raw && (SECTION_IDS as readonly string[]).includes(raw)) {
      return raw as SectionId;
    }
  } catch {
    /* private mode */
  }
  return 'today';
}

function readStoredCategoryFilter(): CategoryFilter {
  try {
    const raw = localStorage.getItem(BOARD_CATEGORY_FILTER_STORAGE_KEY);
    if (raw != null && raw !== '') {
      return raw;
    }
  } catch {
    /* private mode */
  }
  return CATEGORY_FILTER_ALL;
}

/** Sidebar / board chrome: filters, selection, loading and global error (not per-task saves). */
export function useBlueTasksUiState() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(readStoredCategoryFilter);
  const [selectedSection, setSelectedSection] = useState<SectionId>(readStoredSection);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [titleFocusTaskId, setTitleFocusTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_SECTION_STORAGE_KEY, selectedSection);
    } catch {
      /* private mode */
    }
  }, [selectedSection]);

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_CATEGORY_FILTER_STORAGE_KEY, categoryFilter);
    } catch {
      /* private mode */
    }
  }, [categoryFilter]);

  return {
    categoryFilter,
    setCategoryFilter,
    selectedSection,
    setSelectedSection,
    selectedTaskId,
    setSelectedTaskId,
    titleFocusTaskId,
    setTitleFocusTaskId,
    loading,
    setLoading,
    errorMessage,
    setErrorMessage,
  };
}
