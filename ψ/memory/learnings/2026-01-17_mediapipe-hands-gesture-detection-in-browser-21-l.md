---
title: MediaPipe Hands gesture detection in browser: 21 landmarks per hand. Finger exte
tags: [mediapipe, gesture, hand-tracking, javascript, browser, detection, landmarks]
created: 2026-01-17
source: Gesture Control Integration 2026-01-17
---

# MediaPipe Hands gesture detection in browser: 21 landmarks per hand. Finger exte

MediaPipe Hands gesture detection in browser: 21 landmarks per hand. Finger extended check: tip.y < pip.y (screen coords inverted). Pinch: distance(landmark[4], landmark[8]) < 0.06. Use 5-frame gesture buffer for debouncing to prevent flickering. Hand center: average of wrist(0) and middle_mcp(9) for rotation control.

---
*Added via Oracle Learn*
