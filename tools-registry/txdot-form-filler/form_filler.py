"""
TxDOT Form Filler
Auto-fills TxDOT compliance forms from structured CSV data.
Generates completed forms ready for submission.
"""

import argparse
import csv
import os
from datetime import datetime
from pathlib import Path


SUPPORTED_FORMS = [
    "dbe_commitment",
    "monthly_employment",
    "material_certification",
    "subcontractor_payment",
]

REQUIRED_FIELDS = {
    "dbe_commitment": [
        "project_number", "contractor_name", "contract_amount",
        "dbe_firm_name", "dbe_work_description", "dbe_amount",
    ],
    "monthly_employment": [
        "project_number", "contractor_name", "report_month",
        "total_employees", "minority_employees", "female_employees",
    ],
    "material_certification": [
        "project_number", "supplier_name", "material_description",
        "quantity", "unit_price", "certification_type",
    ],
    "subcontractor_payment": [
        "project_number", "prime_contractor", "subcontractor_name",
        "payment_amount", "payment_date", "period_start", "period_end",
    ],
}


def validate_data(data: list[dict], form_type: str) -> list[str]:
    errors = []
    required = REQUIRED_FIELDS.get(form_type, [])

    for i, row in enumerate(data):
        for field in required:
            if field not in row or not row[field].strip():
                errors.append(f"Row {i + 1}: Missing required field '{field}'")

    return errors


def read_input(input_file: str) -> list[dict]:
    with open(input_file, "r") as f:
        return list(csv.DictReader(f))


def generate_form(data: list[dict], form_type: str, output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"{form_type}_{timestamp}.txt")

    with open(output_file, "w") as f:
        f.write("=" * 60 + "\n")
        f.write(f"TxDOT FORM: {form_type.upper().replace('_', ' ')}\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write("=" * 60 + "\n\n")

        for i, row in enumerate(data):
            f.write(f"--- Entry {i + 1} ---\n")
            for key, value in row.items():
                label = key.replace("_", " ").title()
                f.write(f"  {label}: {value}\n")
            f.write("\n")

    return output_file


def main():
    parser = argparse.ArgumentParser(description="TxDOT Form Filler")
    parser.add_argument("--input", required=True, help="Path to CSV data file")
    parser.add_argument("--form", required=True, choices=SUPPORTED_FORMS,
                        help="Form type to generate")
    parser.add_argument("--output", default="output", help="Output directory")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        return

    data = read_input(args.input)
    errors = validate_data(data, args.form)

    if errors:
        print("Validation errors found:")
        for error in errors:
            print(f"  - {error}")
        return

    output_file = generate_form(data, args.form, args.output)
    print(f"Form generated successfully: {output_file}")
    print(f"Entries processed: {len(data)}")


if __name__ == "__main__":
    main()
