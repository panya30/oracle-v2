---
title: Marathon Session Pattern: Long sessions (3+ hours) benefit from multiple checkpo
tags: [workflow, rrr, marathon, context, checkpoint, memory]
created: 2026-01-17
source: Robin Session 2026-01-17
---

# Marathon Session Pattern: Long sessions (3+ hours) benefit from multiple checkpo

Marathon Session Pattern: Long sessions (3+ hours) benefit from multiple checkpoint RRRs throughout rather than one at the end. Each RRR creates a restore point that survives context compaction. Pattern: Work → RRR → Work → RRR → Work → RRR. This captures insights fresh and makes progress visible.

---
*Added via Oracle Learn*
