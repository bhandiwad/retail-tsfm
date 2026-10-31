# User Documentation
## Pandita's Adaptive Demand Decision Layer (ADDL)

Welcome to the user guide for **Pandita's Adaptive Demand Decision Layer**. This guide covers how Demand Planners, Merchandisers, Supply Chain Managers, and Retail Executives use the platform to manage inventory exceptions, simulate scenarios, launch cold-start products, and validate custom retail datasets.

---

## 1. Platform Navigation Overview

The top navigation bar provides access to four specialized operational workspaces, plus global tools:

1. **Exception Command Center:** Your daily management-by-exception workspace for reviewing prioritized SKU recommendations, inspecting probabilistic forecasts, running What-If simulations, and approving/overriding actions.
2. **Cold-Start Launch Studio:** Multimodal visual and attribute matching workspace for forecasting brand-new seasonal styles with zero sales history and optimizing footwear size curves.
3. **Model Routing & P&L Impact:** Portfolio-wide model routing matrix across all 5 SKU archetypes, closed-loop feedback ledger, and interactive Working Capital & Margin ROI simulator.
4. **Data Ingestion & ERP Connectors:** Self-service Bring-Your-Own-Data (BYOD) CSV upload sandbox and enterprise connector configuration for Snowflake, SAP S/4HANA, Blue Yonder, and Shopify Plus.
5. **AI Engine Settings (Top-Right Button):** Configure your Central AI reasoning API key and select your active reasoning model (`Gemini 2.5 Flash`, `Claude 3.7 Sonnet`, `Claude Sonnet 4`, `GPT-4o`, `DeepSeek V3`, or `Llama 3.3 70B`).
6. **Export ERP Execution Sheet (CSV):** Exports all reviewed and approved buy adjustments, DC transfers, and markdown triggers into a production CSV file ready for ERP upload.

---

## 2. Using the Exception Command Center

### 2.1 Executive P&L & Inventory Health Ribbon
At the top of the workspace, four real-time KPI cards summarize portfolio health across your 168-SKU category:
* **Excess Weeks of Supply (WOS):** Shows the reduction from baseline (`4.8 wks → 2.3 wks`) and total working capital freed (`$1.12M`).
* **Promo & Peak Service Level (In-Stock %):** Tracks projected availability improvement (`91.6% → 96.8%`) and protected high-margin sales.
* **Management-by-Exception Coverage:** Shows how many SKUs require human attention today (`7 active exceptions`) while `161 stable SKUs` (95.8%) remain on automated autopilot.
* **12-Week Out-of-Sample WAPE:** Compares Legacy ERP error (`29.8%`) against ADDL routed accuracy (`16.4%`) and tracks the cumulative dollar value of actions approved during your session.

### 2.2 Prioritized Inventory Exceptions Inbox (Left Panel)
* **Filtering by Archetype:** Use the filter pills (`All`, `Promotional`, `Seasonal`, `Cold-Start`, `Established Core`, `Long-Tail`) to focus on specific merchandising segments.
* **Reading an Exception Card:** Each card displays:
  * **SKU ID, Archetype & Net Financial Impact (`+$68.4K`):** Ranked highest-to-lowest by P&L impact.
  * **Action Type Badge:** Indicates the specific operational lever (`DC TRANSFER`, `MARKDOWN`, `COLD START ALLOCATION`, `BUY REDUCTION`, or `BUY ADJUSTMENT`).
  * **AI Context Guardrail Badge:** Shows either the approved context lift (`AI Context +14.5%`) or confirms that noisy signals were blocked (`Guardrail: 0% Adjust`).
  * **Before vs. After Metrics:** Compares Legacy ERP vs. ADDL WAPE, In-Stock Availability %, and Excess Weeks of Supply.

### 2.3 Reviewing, Approving, or Overriding a Recommendation (Right Panel)
Clicking any SKU card in the inbox loads its deep-dive decision packet:
1. **Approve Recommendation (Green Button):** Accepts the AI-drafted order/transfer/markdown action and logs it to the **Governance Ledger**. If you adjusted any What-If sliders first, the button updates to **Approve Modified Action**.
2. **Override with Reason (Gray/Red Button):** Human-in-the-loop control is mandatory. Clicking **Override with Reason** opens a governance drawer where you select a structured reason code:
   * *Vendor Minimum Order Quantity (MOQ) Constraint*
   * *Brand Equity Protection — Hold Full MSRP (No Markdown)*
   * *Store Visual Merchandising Floor-Set Requirement*
   * *Warehouse Labor / Transfer Capacity Cap This Week*
   Confirming the override logs your rationale so the closed-loop feedback engine learns from planner domain knowledge.

---

## 3. Interpreting the Probabilistic Forecast & Inventory Canvas

### 3.1 Top Chart: Demand & Probabilistic Forecast Horizon (`W-14` to `W+12`)
* **Stockout-Censored Demand Recovery (Amber Bars & Dashed Line):** Highlights historical weeks where store inventory hit zero (`+OOS` markers) and displays the reconstructed unconstrained demand curve above raw observed POS sales.
* **Shaded Prediction Fan ($P_{10}$–$P_{90}$):** Visualizes forecast uncertainty over the next 12 weeks.
* **Interactive Model Layer Toggles:** Click the toggle pills in the chart header to compare:
  * **De-Censored Demand** (Amber)
  * **Legacy ERP Forecast** (Rose dashed line)
  * **StatsForecast Classical Baseline** (Sky blue dotted line)
  * **Pure Chronos-2 Unadjusted** (Violet line)
  * **ADDL Routed Final Forecast** (Emerald solid line)
* **Hover Scrubbing:** Move your cursor across any historical or future week to inspect exact unit values across all models and quantiles in the live telemetry banner below the chart.

### 3.2 Bottom Chart: 12-Week Inventory Projection Sawtooth
* **Status Quo ERP Plan (Rose Dashed Line):** Shows what happens to inventory if no action is taken—highlighting exact **OOS (Out-of-Stock)** weeks on promotional winners or massive end-of-season excess overhang on slowing styles.
* **After Approved ADDL Action (Emerald Solid Line):** Shows how the recommended DC transfer, PO expansion, or early shallow markdown keeps inventory safely above the **Safety Stock Floor** without creating end-of-season excess.

---

## 4. Running Live Scenarios in the Central AI What-If Engine

Located in the bottom-left panel of the Exception Command Center, the **Central LLM Scenario & What-If Engine** allows you to test both structured parameter changes and unstructured real-world disruptions:

1. **Evaluate Market / Supply Chain Event via Central AI:**
   * Click any quick signal in the **Live Market & Supply Chain Signals** bar at the top of the screen (e.g., *Social PDP Velocity Spike +22%*, *ASN Transit Delay +1 Wk*, *NOAA Warm Anomaly*, *Competitor Stockout*), **or** type any custom scenario into the text box (e.g., *"TikTok Coachella styling reel spiked coastal demand by 35% while factory shipment is delayed 1 week"*).
   * Click **Run AI Context & Quantile Synthesis**.
   * The Central AI Engine evaluates the SKU's unit economics, de-censored history, and Chronos-2 quantiles, updating the **Context Signal Rationale**, **Newsvendor Asymmetric Risk Trade-Off**, and **ERP Write-Back Execution Steps** in real time.
2. **Interactive What-If Sliders:**
   * **Target Service Quantile ($P_{30}$–$P_{90}$):** Drag toward $P_{85}$ for high-margin promo protection or toward $P_{35}$–$P_{45}$ for lean end-of-season management.
   * **Promotional / Traffic Lift Delta (`-20%` to `+35%`):** Stress-test higher or softer marketing campaign response.
   * **Price Markdown Depth (`0%` to `40% Off`):** Simulate price elasticity lift to see how a shallow 15% markdown accelerates sell-through and reduces ending excess weeks.

---

## 5. Using the Multimodal Cold-Start Launch Studio

Switch to the **Cold-Start Launch Studio** tab when planning a new seasonal style with zero historical POS data:
1. **Select a Launch Concept:** Switch between new product drops (*Playa Raffia Woven Slide*, *Sierra Shearling Buckle Clog*, *Baja Washed Hemp Alpargata*).
2. **Inspect Multimodal Conditioning Tokens:** View the extracted visual silhouette, material texture, and merchandising attribute vectors in Column 1.
3. **Review Top-3 Historical Look-Alike Priors:** Column 2 displays the 3 closest historical launches from the 3-year catalog, ranked by Cosine Similarity (`94% Match`, `89% Match`, `84% Match`), along with their actual historical sell-through % and stockout week.
4. **Compare Zero-Shot Trajectory vs. Flat Planner Guess:** Column 3 overlays the synthesized **Chronos-2 Zero-Shot Launch Curve** against the Merch Planner's flat weekly estimate and provides a 1-click **Approve Allocation** button.
5. **Footwear Size-Curve Allocation Optimizer:** The bottom card compares Legacy ERP flat size curves against **ADDL AI-Optimized Size Curves** across US sizes `5.5` to `10.0`, preventing early stockouts in core sizes (`7.0`, `7.5`, `8.0`).

---

## 6. Validating Your Own Data (BYOD CSV & Enterprise Connectors)

Switch to the **Data Ingestion & ERP Connectors** tab to test the platform on custom historical data:

### 6.1 Running a Live CSV Holdout Backtest
1. Click **Download TOMS CSV Template** in the top-right corner to inspect the 14-column CSV format, or use the pre-loaded editable CSV in the left panel.
2. Upload your own `.csv` file via **Choose CSV File...** or edit/add rows directly in the interactive CSV editor.
3. Click **Ingest & Run 12-Week Validation Backtest**.
4. The engine automatically:
   * Reconstructs stockout-censored historical weeks,
   * Classifies each SKU's archetype,
   * Computes 12-week holdout WAPE (`Legacy ERP` vs. `ADDL Routed`) and financial ROI, and
   * Adds your custom SKUs directly to the **Exception Command Center**.
5. Click **Inspect in Forecast Canvas** next to any ingested SKU to jump straight to its interactive forecast fan chart and inventory sawtooth projection.

### 6.2 Testing Enterprise Read-Only Connectors
In the right panel (**Enterprise ERP, Warehouse & POS Connectors**):
1. Select any pre-built adapter (**Snowflake Data Cloud**, **SAP S/4HANA Fashion & Retail**, **Blue Yonder / o9**, **Shopify Plus POS**, or **Google Cloud BigQuery**).
2. Inspect the exact read-only SQL query, OData endpoint, or GraphQL extraction payload and synced table list.
3. Click **Test Read-Only Handshake** to verify connectivity and schema mapping.
