# Service Data Changelog

## 2025-12-31

```diff
diff --git a/data/services.json b/data/services.json
index 919fc83..1b296bb 100644
--- a/data/services.json
+++ b/data/services.json
@@ -1,2139 +1,2177 @@
 [
-    {
-        "id": "kids-help-phone",
-        "name": "Kids Help Phone",
-        "name_fr": "Jeunesse, J'écoute",
-        "description": "Canada's only 24/7, national support service. Professional counselling, information, and referrals for young people in English and French.",
-        "description_fr": "Le seul service de soutien national 24/7 au Canada. Counseling professionnel, information et références pour les jeunes en anglais et en français.",
-        "url": "https://kidshelpphone.ca",
-        "phone": "1-800-668-6868",
-        "verification_level": "L1",
-        "intent_category": "Crisis",
-        "provenance": {
-            "verified_by": "Antigravity (AI Agent)",
-            "verified_at": "2025-12-29T00:50:00Z",
-            "evidence_url": "https://kidshelpphone.ca",
-            "method": "Web Search & National Service Verification"
-        },
-        "identity_tags": [
-            {
-                "tag": "Youth (National)",
-                "evidence_url": "https://kidshelpphone.ca"
-            }
-        ],
-        "synthetic_queries": [
-            "Text someone about depression",
-            "Suicidal thoughts help line",
-            "Bullying advice for kids",
-            "Anonymous counselling chat",
-            "Help I'm scared at home"
-        ],
-        "synthetic_queries_fr": [
-            "J'ai besoin de parler à quelqu'un",
-            "Texter un conseiller",
-            "Je suis triste et seul",
-            "Aide pour l'intimidation",
-            "Pensées suicidaires"
-        ],
-        "eligibility_notes": "Inclusion: All youth (5-29) in Canada. Mental health support. Exclusion: None (24/7 anonymous).",
-        "access_script": "Hi, I'm feeling really overwhelmed right now and just need someone to talk to. Is this a safe place to share?",
-
... (truncated)
```
