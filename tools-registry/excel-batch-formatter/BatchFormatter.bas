Attribute VB_Name = "BatchFormatter"
Option Explicit

' Excel Batch Formatter
' Formats all workbooks in a selected folder to firm standards.
' Calibri 10pt, consistent headers, print-ready layouts.

Sub BatchFormatWorkbooks()
    Dim folderPath As String
    Dim fileName As String
    Dim wb As Workbook
    Dim ws As Worksheet
    Dim outputFolder As String
    Dim fileCount As Long

    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "Select Folder Containing Workbooks"
        If .Show = -1 Then
            folderPath = .SelectedItems(1) & "\"
        Else
            Exit Sub
        End If
    End With

    outputFolder = folderPath & "Formatted\"
    If Dir(outputFolder, vbDirectory) = "" Then MkDir outputFolder

    Application.ScreenUpdating = False
    Application.DisplayAlerts = False

    fileName = Dir(folderPath & "*.xls*")
    Do While fileName <> ""
        If InStr(fileName, "~$") = 0 Then
            Set wb = Workbooks.Open(folderPath & fileName)

            For Each ws In wb.Worksheets
                FormatWorksheet ws
            Next ws

            wb.SaveAs outputFolder & fileName, wb.FileFormat
            wb.Close SaveChanges:=False
            fileCount = fileCount + 1
        End If
        fileName = Dir()
    Loop

    Application.ScreenUpdating = True
    Application.DisplayAlerts = True

    MsgBox fileCount & " workbook(s) formatted successfully." & vbCrLf & _
           "Output folder: " & outputFolder, vbInformation, "Batch Formatter"
End Sub

Private Sub FormatWorksheet(ws As Worksheet)
    Dim lastRow As Long, lastCol As Long
    Dim rng As Range
    Dim col As Long

    On Error Resume Next
    lastRow = ws.Cells.Find("*", SearchOrder:=xlByRows, SearchDirection:=xlPrevious).Row
    lastCol = ws.Cells.Find("*", SearchOrder:=xlByColumns, SearchDirection:=xlPrevious).Column
    On Error GoTo 0

    If lastRow = 0 Or lastCol = 0 Then Exit Sub

    Set rng = ws.Range(ws.Cells(1, 1), ws.Cells(lastRow, lastCol))

    ' Clear existing formatting
    With rng.Font
        .Name = "Calibri"
        .Size = 10
        .Bold = False
        .Color = RGB(0, 0, 0)
    End With
    rng.Interior.Pattern = xlNone

    ' Format header row
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, lastCol))
        .Font.Bold = True
        .Borders(xlEdgeBottom).LineStyle = xlContinuous
        .Borders(xlEdgeBottom).Weight = xlMedium
    End With

    ' Freeze header row
    ws.Activate
    ws.Range("A2").Select
    ActiveWindow.FreezePanes = True

    ' Auto-fit columns with constraints
    rng.Columns.AutoFit
    For col = 1 To lastCol
        If ws.Columns(col).ColumnWidth < 8 Then ws.Columns(col).ColumnWidth = 8
        If ws.Columns(col).ColumnWidth > 40 Then ws.Columns(col).ColumnWidth = 40
    Next col

    ' Print setup
    With ws.PageSetup
        .Orientation = xlLandscape
        .FitToPagesWide = 1
        .FitToPagesTall = False
        .PrintTitleRows = "$1:$1"
        .LeftMargin = Application.InchesToPoints(0.5)
        .RightMargin = Application.InchesToPoints(0.5)
        .TopMargin = Application.InchesToPoints(0.75)
        .BottomMargin = Application.InchesToPoints(0.75)
    End With
End Sub
