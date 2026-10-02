-- Two Bengali spellings set right across every year's nirghanto (2 Oct 2026):
--   চন্ডীপাঠ → চণ্ডীপাঠ   (চণ্ডী takes মূর্ধন্য ণ: ণ্ড, not ন্ড)
--   লক্ষী    → লক্ষ্মী    (ক্ষ with ম-ফলা — said "Lokkhi", written লক্ষ্মী)
-- The 2026 Ashtami row already read চণ্ডীপাঠ; the rest followed an early
-- typo. REPLACE on every Bengali column, so re-running it is harmless
-- (লক্ষী is not a substring of লক্ষ্মী). api/seed-nirghanto.sql and
-- update-nirghanto-2026-v3.sql carry the same fix.

UPDATE timetable_entry SET title_bn = REPLACE(title_bn, 'চন্ডী', 'চণ্ডী') WHERE title_bn LIKE '%চন্ডী%';
UPDATE timetable_entry SET day_label_bn = REPLACE(day_label_bn, 'চন্ডী', 'চণ্ডী') WHERE day_label_bn LIKE '%চন্ডী%';
UPDATE timetable_entry SET comments = REPLACE(comments, 'চন্ডী', 'চণ্ডী') WHERE comments LIKE '%চন্ডী%';
UPDATE timetable_entry SET alert_note = REPLACE(alert_note, 'চন্ডী', 'চণ্ডী') WHERE alert_note LIKE '%চন্ডী%';

UPDATE timetable_entry SET title_bn = REPLACE(title_bn, 'লক্ষী', 'লক্ষ্মী') WHERE title_bn LIKE '%লক্ষী%';
UPDATE timetable_entry SET day_label_bn = REPLACE(day_label_bn, 'লক্ষী', 'লক্ষ্মী') WHERE day_label_bn LIKE '%লক্ষী%';
UPDATE timetable_entry SET comments = REPLACE(comments, 'লক্ষী', 'লক্ষ্মী') WHERE comments LIKE '%লক্ষী%';
UPDATE timetable_entry SET alert_note = REPLACE(alert_note, 'লক্ষী', 'লক্ষ্মী') WHERE alert_note LIKE '%লক্ষী%';
