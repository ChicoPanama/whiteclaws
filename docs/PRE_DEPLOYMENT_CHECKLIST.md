# WhiteClaws Pre-Deployment Checklist

## Version 1.0 — February 15, 2026

---

## 🔐 Security Checklist

### Authentication & Authorization
- [ ] API key generation uses cryptographically secure random
- [ ] Wallet signature verification implemented correctly
- [ ] Nonce tracking prevents replay attacks
- [ ] Timestamp window (5 minutes) enforced
- [ ] API key scopes properly validated
- [ ] RLS policies enabled on all Supabase tables
- [ ] Admin routes protected with role checks
- [ ] Session timeout configured appropriately

### Input Validation
- [ ] All user inputs sanitized
- [ ] Wallet addresses validated (format + checksum)
- [ ] Handle format enforced (alphanumeric + hyphens/underscores)
- [ ] Referral codes validated (wc-[a-z0-9]{6})
- [ ] Severity enums restricted to valid values
- [ ] URLs validated using Zod schemas
- [ ] No raw SQL concatenation anywhere
- [ ] Parameterized queries via Supabase client

### Rate Limiting
- [ ] Registration: 5 per IP per hour
- [ ] Submission: 10 per wallet per day
- [ ] Submission: 20 per IP per day
- [ ] Protocol cooldown: 24 hours enforced
- [ ] Rate limit headers returned in responses
- [ ] Expired bucket cleanup job configured

### Data Protection
- [ ] Environment variables not committed to git
- [ ] API keys stored in .env.local (not tracked)
- [ ] Encrypted reports use NaCl encryption
- [ ] Wallet addresses normalized to lowercase
- [ ] No PII logged to console
- [ ] Error messages don't expose SQL details
- [ ] Stack traces disabled in production

### Anti-Sybil
- [ ] Wallet clustering detection active
- [ ] IP fingerprinting implemented
- [ ] Device fingerprinting implemented
- [ ] Funding source analysis configured
- [ ] Quality scoring system functional
- [ ] Pyramid farming detection enabled
- [ ] Sybil multiplier applied to scores

---

## 💻 Code Quality Checklist

### TypeScript
- [ ] Zero TypeScript errors (`npx tsc --noEmit`)
- [ ] No `as any` type casts in production code
- [ ] All API responses properly typed
- [ ] Supabase types generated and up-to-date
- [ ] Strict mode enabled in tsconfig.json

### Testing
- [ ] Unit tests pass (referral tree, bonuses)
- [ ] Integration tests pass (registration, submission)
- [ ] Security tests pass (SQL injection, replay, permissions, rate limiting)
- [ ] Test coverage ≥ 80% on critical code
- [ ] Edge cases covered (max depth, circular refs, duplicates)

### Code Style
- [ ] Consistent formatting (Prettier)
- [ ] ESLint rules passing
- [ ] No console.log in production code (use proper logging)
- [ ] Comments explain WHY, not WHAT
- [ ] Functions are single-purpose
- [ ] File structure follows Next.js conventions

### Performance
- [ ] Database queries optimized (indexes on foreign keys)
- [ ] N+1 queries avoided
- [ ] Pagination implemented for large result sets
- [ ] API responses cached where appropriate
- [ ] Images optimized
- [ ] Bundle size analyzed (`npm run build`)

---

## 🗄️ Database Checklist

### Schema
- [ ] All required tables exist
- [ ] Foreign key constraints defined
- [ ] Unique constraints on critical fields (wallet, referral code)
- [ ] Indexes on frequently queried columns
- [ ] Check constraints validate data (e.g., level 1-5)
- [ ] Default values set appropriately
- [ ] Timestamps (created_at, updated_at) on all tables

### Data Integrity
- [ ] No orphaned referral tree entries
- [ ] No circular referral chains
- [ ] All wallet addresses valid format
- [ ] Referral codes unique
- [ ] Bonus percentages correct (10%, 5%, 2.5%, 1%, 0.5%)
- [ ] User wallets unique (no duplicates)

### Migrations
- [ ] All migrations run successfully
- [ ] Rollback scripts tested
- [ ] Migration order documented
- [ ] No breaking changes without migration path
- [ ] Backups taken before migrations

### Row Level Security (RLS)
- [ ] RLS enabled on all tables
- [ ] Users can only read their own data
- [ ] Users can only write their own data
- [ ] Admin bypass properly scoped
- [ ] Service role key properly protected

---

## 🚀 Deployment Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-side only)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `VERCEL_TEAM_ID` configured
- [ ] `VERCEL_PROJECT_ID` configured
- [ ] API URLs point to correct environment
- [ ] GitHub PAT configured for deployments

### Vercel Configuration
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node version specified (18.x or 20.x)
- [ ] Environment variables synced
- [ ] Custom domains configured (if applicable)

### Pre-Deployment Tests
- [ ] Full test suite passes locally
- [ ] Database integrity check passes
- [ ] Performance benchmarks meet requirements (<500ms registration, <1s queries)
- [ ] TypeScript compiles without errors
- [ ] Next.js build succeeds
- [ ] No security vulnerabilities in dependencies (`npm audit`)

### Staging Verification
- [ ] Deployed to staging environment
- [ ] Health check endpoint responds
- [ ] Registration flow works end-to-end
- [ ] Referral tree creation works
- [ ] Submission flow works
- [ ] Points calculation correct
- [ ] Rate limiting enforced
- [ ] Error handling graceful

---

## 📊 Monitoring & Observability

### Logging
- [ ] Structured logging configured
- [ ] Error tracking setup (e.g., Sentry)
- [ ] Log levels appropriate (debug/info/warn/error)
- [ ] PII not logged
- [ ] Request IDs for tracing
- [ ] Database query logging (in dev only)

### Metrics
- [ ] API response times tracked
- [ ] Error rates monitored
- [ ] Database connection pool monitored
- [ ] Rate limit violations logged
- [ ] Sybil detection events logged

### Alerts
- [ ] High error rate alerts
- [ ] Database connection failures
- [ ] API downtime alerts
- [ ] Rate limit abuse alerts
- [ ] Disk space warnings

---

## 📖 Documentation

### User-Facing
- [ ] Submission template published
- [ ] Verification gate docs published
- [ ] API documentation (OpenAPI spec)
- [ ] Developer guide published
- [ ] README up-to-date
- [ ] Examples working

### Internal
- [ ] Architecture diagrams
- [ ] Database schema documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Incident response plan

---

## ✅ Final Sign-Off

### Team Review
- [ ] Code reviewed by at least one other developer
- [ ] Security review completed
- [ ] Database changes reviewed
- [ ] Performance review completed
- [ ] Documentation reviewed

### Testing Sign-Off
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Staging environment validated
- [ ] Performance benchmarks met
- [ ] Security audit passed

### Product Sign-Off
- [ ] Feature complete
- [ ] User flows tested
- [ ] Edge cases handled
- [ ] Error messages user-friendly
- [ ] Mobile responsive (if applicable)

---

## 🎯 Go/No-Go Decision

**Required for Production Deployment:**

✅ **Must Have (Blockers)**
- [ ] All critical tests passing (security, integration, unit)
- [ ] Database integrity verified
- [ ] Zero TypeScript errors
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Staging validated for 24+ hours

🟡 **Should Have (Warnings)**
- [ ] Non-critical test coverage ≥ 70%
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Rollback plan documented

⚪ **Nice to Have**
- [ ] Load testing completed
- [ ] Penetration testing completed
- [ ] User acceptance testing
- [ ] A/B test infrastructure

---

## 📋 Post-Deployment Checklist

### Immediate (0-1 hour)
- [ ] Health check passes
- [ ] Smoke tests pass
- [ ] No error spikes in logs
- [ ] Database connections stable
- [ ] API response times normal

### Short-Term (1-24 hours)
- [ ] Monitor error rates
- [ ] Check database query performance
- [ ] Verify rate limiting working
- [ ] Check for Sybil activity
- [ ] Monitor registration volume

### Medium-Term (1-7 days)
- [ ] Analyze user feedback
- [ ] Review performance metrics
- [ ] Check for anomalies
- [ ] Validate referral tree growth
- [ ] Monitor points distribution

---

## 🆘 Rollback Plan

**If Critical Issues Arise:**

1. **Immediate Actions**
   - Revert to previous Vercel deployment
   - Post incident notice to users
   - Stop new registrations if needed

2. **Investigation**
   - Capture error logs
   - Take database snapshot
   - Document issue thoroughly

3. **Communication**
   - Notify team in #incidents
   - Update status page
   - Communicate with affected users

4. **Resolution**
   - Fix root cause
   - Test fix in staging
   - Re-deploy with fix

---

**Checklist Version:** 1.0  
**Last Updated:** February 15, 2026  
**Owner:** WhiteClaws Development Team
