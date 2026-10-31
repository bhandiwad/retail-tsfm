#!/usr/bin/env python3
"""
Adaptive Demand Decision Layer (ADDL) — Quantitative Retail Simulation & Backtest Engine.
Generates realistic Footwear & Lifestyle Apparel (TOMS-inspired) POS histories, stockout de-censoring,
multi-model probabilistic forecasts (Legacy ERP, StatsForecast AutoETS, Chronos-2 Quantiles,
and Chronos-2 + Selective LLM Context Agent), inventory sawtooth projections, and closed-loop routing telemetry.
"""

import json
import math
import os
import random
from pathlib import Path

random.seed(42)


def generate_sku_series(
    sku_id: str,
    name: str,
    category: str,
    subcategory: str,
    archetype: str,
    routed_model: str,
    retail_price: float,
    unit_cost: float,
    current_inventory: int,
    on_order_units: int,
    lead_time_weeks: int,
    remaining_selling_weeks: int,
    target_quantile: int,
    base_weekly_demand: float,
    seasonality_amp: float,
    phase_shift: float,
    promo_weeks_hist: list[int],
    promo_weeks_future: list[int],
    censored_weeks_hist: list[int],
    trend_slope: float,
    llm_adjustment_pct: float,
    llm_guardrail_status: str,
    llm_confidence: float,
    llm_trigger_Event: str,
    llm_rationale: str,
    action_type: str,
    action_title: str,
    action_summary: str,
    recommended_units_delta: int,
    recommended_markdown_pct: int,
    transfer_route: str,
    legacy_wape: float,
    statsforecast_wape: float,
    chronos2_wape: float,
    addl_wape: float,
    excess_weeks_before: float,
    excess_weeks_after: float,
    availability_before: float,
    availability_after: float,
    financial_impact_usd: int,
    working_capital_delta_usd: int,
    markdown_saved_usd: int,
    lost_sales_prevented_usd: int,
    priority_score: int,
    color_hex: str,
    swatch_name: str,
    silhouette_type: str,
    store_cluster: str,
):
    history = []
    # 24 weeks of history: W-24 to W-1
    for w in range(1, 25):
        t = w - 25  # -24 to -1
        seasonal = 1.0 + seasonality_amp * math.sin(2 * math.pi * (w + phase_shift) / 26.0)
        trend = 1.0 + trend_slope * (w / 24.0)
        is_promo = w in promo_weeks_hist
        promo_mult = 1.65 if is_promo else 1.0
        noise = random.uniform(0.91, 1.09)

        true_demand = max(12, round(base_weekly_demand * seasonal * trend * promo_mult * noise))
        is_censored = w in censored_weeks_hist
        if is_censored:
            # Stockout occurred mid-week; POS only recorded ~55-65% of true unconstrained demand
            observed_sales = round(true_demand * random.uniform(0.54, 0.64))
            ending_inventory = 0
        else:
            observed_sales = true_demand
            ending_inventory = max(45, round(current_inventory * random.uniform(0.75, 1.35)))

        # Legacy ERP historical one-step forecast (dragged down by censored weeks or lagging trend)
        erp_hist_forecast = round(observed_sales * random.uniform(0.82, 1.16))

        history.append({
            "weekIndex": t,
            "weekLabel": f"W{t}",
            "dateLabel": f"Wk {w}",
            "observedSales": observed_sales,
            "trueLatentDemand": true_demand,
            "censoredUnits": max(0, true_demand - observed_sales),
            "isStockoutCensored": is_censored,
            "isPromo": is_promo,
            "endingInventory": ending_inventory,
            "erpHistoricalForecast": erp_hist_forecast,
        })

    # 12 weeks forward horizon: W+1 to W+12
    forecast = []
    inv_status_quo = current_inventory
    inv_approved = current_inventory

    for fw in range(1, 13):
        w_abs = 24 + fw
        seasonal = 1.0 + seasonality_amp * math.sin(2 * math.pi * (w_abs + phase_shift) / 26.0)
        trend = 1.0 + trend_slope * (w_abs / 24.0)
        is_promo = fw in promo_weeks_future
        promo_mult = 1.75 if is_promo else 1.0

        # Base Chronos-2 P50 forecast (trained on de-censored demand + cross-series seasonal patterns)
        chronos_p50 = max(15, round(base_weekly_demand * seasonal * trend * promo_mult))
        # Uncertainty widens slightly with horizon and during promo weeks
        spread_factor = 0.14 + 0.012 * fw + (0.08 if is_promo else 0.0)
        chronos_p10 = max(5, round(chronos_p50 * (1.0 - spread_factor)))
        chronos_p90 = round(chronos_p50 * (1.0 + spread_factor * 1.15))

        # Classical StatsForecast (AutoETS) - misses sharp nonlinear promo interactions or cold-start ramps
        if archetype == "Promotional":
            classical_p50 = round(chronos_p50 * (0.76 if is_promo else 0.94))
            legacy_erp = round(chronos_p50 * (0.64 if is_promo else 0.88))
        elif archetype == "Seasonal" and action_type == "MARKDOWN":
            # Classical & ERP over-forecast late-season tail
            classical_p50 = round(chronos_p50 * (1.28 + 0.02 * fw))
            legacy_erp = round(chronos_p50 * (1.42 + 0.03 * fw))
        elif archetype == "Cold-Start":
            classical_p50 = round(chronos_p50 * 0.68)
            legacy_erp = round(chronos_p50 * 0.58)
        else:
            classical_p50 = round(chronos_p50 * 0.96)
            legacy_erp = round(chronos_p50 * 0.91)

        # Selective LLM Context Agent adjustment on top of Chronos-2
        # Focused on weeks 1-6 where context signal (e.g., promo lift, viral traffic, warm weather front) applies
        context_weight = 1.0 if fw <= 6 else 0.55
        adj_mult = 1.0 + (llm_adjustment_pct / 100.0) * context_weight
        addl_p50 = max(10, round(chronos_p50 * adj_mult))
        addl_p10 = max(5, round(chronos_p10 * adj_mult))
        addl_p90 = round(chronos_p90 * adj_mult)

        # If markdown action is approved, demand lifts by price elasticity while clearing excess inventory
        markdown_elasticity_lift = 1.38 if (action_type == "MARKDOWN" and fw >= 2) else 1.0
        effective_demand_approved = round(addl_p50 * markdown_elasticity_lift)

        # Scheduled incoming receipts in status quo vs approved action
        status_quo_receipt = on_order_units if fw == lead_time_weeks else 0
        approved_receipt = status_quo_receipt
        if action_type in ("BUY_ADJUSTMENT", "COLD_START_ALLOCATION") and fw == lead_time_weeks:
            approved_receipt += max(0, recommended_units_delta)
        elif action_type == "DC_TRANSFER" and fw == 1:
            # Fast DC transfer arrives in Week +1
            approved_receipt += max(0, recommended_units_delta)
        elif action_type == "BUY_REDUCTION" and fw == lead_time_weeks:
            approved_receipt = max(0, status_quo_receipt + recommended_units_delta)

        inv_status_quo = max(0, inv_status_quo + status_quo_receipt - addl_p50)
        inv_approved = max(0, inv_approved + approved_receipt - effective_demand_approved)

        forecast.append({
            "weekIndex": fw,
            "weekLabel": f"W+{fw}",
            "isPromo": is_promo,
            "legacyErpForecast": legacy_erp,
            "classicalForecast": classical_p50,
            "chronosP10": chronos_p10,
            "chronosP50": chronos_p50,
            "chronosP90": chronos_p90,
            "addlP10": addl_p10,
            "addlP50": addl_p50,
            "addlP90": addl_p90,
            "projectedInventoryStatusQuo": inv_status_quo,
            "projectedInventoryApproved": inv_approved,
            "safetyStockFloor": round(addl_p50 * 0.85),
        })

    return {
        "skuId": sku_id,
        "name": name,
        "category": category,
        "subcategory": subcategory,
        "archetype": archetype,
        "routedModel": routed_model,
        "retailPrice": retail_price,
        "unitCost": unit_cost,
        "grossMarginPct": round((retail_price - unit_cost) / retail_price * 100, 1),
        "currentInventory": current_inventory,
        "onOrderUnits": on_order_units,
        "leadTimeWeeks": lead_time_weeks,
        "remainingSellingWeeks": remaining_selling_weeks,
        "targetQuantile": target_quantile,
        "llmAdjustmentPct": llm_adjustment_pct,
        "llmGuardrailStatus": llm_guardrail_status,
        "llmConfidence": llm_confidence,
        "llmTriggerEvent": llm_trigger_Event,
        "llmRationale": llm_rationale,
        "actionType": action_type,
        "actionTitle": action_title,
        "actionSummary": action_summary,
        "recommendedUnitsDelta": recommended_units_delta,
        "recommendedMarkdownPct": recommended_markdown_pct,
        "transferRoute": transfer_route,
        "metrics": {
            "legacyWape": legacy_wape,
            "statsForecastWape": statsforecast_wape,
            "chronos2Wape": chronos2_wape,
            "addlWape": addl_wape,
            "excessWeeksBefore": excess_weeks_before,
            "excessWeeksAfter": excess_weeks_after,
            "availabilityBefore": availability_before,
            "availabilityAfter": availability_after,
            "financialImpactUsd": financial_impact_usd,
            "workingCapitalDeltaUsd": working_capital_delta_usd,
            "markdownSavedUsd": markdown_saved_usd,
            "lostSalesPreventedUsd": lost_sales_prevented_usd,
        },
        "priorityScore": priority_score,
        "colorHex": color_hex,
        "swatchName": swatch_name,
        "silhouetteType": silhouette_type,
        "storeCluster": store_cluster,
        "history": history,
        "forecast": forecast,
    }


def build_dataset():
    skus = [
        generate_sku_series(
            sku_id="TOMS-1001-SGE",
            name="Women's Alpargata Rope Espadrille — Sage Canvas",
            category="Women's Footwear",
            subcategory="Espadrilles & Slip-Ons",
            archetype="Promotional",
            routed_model="Chronos-2 (Large) + Selective Context Agent",
            retail_price=59.95,
            unit_cost=19.50,
            current_inventory=1420,
            on_order_units=800,
            lead_time_weeks=2,
            remaining_selling_weeks=9,
            target_quantile=85,
            base_weekly_demand=490,
            seasonality_amp=0.22,
            phase_shift=4,
            promo_weeks_hist=[8, 16, 21],
            promo_weeks_future=[3, 4],
            censored_weeks_hist=[16, 21],
            trend_slope=0.18,
            llm_adjustment_pct=14.5,
            llm_guardrail_status="APPROVED_BY_GUARDRAIL",
            llm_confidence=0.91,
            llm_trigger_Event="Spring/Summer Friends & Family 20% Promo + TikTok Styling Reel (+38% PDP saves)",
            llm_rationale=(
                "Historical Weeks -9 and -4 suffered 39% stockout censoring in Coastal Tier-1 stores, causing Legacy ERP "
                "to under-predict the upcoming W+3 promo peak by 41%. De-censored Chronos-2 baseline lifted P50 to 840 u/wk; "
                "Selective Context Agent applied an additional +14.5% lift (confidence 0.91 > 0.80 threshold) due to confirmed "
                "homepage hero slot and viral social velocity. Targeting P85 quantile to protect 67.5% gross margin."
            ),
            action_type="DC_TRANSFER",
            action_title="Expedite 640 Units DC-West → Coastal Flagship Cluster + Raise PO #8841 by +920 Units",
            action_summary="Reallocate 640 units from Inland DC excess to 18 Coastal stores before W+3 Promo window; expand vendor replenishment to P85 quantile.",
            recommended_units_delta=1560,
            recommended_markdown_pct=0,
            transfer_route="Rialto DC-West → SoCal & Sunbelt Tier-1 Stores (18 locs)",
            legacy_wape=34.8,
            statsforecast_wape=26.4,
            chronos2_wape=16.9,
            addl_wape=12.4,
            excess_weeks_before=0.4,
            excess_weeks_after=1.2,
            availability_before=78.5,
            availability_after=97.8,
            financial_impact_usd=68400,
            working_capital_delta_usd=-12400,
            markdown_saved_usd=0,
            lost_sales_prevented_usd=68400,
            priority_score=98,
            color_hex="#84a98c",
            swatch_name="Sage Heritage Canvas",
            silhouette_type="espadrille",
            store_cluster="Coastal & Sunbelt Flagships (42 Stores + DTC)",
        ),
        generate_sku_series(
            sku_id="TOMS-2044-TER",
            name="Valencia Lug-Sole Platform Mule — Terracotta Suede",
            category="Women's Footwear",
            subcategory="Seasonal Fashion Mules",
            archetype="Seasonal",
            routed_model="Chronos-2 (Zero-Shot Regime Decay) + Context Agent",
            retail_price=89.95,
            unit_cost=31.00,
            current_inventory=3850,
            on_order_units=1200,
            lead_time_weeks=3,
            remaining_selling_weeks=6,
            target_quantile=40,
            base_weekly_demand=340,
            seasonality_amp=0.35,
            phase_shift=14,
            promo_weeks_hist=[6],
            promo_weeks_future=[],
            censored_weeks_hist=[],
            trend_slope=-0.38,
            llm_adjustment_pct=-11.0,
            llm_guardrail_status="APPROVED_BY_GUARDRAIL",
            llm_confidence=0.88,
            llm_trigger_Event="End-of-Season Selling Window Compression (6 Wks Left) + Early Warm Weather Shift",
            llm_rationale=(
                "Legacy ERP moving average projects 460 u/wk based on early-season velocity, leaving 7.4 weeks of excess supply "
                "at end-of-season. Chronos-2 detects steep post-peak decay across suede transition footwear. Context Agent incorporates "
                "NOAA 14-day warm anomaly (-11% suede conversion) and triggers an immediate shallow 15% markdown in W+2 plus cancellation "
                "of 800 unshipped PO units to avoid a 55% end-of-season clearance bath."
            ),
            action_type="MARKDOWN",
            action_title="Trigger Early 15% Shallow Markdown in W+2 & Cancel 800 Uncommitted Units on PO #9012",
            action_summary="Accelerate sell-through by +38% via shallow 15% promo now rather than 55% liquidation at Week +7; de-commit open vendor capacity.",
            recommended_units_delta=-800,
            recommended_markdown_pct=15,
            transfer_route="Omnichannel Price Trigger + Vendor Open-to-Buy Trim",
            legacy_wape=38.2,
            statsforecast_wape=28.9,
            chronos2_wape=18.1,
            addl_wape=14.6,
            excess_weeks_before=7.4,
            excess_weeks_after=1.8,
            availability_before=99.2,
            availability_after=96.5,
            financial_impact_usd=84200,
            working_capital_delta_usd=56800,
            markdown_saved_usd=59400,
            lost_sales_prevented_usd=0,
            priority_score=95,
            color_hex="#c86d51",
            swatch_name="Terracotta Luxe Suede",
            silhouette_type="platform_mule",
            store_cluster="All North America Retail + E-Commerce",
        ),
        generate_sku_series(
            sku_id="TOMS-3109-OAT",
            name="Playa Raffia Woven Slide — Coastal Oat (New Seasonal Drop)",
            category="Women's Footwear",
            subcategory="Resort & Sandals",
            archetype="Cold-Start",
            routed_model="Multimodal Attribute Matcher → Chronos-2 Zero-Shot Prior",
            retail_price=69.95,
            unit_cost=22.40,
            current_inventory=950,
            on_order_units=600,
            lead_time_weeks=2,
            remaining_selling_weeks=12,
            target_quantile=80,
            base_weekly_demand=380,
            seasonality_amp=0.28,
            phase_shift=2,
            promo_weeks_hist=[],
            promo_weeks_future=[5],
            censored_weeks_hist=[23, 24],
            trend_slope=0.32,
            llm_adjustment_pct=18.0,
            llm_guardrail_status="APPROVED_BY_GUARDRAIL",
            llm_confidence=0.89,
            llm_trigger_Event="Zero-History Launch: Visual + Attribute Match (0.94 Cosine Sim to 2025 Catalina Raffia Sellout)",
            llm_rationale=(
                "New SKU with only 2 weeks of initial soft-launch POS (both censored in sizes 7, 7.5, and 8). Multimodal embedding "
                "matched 'Playa Raffia Slide' to 3 prior resort winners (top match: 'Catalina Raffia Espadrille', 94% similarity). "
                "Week 1-2 size-curve depletion is tracking 22% above initial merch plan. Recommending immediate +1,150 unit size-curve "
                "re-buy skewed toward core sizes 7–8.5 before peak resort travel window."
            ),
            action_type="COLD_START_ALLOCATION",
            action_title="Execute +1,150 Unit Size-Curve Replenishment (Skewed to US 7.0–8.5) via Fast-Track Air/Sea Split",
            action_summary="Override flat planner baseline using Multimodal Look-Alike prior + early size-depletion signal to prevent mid-season stockout.",
            recommended_units_delta=1150,
            recommended_markdown_pct=0,
            transfer_route="Supplier Fast-Track → East & West Coast Resort Doors",
            legacy_wape=46.5,
            statsforecast_wape=39.0,
            chronos2_wape=19.8,
            addl_wape=15.1,
            excess_weeks_before=0.2,
            excess_weeks_after=1.4,
            availability_before=68.0,
            availability_after=95.4,
            financial_impact_usd=54700,
            working_capital_delta_usd=-18200,
            markdown_saved_usd=0,
            lost_sales_prevented_usd=54700,
            priority_score=92,
            color_hex="#e2cfb4",
            swatch_name="Coastal Oat Raffia",
            silhouette_type="slide_sandal",
            store_cluster="Resort, Sunbelt & DTC Launch Tier (34 Doors)",
        ),
        generate_sku_series(
            sku_id="TOMS-4012-NVY",
            name="Men's TRVL Lite Heritage Slip-On — Classic Navy",
            category="Men's Footwear",
            subcategory="Core Everyday Slip-Ons",
            archetype="Established Core",
            routed_model="StatsForecast (AutoETS) + Chronos-2 Ensemble [LLM Guardrail: Held]",
            retail_price=64.95,
            unit_cost=20.10,
            current_inventory=4200,
            on_order_units=1500,
            lead_time_weeks=3,
            remaining_selling_weeks=26,
            target_quantile=75,
            base_weekly_demand=610,
            seasonality_amp=0.10,
            phase_shift=0,
            promo_weeks_hist=[12],
            promo_weeks_future=[8],
            censored_weeks_hist=[],
            trend_slope=0.04,
            llm_adjustment_pct=0.0,
            llm_guardrail_status="GUARDRAIL_REJECTED_NOISE",
            llm_confidence=0.41,
            llm_trigger_Event="Minor Regional Blog Mention Detected — Confidence 0.41 < 0.80 Threshold (Zero Adjustment Applied)",
            llm_rationale=(
                "Series exhibits high stability (CV = 0.11). Unstructured social signal showed a localized blog mention, "
                "but backtested validation proved adjusting core replenishment on low-confidence media signals increases WAPE by +2.3 pts. "
                "Selective LLM Guardrail blocked adjustment. However, Legacy ERP safety-stock buffer is bloated by +28%; "
                "trimming W+3 replenishment PO by -650 units frees $13,065 in working capital while maintaining 98.6% service level."
            ),
            action_type="BUY_REDUCTION",
            action_title="Trim Bloated Safety-Stock Replenishment by -650 Units (LLM Adjustment Blocked by Guardrail)",
            action_summary="Maintain pure statistical + Chronos-2 ensemble forecast; release 2.1 weeks of redundant buffer stock without risking availability.",
            recommended_units_delta=-650,
            recommended_markdown_pct=0,
            transfer_route="DC Replenishment Schedule Optimization (PO #8904)",
            legacy_wape=14.8,
            statsforecast_wape=9.4,
            chronos2_wape=9.1,
            addl_wape=8.9,
            excess_weeks_before=4.3,
            excess_weeks_after=2.2,
            availability_before=98.9,
            availability_after=98.6,
            financial_impact_usd=29800,
            working_capital_delta_usd=29800,
            markdown_saved_usd=6400,
            lost_sales_prevented_usd=0,
            priority_score=84,
            color_hex="#2b3d54",
            swatch_name="Classic Navy Heritage",
            silhouette_type="slip_on",
            store_cluster="All Omnichannel Network (120 Doors + Wholesale)",
        ),
        generate_sku_series(
            sku_id="TOMS-5088-OLV",
            name="Harbor Waterproof Chelsea Boot — Olive Waxed Suede",
            category="Men's & Unisex Footwear",
            subcategory="Weather & Outerwear Boots",
            archetype="Seasonal",
            routed_model="Chronos-2 Covariate Router + Regional Weather Agent",
            retail_price=119.95,
            unit_cost=41.50,
            current_inventory=1180,
            on_order_units=400,
            lead_time_weeks=3,
            remaining_selling_weeks=10,
            target_quantile=85,
            base_weekly_demand=265,
            seasonality_amp=0.31,
            phase_shift=8,
            promo_weeks_hist=[19],
            promo_weeks_future=[2],
            censored_weeks_hist=[19, 20],
            trend_slope=0.24,
            llm_adjustment_pct=16.0,
            llm_guardrail_status="APPROVED_BY_GUARDRAIL",
            llm_confidence=0.93,
            llm_trigger_Event="Pacific Northwest & Northeast Atmospheric River Rain Forecast (Weeks +1 to +4)",
            llm_rationale=(
                "Waterproof boot demand displays a 2.4x elasticity spike when 10-day precipitation exceeds seasonal norms by >35%. "
                "Currently 48% of chain inventory is sitting in Sunbelt stores (0.3 wks sell-through) while Seattle, Portland, and Boston "
                "clusters face stockout in 9 days. Recommending lateral inter-store/DC transfer of 480 pairs to wet-weather markets."
            ),
            action_type="DC_TRANSFER",
            action_title="Rebalance 480 Pairs from Sunbelt Doors → PNW & Northeast Wet-Weather Cluster",
            action_summary="Capture regional rain-driven demand surge via lateral inventory rebalance instead of cutting new factory orders.",
            recommended_units_delta=480,
            recommended_markdown_pct=0,
            transfer_route="Sunbelt Slow-Movers → PNW & Northeast Cluster (22 Stores)",
            legacy_wape=31.5,
            statsforecast_wape=24.2,
            chronos2_wape=15.4,
            addl_wape=11.2,
            excess_weeks_before=3.8,
            excess_weeks_after=1.5,
            availability_before=81.0,
            availability_after=97.2,
            financial_impact_usd=49600,
            working_capital_delta_usd=19920,
            markdown_saved_usd=14200,
            lost_sales_prevented_usd=35400,
            priority_score=90,
            color_hex="#556b2f",
            swatch_name="Olive Waxed Suede",
            silhouette_type="chelsea_boot",
            store_cluster="PNW & Northeast Metro Cluster (22 Doors)",
        ),
        generate_sku_series(
            sku_id="TOMS-6021-BLSH",
            name="Ezra Retro Court Canvas Sneaker — Soft Blush / Gum",
            category="Women's Footwear",
            subcategory="Court & Lifestyle Sneakers",
            archetype="Promotional",
            routed_model="Chronos-2 (Probabilistic) + Cross-SKU Halo Agent",
            retail_price=74.95,
            unit_cost=24.80,
            current_inventory=1690,
            on_order_units=500,
            lead_time_weeks=2,
            remaining_selling_weeks=11,
            target_quantile=85,
            base_weekly_demand=390,
            seasonality_amp=0.18,
            phase_shift=6,
            promo_weeks_hist=[10, 18],
            promo_weeks_future=[3, 7],
            censored_weeks_hist=[18],
            trend_slope=0.15,
            llm_adjustment_pct=11.5,
            llm_guardrail_status="APPROVED_BY_GUARDRAIL",
            llm_confidence=0.86,
            llm_trigger_Event="Back-to-Campus Bundle Campaign + Rival Brand Out-of-Stock on Gum-Sole Court Styles",
            llm_rationale=(
                "Competitor stockout monitor flagged 62% OOS on comparable gum-sole canvas court sneakers across major department stores. "
                "Paid search click-share rose +29% over the last 72 hours. Recommending a +740 unit buy expansion on PO #8890 "
                "targeted at the P85 forecast band ahead of the W+3 bundle event."
            ),
            action_type="BUY_ADJUSTMENT",
            action_title="Increase PO #8890 by +740 Units to Capture Competitor Stockout Spillover & W+3 Promo",
            action_summary="Target P85 service level during high-margin bundle event while competitor gum-sole court styles are out of stock.",
            recommended_units_delta=740,
            recommended_markdown_pct=0,
            transfer_route="Direct Factory Allocation → DTC & Top 30 Mall Doors",
            legacy_wape=29.4,
            statsforecast_wape=22.1,
            chronos2_wape=14.8,
            addl_wape=11.7,
            excess_weeks_before=0.9,
            excess_weeks_after=1.4,
            availability_before=84.2,
            availability_after=97.5,
            financial_impact_usd=41200,
            working_capital_delta_usd=-9800,
            markdown_saved_usd=0,
            lost_sales_prevented_usd=41200,
            priority_score=87,
            color_hex="#d8a7b1",
            swatch_name="Soft Blush / Honey Gum",
            silhouette_type="court_sneaker",
            store_cluster="DTC E-Commerce + College Metro Stores",
        ),
        generate_sku_series(
            sku_id="TOMS-7099-SUN",
            name="Tiny TOMS Youth Alpargata — Heritage Sunburst Print",
            category="Kids' Footwear",
            subcategory="Youth Slip-Ons",
            archetype="Long-Tail",
            routed_model="Chronos-2 Intermittent/Cross-Learning [LLM Guardrail: Held]",
            retail_price=39.95,
            unit_cost=12.20,
            current_inventory=1840,
            on_order_units=600,
            lead_time_weeks=4,
            remaining_selling_weeks=8,
            target_quantile=45,
            base_weekly_demand=135,
            seasonality_amp=0.25,
            phase_shift=11,
            promo_weeks_hist=[14],
            promo_weeks_future=[4],
            censored_weeks_hist=[],
            trend_slope=-0.22,
            llm_adjustment_pct=0.0,
            llm_guardrail_status="GUARDRAIL_REJECTED_NOISE",
            llm_confidence=0.34,
            llm_trigger_Event="No Qualified External Context Signal — Pure Chronos-2 Intermittent Distribution Used",
            llm_rationale=(
                "Long-tail youth print exhibits intermittent store-level demand. Classical Croston/ETS methods drifted +31% high, "
                "accumulating 6.2 excess weeks of inventory in store backrooms. Chronos-2 zero-shot quantile distribution accurately "
                "captures the tail decay without needing LLM adjustment. Recommending consolidating store tail stock to DTC fulfillment "
                "and pausing W+4 replenishment (-500 units)."
            ),
            action_type="BUY_REDUCTION",
            action_title="Pause W+4 Replenishment (-500 Units) & Consolidate Store Tail Inventory to DTC Pool",
            action_summary="Eliminate 4.1 excess weeks of fragmented store stock by pooling long-tail sizes into centralized E-Commerce fulfillment.",
            recommended_units_delta=-500,
            recommended_markdown_pct=10,
            transfer_route="Store Tail Sweep → Columbus DTC Fulfillment Center",
            legacy_wape=41.2,
            statsforecast_wape=33.5,
            chronos2_wape=17.6,
            addl_wape=17.4,
            excess_weeks_before=6.2,
            excess_weeks_after=2.1,
            availability_before=99.0,
            availability_after=97.0,
            financial_impact_usd=24500,
            working_capital_delta_usd=24500,
            markdown_saved_usd=18400,
            lost_sales_prevented_usd=0,
            priority_score=79,
            color_hex="#eab308",
            swatch_name="Heritage Sunburst Canvas",
            silhouette_type="kids_slip_on",
            store_cluster="Centralized DTC + Family Outlet Tier",
        ),
    ]

    # Cold-Start Multimodal Studio Data
    cold_start_studio = {
        "targetSkuId": "TOMS-3109-OAT",
        "newProduct": {
            "skuId": "TOMS-3109-OAT",
            "name": "Playa Raffia Woven Slide — Coastal Oat",
            "launchSeason": "Spring / Resort",
            "retailPrice": 69.95,
            "unitCost": 22.40,
            "material": "Braided Natural Raffia Upper / OrthoLite Eco LT Footbed",
            "silhouette": "Open-Toe Resort Slide",
            "colorFamily": "Neutral Warm Oat / Raffia",
            "initialPlannerGuessWeekly": 240,
            "aiZeroShotWeeklyPeak": 485,
            "embeddingVectorPreview": [0.84, -0.19, 0.92, 0.67, -0.41, 0.88, 0.73, 0.95],
            "extractedVisionTags": [
                "Natural Woven Raffia Texture",
                "Wide Single-Band Vamp",
                "Resort / Warm-Weather Silhouette",
                "Neutral Earth-Tone Palette",
                "Flat Espadrille-Inspired Midsole",
            ],
        },
        "analogMatches": [
            {
                "skuId": "TOMS-2025-CAT",
                "name": "Catalina Woven Raffia Espadrille — Natural",
                "season": "Spring 2025",
                "retailPrice": 64.95,
                "cosineSimilarity": 0.94,
                "visionMatchScore": 96,
                "attributeMatchScore": 93,
                "priceTierMatchScore": 94,
                "actualSellThroughPct": 94.8,
                "stockedOutWeek": "Week 6 (Lost ~$42K Sales)",
                "weeklyLaunchCurve": [290, 355, 420, 465, 510, 495, 460, 430, 390, 350, 310, 275],
                "colorHex": "#d6be9b",
            },
            {
                "skuId": "TOMS-2025-SOL",
                "name": "Solana Braided Strap Sandal — Dune Linen",
                "season": "Summer 2025",
                "retailPrice": 69.95,
                "cosineSimilarity": 0.89,
                "visionMatchScore": 90,
                "attributeMatchScore": 88,
                "priceTierMatchScore": 98,
                "actualSellThroughPct": 89.2,
                "stockedOutWeek": "In-Stock (96% Service Level)",
                "weeklyLaunchCurve": [240, 310, 365, 415, 440, 455, 430, 395, 360, 320, 280, 240],
                "colorHex": "#cbb597",
            },
            {
                "skuId": "TOMS-2024-PAL",
                "name": "Paloma Cross-Band Slide — Warm Sand",
                "season": "Resort 2024",
                "retailPrice": 59.95,
                "cosineSimilarity": 0.84,
                "visionMatchScore": 85,
                "attributeMatchScore": 82,
                "priceTierMatchScore": 86,
                "actualSellThroughPct": 86.5,
                "stockedOutWeek": "Week 8 (Sizes 7-8 OOS)",
                "weeklyLaunchCurve": [210, 265, 320, 370, 395, 385, 360, 330, 295, 260, 230, 195],
                "colorHex": "#bfa588",
            },
        ],
        "sizeCurveAllocation": [
            {"size": "US 5.5", "legacyFlatPct": 8.0, "aiOptimizedPct": 4.2, "recommendedUnits": 90},
            {"size": "US 6.0", "legacyFlatPct": 11.0, "aiOptimizedPct": 8.8, "recommendedUnits": 189},
            {"size": "US 6.5", "legacyFlatPct": 13.0, "aiOptimizedPct": 13.5, "recommendedUnits": 290},
            {"size": "US 7.0", "legacyFlatPct": 14.0, "aiOptimizedPct": 18.4, "recommendedUnits": 396},
            {"size": "US 7.5", "legacyFlatPct": 14.0, "aiOptimizedPct": 19.6, "recommendedUnits": 421},
            {"size": "US 8.0", "legacyFlatPct": 13.0, "aiOptimizedPct": 16.8, "recommendedUnits": 361},
            {"size": "US 8.5", "legacyFlatPct": 11.0, "aiOptimizedPct": 10.2, "recommendedUnits": 219},
            {"size": "US 9.0", "legacyFlatPct": 9.0, "aiOptimizedPct": 5.5, "recommendedUnits": 118},
            {"size": "US 10.0", "legacyFlatPct": 7.0, "aiOptimizedPct": 3.0, "recommendedUnits": 66},
        ],
    }

    # Closed-Loop Model Routing & Portfolio Benchmark (168 SKUs in Pilot Category)
    routing_benchmarks = {
        "pilotScope": {
            "totalSkus": 168,
            "activeStores": 120,
            "annualInventoryPoolUsd": 10000000,
            "baselineExcessInventoryUsd": 2500000,
            "annualCarryingCostRatePct": 25.0,
            "backtestHorizonWeeks": 12,
        },
        "executiveKpis": {
            "wapeReductionPts": 13.4,
            "legacyPortfolioWape": 29.8,
            "addlPortfolioWape": 16.4,
            "excessWeeksBefore": 4.8,
            "excessWeeksAfter": 2.3,
            "availabilityBeforePct": 91.6,
            "availabilityAfterPct": 96.8,
            "workingCapitalFreedUsd": 1120000,
            "annualCarryingCostSavedUsd": 280000,
            "markdownMarginProtectedUsd": 385000,
            "lostSalesRecoveredUsd": 412000,
            "totalAnnualValueImpactUsd": 1077000,
            "plannerHoursSavedPerWeek": 18.5,
            "agentActionAcceptanceRatePct": 89.4,
        },
        "archetypeRoutingMatrix": [
            {
                "archetype": "Established Core Basics",
                "skuCount": 54,
                "shareOfCatalogPct": 32.1,
                "primaryRouterModel": "StatsForecast (AutoETS) + Chronos-2 Ensemble",
                "llmContextFrequencyPct": 8.0,
                "legacyWape": 16.2,
                "classicalWape": 11.1,
                "chronos2Wape": 10.6,
                "addlWape": 10.2,
                "primaryBusinessWin": "-2.1 Excess Weeks (Safety Stock Trim)",
                "routingRule": "Low CV (<0.18) & >52 wks history → Statistical + TSFM Ensemble; strict LLM guardrail (>0.85 conf).",
            },
            {
                "archetype": "Promotional & Event-Driven",
                "skuCount": 42,
                "shareOfCatalogPct": 25.0,
                "primaryRouterModel": "Chronos-2 (Probabilistic) + Selective Context Agent",
                "llmContextFrequencyPct": 74.0,
                "legacyWape": 36.4,
                "classicalWape": 27.8,
                "chronos2Wape": 17.5,
                "addlWape": 13.1,
                "primaryBusinessWin": "+8.4 pts In-Stock Availability during Promos",
                "routingRule": "De-censor historical stockouts first → Chronos-2 P85 target + LLM promo/social lift reasoning.",
            },
            {
                "archetype": "Seasonal & Weather-Sensitive",
                "skuCount": 36,
                "shareOfCatalogPct": 21.4,
                "primaryRouterModel": "Chronos-2 Regime Decay + Weather/Window Agent",
                "llmContextFrequencyPct": 61.0,
                "legacyWape": 34.9,
                "classicalWape": 26.5,
                "chronos2Wape": 16.8,
                "addlWape": 13.8,
                "primaryBusinessWin": "-42% End-of-Season Clearance Markdown Depth",
                "routingRule": "Remaining window <= 8 wks → Target P40 quantile + early shallow 15% markdown vs. late 55% slash.",
            },
            {
                "archetype": "Cold-Start New Launches",
                "skuCount": 19,
                "shareOfCatalogPct": 11.3,
                "primaryRouterModel": "Multimodal Look-Alike Prior → Chronos-2 Zero-Shot",
                "llmContextFrequencyPct": 84.0,
                "legacyWape": 48.2,
                "classicalWape": 41.6,
                "chronos2Wape": 21.4,
                "addlWape": 16.2,
                "primaryBusinessWin": "+14.2 pts Launch Availability & Size-Curve Fit",
                "routingRule": "<4 wks history → Vision + Attribute Cosine Top-3 priors fed into Chronos-2 + Week 1-2 size velocity.",
            },
            {
                "archetype": "Long-Tail & Intermittent",
                "skuCount": 17,
                "shareOfCatalogPct": 10.2,
                "primaryRouterModel": "Chronos-2 Cross-Learning Quantiles (No LLM Adjust)",
                "llmContextFrequencyPct": 4.0,
                "legacyWape": 42.0,
                "classicalWape": 34.1,
                "chronos2Wape": 18.9,
                "addlWape": 18.5,
                "primaryBusinessWin": "Store Backroom Tail Swept to Central DTC Pool",
                "routingRule": "High zero-demand weeks → Chronos-2 zero-shot quantiles; pool inventory at DC rather than store doors.",
            },
        ],
        "closedLoopFeedbackEvents": [
            {
                "cycle": "Cycle W-8 → W-4",
                "segment": "Women's Seasonal Suede Mules (14 SKUs)",
                "observation": "StatsForecast ETS over-predicted post-peak tail by +29%, building 3.4 excess weeks.",
                "routerAction": "Auto-promoted Chronos-2 Regime Decay weight from 0.40 → 0.85 for late-window suede styles.",
                "measuredGain": "-3.1 Excess Weeks / $94K Markdown Saved in W-3 to W-1",
            },
            {
                "cycle": "Cycle W-6 → W-2",
                "segment": "Core Canvas Slip-Ons (38 SKUs)",
                "observation": "Unconstrained LLM social-signal adjustments added +1.9 pts WAPE volatility on non-promo weeks.",
                "routerAction": "Raised Selective LLM Confidence Threshold from 0.65 → 0.80 for Established Core series.",
                "measuredGain": "Eliminated false-positive buy adjustments; improved WAPE stability by +2.1 pts.",
            },
            {
                "cycle": "Cycle W-4 → Current",
                "segment": "Coastal Promo Espadrilles (22 SKUs)",
                "observation": "Unadjusted POS series understated weekend peak demand by 36% due to Saturday afternoon stockouts.",
                "routerAction": "Enabled Automated Stockout De-Censoring pre-processor prior to Chronos-2 inference.",
                "measuredGain": "+9.2 pts Weekend In-Stock Rate & $118K Recovered Promo Revenue.",
            },
        ],
    }

    return {
        "generatedAt": "2026-10-30T19:48:00Z",
        "platformMeta": {
            "title": "Adaptive Demand Decision Layer (ADDL)",
            "subtitle": "Overlay Intelligence Workflow for Footwear & Lifestyle Apparel Retail",
            "retailerPersona": "TOMS / Contemporary Footwear & Lifestyle Brand (168-SKU Pilot)",
            "erpConnected": "SAP S/4HANA Retail + Blue Yonder Planning + Shopify Plus POS",
        },
        "skus": skus,
        "coldStartStudio": cold_start_studio,
        "routingBenchmarks": routing_benchmarks,
    }


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent.parent / "src" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "retailDemoData.json"
    dataset = build_dataset()
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"Generated retail dataset successfully at {out_file} ({len(dataset['skus'])} hero SKUs)")
