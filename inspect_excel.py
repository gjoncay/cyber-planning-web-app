import pandas as pd
import sys

file_path = "enterprise-attack-v19.1.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print("Sheets:", xl.sheet_names)
    
    if 'relationships' in xl.sheet_names:
        df_rel = xl.parse('relationships')
        print("\nRelationships columns:", df_rel.columns.tolist())
        print("Sample relationships:")
        print(df_rel.head(3).to_dict('records'))

    if 'software' in xl.sheet_names:
        df_soft = xl.parse('software')
        print("\nSoftware columns:", df_soft.columns.tolist())
        print("Sample software:")
        print(df_soft.head(3).to_dict('records'))
        
except Exception as e:
    print("Error:", e)
