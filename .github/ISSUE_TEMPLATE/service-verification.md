---
name: Service Verification
about: Verify a specific service's information is current
title: "🔍 Verify: [SERVICE NAME]"
labels: verification
assignees: ""
---

## Service Details

**Service ID**:
**Service Name**:
**Category**:
**Last Verified**:

---

## Verification Checklist

### Contact Information

- [ ] Phone number connects and reaches the service
- [ ] Website loads correctly
- [ ] Email is valid (if listed)
- [ ] Address is correct (if physical location)

### Service Information

- [ ] Hours of operation are current
- [ ] Eligibility criteria are accurate
- [ ] Fees information is current
- [ ] Description accurately reflects current services

### Bilingual Content

- [ ] French name (`name_fr`) is accurate
- [ ] French description (`description_fr`) is accurate
- [ ] French eligibility notes are current

### Identity Tags

- [ ] All identity tags have valid `evidence_url`
- [ ] Evidence URLs are still accessible

---

## After Verification

1. Update `data/services.json`:

   - Set `provenance.verified_at` to today (ISO format)
   - Set `provenance.verified_by` to your name/handle
   - Update any changed information

2. If descriptions changed significantly:

   ```bash
   npm run generate-embeddings
   ```

3. Commit and push changes

4. Close this issue
