# TxDOT Form Filler

Auto-fills Texas Department of Transportation compliance forms from structured CSV data.

## Usage

```bash
pip install -r requirements.txt
python form_filler.py --input your_data.csv --form dbe_commitment
```

## Supported Forms

- `dbe_commitment` - DBE Commitment Agreement
- `monthly_employment` - Monthly Employment Utilization Report
- `material_certification` - Material/Supplier Certification
- `subcontractor_payment` - Subcontractor Payment Verification

## Input Format

CSV files with columns matching the required fields for each form type. See the tool instructions for details.
