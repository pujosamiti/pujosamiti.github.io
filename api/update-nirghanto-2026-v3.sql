-- 2026 nirghanto re-timed to the purohit's handwritten v3
-- (docs/tmp/time-table/our-purohit/v3, received 29 Aug 2026).
-- v3 anchors that already matched are untouched: Sandhi 07:26-08:14,
-- Balidan/Brater Paran 07:50, Nabami Hom 08:32-09:28, Ashtami bhog 10:00.
-- Rows the purohit does not list are re-placed to fit his flow.

-- ── Panchami (15 Oct) ──────────────────────────────────────────────
UPDATE timetable_entry SET time_from='18:43',
  comments='Per purohit v3: সায়ংকালে ৬|৪৩ অমৃত যোগে দেবী বরণ.'
WHERE id='tt26-020';

-- ── Shashthi (16 Oct) ──────────────────────────────────────────────
UPDATE timetable_entry SET time_from='07:00',
  comments='Per purohit v3: মহাষষ্ঠী পূজা প্রারম্ভ সকাল ৭টায়. His কালবেলা note: 9:30 to 12:23 — the morning rites finish before it.'
WHERE id='tt26-030';
UPDATE timetable_entry SET time_from='09:00',
  comments='Per purohit v3: পুষ্পাঞ্জলী সকাল ৯টায়, before কালবেলা opens at 9:30.'
WHERE id='tt26-031';
-- v3 lists no Shashthi chandipath, so the row is dropped rather than re-timed
DELETE FROM timetable_entry WHERE id='tt26-032';

-- ── Saptami (17 Oct) — v3 runs the whole morning earlier ───────────
UPDATE timetable_entry SET time_from='06:00', time_to='08:00',
  comments='Per purohit v3: rites open ভোর ৫|৫০ মধ্যে, নবপত্রিকা স্নানে গমন সকাল ৬টায়; back before প্রবেশ at 8:05.'
WHERE id='tt26-040';
UPDATE timetable_entry SET time_from='08:05', time_to=NULL,
  comments='Per purohit v3: নবপত্রিকা প্রবেশ সকাল ৮|৫-এর পর.'
WHERE id='tt26-041';
UPDATE timetable_entry SET time_from='08:15', time_to='10:00',
  comments='Per purohit v3: মহাসপ্তমী পূজা প্রারম্ভ সকাল ৮|১৫ মিঃ মধ্যে. তিথি পরের দিন ভোর ৫|৫৩ পর্যন্ত.'
WHERE id='tt26-042';
UPDATE timetable_entry SET time_from='10:00', time_to='10:10',
  comments='Per purohit v3: সকাল ১০টায় আরতি ও ভোগ নিবেদন.'
WHERE id='tt26-043';
UPDATE timetable_entry SET time_from='10:10', time_to=NULL,
  comments='Per purohit v3: পুষ্পাঞ্জলী সকাল ১০টা ১০ মিঃ মধ্যে.'
WHERE id='tt26-044';
UPDATE timetable_entry SET time_from='11:00',
  comments='Per purohit v3: চণ্ডীপাঠ বেলা ১১টার মধ্যে.'
WHERE id='tt26-045';

-- ── Ashtami (18 Oct) ───────────────────────────────────────────────
UPDATE timetable_entry SET time_to='05:50',
  comments='Saptami tithi runs to 05:53 (v3: পরের দিন ভোর ৫|৫৩); closed at 5:50 so the Ashtami puja can begin by the purohit''s ভোর ৫|৫০ মধ্যে.'
WHERE id='tt26-180';
UPDATE timetable_entry SET time_from='05:50',
  comments='Per purohit v3: দেবীর মহাষ্টমী পূজা প্রারম্ভ ভোর ৫টা ৫০ মিঃ মধ্যে.'
WHERE id='tt26-181';
UPDATE timetable_entry SET
  comments='Per purohit v3: সকাল ১০টায় ভোগ আরতি.'
WHERE id='tt26-182';
UPDATE timetable_entry SET time_from='10:10',
  comments='Per purohit v3: পুষ্পাঞ্জলী ১০|১০ মিঃ মধ্যে.'
WHERE id='tt26-183';
UPDATE timetable_entry SET time_from='11:00',
  comments='Per purohit v3: মহাষ্টমী চণ্ডীপাঠ বেলা ১১টার মধ্যে.'
WHERE id='tt26-184';

-- ── Ashtami Adhik Diba (19 Oct) ────────────────────────────────────
UPDATE timetable_entry SET time_from='08:15', time_to='10:25',
  comments='Per purohit v3: সকাল ৮|১৫-এর পর, পূর্বাহ্ন ১০|২৫ মধ্যে মহাষ্টমী অধিক পূজা. অষ্টমী তিথি সকাল ৭|৫০ পর্যন্ত, তারপর মহানবমী আরম্ভ.'
WHERE id='tt26-193';
INSERT INTO timetable_entry (id, event_id, day_date, day_label_bn, day_label_en, title_bn, title_en, time_from, time_to, comments, sort_order, alert_note)
SELECT 'tt26-196', event_id, day_date, day_label_bn, day_label_en,
  'মায়ের ভোগ নিবেদন', 'Maa''er Bhog Nibedan', '10:00', NULL,
  'Per purohit v3: অধিক পূজার সময়ে দেবীর ভোগ নিবেদন হইবে; timed to his 10টায় bhog convention, inside the অধিক পূজা window.', 64, NULL
FROM timetable_entry WHERE id='tt26-193';
INSERT INTO timetable_entry (id, event_id, day_date, day_label_bn, day_label_en, title_bn, title_en, time_from, time_to, comments, sort_order, alert_note)
SELECT 'tt26-197', event_id, day_date, day_label_bn, day_label_en,
  'পুষ্পাঞ্জলি', 'Pushpanjali', '10:10', NULL,
  'Per purohit v3: অধিক পূজার সময়ে পুষ্পাঞ্জলী হইবে; timed to his ১০|১০ anjali convention.', 65, NULL
FROM timetable_entry WHERE id='tt26-193';
UPDATE timetable_entry SET title_en='Chandipaath', title_bn='চন্ডীপাঠ', time_from='11:00', sort_order=66,
  comments='Per purohit v3: বেলা ১১টায় চণ্ডীপাঠ.'
WHERE id='tt26-194';
UPDATE timetable_entry SET sort_order=67 WHERE id='tt26-195';

-- ── Nabami (20 Oct) — done before বারবেলা (৭|৫ – ৮|৩১), hom after it ─
UPDATE timetable_entry SET time_from='05:00', time_to='06:30',
  comments='Per purohit v3: মহানবমী পূজা প্রারম্ভ ভোর ৫টায়; ভোগ আরতি ও পুষ্পাঞ্জলী সকাল ৭|৫ মধ্যে (বারবেলা ৭|৫ হইতে ৮|৩১).'
WHERE id='tt26-060';
UPDATE timetable_entry SET time_from='06:30', time_to='06:50',
  comments='Per purohit v3: ভোগ আরতি সকাল ৭|৫ মধ্যে, before বারবেলা.'
WHERE id='tt26-061';
UPDATE timetable_entry SET time_from='06:50', time_to='07:05', sort_order=62,
  comments='Per purohit v3: পুষ্পাঞ্জলী সকাল ৭|৫ মধ্যে, before বারবেলা. নবমী তিথি সকাল ৯|৩১ পর্যন্ত.'
WHERE id='tt26-062';
UPDATE timetable_entry SET sort_order=63,
  comments='Per purohit v3: সকাল ৮|৩২ হোম (after বারবেলা ends 8:31), ৯|৩১ মধ্যে হোম সমাপন — নবমী তিথির শেষ.'
WHERE id='tt26-064';
UPDATE timetable_entry SET time_from='09:30', sort_order=64,
  comments='Not listed in purohit v3; kept right after the হোম closes.'
WHERE id='tt26-063';

-- ── Dashami (21 Oct) — v3: শুরু ৮টায়, অঞ্জলী ৯টায়, সমাপন ৯:৩০ ────────
UPDATE timetable_entry SET time_from='08:00', time_to='08:45',
  comments='Per purohit v3: মহাদশমী পূজা শুরু সকাল ৮টায়.'
WHERE id='tt26-070';
UPDATE timetable_entry SET time_from='08:45',
  comments='Not listed in purohit v3; placed between the puja and his ৯টায় অঞ্জলী.'
WHERE id='tt26-074';
UPDATE timetable_entry SET time_from='09:00',
  comments='Per purohit v3: পুষ্পাঞ্জলী ৯টায়.'
WHERE id='tt26-071';
UPDATE timetable_entry SET time_from='09:15',
  comments='Not listed in purohit v3; fitted before his পূজা সমাপন ৯:৩০ মিঃ.'
WHERE id='tt26-075';
UPDATE timetable_entry SET time_from='09:20',
  comments='Not listed in purohit v3; fitted before his পূজা সমাপন ৯:৩০ মিঃ.'
WHERE id='tt26-072';
UPDATE timetable_entry SET time_from='09:30', time_to='09:50',
  comments='Community baran after the purohit''s পূজা সমাপন (v3: ৯:৩০ মিঃ).'
WHERE id='tt26-073';
UPDATE timetable_entry SET time_from='09:50',
  comments='Follows baran, after the purohit''s পূজা সমাপন.'
WHERE id='tt26-076';
