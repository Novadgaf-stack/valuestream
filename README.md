# 🌍 VisionStream: The Multi-Agent Reality Auditor

![MarketForce Hero](https://github.com/user-attachments/assets/PLACEHOLDER-FOR-YOUR-HUD-SCREENSHOT)

> **Digitizing trust for the next billion users.** > A PWA that transforms any smartphone into an enterprise-grade appraisal tool using a **Gemini 3 "Hive Mind"**.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-blue?style=for-the-badge&logo=vercel)](https://real-time-appraiser.vercel.app/)
[![Video Demo](https://img.shields.io/badge/Video-Watch%20Demo-red?style=for-the-badge&logo=youtube)](YOUR-YOUTUBE-LINK)
[![Gemini 3](https://img.shields.io/badge/AI-Gemini%203-purple?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

---

## 💡 The Problem
In emerging markets like **Nigeria**, millions of merchants possess valuable physical inventory but lack the documented credit history to access capital. Banks can't "see" what they own, so they can't lend.

**The Result:** A $5.2 Trillion global credit gap for MSMEs.

## 🚀 The Solution
**MarketForce** is an Edge-Native PWA that audits physical assets in real-time. Instead of a single AI "guessing" a price, we engineered a **Multi-Agent Consensus Engine** that simulates a human expert panel.

### 🧠 The "Hive Mind" Architecture
When you scan an object, we spawn **three parallel Gemini 1.5 Flash agents** on the Edge that debate its value live:

| Agent | Role | Persona |
| :--- | :--- | :--- |
| 🔴 **The Bear** | **Risk Analyst** | Pessimistic. Scans for damage, wear, scratches, and depreciation. |
| 🟢 **The Bull** | **Market Speculator** | Optimistic. Identifies brand value, vintage appeal, and utility. |
| 🟡 **The Judge** | **Final Arbiter** | Synthesizes the debate into a final, volatility-adjusted market value. |

---

## ✨ Key Features

### 1. 🎥 Cinematic "Boot Sequence"
We ditched standard login screens for a **sci-fi initialization sequence** that builds trust and hides the camera permission request behind a narrative interaction.

### 2. ⚡ Real-Time "Edge" Reasoning
Powered by **Supabase Edge Functions** and **Gemini 1.5 Flash**, our vision pipeline runs at **<200ms latency**. We handle race conditions using `AbortController` logic to cancel stale reasoning streams instantly when the camera moves.

### 3. 🌐 Grounded in Reality (Firecrawl)
We don't just hallucinate prices. The agents use **Firecrawl** to perform live web searches (eBay, Amazon, Poshmark) during the scan to ground their valuations in real-time market data.

### 4. 📱 PWA & Offline First
Built for Lagos, not just London. MarketForce is an installable PWA that works on low-end Android devices and caches audit reports for offline access.

---

## 🛠️ Tech Stack

* **AI Model:** Google Gemini 1.5 Flash (via Gemini 3 API)
* **Frontend:** React, Vite, Tailwind CSS, Framer Motion
* **Backend:** Supabase (Edge Functions, Realtime, Database)
* **Search Grounding:** Firecrawl API
* **Deployment:** Vercel

---

## 📸 Architecture Diagram

```mermaid
graph TD
    User[📱 Mobile Camera] -->|Frame Stream| Edge[⚡ Supabase Edge Function]
    Edge -->|Parallel Request| Gemini1[🔴 Bear Agent]
    Edge -->|Parallel Request| Gemini2[🟢 Bull Agent]
    Edge -->|Parallel Request| Gemini3[🟡 Judge Agent]
    
    Gemini1 & Gemini2 -->|Debate Stream| UI[🖥️ HUD Interface]
    Gemini3 -->|Final Price| UI
    
    UI -->|Audit Stream| DB[(Supabase Realtime)]
    DB -->|Live View| LoanOfficer[🏦 Remote Banker]
