# Excel Batch Formatter

Batch format Excel workbooks to firm standards: Calibri 10pt, consistent headers, print-ready layouts.

## Usage

1. Open Excel
2. Press Alt+F11 to open the VBA Editor
3. Import `BatchFormatter.bas` (File > Import)
4. Press Alt+F8, select `BatchFormatWorkbooks`, and Run
5. Select your folder of workbooks
6. Formatted copies appear in a `Formatted` subfolder

## What It Does

- Sets all fonts to Calibri 10pt
- Bolds header rows with bottom borders
- Freezes the header row
- Auto-fits columns (8-40 character width)
- Configures landscape, fit-to-page print layout
- Preserves original files (saves copies)
