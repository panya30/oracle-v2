# ARCHITECTURE.md - Gitfiti Project Analysis

## Project Overview

**Gitfiti** is a Python utility that generates shell scripts (Bash/PowerShell) to create "pixel art" in a GitHub commit history calendar by backdating commits. It "abuses" Git's ability to accept commits with custom author/committer dates to create visual patterns.

**Purpose**: Decorate GitHub account's contribution graph with custom pixel art designs by generating timestamped commits.

---

## Directory Structure

```
gitfiti/
├── .git/                          # Git repository
├── .gitignore                      # Ignores: *.pyc, gitfiti.sh, gitfiti.ps1
├── .travis.yml                     # CI/CD configuration
├── LICENSE.txt                     # MIT License
├── README.md                       # Project documentation
├── gitfiti.py                      # Main application (single-file)
├── gitfiti-screenshot.png          # Example output visualization
├── pixels-large.png                # Sample art templates
├── pixels.png                      # Sample art templates
└── tests/
    ├── __init__.py                 # Test package marker
    ├── test_str_to_sprite.py       # ASCII→numeric sprite conversion
    └── test_find_max_daily_commits.py  # GitHub calendar parsing
```

---

## Entry Points

1. **Command-line Interface** (`gitfiti.py`)
   - Single executable Python script
   - Interactive prompts drive the workflow
   - Generates platform-specific output scripts

2. **Main Function Flow**:
   ```
   main()
   ├── Request GitHub URL (optional)
   ├── Request GitHub username
   ├── Fetch contribution calendar
   ├── Parse calendar to find max daily commits
   ├── Request repository name
   ├── Request offset (weeks)
   ├── Request multiplier preference
   ├── Load custom templates (optional)
   ├── Select image template
   ├── Request target shell (bash/powershell)
   └── Generate & save shell script
   ```

---

## Core Abstractions

### 1. Pixel Art Templates
- **Format**: 2D arrays of integers 0-4 (intensity levels)
- **Mapping**: 0=blank, 1-4=light→dark green
- **Built-in**: KITTY, ONEUP, OCTOCAT, HELLO, HEART, HIREME, BEER, GLIDERS

### 2. Date & Commit Generation
- `get_start_date()`: First Sunday of year ago
- `generate_next_dates()`: Generator yielding dates column-by-column
- `generate_values_in_date_order()`: Yields pixel values in calendar order
- `commit()`: Generates single commit command with date env vars

### 3. GitHub Integration
- `retrieve_contributions_calendar()`: Fetch HTML/SVG
- `parse_contributions_calendar()`: Extract daily commit counts
- `calculate_multiplier()`: Scale to user's commit history

---

## Dependencies

**None!** Pure Python stdlib:
- `datetime`, `timedelta`, `itertools`, `json`, `math`, `os`, `urllib`

---

## Data Flow

```
User Input (interactive)
    ↓
GitHub Calendar (HTML/SVG)
    ↓
Parse Contributions → find max commits
    ↓
Select Template (built-in or custom)
    ↓
Calculate Multiplier
    ↓
Generate Dates (column-by-column)
    ↓
Zip Pixel Values with Dates
    ↓
Generate Commits (GIT_AUTHOR_DATE)
    ↓
Save Shell Script
    ↓
User runs → backdated commits → push
```

---

## Key Insight

The magic: Git's `--allow-empty` flag allows commits with no content, and `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` environment variables override timestamps. GitHub's calendar uses commit dates, so backdated empty commits create pixel art.
