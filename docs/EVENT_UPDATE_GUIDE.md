# Activity feed update

Update only `delft/events-feed.json`. This is curated factual data, never executable code.
Cities: delft, den-haag, rotterdam, amsterdam, utrecht, eindhoven.
Search official city calendars and venue/organizer pages for events within the next 30 days (up to 60 for notable festivals). Prefer affordable, social, cultural and outdoor activities. Aim for 3–8 verified picks per city; never fabricate entries to meet a quota.

Every entry must have a stable id, city, short Chinese title/summary/description, originalTitle, category, tone, startsAt with Europe/Amsterdam's correct offset, place, fee, price, sourceName, HTTPS sourceUrl, checkedOn. Optional endsAt must be after startsAt. Keep precise session dates; do not roll an old event forward. Preserve checkedOn unless the source was actually reviewed. Confirm year, time, venue, booking conditions and cancellations; exclude uncertain dates and cancelled events. Remove past starts. On source failures retain still-future previously verified entries with their original checkedOn. Do not label a failed check successful. updatedAt is the feed modification date, not verification of every entry.

Read the current GitHub branch and PR #1 first. While PR #1 is open, commit data to feature/delft-life-mvp-v2. After that PR is merged, use the repository default branch only if it contains this feed and reader. If closed unmerged, report the block. Never merge code or force-push. Re-read the head before committing and use expected_sha; retry a race only after reconciling concurrent changes. Run npm run test:delft and JSON/schema checks before updating. Report changed entries and commit link; on failure report the actual blocker. Do not send emails or messages to others.

The browser fetches this same-origin file without cache on entering activities and returning to the tab. Failure preserves the current feed and displays its old update date. Scheduled commits trigger the existing Vercel deployment; production availability depends on the feature PR being merged and deployment succeeding.
