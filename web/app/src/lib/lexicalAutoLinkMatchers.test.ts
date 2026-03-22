import {describe, expect, it} from 'vitest';
import {LEXICAL_AUTO_LINK_MATCHERS} from './lexicalAutoLinkMatchers';

describe('LEXICAL_AUTO_LINK_MATCHERS', () => {
  const [httpsMatcher, wwwMatcher] = LEXICAL_AUTO_LINK_MATCHERS;

  it('https matcher finds URL in a sentence', () => {
    const text = 'see https://example.com/path for more ';
    const match = httpsMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.url).toBe('https://example.com/path');
    expect(match?.text).toBe('https://example.com/path');
  });

  it('www matcher prefixes https', () => {
    const text = 'visit www.example.org/x ';
    const match = wwwMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.url).toBe('https://www.example.org/x');
  });

  it('matches multi-label hosts (.co.uk)', () => {
    const text = 'link https://www.gov.uk/browse ';
    const match = httpsMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.url).toBe('https://www.gov.uk/browse');
  });

  it('matches long TLDs', () => {
    const text = 'x https://snap.example.photography/albums ';
    const match = httpsMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.url).toBe('https://snap.example.photography/albums');
  });

  it('trims trailing sentence punctuation from URL', () => {
    const text = 'read https://example.com/page.';
    const match = httpsMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.text).toBe('https://example.com/page');
    expect(match?.length).toBe(match?.text.length);
  });

  it('allows ! in path (query tokens)', () => {
    const text = 'u https://example.com/path?q=a&b=! ';
    const match = httpsMatcher(text);
    expect(match).not.toBeNull();
    expect(match?.url).toContain('!');
  });
});
