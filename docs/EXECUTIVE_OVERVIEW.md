# Pandita's Adaptive Demand Decision Layer (ADDL)
**Executive Overview, Retail Problem Statements & AI Architecture**

---

## 1. What This Platform Does

**Pandita's Adaptive Demand Decision Layer (ADDL)** is an AI-native **intelligence and decision overlay** that sits on top of a retailer’s existing ERP, merchandising, and POS systems (such as SAP S/4HANA, Blue Yonder, o9, Snowflake, and Shopify Plus) without requiring a costly "rip-and-replace."

While traditional planning tools output static forecast numbers in dense spreadsheet grids, ADDL converts **probabilistic demand forecasts, real-time inventory positions, open purchase orders, and remaining seasonal selling windows** into **concrete, financially quantified inventory actions**:

1. **Automated Stockout De-Censoring ("True Demand Recovery"):** Detects historical days/weeks where store or e-commerce inventory hit zero and reconstructs unconstrained latent demand so forecasting models are never fooled into under-ordering next season.
2. **Intelligent Series Routing:** Classifies every SKU-store/channel series into its structural archetype (*Established Core Basics, Promotional Peaks, Seasonal/Weather-Sensitive, Cold-Start New Launches, and Long-Tail/Intermittent*) and routes it to the optimal model family.
3. **Selective, Guardrailed Context Reasoning:** Uses an LLM Agent with strict confidence thresholds ($\ge 0.80$) to adjust forecasts *only* when unstructured external signals (promotional hero slots, viral social velocity, regional weather anomalies, or competitor stockouts) demonstrably improve accuracy—blocking noisy adjustments on stable core items.
4. **Asymmetric Risk & Quantile Decision Engine:** Translates probabilistic prediction intervals ($P_{10}, P_{50}, P_{90}$) into executable actions:
   - **Buy Adjustments & Replenishment Expansions** (targeting $P_{80}$–$P_{85}$ on high-margin promotional winners).
   - **Lateral DC-to-Store & Inter-Store Transfers** (rebalancing stock toward wet-weather or high-velocity clusters).
   - **Early Shallow Markdown Triggers** (triggering a 15% markdown early in a compressed selling window to avoid a 55% end-of-season clearance liquidation).
   - **Cold-Start Size-Curve Allocations** (using multimodal visual + attribute similarity to forecast brand-new styles and optimize size curves across US sizes).
5. **Exception-First Planner Command Center:** Keeps 90%+ of healthy SKUs quiet and surfaces only the highest-ROI exceptions with 1-click **Approve, Modify (What-If Simulation), or Override with Mandatory Reason Logging**, feeding real-world inventory outcomes back into the router in a closed loop.

---

## 2. What Problems It Solves

Retailers lose billions annually not because they lack historical data, but because **forecasts are disconnected from inventory decisions**. ADDL solves four P&L-critical retail problems:

### Problem 1: Excess Inventory Tying Up Cash & Forcing Deep Late Markdowns
* **The Retail Reality:** Retailers typically carry **20–30% more inventory than needed**, with annual carrying costs running **20–30% of inventory value**. On a $10M inventory pool, 25% overstock locks up **$2.5M in working capital** and burns **$500K–$750K/year** in holding costs before end-of-season clearance markdowns destroy gross margin.
* **How ADDL Solves It:** Evaluates probabilistic demand decay against the remaining selling window. When post-peak velocity slows (e.g., seasonal suede mules with 6 weeks left), ADDL recommends cancelling uncommitted vendor PO units and triggering an immediate **15% shallow price promotion**—cutting excess weeks of supply from **4.8 weeks to 2.3 weeks** and freeing **$1.12M+ in working capital** per $10M inventory pool.

### Problem 2: Stockouts & Missed Sales During Promotions, Peaks, and New Launches
* **The Retail Reality:** Retail out-of-stock rates hover near **8%**, and promotional items stock out at **2x the rate of regular items**. When a shopper encounters a stockout (or a missing core footwear size like US 7.5), **31% switch to a competitor**, costing retailers **~4% of top-line revenue**.
* **How ADDL Solves It:** De-censors prior stockouts, applies selective promo/social lift reasoning, and targets upper quantiles ($P_{85}$) where lost-sale margin ($65%+$) far outweighs holding cost. For new seasonal launches with zero history, multimodal look-alike priors prevent core-size stockouts, lifting peak availability by **+5.2 percentage points**.

### Problem 3: Planners Spending 80% of Their Time Fixing Forecasts Instead of Deciding
* **The Retail Reality:** Merchandising and demand planners spend their week manually overriding hundreds of noisy statistical rows across disconnected spreadsheets without clear visibility into the dollar impact of their edits.
* **How ADDL Solves It:** Replaces spreadsheet firefighting with **Management by Exception**. Out of 168 SKUs in a category, 161 stay on automated autopilot while planners review only the **7 highest-value exception cards**, supported by interactive **What-If Sliders** and a **Natural Language Copilot**—saving **18.5 planner hours per week** with an **~89% 1-click acceptance rate**.

### Problem 4: No Closed Loop Between Forecast Accuracy and Real Business Outcomes
* **The Retail Reality:** Legacy systems measure WAPE or bias in a vacuum; models never learn whether an adjustment actually reduced excess weeks or prevented a markdown.
* **How ADDL Solves It:** Tracks realized **Excess Weeks of Supply, In-Stock Rate %, and Markdown Depth** after every cycle, automatically updating model routing weights and tightening LLM confidence guardrails so the system continuously self-improves.

---

## 3. Tech Stack & AI Architecture

### A. AI & Quantitative Forecasting Layer
* **Time-Series Foundation Models (TSFMs):**
  * **Chronos-2 (Apache 2.0 Open-Weight) & Google TimesFM:** Zero-shot probabilistic forecasting engines capable of generating calibrated quantile distributions ($P_{10}$ to $P_{90}$) across regime shifts, promotional spikes, and short-history series without per-SKU parameter tuning.
* **Classical Statistical & ML Baseline Suite:**
  * **StatsForecast (`AutoETS`, `AutoARIMA`, `SeasonalNaive`, `CrostonOptimized`) & LightGBM:** High-speed, low-variance statistical models used in ensemble for stable, long-history core basics (`Established Core`).
* **Latent Demand De-Censoring Pre-Processor:**
  * Imputes unconstrained true demand on historical stockout days (`EOH Inventory = 0`) using intraday store traffic velocity and cross-size depletion ratios before feeding series to the router.
* **Selective Context & Reasoning Agent (LLM with Tool-Calling & Guardrails):**
  * Evaluates unstructured retail signals (marketing calendars, regional NOAA weather anomalies, social/PDP save velocity, competitor OOS monitors).
  * **Governance Guardrail:** Constrained by a backtested confidence gate ($\text{Confidence} \ge 0.80$). If a signal is weak or noisy, the guardrail blocks the adjustment (`0.0% delta`) and logs the rejection.
* **Multimodal Cold-Start Embedding Engine:**
  * Encodes product imagery (silhouette, texture, color palette) and merchandising attributes (MSRP tier, material, launch season) into vector embeddings, retrieving the **Top-3 historical look-alike launches** via Cosine Similarity to condition Chronos-2 zero-shot launch curves and optimize **size-curve allocations**.
* **Stochastic Inventory & Asymmetric Risk Decision Engine:**
  * Computes optimal order, transfer, and markdown quantities by solving the asymmetric cost trade-off between **underage cost** (lost gross margin + customer churn) and **overage cost** (carrying cost + end-of-season salvage markdown).

### B. Application, Data & Enterprise Integration Stack
* **Frontend Command Center:** React 19, TypeScript, Tailwind CSS v4, custom high-contrast SVG Probabilistic Fan & Inventory Sawtooth Canvas, Interactive What-If Simulation Engine, and Natural Language Planner Copilot.
* **Quantitative Simulation & Backtest Pipeline:** Python 3.13 (`engine/generate_retail_data.py`) + client-side BYOD holdout validation engine for instant browser-based CSV backtesting.
* **Enterprise Data & ERP Overlay Connectors:**
  * **Cloud Data Warehouses:** Snowflake Data Cloud (Read-Only Secure Share), Google Cloud BigQuery, Databricks.
  * **ERP & Planning Systems:** SAP S/4HANA Fashion & Retail (OData / BAPI for `MARA`, `MARD`, `EKKO/EKPO`), Blue Yonder, o9 Solutions.
  * **Omnichannel POS & Commerce:** Shopify Plus GraphQL Admin API, Salesforce Commerce Cloud.
