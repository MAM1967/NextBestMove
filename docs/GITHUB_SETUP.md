# GitHub Repository Setup Guide

This guide will help you push the NextBestMove documentation and code to your GitHub repository.

---

## Prerequisites

- GitHub account with repository: `MAM1967/NextBestMove`
- Git installed and configured
- Terminal access (you mentioned you're already connected)

---

## Step 1: Initialize Git Repository (if not already done)

If the repository isn't initialized yet:

```bash
cd /Users/michaelmcdermott/NextBestMove
git init
```

---

## Step 2: Add Remote Repository

If the remote isn't already configured, add it:

```bash
git remote add origin https://github.com/MAM1967/NextBestMove.git
```

Or if using SSH:

```bash
git remote add origin git@github.com:MAM1967/NextBestMove.git
```

Verify the remote:

```bash
git remote -v
```

---

## Step 3: Stage All Files

Stage all documentation and project files:

```bash
cd /Users/michaelmcdermott/NextBestMove
git add .
```

---

## Step 4: Create Initial Commit

Commit all files:

```bash
git commit -m "Initial commit: Add complete documentation and specifications

- PRD v0.1
- UI/UX specifications
- Component architecture
- Database schema
- Calendar API specifications
- User stories for sprint planning
- Implementation guide"
```

---

## Step 5: Create Main Branch (if needed)

If you need to set the branch name:

```bash
git branch -M main
```

---

## Step 6: Push to GitHub

Push to the remote repository:

```bash
git push -u origin main
```

If you encounter authentication issues, you may need to:
- Use a personal access token (GitHub Settings > Developer settings > Personal access tokens)
- Or configure SSH keys

---

## Step 7: Verify Upload

Check GitHub repository to confirm all files are uploaded:
- https://github.com/MAM1967/NextBestMove

You should see:
- ✅ README.md
- ✅ .gitignore
- ✅ docs/ folder with all subdirectories
  - docs/PRD/
  - docs/UI-UX/
  - docs/Architecture/
  - docs/Planning/

---

## Future Workflow

### Making Changes

1. **Make changes** to files
2. **Stage changes:**
   ```bash
   git add .
   ```
3. **Commit:**
   ```bash
   git commit -m "Description of changes"
   ```
4. **Push:**
   ```bash
   git push
   ```

### Branching Strategy (Recommended)

For feature development:

```bash
# Create a new branch
git checkout -b feature/daily-plan-generation

# Make changes, commit
git add .
git commit -m "Implement daily plan generation"

# Push branch
git push -u origin feature/daily-plan-generation

# Later, merge to main via GitHub Pull Request
```

---

## File Structure Overview

```
NextBestMove/
├── README.md                    # Main repository README
├── .gitignore                   # Git ignore rules
└── docs/                        # Documentation
    ├── PRD/                     # Product Requirements
    │   ├── NextBestMove_PRD_v1.md
    │   ├── PRD_Mockup_Gap_Analysis.md
    │   └── Mockup_Updates_Summary.md
    ├── UI-UX/                   # Design Specifications
    │   ├── UI_Specifications.md
    │   └── Product_Screenshot_Mock_Copy_v2.md
    ├── Architecture/            # Technical Specifications
    │   ├── Component_Specifications.md
    │   ├── Database_Schema.md
    │   ├── Calendar_API_Specifications.md
    │   ├── Calendar_Integration_Options.md
    │   ├── Calendar_Integration_Summary.md
    │   └── Implementation_Guide.md
    └── Planning/                # User Stories
        └── User_Stories.md
```

---

## Next Steps After Push

1. **Set up GitHub repository settings:**
   - Add description: "Your daily revenue rhythm — simplified"
   - Add topics: `nextjs`, `typescript`, `react`, `supabase`, `calendar-integration`
   - Enable GitHub Pages if you want documentation site

2. **Start development:**
   - Follow [Implementation Guide](Architecture/Implementation_Guide.md)
   - Begin with Sprint 1 from [User Stories](Planning/User_Stories.md)

3. **Set up project board:**
   - Create GitHub Project board
   - Import user stories as issues
   - Organize into sprints

4. **Configure CI/CD (optional):**
   - Set up GitHub Actions for linting
   - Configure deployment to Vercel

---

## Troubleshooting

### Authentication Issues

If you see authentication errors:

**Option 1: Use Personal Access Token**
```bash
# When prompted for password, use your GitHub personal access token
git push
```

**Option 2: Configure SSH**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings > SSH and GPG keys > New SSH key

# Test connection
ssh -T git@github.com
```

### Merge Conflicts

If you have conflicts:
```bash
git pull origin main
# Resolve conflicts, then:
git add .
git commit -m "Resolve merge conflicts"
git push
```

---

## Quick Reference Commands

```bash
# Check status
git status

# View commits
git log --oneline

# View remote
git remote -v

# Pull latest changes
git pull origin main

# Push changes
git push origin main

# Create and switch to branch
git checkout -b branch-name

# Switch branches
git checkout main
```

---

*Ready to start building! 🚀*

