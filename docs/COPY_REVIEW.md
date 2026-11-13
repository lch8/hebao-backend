# Copy simplification · 2026-11-12

- Remove promotional kickers above headings and redundant footer slogans.
- Activity cards show title, date/time, place and price. Descriptions remain in the expandable details alongside the source and verification date.
- Avoid adding a city prefix if the venue already names the city. When a specific city is selected, do not add it again to every card.
- Community cards show remaining spaces once; remove the second count beside the host.
- Shorten navigation and actions: 约伴, 本周末, 约同行, 报名名单.
- Share modal displays the poster and two actions, without repeating the complete invitation above the same poster. If clipboard access fails, reveal selectable invitation text.
- Posters retain user instructions and admission details but remove duplicated generated introductions and raw source URLs. Full details remain on the linked page.
- Remove explanatory copy about preview refresh and placement of the platform attribution. Retain privacy, fees, time zone and participation conditions.

QA: same 10-event page, collapsed details, visible activity-panel text measured with innerText: 1,483 → 1,121 characters (24.4% reduction, including whitespace). Counts on the community tab changed from 1 to 0 when the disposable QA database restarted; both occupy one character. 22 existing tests passed. Desktop, 390px iframe layout, event creation, poster generation and clipboard success verified locally.

Screenshots: hebao-concise.jpg and hebao-share-concise.jpg. Share preview uses disposable test data.
