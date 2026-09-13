## Checklist

- [ ] I created a JSON file in `js/data/contributions/`
- [ ] File has a descriptive name (e.g., `siddhivinayak-mandal.json`)
- [ ] All required fields are present (`name`, `address`, `area`, `city`, `state`, `pincode`, `lat`, `lng`, `category`, `description`)
- [ ] `category` is in the allowlist (Premium, Heritage, Traditional, Modern, Eco-Friendly, Community)
- [ ] `lat` and `lng` are in the Mumbai range (lat 18.88–19.28, lng 72.75–73.05)
- [ ] I ran `node scripts/data.mjs probe` locally and it passed
- [ ] I did **not** edit `core.json` or `mandals.js`
