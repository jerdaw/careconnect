import fs from "fs"
import path from "path"

const DOCS_DIR = "docs"
const OUTPUT_FILE = path.join(DOCS_DIR, "llms.txt")

const CORE_FILES = [
  "architecture.md",
  "development/components.md",
  "governance/documentation-guidelines.md",
  "development/testing-guidelines.md",
  "development/bilingual-guide.md",
  "governance/standards.md",
  "development/hooks.md",
  "roadmaps/roadmap.md",
]

function generateLLMsTxt() {
  console.log("Generating llms.txt...")

  let content = "# Kingston Care Connect - AI Context\n\n"
  content += "This file contains the core architecture and development guidelines for Kingston Care Connect.\n\n"

  for (const fileName of CORE_FILES) {
    const filePath = path.join(DOCS_DIR, fileName)
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      content += `\n\n--- FILE: ${fileName} ---\n\n`
      content += fileContent
    } else {
      console.warn(`Warning: ${fileName} not found at ${filePath}`)
    }
  }

  fs.writeFileSync(OUTPUT_FILE, content)
  console.log(`Successfully generated ${OUTPUT_FILE}`)
}

generateLLMsTxt()
