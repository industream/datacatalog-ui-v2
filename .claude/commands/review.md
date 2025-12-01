# Code Review

You are reviewing code for DataCatalog UI V2.

## Review Checklist

### Architecture
- [ ] Follows patterns from `.spec/architecture.md`
- [ ] Components are in correct location
- [ ] Smart vs Presentational separation respected
- [ ] No circular dependencies

### Code Quality
- [ ] TypeScript strict mode compliant
- [ ] No `any` types (unless justified)
- [ ] Proper error handling
- [ ] No magic numbers/strings
- [ ] DRY principle followed

### Performance
- [ ] ChangeDetectionStrategy.OnPush used
- [ ] TrackBy functions for *ngFor
- [ ] Lazy loading where appropriate
- [ ] No memory leaks (subscriptions cleaned)

### Security
- [ ] No secrets in code
- [ ] Input sanitization
- [ ] Proper auth checks

### Accessibility
- [ ] Keyboard navigable
- [ ] ARIA attributes present
- [ ] Color contrast OK

### Testing
- [ ] Unit tests present
- [ ] Edge cases covered

## Output Format

Provide feedback in this format:

### Summary
Brief overview of the review

### Issues Found
- **[CRITICAL]** Must fix before merge
- **[WARNING]** Should fix
- **[INFO]** Suggestions for improvement

### Positive Observations
What was done well

### Recommendations
Specific actionable improvements
