"""
ParkSight AI - Weight Maps & Helper Functions
Centralised congestion weights for vehicles, violation severity scores,
temporal multipliers, and multi-violation scaling factors.
"""

# ---------------------------------------------------------------------------
# Vehicle congestion weights  (22 types)
# Higher weight = larger road-space footprint / greater congestion impact
# ---------------------------------------------------------------------------
VEHICLE_WEIGHTS: dict[str, float] = {
    "BUS (BMTC/KSRTC)": 5.0,
    "PRIVATE BUS": 4.5,
    "TOURIST BUS": 4.5,
    "FACTORY BUS": 4.0,
    "SCHOOL VEHICLE": 4.0,
    "LORRY/GOODS VEHICLE": 4.5,
    "TANKER": 4.5,
    "HGV": 5.0,
    "LGV": 3.0,
    "MINI LORRY": 3.0,
    "TEMPO": 3.0,
    "MAXI-CAB": 3.0,
    "CAR": 2.0,
    "JEEP": 2.0,
    "VAN": 2.5,
    "PASSENGER AUTO": 1.5,
    "GOODS AUTO": 2.0,
    "MOTOR CYCLE": 1.0,
    "SCOOTER": 1.0,
    "MOPED": 0.8,
    "TRACTOR": 3.5,
    "OTHERS": 2.0,
}

# ---------------------------------------------------------------------------
# Violation severity weights  (27 types)
# Higher weight = more severe parking / traffic obstruction impact
# ---------------------------------------------------------------------------
VIOLATION_WEIGHTS: dict[str, float] = {
    "DOUBLE PARKING": 3.0,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 2.8,
    "PARKING IN A MAIN ROAD": 2.5,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 2.5,
    "PARKING NEAR ROAD CROSSING": 2.5,
    "PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS": 2.5,
    "NO PARKING": 2.0,
    "WRONG PARKING": 1.5,
    "PARKING ON FOOTPATH": 1.8,
    "PARKING OTHER THAN BUS STOP": 1.5,
    "H T V PROHIBITED": 2.0,
    "AGAINST ONE WAY/NO ENTRY": 2.0,
    "STOPING ON WHITE/STOP LINE": 1.5,
    "VIOLATING LANE DISIPLINE": 1.5,
    "JUMPING TRAFFIC SIGNAL": 2.0,
    "DEFECTIVE NUMBER PLATE": 0.5,
    "USING BLACK FILM/OTHER MATERIALS": 0.5,
    "WITHOUT SIDE MIRROR": 0.3,
    "FAIL TO USE SAFETY BELTS": 0.3,
    "RIDER NOT WEARING HELMET": 0.3,
    "2W/3W - USING MOBILE PHONE": 0.5,
    "OTHER - USING MOBILE PHONE": 0.5,
    "CARRYING LENGHTY MATERIAL": 1.0,
    "REFUSE TO GO FOR HIRE": 0.5,
    "DEMANDING EXCESS FARE": 0.3,
    "OBSTRUCTING DRIVER": 1.0,
    "U TURN PROHIBITED": 1.5,
}

# ---------------------------------------------------------------------------
# Temporal weights  (IST hours)
# ---------------------------------------------------------------------------
PEAK_HOURS_IST: list[int] = list(range(8, 12)) + list(range(17, 21))  # 8-11 AM, 5-8 PM
SHOULDER_HOURS_IST: list[int] = [7, 12, 13, 14, 16, 21, 22]  # shoulder periods


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def get_vehicle_weight(vehicle_type: str) -> float:
    """Return the congestion weight for a given vehicle type."""
    return VEHICLE_WEIGHTS.get(vehicle_type, 1.5)


def get_violation_weight(violation_type: str) -> float:
    """Return the severity weight for a given violation type."""
    return VIOLATION_WEIGHTS.get(violation_type, 1.0)


def get_time_weight(hour_ist: int) -> float:
    """Return the temporal multiplier based on the hour of day (IST, 0-23)."""
    if hour_ist in PEAK_HOURS_IST:
        return 2.0
    elif hour_ist in SHOULDER_HOURS_IST:
        return 1.5
    else:
        return 1.0


def get_multi_violation_factor(count: int) -> float:
    """Return the scaling factor for locations with multiple concurrent violations."""
    return 1.0 + 0.2 * (count - 1)
