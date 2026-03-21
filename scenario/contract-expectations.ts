import {expect} from '@playwright/test';
import {assertApiAreaRowContract, assertApiTaskRowContract} from '../contract/api-contract-validation.js';

export function expectApiTaskRow(t: unknown): void {
  expect(() => assertApiTaskRowContract(t)).not.toThrow();
}

export function expectApiAreaRow(t: unknown): void {
  expect(() => assertApiAreaRowContract(t)).not.toThrow();
}
