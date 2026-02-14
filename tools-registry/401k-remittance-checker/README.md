# 401k Remittance Checker

Flags late 401(k) remittances by comparing payroll dates against deposit dates.

## Usage

```bash
pip install -r requirements.txt
python checker.py --input your_data.csv
```

## Input Format

CSV with columns: `plan_name`, `pay_date`, `deposit_date`, `amount`

## Output

A text report in the `output/` directory showing all remittances and flagging any that exceed the DOL safe harbor threshold of 7 business days.
