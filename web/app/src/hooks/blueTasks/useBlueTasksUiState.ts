import {useState} from 'react';
import {CATEGORY_FILTER_ALL} from '../../types';
import type {CategoryFilter, SectionId} from '../../types';

/** Sidebar / board chrome: filters, selection, loading and global error (not per-task saves). */
export function useBlueTasksUiState() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(CATEGORY_FILTER_ALL);
  const [selectedSection, setSelectedSection] = useState<SectionId>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [titleFocusTaskId, setTitleFocusTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
