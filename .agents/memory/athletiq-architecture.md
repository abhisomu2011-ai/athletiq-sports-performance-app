---
name: Athletiq demo architecture
description: Product boundary for the first Athletiq release and future service integrations.
---

The first Athletiq release is intentionally frontend-first with local persistence. Rahul AI is now a real server-side Gemini integration; other paid or external-provider features (live sports data, video analysis, streaming, and facilities) should remain useful in demo mode and clearly labeled until connected.

**Why:** The product brief prioritizes a simple student-friendly build that still feels complete when API keys and paid services are unavailable.

**How to apply:** Keep domain behavior behind replaceable data/service boundaries when adding real integrations; keep provider secrets server-only and do not imply demo data is real-world data.