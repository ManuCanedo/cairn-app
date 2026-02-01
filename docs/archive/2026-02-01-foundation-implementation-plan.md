# Foundation Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all foundation tasks before resuming feature development (Tasks 005-007).

**Architecture:** Fix quality gates (pre-commit, CI), clean up documentation, establish AI agent workflow, then implement token refresh mechanism.

**Tech Stack:** Node.js, Jest, GitHub Actions, Playwright, expo-secure-store

---

## Phase 0: Critical Foundation Fixes

### Task 3: Fix Pre-commit Hook to Run Tests

**Files:**

- Modify: `.husky/pre-commit`

**Step 1: Read current pre-commit hook**

```bash
cat .husky/pre-commit
```

**Step 2: Update pre-commit hook to include tests**

Replace `.husky/pre-commit` content with:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run typecheck
npm test
```

**Step 3: Verify hook is executable**

```bash
chmod +x .husky/pre-commit
```

**Step 4: Test the hook works**

```bash
# Create a dummy change to trigger hook
echo "" >> README.md
git add README.md
git commit -m "test: verify pre-commit hook runs tests"
```

Expected: Commit succeeds after lint, typecheck, and tests pass.

**Step 5: Revert test commit if needed**

```bash
git reset --soft HEAD~1
git checkout README.md
```

**Step 6: Commit the hook change**

```bash
git add .husky/pre-commit
git commit -m "ci: add test execution to pre-commit hook

Ensures broken code cannot be committed by running full test suite
before each commit.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Add CI Pipeline with GitHub Actions

**Files:**

- Create: `.github/workflows/ci.yml`

**Step 1: Create workflows directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Create CI workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Lint
        run: npm run lint

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

**Step 3: Verify YAML syntax**

```bash
cat .github/workflows/ci.yml | head -20
```

**Step 4: Commit CI workflow**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for CI

Runs on push and PR to main/master:
- Type checking
- Test suite with coverage
- Linting
- Uploads coverage report as artifact

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 23: Configure GitHub Branch Protection for Master

**Files:**

- Remote configuration via `gh` CLI or browser

**Prerequisites:**

- Task 4 (CI Pipeline) must be complete and pushed
- Repository must be pushed to GitHub

**Step 1: Get repository info**

```bash
gh repo view --json nameWithOwner -q '.nameWithOwner'
```

**Step 2: Configure branch protection via gh CLI**

```bash
# Enable branch protection requiring PRs and status checks
gh api repos/{owner}/{repo}/branches/master/protection -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false
  },
  "restrictions": null
}
EOF
```

**Step 3: Verify protection is active**

```bash
gh api repos/{owner}/{repo}/branches/master/protection \
  -H "Accept: application/vnd.github+json" | jq '.required_pull_request_reviews'
```

Expected: Shows `required_approving_review_count` configured.

**Step 4: Test protection works**

```bash
# Try direct push (should fail)
echo "test" >> test-protection.txt
git add test-protection.txt
git commit -m "test: verify branch protection"
git push origin master
```

Expected: Push rejected with message about requiring PR.

**Step 5: Clean up test**

```bash
git reset --hard HEAD~1
```

**Alternative: Browser Automation (if gh CLI lacks permissions)**

If the gh CLI returns 403 Forbidden, use Chrome browser automation:

1. Navigate to: `https://github.com/{owner}/{repo}/settings/branches`
2. Click "Add branch protection rule"
3. Branch name pattern: `master`
4. Enable:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass before merging
   - [x] Require branches to be up to date before merging
   - Select status check: `test`
5. Click "Create" or "Save changes"

**Acceptance Criteria:**

- [ ] Direct push to master is blocked
- [ ] PRs are required for all changes
- [ ] CI status check must pass before merge

---

### Task 13: Remove Hardcoded Credential Fallback

**Files:**

- Modify: `app.config.js`
- Modify: `.env.example`

**Step 1: Read current app.config.js**

```bash
cat app.config.js
```

**Step 2: Remove hardcoded fallback from app.config.js**

Find and replace the googleClientId line. Change from:

```javascript
googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '200611301377-...',
```

To:

```javascript
googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
```

**Step 3: Add validation for required env var**

Add at the top of `app.config.js` after the imports:

```javascript
if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
  console.warn(
    'WARNING: EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set. ' +
      'Google OAuth will not work. See .env.example for setup instructions.'
  );
}
```

**Step 4: Update .env.example with clearer instructions**

Update `.env.example`:

```bash
# Google OAuth Credentials (REQUIRED)
# Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
# Create OAuth 2.0 Client ID for "Web application"
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Platform-specific OAuth credentials (optional, for native builds)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=

# Your Expo username (for OAuth redirect URI)
EXPO_PUBLIC_USERNAME=your-expo-username
```

**Step 5: Verify .env exists and has the value**

```bash
grep EXPO_PUBLIC_GOOGLE_CLIENT_ID .env | head -1
```

Expected: Shows the actual client ID (not the placeholder).

**Step 6: Commit changes**

```bash
git add app.config.js .env.example
git commit -m "security: remove hardcoded OAuth credential fallback

- Removed hardcoded Google Client ID from app.config.js
- Added warning when env var is missing
- Updated .env.example with setup instructions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Delete BACKLOG.md and Update References

**Files:**

- Delete: `docs/BACKLOG.md`
- Modify: `docs/PROJECT.md`

**Step 1: Check what references BACKLOG.md**

```bash
grep -r "BACKLOG" docs/
```

**Step 2: Delete BACKLOG.md**

```bash
rm docs/BACKLOG.md
```

**Step 3: Update PROJECT.md to point to DEV_TASKS.md**

Find any reference to BACKLOG.md in PROJECT.md and replace with DEV_TASKS.md.

Search for the line containing "BACKLOG" and update the reference.

**Step 4: Commit deletion**

```bash
git add docs/BACKLOG.md docs/PROJECT.md
git commit -m "docs: remove redundant BACKLOG.md

BACKLOG.md was 100% redundant with DEV_TASKS.md and severely outdated.
DEV_TASKS.md is now the single source of truth for task tracking.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Fix False Claims in DEVELOPMENT.md

**Files:**

- Modify: `docs/DEVELOPMENT.md`

**Step 1: Read current DEVELOPMENT.md**

```bash
cat docs/DEVELOPMENT.md | head -100
```

**Step 2: Fix integration test claim**

Find the line claiming "Integration Tests: 80%" and change to:

```markdown
| Integration Tests | 0% (not yet implemented) |
```

**Step 3: Fix CI/CD section**

Find the CI/CD section and add warning:

```markdown
## CI/CD Integration

> **NOTE**: CI/CD pipeline is now implemented via GitHub Actions.
> See `.github/workflows/ci.yml` for configuration.
```

**Step 4: Fix testing library reference**

Find reference to `@testing-library/react` and correct to `@testing-library/react-native`.

**Step 5: Commit fixes**

```bash
git add docs/DEVELOPMENT.md
git commit -m "docs: fix false claims in DEVELOPMENT.md

- Changed integration test claim from 80% to 0% (accurate)
- Updated CI/CD section to reflect GitHub Actions implementation
- Fixed testing library reference

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Add Staleness Warning to MVP_ARCHITECTURE_PLAN.md

**Files:**

- Modify: `docs/MVP_ARCHITECTURE_PLAN.md`

**Step 1: Add warning header at top of file**

Insert after the title:

```markdown
> **DOCUMENT STATUS**: Point-in-time architecture review from 2026-01-31.
> Many P0 issues have been resolved. Re-review needed before using as implementation guide.
>
> | Issue                      | Status                        |
> | -------------------------- | ----------------------------- |
> | P0.2 Hardcoded credentials | Partially fixed               |
> | P0.3 No ErrorBoundary      | **RESOLVED**                  |
> | P0.4 401 error handling    | **RESOLVED**                  |
> | P0.1 Token refresh         | Still valid - not implemented |
> | P2.7 Dead code files       | **RESOLVED** - files removed  |
```

**Step 2: Commit warning**

```bash
git add docs/MVP_ARCHITECTURE_PLAN.md
git commit -m "docs: add staleness warning to MVP_ARCHITECTURE_PLAN.md

Document is a point-in-time review. Many issues have been resolved
since it was written. Added status table showing current state.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Convert DEV_TASKS.md to Full English

**Files:**

- Modify: `docs/DEV_TASKS.md`

**Step 1: Identify Spanish content**

```bash
head -50 docs/DEV_TASKS.md
```

**Step 2: Translate header and intro**

Change:

```markdown
# Tareas de Desarrollo - Cairn

Este archivo contiene tareas...
```

To:

```markdown
# Development Tasks - Cairn

This file contains development tasks for Claude Code agents...
```

**Step 3: Translate section headers**

Change all Spanish headers:

- "Contexto" → "Context"
- "Objetivo" → "Objective"
- "Prerequisitos" → "Prerequisites"
- "Criterios de Aceptación" → "Acceptance Criteria"
- "Archivos a crear/modificar" → "Files to Create/Modify"
- "Notas de Implementación" → "Implementation Notes"
- "Solución Implementada" → "Implemented Solution"

**Step 4: Commit translation**

```bash
git add docs/DEV_TASKS.md
git commit -m "docs: convert DEV_TASKS.md to full English

Translated all Spanish headers and content to English for
consistency and better AI agent comprehension.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 15: Create DOCUMENTATION_PROCESS.md

**Files:**

- Create: `docs/DOCUMENTATION_PROCESS.md`

**Step 1: Create the file**

Create `docs/DOCUMENTATION_PROCESS.md`:

````markdown
# Documentation Maintenance Process

## Update Triggers

| Document           | Update When                          |
| ------------------ | ------------------------------------ |
| DEV_TASKS.md       | Starting or completing any task      |
| SMOKE_TEST_PLAN.md | After each test run, when UI changes |
| PROJECT.md         | Architectural changes only           |
| DEVELOPMENT.md     | Process changes only                 |
| CHANGELOG.md       | Each release                         |

## Verification Before Commit

Before committing documentation changes, verify:

1. **File paths exist**: All referenced files actually exist
2. **Commands work**: All `npm run` commands execute successfully
3. **Coverage claims match**: Run `npm run test:coverage` to verify numbers
4. **No aspirational content**: Don't present planned features as implemented

## AI Agent Requirements

After completing any task:

1. Check if related documentation needs updates
2. Flag stale documentation in commit messages
3. Update acceptance criteria checkboxes in DEV_TASKS.md

## Document Health Checks

Run periodically:

```bash
# Verify all file paths in docs exist
grep -roh "src/[^)\`\"' ]*" docs/ | sort -u | while read f; do
  [ ! -e "$f" ] && echo "Missing: $f"
done

# Verify npm commands work
grep -roh "npm run [a-z:]*" docs/ | sort -u | while read cmd; do
  $cmd --help >/dev/null 2>&1 || echo "Invalid: $cmd"
done
```
````

## Deprecation Process

When a document becomes obsolete:

1. Add staleness warning at top (like MVP_ARCHITECTURE_PLAN.md)
2. After 30 days with no updates, move to `docs/archive/`
3. After 90 days in archive, delete

````

**Step 2: Commit the file**

```bash
git add docs/DOCUMENTATION_PROCESS.md
git commit -m "docs: create DOCUMENTATION_PROCESS.md

Establishes rules for keeping documentation in sync with code:
- Update triggers for each document
- Verification checklist before commits
- AI agent requirements
- Document health checks
- Deprecation process

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

## Phase 1: Workflow Setup

### Task 19: Create AGENT_WORKFLOW.md

**Files:**

- Create: `docs/AGENT_WORKFLOW.md`

**Step 1: Create the workflow document**

Create `docs/AGENT_WORKFLOW.md`:

````markdown
# AI Agent Development Workflow

## Before Starting Any Task

### 1. Create Feature Branch

```bash
git checkout -b feature/task-XXX
git tag pre-task-XXX
```
````

### 2. Read Task Spec Fully

- Open relevant task in `docs/DEV_TASKS.md` or task system
- Understand all acceptance criteria
- Identify files to create/modify
- Note any constraints

### 3. Check Prerequisites

- Verify dependent tasks are complete
- Ensure required interfaces exist
- Run `npm test` to confirm baseline passes

## During Task Execution

### Follow TDD Cycle

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve while keeping tests green

### Constraints (Always Apply)

- No new dependencies without explicit approval
- Follow existing patterns (check similar files)
- Maintain 100% test coverage
- Match existing error handling patterns
- No console.log in production code

### When Uncertain

**STOP and ask for human review if:**

- Task requires architectural decision not in spec
- Multiple valid approaches exist
- New dependency seems necessary
- Acceptance criteria are ambiguous
- You're about to modify >5 files

## Verifying Completion

### Run All Checks

```bash
npm run typecheck && npm test && npm run lint
```

All must pass before committing.

### Verify Acceptance Criteria

Check each criterion in task spec:

- [ ] Criterion met? Test it manually if needed
- [ ] Tests cover the new code?
- [ ] No regressions introduced?

## Committing Changes

### Commit Message Format

```
type(scope): short description

## Changes
- What was added/modified

## Decisions
- Why this approach was chosen (if non-obvious)

## Verification
- npm run typecheck: PASS
- npm test: PASS
- Manual test: [what you tested]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding tests
- `docs`: Documentation only
- `ci`: CI/CD changes
- `chore`: Maintenance

## Creating Pull Request

```bash
git push -u origin feature/task-XXX
gh pr create --title "feat: task XXX description" --body "..."
```

### PR Requires Human Review If:

- Architecture changes
- New dependencies added
- API contract changes
- Security-related changes

## Recovery from Mistakes

### If Tests Fail After Changes

```bash
git stash
npm test  # Verify baseline passes
git stash pop
# Fix the failing tests
```

### If Task Goes Wrong

```bash
git reset --hard pre-task-XXX
git checkout main
git branch -D feature/task-XXX
git tag -d pre-task-XXX
```

### If Committed Bad Code

```bash
git revert HEAD
# Or for multiple commits:
git reset --soft pre-task-XXX
git checkout .
```

````

**Step 2: Commit the workflow**

```bash
git add docs/AGENT_WORKFLOW.md
git commit -m "docs: create AGENT_WORKFLOW.md for AI agents

Comprehensive workflow guide for AI-driven development:
- Task setup (branch, tag, prerequisites)
- TDD cycle and constraints
- Verification procedures
- Commit message format
- PR process
- Recovery procedures

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

### Task 20: Update DEV_TASKS.md Task Template

**Files:**

- Modify: `docs/DEV_TASKS.md`

**Step 1: Add enhanced template section**

Add at the top of DEV_TASKS.md after the intro:

`````markdown
## Task Template

Use this template for all new tasks:

````markdown
## Task XXX: [Title] [STATUS]

### Context

[Why this task exists. What problem it solves.]

### Prerequisites

- Task NNN completed (specifically need: `functionName` from `file.ts`)

### Objective

[1-2 sentences max]

### Constraints (DO NOT VIOLATE)

- [ ] No new dependencies without explicit approval
- [ ] Follow existing patterns in `[similar-file.ts]`
- [ ] Tests required - maintain 100% coverage
- [ ] Error handling must match existing patterns

### Files to Create/Modify

| File                              | Action | Notes         |
| --------------------------------- | ------ | ------------- |
| `src/path/file.ts`                | Create | Description   |
| `src/__tests__/path/file.test.ts` | Create | Test coverage |

### Acceptance Criteria

- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Tests pass: `npm test`
- [ ] Lint passes: `npm run lint`

### Verification Commands

```bash
npm run typecheck && npm test && npm run lint
```
````
`````

```

### Rollback Plan

If task fails: `git reset --hard pre-task-XXX`
Files to delete if abandoning: [list files]

```

````

**Step 2: Update existing pending tasks (005-007) with new sections**

For each of Tasks 005, 006, 007, add:
- Constraints section
- Verification Commands section
- Rollback Plan section

**Step 3: Commit template update**

```bash
git add docs/DEV_TASKS.md
git commit -m "docs: add enhanced task template to DEV_TASKS.md

New sections for AI agent clarity:
- Constraints (DO NOT VIOLATE)
- Verification Commands
- Rollback Plan

Updated pending tasks 005-007 with new sections.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

### Task 21: Establish Feature Branch Workflow

**Files:**

- Modify: `docs/AGENT_WORKFLOW.md` (already created)
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Step 1: Create PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary

[Brief description of changes]

## Task Reference

Closes #XXX (or "Related to Task XXX in DEV_TASKS.md")

## Changes

- [ ] Change 1
- [ ] Change 2

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Manual testing completed

## Review Checklist

- [ ] No new dependencies added (or approved if added)
- [ ] Follows existing code patterns
- [ ] Tests cover new functionality
- [ ] Documentation updated if needed

## Screenshots (if UI changes)

[Add screenshots here]
```

**Step 2: Commit PR template**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "ci: add pull request template

Standardizes PR format with:
- Task reference
- Verification checklist
- Review checklist
- Screenshot section for UI changes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 22: Map Task Dependencies

**Files:**

- Create: `docs/plans/task-dependencies.md`

**Step 1: Create dependency map**

Create `docs/plans/task-dependencies.md`:

```markdown
# Task Dependency Map

## Dependency Graph
```

Independent (can run in parallel):
├── Task 003: Pre-commit hook
├── Task 004: CI pipeline
├── Task 010: Delete BACKLOG.md
├── Task 011: Fix DEVELOPMENT.md
├── Task 012: Staleness warning
├── Task 013: Remove credential
├── Task 014: Translate DEV_TASKS.md
├── Task 015: DOCUMENTATION_PROCESS.md
├── Task 019: AGENT_WORKFLOW.md
└── Task 021: PR template

Sequential Chain A (Testing):
Task 003 (pre-commit)
└── Task 006 (integration test)
└── Task 008 (remove gaming tests)

Sequential Chain B (Auth):
Task 016 (token refresh)
└── Task 017 (iOS/Android OAuth)

Sequential Chain C (Features):
Task 005 (Activity Templates)
└── Task 006 (Registration Flow)
└── Task 007 (Polish)

Dependencies on multiple:
Task 009 (AI test rules) ← depends on Tasks 006, 008
Task 020 (update template) ← should follow 019
Task 022 (this document) ← should follow 019, 020

````

## Execution Strategy

### Parallel Worktree 1: Foundation Fixes
```bash
git worktree add ../habits-fixes -b fixes/foundation
# Tasks: 003, 004, 010, 011, 012, 013, 014, 015
````

### Main Worktree: Workflow Setup

```bash
# Tasks: 019, 020, 021, 022
```

### Parallel Worktree 2: Testing Infrastructure

```bash
git worktree add ../habits-testing -b feature/testing
# Tasks: 006, 007, 008, 009
```

### Parallel Worktree 3: Auth Chain

```bash
git worktree add ../habits-auth -b feature/auth
# Tasks: 016, 017
```

## Merge Order

1. fixes/foundation → main
2. (workflow already in main)
3. feature/testing → main
4. feature/auth → main
5. Begin feature work (005 → 006 → 007)

````

**Step 2: Commit dependency map**

```bash
git add docs/plans/task-dependencies.md
git commit -m "docs: add task dependency map

Maps all task dependencies for parallel execution:
- Independent tasks identified
- Sequential chains defined
- Worktree strategy documented
- Merge order specified

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

## Phase 2: Testing Infrastructure

### Task 6: Add First Integration Test (Auth Persistence)

**Files:**

- Create: `src/__tests__/integration/auth-persistence.test.ts`

**Step 1: Create integration test directory**

```bash
mkdir -p src/__tests__/integration
```

**Step 2: Write the failing test**

Create `src/__tests__/integration/auth-persistence.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/auth';

describe('Auth Persistence Integration', () => {
  beforeEach(async () => {
    // Clear storage and reset store
    await AsyncStorage.clear();
    useAuthStore.getState().logout();
  });

  describe('token persistence', () => {
    it('persists auth state to AsyncStorage', async () => {
      // Arrange
      const testAuth = {
        accessToken: 'test-token-123',
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        user: { name: 'Test User', email: 'test@example.com', picture: null },
      };

      // Act
      useAuthStore.getState().setAuth(testAuth);

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - check AsyncStorage directly
      const stored = await AsyncStorage.getItem('cairn-auth');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.accessToken).toBe('test-token-123');
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('rehydrates auth state from AsyncStorage on store creation', async () => {
      // Arrange - manually set storage as if from previous session
      const previousSession = {
        state: {
          accessToken: 'previous-token',
          refreshToken: null,
          expiresAt: Date.now() + 3600000,
          user: { name: 'Previous User', email: 'prev@example.com', picture: null },
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      };
      await AsyncStorage.setItem('cairn-auth', JSON.stringify(previousSession));

      // Act - trigger rehydration by accessing store
      // Note: In real app, this happens automatically on import
      const { persist } = useAuthStore;
      await persist.rehydrate();

      // Assert
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('previous-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('clears persisted state on logout', async () => {
      // Arrange
      useAuthStore.getState().setAuth({
        accessToken: 'token-to-clear',
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        user: { name: 'User', email: 'user@example.com', picture: null },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      useAuthStore.getState().logout();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      const stored = await AsyncStorage.getItem('cairn-auth');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.accessToken).toBeNull();
      expect(parsed.state.isAuthenticated).toBe(false);
    });
  });

  describe('token expiry', () => {
    it('correctly identifies expired tokens', () => {
      // Arrange
      useAuthStore.getState().setAuth({
        accessToken: 'expired-token',
        refreshToken: null,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        user: { name: 'User', email: 'user@example.com', picture: null },
      });

      // Act & Assert
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it('correctly identifies valid tokens', () => {
      // Arrange
      useAuthStore.getState().setAuth({
        accessToken: 'valid-token',
        refreshToken: null,
        expiresAt: Date.now() + 3600000, // Expires in 1 hour
        user: { name: 'User', email: 'user@example.com', picture: null },
      });

      // Act & Assert
      expect(useAuthStore.getState().isTokenExpired()).toBe(false);
    });
  });
});
```

**Step 3: Run test to verify it works**

```bash
npm test -- src/__tests__/integration/auth-persistence.test.ts -v
```

Expected: All tests pass (this is integration testing existing functionality).

**Step 4: Commit integration test**

```bash
git add src/__tests__/integration/auth-persistence.test.ts
git commit -m "test: add first integration test for auth persistence

Tests auth store + AsyncStorage integration:
- Token persistence to storage
- Rehydration from storage
- Logout clearing storage
- Token expiry detection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Add Playwright E2E Test Setup

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/login-flow.spec.ts`
- Modify: `package.json`

**Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Create Playwright config**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start -- --web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

**Step 3: Create e2e directory and first test**

```bash
mkdir -p e2e
```

Create `e2e/login-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('displays login page on initial load', async ({ page }) => {
    await page.goto('/');

    // Should show login page elements
    await expect(page.getByText('Cairn')).toBeVisible();
    await expect(page.getByText('Sign in with Google')).toBeVisible();
  });

  test('shows app disclaimer on login page', async ({ page }) => {
    await page.goto('/');

    // Should show disclaimer about Google Calendar access
    await expect(page.getByText(/Google Calendar/i)).toBeVisible();
  });
});

test.describe('Authenticated Flow', () => {
  test.skip('redirects to home after login', async ({ page }) => {
    // This test requires OAuth mocking - skipped for now
    // TODO: Implement OAuth mock for E2E testing
  });
});
```

**Step 4: Add npm scripts**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug"
  }
}
```

**Step 5: Run E2E tests**

```bash
npm run e2e
```

Expected: 2 tests pass, 1 skipped.

**Step 6: Commit E2E setup**

```bash
git add playwright.config.ts e2e/ package.json package-lock.json
git commit -m "test: add Playwright E2E test setup

Setup:
- Playwright configured for web testing
- Auto-starts dev server
- First tests for login page display

Scripts added:
- npm run e2e
- npm run e2e:headed
- npm run e2e:debug

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Remove Coverage-Gaming Tests

**Files:**

- Modify: `src/__tests__/components/Calendar/index.test.ts`

**Step 1: Identify coverage-gaming tests**

```bash
cat src/__tests__/components/Calendar/index.test.ts
```

**Step 2: Remove or replace tests that only check existence**

If the file only contains tests like:

```typescript
it('exports MonthView', () => {
  expect(MonthView).toBeDefined();
});
```

Delete the entire file:

```bash
rm src/__tests__/components/Calendar/index.test.ts
```

Or replace with meaningful tests if the barrel export has logic.

**Step 3: Check coverage still passes**

```bash
npm run test:coverage
```

If coverage drops below 100%, the barrel file needs to be excluded from coverage or actual behavior needs testing.

**Step 4: Update jest.config.js if needed**

Add to `coveragePathIgnorePatterns` if barrel files should be excluded:

```javascript
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/src/components/Calendar/index.ts', // Barrel export only
],
```

**Step 5: Commit changes**

```bash
git add src/__tests__/components/Calendar/ jest.config.js
git commit -m "test: remove coverage-gaming tests

Removed tests that only verify exports exist without testing behavior.
Updated coverage config to exclude barrel export files.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Add AI Agent Test Quality Rules

**Files:**

- Modify: `docs/DEVELOPMENT.md`

**Step 1: Add test quality rules section**

Add to `docs/DEVELOPMENT.md`:

````markdown
## Test Requirements for AI Agents

When writing tests, AI agents MUST follow these rules:

### 1. No Coverage-Only Tests

**Bad:**

```typescript
it('exports MonthView', () => {
  expect(MonthView).toBeDefined();
});
```
````

**Good:**

```typescript
it('renders current month by default', () => {
  render(<MonthView events={[]} onMonthChange={jest.fn()} />);
  expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
});
```

### 2. Mock at Boundaries Only

Mock external services (fetch, AsyncStorage, expo modules), NOT internal components.

**Bad:**

```typescript
jest.mock('../../components/Calendar', () => ({
  MonthView: () => <div>Mocked</div>,
}));
```

**Good:**

```typescript
// Mock the fetch call, not the component
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ items: [] }),
});
```

### 3. Test User Behavior

Use accessible queries that reflect how users interact.

**Bad:**

```typescript
screen.getByTestId('submit-button');
```

**Good:**

```typescript
screen.getByRole('button', { name: /sign in/i });
```

### 4. Include Failure Cases

Every function with error handling needs error path tests.

```typescript
describe('when API returns 401', () => {
  it('triggers logout', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(getEvents()).rejects.toThrow(AuthExpiredError);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
```

### 5. Verify State Changes

After actions, assert both state AND rendered output.

```typescript
it('updates calendar when month changes', async () => {
  render(<HomeScreen />);

  // Action
  fireEvent.press(screen.getByLabelText('Next month'));

  // Verify state
  expect(mockFetchEvents).toHaveBeenCalledWith(expect.objectContaining({
    month: nextMonth,
  }));

  // Verify render
  await waitFor(() => {
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });
});
```

### 6. Test File Naming

- Unit tests: `src/__tests__/[path]/[filename].test.ts`
- Integration tests: `src/__tests__/integration/[feature].test.ts`
- E2E tests: `e2e/[flow].spec.ts`

````

**Step 2: Commit rules**

```bash
git add docs/DEVELOPMENT.md
git commit -m "docs: add AI agent test quality rules

Rules to ensure meaningful tests:
1. No coverage-only tests
2. Mock at boundaries only
3. Test user behavior
4. Include failure cases
5. Verify state changes
6. Test file naming conventions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

## Phase 3: Auth Chain

### Task 16: Implement Token Refresh Mechanism

**Files:**

- Create: `src/services/token-storage.ts`
- Create: `src/services/token-refresh.ts`
- Create: `src/hooks/useTokenWarning.ts`
- Create: `src/hooks/useAppForeground.ts`
- Modify: `src/services/google-auth.ts`
- Modify: `src/services/google-calendar.ts`
- Modify: `src/store/auth.ts`
- Modify: `app/index.tsx`
- Modify: `app/_layout.tsx`
- Create: `src/__tests__/services/token-refresh.test.ts`

**This task is complex. See Task #16 description for full design.**

**Step 1: Install expo-secure-store**

```bash
npx expo install expo-secure-store
```

**Step 2: Create token-storage.ts**

Create `src/services/token-storage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'cairn_refresh_token';

export async function storeRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: No secure storage, no refresh token anyway
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function deleteRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

**Step 3: Write tests for token-storage**

Create `src/__tests__/services/token-storage.test.ts`:

```typescript
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from '../../services/token-storage';

jest.mock('expo-secure-store');

describe('token-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on native platforms', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('stores refresh token in SecureStore', async () => {
      await storeRefreshToken('test-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cairn_refresh_token', 'test-token');
    });

    it('retrieves refresh token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
      const token = await getRefreshToken();
      expect(token).toBe('stored-token');
    });

    it('deletes refresh token from SecureStore', async () => {
      await deleteRefreshToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cairn_refresh_token');
    });
  });

  describe('on web platform', () => {
    beforeEach(() => {
      (Platform as any).OS = 'web';
    });

    it('does not store refresh token', async () => {
      await storeRefreshToken('test-token');
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns null for refresh token', async () => {
      const token = await getRefreshToken();
      expect(token).toBeNull();
    });

    it('does not attempt to delete', async () => {
      await deleteRefreshToken();
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
```

**Step 4-15: Continue with remaining token refresh implementation**

(Full implementation steps are extensive - follow the design in Task #16 description)

**Final Step: Commit token refresh**

```bash
git add src/services/token-storage.ts src/services/token-refresh.ts \
        src/hooks/useTokenWarning.ts src/hooks/useAppForeground.ts \
        src/__tests__/services/token-*.ts \
        src/services/google-auth.ts src/services/google-calendar.ts \
        src/store/auth.ts app/index.tsx app/_layout.tsx \
        package.json package-lock.json
git commit -m "feat: implement token refresh mechanism

Platform-aware token strategy:
- iOS/Android: Silent refresh using refresh tokens (SecureStore)
- Web: Proactive re-auth warning banner

New files:
- token-storage.ts: Secure storage abstraction
- token-refresh.ts: Refresh logic with concurrency handling
- useTokenWarning.ts: Web expiry warning hook
- useAppForeground.ts: Foreground token check

Modified:
- google-calendar.ts: getValidToken() integration
- google-auth.ts: access_type=offline for native
- auth.ts: Remove refreshToken from persist

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 17: Configure iOS and Android OAuth Credentials

**Files:**

- Modify: `app.config.js`
- Modify: `.env.example`
- Modify: `.env`

**Step 1: Document required setup**

This task requires manual steps in Google Cloud Console:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID for iOS:
   - Application type: iOS
   - Bundle ID: `com.manu.cairn`
3. Create OAuth 2.0 Client ID for Android:
   - Application type: Android
   - Package name: `com.manu.cairn`
   - SHA-1 certificate fingerprint: (get from keystore)

**Step 2: Update .env.example**

```bash
# Platform-specific OAuth credentials (REQUIRED for native builds)
# Create these in Google Cloud Console for iOS and Android app types
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
```

**Step 3: Update app.config.js to use platform credentials**

Ensure `app.config.js` exports:

```javascript
googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
```

**Step 4: Commit configuration changes**

```bash
git add app.config.js .env.example
git commit -m "feat: configure iOS and Android OAuth credentials

Added support for platform-specific OAuth client IDs.
See .env.example for setup instructions.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Architecture Fixes

### Task 1: Fix Architectural Issues

**Files:**

- Modify: `src/services/google-calendar.ts`
- Create: `src/hooks/useCalendarData.ts`
- Modify: `app/index.tsx`

**Step 1: Fix 401 side effect in google-calendar.ts**

Current code at line 49 directly calls `useAuthStore.getState().logout()`. This couples the service to the store.

Change to throw an error and let the caller handle logout:

```typescript
// Before
if (response.status === 401) {
  useAuthStore.getState().logout();
  throw new AuthExpiredError();
}

// After
if (response.status === 401) {
  throw new AuthExpiredError('Session expired');
}
```

The caller (or a higher-level middleware) handles the logout.

**Step 2: Extract useCalendarData hook**

Create `src/hooks/useCalendarData.ts` to extract data fetching logic from `app/index.tsx`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { getOrCreateCairnCalendar, listEvents } from '../services/google-calendar';
import { CalendarEvent } from '../types/calendar';
import { startOfMonth, endOfMonth } from 'date-fns';

interface UseCalendarDataResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  refresh: () => Promise<void>;
}

export function useCalendarData(): UseCalendarDataResult {
  const { accessToken, logout } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarId, setCalendarId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!accessToken || !calendarId) return;

    setIsLoading(true);
    setError(null);

    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const fetchedEvents = await listEvents(accessToken, calendarId, start, end);
      setEvents(fetchedEvents);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        logout();
      }
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, calendarId, currentMonth, logout]);

  // Initialize calendar
  useEffect(() => {
    async function init() {
      if (!accessToken) return;
      try {
        const id = await getOrCreateCairnCalendar(accessToken);
        setCalendarId(id);
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          logout();
        }
        setError(err as Error);
      }
    }
    init();
  }, [accessToken, logout]);

  // Load events when calendar or month changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    isLoading,
    error,
    currentMonth,
    setCurrentMonth,
    refresh: loadEvents,
  };
}
```

**Step 3: Simplify app/index.tsx**

Replace inline data fetching with hook:

```typescript
import { useCalendarData } from '../src/hooks/useCalendarData';

export default function HomeScreen() {
  const { events, isLoading, error, currentMonth, setCurrentMonth, refresh } = useCalendarData();
  // ... render using these values
}
```

**Step 4: Write tests for useCalendarData**

Create `src/__tests__/hooks/useCalendarData.test.ts` with tests for the hook.

**Step 5: Commit architectural fixes**

```bash
git add src/services/google-calendar.ts src/hooks/useCalendarData.ts \
        src/__tests__/hooks/ app/index.tsx
git commit -m "refactor: fix architectural issues

- Removed 401 side effect from google-calendar.ts (caller handles logout)
- Extracted useCalendarData hook from app/index.tsx
- Reduced HomeScreen from 140 to ~50 lines

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

After completing all tasks, verify:

```bash
# All tests pass
npm test

# TypeScript compiles
npm run typecheck

# Lint passes
npm run lint

# E2E tests pass
npm run e2e

# Coverage is maintained
npm run test:coverage
```

Check documentation accuracy:

- [ ] DEVELOPMENT.md claims match reality
- [ ] DEV_TASKS.md is fully in English
- [ ] AGENT_WORKFLOW.md exists
- [ ] DOCUMENTATION_PROCESS.md exists
- [ ] BACKLOG.md is deleted

Check CI/CD:

- [ ] `.github/workflows/ci.yml` exists
- [ ] Pre-commit runs tests
- [ ] PR template exists

```

```
