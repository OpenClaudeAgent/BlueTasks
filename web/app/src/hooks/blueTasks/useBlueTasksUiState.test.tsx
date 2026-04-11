/** @vitest-environment jsdom */
import {beforeEach, describe, expect, it} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useBlueTasksUiState} from './useBlueTasksUiState';
import {CATEGORY_FILTER_ALL} from '../../types';

describe('Feature: useBlueTasksUiState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Scenario: Initial load — loading true until cleared by data hook', () => {
    const {result} = renderHook(() => useBlueTasksUiState());
    expect(result.current.loading).toBe(true);
    expect(result.current.categoryFilter).toBe(CATEGORY_FILTER_ALL);
    expect(result.current.selectedSection).toBe('today');
  });

  it('Scenario: User picks a section — setSelectedSection updates', () => {
    const {result} = renderHook(() => useBlueTasksUiState());
    act(() => {
      result.current.setSelectedSection('done');
    });
    expect(result.current.selectedSection).toBe('done');
  });

  it('Scenario: Section and category filters persist in localStorage', () => {
    const {result, unmount} = renderHook(() => useBlueTasksUiState());
    act(() => {
      result.current.setSelectedSection('upcoming');
      result.current.setCategoryFilter('uncategorized');
    });
    unmount();

    const {result: next} = renderHook(() => useBlueTasksUiState());
    expect(next.current.selectedSection).toBe('upcoming');
    expect(next.current.categoryFilter).toBe('uncategorized');
  });
});
