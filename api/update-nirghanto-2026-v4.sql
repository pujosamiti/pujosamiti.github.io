-- 2026 nirghanto, 2 Oct 2026, at the samiti's word:
--  · Balidan and Brater Paran (Ashtami Adhik Diba, 19 Oct, both 07:50) come
--    off the public schedule — removed, not hidden.
--  · Saptami's Shitali Bhog O Sandhya Aarati (17 Oct) moves to 6:30–7:30 PM,
--    as on the other evenings. It had been set at 19:45–20:45, derived to
--    clear the কালরাত্রি (about 18:07–19:37 at Pune) and the afternoon কালবেলা.

DELETE FROM timetable_entry WHERE id IN ('tt26-191', 'tt26-192');

UPDATE timetable_entry SET time_from = '18:30', time_to = '19:30',
  comments = 'Set to 6:30–7:30 PM by the samiti (2 Oct 2026), as on the other evenings. Was 19:45–20:45, derived to clear the কালরাত্রি (about 18:07–19:37 at Pune) and the afternoon কালবেলা (to about 18:03).'
WHERE id = 'tt26-046';
