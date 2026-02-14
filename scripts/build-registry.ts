import fs from "fs";
import path from "path";
import archiver from "archiver";

interface ToolJson {
  name: string;
  slug?: string;
  description: string;
  longDescription?: string;
  category: string;
  type: string;
  tags: string[];
  instructions: string;
  requirements?: string;
  dateAdded: string;
  version: string;
  files: string[];
}

const VALID_CATEGORIES = [
  "Audit Tools",
  "Tax & Compliance",
  "Excel & Spreadsheets",
  "Data Conversion",
  "Workflow Templates",
  "Document Automation",
];

const REQUIRED_FIELDS: (keyof ToolJson)[] = [
  "name",
  "description",
  "category",
  "type",
  "tags",
  "instructions",
  "dateAdded",
  "version",
  "files",
];

const ROOT = process.cwd();
const REGISTRY_DIR = path.join(ROOT, "tools-registry");
const OUTPUT_JSON = path.join(ROOT, "app", "data", "tools-generated.json");
const DOWNLOADS_DIR = path.join(ROOT, "public", "downloads");

function validateToolJson(
  toolJson: ToolJson,
  folderName: string
): string[] {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (
      toolJson[field] === undefined ||
      toolJson[field] === null ||
      toolJson[field] === ""
    ) {
      errors.push(`[${folderName}] Missing required field: ${field}`);
    }
  }

  if (toolJson.category && !VALID_CATEGORIES.includes(toolJson.category)) {
    errors.push(
      `[${folderName}] Invalid category "${toolJson.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  if (toolJson.type && toolJson.type !== "download") {
    errors.push(`[${folderName}] Invalid type "${toolJson.type}". Must be "download".`);
  }

  if (toolJson.tags && !Array.isArray(toolJson.tags)) {
    errors.push(`[${folderName}] "tags" must be an array`);
  }

  if (toolJson.files && !Array.isArray(toolJson.files)) {
    errors.push(`[${folderName}] "files" must be an array`);
  }

  return errors;
}

function createZip(
  sourceDir: string,
  files: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);

    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    }

    archive.finalize();
  });
}

async function main() {
  console.log("Building tool registry...\n");

  if (!fs.existsSync(REGISTRY_DIR)) {
    console.error("Error: tools-registry/ directory not found");
    process.exit(1);
  }

  const folders = fs
    .readdirSync(REGISTRY_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);

  if (folders.length === 0) {
    console.log("No tools found in tools-registry/");
    const outputDir = path.dirname(OUTPUT_JSON);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify([], null, 2));
    return;
  }

  const allErrors: string[] = [];
  const tools: ToolJson[] = [];
  const categories = new Set<string>();

  for (const folder of folders) {
    const toolJsonPath = path.join(REGISTRY_DIR, folder, "tool.json");

    if (!fs.existsSync(toolJsonPath)) {
      allErrors.push(`[${folder}] Missing tool.json`);
      continue;
    }

    let toolJson: ToolJson;
    try {
      const content = fs.readFileSync(toolJsonPath, "utf-8");
      toolJson = JSON.parse(content);
    } catch (e) {
      allErrors.push(
        `[${folder}] Invalid JSON in tool.json: ${e instanceof Error ? e.message : "parse error"}`
      );
      continue;
    }

    const errors = validateToolJson(toolJson, folder);
    if (errors.length > 0) {
      allErrors.push(...errors);
      continue;
    }

    // Check that declared files exist
    const toolDir = path.join(REGISTRY_DIR, folder);
    for (const file of toolJson.files) {
      if (!fs.existsSync(path.join(toolDir, file))) {
        allErrors.push(`[${folder}] Declared file not found: ${file}`);
      }
    }

    // Auto-set slug from folder name
    toolJson.slug = folder;
    categories.add(toolJson.category);
    tools.push(toolJson);
  }

  if (allErrors.length > 0) {
    console.error("Validation errors found:\n");
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
    console.error("");
    process.exit(1);
  }

  // Ensure output directories exist
  const outputDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Copy files and create zips
  for (const tool of tools) {
    const toolDir = path.join(REGISTRY_DIR, tool.slug!);
    const downloadDir = path.join(DOWNLOADS_DIR, tool.slug!);

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Copy individual files
    for (const file of tool.files) {
      const src = path.join(toolDir, file);
      const dest = path.join(downloadDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }

    // Create zip
    const zipPath = path.join(downloadDir, `${tool.slug}.zip`);
    await createZip(toolDir, tool.files, zipPath);

    console.log(`  Built: ${tool.name} (${tool.slug})`);
  }

  // Write the registry JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(tools, null, 2));

  console.log(
    `\nBuilt registry: ${tools.length} tools across ${categories.size} categories`
  );
  console.log(`Output: ${OUTPUT_JSON}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
