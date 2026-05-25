# NAMO Polish Report — 2026-05-25

## Polish Pass v1 (Completed)

### Priority 1 (Broken/Confusing flows)
- TasksTab missing Fragment key → verified correct (Fragment key={task.id} already in place)
- Modal submit buttons had no loading state → verified: all modals (TaskModal, RiskModal, ProjectModal, EscalateModal, RespondEscalationModal, CreateMeetingModal) already use react-hook-form isSubmitting or manual saving state with disabled button
- Login form had no error display → verified already complete (setError state, AlertCircle icon, disabled button)
- Date validation missing in Task/Project forms → fixed (Zod .refine() added to both schemas; estimatedHours min raised to 0.5)
- TeamTab remove member missing confirm dialog → fixed (confirm() added before handleRemove)

### Priority 2 (Responsiveness & States)
- Sidebar not collapsible on mobile → fixed (AppShellClient.tsx created with hamburger + backdrop overlay; Sidebar accepts isOpen/onClose props with CSS translate transition)
- Task table overflowed on mobile → fixed (overflow-x-auto wrapper + min-w-[640px] on table)
- Empty state missing for WorkloadView with 0 developers → fixed (early return with empty state card)
- WorkloadView expanded card showed "No active tasks" → changed to "No tasks assigned" per spec
- Modal height overflow on mobile → Modal.tsx already has max-h-[90vh] overflow-y-auto; added mx-4 for horizontal mobile safety
- ProjectCard showed "0 / 0 tasks" → fixed to show "No tasks yet" when tasks.length is 0

### Priority 3 (Visual & Polish)
- Badge base classes → verified consistent: inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
- Button disabled state → verified present: disabled:opacity-50 disabled:cursor-not-allowed in base classes
- Report tab copy button had no feedback → fixed (copied state, shows "Copied!" for 2 seconds with CheckCircle2 icon)
- Profile password form → verified: already clears fields, shows success message, disables button while submitting
- DevDashboardClient review queue → enhanced with empty state message and task count display for senior devs
- MeetingsClient handleCreated → added router.refresh() call for consistency

---

## Polish Pass v2 (Completed 2026-05-25)

### Priority 1 (Broken/Confusing flows)
- EscalationsSection showed raw uppercase status values ("OPEN"/"RESPONDED"/"RESOLVED") → fixed: added STATUS_LABELS map → now shows "Open" / "Responded" / "Resolved"
- EscalationsSection handleDelete had no success/error toast → fixed: added `toast.success("Escalation deleted.")` and `toast.error(...)` feedback
- MeetingsClient instant meeting button had no loading state → fixed: added `startingInstant` boolean, disables button + shows spinner + "Starting…" text + error toast if API fails
- PeopleManagement search placeholder had garbled encoding (`roleâ€¦`) → fixed: corrected to `role…`
- ProjectHub "← Dashboard" back link always went to `/` for all roles → fixed: non-manager roles now link to `/dev`
- ProjectHub Edit button was shown to non-manager roles → fixed: only renders when `isManager === true`
- AvailabilityCalendar approve/reject had no feedback toast → fixed: added "Vacation request approved/rejected" toast
- AvailabilityCalendar delete had no feedback toast → fixed: added "Entry deleted" toast with error fallback

### Priority 2 (Responsiveness & States)
- DashboardClient used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- DevDashboardClient used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- ProfileClient used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- PeopleManagement used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- Workload page used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- Meetings page used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- Availability page used `p-8` on mobile → fixed: now `p-4 sm:p-8`
- DashboardClient MetricCard grid `grid-cols-5` on all screens → fixed: now `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- InsightsTab stats row `grid-cols-5` on all screens → fixed: now `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- ProjectHub tab bar (7 tabs) had no mobile scroll → fixed: added `overflow-x-auto` + `min-w-max` + `whitespace-nowrap` on each tab
- ProjectHub header `flex items-start justify-between` didn't wrap on mobile → fixed: now `flex flex-col sm:flex-row sm:items-start sm:justify-between`
- ProjectHub content area `p-8` on mobile → fixed: now `p-4 sm:p-8`
- ProjectHub header `px-8` on mobile → fixed: now `px-4 sm:px-8`
- AvailabilityCalendar calendar + side panel `flex gap-6` didn't stack on mobile → fixed: now `flex flex-col lg:flex-row gap-6`; side panel changes from `w-72` to `w-full lg:w-72`
- AvailabilityCalendar header didn't wrap on mobile → fixed: `flex flex-wrap items-center justify-between gap-3`
- PeopleManagement table overflowed on mobile → fixed: added `overflow-x-auto` wrapper + `min-w-[640px]` on table
- DashboardClient header buttons didn't adapt on mobile → fixed: "Portfolio Report" shortens to "Report" on mobile; "New Project" shortens to "New"

### Priority 3 (Visual & Polish)
- Sidebar section label showed "Menu" for non-manager roles → fixed: now shows "Navigation"
- TeamTab "No tasks assigned by name in this project." was confusing → fixed: now "No tasks assigned in this project."
- ProjectCard footer layout was awkward when "Needs attention" not shown → fixed: "Needs attention" and "Open →" grouped in `flex items-center gap-3` div on the right

---

## Already Correct (No Change Needed in v2)
- Login page: full error display, loading state, demo quick-fill
- EscalationsSection: already has empty state rendering
- RisksTab: already has empty state with ShieldAlert icon
- InsightsTab: already has "All clear" empty state section
- DashboardClient: overdue/at-risk calculations use insights engine which is correct
- AvailabilityCalendar: already uses date-fns format() not raw ISO strings
- MeetingRoom: Join button placement correct; isPast flag works
- Confirmation dialogs: TasksTab delete, RiskTab delete, MeetingsClient delete all had confirm()
- ReviewQueueSection: already has clear empty state with CheckCircle2 icon
- WorkloadView: filter pills already have flex-wrap
- ProfileClient: password form already complete with success/error states

---

## Still Remaining (Nice-to-Have)
- Custom confirm modal to replace browser `confirm()` dialogs throughout the app
- Real-time updates (WebSocket/SSE) — out of scope for MVP
- Gantt drag-and-drop — out of scope
- Dark mode — out of scope
- Email notifications — out of scope
- Keyboard navigation in modals (beyond Escape key) — out of scope
- Task search / filter by owner or priority — out of scope for this pass
- GIF/screenshot for README hero — out of scope for this pass
