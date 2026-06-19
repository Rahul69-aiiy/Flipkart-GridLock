import pandas as pd
import numpy as np
import json

csv_file = r"c:\Users\Hp\OneDrive\Desktop\Hacathons\Projects\flipkart\jan to may police violation_anonymized791b166.csv"
df = pd.read_csv(csv_file, encoding='utf-8', low_memory=False)

# Parse violation_type as JSON lists
def parse_json_list(x):
    if pd.isna(x):
        return []
    try:
        return json.loads(x.replace("'", '"'))
    except:
        return [x]

# Unique violation categories (flattened)
all_violations = df['violation_type'].apply(parse_json_list)
flat_violations = [v for sublist in all_violations for v in sublist]
unique_violations = set(flat_violations)
print("UNIQUE VIOLATION TYPES:")
for v in sorted(unique_violations):
    print(f"  - {v}")
print(f"\nTotal unique violation categories: {len(unique_violations)}")

# Violation type frequency
from collections import Counter
viol_counts = Counter(flat_violations)
print("\nVIOLATION TYPE FREQUENCY:")
for v, c in viol_counts.most_common():
    print(f"  {v}: {c}")

# Unique vehicle types
print(f"\nUNIQUE VEHICLE TYPES ({df['vehicle_type'].nunique()}):")
for v in sorted(df['vehicle_type'].unique()):
    count = (df['vehicle_type'] == v).sum()
    print(f"  {v}: {count}")

# Unique police stations
print(f"\nUNIQUE POLICE STATIONS ({df['police_station'].nunique()}):")
for v in sorted(df['police_station'].dropna().unique()):
    count = (df['police_station'] == v).sum()
    print(f"  {v}: {count}")

# Junction analysis
print(f"\nUNIQUE JUNCTIONS ({df['junction_name'].nunique()}):")
junction_counts = df['junction_name'].value_counts()
print(f"  'No Junction' count: {junction_counts.get('No Junction', 0)}")
print(f"  Named junctions: {df['junction_name'].nunique() - (1 if 'No Junction' in df['junction_name'].values else 0)}")
print("\nTop 20 junctions:")
for v, c in junction_counts.head(20).items():
    print(f"  {v}: {c}")

# Validation status distribution
print(f"\nVALIDATION STATUS:")
print(df['validation_status'].value_counts(dropna=False).to_string())

# Date range
df['created_datetime'] = pd.to_datetime(df['created_datetime'], errors='coerce')
print(f"\nDATE RANGE: {df['created_datetime'].min()} to {df['created_datetime'].max()}")

# Monthly distribution
df['month'] = df['created_datetime'].dt.to_period('M')
print(f"\nMONTHLY DISTRIBUTION:")
print(df['month'].value_counts().sort_index().to_string())

# Hourly distribution
df['hour'] = df['created_datetime'].dt.hour
print(f"\nHOURLY DISTRIBUTION:")
print(df['hour'].value_counts().sort_index().to_string())

# Day of week distribution
df['dow'] = df['created_datetime'].dt.day_name()
print(f"\nDAY OF WEEK DISTRIBUTION:")
print(df['dow'].value_counts().to_string())

# Multi-violation analysis
df['violation_count'] = all_violations.apply(len)
print(f"\nMULTI-VIOLATION ANALYSIS:")
print(f"  Mean violations per record: {df['violation_count'].mean():.2f}")
print(f"  Max violations per record: {df['violation_count'].max()}")
print(df['violation_count'].value_counts().sort_index().to_string())

# Repeat offenders
vehicle_violations = df['vehicle_number'].value_counts()
print(f"\nREPEAT OFFENDER ANALYSIS:")
print(f"  Total unique vehicles: {vehicle_violations.shape[0]}")
print(f"  Vehicles with >1 violation: {(vehicle_violations > 1).sum()}")
print(f"  Vehicles with >5 violations: {(vehicle_violations > 5).sum()}")
print(f"  Max violations per vehicle: {vehicle_violations.max()}")

print("\nDONE")
