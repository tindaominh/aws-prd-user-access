# Deployment Guide

## Architecture Overview

This CDK project manages IAM users and roles in the **production account**. Users in the production account (`200129445516`) can assume roles here cross-account.

**Cross-account access flow:**
```
production User → assumes → PRD role (in production account)
```

**What this stack creates:**
- IAM users (from `src/users.ts`)
- Default group with MFA policy for all users
- Production roles: `read-only`, `power-user`, `admin`
- Groups for each role with STS assume permissions (from production account)

---

## Prerequisites

### 1. Tools

```bash
npm install -g aws-cdk        # CDK CLI
npm install                    # project dependencies
```

### 2. AWS CLI Profile

Configure a named profile for the production account in `~/.aws/credentials` or via `aws configure --profile`:

```ini
[mtins]
aws_access_key_id = ...
aws_secret_access_key = ...
```

Verify access:
```bash
aws sts get-caller-identity --profile mtins
```

### 3. Update production account ID (if needed)

The production account ID is set in `bin/aws-prd-user-access.ts`:

```typescript
new AwsPRDUserAccessStack(app, 'AwsPRDUserAccessStack', {
  accessAccountId: '200129445516',   // ← production account, allowed to assume PRD roles
  terminationProtection: true,
});
```

---

## Bootstrap (one-time, new account)

CDK bootstrapping provisions the S3 bucket and IAM roles CDK needs. Bootstrap requires admin-level permissions — the `<USER_NAME>` user alone is not sufficient.

### Step 1 — Attach AdministratorAccess to `<USER_NAME>` temporarily

1. Sign in to the AWS Console
2. Go to **IAM → Users → <USER_NAME> → Add permissions**
3. Attach policy: `AdministratorAccess`

### Step 2 — Bootstrap

```bash
AWS_PROFILE=<your-profile> ROLE=production npx cdk bootstrap aws://<PRD_ACCOUNT_ID>/ap-southeast-1
```

---

## Deploy

### Step 1 — Preview changes (optional)

```bash
AWS_PROFILE=<your-profile> AWS_REGION=ap-southeast-1 ROLE=production npx cdk diff
```

### Step 2 — Deploy

```bash
AWS_PROFILE=<your-profile> AWS_REGION=ap-southeast-1 ROLE=production npm run cdk deploy
```

## Remove AdministratorAccess from `<USER_NAME>`

1. Go to **IAM → Users → <USER_NAME> → Permissions**
2. Detach `AdministratorAccess`

---

## Adding / Removing Users

Edit `src/users.ts`:

```typescript
export const users: UserInfo[] = [
  {
    email: 'user@example.com',
    roles: {
      production: ['read-only'],
    },
  },
];
```

Available production roles:

| Role | Access level |
|------|-------------|
| `read-only` | Read-only across services |
| `power-user` | PowerUserAccess + IAM management |
| `admin` | AdministratorAccess |

Then redeploy:

```bash
AWS_PROFILE=<your-prd-profile> ROLE=production AWS_REGION=ap-southeast-1 ROLE=production npm run cdk deploy
```

---

## Useful Commands

```bash
# Preview changes before deploying
npx cdk diff

# Synthesize CloudFormation template (no deploy)
npx cdk synth

# List stacks
npx cdk list

# Run tests
npm test
```

---

## First-time User Setup

After a user is created by CDK:

1. Sign in to the AWS Console using their email as username and the temporary password set by the admin.
2. Change their password (enforced by the MFA policy).
3. Set up a virtual MFA device (required before assuming any role):
   - IAM → Users → Security credentials → Assign MFA device
4. Sign out and back in with MFA to unlock full access.
5. Assume a role via **Switch Role** in the console, or use CLI:
   ```bash
   aws sts assume-role \
     --role-arn arn:aws:iam::<PRD_ACCOUNT_ID>:role/read-only \
     --role-session-name my-session \
     --serial-number arn:aws:iam::<PRD_ACCOUNT_ID>:mfa/<email> \
     --token-code <MFA_CODE>
   ```
