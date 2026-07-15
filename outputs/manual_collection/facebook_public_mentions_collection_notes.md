# Facebook Public Mentions Manual Collection Notes

Collection date: 2026-07-15

Source method:

- User opened Facebook search result tabs in the in-app browser.
- Codex read only visible search-result content from those pages.
- Rows were manually normalized into `outputs/manual_collection/facebook_public_mentions_manual_input.csv`.

Scope:

- These rows are a small manual public-search sample, not a complete social listening export.
- Official Faculty/Page-owned posts were excluded from the CSV because the goal is mentions from other people or groups.
- Search-result rows about unrelated housing, land sales, local events, ads, and non-admissions content were excluded.
- Personal names were not stored. The `author` field uses `public-group`.

Current included rows:

- `2025-01-08`: TCAS group discussion asking about chance of entering Engineering at Kasetsart University.
- `2026-01-14`: TCAS group discussion asking about Engineering options including Kasetsart University.
- `2026-04-06`: TCAS group discussion comparing Engineering choices including Kasetsart University.

Important limitation:

The Facebook search results currently available were broader "วิศวะเกษตร" / Kasetsart Engineering discussions, not all exact Kamphaeng Saen-specific public mentions. Treat this dataset as a manual sample for pipeline validation and presentation, not full market coverage.
