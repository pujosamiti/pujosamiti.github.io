-- Durga Pujo 2026 nirghanto template — day/ritual structure from the samiti's
-- 2024/2025 nirghanto documents. Times are left NULL: the purohit's timings
-- are filled in via the admin Nirghanto tab closer to pujo.
-- Apply locally:  wrangler d1 execute pujosamiti --local --file=seed-nirghanto.sql
-- Apply remote:   wrangler d1 execute pujosamiti --remote --file=seed-nirghanto.sql

INSERT OR IGNORE INTO timetable_entry (id, event_id, day_date, day_label_bn, day_label_en, title_bn, title_en, time_from, time_to, comments, sort_order) VALUES
-- Mahalaya
('tt26-010', 'durga-pujo-2026', '2026-10-10', 'মহালয়া', 'Mahalaya', 'মহালয়া তর্পণ', 'Tarpan', NULL, NULL, NULL, 10),
-- Maha Panchami
('tt26-020', 'durga-pujo-2026', '2026-10-16', 'মহা পঞ্চমী', 'Maha Panchami', 'দেবী বরণ', 'Thakur / Devi Baran', NULL, NULL, NULL, 20),
-- Maha Shashthi
('tt26-030', 'durga-pujo-2026', '2026-10-17', 'মহা ষষ্ঠী', 'Maha Shashthi', 'ষষ্ঠী পূজা', 'Shashthi Puja', NULL, NULL, NULL, 30),
('tt26-031', 'durga-pujo-2026', '2026-10-17', 'মহা ষষ্ঠী', 'Maha Shashthi', 'পুষ্পাঞ্জলি', 'Pushpanjali', NULL, NULL, NULL, 31),
('tt26-032', 'durga-pujo-2026', '2026-10-17', 'মহা ষষ্ঠী', 'Maha Shashthi', 'চন্ডীপাঠ', 'Chandipaath', NULL, NULL, NULL, 32),
('tt26-033', 'durga-pujo-2026', '2026-10-17', 'মহা ষষ্ঠী', 'Maha Shashthi', 'দেবী বোধন / অকাল বোধন, মায়ের অধিবাস ও আমন্ত্রণ', 'Devi Bodhon, Maa''er Adhibaash O Aamontron', NULL, NULL, NULL, 33),
-- Maha Saptami
('tt26-040', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'কলা বৌ স্নান', 'Kala Bou Snaan', NULL, NULL, NULL, 40),
('tt26-041', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'নবপত্রিকা প্রবেশ', 'Nabapatrika Prabesh', NULL, NULL, NULL, 41),
('tt26-042', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'মহা সপ্তমী পূজা', 'Maha Saptami Puja', NULL, NULL, NULL, 42),
('tt26-043', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'মায়ের ভোগ আরতি / নিবেদন', 'Maa''er Bhog Aarati / Nibedan', NULL, NULL, NULL, 43),
('tt26-044', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'পুষ্পাঞ্জলি', 'Pushpanjali', NULL, NULL, NULL, 44),
('tt26-045', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'চন্ডীপাঠ', 'Chandipaath', NULL, NULL, NULL, 45),
('tt26-046', 'durga-pujo-2026', '2026-10-18', 'মহা সপ্তমী', 'Maha Saptami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', NULL, NULL, NULL, 46),
-- Maha Ashtami
('tt26-050', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'মহা অষ্টমী পূজা + আরতি', 'Maha Ashtami Puja + Aarati', NULL, NULL, NULL, 50),
('tt26-051', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'মায়ের ভোগ নিবেদন', 'Maa''er Bhog Nibedan', NULL, NULL, NULL, 51),
('tt26-052', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'অষ্টমী পুষ্পাঞ্জলি', 'Ashtami Pushpanjali', NULL, NULL, NULL, 52),
('tt26-053', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'সন্ধি পূজা', 'Sandhi Puja', NULL, NULL, NULL, 53),
('tt26-054', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', NULL, NULL, NULL, 54),
-- Maha Nabami
('tt26-060', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মহা নবমী পূজা', 'Maha Nabami Puja', NULL, NULL, NULL, 60),
('tt26-061', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মায়ের ভোগ আরতি / নিবেদন', 'Maa''er Bhog Aarati / Nibedan', NULL, NULL, NULL, 61),
('tt26-062', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'পুষ্পাঞ্জলি', 'Pushpanjali', NULL, NULL, NULL, 62),
('tt26-063', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'চন্ডীপাঠ', 'Chandipaath', NULL, NULL, NULL, 63),
('tt26-064', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'নবমী হোম', 'Nabami Hom', NULL, NULL, NULL, 64),
('tt26-065', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', NULL, NULL, NULL, 65),
-- Bijaya Dashami
('tt26-070', 'durga-pujo-2026', '2026-10-21', 'বিজয়া দশমী', 'Bijaya Dashami', 'দশমী পূজা', 'Dashami Puja', NULL, NULL, NULL, 70),
('tt26-071', 'durga-pujo-2026', '2026-10-21', 'বিজয়া দশমী', 'Bijaya Dashami', 'দধিকর্মা, পুষ্পাঞ্জলি', 'Dadhikarma, Pushpanjali', NULL, NULL, NULL, 71),
('tt26-072', 'durga-pujo-2026', '2026-10-21', 'বিজয়া দশমী', 'Bijaya Dashami', 'অপরাজিতা পূজা', 'Aparajita Puja', NULL, NULL, NULL, 72),
('tt26-073', 'durga-pujo-2026', '2026-10-21', 'বিজয়া দশমী', 'Bijaya Dashami', 'বরণ / সিঁদুর খেলা', 'Baran / Sindur Khela', NULL, NULL, NULL, 73),
-- Lakshmi Puja (the nirghanto closes with Kojagari, per the samiti's format)
('tt26-080', 'durga-pujo-2026', '2026-10-25', 'লক্ষী পূজা', 'Lakshmi Puja', 'কোজাগরি লক্ষ্মী পূজা, পুষ্পাঞ্জলি', 'Kojagari Lakshmi Puja, Pushpanjali', NULL, NULL, NULL, 80);

-- Durga Pujo 2025 — the actual nirghanto (Purohit: Dilip Ghoshal / Dhruba Roy)
UPDATE event SET purohit_name = 'Dilip Ghoshal / Dhruba Roy' WHERE id = 'durga-pujo-2025' AND purohit_name IS NULL;
INSERT OR IGNORE INTO timetable_entry (id, event_id, day_date, day_label_bn, day_label_en, title_bn, title_en, time_from, time_to, comments, sort_order) VALUES
('tt25-010', 'durga-pujo-2025', '2025-09-21', 'মহালয়া', 'Mahalaya', 'মহালয়া তর্পণ', 'Tarpan', '06:00', NULL, NULL, 10),
('tt25-020', 'durga-pujo-2025', '2025-09-27', 'মহা পঞ্চমী', 'Maha Panchami', 'দেবী বরণ', 'Thakur / Devi Baran', '17:28', '18:30', NULL, 20),
('tt25-030', 'durga-pujo-2025', '2025-09-28', 'মহা ষষ্ঠী', 'Maha Shashthi', 'ষষ্ঠী পূজা', 'Shashthi Puja', '08:30', NULL, 'Shashthi ends at 10:43 AM.', 30),
('tt25-031', 'durga-pujo-2025', '2025-09-28', 'মহা ষষ্ঠী', 'Maha Shashthi', 'পুষ্পাঞ্জলি', 'Pushpanjali', '09:45', NULL, NULL, 31),
('tt25-032', 'durga-pujo-2025', '2025-09-28', 'মহা ষষ্ঠী', 'Maha Shashthi', 'চন্ডীপাঠ', 'Chandipaath', '10:30', NULL, NULL, 32),
('tt25-033', 'durga-pujo-2025', '2025-09-28', 'মহা ষষ্ঠী', 'Maha Shashthi', 'দেবী বোধন / অকাল বোধন, মায়ের অধিবাস ও আমন্ত্রণ', 'Devi Bodhon, Maa''er Adhibaash O Aamontron', '18:30', '20:00', NULL, 33),
('tt25-040', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'কলা বৌ স্নান', 'Kala Bou Snaan', '08:30', NULL, 'Kalbela upto 8:29 AM. Saptami upto 12:28 PM.', 40),
('tt25-041', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'নবপত্রিকা প্রবেশ', 'Nabapatrika Prabesh', '09:00', NULL, NULL, 41),
('tt25-042', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'মহা সপ্তমী পূজা', 'Maha Saptami Puja', '09:45', NULL, NULL, 42),
('tt25-043', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'মায়ের ভোগ আরতি / নিবেদন', 'Maa''er Bhog Aarati / Nibedan', '11:15', NULL, NULL, 43),
('tt25-044', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'পুষ্পাঞ্জলি', 'Pushpanjali', '11:30', NULL, NULL, 44),
('tt25-045', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'চন্ডীপাঠ', 'Chandipaath', '12:00', NULL, NULL, 45),
('tt25-046', 'durga-pujo-2025', '2025-09-29', 'মহা সপ্তমী', 'Maha Saptami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', '18:30', '19:30', NULL, 46),
('tt25-050', 'durga-pujo-2025', '2025-09-30', 'মহা অষ্টমী', 'Maha Ashtami', 'মহা অষ্টমী পূজা + আরতি', 'Maha Ashtami Puja + Aarati', '08:30', NULL, 'Ashtami upto 1:45 PM.', 50),
('tt25-051', 'durga-pujo-2025', '2025-09-30', 'মহা অষ্টমী', 'Maha Ashtami', 'মায়ের ভোগ নিবেদন', 'Maa''er Bhog Nibedan', '10:00', NULL, NULL, 51),
('tt25-052', 'durga-pujo-2025', '2025-09-30', 'মহা অষ্টমী', 'Maha Ashtami', 'অষ্টমী পুষ্পাঞ্জলি', 'Ashtami Pushpanjali', '10:15', '11:15', NULL, 52),
('tt25-053', 'durga-pujo-2025', '2025-09-30', 'মহা অষ্টমী', 'Maha Ashtami', 'সন্ধি পূজা', 'Sandhi Puja', '13:21', '14:09', NULL, 53),
('tt25-054', 'durga-pujo-2025', '2025-09-30', 'মহা অষ্টমী', 'Maha Ashtami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', '18:30', '19:30', NULL, 54),
('tt25-060', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'মহা নবমী পূজা', 'Maha Nabami Puja', '08:00', NULL, 'Nabami upto 2:36 PM.', 60),
('tt25-061', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'মায়ের ভোগ আরতি / নিবেদন', 'Maa''er Bhog Aarati / Nibedan', '10:15', NULL, NULL, 61),
('tt25-062', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'পুষ্পাঞ্জলি', 'Pushpanjali', '10:30', NULL, NULL, 62),
('tt25-063', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'চন্ডীপাঠ', 'Chandipaath', '11:30', NULL, NULL, 63),
('tt25-064', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'নবমী হোম', 'Nabami Hom', '13:00', NULL, NULL, 64),
('tt25-065', 'durga-pujo-2025', '2025-10-01', 'মহা নবমী', 'Maha Nabami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', '18:30', '19:30', NULL, 65),
('tt25-070', 'durga-pujo-2025', '2025-10-02', 'বিজয়া দশমী', 'Bijaya Dashami', 'দশমী পূজা', 'Dashami Puja', '08:00', NULL, NULL, 70),
('tt25-071', 'durga-pujo-2025', '2025-10-02', 'বিজয়া দশমী', 'Bijaya Dashami', 'দধিকর্মা, পুষ্পাঞ্জলি', 'Dadhikarma, Pushpanjali', '08:45', NULL, NULL, 71),
('tt25-072', 'durga-pujo-2025', '2025-10-02', 'বিজয়া দশমী', 'Bijaya Dashami', 'অপরাজিতা পূজা', 'Aparajita Puja', '09:15', NULL, NULL, 72),
('tt25-073', 'durga-pujo-2025', '2025-10-02', 'বিজয়া দশমী', 'Bijaya Dashami', 'বরণ / সিঁদুর খেলা', 'Baran / Sindur Khela', '10:45', NULL, NULL, 73),
('tt25-080', 'durga-pujo-2025', '2025-10-06', 'লক্ষী পূজা', 'Lakshmi Puja', 'কোজাগরি লক্ষ্মী পূজা, পুষ্পাঞ্জলি', 'Kojagari Lakshmi Puja, Pushpanjali', NULL, NULL, NULL, 80);
