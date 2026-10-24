# Agent guidelines: CapRover frontend

Applies to all changes in this repository. Read the [README](README.md),
[PR template](.github/pull_request_template.md), and the
[CapRover contribution guidelines](https://github.com/caprover/caprover/blob/master/CONTRIBUTING.md).
Those existing requirements still apply.

## Default: simplest complete change

- **Inspect neighboring code first.** Read the closest components, their callers,
  relevant utilities, and the backend/API contract before proposing a design.
- **Follow established local patterns.** Match the surrounding class/function
  component style, prop/ref usage, routing, fetching, state, error handling, and
  naming. If adjacent components use a simple ref or component, avoid introducing
  render functions, wrappers, or other indirection without a concrete need.
- Treat the closest code in the same file and feature as the primary style
  reference. Match how neighboring methods access props/state, structure Promise
  chains, and pass data. Do not make one value a special parameter when comparable
  values are consistently read from `this.props` or `this.state`.
- Prefer **KISS, YAGNI, and proportionate DRY**. Add an abstraction only when it
  clearly reduces real duplication or complexity. Avoid speculative helpers,
  generic frameworks, and layers introduced for a single use case.
- Preserve existing behavior and compatibility. Make the smallest scoped diff;
  avoid unrelated cleanup, broad refactors, reformatting, and dependency changes.
  Discuss substantial refactoring and large PRs with maintainers first.
- Before coding, sketch the simplest implementation using existing primitives.
  Compare it with your proposal and justify any extra moving parts.

## Component responsibilities and data flow

- Keep page-specific loading, refresh, and UI behavior in the relevant page or
  component, following nearby lifecycle conventions. Keep the application shell
  focused on shared shell behavior.
- Put state at the lowest level that serves its consumers. Reuse existing state
  mechanisms (local state, props, Redux, or an established context) when suitable;
  introduce another provider or store only for a demonstrated need.
- Avoid callback chains that merely bounce a child's refresh or navigation action
  through a parent. Callbacks are appropriate when the parent genuinely owns a
  decision, side effect, or configurable behavior.
- Follow the existing React Router patterns: use direct links/history navigation
  when the destination is known, and a simple `Route component` when no additional
  props are needed. Use `render` only when custom routing props warrant it.
  Avoid route-transition detectors solely to refresh a page that can refresh on mount.
- Favor straightforward JSX over custom render machinery. Reuse existing UI
  components and keep common layout wrappers in one place when practical.
- Model one lifecycle with one state value. Use an enum or discriminated union for
  mutually exclusive states such as loading, ready, and failed. Avoid combinations
  of booleans that can represent impossible states, duplicate another field, or
  exist only to support defensive machinery.
- Avoid duplicating source state with derived React state. Use current values and
  the repository's established unmount guards. Keep identity checks when a late
  response could be shown for the wrong entity.
- For polling and refreshes, start with the direct request pattern used by the
  neighboring code. Add request IDs, in-flight flags, queues, cancellation, or
  serialization only for a concrete, material failure mode required by the feature.
  State that scenario and cover it with a focused test. Deliberately accepting a
  brief, harmless stale window is valid when its impact does not justify more state.
- When a design is simplified, remove the state, helpers, and tests that only
  supported the discarded design. Apply the simplification consistently to every
  parallel implementation of the same behavior.

## Types, contracts, and behavior

- Trace frontend-to-`caprover-api`-to-backend behavior before changing API-facing
  code. Reuse existing typed models and methods; type new response contracts,
  props, and important public boundaries explicitly. Avoid `any`, unsafe casts,
  unchecked assumptions, and unstructured hardcoded status strings.
- Model the full contract rather than the most common sample. Check every member of
  finite backend enums and every allowed combination of nullable or independent
  fields. Do not make one diagnostic field conditional on an unrelated field.
- Preserve the meaning and provenance of data. Current state takes precedence when
  describing current behavior; label historical events as historical. When a
  preferred display value is optional, use an available stable identifier as a
  fallback when it remains useful to the user.
- Keep backend-owned decisions (for example, supported fields or severity)
  authoritative. Avoid duplicating feature/capability lists and business rules
  across frontend files or repositories; identify every consumer when changing
  a shared contract.
- Maintain compatibility with existing user data, stored settings, and accepted
  inputs. Handle missing, malformed, and older-server responses intentionally.
- Treat failures as user-visible states: provide useful retry paths, preserve
  valid prior data where appropriate, and clearly identify potentially stale
  information. Avoid silently implying cached values are current.
- Scope potentially destructive actions carefully, validate inputs, and make
  confirmation and failure behavior explicit. Do not expose credentials, tokens,
  or sensitive settings in logs or diagnostics.

## UI, style, and tests

- Match the surrounding Ant Design layout, controls, spacing, loading/error
  treatments, and naming. Follow the README's theme guidance; use theme-aware
  colors rather than arbitrary hardcoded colors. Respect mobile layouts and RTL.
- Use the existing `localize(key, fallback)` convention for user-facing text.
  Audit generated labels and backend enum/status labels as user-facing text too.
  Search for and reuse existing components, date/formatting helpers, and display
  conventions before writing a slightly different copy.
- Add focused regression tests for changed behavior, including relevant failure,
  retry, stale-data, compatibility, and boundary cases. Assert behavior and
  contracts rather than implementation details; never weaken tests to hide defects.
- Validate applicable changes with `yarn formatter`, `yarn tslint`,
  `CI=true yarn test --watchAll=false --runInBand`, and `yarn build`.
  Run relevant e2e tests when behavior warrants it; report what was actually run.
- For UI changes, inspect the running UI when feasible, including mobile and
  warning/error states. Use actual screenshots for visual evidence; temporary
  mocked endpoints or fixtures must stay out of the PR.

## Review checklist (for authors and reviewers)

1. Independently identify the **simplest solution consistent with nearby code**;
   compare the submitted design against it before reviewing individual lines.
2. Inventory every added state field, instance field, helper, timer, callback, and
   coordination mechanism. Remove each one that is redundant, derivable, supports
   an impossible state, or addresses only an unrequired hypothetical case.
3. Compare each touched method with the closest analogous methods, including data
   access, naming, Promise style, lifecycle cleanup, and helper usage. Use plural
   names for collections and names that make scope clear at the call site.
4. Re-read the complete final diff after all fixes. Check correctness, regressions,
   API contracts, all enum/nullable states, user-facing strings, tests, and style
   consistency. Verify claims against current code and real behavior.
5. Report actionable findings with file/line, impact, and the smallest concrete
   fix. Distinguish merge blockers from optional improvements; reject speculative
   or purely stylistic refactors.
