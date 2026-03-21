import {useState} from 'react';
import {AREA_FILTER_ALL} from '../../types';
import type {AreaFilter, SectionId} from '../../types';

/** Sidebar / board chrome: filters, selection, loading and global error (not per-task saves). */
export function useBlueTasksUiState() {
  const [areaFilter, setAreaFilter] = useState<AreaFilter>(AREA_FILTER_ALL);
  const [selectedSection, setSelectedSection] = useState<SectionId>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [titleFocusTaskId, setTitleFocusTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return {
    areaFilter,
    setAreaFilter,
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
