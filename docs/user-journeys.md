# User journeys

Reference names match the **English** UI (`sections.*` in locales). The sidebar sections are **Today**, **Upcoming**, **Anytime**, and **Done**, plus **Areas** filters and **Settings**.

---

## Quick capture

1. Open the app (single-column board + sidebar).
2. Use the **header quick-capture** field to type a title and press **Add** (or the equivalent control).
3. The new task appears in the list for the **current section** without leaving flow.
4. Optional: switch section in the sidebar to capture into another context (e.g. **Anytime** for unscheduled backlog).

## Today review

1. Select **Today** in the sidebar.
2. See **pending** tasks whose `taskDate` is **today or earlier** (overdue dates roll up here too).
3. **Mark complete** from the card header or open the card for detail.
4. **Reschedule** by changing the task date (follow-up date) when the card is expanded.
5. **Expand** a card to edit **title**, **notes** (Lexical rich text), **checklist**, **priority**, **pin**, **estimate**, **timer**, **recurrence**, and **area**.

## Anytime (backlog)

1. Select **Anytime** — lists **pending** tasks with **no `taskDate`** (unscheduled backlog).
2. Clarify titles and add notes so items are actionable later.
3. Leave tasks **undated** or set a **task date** when they should appear under **Today** or **Upcoming**.
4. Use **area** assignment (card or batch flows as implemented) so work groups under **Areas** in the sidebar.

## Upcoming

1. Select **Upcoming**.
2. See **pending** tasks whose `taskDate` is **strictly after** today (future-dated work only).
3. Open or expand a task to adjust date, priority, or area.
4. Move work into **Today** naturally as dates arrive or by editing `taskDate`.

## Done

1. Select **Done** to review **completed** tasks.
2. Toggle status back to pending if something was closed by mistake (behaviour as implemented on the card).

## Areas

1. In the sidebar, under **Areas**, choose **All areas**, **Unassigned**, or a **named area**.
2. The main list filters to tasks in that scope (and still respects the selected **section**: Today / Upcoming / Anytime / Done).
3. **Settings → Areas**: create, rename, pick **icon** (from the canonical icon set), delete (with confirmation if tasks are affected).

## Settings and data

1. Open **Settings** from the sidebar.
2. **General → Language**: switch **English / French**; preference is stored for the browser.
3. **General → Your data**: **Export** a full `.sqlite` backup; **Import** replaces the server database (destructive, confirmed).
4. Use export/import for backups, migration between machines, or Docker volumes.

## Deep work on a task (expanded card)

1. **Expand** the card (click chevron / header as per UI).
2. Edit **rich notes**, **checklist** progress, **time tracking** (elapsed + optional running timer).
3. Set **recurrence** when a task should repeat after completion (daily / weekly / etc., as supported).
4. Changes **autosave** with save indicators on the card when the server round-trip is in flight.

## First-time orientation

1. Read section **subtitles** under each main heading (they explain Today vs Upcoming vs Anytime).
2. Start from **Anytime** or **Today** depending on whether you are dumping inputs or executing the day.
3. Configure **language** and **areas** once in Settings so the sidebar matches your workflow.
