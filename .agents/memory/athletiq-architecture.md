---
name: Athletiq demo architecture
description: Product boundary for the first Athletiq release and future service integrations.
---

The first Athletiq release is intentionally frontend-first with local persistence. Features that would require paid or external providers (Rahul AI, live sports data, video analysis, streaming, and facilities) should remain useful in demo mode and clearly labeled until a real provider is connected.

**Why:** The product brief prioritizes a simple student-friendly build that still feels complete when API keys and paid services are unavailable.

**How to apply:** Keep domain behavior behind replaceable data/service boundaries when adding real integrations; do not imply demo data is real-world data.