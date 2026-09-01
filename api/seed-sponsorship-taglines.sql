-- Sponsorship appeals — one line per slot, English and Bangla.
--
-- A slot on the board is an appeal, not a line item. Three rules hold every
-- line here, and a new one has to pass all three:
--   1. Eight words at most in the English, addressed as আপনি.
--   2. NOTHING IS NAMED. No appeal names a giver, promises anyone a place at
--      a rite, or hands anyone ownership of a moment — people give here
--      selflessly and expect to be named nowhere. A line may name what the
--      giver FEELS (devotion, reverence, worship, faith) because that is
--      private and claims nothing. The seven Display Commercial banner slots
--      are the sole exception: being seen is what a business is buying there.
--   3. The register is ভক্তি, never প্রেম/ভালোবাসা, and neighbouring slots
--      vary the word so a category doesn't read as one sentence repeated.
--      Where a line names the place it is মগরপাট্টা, never a generic পাড়া.
--
-- Reviewed in bulk and applied from here — the admin item form does not write
-- these columns, so editing a slot in the app never clears its appeal.
--
-- Needs migration 0010_sponsorship-tagline.
-- Apply:  npx wrangler d1 execute pujosamiti --local --file seed-sponsorship-taglines.sql

WITH t(id, en, bn) AS (VALUES
  -- Murti
  ('murti-slot-1', 'Your devotion shapes Ma''s very form.', 'আপনার ভক্তিতেই গড়ে ওঠে মায়ের রূপ।'),
  ('murti-slot-2', 'Reverence turns clay into Ma.', 'শ্রদ্ধার ছোঁয়ায় মাটি হয়ে ওঠেন মা।'),
  ('murti-slot-3', 'Ma takes form in devout hands.', 'ভক্তের হাতেই রূপ পান মা।'),
  ('murti-slot-4', 'Let your worship light Ma''s smile.', 'আপনার আরাধনাতেই ফুটুক মায়ের হাসি।'),
  ('murti-slot-5', 'Ma''s homecoming begins with faith.', 'বিশ্বাসেই শুরু হোক মায়ের আগমন।'),
  ('lakshmi-idol', 'Welcome Lakshmi into our shared home.', 'কোজাগরীর লক্ষ্মীকে ঘরে আনুন আপনিই।'),
  -- Stage
  ('murti-moncha', 'Build the home Ma stays in.', 'শ্রদ্ধায় গড়ে উঠুক মায়ের ঘর।'),
  ('mancha-lighting', 'Light the throne where Ma sits.', 'আলোয় ভরে উঠুক মায়ের আসন।'),
  -- Transport
  ('pratima-homecoming', 'Bring Ma home this autumn.', 'এই শরতে মাকে ঘরে আনুন।'),
  ('pratima-farewell', 'See Ma off with full heart.', 'চোখের জলে মাকে বিদায় জানান।'),
  -- Bhog
  ('saptami-bhog-1', 'Saptami''s plate, full for every guest.', 'সপ্তমীতে সবার পাতে পড়ুক ভোগ।'),
  ('ashtami-bhog-1', 'Ashtami''s khichuri, enough for everyone.', 'অষ্টমীর খিচুড়ি পৌঁছে যাক সবার পাতে।'),
  ('sandhi-luchi-bhog', 'The Mahabhog of the Divine Mother.', 'শক্তি আরাধনার শ্রেষ্ঠ মহাভোগ।'),
  ('nabami-bhog-1', 'A Nabami feast remembered all year.', 'নবমীর ভোগ মনে থাকবে সারা বছর।'),
  -- Flowers & Garlands
  ('thakurer-mala', 'Let Ma wear a garland of devotion.', 'ভক্তির মালা উঠুক মায়ের গলায়।'),
  ('all-garlands', 'Garlands for every deity, with reverence.', 'সব দেবতার মালা গাঁথা হোক শ্রদ্ধায়।'),
  ('sandhi-puja-flowers', '108 bel leaves, offered in silence.', 'সন্ধিক্ষণে অর্পিত হোক ১০৮ বেলপাতা।'),
  ('padma-phul', '108 lotuses at Ma''s feet.', 'মায়ের চরণে অর্পিত হোক ১০৮ পদ্ম।'),
  -- Puja
  ('kala-bou-saree', 'Drape Nabapatrika in a new saree.', 'নবপত্রিকা সাজুক আপনার শ্রদ্ধায়।'),
  ('saptami-puja-1', 'Saptami morning, wanting for nothing.', 'সপ্তমীর সকাল হোক পরিপূর্ণ।'),
  ('saptami-puja-2', 'Let Saptami''s mantras rise unhurried.', 'সপ্তমীর মন্ত্র উঠুক নিষ্ঠাভরে।'),
  ('saptami-puja-3', 'The three days begin here.', 'এখান থেকেই শুরু তিন দিনের পুজো।'),
  ('ashtami-puja-1', 'Ashtami''s anjali, offered by every hand.', 'অষ্টমীর অঞ্জলি উঠুক সকলের হাতে।'),
  ('ashtami-puja-2', 'The biggest morning of the year.', 'বছরের সবচেয়ে বড় সকালটি হোক নিখুঁত।'),
  ('ashtami-puja-3', 'Ashtami''s sankalpa, spoken for everyone.', 'অষ্টমীর সংকল্প হোক সবার হয়ে।'),
  ('ashtami-puja-4', 'Ashtami morning asks only for devotion.', 'অষ্টমীর সকাল চায় শুধু আপনার ভক্তি।'),
  ('ashtami-puja-5', 'Flowers, dhoop, and your quiet faith.', 'ফুল, ধূপ আর আপনার নীরব ভক্তি।'),
  ('ashtami-puja-6', 'Ashtami belongs to the devout heart.', 'অষ্টমী তাঁরই, যাঁর মনে ভক্তি।'),
  ('ashtami-puja-7', 'Nothing missing when Ma is worshipped.', 'মায়ের পুজোয় যেন কিছু কম না পড়ে।'),
  ('sandhi-puja-1', 'The holiest forty-eight minutes of all.', 'বছরের সবচেয়ে পবিত্র আটচল্লিশ মিনিট।'),
  ('sandhi-puja-2', 'Where Ashtami ends, Nabami begins.', 'অষ্টমী শেষে শুরু নবমীর সন্ধিক্ষণ।'),
  ('sandhi-puja-3', 'One hundred eight lamps, lit together.', 'একসাথে জ্বলে উঠুক ১০৮ প্রদীপ।'),
  ('sandhi-puja-4', 'Sandhi''s drumbeat, heard by everyone.', 'সন্ধিপূজার ঢাক শুনুক গোটা মগরপাট্টা।'),
  ('sandhi-puja-5', 'Chandipath, unbroken through the sacred hour.', 'সন্ধিক্ষণে অবিরাম চলুক চণ্ডীপাঠ।'),
  ('sandhi-puja-6', 'The moment all Magarpatta waits for.', 'গোটা মগরপাট্টা যে মুহূর্তের অপেক্ষায়।'),
  ('sandhi-puja-7', 'The moment Ma becomes Chamunda.', 'এই মুহূর্তেই মা হন চামুণ্ডা।'),
  ('sandhi-puja-8', 'Quiet devotion, and everyone''s Sandhi Puja.', 'নীরব ভক্তিতেই সম্পন্ন হোক সবার সন্ধিপূজা।'),
  ('sandhi-puja-9', 'Let no lamp go unlit.', 'একটি প্রদীপও যেন নিভে না থাকে।'),
  ('nabami-puja-1', 'Nabami''s fire carries your devotion up.', 'নবমীর হোমাগ্নি পৌঁছে দিক আপনার ভক্তি।'),
  ('nabami-puja-2', 'One more day before She leaves.', 'মা যাওয়ার আগে আর একটি দিন।'),
  ('nabami-puja-3', 'Hold Ma one day longer.', 'আর একটা দিন মাকে ধরে রাখুন।'),
  ('dashami-puja', 'Say goodbye with sindoor and sweets.', 'সিঁদুর আর মিষ্টিতে বিদায় জানান মাকে।'),
  ('dashami-puja-2', 'Dashami''s farewell, carried by your devotion.', 'দশমীর বিদায়পর্ব হোক আপনার ভক্তিতে।'),
  ('dashami-puja-3', 'Help next year''s promise come true.', 'আসছে বছর আবার হবে — পাশে থাকুন।'),
  -- Lakshmi Puja
  ('lakshmi-pujo-bhog', 'Kojagari''s bhog under the full moon.', 'কোজাগরী পূর্ণিমার ভোগ হোক আপনার।'),
  -- Cultural
  ('cultural-external-artist', 'Bring the artist our stage deserves.', 'আমাদের মঞ্চে আনুন প্রকৃত শিল্পীকে।'),
  ('cultural-prizes', 'Every child goes home holding something.', 'প্রতিটি শিশু ফিরুক পুরস্কার হাতে নিয়ে।'),
  -- Banner Sponsor
  ('banner-sponsor-1', 'Your business, seen by every family.', 'আপনার ব্যবসা দেখুক মগরপাট্টার সব পরিবার।'),
  ('banner-sponsor-2', 'Five days in front of everyone.', 'পাঁচ দিন সবার চোখের সামনে।'),
  ('banner-sponsor-3', 'Stand with Magarpatta''s devotees this Puja.', 'এবারের পুজোয় থাকুন মগরপাট্টার ভক্তদের পাশে।'),
  ('banner-sponsor-4', 'Your name beside Ma''s pandal.', 'মায়ের মণ্ডপের পাশে থাকুক আপনার নাম।'),
  ('banner-sponsor-5', 'Magarpatta''s business, Magarpatta''s pujo, one family.', 'মগরপাট্টার ব্যবসা, মগরপাট্টার পুজো, এক পরিবার।'),
  ('banner-sponsor-6', 'Be seen where the crowd gathers.', 'ভিড় যেখানে, আপনার নামও সেখানে।'),
  ('banner-sponsor-7', 'Support the pujo, grow with it.', 'পুজোর পাশে থাকুন, একসাথে এগিয়ে চলুন।')
)
UPDATE sponsorship_item AS s SET tagline = t.en, tagline_bn = t.bn
FROM t
WHERE s.id = t.id;
