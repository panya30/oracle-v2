---
title: CdsTween (Critically Damped Spring) ported from Unity C# to JavaScript works per
tags: [cdstween, animation, spring, javascript, threejs, klakmath, physics]
created: 2026-01-17
source: KlakMath JS Port 2026-01-17
---

# CdsTween (Critically Damped Spring) ported from Unity C# to JavaScript works per

CdsTween (Critically Damped Spring) ported from Unity C# to JavaScript works perfectly for smooth particle animation. Formula: n1 = v - (x - target) * (speed² * dt), n2 = 1 + speed * dt, nv = n1 / (n2²). Returns {x: position, v: velocity}. Use with requestAnimationFrame for butter-smooth motion without overshoot.

---
*Added via Oracle Learn*
