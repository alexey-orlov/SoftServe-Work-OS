# Voice Notes to Task Creation (AI Feature)

**Stage:** Solution Review  
**Last Updated:** January 5, 2026  
**Owner:** Sarah Chen  
**Status:** In Review

---

## Hypothesis

**Problem:** PMs waste 45 minutes daily converting meeting notes, Slack threads, and voice memos into structured tasks. This creates a backlog of "I should write that down" items that never make it into the system.

**If we** add AI-powered voice-to-task creation,  
**then** PMs will capture 3x more action items from meetings and conversations,  
**because** the friction of manual task creation disappears—they just talk and it's done.

**Supporting Evidence:**
- User interview (Marcus, PM at Spotify): "I have 47 voice memos on my phone that are just 'remember to follow up with design about X.' I never convert them."
- Data: 68% of tasks created in our app come from copy-paste of existing text. Only 12% are created via voice.
- Survey: 83% of PMs say they "lose track of action items from casual conversations."

---

## Strategic Fit

**Why this? Why now?**

This directly supports our Q1 goal of "Make task capture effortless" by removing the biggest friction point: structuring the task.

**Impact Sizing:**
- Users affected: 100% of active PMs (12,000 users)
- Revenue impact: Expected to reduce churn by 8-12% (tasks not captured = product not providing value)
- Strategic value: **High** - This is a wedge into our AI-first roadmap

**Alternatives Considered:**
- **Just improve the manual task creation form** - Doesn't solve the core problem of friction
- **Transcription-only feature** - Requires the user to still structure the task themselves
- **Integration with Otter.ai or Fireflies** - Adds external dependency, doesn't integrate into our workflow

---

## Non-Goals

What we are explicitly NOT doing in v1:
- **Automatic task assignment** - User still picks who it goes to (AI might get this wrong)
- **Task prioritization** - AI won't suggest priority level (too context-dependent)
- **Retroactive processing** - Won't process old voice memos/notes (just new ones going forward)
- **Team-wide voice commands** - This is personal productivity, not team collaboration (yet)

**Trade-offs Made:**
- **Accuracy vs Speed** - We're optimizing for speed. 80% accuracy that the user can quickly edit > 95% accuracy that takes 10 seconds.
- **Mobile-first** - Launching on mobile only. Desktop can wait until we validate usage.

---

## Success Metrics

**Primary Metric:** Tasks created via voice input
- Current: 12% of tasks created
- Target: 40% of tasks created within 8 weeks of launch
- Timeline: Measure weekly, expect slow ramp in week 1-2

**Guardrail Metrics:** (Must not harm)
- Task completion rate: Must stay >65% (concern: AI-created tasks are lower quality, don't get done)
- Task edit rate: Must stay <40% (concern: users have to fix AI mistakes too often)
- App crashes: <0.1% (voice processing could destabilize the app)

**Kill Criteria:**
If task completion rate drops below 60% OR task edit rate exceeds 50%, we will rollback and reassess.

---

## Rollout Plan

**Approach:** A/B Test (50/50 split)

**Phase 1:** 5% of iOS users, Week 1-2
- Passing criteria: >20% of those users create at least 1 voice task. Edit rate <50%. No major crashes.

**Phase 2:** 50% of iOS users (A/B test), Week 3-6
- Passing criteria: Primary metric >35%. Guardrails holding. Qualitative feedback is positive.

**Phase 3:** 100% of iOS users, Week 7-8
- Passing criteria: Primary metric >40%. Plan Android launch.

**Rollback Plan:**
If crashes exceed 0.5% or edit rate exceeds 60%, we will disable the feature remotely and roll out a hotfix within 24 hours.

---

## Behavior Examples

### Core Experience

**User flow:**
1. User taps microphone icon (new placement: bottom-right FAB, always visible)
2. Speaks naturally: "Remind me to follow up with Jake about the pricing page redesign after he gets back from vacation"
3. AI processes and shows preview:
   - Task: "Follow up with Jake about pricing page redesign"
   - Assignee: Jake Martinez (matched from team directory)
   - Due date: Jan 15 (inferred "after vacation" from Jake's OOO calendar)
   - Project: Pricing Redesign (matched from existing projects)
4. User taps "Create" or edits any field
5. Task created in <2 seconds total

### Good/Bad/Reject Table

| Scenario | User Input (Voice) | Expected Behavior | Notes |
|----------|-------------------|-------------------|-------|
| **Happy path** | "Set up 1:1 with Maria next Tuesday to discuss Q2 roadmap" | Task: "1:1 with Maria - Q2 roadmap"<br>Due: Next Tuesday<br>Assignee: Maria Lopez<br>Project: Q2 Planning | Matches team member, infers date, assigns to relevant project |
| **Ambiguous date** | "Follow up with the design team sometime next week" | Task: "Follow up with design team"<br>Due: Next Monday (default to start of range)<br>Assignee: Blank (multiple people in "design team")<br>Note: Shows "Did you mean: [Design Team] tag?" | Handles ambiguity gracefully. Defaults to earliest date in range. Asks for clarification on group. |
| **Complex action** | "I need to analyze the user research from last sprint and put together a summary for the exec team and also schedule a working session with Priya and Tom to go through the themes" | Creates 2 tasks:<br>1. "Analyze user research from Sprint 12 and create exec summary"<br>2. "Schedule working session with Priya and Tom - research themes"<br>Shows: "I heard 2 tasks. Correct?" | Intelligently splits compound requests. Asks for confirmation. |
| **Unclear context** | "Add that thing we talked about yesterday" | Shows: "I didn't catch enough detail. Can you say more about what you want to do?" | Rejects vague input. Asks user to clarify. |
| **Should reject** | "Delete all my tasks" | Shows: "I can't do destructive actions via voice. Please use the menu." | Never allows deletion, editing existing tasks, or bulk changes via voice (too risky) |
| **Should reject** | "Change the due date on the API migration task to next Friday" | Shows: "I can only create new tasks via voice. To edit existing tasks, tap on them." | V1 is creation-only. No editing existing tasks. |

### Edge Cases to Handle

**Named entity recognition:**
- "Set up time with Chris" → Disambiguate if multiple "Chris" on team
- "Message Sarah Chen" → Correctly maps to Sarah in Engineering, not Sarah in Marketing

**Date/time parsing:**
- "Tomorrow" → Correct date
- "End of week" → Friday of current week
- "After the holidays" → First Monday after company holiday calendar

**Project/tag inference:**
- If user mentions "pricing page," auto-tag with `Pricing` project if it exists
- If uncertain, leave blank rather than guessing wrong

**Multi-language support:**
- V1: English only
- Reject other languages with: "Voice tasks are currently English-only. Type your task instead?"

---

## Technical Constraints

**Platform:**
- iOS 16+ (uses native Speech Recognition framework)
- Android v2 (different speech API, separate implementation)

**Performance:**
- Task preview must appear in <2 seconds (95th percentile)
- Voice processing happens on-device where possible (privacy)
- Falls back to cloud for complex parsing (with user consent)

**Privacy:**
- Voice data is NOT stored after task creation
- User must opt-in to cloud processing (required for complex requests)
- Audio never leaves the device without explicit permission

---

## Open Questions

- [ ] Should we allow voice task creation from the widget? - @iOS Team
- [ ] Do we need a tutorial/onboarding for this feature? - @Design
- [ ] What's the accessibility story for users who can't use voice? - @Accessibility Lead
- [ ] Should we integrate with Siri Shortcuts? - @iOS Team (deprioritized for v1, but flag for v2)

---

## Appendix

### User Research Quotes

**Marcus (PM, Spotify):**
> "I have 47 voice memos on my phone that are just tasks I need to do. But converting them into my task manager is such a pain that I never do it. Then I forget about them."

**Priya (PM, Notion):**
> "Half my tasks come from casual hallway conversations. 'Hey can you check on that API thing?' And I'm like, yeah sure. Then 3 days later I'm like... wait, what API thing?"

**Jake (PM, Asana):**
> "I love the idea of voice tasks, but I tried using Siri and it's so bad at understanding context. If it just creates a task that says 'follow up with design' with no other details, that's useless to me."

### Competitive Landscape

- **Todoist** - Has voice input but doesn't parse context (just transcribes)
- **Things 3** - No voice input at all
- **Linear** - Planning to ship voice commands in Q2 (per their public roadmap)
- **Asana** - Beta testing voice task creation (invite-only)

### Prototype

[Link to Figma prototype: voice-task-flow-v3]

### Technical Spec

[Link to engineering spec: voice-task-technical-design.md]
