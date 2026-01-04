## Agent Workflow – NextBestMove

**Purpose:** Ensure every AI/dev agent working on NextBestMove has the right context and follows a consistent flow for each Linear issue.

---

## 1. Required context (every new session)

Before touching code or a Linear issue, the agent **must**:

1. **Read project guide**
   - File: `nextbestmove_cursor_guide.md`
2. **Review current backlog and priorities**
   - File: `docs/backlog.md`
3. **Check architecture & decision engine spec (when relevant)**
   - `docs/Architecture/Architecture_Summary.md`
   - `docs/Architecture/Decision_Engine_Implementation_Spec.md`
4. **Locate the Linear issue**
   - Use the Linear MCP tools to fetch the issue by identifier (e.g., `NEX-10`) and read its full description, comments, and status.

---

## 2. Agent roles per issue (WORK IN THIS ORDER)

Every significant issue (especially P0/P1) should be worked through **three agent roles in sequence**:

1. **Product/Spec Agent** (first)

   - Clarifies problem, scope, and acceptance criteria.
   - Ensures PRD and architecture docs stay aligned.
   - **Output:** Refined acceptance criteria in Linear issue comments, updated PRD/architecture docs if needed.

2. **System/Backend Agent** (second)

   - Designs and implements DB schema, services, decision engine logic, and cron behavior.
   - Keeps migrations, RLS, and performance in good shape.
   - **Output:** Schema changes, API routes, business logic, backend tests.

3. **UI/Integration Agent** (third)
   - Wires React/Next UI, state, and tests.
   - Checks UX copy and interaction against interviews and PRD.
   - **Output:** React components, pages, server actions, frontend tests, issue marked Done.

**Important:** See `docs/Planning/Agent_Role_Prompts.md` for copy-pasteable prompts you can use at the start of each Cursor chat to define which agent role you're working as.

One real person (you) and separate Cursor sessions can cycle through all three roles, but this sequence keeps work structured and prevents scope creep.

---

## 3. Standard flow for working a Linear issue

For each Linear issue (e.g., `NEX-10`), work through these steps **in order**:

### Step 1: Product/Spec Agent Pass

- **Start a new Cursor chat** and paste the Product/Spec Agent prompt from `docs/Planning/Agent_Role_Prompts.md`
- Read the issue, PRD sections, and any linked docs.
- If acceptance criteria are vague, refine them in Linear issue comments.
- Update PRD or architecture docs if the issue changes behavior meaningfully.
- **When done:** Add a comment to Linear summarizing what was clarified, then move to Step 2.

### Step 2: System/Backend Agent Pass

- **Start a new Cursor chat** and paste the System/Backend Agent prompt from `docs/Planning/Agent_Role_Prompts.md`
- Review Product/Spec Agent comments on the Linear issue.
- Design changes (schema, APIs, services) with references to:
  - `docs/Architecture/Decision_Engine_Implementation_Spec.md` (if decision engine related)
  - `docs/Architecture/Database_Schema.md` (if database related)
- Implement code + migrations.
- Run relevant tests; add new unit/integration tests where missing.
- **When done:** Add a comment to Linear summarizing what was implemented, then move to Step 3.

### Step 3: UI/Integration Agent Pass

- **Start a new Cursor chat** and paste the UI/Integration Agent prompt from `docs/Planning/Agent_Role_Prompts.md`
- Review Product/Spec and Backend Agent comments on the Linear issue.
- Connect backend changes to UI (Next.js pages, components, server actions).
- Verify navigation/labels match the language refactor (Today, Relationships, Daily Plan, Weekly Review, Signals, Insights).
- Add/adjust tests and basic manual QA notes.
- **When done:** Add a comment to Linear summarizing what was implemented, confirm all acceptance criteria are met, and move the issue to "Done" in Linear.

---

## 4. Agent checklist snippet for Linear issues

You can paste this snippet into Linear issue templates so every agent run follows the same steps:

```markdown
**Agent Checklist (Work in Order)**

**Step 1: Product/Spec Agent**

- [ ] Read `nextbestmove_cursor_guide.md`
- [ ] Read `docs/backlog.md` for current priorities
- [ ] Read relevant PRD sections from `docs/PRD/NextBestMove_PRD_v1.md`
- [ ] Clarify acceptance criteria in this issue if anything is ambiguous
- [ ] Update PRD/architecture docs if behavior changes meaningfully
- [ ] Add comment summarizing what was clarified

**Step 2: System/Backend Agent**

- [ ] Read `nextbestmove_cursor_guide.md`
- [ ] Read `docs/backlog.md` for current priorities
- [ ] Read relevant architecture docs: - `docs/Architecture/Architecture_Summary.md` - `docs/Architecture/Decision_Engine_Implementation_Spec.md` (if decision engine related) - `docs/Architecture/Database_Schema.md` (if database related)
- [ ] Review Product/Spec Agent comments on this issue
- [ ] Implement backend/system changes + tests
- [ ] Add comment summarizing what was implemented

**Step 3: UI/Integration Agent**

- [ ] Read `nextbestmove_cursor_guide.md`
- [ ] Read `docs/backlog.md` for current priorities
- [ ] Review Product/Spec and Backend Agent comments on this issue
- [ ] Implement UI/integration changes + tests
- [ ] Verify UX matches language refactor (Today, Relationships, etc.)
- [ ] Add comment summarizing what was implemented
- [ ] Confirm all acceptance criteria are met
- [ ] Move issue to "Done" in Linear
```

**See `docs/Planning/Agent_Role_Prompts.md` for copy-pasteable prompts for each agent role.**
