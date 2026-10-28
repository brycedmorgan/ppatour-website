# Local event listings + Google Business Profile

Bryce, 2026-10-27: every Tour stop gets (1) a Google Business Profile event post and
(2) a listing on each host city's tourism / CVB calendar and the state tourism site
(e.g. visitarizona.com/events). Jeff Watson owned this and it never happened; he left 10/16.

**Why:** these listings feed Google's event results, AI search answers, and the bureaus'
social accounts (Visit Arizona IG ~350k). They are also third-party sources that back the
Wikipedia article (Wikidata item Q141769292 already exists; Nathan holds the article draft,
see docs/SEO.md §7a).

**Logo on event pages: already done.** All 18 Tour stops show their badge in the event
hero (`brand.icon` in `lib/placeholder-data.ts`, files in `public/ppa/badges/`). The event
JSON-LD carries dates, street address, venue, offers, broadcasts and podiums
(`lib/event-schema.ts`).

## Google Business Profile

- A profile exists: **"Professional Pickleball Association (PPA)"**, 2100 Ross Ave, Dallas TX
  75201 (EmployerDirect Tower), category "Professional association", site ppatour.com.
  It has owner photos, so someone has claimed it.
- **Bryce's Google account manages 0 profiles** (checked business.google.com 10/27).
  Find the owner first. Likely candidates: Jeff Watson or Tyler Dodd (both gone; Bryce is
  Workspace super-admin and holds Tyler's accounts). Otherwise use Google's "request access"
  flow from the Maps listing.
- Once in: add Bryce + a marketing owner as managers, then one **Event** post per stop
  (title, dates, copy below, ticket link button). Event posts drop off after the end date.

## Rules that bite

- Contact on every form: **marketing@ppatour.com** (Bryce, 10/28). Org address: 2100 Ross Ave, Dallas TX 75201.
- Most forms have a reCAPTCHA. Claude fills; a person ticks the box and submits.
- Never accept a bureau's photo-license or indemnity terms without Bryce (Visit Newport Beach has one).
- No street address on file for Arizona Athletic Grounds; Mesa forms used the venue name + 85212.

- **Never name a player in listing copy** (standing private matters). Copy below is generic.
- Images: most bureaus want a 3:2 or 4:3 photo with **no logos or text** (Visit Arizona,
  Visit Florida, Explore Gwinnett). Use an action/crowd photo, not the OG card.
- Lead times: Visit Arizona 9 months, Visit Cincy 6–8 weeks, Visit Mesa 3 weeks,
  Sacramento365 2–4 weeks, Greater Zion 2 weeks, Texas Highways quarterly (too late for Worlds).

## Tracker

Status: ☐ open · ⏳ in progress · ✅ submitted (date) · 🟢 live (date) · ✖ rejected

### Worlds: Nov 2–8, Farmers Branch TX — URGENT
| | Where | How | Status |
|---|---|---|---|
| ⏳ 10/28 filled, needs CAPTCHA | Visit Dallas | https://www.visitdallas.com/events/submit-event/ (no login). Farmers Branch is outside city limits: email events@visitdallas.com asking for the exception | |
| ⏳ 10/28 Gmail draft ready | Discover Farmers Branch | No form. discover@farmersbranchtx.gov · 972.247.3131. Best route to their social | |
| ☐ | Patch Farmers Branch | https://patch.com/texas/farmers-branch-tx/compose/event (free account) | |
| ☐ | Dallas Observer | calendar@dallasobserver.com | |
| ✖ | Texas Highways / TravelTexas | Missed the deadline. Submit 2027 stops by quarter deadlines | |

### Daytona Beach Open: Nov 16, Holly Hill FL
| ⏳ 10/28 filled, needs CAPTCHA | Daytona Beach Area CVB | https://www.daytonabeach.com/events/submit-an-event/ (no login). Media: abooth@daytonabeach.com | |
|---|---|---|---|
| ☐ | Patch Holly Hill / Daytona | patch.com/florida/holly-hill-fl/calendar | |
| ☐ | VISIT FLORIDA | Partner account first: portal.visitflorida.org | |

### Malibu Showcase: Dec 14, Malibu CA
| ☐ | Discover Los Angeles | https://www.discoverlosangeles.com/events/submission (account) | |
|---|---|---|---|
| ☐ | Malibu-Palisades Chamber | Email; calendar business.palibu.org/events | |

### Carvana Pickleball Masters: Jan 11, Rancho Mirage CA
| ☐ | Visit Greater Palm Springs | https://www.visitgreaterpalmsprings.com/events/submit-an-event/ (partner extranet). media@visitgreaterps.com | |
|---|---|---|---|
| ☐ | KESQ (CitySpark) | https://hub.cityspark.com/event/submission/KESQ | |
| ☐ | Desert Sun | desertsun.com/things-to-do/events/ (Evvnt) | |

### Minneapolis Indoor Open: Jan 18, Lakeville MN
| ⏳ 10/28 filled, needs photo drag-in | Explore Minnesota | https://www.exploreminnesota.com/submit-event (public form). Anne Paterson, anne.paterson@state.mn.us | |
|---|---|---|---|
| ☐ | Meet Minneapolis | Partner portal, 612-767-8000. Criteria: minneapolis.org/partners/event-calendar-criteria/ | |
| ☐ | Patch Lakeville | patch.com/minnesota/lakeville/calendar | |

### Cape Coral Open: Feb 1, Cape Coral FL
| ☐ | Lee County VCB (Visit Fort Myers) | Partner extranet. tderathe@leegov.com, 239-338-3500 | |
|---|---|---|---|
| ☐ | Cape Coral Chamber | https://capecoralchamber.com/events/community-calendar/ | |
| ☐ | Patch Cape Coral | patch.com/florida/cape-coral-fl/calendar | |

### Carvana Mesa Cup: Feb 15, Mesa AZ
| ⏳ 10/28 filled, needs CAPTCHA | Visit Mesa | https://www.visitmesa.com/events/submit-an-event/ (no login, ≥3 weeks ahead) | |
|---|---|---|---|
| ☐ | Visit Arizona | https://visitarizona.com/events/submit (wants 9 months; submit anyway) | |
| ⏳ 10/28 filled, needs CAPTCHA | Visit Phoenix | https://www.visitphoenix.com/events/submit-an-event/ (no login). lpresson@visitphoenix.com | |

### Newport Beach Open: Mar 1, Newport Beach CA
| ⚠ needs Bryce: form requires a photo license + indemnification agreement | Visit Newport Beach | https://visitnewportbeach.com/about/industry-partners/submit-promotion/ (no login) | |
|---|---|---|---|
| ☐ | OC Register (CitySpark) | https://hub.cityspark.com/event/submission/OrangeCountyR | |

### Greater Zion Cup: Mar 22, Ivins UT
| ☐ | Greater Zion + statewide (Now Playing Utah) | https://events.greaterzion.com/submit/ (one submission, both calendars) | |
|---|---|---|---|
| ☐ | St. George News | https://www.stgeorgeutah.com/local-events/ | |

### Sacramento Open: Apr 5, Sacramento CA
| ☐ | Sacramento365 (Visit Sacramento) | https://sacramento365.com/login/ (2–4 weeks ahead) | |
|---|---|---|---|
| ☐ | Sacramento Bee (CitySpark) | https://hub.cityspark.com/event/submission/SacBee | |

### Cincinnati Open: Apr 12, Cincinnati OH
| ☐ | Visit Cincy | https://www.visitcincy.com/events/submit-your-event/ (no login, 6–8 weeks ahead). KFisher@VisitCincy.com | |
|---|---|---|---|
| ☐ | Ohio.org | development.my.site.com/OhioListings (account; pro sports eligible) | |
| ☐ | CityBeat (CitySpark) | https://hub.cityspark.com/event/submission/CincinnatiCityBeat | |
| ⚠ | Venue still TBD on our site | Fill `lib/venue-locations.ts` before submitting | |

### Pickleball Players Championships: Apr 26, Peachtree Corners GA
| ⏳ 10/28 filled, needs CAPTCHA | Explore Gwinnett | https://www.exploregwinnett.org/events/submit-event/ (no login, ≤250-char summary, 4:3 image) | |
|---|---|---|---|
| ⏳ 10/28 filled, needs CAPTCHA | Discover Atlanta | https://discoveratlanta.com/add-your-event/ (no login, name ≤50 chars) | |
| ☐ | Explore Georgia | partner.exploregeorgia.org (account) | |
| ☐ | Access Atlanta | https://events.accessatlanta.com/ | |

### PPA Finals: May 10, San Clemente CA
| ⏳ 10/28 filled, needs CAPTCHA | Dana Point Chamber | https://business.danapointchamber.com/events/public-submission (no login) | |
|---|---|---|---|
| ☐ | San Clemente Chamber | Email; business.scchamber.com/events/calendar/ | |
| ☐ | OC Register (CitySpark) | same link as Newport Beach | |

**Shared logins:** one Patch account covers every market; one CitySpark login likely covers
KESQ, OC Register, SacBee and CityBeat; Now Playing Utah covers both Utah calendars.

## Listing copy (paste-ready)

Generated 10/27 from each event page's live JSON-LD. Re-check dates and ticket status
before submitting.

### Opendoor Pickleball World Championships · Nov 2–8, 2026
- Venue: Brookhaven Country Club, 3333 Golfing Green Dr, Farmers Branch, TX 75234
- Page: https://www.ppatour.com/events/2026/pickleball-world-championships/
- Tickets: https://www.tixr.com/groups/ppa/events/2026-world-pickleball-championships-166345
- Image: https://www.ppatour.com/ppa/venues/brookhaven/aerial-01.jpg
- Short (≤250): The world's best pro pickleball players come to Farmers Branch for the Opendoor Pickleball World Championships, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Opendoor Pickleball World Championships to Brookhaven Country Club in Farmers Branch, TX, Nov 2–8, 2026. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2026/pickleball-world-championships/

### Proton Daytona Beach Open · Nov 16–22, 2026
- Venue: Pictona at Holly Hill, 1060 Ridgewood Ave, Holly Hill, FL 32117
- Page: https://www.ppatour.com/events/2026/proton-daytona-beach-open/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-daytona-beach-203020
- Image: https://www.ppatour.com/ppa/action-singles.jpg
- Short (≤250): The world's best pro pickleball players come to Holly Hill for the Proton Daytona Beach Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Proton Daytona Beach Open to Pictona at Holly Hill in Holly Hill, FL, Nov 16–22, 2026. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2026/proton-daytona-beach-open/

### Veolia Malibu Showcase · Dec 14–20, 2026
- Venue: Pepperdine University - Ralphs-Straus Tennis Center, 24255 Pacific Coast Hwy, Malibu, CA 90263
- Page: https://www.ppatour.com/events/2026/veolia-malibu-cup/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-malibu-176502
- Image: https://www.ppatour.com/ppa/action-waters-bright.jpg
- Short (≤250): The world's best pro pickleball players come to Malibu for the Veolia Malibu Showcase, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Veolia Malibu Showcase to Pepperdine University - Ralphs-Straus Tennis Center in Malibu, CA, Dec 14–20, 2026. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2026/veolia-malibu-cup/

### Carvana Pickleball Masters · Jan 11–17, 2027
- Venue: Mission Hills Country Club, 34600 Mission Hills Dr, Rancho Mirage, CA 92270
- Page: https://www.ppatour.com/events/2027/carvana-pickleball-masters/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-palm-springs-204325
- Image: https://www.ppatour.com/ppa/venues/mission-hills-ca/aerial-01.jpg
- Short (≤250): The world's best pro pickleball players come to Rancho Mirage for the Carvana Pickleball Masters, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Carvana Pickleball Masters to Mission Hills Country Club in Rancho Mirage, CA, Jan 11–17, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/carvana-pickleball-masters/

### Minneapolis Indoor Open · Jan 18–24, 2027
- Venue: Life Time — Lakeville, 18425 Dodd Blvd, Lakeville, MN 55044
- Page: https://www.ppatour.com/events/2027/minneapolis-indoor-open/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-minneapolis-206216
- Image: https://www.ppatour.com/ppa/venues/lt-lakeville-mn/aerial-01.jpg
- Short (≤250): The world's best pro pickleball players come to Lakeville for the Minneapolis Indoor Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Minneapolis Indoor Open to Life Time — Lakeville in Lakeville, MN, Jan 18–24, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/minneapolis-indoor-open/

### Cape Coral Open · Feb 1–7, 2027
- Venue: The Courts, Cape Coral, 420 SW 2nd Ave, Cape Coral, FL 33991
- Page: https://www.ppatour.com/events/2027/cape-coral-open/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-cape-coral-206222
- Image: https://www.ppatour.com/ppa/events/cape-coral-open.jpg
- Short (≤250): The world's best pro pickleball players come to Cape Coral for the Cape Coral Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Cape Coral Open to The Courts, Cape Coral in Cape Coral, FL, Feb 1–7, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/cape-coral-open/

### Carvana Mesa Cup · Feb 15–21, 2027
- Venue: Arizona Athletic Grounds, Mesa, AZ 85212
- Page: https://www.ppatour.com/events/2027/carvana-mesa-cup/
- Tickets: https://www.tixr.com/groups/ppa/events/ppa-mesa-210307
- Image: https://www.ppatour.com/ppa/venues/aag-mesa/aerial-01.jpg
- Short (≤250): The world's best pro pickleball players come to Mesa for the Carvana Mesa Cup, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Carvana Mesa Cup to Arizona Athletic Grounds in Mesa, AZ, Feb 15–21, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets start at $25. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/carvana-mesa-cup/

### Newport Beach Open · Mar 1–7, 2027
- Venue: The Tennis and Pickleball Club at Newport Beach, 11 Clubhouse Dr, Newport Beach, CA 92660
- Page: https://www.ppatour.com/events/2027/newport-beach-open/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/action-singles.jpg
- Short (≤250): The world's best pro pickleball players come to Newport Beach for the Newport Beach Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Newport Beach Open to The Tennis and Pickleball Club at Newport Beach in Newport Beach, CA, Mar 1–7, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/newport-beach-open/

### Greater Zion Cup · Mar 22–28, 2027
- Venue: Black Desert Resort, 1500 E Black Desert Dr, Ivins, UT 84738
- Page: https://www.ppatour.com/events/2027/greater-zion-cup-at-black-desert-resort/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/events/greater-zion-cup.jpg
- Short (≤250): The world's best pro pickleball players come to Ivins for the Greater Zion Cup, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Greater Zion Cup to Black Desert Resort in Ivins, UT, Mar 22–28, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/greater-zion-cup-at-black-desert-resort/

### Sacramento Open · Apr 5–11, 2027
- Venue: Life Time Arden, 1220 Arden Hills Ln, Sacramento, CA 95864
- Page: https://www.ppatour.com/events/2027/sacramento-open/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/action-singles.jpg
- Short (≤250): The world's best pro pickleball players come to Sacramento for the Sacramento Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Sacramento Open to Life Time Arden in Sacramento, CA, Apr 5–11, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/sacramento-open/

### Cincinnati Open · Apr 12–18, 2027
- Venue: Cincinnati, Cincinnati, OH 
- Page: https://www.ppatour.com/events/2027/cincinnati-open/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/action-champ-sunday.jpg
- Short (≤250): The world's best pro pickleball players come to Cincinnati for the Cincinnati Open, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Cincinnati Open to Cincinnati, OH, Apr 12–18, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/cincinnati-open/

### Pickleball Players Championships · Apr 26 – May 2, 2027
- Venue: Life Time — Peachtree Corners, 6350 Courtside Dr NW, Peachtree Corners, GA 30092
- Page: https://www.ppatour.com/events/2027/atlanta-pickleball-championships/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/events/atlanta-pickleball-championships.jpg
- Short (≤250): The world's best pro pickleball players come to Peachtree Corners for the Pickleball Players Championships, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the Pickleball Players Championships to Life Time — Peachtree Corners in Peachtree Corners, GA, Apr 26 – May 2, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/atlanta-pickleball-championships/

### PPA Finals · May 10–16, 2027
- Venue: Life Time Rancho San Clemente, 111 Avenida Vista Montana, San Clemente, CA 92672
- Page: https://www.ppatour.com/events/2027/ppa-finals/
- Tickets: not on sale yet
- Image: https://www.ppatour.com/ppa/venues/lt-sanclemente/aerial-01.jpg
- Short (≤250): The world's best pro pickleball players come to San Clemente for the PPA Finals, a stop on the Carvana PPA Tour.
- Long: The Carvana PPA Tour brings the PPA Finals to Life Time Rancho San Clemente in San Clemente, CA, May 10–16, 2027. Watch the top-ranked pros in the world battle for titles in singles, doubles and mixed doubles. The week also has amateur and junior brackets, so fans can play the same courts as the pros. Tickets on sale soon. Schedule, tickets, parking and how to watch: https://www.ppatour.com/events/2027/ppa-finals/

