# Task Dependency Map

## Overview

This document maps dependencies between foundation tasks to enable parallel execution.

## Dependency Graph

```
Independent (can run in parallel):
├── #15 Remove coverage-gaming tests ✅
├── #13 Add first integration test ✅
├── #12 Map task dependencies (this document) ✅
├── #28 Review and simplify docs
└── #14 Add Playwright E2E test setup

Sequential Chain: Auth
#17 Token refresh mechanism
└── #18 iOS/Android OAuth credentials

Sequential Chain: Architecture
#19 Fix architectural issues
└── #20 Design offline caching strategy

Already Completed:
├── #3 Pre-commit hook ✅
├── #4 Delete BACKLOG.md ✅
├── #5 Fix DEVELOPMENT.md ✅
├── #6 Staleness warning ✅
├── #7 DEV_TASKS.md translation ✅
├── #8 DOCUMENTATION_PROCESS.md ✅
├── #9 AGENT_WORKFLOW.md ✅
├── #10 Task template ✅
├── #11 Feature branch workflow ✅
├── #16 AI test quality rules ✅
└── #22 CI TypeScript fix ✅
```

## Execution Strategy

### Parallel Workstream 1: Testing Infrastructure

```bash
# Can be done immediately (no blockers)
- #14 Add Playwright E2E test setup
```

### Parallel Workstream 2: Auth Chain

```bash
# Sequential - each depends on the previous
#17 → #18
```

### Parallel Workstream 3: Architecture

```bash
# Sequential - architecture must be fixed before caching design
#19 → #20
```

### Parallel Workstream 4: Documentation

```bash
# Can be done any time
- #28 Review and simplify docs
```

## Priority Order

Based on dependencies and impact:

1. **P0.1** - #17 Token refresh (enables native app functionality)
2. **P1** - #14 Playwright E2E (testing infrastructure)
3. **P1** - #19 Architectural fixes (code quality)
4. **P1** - #28 Docs simplification (developer experience)
5. **P1.1** - #20 Offline caching (depends on #19)
6. **P1.5** - #18 iOS/Android OAuth (depends on #17)

## Merge Order

1. Current batch (#15, #13, #12) → master
2. #17 Token refresh → master
3. #14 Playwright E2E → master (parallel with #17)
4. #19 Architecture fixes → master
5. #18 iOS/Android OAuth → master (after #17)
6. #20 Offline caching → master (after #19)
7. #28 Docs simplification → master (any time)
