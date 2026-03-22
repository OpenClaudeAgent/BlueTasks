import {type LinkMatcher} from '@lexical/link';

/** Strip common sentence punctuation mistakenly glued to the end of a URL (not `!`, often in query strings). */
function trimTrailingSentencePunct(url: string): string {
  return url.replace(/[.,;:]+$/u, '');
}

/**
 * Matchers for Lexical AutoLinkPlugin: `https://…` and `www.…` → auto link nodes.
 * Uses permissive patterns so multi-label hosts (e.g. `.co.uk`) and long TLDs work;
 * trailing `.` / `,` etc. are trimmed so boundaries stay valid for Lexical.
 */
const HTTP_URL_BODY = /https?:\/\/[^\s<>"'`[\]{}|\\^]+/i;

const WWW_BODY = /www\.[^\s<>"'`[\]{}|\\^]+/i;

function matchFromRegExp(text: string, re: RegExp, toUrl: (matched: string) => string): ReturnType<LinkMatcher> {
  const match = re.exec(text);
  if (match === null) {
    return null;
  }
  const raw = match[0];
  const trimmed = trimTrailingSentencePunct(raw);
  // Avoid turning `https://` alone into a link; allow short hosts (e.g. `http://x`).
  if (trimmed.startsWith('http') && trimmed.length < 9) {
    return null;
  }
  if (trimmed.startsWith('www.') && trimmed.length < 8) {
    return null;
  }
  return {
    index: match.index,
    length: trimmed.length,
    text: trimmed,
    url: toUrl(trimmed),
  };
}

const matchHttpUrl: LinkMatcher = (text) => matchFromRegExp(text, HTTP_URL_BODY, (u) => u);

const matchWwwUrl: LinkMatcher = (text) =>
  matchFromRegExp(text, WWW_BODY, (t) => `https://${t}`);

export const LEXICAL_AUTO_LINK_MATCHERS: LinkMatcher[] = [matchHttpUrl, matchWwwUrl];
