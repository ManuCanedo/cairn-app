# AI Agent Development Workflow

## Before Starting Any Task

### 1. Create Feature Branch

```bash
git checkout -b feature/task-XXX
git tag pre-task-XXX
```

### 2. Read Task Spec Fully

- Open relevant task in GitHub Issues or `docs/DEV_TASKS.md`
- Understand all acceptance criteria
- Identify files to create/modify
- Note any constraints

### 3. Check Prerequisites

- Verify dependent tasks are complete
- Ensure required interfaces exist
- Run `npm test` to confirm baseline passes

## During Task Execution

### Follow TDD Cycle

Follow the Red/Green/Refactor methodology. See `docs/DEVELOPMENT.md` for detailed TDD guidelines.

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
- Scope is expanding beyond the original task (more than 5 files affected)

## Code Review with code-simplifier

**REQUIRED: Before testing and committing, invoke the code-simplifier agent.**

This step is mandatory for all changes. The code-simplifier agent will:

1. Review code for clarity and maintainability
2. Identify unnecessary complexity
3. Ensure consistency with existing patterns
4. Suggest simplifications while preserving functionality

### How to Invoke

Invoke using the `/code-simplifier` command or Task tool:

```
/code-simplifier Review the changes made in this task. Files modified: [list files]
```

Or explicitly:

```
Task(subagent_type="code-simplifier", prompt="Review changes in: src/path/file.ts")
```

### What to Expect

The code-simplifier will:
- Analyze modified files
- Propose improvements (if any)
- Implement approved simplifications

**Only proceed to testing after code-simplifier review is complete.**

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
- code-simplifier review: DONE

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

## Complete Workflow Checklist

```
[ ] 1. Create feature branch and tag
[ ] 2. Read and understand task spec
[ ] 3. Check prerequisites pass
[ ] 4. Write failing test (RED)
[ ] 5. Implement minimal code (GREEN)
[ ] 6. Refactor if needed
[ ] 7. **Run code-simplifier agent review** <-- REQUIRED
[ ] 8. Apply any simplifications
[ ] 9. Run all checks (typecheck, test, lint)
[ ] 10. Verify acceptance criteria
[ ] 11. Commit with proper message
[ ] 12. Push and create PR
```

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
