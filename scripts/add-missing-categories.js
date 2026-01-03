const fs = require('fs');
const path = require('path');
const servicesPath = path.join(__dirname, '..', 'data', 'services.json');
const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));

const newServices = [
  // INDIGENOUS (3 services)
  {
    "id": "four-directions-indigenous-centre",
    "name": "Four Directions Indigenous Student Centre",
    "name_fr": "Centre étudiant autochtone Four Directions",
    "description": "Indigenous student support services at Queen's University. Cultural programming, Elder access, and academic support for Indigenous students.",
    "description_fr": "Services de soutien aux étudiants autochtones à l'Université Queen's. Programmation culturelle, accès aux aînés et soutien académique.",
    "url": "https://www.queensu.ca/fourdirections/",
    "phone": "613-533-6970",
    "address": "146 Barrie Street, Kingston, ON",
    "intent_category": "Indigenous",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.queensu.ca/fourdirections/",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Indigenous Students", "evidence_url": "https://www.queensu.ca/fourdirections/" }],
    "synthetic_queries": ["Indigenous student support Queen's", "First Nations help Kingston", "Elder services university"],
    "cultural_safety": true
  },
  {
    "id": "kfla-indigenous-health-team",
    "name": "KFL&A Indigenous Primary Health Care Team",
    "name_fr": "Équipe de soins primaires autochtones de KFL&A",
    "description": "Culturally safe primary healthcare for Indigenous individuals and families. Traditional healing integrated with western medicine.",
    "description_fr": "Soins de santé primaires culturellement sécuritaires pour les personnes et familles autochtones. Guérison traditionnelle intégrée à la médecine occidentale.",
    "url": "https://www.kchc.ca/indigenous-health-care-team/",
    "phone": "613-507-7037",
    "address": "263 Weller Avenue, Kingston, ON",
    "intent_category": "Indigenous",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.kchc.ca/indigenous-health-care-team/",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Indigenous Health", "evidence_url": "https://www.kchc.ca/indigenous-health-care-team/" }],
    "synthetic_queries": ["Indigenous doctor Kingston", "First Nations health care", "Traditional healing Kingston"],
    "cultural_safety": true
  },
  {
    "id": "kingston-indigenous-friendship-centre",
    "name": "Kingston Native Friendship Centre",
    "name_fr": "Centre d'amitié autochtone de Kingston",
    "description": "Community hub offering programs, referrals, and cultural activities for urban Indigenous peoples. Food pantry, employment support, and language revitalization.",
    "description_fr": "Centre communautaire offrant des programmes, des références et des activités culturelles pour les peuples autochtones urbains. Garde-manger, soutien à l'emploi et revitalisation linguistique.",
    "url": "https://kingstonnativecentre.com/",
    "phone": "613-548-1500",
    "address": "21 Rideau Street, Kingston, ON",
    "intent_category": "Indigenous",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://kingstonnativecentre.com/",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Indigenous Community", "evidence_url": "https://kingstonnativecentre.com/" }],
    "synthetic_queries": ["Native friendship centre Kingston", "Indigenous community programs", "First Nations food bank"],
    "cultural_safety": true
  },
  
  // EDUCATION (3 services)
  {
    "id": "kingston-literacy-skills",
    "name": "Kingston Literacy & Skills",
    "name_fr": "Alphabétisation et compétences Kingston",
    "description": "Free adult literacy and essential skills training. GED preparation, computer skills, and English language learning for newcomers.",
    "description_fr": "Formation gratuite en littératie et compétences essentielles pour adultes. Préparation au diplôme d'équivalence, compétences informatiques et apprentissage de la langue anglaise.",
    "url": "https://kingstonliteracy.com/",
    "phone": "613-547-2012",
    "address": "835 Princess Street, Kingston, ON",
    "intent_category": "Education",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://kingstonliteracy.com/",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Adult Learners", "evidence_url": "https://kingstonliteracy.com/" }],
    "synthetic_queries": ["Free GED classes Kingston", "Learn to read adult", "ESL classes Kingston free"]
  },
  {
    "id": "slc-academic-upgrading",
    "name": "St. Lawrence College Academic Upgrading",
    "name_fr": "Mise à niveau académique du Collège St. Lawrence",
    "description": "Free programs for adults to upgrade math, English, and other subjects. Pathway to college programs or employment.",
    "description_fr": "Programmes gratuits pour adultes pour améliorer les mathématiques, l'anglais et d'autres matières. Passerelle vers les programmes collégiaux ou l'emploi.",
    "url": "https://www.stlawrencecollege.ca/programs/academic-upgrading/",
    "phone": "613-544-5400",
    "address": "100 Portsmouth Avenue, Kingston, ON",
    "intent_category": "Education",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.stlawrencecollege.ca/programs/academic-upgrading/",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Adult Education", "evidence_url": "https://www.stlawrencecollege.ca/programs/academic-upgrading/" }],
    "synthetic_queries": ["Free college prep Kingston", "Upgrade high school credits", "Adult education St Lawrence"]
  },
  {
    "id": "kfpl-learning-programs",
    "name": "Kingston Frontenac Public Library Learning Programs",
    "name_fr": "Programmes d'apprentissage de la bibliothèque publique de Kingston",
    "description": "Free educational programs including computer training, homework help, and language learning resources at all library branches.",
    "description_fr": "Programmes éducatifs gratuits comprenant la formation informatique, l'aide aux devoirs et les ressources d'apprentissage des langues dans toutes les succursales.",
    "url": "https://www.kfpl.ca/programs",
    "phone": "613-549-8888",
    "address": "130 Johnson Street, Kingston, ON",
    "intent_category": "Education",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.kfpl.ca/programs",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "All Ages", "evidence_url": "https://www.kfpl.ca/programs" }],
    "synthetic_queries": ["Free computer classes library", "Homework help Kingston", "Learn English free Kingston"]
  },
  
  // TRANSPORT (3 services)
  {
    "id": "kingston-access-bus",
    "name": "Kingston Access Bus",
    "name_fr": "Service d'autobus accessible de Kingston",
    "description": "Door-to-door accessible transit for persons with disabilities who cannot use conventional transit. Advance booking required.",
    "description_fr": "Transport accessible porte-à-porte pour les personnes handicapées qui ne peuvent pas utiliser le transport conventionnel. Réservation préalable requise.",
    "url": "https://www.cityofkingston.ca/residents/transit/accessible-transit",
    "phone": "613-546-7225",
    "intent_category": "Transport",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.cityofkingston.ca/residents/transit/accessible-transit",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Disability", "evidence_url": "https://www.cityofkingston.ca/residents/transit/accessible-transit" }],
    "synthetic_queries": ["Wheelchair accessible bus Kingston", "Disabled transit service", "Paratransit Kingston"]
  },
  {
    "id": "kingston-transit-mfap",
    "name": "Kingston Transit Affordable Pass (MFAP)",
    "name_fr": "Laissez-passer abordable de Kingston Transit (MFAP)",
    "description": "Discounted monthly bus passes for low-income residents through the Municipal Fee Assistance Program. Up to 50% off regular fares.",
    "description_fr": "Laissez-passer mensuels à prix réduit pour les résidents à faible revenu via le programme municipal d'aide. Jusqu'à 50% de réduction sur les tarifs réguliers.",
    "url": "https://www.cityofkingston.ca/residents/community-services/fee-assistance",
    "phone": "613-546-4291",
    "intent_category": "Transport",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.cityofkingston.ca/residents/community-services/fee-assistance",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Low Income", "evidence_url": "https://www.cityofkingston.ca/residents/community-services/fee-assistance" }],
    "synthetic_queries": ["Cheap bus pass Kingston", "Low income transit discount", "Affordable transportation help"]
  },
  {
    "id": "von-transportation-kingston",
    "name": "VON Transportation Services",
    "name_fr": "Services de transport VON",
    "description": "Medical appointment transportation for seniors and adults with mobility challenges. Volunteer driver program.",
    "description_fr": "Transport pour rendez-vous médicaux pour les personnes âgées et les adultes ayant des problèmes de mobilité. Programme de conducteurs bénévoles.",
    "url": "https://www.von.ca/en/site/kingston",
    "phone": "613-634-0130",
    "intent_category": "Transport",
    "verification_level": "L1",
    "provenance": {
      "verified_by": "Antigravity (AI Agent)",
      "verified_at": "2026-01-02T00:00:00Z",
      "evidence_url": "https://www.von.ca/en/site/kingston",
      "method": "Web Search"
    },
    "identity_tags": [{ "tag": "Seniors", "evidence_url": "https://www.von.ca/en/site/kingston" }],
    "synthetic_queries": ["Ride to doctor appointment Kingston", "Senior transportation volunteer", "Medical transport elderly"]
  }
];

// Add new services
const updatedServices = [...services, ...newServices];

// Write back
fs.writeFileSync(servicesPath, JSON.stringify(updatedServices, null, 2));
console.log('Added', newServices.length, 'new services. Total:', updatedServices.length);

// Verify categories
const cats = {};
updatedServices.forEach(s => { cats[s.intent_category] = (cats[s.intent_category] || 0) + 1; });
console.log('Category distribution:', cats);
