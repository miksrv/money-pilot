# Feature 12 — First-Time User Onboarding

## Goal

Guide new users through the minimum setup required to derive value from the app: create their first account, create their first category, and add their first transaction. Without this flow, new users land on a blank Dashboard with no guidance on what to do next.

---

## Trigger

Onboarding is shown to a user when ALL of the following are true:
- The user just completed registration (or navigates to Dashboard and has zero accounts AND zero transactions).
- The user has not previously dismissed the onboarding (tracked via `localStorage` key `'onboarding_complete'`).

---

## UI Design

### Option A — Welcome Banner (recommended for MVP)

Replace the empty Dashboard with a full-width welcome `Container` that includes:

1. **Header:** "Welcome to Monetka! Let's get you set up."
2. **Step list** (vertical, with checkmarks as steps complete):
   - Step 1: Add your first account ✗ → `Button "Add Account"` (opens account form inline)
   - Step 2: Create a spending category ✗ → `Button "Add Category"` (opens category form inline)
   - Step 3: Record your first transaction ✗ → `Button "Add Transaction"` (opens transaction form inline)
3. **Dismiss link** at the bottom: "Skip setup — I'll explore on my own"

Steps auto-check as their conditions are met (data refreshes via RTK Query cache).

Once all 3 steps are complete, show a success state: "You're all set! Here's your financial overview." and transition to the normal Dashboard.

### Option B — Dedicated Onboarding Route (future)

A multi-step wizard at `/onboarding` with a progress bar. More polish but more work. Consider for a future version when signup volume justifies it.

---

## Frontend Tasks

### New component: `client/src/components/onboarding-banner/OnboardingBanner.tsx`

Props:
```typescript
interface OnboardingBannerProps {
    hasAccounts: boolean
    hasCategories: boolean
    hasTransactions: boolean
    onDismiss: () => void
}
```

Renders the 3-step list. Checks each prop to show ✓ or ✗. Calls `onDismiss` on skip link click.

### Modified: `client/src/screens/dashboard/Dashboard.tsx`

- Check `accounts.length === 0 && transactions.length === 0` and `localStorage.getItem('onboarding_complete') !== 'true'`.
- If true, render `<OnboardingBanner>` at the top of the layout (above summary cards).
- Pass `hasAccounts`, `hasCategories`, `hasTransactions` derived from RTK Query data.
- `onDismiss` writes `'onboarding_complete'` to localStorage and hides the banner.

### New localStorage key

`'onboarding_complete'` — string `'true'` when user has dismissed or completed onboarding.

### i18n keys

```
onboarding.title
onboarding.subtitle
onboarding.step1
onboarding.step2
onboarding.step3
onboarding.step1_done
onboarding.step2_done
onboarding.step3_done
onboarding.dismiss
onboarding.complete_title
onboarding.complete_body
```

---

## Backend Tasks

None. All data comes from existing `listAccount`, `listCategories`, and `listTransactions` queries.

---

## Acceptance Criteria

- [ ] New user sees the onboarding banner on Dashboard after registration.
- [ ] Each step shows a checkmark as soon as its condition is met (no page refresh required).
- [ ] Dismiss hides the banner permanently (survives page reload via localStorage).
- [ ] Once all 3 steps are complete, banner shows a success state before fading out.
- [ ] Banner is not shown to existing users who already have data.
- [ ] Onboarding banner is responsive and usable at 320 px.
- [ ] All strings translated.
