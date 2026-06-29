# UI/UX Redesign — Design Spec

**Date:** 2026-06-29  
**Status:** Approved

---

## Problem

All pages suffer from two compounding issues:

1. **Card-ception** — section containers, item cards, and the page background all share the same visual treatment (identical border colour, identical dark background). There is no visual depth order, so nothing reads as a hierarchy.
2. **No clear demarcations** — sections bleed into each other. A participant looking at the room page cannot instantly identify where "Votes" ends and "Messages" begins.

Additionally, the app is hardcoded to a dark theme with no light-mode support.

---

## Goals

- Restore a clear three-level visual hierarchy while keeping all cards.
- Add light / dark / system theme support.
- Fix a set of compounding bugs that make the current UI worse than it should be (scoped global button override, copy-pasted orb divs, missing label associations, OTP input not monospace).

---

## Visual Hierarchy

Three distinct levels replace the current single level:

| Level | Treatment |
|---|---|
| **Page** | Background only — no box, no border |
| **Section container** | Subtle tinted background (`bg-muted/30`), no border, `rounded-2xl`, generous padding, clear section heading above |
| **Item card** | Explicit border (`border-border`), contrasting card background (`bg-card`), `rounded-2xl` |

Section headings use a small uppercase eyebrow label + a `font-heading` `h2` so the section opener is immediately recognisable without relying on a box for contrast.

Spacing between top-level sections increases from `gap-8` to `gap-12` so sections breathe.

---

## Theme System

### Package

Install `next-themes`. No other theming library needed.

### Provider

Wrap `src/app/layout.tsx` in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`. The existing `.dark` class in `globals.css` already drives the dark tokens — `next-themes` toggles this class on `<html>`.

### Toggle component

New file: `src/components/theme-toggle.tsx`  
- Three-state cycle: system → light → dark → system  
- Icons: `ComputerDesktopIcon` / `SunIcon` / `MoonIcon` (Heroicons)  
- Placed inside `Breadcrumbs` on the right end — breadcrumbs appear on every page, so this gives universal access without a separate nav bar.

### CSS variable additions (`globals.css`)

Add two semantic surface tokens that respond to the active theme:

```css
:root {
  --color-surface: oklch(0.97 0 0);   /* light: near-white surface */
  --color-card: oklch(0.93 0 0);      /* light: slightly darker card */
}
.dark {
  --color-surface: oklch(0.13 0 0);   /* dark: #0f141d equivalent */
  --color-card: oklch(0.10 0 0);      /* dark: #0b1018 equivalent */
}
```

Replace every hardcoded dark colour in components:

| Hardcoded value | Replace with |
|---|---|
| `bg-[#0b0f15]` | `bg-background` |
| `bg-[#0f141d]` | `bg-[var(--color-surface)]` |
| `bg-[#0b1018]` | `bg-[var(--color-card)]` |
| `bg-[#101722]/95` | `bg-[var(--color-surface)]/95` |

### Background orbs in light mode

The glow orbs (cyan/violet/amber blurs) are appropriate in dark mode. In light mode they overpower the clean white background. Add a wrapper component `src/components/background-orbs.tsx` and render the orbs at reduced opacity in light mode using `dark:opacity-100 opacity-30`.

### Body background

```css
body {
  @apply bg-background text-foreground;
}
body.dark {
  background-color: #0b0f15;
  background-image: linear-gradient(...), var(--button-texture);
}
```

Light mode body is plain `bg-background` (white/near-white). No texture.

---

## Per-Page Changes

### `src/app/layout.tsx`
- Import and add `ThemeProvider` wrapper.
- Add `suppressHydrationWarning` to `<html>` (needed by `next-themes`).

### `src/app/globals.css`
- Scope the global button `!important` rule to `.button-surface` and `.button-surface-admin` only — remove `button` and `[data-slot="button"]` from that selector. This restores per-button colour classes (emerald Support, rose Oppose, white primary actions).
- Add `--color-surface` / `--color-card` variables for light and dark.
- Move dark-specific body background into a `.dark body` block.

### `src/components/background-orbs.tsx` (new)
- Extract the three `absolute` blur-circle divs into a single component.
- Accept an optional `variant` prop: `"default"` (3 orbs) | `"minimal"` (2 orbs, used on login/room-entry).
- Apply `opacity-30 dark:opacity-100` so orbs are subtle in light mode.

### `src/components/breadcrumbs.tsx`
- Add `ThemeToggle` button on the right end of the nav row.
- Replace hardcoded `text-white/60` and `border-white/10` with semantic tokens (`text-muted-foreground`, `border-border`).

### `src/app/page.tsx` (homepage)
- Replace hardcoded `text-white/*` opacities with semantic tokens.
- Feature cards on the right: keep structure, update to use `bg-[var(--color-surface)]` + `border-border`.

### `src/app/room/page.tsx` (room entry)
- Replace hardcoded input background and text colours with semantic tokens.
- Button already uses `.button-surface` so it's fine after the global fix.

### `src/app/auth/login/page.tsx`
- Add `htmlFor="email"` to the label and `id="email"` to the input (accessibility fix).
- Replace hardcoded colours with semantic tokens.

### `src/app/room/[code]/page.tsx` (participant access)
- Left info panel: the four cards (Room code, Method, After entry, email reminder) become a single `bg-[var(--color-surface)]` section container with all four pieces of info inside, separated by an internal divider — no nested card per item.
- Replace hardcoded dark colours with semantic tokens.

### `src/components/participant-access-form.tsx`
- Add `font-mono` to the OTP code input.
- Replace hardcoded colours with semantic tokens.

### `src/components/participant-room.tsx`
- **Section containers**: Change the outer `article.rounded-[2rem].bg-white/5` wrappers (Votes, Private Messages) to use `bg-[var(--color-surface)]/50` with no border, increase internal padding to `p-6`.
- The Messages section (currently inconsistently using `section` with no card) gets the same `bg-[var(--color-surface)]/50 rounded-2xl p-6` treatment to match.
- **Item cards**: Keep `rounded-2xl border border-border bg-[var(--color-card)]` — these are the actual cards that receive the card chrome.
- **Access summary stats**: keep the grid, replace `bg-[#0f141d]` with `bg-[var(--color-surface)]`.
- Replace hardcoded `text-white/*` and `bg-white/*` opacities with semantic tokens.

### `src/components/admin-shell.tsx`
- The outer `rounded-[2rem] border bg-white/5` wrapper: change to `bg-[var(--color-surface)]/40 rounded-2xl` with no border — making it a section container (level 2) rather than another item card.
- Replace hardcoded colours.

### `src/app/(protected)/admin/org/[code]/*.tsx` (admin pages)
- Replace `bg-[#0f141d]` card backgrounds with `bg-[var(--color-surface)]`.
- Replace `bg-[#0b1018]` nested backgrounds with `bg-[var(--color-card)]`.
- Replace `text-white/*` opacities with semantic tokens.

---

## Bug Fixes Included

| Bug | Fix |
|---|---|
| Global `button` `!important` override kills per-button colours | Scope rule to `.button-surface` only |
| Background orbs copy-pasted on every page | Extract to `<BackgroundOrbs />` |
| Admin login label not associated with input | Add `htmlFor`/`id` pair |
| OTP input not monospace | Add `font-mono` class |
| Dark body background applies in light mode | Move to `.dark body` block |

---

## Files Changed

| File | Type |
|---|---|
| `src/app/layout.tsx` | Modify |
| `src/app/globals.css` | Modify |
| `src/components/background-orbs.tsx` | New |
| `src/components/theme-toggle.tsx` | New |
| `src/components/breadcrumbs.tsx` | Modify |
| `src/app/page.tsx` | Modify |
| `src/app/room/page.tsx` | Modify |
| `src/app/room/[code]/page.tsx` | Modify |
| `src/app/auth/login/page.tsx` | Modify |
| `src/components/participant-access-form.tsx` | Modify |
| `src/components/participant-room.tsx` | Modify |
| `src/components/admin-shell.tsx` | Modify |
| `src/app/(protected)/admin/org/[code]/page.tsx` | Modify |
| `src/app/(protected)/admin/org/[code]/votes/page.tsx` | Modify |
| `src/app/(protected)/admin/org/[code]/messages/page.tsx` | Modify |
| `src/app/(protected)/admin/org/[code]/levels/page.tsx` | Modify |
| `src/app/(protected)/admin/org/[code]/participants/page.tsx` | Modify |

---

## Out of Scope

- No routing or data-fetching changes.
- No new features.
- No changes to Supabase schema or server actions.
