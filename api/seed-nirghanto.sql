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
('tt26-033', 'durga-pujo-2026', '2026-10-17', 'মহা ষষ্ঠী', 'Maha Shashthi', 'দেবী বোধন, মায়ের অধিবাস ও আমন্ত্রণ', 'Devi Bodhon, Maa''er Adhibaash O Aamontron', NULL, NULL, NULL, 33),
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
('tt26-054', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'ধুনুচি নাচ', 'Dhunuchi Naach', NULL, NULL, NULL, 54),
('tt26-055', 'durga-pujo-2026', '2026-10-19', 'মহা অষ্টমী', 'Maha Ashtami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', NULL, NULL, NULL, 55),
-- Maha Nabami
('tt26-060', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মহা নবমী পূজা', 'Maha Nabami Puja', NULL, NULL, NULL, 60),
('tt26-061', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'পুষ্পাঞ্জলি', 'Pushpanjali', NULL, NULL, NULL, 61),
('tt26-062', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মায়ের ভোগ আরতি / নিবেদন', 'Maa''er Bhog Aarati / Nibedan', NULL, NULL, NULL, 62),
('tt26-063', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'নবমী হোম / যজ্ঞ', 'Nabami Hom / Yagnya', NULL, NULL, NULL, 63),
('tt26-064', 'durga-pujo-2026', '2026-10-20', 'মহা নবমী', 'Maha Nabami', 'মায়ের শীতলি ভোগ, সন্ধ্যা আরতি', 'Maa''er Shitali Bhog O Shandhya Aarati', NULL, NULL, NULL, 64),
-- Maha Dashami
('tt26-070', 'durga-pujo-2026', '2026-10-21', 'মহা দশমী', 'Maha Dashami', 'দশমী পূজা ও দর্পণ বিসর্জন', 'Dashami Puja O Darpan Bisarjan', NULL, NULL, NULL, 70),
('tt26-071', 'durga-pujo-2026', '2026-10-21', 'মহা দশমী', 'Maha Dashami', 'সিঁদুর খেলা', 'Sindur Khela', NULL, NULL, NULL, 71),
('tt26-072', 'durga-pujo-2026', '2026-10-21', 'মহা দশমী', 'Maha Dashami', 'ঠাকুর বরণ ও বিসর্জন', 'Thakur Baran O Bisarjan', NULL, NULL, NULL, 72);
