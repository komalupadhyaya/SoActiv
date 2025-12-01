# Complete Git Push Tutorial with PAT Token Authentication

## Table of Contents
1. [Overview](#overview)
2. [Step-by-Step Process](#step-by-step-process)
3. [PAT Token Usage](#pat-token-usage)
4. [Common Git Commands](#common-git-commands)
5. [HTTPS vs SSH](#https-vs-ssh)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This tutorial explains how to push code to GitHub using HTTPS with Personal Access Token (PAT) authentication.

**What we accomplished:**
- Connected local repository to GitHub remote
- Authenticated using PAT token
- Pushed code to the `dev` branch
- Handled merge conflicts with force push

---

## Step-by-Step Process

### Step 1: Check Current Git Configuration

```bash
git remote -v
```

**Output:**
```
origin  https://github.com/komalupadhyaya/SoActiv.git (fetch)
origin  https://github.com/komalupadhyaya/SoActiv.git (push)
```

**What this shows:** The remote repository URL (without authentication)

---

### Step 2: Check Current Branch and Status

```bash
git status
git branch -a
```

**Output:**
```
On branch dev
nothing to commit, working tree clean
```

**What this shows:** 
- Current branch: `dev`
- No uncommitted changes
- Ready to push

---

### Step 3: First Push Attempt (Failed)

```bash
git push origin dev
```

**Error:**
```
remote: Repository not found.
fatal: repository 'https://github.com/komalupadhyaya/SoActiv.git/' not found
```

**Why it failed:** No authentication credentials in the URL

---

### Step 4: Add PAT Token to Remote URL ⭐ (MOST IMPORTANT)

```bash
git remote set-url origin https://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@github.com/komalupadhyaya/SoActiv.git
```

**URL Structure Breakdown:**
```
https://[PAT_TOKEN]@github.com/[USERNAME]/[REPO_NAME].git
```

- `https://` - Protocol
- `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` - **PAT Token (acts as password)**
- `@github.com` - GitHub server
- `/komalupadhyaya/SoActiv.git` - Repository path

**Verify the change:**
```bash
git remote -v
```

---

### Step 5: Second Push Attempt (Rejected)

```bash
git push origin dev
```

**Error:**
```
! [rejected]        dev -> dev (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally
```

**Why it failed:** Remote branch has different commits (unrelated histories)

---

### Step 6: Handle Unrelated Histories

**Option A: Pull and Merge (Preserve both versions)**
```bash
git pull origin dev --allow-unrelated-histories
```

**Result:** Merge conflicts in 22+ files

**Option B: Force Push (Replace remote with local)** ✅ (What we did)
```bash
git merge --abort  # Cancel the merge
git push origin dev --force
```

**Success Output:**
```
Enumerating objects: 157, done.
Counting objects: 100% (157/157), done.
Writing objects: 100% (157/157), 250.96 KiB | 5.12 MiB/s, done.
To https://github.com/komalupadhyaya/SoActiv.git
 + 3f61ab6...6f18901 dev -> dev (forced update)
```

---

### Step 7: Push Additional Changes (Normal Workflow)

When you moved files to `fe/doc/` folder:

```bash
# 1. Stage all changes
git add -A

# 2. Commit with message
git commit -m "Reorganize documentation and sample files into fe/doc folder"

# 3. Push to remote
git push origin dev
```

**Success Output:**
```
Enumerating objects: 7, done.
Writing objects: 100% (4/4), 799 bytes | 114.00 KiB/s, done.
To https://github.com/komalupadhyaya/SoActiv.git
   6f18901..2a89401  dev -> dev
```

---

## PAT Token Usage

### What is a PAT Token?

**PAT (Personal Access Token)** is a secure authentication method for Git operations, replacing traditional passwords.

### Why Use PAT Tokens?

- GitHub **no longer accepts passwords** for HTTPS authentication (since August 2021)
- More secure than passwords
- Can set specific permissions (scopes)
- Can set expiration dates
- Can be revoked anytime

### When to Use PAT Tokens?

- ✅ Pushing/pulling from private repositories
- ✅ Using HTTPS instead of SSH
- ✅ When you don't have SSH keys set up
- ✅ Automated scripts and CI/CD pipelines

### Where to Get a PAT Token?

1. Go to **GitHub.com**
2. Click your profile → **Settings**
3. Scroll down → **Developer settings**
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token (classic)**
6. Give it a name (e.g., "SoActiv Project")
7. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if using GitHub Actions)
8. Click **Generate token**
9. **⚠️ COPY THE TOKEN IMMEDIATELY** (you can only see it once!)

### How to Use PAT Token?

**Method 1: Embed in Remote URL** (What we did)
```bash
git remote set-url origin https://[TOKEN]@github.com/[USERNAME]/[REPO].git
```

**Example:**
```bash
git remote set-url origin https://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@github.com/komalupadhyaya/SoActiv.git
```

**Method 2: Use Git Credential Manager** (More secure)
```bash
# Enable credential storage
git config --global credential.helper store

# Push (will prompt for credentials)
git push origin dev

# Enter:
# Username: komalupadhyaya
# Password: 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
```

**Method 3: Use Git Credential Manager Core** (Most secure)
```bash
# Install Git Credential Manager (comes with Git for Windows)
# It will automatically prompt and store credentials securely
git push origin dev
```

### Security Considerations

⚠️ **IMPORTANT:** When you embed the token in the URL, it's stored in plain text in `.git/config`

**To remove the token from URL:**
```bash
git remote set-url origin https://github.com/komalupadhyaya/SoActiv.git
```

Then use credential manager instead.

**Never:**
- ❌ Share your PAT token publicly
- ❌ Commit PAT tokens to repositories
- ❌ Use the same token for multiple projects (create separate tokens)

---

## Common Git Commands

### Repository Setup
```bash
# Initialize a new repository
git init

# Clone an existing repository
git clone https://github.com/username/repo.git

# Add remote repository
git remote add origin https://github.com/username/repo.git

# Change remote URL
git remote set-url origin https://github.com/username/repo.git

# View remote repositories
git remote -v

# Remove remote
git remote remove origin
```

### Checking Status
```bash
# Check current status
git status

# View commit history
git log

# View commit history (one line per commit)
git log --oneline

# View branches
git branch

# View all branches (including remote)
git branch -a
```

### Staging and Committing
```bash
# Stage specific file
git add filename.txt

# Stage all files in current directory
git add .

# Stage all changes (new, modified, deleted)
git add -A

# Unstage file
git restore --staged filename.txt

# Commit staged changes
git commit -m "Your commit message"

# Stage and commit tracked files in one command
git commit -am "Your commit message"

# Amend last commit
git commit --amend -m "New commit message"
```

### Branching
```bash
# Create new branch
git branch branch-name

# Switch to branch
git checkout branch-name

# Create and switch to new branch
git checkout -b branch-name

# Create branch from specific branch
git checkout -b new-branch existing-branch

# Delete local branch
git branch -d branch-name

# Delete local branch (force)
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name

# Rename current branch
git branch -m new-name
```

### Pushing and Pulling
```bash
# Push to remote
git push origin branch-name

# Push and set upstream
git push -u origin branch-name

# Force push (⚠️ dangerous)
git push origin branch-name --force

# Pull from remote
git pull origin branch-name

# Fetch without merging
git fetch origin

# Fetch all branches
git fetch --all
```

### Merging
```bash
# Merge branch into current branch
git merge branch-name

# Merge with unrelated histories
git merge branch-name --allow-unrelated-histories

# Abort merge
git merge --abort
```

### Undoing Changes
```bash
# Discard changes in working directory
git restore filename.txt

# Discard all changes
git restore .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a commit (creates new commit)
git revert commit-hash
```

---

## HTTPS vs SSH

| Feature | HTTPS | SSH |
|---------|-------|-----|
| **URL Format** | `https://github.com/user/repo.git` | `git@github.com:user/repo.git` |
| **Authentication** | PAT Token or Password | SSH Key Pair |
| **Setup Difficulty** | Easy | Medium |
| **Security** | Good (with PAT) | Excellent |
| **Expiration** | Token can expire | Keys don't expire |
| **Firewall** | Works through most firewalls | May be blocked by some firewalls |
| **Best For** | Quick setup, CI/CD | Daily development work |

### How to Switch to SSH

**Step 1: Generate SSH Key**
```bash
ssh-keygen -t ed25519 -C "komalsoftiatric@gmail.com"
```

Press Enter to accept default location (`~/.ssh/id_ed25519`)

**Step 2: Copy Public Key**
```bash
# Windows
type %USERPROFILE%\.ssh\id_ed25519.pub

# Linux/Mac
cat ~/.ssh/id_ed25519.pub
```

**Step 3: Add to GitHub**
1. Go to GitHub.com → Settings
2. Click **SSH and GPG keys**
3. Click **New SSH key**
4. Paste your public key
5. Click **Add SSH key**

**Step 4: Change Remote URL**
```bash
git remote set-url origin git@github.com:komalupadhyaya/SoActiv.git
```

**Step 5: Test Connection**
```bash
ssh -T git@github.com
```

---

## Best Practices

### 1. Commit Messages
```bash
# ✅ Good commit messages
git commit -m "Add user authentication feature"
git commit -m "Fix login button alignment issue"
git commit -m "Update README with installation instructions"

# ❌ Bad commit messages
git commit -m "update"
git commit -m "fix"
git commit -m "changes"
```

### 2. Branching Strategy
```bash
# Main branches
main/master  - Production-ready code
dev          - Development branch
staging      - Pre-production testing

# Feature branches
feature/user-auth
feature/payment-integration

# Bug fix branches
bugfix/login-error
hotfix/critical-security-patch
```

### 3. Before Pushing
```bash
# Always check status
git status

# Review changes
git diff

# Pull latest changes
git pull origin branch-name

# Then push
git push origin branch-name
```

### 4. Security
- ✅ Use `.gitignore` to exclude sensitive files
- ✅ Never commit passwords, API keys, or tokens
- ✅ Use environment variables for secrets
- ✅ Rotate PAT tokens regularly
- ✅ Use SSH keys for better security

### 5. Collaboration
- ✅ Pull before you push
- ✅ Communicate before force pushing
- ✅ Use pull requests for code review
- ✅ Keep commits small and focused
- ✅ Write descriptive commit messages

---

## Troubleshooting

### Problem 1: Repository Not Found
```
fatal: repository 'https://github.com/user/repo.git/' not found
```

**Solutions:**
- Check if repository exists
- Verify repository name and username
- Add PAT token to URL
- Check repository permissions

### Problem 2: Authentication Failed
```
remote: Invalid username or password.
fatal: Authentication failed
```

**Solutions:**
- Use PAT token instead of password
- Verify PAT token has correct permissions
- Check if token has expired
- Use `git credential-cache` or credential manager

### Problem 3: Updates Rejected
```
! [rejected]        dev -> dev (fetch first)
error: failed to push some refs
```

**Solutions:**
```bash
# Option 1: Pull and merge
git pull origin dev

# Option 2: Pull with rebase
git pull origin dev --rebase

# Option 3: Force push (⚠️ only if you're sure)
git push origin dev --force
```

### Problem 4: Merge Conflicts
```
CONFLICT (content): Merge conflict in file.txt
Automatic merge failed; fix conflicts and then commit the result.
```

**Solutions:**
```bash
# Option 1: Resolve conflicts manually
# Edit conflicted files, then:
git add .
git commit -m "Resolve merge conflicts"

# Option 2: Abort merge
git merge --abort

# Option 3: Use their version
git checkout --theirs file.txt

# Option 4: Use our version
git checkout --ours file.txt
```

### Problem 5: Unrelated Histories
```
fatal: refusing to merge unrelated histories
```

**Solutions:**
```bash
git pull origin dev --allow-unrelated-histories
```

---

## Quick Reference Cheat Sheet

```bash
# Setup
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Daily Workflow
git status                          # Check status
git add -A                          # Stage all changes
git commit -m "message"             # Commit changes
git pull origin branch-name         # Pull latest changes
git push origin branch-name         # Push changes

# Branching
git checkout -b new-branch          # Create and switch to new branch
git checkout branch-name            # Switch branch
git merge branch-name               # Merge branch

# Remote
git remote -v                       # View remotes
git remote add origin URL           # Add remote
git remote set-url origin URL       # Change remote URL

# Undo
git restore file.txt                # Discard changes
git reset --soft HEAD~1             # Undo last commit (keep changes)
git merge --abort                   # Abort merge
```

---

## Summary of Your Specific Case

### What We Did:
1. ✅ Checked git configuration and status
2. ✅ Added PAT token to remote URL for authentication
3. ✅ Force pushed local code to replace remote dev branch
4. ✅ Pushed additional file reorganization changes

### Commands Used:
```bash
git remote -v
git status
git remote set-url origin https://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@github.com/komalupadhyaya/SoActiv.git
git push origin dev --force
git add -A
git commit -m "Reorganize documentation and sample files into fe/doc folder"
git push origin dev
```

### Key Takeaways:
- **PAT Token** was embedded in the remote URL for HTTPS authentication
- **Force push** was used to replace remote branch with local version
- **Normal push** worked after initial setup for subsequent changes

---

## Additional Resources

- [GitHub Docs - Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

---

**Created for:** SoActiv Project  
**Author:** Komal Upadhyaya  
**Date:** 2025-11-05  
**Repository:** https://github.com/komalupadhyaya/SoActiv

