import * as fs from "fs"
import * as path from "path"

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")

function translatePhrases(text: string): string {
  if (!text) return ""
  return text
    .replace(/Inclusion:/g, "Inclusion :")
    .replace(/Exclusion:/g, "Exclusion :")
    .replace(/Low-income/g, "À faible revenu")
    .replace(/Youth/g, "Jeunes")
    .replace(/Adults/g, "Adultes")
    .replace(/Seniors/g, "Aînés")
    .replace(/None/g, "Aucun")
    .replace(/Free/g, "Gratuit")
    .replace(/Yes/g, "Oui")
    .replace(/No/g, "Non")
}

function fixServices() {
  const services = JSON.parse(fs.readFileSync(SERVICES_PATH, "utf8"))
  let fixedCount = 0

  for (const service of services) {
    let changed = false

    if (!service.name_fr || !service.name_fr.trim()) {
      // For names, we usually keep the English name if it's a brand,
      // but we can at least ensure it's not empty.
      service.name_fr = service.name
      changed = true
    }

    if (!service.description_fr || !service.description_fr.trim()) {
      // Placeholder description that is at least in French
      service.description_fr = `[Traduction en cours] ${service.description}`
      changed = true
    }

    if (!service.eligibility_notes_fr || !service.eligibility_notes_fr.trim()) {
      if (service.eligibility_notes) {
        service.eligibility_notes_fr = translatePhrases(service.eligibility_notes)
        changed = true
      }
    } else {
      // Even if it exists, fix common mixed-language prefixes
      const original = service.eligibility_notes_fr
      service.eligibility_notes_fr = translatePhrases(service.eligibility_notes_fr)
      if (service.eligibility_notes_fr !== original) changed = true
    }

    if (changed) fixedCount++
  }

  fs.writeFileSync(SERVICES_PATH, JSON.stringify(services, null, 2))
  console.log(`✅ Fixed ${fixedCount} services in services.json`)
}

fixServices()
