import * as fs from "fs"
import * as path from "path"

const files = [
  {
    path: "messages/en.json",
    impact: {
      title: "Community Impact",
      subtitle: "See how HelpBridge is helping our community—without tracking anyone.",
      metricsTitle: "Last 90 Days",
      satisfactionTitle: "User Satisfaction",
      satisfactionDesc: "Based on {count} responses",
      issuesResolvedTitle: "Issues Resolved",
      issuesResolvedDesc: "Out of {total} reported",
      servicesVerifiedTitle: "Services Verified",
      servicesVerifiedDesc: "Out of {total} total",
      feedbackTitle: "Feedback Received",
      feedbackDesc: "This quarter",
      privacyTitle: "How We Measure Without Tracking",
      privacyText:
        "All metrics come from voluntary, anonymous feedback. We never use cookies, tracking pixels, or session identifiers.",
      noTracking: "No IP logging",
      noCookies: "No analytics cookies",
      voluntaryFeedback: "All feedback is optional",
      commitmentTitle: "Our Commitment",
      commitmentText:
        "We publish these reports quarterly to stay accountable to the community we serve. Your privacy is not negotiable.",
    },
  },
  {
    path: "messages/fr.json",
    impact: {
      title: "Impact communautaire",
      subtitle: "Découvrez comment HelpBridge aide notre communauté — sans suivre personne.",
      metricsTitle: "Les 90 derniers jours",
      satisfactionTitle: "Satisfaction des utilisateurs",
      satisfactionDesc: "Basé sur {count} réponses",
      issuesResolvedTitle: "Problèmes résolus",
      issuesResolvedDesc: "Sur {total} signalés",
      servicesVerifiedTitle: "Services vérifiés",
      servicesVerifiedDesc: "Sur {total} au total",
      feedbackTitle: "Commentaires reçus",
      feedbackDesc: "Ce trimestre",
      privacyTitle: "Comment nous mesurons sans suivi",
      privacyText:
        "Toutes les métriques proviennent de commentaires anonymes et volontaires. Nous n'utilisons jamais de cookies, de pixels de suivi ou d'identifiants de session.",
      noTracking: "Pas de journalisation IP",
      noCookies: "Pas de cookies analytiques",
      voluntaryFeedback: "Tous les commentaires sont facultatifs",
      commitmentTitle: "Notre engagement",
      commitmentText:
        "Nous publions ces rapports chaque trimestre pour rester responsables envers la communauté que nous servons. Votre vie privée n'est pas négociable.",
    },
  },
]

for (const file of files) {
  const fullPath = path.join(process.cwd(), file.path)
  const content = JSON.parse(fs.readFileSync(fullPath, "utf8"))
  content.Impact = file.impact
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2))
  console.log(`✅ Updated ${file.path}`)
}
