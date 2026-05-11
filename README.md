# Illustrator Export Artboards (AI & PDF)

A powerful Adobe Illustrator ExtendScript (`.jsx`) designed to export individual artboards as perfectly clean, editable `.ai` or `.pdf` files.

## Features

- **Selective Export**: Choose exactly which artboards you want to export via a user-friendly checkbox interface.
- **Format Options**: Export as native Illustrator (`.ai`) or PDF (`.pdf`) files.
- **Editable PDFs**: PDF exports are configured to preserve Illustrator editing capabilities, allowing you to re-open them in Illustrator with full editability.
- **Clean Results**:
    - **Pasteboard Cleanup**: Automatically deletes all artwork sitting outside the exported artboard boundaries in the final file.
    - **Hidden Layer Removal**: Strips out hidden layers to ensure only visible content is exported.
- **Safe Workflow**: The script performs all destructive cleaning operations on a temporary duplicate file, keeping your original master file 100% safe and untouched.
- **Smart Naming**: Automatically names files based on the document name and artboard name (`DocName_ArtboardName.pdf`).

## How to Install

1. Download the `ExportArtboards.jsx` file.
2. Place it in your Illustrator Scripts folder:
    - **macOS**: `/Applications/Adobe Illustrator [Version]/Presets.localized/[Language]/Scripts`
    - **Windows**: `C:\Program Files\Adobe\Adobe Illustrator [Version]\Presets\[Language]\Scripts`
3. Restart Adobe Illustrator.

## How to Use

1. Open your Illustrator document.
2. **Important**: Save your document at least once before running the script (needed for the background duplication process).
3. Go to **File > Scripts > ExportArtboards**.
4. Select the artboards you wish to export.
5. Choose the format (AI or PDF) and the destination folder.
6. Click **Export**.

## License

This project is open-source. Feel free to use and modify it as needed.
