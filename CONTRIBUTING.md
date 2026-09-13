# Contributing to Ganpati Darshan Data

## Overview

Contributors submit mandal data via Pull Requests. **Never edit `core.json` or `mandals.js` directly.** Instead, add a new JSON file in `js/data/contributions/`. The data pipeline will validate your contribution and auto-generate the final files on merge.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/ganpati-darshan.git
   cd ganpati-darshan
   ```

## How to Contribute

1. Create a new JSON file in `js/data/contributions/` with a descriptive name:
   ```bash
   touch js/data/contributions/my-mandal-name.json
   ```

2. Fill in the file using the template below.

3. Run the validator locally:
   ```bash
   node scripts/data.mjs probe
   ```

4. Commit and open a Pull Request.

## Data Template

Each contribution file must be a JSON object with the following fields:

```json
{
  "name": "Siddhivinayak Ganesh Mandal",
  "shortName": "Siddhivinayak",
  "address": "L.J. Road, Prabhadevi, Mumbai 400013",
  "area": "Prabhadevi",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400013",
  "lat": 18.9918,
  "lng": 72.8360,
  "category": "Premium",
  "description": "One of the most famous Ganesh mandals in Mumbai, established in 1975.",
  "established": 1975,
  "contact": {
    "phone": "+91-9876543210",
    "website": "https://siddhivinayak.org"
  },
  "images": [
    "https://example.com/image1.jpg"
  ],
  "tags": ["famous", "premium", "immersive"]
}
```

### Field Descriptions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Full name of the mandal |
| `shortName` | No | string | Short or commonly used name |
| `address` | Yes | string | Full street address |
| `area` | Yes | string | Locality or neighborhood |
| `city` | Yes | string | City name |
| `state` | Yes | string | State name |
| `pincode` | Yes | string | PIN code (6 digits) |
| `lat` | Yes | number | Latitude (Mumbai range: 18.88–19.28) |
| `lng` | Yes | number | Longitude (Mumbai range: 72.75–73.05) |
| `category` | Yes | string | One of the allowed categories (see below) |
| `description` | Yes | string | Brief description of the mandal |
| `established` | No | number | Year the mandal was established |
| `contact` | No | object | Object with `phone` and/or `website` |
| `images` | No | array | Array of image URL strings |
| `tags` | No | array | Array of keyword strings for filtering |

## Category Allowlist

Your `category` field **must** be one of the following:

1. `Premium`
2. `Heritage`
3. `Traditional`
4. `Modern`
5. `Eco-Friendly`
6. `Community`

## Validating Locally

Before opening a PR, run the probe command:

```bash
node scripts/data.mjs probe
```

This checks:
- All contribution files have valid JSON
- All required fields are present
- Category values are in the allowlist
- Coordinates are within the Mumbai range
- No duplicate mandal names

## PR Process

1. Open a Pull Request with your new contribution file.
2. CI runs the `validate` job which checks your file and ensures you haven't touched `core.json` or `mandals.js`.
3. Once approved and merged into `main`, the `regen` job auto-generates `mandals.js` and SEO files.
4. Your mandal will appear on the site on the next deployment.

## Rules

- **No `id` field** — IDs are generated automatically by the pipeline.
- **Do not edit** `core.json` or `mandals.js` — your PR will be rejected by CI.
- **One mandal per file** — each JSON file contains exactly one mandal object.
- **Unique names** — mandal names must be unique across all contributions.

## FAQ

**Q: Can I update an existing mandal?**
A: Yes — edit your existing contribution file in `js/data/contributions/` and submit a new PR.

**Q: What if my mandal name is already taken?**
A: The validator will flag it. Use your `shortName` or add a location qualifier (e.g., "Ganesh Mandal - Andheri").

**Q: Do I need to regenerate files locally?**
A: No. The `regen` job on the `main` branch handles this automatically after your PR is merged.

**Q: How do I add images?**
A: Host images externally (e.g., on a CDN or image hosting service) and add the URLs to the `images` array.
