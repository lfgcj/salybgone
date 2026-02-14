# How to Create a New Tool

1. Copy this `_TEMPLATE` folder and rename it to your tool's slug (e.g., `my-new-tool`)
2. Edit `tool.json` with your tool's metadata:
   - **name**: Display name shown in the UI
   - **description**: One-line summary for the catalog
   - **longDescription**: (Optional) Detailed description for the tool detail page
   - **category**: One of: "Audit Tools", "Tax & Compliance", "Excel & Spreadsheets", "Data Conversion", "Workflow Templates", "Document Automation"
   - **type**: Always "download" for now
   - **tags**: Array of searchable tags
   - **instructions**: Step-by-step usage instructions
   - **requirements**: Software/version requirements
   - **dateAdded**: Date in YYYY-MM-DD format
   - **version**: Semantic version string
   - **files**: Array of filenames included in the tool (must match actual files in the folder)
3. Drop your actual tool files into the folder (scripts, macros, templates, etc.)
4. Make sure every filename listed in `tool.json` `files` array exists in the folder
5. Run `npm run build-registry` locally to verify it builds correctly
6. Commit and push: `git add . && git commit -m "Add new tool: my-new-tool" && git push`
7. Vercel auto-rebuilds. Your tool appears on the site.

The slug (URL-friendly name) is automatically set from the folder name. No configuration needed.
