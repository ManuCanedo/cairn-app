# Foundation Review Design Document

**Date:** 2026-02-01
**Status:** Approved for implementation
**Scope:** Review and strengthen codebase foundations before feature development

---

## Executive Summary

This document captures the findings from a comprehensive review of the Cairn habits app foundations across 5 areas. The review identified **20 actionable tasks** that must be completed before resuming feature development (Tasks 005-007).

**Key findings:**

- Tests pass (172/172) with 100% coverage, but quality gates are incomplete
- Documentation has accuracy issues and redundancy
- No CI/CD pipeline exists
- Pre-commit hook doesn't run tests
- Token refresh mechanism designed but not implemented
- Agent workflow needs formalization for AI-driven development

---

## 1. Codebase Structure & Organization

### Current State

```
habits-app/
├── app/                    # Expo Router routes (3 files)
├── src/
│   ├── components/         # UI components (Calendar/, ui/)
│   ├── services/           # API services (google-auth, google-calendar)
│   ├── store/              # Zustand stores (auth.ts)
│   ├── types/              # TypeScript types
│   ├── config/             # Configuration
│   └── __tests__/          # All tests centralized
├── assets/
└── docs/
```

### Decision: Keep Current Structure

**Rationale:** With 837 lines of production code, restructuring is premature optimization. The principal architect recommended waiting until 2-3 features are implemented to see what code actually clusters together.

### Concrete Issues to Fix

| Issue                | Location                    | Task |
| -------------------- | --------------------------- | ---- |
| 401 side effect      | `google-calendar.ts:49`     | #1   |
| Route doing too much | `app/index.tsx` (140 lines) | #1   |
| Error boundary gap   | Calendar component          | #1   |

---

## 2. Testing Infrastructure

### Current State

- Jest 30 with `jest-expo/web` preset
- 172 tests passing, 100% coverage
- Tests in `src/__tests__/` mirroring source structure
- Pre-commit runs lint + typecheck only

### Critical Gaps

| Gap                          | Impact                            | Task |
| ---------------------------- | --------------------------------- | ---- |
| Pre-commit doesn't run tests | Broken code can be committed      | #3   |
| No CI pipeline               | No multi-environment verification | #4   |
| Zero integration tests       | Component interactions untested   | #6   |
| No E2E tests                 | User flows untested               | #7   |
| Coverage-gaming tests exist  | False confidence                  | #8   |

### Test Pyramid Target

```
          /\        <- 10 E2E tests (critical paths)
         /  \
        /    \      <- 30 integration tests
       /      \
      /________\    <- 100 unit tests (behavior-focused)
```

### AI Agent Test Rules

Add to DEVELOPMENT.md:

1. No coverage-only tests - every test must assert behavior
2. Mock at boundaries only - never mock internal components
3. Test user behavior - use `getByRole`, not `getByTestId`
4. Include failure cases - every error path needs tests
5. Verify state changes - assert both state AND rendered output

---

## 3. Documentation Quality

### Current State

| Document                 | Lines | Status           |
| ------------------------ | ----- | ---------------- |
| PROJECT.md               | 134   | OK               |
| DEVELOPMENT.md           | 309   | Has false claims |
| SMOKE_TEST_PLAN.md       | 372   | OK               |
| MVP_ARCHITECTURE_PLAN.md | 816   | Stale            |
| DEV_TASKS.md             | 563   | Mixed languages  |
| BACKLOG.md               | 86    | Redundant, stale |
| CHANGELOG.md             | 63    | Abandoned        |

### Actions

| Action                                                 | Task |
| ------------------------------------------------------ | ---- |
| Delete BACKLOG.md (redundant with DEV_TASKS.md)        | #10  |
| Fix DEVELOPMENT.md false claims (80% integration → 0%) | #11  |
| Add staleness warning to MVP_ARCHITECTURE_PLAN.md      | #12  |
| Remove hardcoded credential from app.config.js         | #13  |
| Convert DEV_TASKS.md to full English                   | #14  |
| Create DOCUMENTATION_PROCESS.md                        | #15  |

---

## 4. Architecture Gaps

### Token Refresh (P0.1) - Designed

**Problem:** `isTokenExpired()` exists but is never called. Sessions >1 hour fail silently.

**Solution:** Platform-aware token strategy

- iOS/Android: Silent refresh using refresh tokens (stored in `expo-secure-store`)
- Web: Proactive re-authentication warning (no refresh tokens in implicit OAuth)

**New files:**

- `src/services/token-storage.ts` - Secure storage abstraction
- `src/services/token-refresh.ts` - Refresh logic with concurrency handling
- `src/hooks/useTokenWarning.ts` - Web expiry warning
- `src/hooks/useAppForeground.ts` - Foreground token check

**Modified files:**

- `src/services/google-auth.ts` - Add `access_type: offline`
- `src/services/google-calendar.ts` - Integrate `getValidToken()`
- `src/store/auth.ts` - Remove refreshToken from persist
- `app/index.tsx` - Add warning banner
- `app/_layout.tsx` - Add foreground check

**New dependency:**

```bash
npx expo install expo-secure-store
```

### Other Gaps

| Gap                              | Priority | Task |
| -------------------------------- | -------- | ---- |
| iOS/Android OAuth not configured | P1       | #17  |
| Offline caching not designed     | P2       | #18  |

---

## 5. Development Workflow

### Current State

- DEV_TASKS.md for task specs
- Conventional commits
- Pre-commit: lint + typecheck (no tests)
- No CI/CD
- No feature branch workflow

### Target Workflow for AI Agents

```
1. Create feature branch: git checkout -b feature/task-XXX
2. Create rollback point: git tag pre-task-XXX
3. Read task spec fully
4. Implement following constraints
5. Verify: npm run typecheck && npm test && npm run lint
6. Commit with structured message
7. Create PR
8. Human review for architecture changes
9. Squash merge to main
```

### Task Spec Template (Enhanced)

````markdown
## Task XXX: [Title] [STATUS]

### Context

[Why this task exists]

### Prerequisites

- Task NNN completed (need: `functionName` from `file.ts`)

### Objective

[1-2 sentences]

### Constraints (DO NOT VIOLATE)

- [ ] No new dependencies without approval
- [ ] Follow existing patterns in `similar-file.ts`
- [ ] Tests required - maintain 100% coverage

### Files to Create/Modify

| File | Action | Notes |
| ---- | ------ | ----- |

### Acceptance Criteria

- [ ] [Criterion]
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Tests pass: `npm test`

### Verification Commands

```bash
npm run typecheck && npm test && npm run lint
```
````

### Rollback Plan

[How to revert if task fails]

```

### Agent Orchestration Strategy: Hybrid

**Principle:** Sequential for dependent tasks, parallel via git worktrees for independent ones.

**Execution chains:**

```

Chain 1 (Foundation Fixes - Parallel worktree):
003, 004, 010-15

Chain 2 (Workflow Setup - Main):
019, 020, 021, 022

Chain 3 (Testing Infra - Parallel worktree):
006, 007, 008, 009

Chain 4 (Auth - Parallel worktree):
016 → 017

Chain 5 (Features - Main, after all above):
005 → 006 → 007

```

---

## Task Backlog (Prioritized)

### Phase 0: Critical Foundation (Parallel)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 3 | Fix pre-commit hook to run tests | P0 | 5 min |
| 4 | Add CI pipeline with GitHub Actions | P0 | 30 min |
| 13 | Remove hardcoded credential fallback | P0 | 10 min |
| 10 | Delete BACKLOG.md and update references | P1 | 5 min |
| 11 | Fix false claims in DEVELOPMENT.md | P1 | 15 min |
| 12 | Add staleness warning to MVP_ARCHITECTURE_PLAN.md | P2 | 10 min |
| 14 | Convert DEV_TASKS.md to full English | P2 | 20 min |
| 15 | Create DOCUMENTATION_PROCESS.md | P2 | 20 min |

### Phase 1: Workflow Setup (Sequential)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 19 | Create AGENT_WORKFLOW.md | P0 | 30 min |
| 20 | Update DEV_TASKS.md task template | P0 | 30 min |
| 21 | Establish feature branch workflow | P0 | 15 min |
| 22 | Map task dependencies for parallel execution | P0 | 20 min |

### Phase 2: Testing Infrastructure (Parallel)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 6 | Add first integration test (auth persistence) | P1 | 45 min |
| 7 | Add Playwright E2E test setup | P1 | 60 min |
| 8 | Remove coverage-gaming tests | P2 | 30 min |
| 9 | Add AI agent test quality rules to DEVELOPMENT.md | P2 | 20 min |

### Phase 3: Auth Chain (Sequential)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 16 | Implement token refresh mechanism | P0 | 120 min |
| 17 | Configure iOS and Android OAuth credentials | P1 | 60 min |

### Phase 4: Architecture (Can defer)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Fix architectural issues (401 side effect, etc.) | P2 | 45 min |
| 18 | Design offline caching strategy | P2 | 60 min |

### Phase 5: Features (After foundation complete)

| Task | Priority |
|------|----------|
| DEV_TASKS 005: Activity Templates CRUD | Feature |
| DEV_TASKS 006: Activity Registration Flow | Feature |
| DEV_TASKS 007: Integration & Polish | Feature |

---

## Completed Tasks

| # | Task | Completed |
|---|------|-----------|
| 2 | Fix 30 failing tests | 2026-02-01 (were already passing) |
| 5 | Fix coverage threshold | 2026-02-01 (was already at 100%) |

---

## Implementation Plan

### Recommended Execution Order

```

Week 1: Foundation & Workflow
├── Day 1: Phase 0 (parallel) - fix pre-commit, CI, docs
├── Day 2: Phase 1 (sequential) - workflow setup
└── Day 3: Phase 2 (parallel) - testing infrastructure

Week 2: Auth & Architecture
├── Day 4-5: Phase 3 (sequential) - token refresh, OAuth
└── Day 6: Phase 4 - architecture fixes

Week 3+: Features
├── Task 005: Activity Templates
├── Task 006: Registration Flow
└── Task 007: Polish

````

### Parallel Execution Setup

```bash
# Create worktrees for parallel work
git worktree add ../habits-fixes -b fixes/foundation
git worktree add ../habits-testing -b feature/testing-infra
git worktree add ../habits-auth -b feature/auth-refresh

# Terminal 1: Foundation fixes
cd ../habits-fixes
# Run Claude Code for tasks 3, 4, 10-15

# Terminal 2: Testing infrastructure
cd ../habits-testing
# Run Claude Code for tasks 6-9

# Terminal 3: Auth chain
cd ../habits-auth
# Run Claude Code for tasks 16-17

# Main terminal: Workflow setup (must be in main)
cd /Users/manuel.canedo/Dev/personal/habits-app
# Run Claude Code for tasks 19-22
````

### Merge Order

1. Foundation fixes → main (PR review)
2. Workflow setup already in main
3. Testing infrastructure → main (PR review)
4. Auth chain → main (PR review)
5. Architecture fixes → main (PR review)
6. Begin feature work

---

## Open Questions

### Token Refresh Design

1. **Consent screen frequency:** Accept `prompt: 'consent'` every sign-in (guarantees refresh token) or only when refresh token is missing?
   - **Recommendation:** Only when missing (better UX)

2. **Web token expiry behavior:** Auto-logout on expiry or allow API call to fail naturally?
   - **Recommendation:** Show warning banner, let user choose to re-auth

### Deferred Decisions

- Offline caching strategy (defer to P2)
- Multi-device sync approach (defer to post-MVP)
- Dark mode implementation (defer to post-MVP)

---

## Success Criteria

Before starting feature work (Tasks 005-007), verify:

- [ ] Pre-commit runs tests (`npm test` in `.husky/pre-commit`)
- [ ] CI pipeline passes on push
- [ ] No hardcoded credentials in codebase
- [ ] BACKLOG.md deleted
- [ ] DEVELOPMENT.md accuracy fixed
- [ ] AGENT_WORKFLOW.md exists
- [ ] Task template updated with constraints
- [ ] At least 1 integration test exists
- [ ] Feature branch workflow documented

---

## Appendix: Principal Architect Reviews

### Review 1: Codebase Structure

- **Verdict:** Don't restructure now
- **Reason:** 837 LOC too small, wait for features to emerge

### Review 2: Testing Infrastructure

- **Verdict:** Critical gaps in quality gates
- **Key finding:** Pre-commit doesn't run tests

### Review 3: Documentation

- **Verdict:** 4/10 health score
- **Key finding:** Multiple false claims, redundant docs

### Review 4: Token Refresh Design

- **Verdict:** Platform-aware strategy approved
- **Key finding:** Web cannot have silent refresh (OAuth limitation)

### Review 5: Development Workflow

- **Verdict:** Hybrid orchestration recommended
- **Key finding:** Need explicit task dependencies and rollback points
