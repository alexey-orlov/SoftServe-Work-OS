# Installation Guide

Get your Team OS up and running in 15 minutes.

## What You'll Install

1. **Claude Code** - Your AI coding assistant in the terminal
2. **Cursor** - AI-powered code editor (optional but recommended)
3. **This Repository** - Your Team OS files

---

## Step 1: Install Claude Code

### Prerequisites
- MacOS, Linux, or Windows with WSL
- Terminal access
- Stable internet connection
- One of: **Claude Pro** ($20/mo), **Claude Max** ($100-200/mo), or an Anthropic API key (get one at console.anthropic.com)

### Installation

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Verify Installation
```bash
claude --version
```

You should see version information printed.

### Set Your API Key
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

**Make it permanent** by adding to your shell config:

```bash
# For bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 2: Download Team OS

1. Download the zip file from your purchase
2. Extract to a folder called `team-os`
3. Open terminal and navigate to that folder:
```bash
cd ~/Downloads/team-os
```

---

## Step 3: Install Cursor (Optional)

Cursor is a fork of VS Code with AI built in. Great for editing markdown files and code.

### Download
Visit: https://cursor.sh

### Why Cursor?
- Built-in AI chat (Cmd+K for inline edits, Cmd+L for chat)
- Great markdown preview
- Git integration
- File tree navigation
- Works seamlessly with Claude Code

### Alternative
You can use any text editor you prefer:
- VS Code
- Sublime Text
- Even TextEdit/Notepad works

---

## Step 4: First Test Run

Let's verify everything works:

### Test 1: Claude Code Basics
```bash
cd team-os
claude "Read CLAUDE.md and explain what this system does"
```

You should see Claude read the master context file and explain the Team OS.

### Test 2: Use a Slash Command
```bash
claude "Use /meeting-notes to process this transcript: 'Had a meeting with Sarah about the new dashboard. She wants faster load times and better mobile support. Action items: research competitors, prototype in Figma, schedule follow-up.'"
```

Claude should format this into structured meeting notes with action items.

### Test 3: Create a File
```bash
claude "Create a one-pager for a feature that adds voice notes to our task manager"
```

Claude should generate a one-pager document.

---

## Step 5: Customize Your Setup

### How Claude Code Uses Your Context
Claude Code automatically reads `CLAUDE.md` when you launch it in the Team OS repo directory -- no need to tell it manually. Just start Claude Code in the project folder and it will understand the full system.

### Create a Shortcut (Optional)
Add this to your `.bashrc` or `.zshrc`:

```bash
alias teamos="cd ~/path/to/team-os && claude"
```

Now you can just type `teamos` to start a session!

---

## Common Issues

### Installation timeout or network errors
- **Issue:** Connection timeout when downloading Claude Code
- **Fix:** Ensure you have a stable internet connection and retry
- **Check:** Your firewall/VPN isn't blocking access to Google Cloud Storage
- If problems persist, try from a different network

### "claude: command not found"
- Restart your terminal
- Check installation with: `which claude`
- If using npm install, make sure your npm global bin directory is in your PATH
- Re-run the installation command

### "API key not set"
- Run: `echo $ANTHROPIC_API_KEY`
- If empty, set it: `export ANTHROPIC_API_KEY='your-key'`
- Add to shell config for persistence

### Claude doesn't read files
- Check you're in the team-os repo directory: `pwd`
- Try absolute paths: `claude "Read /full/path/to/CLAUDE.md"`

### Hooks don't fire
- Make the scripts executable: `chmod +x .claude/hooks/*.sh`
- Hooks load at session start — restart the session after changing `.claude/settings.json`
- Test standalone: `bash .claude/hooks/session-start.sh` must print the briefing and exit 0

### Rate limits
- Anthropic API has rate limits
- Wait a minute and try again
- Consider upgrading your API tier at console.anthropic.com

---

## File Structure Reminder

```
team-os/
├── CLAUDE.md                    ← Master context + governance rules (loads every session)
├── .claude/
│   ├── skills/                  ← 51 slash-command skills (flat; grouped via skills/CLAUDE.md)
│   ├── hooks/                   ← session-start briefing + write-guard (wired in settings.json)
│   ├── references/              ← write-back contract (cross-skill rules)
│   ├── agents/reviewers/        ← reviewer perspectives for /prd-review-panel
│   └── team-learnings.md        ← agent-behavior rules, injected each session
├── product-development/         ← the wiki: all product, eng, analytics, design artifacts
│   ├── feature-index.yaml       ← the product map (protected — changes confirmed)
│   ├── _meta/                   ← write policy, ingestion ledger, health reports, proposals
│   └── product/initiatives/     ← one living page per current work effort
├── os-installation/             ← you are here
├── .github/                     ← wiki-lint Action (PR check + weekly health issue)
└── .freshness-ignore            ← staleness exceptions
```

---

## Make It a Git Repo (required)

The governance loop reads git history (staleness tiers, weekly synthesis, protected-path
audit). If you didn't clone this from GitHub:

```bash
git init && git add -A && git commit -m "baseline: Team OS install"
chmod +x .claude/hooks/*.sh
```

When you push to GitHub, finish enforcement setup per
`claude-code/scheduled-governance.md` (push ruleset + the wiki-lint Action activate there).

---

## Next Steps

1. ✅ You've installed everything
2. ✅ Then: Run through the first session checklist → `first-session-checklist.md`
3. 🔒 When on GitHub: set up `claude-code/scheduled-governance.md`

---

## Need Help?

**Documentation Issues:** Check the README.md in the root folder

**Claude Code Issues:** Visit docs.anthropic.com/claude/docs/claude-code

**Feature Requests:** This is your system—customize it! Add your own slash commands, sub-agents, and workflows.

---

**Time Investment:** 15 minutes  
**Skill Level:** No coding required  
**Support:** Community-maintained, modify as needed
