# Gitfiti Learning Index

## Overview
**Repository**: https://github.com/gelstudios/gitfiti
**Author**: Eric Romano (@gelstudios)
**License**: MIT
**Language**: Python (2.7+ / 3.x)

## Latest Exploration
**Date**: 2026-01-18

**Files**:
- [2026-01-18_ARCHITECTURE](2026-01-18_ARCHITECTURE.md) - Project structure & design
- [2026-01-18_CODE-SNIPPETS](2026-01-18_CODE-SNIPPETS.md) - Key implementations
- [2026-01-18_QUICK-REFERENCE](2026-01-18_QUICK-REFERENCE.md) - Usage guide

## Key Insights

### What It Does
Creates pixel art in GitHub contribution calendars by generating shell scripts that make backdated empty commits.

### Clever Tricks
1. **Git date override**: `GIT_AUTHOR_DATE` env var sets commit timestamp
2. **Empty commits**: `--allow-empty` creates commits without file changes
3. **Calendar math**: 7 rows (days) × N columns (weeks), traversed column-first
4. **Zero dependencies**: Pure Python stdlib

### Design Patterns
- Generator-based date/value iteration
- Template-based shell script generation
- Interactive CLI workflow
- HTML parsing without regex

## Timeline

### 2026-01-18 (First exploration)
- Initial discovery
- Core: Backdated empty commits create visual patterns
- Clean single-file architecture
- Fun creative coding project

---

*Explored by Robin 💜*
