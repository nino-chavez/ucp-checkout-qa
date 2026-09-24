# Asset render standard — ucp-checkout-qa

Covers the tutorial walkthrough (video and click-through) and any other rendered asset from this
repo. Adopted from render-kit's template on September 24, 2026. The machinery —
`~/.claude/hooks/render-dispatch-guard.py` and the three `~/.claude/agents/render-*.md` tier agents —
finds this file by walking up from the working directory. Its presence is what turns routing on.

Same three-part shape as any standard: a **rule**, a **source of fact**, and a **check**.

## Render work is dispatched, not done inline

**Rule R-0.** An agent does not render assets in its own main loop. It reads this standard, names
the tier, and dispatches to the matching agent at `~/.claude/agents/`. The model switch happens only
at that dispatch — a main loop never changes model mid-session.

**Check.** Mechanical. `render-dispatch-guard.py` denies the first inline `render-kit` execution per
session in any repo carrying this file. Orientation reads and self-test runs are never denied. The
deny fires once and the retry passes.

> **Scope caveat.** This repo renders through `render-kit walkthrough` only, so the hook covers it.
> The September 24 draft was built with `tools/demo-reel-portable` before this file existed; that
> path is not recognized by the hook, and R-0 is advisory for it.

## Tiers

**Rule R-1.** Route on **who or what catches a wrong answer**, never on the task's name.

| Who catches a wrong answer | Tier | Model |
|---|---|---|
| A mechanical gate — self-test, contract test, pixel diff | Mechanical | `haiku` |
| A gate exists, but the work is real editing | Standard | `sonnet` |
| A person judges it on appearance, or failure is silent | Judged | `opus` |

**Rule R-2.** A task takes the **highest** tier any row matches. Nothing de-escalates mid-task.

**Check.** Before dispatch, name the command that would fail if the output were wrong. If you cannot
name one, the task is Judged.

## Gates that run at every tier

**Rule R-3.** Tier changes the model. It changes nothing here. Cheaper does not mean looser.

0. **Rendering is not approval.** Nino Chavez approves before a coworker or anyone outside the
   repo sees an asset. A local render is a draft.
1. **People and personal data.** No tester address, phone, email, card digits, account picture, or
   the list of the tester's other Claude chats may be readable in any frame. The test chat's own
   title and the Buy link's `uuld=` location parameter are allowed. Blur them in the stills before rendering. A first
   name in a greeting is allowed.
2. **Money.** Only amounts observed in the recorded run may appear, and captions must match the
   frames they sit on. The source is the run's own chat result and the merchant's checkout page in
   the capture; nothing is typed from memory.
3. **Type and color.** No brand kit exists for this repo. Use render-kit's stock template and do
   not invent a palette. The frames show Google, KONG, and Anthropic interfaces as they are.
4. **Fact provenance.** Steps, button labels, and product names come from the recorded capture
   and `docs/claude-setup.md`. A caption may not describe an action the capture does not show.

**Check.** Gate 1: the renderer checks full-resolution frames from the rendered file, then Nino.
Gates 0, 2, 3 and 4: Nino, when watching the draft. No machine enforces any of them yet.

## Escalation

**Rule R-4.** A Mechanical or Standard dispatch stops and re-dispatches at Judged if the self-test
fails in a way it cannot localize in one edit, the task turns out to touch copy or a price or a date
or a photograph, or the output is headed outside the repo.

## What would change this standard

Tutorial renders are Judged: people read the copy and prices, and a leaked address is a silent
failure no command catches. A redaction check that fails on readable personal data in rendered frames
would move gate 1 to mechanical. A brand kit for this repo would replace gate 3's "no invented
palette" rule with that file.
