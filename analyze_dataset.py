import pandas as pd
import numpy as np

csv_file = r"c:\Users\Hp\OneDrive\Desktop\Hacathons\Projects\flipkart\jan to may police violation_anonymized791b166.csv"

# Read first few rows to understand structure
print("=" * 80)
print("PHASE 1: DATASET ANALYSIS")
print("=" * 80)

# Try reading with different encodings
try:
    df = pd.read_csv(csv_file, encoding='utf-8', low_memory=False)
except:
    try:
        df = pd.read_csv(csv_file, encoding='latin1', low_memory=False)
    except:
        df = pd.read_csv(csv_file, encoding='cp1252', low_memory=False)

print(f"\n1. Dataset Shape: {df.shape}")
print(f"2. Total Records: {df.shape[0]}")

print(f"\n3. Column Names ({len(df.columns)}):")
for i, col in enumerate(df.columns):
    print(f"   {i+1}. '{col}'")

print(f"\n4. Data Types:")
for col in df.columns:
    print(f"   {col}: {df[col].dtype}")

print(f"\n5. Missing Values Per Column:")
for col in df.columns:
    missing = df[col].isnull().sum()
    pct = (missing / len(df)) * 100
    print(f"   {col}: {missing} ({pct:.2f}%)")

print(f"\n6. First 5 rows (transposed):")
print(df.head(5).T.to_string())

print(f"\n7. Sample values per column:")
for col in df.columns:
    unique_count = df[col].nunique()
    sample = df[col].dropna().unique()[:8]
    print(f"\n   {col} (unique={unique_count}):")
    for v in sample:
        print(f"      - {v}")

# Date range analysis
print(f"\n8. Date-like columns analysis:")
for col in df.columns:
    if df[col].dtype == 'object':
        sample_vals = df[col].dropna().head(5).tolist()
        # Check if it looks like a date
        for val in sample_vals:
            if any(c in str(val) for c in ['/', '-', ':']) and len(str(val)) > 5:
                print(f"   Potential date column: {col}")
                print(f"   Samples: {sample_vals[:3]}")
                try:
                    dates = pd.to_datetime(df[col], errors='coerce')
                    valid = dates.dropna()
                    if len(valid) > 0:
                        print(f"   Range: {valid.min()} to {valid.max()}")
                except:
                    pass
                break

print(f"\n9. Duplicate Records: {df.duplicated().sum()}")

# Lat/Lon analysis
print(f"\n10. Latitude/Longitude Availability:")
for col in df.columns:
    col_lower = col.lower()
    if any(kw in col_lower for kw in ['lat', 'lon', 'lng', 'coord', 'geo']):
        non_null = df[col].notna().sum()
        print(f"   {col}: {non_null} values ({(non_null/len(df))*100:.2f}%)")

# Check numeric columns for potential lat/lon
print(f"\n11. Numeric columns stats:")
for col in df.select_dtypes(include=[np.number]).columns:
    print(f"   {col}: min={df[col].min()}, max={df[col].max()}, mean={df[col].mean():.2f}")

print(f"\n12. Memory Usage: {df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")

print("\n\nDONE")
