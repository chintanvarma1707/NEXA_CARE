"""
Nexa Care — AI Microservice (FastAPI)
AI-Driven Demand Forecasting & Smart Redistribution Engine
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import math

app = FastAPI(
    title="Nexa Care AI Service",
    description="AI-Driven Stock Forecasting & Smart Redistribution for PHCs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ──────────────────────────────────────────────────────────

class UsageEntry(BaseModel):
    date: str
    quantity_used: float

class InventoryItem(BaseModel):
    medicine_name: str
    current_stock: float
    minimum_threshold: float
    usage_log: List[UsageEntry] = []

class ForecastRequest(BaseModel):
    hospital_id: str
    inventory: List[InventoryItem]

class HospitalInfo(BaseModel):
    id: str
    name: str

class InventoryRecord(BaseModel):
    hospital_id: str
    hospital_name: str
    medicine_name: str
    current_stock: float
    minimum_threshold: float

class RedistributeRequest(BaseModel):
    hospitals: List[HospitalInfo]
    inventory: List[InventoryRecord]

class FlagRequest(BaseModel):
    hospitals: List[Dict[str, Any]]

# ── Helper: Linear Regression Forecasting ────────────────────────────────────

def predict_days_to_stockout(current_stock: float, usage_log: list) -> Optional[int]:
    """
    Uses linear regression on usage_log to estimate avg daily usage,
    then predicts how many days until stock hits minimum.
    """
    if not usage_log or len(usage_log) < 3:
        # Fallback: simple average if insufficient data
        if usage_log:
            avg = sum(e.get('quantity_used', 0) for e in usage_log) / len(usage_log)
        else:
            avg = 1.0
        if avg <= 0:
            return None
        return max(0, math.floor(current_stock / avg))

    # Build a time-series
    quantities = [e.get('quantity_used', 0) for e in usage_log[-14:]]  # last 14 days
    if not quantities:
        return None

    # Fit linear regression using numpy
    x = np.arange(len(quantities)).reshape(-1, 1)
    y = np.array(quantities)

    # Weighted average (recent days weighted more)
    weights = np.exp(np.linspace(0, 1, len(y)))
    weighted_avg = np.average(y, weights=weights)

    if weighted_avg <= 0:
        return None

    days_remaining = math.floor(current_stock / weighted_avg)
    return max(0, days_remaining)


def get_trend(usage_log: list) -> str:
    """Returns 'Increasing', 'Decreasing', or 'Stable' based on usage trend."""
    if len(usage_log) < 6:
        return "Stable"

    recent = [e.get('quantity_used', 0) for e in usage_log[-7:]]
    older = [e.get('quantity_used', 0) for e in usage_log[-14:-7]]

    if not older:
        return "Stable"

    recent_avg = np.mean(recent)
    older_avg = np.mean(older)

    if recent_avg > older_avg * 1.2:
        return "Increasing"
    elif recent_avg < older_avg * 0.8:
        return "Decreasing"
    return "Stable"


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Nexa Care AI Microservice",
        "status": "🟢 Operational",
        "endpoints": [
            "POST /api/ai/forecast — Stock-out predictions",
            "POST /api/ai/redistribute — Smart redistribution engine",
            "GET  /api/ai/health — Service health check"
        ]
    }


@app.get("/api/ai/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/ai/forecast")
def forecast_stockout(request: ForecastRequest):
    """
    Time-series demand forecasting for medicine stock-outs.
    
    For each medicine in the hospital:
    - Calculates weighted average daily usage from usage_log
    - Predicts days until stock hits 0 or minimum threshold
    - Generates alerts for items expected to run out within 7 days
    """
    predictions = []
    alerts = []

    for item in request.inventory:
        usage_log = [e.dict() for e in item.usage_log]
        days_to_stockout = predict_days_to_stockout(item.current_stock, usage_log)
        trend = get_trend(usage_log)

        # Calculate average daily usage
        if usage_log:
            quantities = [e.get('quantity_used', 0) for e in usage_log[-14:]]
            avg_daily = round(np.mean(quantities), 2) if quantities else 0
        else:
            avg_daily = 0

        stock_status = "Good"
        urgency = "None"
        message = None

        if item.current_stock == 0:
            stock_status = "Critical"
            urgency = "Critical"
            message = f"🔴 {item.medicine_name} is OUT OF STOCK immediately!"
        elif days_to_stockout is not None:
            if days_to_stockout == 0:
                stock_status = "Critical"
                urgency = "Critical"
                message = f"🔴 {item.medicine_name} will run out TODAY!"
            elif days_to_stockout <= 2:
                stock_status = "Danger"
                urgency = "High"
                message = f"🟠 {item.medicine_name} expected to run out in {days_to_stockout} day(s)."
            elif days_to_stockout <= 5:
                stock_status = "Warning"
                urgency = "Medium"
                message = f"🟡 {item.medicine_name} expected to run out in {days_to_stockout} days."
            elif days_to_stockout <= 7:
                stock_status = "Caution"
                urgency = "Low"
                message = f"⚪ {item.medicine_name} may run out in ~{days_to_stockout} days."
            elif item.current_stock <= item.minimum_threshold:
                stock_status = "Low"
                urgency = "Medium"
                message = f"🟡 {item.medicine_name} is below minimum threshold."
            else:
                stock_status = "Good"

        prediction = {
            "medicine_name": item.medicine_name,
            "current_stock": item.current_stock,
            "minimum_threshold": item.minimum_threshold,
            "avg_daily_usage": avg_daily,
            "days_to_stockout": days_to_stockout,
            "trend": trend,
            "stock_status": stock_status,
            "urgency": urgency,
            "message": message,
            "predicted_stockout_date": (
                (datetime.now() + timedelta(days=days_to_stockout)).strftime("%d %b %Y")
                if days_to_stockout is not None else None
            )
        }
        predictions.append(prediction)

        if message and urgency in ["Critical", "High", "Medium"]:
            alerts.append({
                "medicine_name": item.medicine_name,
                "urgency": urgency,
                "days_remaining": days_to_stockout,
                "message": message
            })

    # Sort by urgency
    urgency_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "None": 4}
    predictions.sort(key=lambda p: urgency_order.get(p["urgency"], 5))
    alerts.sort(key=lambda a: urgency_order.get(a["urgency"], 5))

    return {
        "hospital_id": request.hospital_id,
        "generated_at": datetime.now().isoformat(),
        "total_items": len(predictions),
        "critical_count": len([p for p in predictions if p["urgency"] == "Critical"]),
        "warning_count": len([p for p in predictions if p["urgency"] in ["High", "Medium"]]),
        "predictions": predictions,
        "alerts": alerts
    }


@app.post("/api/ai/redistribute")
def smart_redistribution(request: RedistributeRequest):
    """
    Smart Redistribution Engine.
    
    Groups medicines across all hospitals.
    If Hospital A has 0 stock and Hospital B has surplus (>2x threshold),
    generates a Transfer Recommendation Card.
    """
    recommendations = []
    seen = set()

    # Group by medicine name
    medicine_map: Dict[str, List[InventoryRecord]] = {}
    for item in request.inventory:
        if item.medicine_name not in medicine_map:
            medicine_map[item.medicine_name] = []
        medicine_map[item.medicine_name].append(item)

    hospital_name_map = {h.id: h.name for h in request.hospitals}

    for medicine, items in medicine_map.items():
        # Find hospitals with critical shortage (stock = 0 or below threshold)
        critical = [i for i in items if i.current_stock <= i.minimum_threshold]
        # Find hospitals with surplus (stock > 2x threshold)
        surplus = [i for i in items if i.current_stock >= i.minimum_threshold * 2.5]

        for needy in critical:
            for donor in surplus:
                if needy.hospital_id == donor.hospital_id:
                    continue

                pair_key = f"{medicine}_{donor.hospital_id}_{needy.hospital_id}"
                if pair_key in seen:
                    continue
                seen.add(pair_key)

                transfer_qty = math.floor(
                    (donor.current_stock - donor.minimum_threshold * 1.5) * 0.4
                )
                if transfer_qty <= 0:
                    continue

                urgency = "Critical" if needy.current_stock == 0 else "High"

                recommendations.append({
                    "medicine_name": medicine,
                    "from_hospital_id": donor.hospital_id,
                    "from_hospital_name": donor.hospital_name,
                    "from_hospital_stock": donor.current_stock,
                    "to_hospital_id": needy.hospital_id,
                    "to_hospital_name": needy.hospital_name,
                    "to_hospital_stock": needy.current_stock,
                    "recommended_transfer_qty": transfer_qty,
                    "urgency": urgency,
                    "message": (
                        f"Transfer {transfer_qty} units of {medicine} "
                        f"from {donor.hospital_name} (surplus: {donor.current_stock}) "
                        f"to {needy.hospital_name} (stock: {needy.current_stock})"
                    ),
                    "generated_at": datetime.now().isoformat()
                })

    # Sort by urgency
    urgency_order = {"Critical": 0, "High": 1, "Medium": 2}
    recommendations.sort(key=lambda r: urgency_order.get(r["urgency"], 3))

    return {
        "generated_at": datetime.now().isoformat(),
        "total_recommendations": len(recommendations),
        "recommendations": recommendations[:20]  # Cap at 20
    }
