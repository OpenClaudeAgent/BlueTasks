# Third-party licenses (MIT project compatibility)

BlueTasks is published under the [MIT License](../LICENSE). This document summarizes **dependency licenses** and how they interact with shipping MIT-licensed software.

**Disclaimer:** This is engineering due diligence, not legal advice. For corporate distribution or App Store–style review, have counsel validate.

---

## How MIT interacts with common OSS licenses

| License family                           | Typical compatibility with an MIT app   | Notes                                                                                                                                                   |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MIT, ISC, 0BSD, MIT-0**                | Compatible                              | Same spirit as your license.                                                                                                                            |
| **BSD-2-Clause, BSD-3-Clause**           | Compatible                              | Permissive; 3-clause has “no endorsement” clause.                                                                                                       |
| **Apache-2.0**                           | Compatible                              | Permissive. You should **retain NOTICE files** and attribute copyright where required.                                                                  |
| **BlueOak-1.0.0**                        | Compatible                              | Permissive (modern “gold” license).                                                                                                                     |
| **CC0-1.0**                              | Compatible                              | Public domain dedication.                                                                                                                               |
| **PSF / Python-2.0** (e.g. `argparse`)   | Generally treated as permissive         | OSI-approved; widely used in npm trees.                                                                                                                 |
| **MPL-2.0**                              | Usually OK for **npm-style** use        | File-level copyleft: MPL code stays under MPL; your code stays under MIT. Review if you **modify** MPL files or statically merge in unusual ways.       |
| **CC-BY-4.0** (e.g. `caniuse-lite` data) | OK with **attribution**                 | Browser compatibility **data**, not your app logic. Keep upstream attribution if you redistribute their data verbatim (e.g. in a legal notices bundle). |
| **GPL / AGPL / SSPL**                    | **High risk** for combined distribution | None flagged in our current `license-checker` summary; re-run after major dependency changes.                                                           |

---

## What we measured (repo-wide `license-checker`)

Command (from repo root):

```bash
npx license-checker@25.0.1 --summary
```

Approximate counts (dev + prod transitive tree, **2025-03** snapshot):

- **MIT** — majority of packages
- **ISC**, **Apache-2.0**, **BSD-2/3-Clause**, **0BSD**, **MIT-0**, **CC0-1.0**, **BlueOak-1.0.0** — permissive
- **MPL-2.0** — `axe-core` (pulled in by the **a11y lint** stack, not the browser runtime bundle)
- **CC-BY-4.0** — `caniuse-lite` (build-time / Browserslist data)
- **Python-2.0** — `argparse` (transitive; permissive PSF-style license on npm)
- **UNLICENSED** — `license-checker` often labels **`private: true` workspace packages** as `UNLICENSED` even when `"license": "MIT"` is set (it still prefers a LICENSE file). BlueTasks declares **MIT** in the root, `web/app`, and `server` `package.json` files; the canonical text remains [LICENSE](../LICENSE) at the repo root.

There were **no GPL / LGPL / AGPL** entries in that summary.

---

## Runtime vs build-time vs dev-only

| Layer                                 | What ships to users                                             | License focus                                                                      |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Browser**                           | Vite bundle (React, Lexical, Radix, etc.)                       | Permissive stack (mostly MIT / Apache-2.0 / BSD in practice).                      |
| **Server (Docker / `npm run start`)** | `express`, `better-sqlite3`, `cors`, `multer` + transitive deps | Permissive; **native** `better-sqlite3` follows its license + notice requirements. |
| **Build**                             | Vite, TypeScript, Browserslist, `caniuse-lite`                  | CC-BY data + standard toolchain licenses; not executed at runtime.                 |
| **CI / dev**                          | ESLint, Vitest, Playwright, `axe-core`, etc.                    | MPL for `axe-core` is relevant to **linting**, not the shipped SPA.                |

---

## Recommendations

1. **Re-run** `npx license-checker --summary` (or add a CI step) **after** upgrading major dependencies or adding native modules.
2. **Apache-2.0**: if you distribute a large binary release, consider a **`THIRD_PARTY_NOTICES.md`** aggregating required notices (optional but professional).
3. **`caniuse-lite` (CC-BY-4.0)**: if legal asks for strict compliance, mention Browserslist / Can I use attribution in that notices file.
4. **Never** assume “npm = all MIT”; always scan for **copyleft** or **non-commercial** licenses on dependency changes.

---

## Related docs

- [Testing strategy](testing-strategy.md) — quality gates (where ESLint / Playwright pull in dev-only tools).
