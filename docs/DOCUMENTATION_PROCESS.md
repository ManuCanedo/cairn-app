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

## Deprecation Process

When a document becomes obsolete:

1. Add staleness warning at top (like MVP_ARCHITECTURE_PLAN.md)
2. After 30 days with no updates, move to `docs/archive/`
3. After 90 days in archive, delete
