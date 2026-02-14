"""
401k Remittance Checker
Flags late 401(k) remittances by comparing payroll dates against deposit dates.
Generates a summary report with DOL safe harbor analysis.
"""

import argparse
import csv
import os
from datetime import datetime, timedelta
from pathlib import Path


SAFE_HARBOR_BUSINESS_DAYS = 7


def parse_date(date_str: str) -> datetime:
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: {date_str}")


def business_days_between(start: datetime, end: datetime) -> int:
    days = 0
    current = start
    while current < end:
        current += timedelta(days=1)
        if current.weekday() < 5:
            days += 1
    return days


def analyze_remittances(input_file: str) -> list[dict]:
    results = []

    with open(input_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            plan_name = row["plan_name"].strip()
            pay_date = parse_date(row["pay_date"])
            deposit_date = parse_date(row["deposit_date"])
            amount = float(row["amount"].replace(",", "").replace("$", ""))

            biz_days = business_days_between(pay_date, deposit_date)
            is_late = biz_days > SAFE_HARBOR_BUSINESS_DAYS

            results.append({
                "plan_name": plan_name,
                "pay_date": pay_date.strftime("%Y-%m-%d"),
                "deposit_date": deposit_date.strftime("%Y-%m-%d"),
                "amount": amount,
                "business_days": biz_days,
                "is_late": is_late,
            })

    return results


def generate_report(results: list[dict], output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    report_path = os.path.join(output_dir, "remittance_report.txt")

    late_count = sum(1 for r in results if r["is_late"])
    total_count = len(results)

    with open(report_path, "w") as f:
        f.write("=" * 70 + "\n")
        f.write("401(k) REMITTANCE ANALYSIS REPORT\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write("=" * 70 + "\n\n")

        f.write(f"Total Remittances Analyzed: {total_count}\n")
        f.write(f"Late Remittances Found: {late_count}\n")
        f.write(f"Safe Harbor Threshold: {SAFE_HARBOR_BUSINESS_DAYS} business days\n\n")

        if late_count > 0:
            f.write("-" * 70 + "\n")
            f.write("LATE REMITTANCES\n")
            f.write("-" * 70 + "\n\n")

            for r in results:
                if r["is_late"]:
                    f.write(f"  Plan: {r['plan_name']}\n")
                    f.write(f"  Pay Date: {r['pay_date']}\n")
                    f.write(f"  Deposit Date: {r['deposit_date']}\n")
                    f.write(f"  Amount: ${r['amount']:,.2f}\n")
                    f.write(f"  Business Days: {r['business_days']} (LATE)\n\n")

        f.write("-" * 70 + "\n")
        f.write("ALL REMITTANCES\n")
        f.write("-" * 70 + "\n\n")

        for r in results:
            status = "LATE" if r["is_late"] else "OK"
            f.write(
                f"  {r['plan_name']} | {r['pay_date']} -> {r['deposit_date']} | "
                f"{r['business_days']} days | ${r['amount']:,.2f} | {status}\n"
            )

    return report_path


def main():
    parser = argparse.ArgumentParser(description="401k Remittance Checker")
    parser.add_argument("--input", required=True, help="Path to CSV file")
    parser.add_argument("--output", default="output", help="Output directory")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        return

    results = analyze_remittances(args.input)
    report_path = generate_report(results, args.output)

    late = sum(1 for r in results if r["is_late"])
    print(f"Analysis complete. {len(results)} remittances checked, {late} late.")
    print(f"Report saved to: {report_path}")


if __name__ == "__main__":
    main()
