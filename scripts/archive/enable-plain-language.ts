import * as fs from "fs"
import * as path from "path"

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const PRIORITY_IDS = [
  "kids-help-phone",
  "trans-lifeline-canada",
  "hope-for-wellness-helpline",
  "assaulted-womens-helpline",
  "victim-services-kingston",
]

function enablePlainLanguage() {
  const services = JSON.parse(fs.readFileSync(SERVICES_PATH, "utf8"))
  let count = 0

  for (const service of services) {
    if (PRIORITY_IDS.includes(service.id)) {
      service.plain_language_available = true
      count++
    }
  }

  fs.writeFileSync(SERVICES_PATH, JSON.stringify(services, null, 2))
  console.log(`✅ Enabled plain language for ${count} services in services.json`)
}

enablePlainLanguage()
