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

## Pre-Commit Review Process

**REQUIRED: Before committing, two review stages must be completed in order.**

### Stage 1: code-simplifier Review

Invoke the code-simplifier agent to polish the implementation:

```
Task(subagent_type="code-simplifier", prompt="Review changes in: src/path/file.ts")
```

The code-simplifier will:

- Analyze modified files for clarity and maintainability
- Identify unnecessary complexity
- Ensure consistency with existing patterns
- Implement approved simplifications

### Stage 2: Principal Architect Review

**After code-simplifier review, invoke the principal agent to review the entire feature.**

The principal review assesses:

1. **Direction**: Is this the right approach for the problem?
2. **Process compliance**: Was TDD followed? code-simplifier review done?
3. **Quality**: Is the implementation clean and maintainable?
4. **Scope**: Are there any unnecessary changes or scope creep?
5. **New issues**: Should anything be logged to the backlog?

```
Task(subagent_type="principal-cpp-architect", prompt="
Review the complete feature implementation for [TASK NAME].

Files changed: [list files]

Verify:
1. Implementation direction is sound
2. TDD and code-simplifier protocols were followed
3. No scope creep or unnecessary modifications
4. Quality meets standards

If rejecting, provide specific actionable feedback.
")
```

### Handling Principal Feedback

When the principal rejects:

1. **Read feedback carefully** - understand the specific concerns
2. **Iterate on implementation** - address the feedback
3. **Re-run code-simplifier** if changes are significant
4. **Request re-review** from principal

When you disagree with feedback:

1. **Provide evidence** - code citations, test results, documentation
2. **Explain reasoning** - why your approach is valid
3. **Request reconsideration** - ask principal to re-evaluate with new context

**Only when the principal approves (or concedes after evidence-based discussion) may you proceed to commit.**

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
- principal review: APPROVED

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

After principal approval, create and merge the PR:

```bash
git push -u origin feature/task-XXX
gh pr create --title "feat: task XXX description" --body "..."
gh pr merge --squash
```

Since the principal review already happened pre-commit, PRs can be merged directly after creation (no additional review cycle needed).

### Human Override

Human reviewers can always:

- Override principal decisions
- Request additional changes before merge
- Add the `needs-human-review` label if they want to be consulted

## Complete Workflow Checklist

```
[ ] 1. Create feature branch and tag
[ ] 2. Read and understand task spec
[ ] 3. Check prerequisites pass
[ ] 4. Write failing test (RED)
[ ] 5. Implement minimal code (GREEN)
[ ] 6. Refactor if needed
[ ] 7. Run all checks (typecheck, test, lint)
[ ] 8. Verify acceptance criteria
[ ] 9. **Run code-simplifier agent review** <-- REQUIRED
[ ] 10. Apply any simplifications
[ ] 11. **Run principal-cpp-architect review** <-- REQUIRED (pre-commit)
[ ] 12. Address feedback and iterate until approved
[ ] 13. Commit with proper message (include "principal review: APPROVED")
[ ] 14. Push, create PR, and merge
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
