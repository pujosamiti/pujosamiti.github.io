-- Starter data: current-year events and a welcome notice.
-- Apply locally:  wrangler d1 execute pujosamiti --local --file=seed.sql
-- Apply remote:   wrangler d1 execute pujosamiti --remote --file=seed.sql

INSERT OR IGNORE INTO event (id, kind, year, name_bn, name_en, starts_on, ends_on, is_active) VALUES
  ('durga-pujo-2026', 'durga-pujo', 2026, 'দুর্গাপূজা', 'Durga Pujo', '2026-10-17', '2026-10-21', 1),
  ('kojagari-lakshmi-pujo-2026', 'kojagari-lakshmi-pujo', 2026, 'কোজাগরী লক্ষ্মীপূজা', 'Kojagari Lakshmi Puja', '2026-10-25', '2026-10-25', 0),
  ('bijoya-sammelani-2026', 'bijoya-sammelani', 2026, 'বিজয়া সম্মিলনী', 'Bijoya Sammelani', '2026-11-01', '2026-11-01', 0),
  ('saraswati-pujo-2027', 'saraswati-pujo', 2027, 'সরস্বতী পূজা', 'Saraswati Puja', '2027-02-11', '2027-02-11', 0),
  ('poila-baishakh-2027', 'poila-baishakh', 2027, 'পয়লা বৈশাখ', 'Poila Baishakh', '2027-04-15', '2027-04-15', 0);

INSERT OR IGNORE INTO notice (id, event_id, title, body, pinned, published_at) VALUES
  ('welcome-2026', 'durga-pujo-2026', 'Pujo Samiti is live!',
   'The samiti website is up. Time tables, notices and the gallery will appear here through the season. **Subho Sharodiya!**',
   1, unixepoch());
