# Development Workflow

## ⚠️ CRITICAL: Development Environment Policy

**All coding and development work MUST be done in the testing environment.**

- **Test Environment**: `develop` branch + `taklaget-service-app-test` Firebase project
- **Production Environment**: `main` branch + `taklaget-service-app` Firebase project

**Only move code to production (`main` branch + production Firebase project) when explicitly requested by the user.**

## Branch Strategy

### Main Branches

- **`main`**: Production-ready code
  - Always stable and deployable
  - Only updated via merge from `develop` after explicit approval
  - Deploys to production Firebase project (`taklaget-service-app`)

- **`develop`**: Development branch
  - Active development happens here
  - All feature work and testing
  - Deploys to test Firebase project (`taklaget-service-app-test`)

### Feature Branches

- Branch from `develop` for new features
- Name: `feature/description` or `fix/description`
- Merge back to `develop` when complete
- Delete after merging

## Development Process

### 1. Start New Work

```bash
# Ensure you're on develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Development

- Work against test Firebase project
- Use test environment variables (`.env.test`)
- Test thoroughly in test environment
- Commit frequently with clear messages

### 3. Testing

- Run tests: `npm run test` (if available)
- Manual testing in test environment
- Verify no regressions
- Check linting: `npm run lint`

### 4. Merge to Develop

```bash
# Ensure all changes are committed
git add .
git commit -m "feat: description of changes"

# Push feature branch
git push origin feature/your-feature-name

# Merge to develop (via PR or direct)
git checkout develop
git merge feature/your-feature-name
git push origin develop
```

### 5. Deploy to Test

```bash
# Deploy to test Firebase project
npm run deploy:test
```

### 6. Production Deployment (Only When Requested)

**⚠️ Only proceed when user explicitly requests production deployment**

```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge develop into main
git merge develop

# Deploy to production
npm run deploy:prod

# Push main branch
git push origin main
```

## Environment Configuration

### Test Environment

- Branch: `develop`
- Firebase Project: `taklaget-service-app-test`
- Config: `.env.test`
- Deploy: `npm run deploy:test`

### Production Environment

- Branch: `main`
- Firebase Project: `taklaget-service-app`
- Config: Production environment variables
- Deploy: `npm run deploy:prod`

## Code Review Checklist

Before merging to `develop`:

- [ ] Code follows project style guidelines
- [ ] No console.log statements in production code
- [ ] Environment variables properly configured
- [ ] No hardcoded secrets or credentials
- [ ] Tests pass (if applicable)
- [ ] Linting passes: `npm run lint`
- [ ] Tested in test environment

Before merging to `main` (production):

- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Tested thoroughly in test environment
- [ ] User explicitly requested production deployment
- [ ] Documentation updated if needed
- [ ] Breaking changes documented

## Firebase Project Usage

### When to Use Test Project

- ✅ All development work
- ✅ Testing new features
- ✅ Experimenting with changes
- ✅ Debugging issues
- ✅ Learning and exploration

### When to Use Production Project

- ❌ Never during development
- ✅ Only when user explicitly requests
- ✅ Only after thorough testing in test environment
- ✅ Only from `main` branch

## Emergency Procedures

### Accidentally Deployed to Production

1. **Immediately**: Revert deployment if possible
2. **Assess**: Determine impact
3. **Fix**: Deploy fix to production if critical
4. **Document**: Log the incident and learnings

### Test Environment Issues

1. Check Firebase Console for test project status
2. Verify `.env.test` configuration
3. Redeploy rules: `npm run deploy:rules:test`
4. Check service account key permissions

## Best Practices

1. **Always work in test first**: Never skip testing in test environment
2. **Commit often**: Small, focused commits with clear messages
3. **Test before merge**: Verify everything works in test environment
4. **Document changes**: Update docs when adding features
5. **Ask before production**: Never deploy to production without explicit request
6. **Keep branches clean**: Delete merged feature branches
7. **Stay synced**: Regularly pull latest `develop` branch

## Resources

- [Test Environment Setup](./docs/01-getting-started/TEST_ENVIRONMENT.md)
- [Local Development Guide](./docs/01-getting-started/LOCAL_DEVELOPMENT.md)
- [Firebase Setup](./docs/01-getting-started/FIREBASE_SETUP.md)

---

**Remember**: Test first, deploy to production only when asked! 🚀

