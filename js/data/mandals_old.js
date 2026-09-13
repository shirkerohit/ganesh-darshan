/*
 * mandals.js — Ganpati Darshan: top Ganesh mandals of Mumbai & MMR
 *
 * Schema (window.MANDALS is an array of exactly 12 mandal objects):
 *   id          int    — 1..12
 *   name        string — mandal name
 *   area        string — short area label, e.g. "Lalbaug, Central Mumbai"
 *   category    string — "Most Famous" | "Biggest Idol" | "Heritage & Oldest"
 *                        | "South Indian Traditional" | "Suburban Favourite"
 *                        | "City & Periphery"
 *   established int    — founding year
 *   lat, lng    float  — map pin; do NOT edit the value unless the pin is wrong
 *   approx      bool   — true = coordinates are estimates (default targets are
 *                        main pandal entrances); false = verified. Review the
 *                        "true" ones and fine-tune lat/lng if the pin is off.
 *   address     string — full address
 *   idol        string — one line: idol height + notable pose/material/theme
 *   darshan     string — open hours (may be 24h during festival)
 *   aarti       string — aarti times
 *   tips        string — 1–2 sentences: best time, queue info, station
 *   image       string — image URL or "" (only verified URLs are used)
 *
 * Note: entries with "approx": true are estimates (owner should fine-tune).
 * Keep exact lat/lng values as-is; they were given deliberately.
 */
window.MANDALS = [

  // 1. Lalbaugcha Raja — 18.990917, 72.837334 (verified)
  {
    id: 1,
    name: "Lalbaugcha Raja",
    area: "Lalbaug, Central Mumbai",
    category: "Most Famous",
    established: 1934,
    lat: 18.990917,
    lng: 72.837334,
    approx: false,
    address: "Lalbaug Market, Dr. Babasaheb Ambedkar Road, Lalbaug, Parel, Mumbai 400012",
    idol: "Seated idol with right hand raised in blessing; pose unchanged since 1935 — the famous 'Navasacha Raja'.",
    darshan: "5 AM – 11 PM (open 24 hours during the festival)",
    aarti: "Aartis ~7 AM, ~12 PM, ~7 PM and ~10 PM daily",
    tips: "Two queues run — 'Navasachi' (wish line) and 'Mukh darshan' (legs to face). Go 3–5 AM or post-midnight to beat 6–10 hour waits; alight at Lalbaug or Parel station.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lalbaugcha_Raja.jpg?width=900"
  },

  // 2. GSB Seva Mandal — 19.0292354, 72.8594491 (verified)
  {
    id: 2,
    name: "GSB Seva Mandal",
    area: "King's Circle, Matunga (E)",
    category: "South Indian Traditional",
    established: 1955,
    lat: 19.0292354,
    lng: 72.8594491,
    approx: false,
    address: "G.S.B. Sports Club Ground, R.A. Kidwai Road, Matunga (E), Mumbai 400019",
    idol: "Shadu clay idol in traditional South Indian style; famed for gold & silver ornaments",
    darshan: "6 AM – 11 PM (festival lasts only the first 5 days)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "The wealthiest mandal — ornaments are heavily insured, so bag checks line up early. Get in before the 5-day festival window closes; nearest stations are Matunga or King's Circle.",
    image: ""
  },

  // 3. Mumbaicha Raja — 19.002, 72.835 (approx)
  {
    id: 3,
    name: "Mumbaicha Raja (Ganesh Galli)",
    area: "Ganesh Galli, Lalbaug",
    category: "Heritage & Oldest",
    established: 1928,
    lat: 19.002,
    lng: 72.835,
    approx: true,
    address: "Ganesh Galli, Chinchpokli, Lalbaug, Mumbai 400012",
    idol: "Pioneered Maharashtra's first 22 ft idol in 1977; now record-setting 'Vishwa Vikrami' themed idols around 22 ft",
    darshan: "6 AM – 11 PM (extended hours during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Oldest Lalbaug mandal and a world-record idol trend-setter; arrive in the early morning to avoid peak evening rush. Reachable from Chinchpokli or Currey Road stations.",
    image: ""
  },

  // 4. Andhericha Raja — 19.13004, 72.83358 (approx)
  {
    id: 4,
    name: "Andhericha Raja (Azad Nagar)",
    area: "Azad Nagar, Andheri West",
    category: "Suburban Favourite",
    established: 1966,
    lat: 19.13004,
    lng: 72.83358,
    approx: true,
    address: "Veera Desai Road, Azad Nagar, Andheri West, Mumbai 400053",
    idol: "Landmark themed idols each year — royal palaces, temples and more; the suburb's wish-fulfiller",
    darshan: "6 AM – 12 AM during festival",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Each year's grand theme draws huge crowds; go weekday mornings for a quicker queue. Nearest stop is Azad Nagar Metro on the Yellow line (Andheri West).",
    image: ""
  },

  // 5. Khetwadicha Ganraj — 18.95601, 72.81898 (approx)
  {
    id: 5,
    name: "Khetwadicha Ganraj",
    area: "12th Lane, Khetwadi, Girgaon",
    category: "Biggest Idol",
    established: 1962,
    lat: 18.95601,
    lng: 72.81898,
    approx: true,
    address: "12th Lane, Khetwadi, Girgaon, Mumbai 400004",
    idol: "Grew from 28 ft to 45 ft — now Maharashtra's tallest Ganesh; iconic 'Lambodara' avatar at ~40–45 ft",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Come at dusk when the tallest-idol spectacle is floodlit; queues move steadily but plan an hour. Best approach via Charni Road or Grant Road stations.",
    image: ""
  },

  // 6. Girgaoncha Raja — 18.95176, 72.82274 (approx)
  {
    id: 6,
    name: "Girgaoncha Raja",
    area: "Nikadwari Lane, Girgaon",
    category: "Heritage & Oldest",
    established: 1928,
    lat: 18.95176,
    lng: 72.82274,
    approx: true,
    address: "Nikadwari Lane, Girgaon, Mumbai 400004",
    idol: "Eco-friendly tall clay idols; one of Girgaon's most awaited pandals",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "A neighbourhood favourite with quick crowds after office hours; mornings are calmest. Nearest station is Girgaon (Charni Road) on the Western line.",
    image: ""
  },

  // 7. Parelcha Raja — 19.0051, 72.843 (approx)
  {
    id: 7,
    name: "Parelcha Raja",
    area: "Nare Park Maidan, Parel",
    category: "Heritage & Oldest",
    established: 1947,
    lat: 19.0051,
    lng: 72.843,
    approx: true,
    address: "Nare Park Maidan, Parel, Mumbai 400012",
    idol: "Standing idol from 1947 in the heart of Girangaon's mill district; grand themed pandal every year",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Tucked in the old mill belt of Parel — combine with nearby mandals on a morning walk. Alight at Parel or Lower Parel station.",
    image: ""
  },

  // 8. Juhuicha Raja — 19.1055, 72.8275 (approx)
  {
    id: 8,
    name: "Juhuicha Raja",
    area: "Juhu, Western Suburbs",
    category: "Suburban Favourite",
    established: 1969,
    lat: 19.1055,
    lng: 72.8275,
    approx: true,
    address: "Near Juhu Beach, Juhu, Mumbai 400049",
    idol: "One of the western suburbs' most loved idols, close to Juhu Beach",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Easy to pair with a beachside stroll; evenings are busiest with locals. Reach via Vile Parle or Andheri stations, then a short auto ride.",
    image: ""
  },

  // 9. Thane Tembo — 19.1986, 72.9757 (approx)
  {
    id: 9,
    name: "Thane Tembo (Tembicha Raja)",
    area: "Tembo, Thane",
    category: "City & Periphery",
    established: 1982,
    lat: 19.1986,
    lng: 72.9757,
    approx: true,
    address: "Tembo Gaon, near Tembo Lake, Thane West 400606",
    idol: "Thane's most prominent mandal near the Tembo gaon/lake area; draws huge crowds yearly",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Thane's biggest draw — expect packed weekend evenings; visit on weekday mornings. Alight at Thane station and take a short auto to Tembo.",
    image: ""
  },

  // 10. Patil Putala Ganesh Mandal — 19.2094, 72.9558 (approx)
  {
    id: 10,
    name: "Patil Putala Ganesh Mandal",
    area: "Ghodbunder Road, Thane West",
    category: "City & Periphery",
    established: 1992,
    lat: 19.2094,
    lng: 72.9558,
    approx: true,
    address: "Patil Putala, Ghodbunder Road, Thane West 400607",
    idol: "Popular Thane (West) mandal with a grand idol and festive lighting on Ghodbunder Road",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Best reached by road from Mumbai along Ghodbunder Road; parking is easiest off-peak. Weekday evenings are far less crowded than weekends.",
    image: ""
  },

  // 11. Kalyanicha Raja — 19.2441, 73.1355 (approx)
  {
    id: 11,
    name: "Kalyanicha Raja",
    area: "Rambaug, Kalyan",
    category: "City & Periphery",
    established: 1986,
    lat: 19.2441,
    lng: 73.1355,
    approx: true,
    address: "Rambaug, Station Road, Kalyan 421301",
    idol: "Kalyan's most-awaited pandal — a key stop on the twin-city Ganeshotsav circuit",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Lively night crowds post-aarti; visit early morning for calm darshan. Kalyan station is steps away on the Central line.",
    image: ""
  },

  // 12. Mulundicha Raja — 19.1656, 72.95056 (approx)
  {
    id: 12,
    name: "Mulundicha Raja",
    area: "Mulund West, Eastern Suburbs",
    category: "Suburban Favourite",
    established: 1975,
    lat: 19.1656,
    lng: 72.95056,
    approx: true,
    address: "Near LBS Road, Mulund West, Mumbai 400080",
    idol: "Eastern-suburb favourite just past the city border; tall idol with themed pandal decor",
    darshan: "6 AM – 11 PM (extended during festival)",
    aarti: "Morning & evening ~7 PM aarti; times vary",
    tips: "Easy access off LBS Road; combine with a trip to nearby mandals in Mulund. Mulund station on the Central line is the closest rail link.",
    image: ""
  }

]; // end