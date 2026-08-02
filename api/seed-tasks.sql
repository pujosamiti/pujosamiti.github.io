-- Durga Puja master task catalog, distilled from the samiti's 2020–2025
-- task lists, meeting minutes and volunteer sheets. Year-independent:
-- assignments/phases/checkdates live in task_year & task_assignment.
-- Apply locally:  wrangler d1 execute pujosamiti --local --file=seed-tasks.sql
-- Apply remote:   wrangler d1 execute pujosamiti --remote --file=seed-tasks.sql

INSERT OR IGNORE INTO durgapuja_task (id, category, title, details, sort_order, is_active, created_at) VALUES
-- মূর্তি / Idol
('idol-order', 'Murti / Idol', 'Idol order & advance', 'Book the sculptor, pay advance, get sarees delivered to the sculptor in time. Keep track of progress over phone or visits.', 10, 1, unixepoch()),
('idol-inspection', 'Murti / Idol', 'Idol workshop inspection', 'Visit the workshop (or track over phone) before delivery to check on the finished idol.', 20, 1, unixepoch()),
('idol-transport-in', 'Murti / Idol', 'Idol transport (baran)', 'Finalize truck + driver + ~6 labour/porters and charges for bringing the pratima to Magarpatta.', 30, 1, unixepoch()),
('idol-bisarjan', 'Murti / Idol', 'Idol bisarjan', 'Truck + labour for visarjan; find the ghat (ghats inside Pune are often closed — ask other pujo mandals).', 40, 1, unixepoch()),
-- Permissions
('magarpatta-permission', 'Permissions', 'Magarpatta City permission', 'Venue permission from Magarpatta City, including intimation about early-morning timings.', 50, 1, unixepoch()),
('police-permission', 'Permissions', 'Police permission', 'Fill the form with 7–8 organiser names + photos, attend the Hadapsar station meeting, submit 2 signed copies, track the callback.', 60, 1, unixepoch()),
('pmc-permission', 'Permissions', 'PMC permission / NOC', 'Intimation letter to the Hadapsar PMC office; print 2 copies, sign, submit.', 70, 1, unixepoch()),
('fire-extinguishers', 'Permissions', 'Fire extinguishers', 'Collect the old units, refill, place at the venue.', 80, 1, unixepoch()),
-- Purohit & Ritual
('purohit-dhaki-booking', 'Purohit & Ritual', 'Purohit + Dhaki booking', 'Book purohit and dhaki; finalize dakshina, dashakarma amounts, dhaki payment and travel arrangements.', 120, 1, unixepoch()),
('nirghanto', 'Purohit & Ritual', 'Nirghanto finalization', 'Get puja timings from the purohit; publish the schedule.', 130, 1, unixepoch()),
('fordomala', 'Purohit & Ritual', 'Fordomala finalization', 'Agree the ritual shopping list (fordomala) with the purohit; split purohit-vs-samiti items.', 140, 1, unixepoch()),
('nabapatrika', 'Purohit & Ritual', 'Nabapatrika arrangement', '৬টা কলকাতা থেকে (কালকচু, হরিদ্রা, জয়ন্তী, ডালিম, মানকচু, ধান), ৩টা পুনেতে (অশোক, বেল, শ্বেত অপরাজিতা). Usually via travelling family members; keep a fallback.', 150, 1, unixepoch()),
('kala-bou', 'Purohit & Ritual', 'Kala bou / kala gaach + peto', 'Source the banana plant and 2 peto pieces (Magarpatta nursery has closed — find another vendor).', 160, 1, unixepoch()),
('bel-pancha-pallab', 'Purohit & Ritual', 'Bel daal + pancha pallab', 'Bel branches (Narayan pujo + danto kashtho arati) and pancha pallab sets.', 170, 1, unixepoch()),
('samagri-collection', 'Purohit & Ritual', 'Collect puja samagri from members', 'Kalash, kulo, knives, chopping board etc. from member homes; return after pujo.', 180, 1, unixepoch()),
-- Procurement
('pottery', 'Procurement', 'Pottery purchase', 'Kumbharwada trip: pradeeps (108 + spares till Lakshmi Puja), ghots, kulhads, dhunochis, maatir plates.', 190, 1, unixepoch()),
('dashakarma-bulk', 'Procurement', 'Dashakarma & provisions bulk buy', 'Hadapsar wholesale market trip with volunteers; take stock of existing items first.', 200, 1, unixepoch()),
('daily-perishables', 'Procurement', 'Daily perishables procurement', 'Milk, curd, mishti, fruits, vegetables per the daily list — morning and evening runs during pujo.', 210, 1, unixepoch()),
('flowers', 'Procurement', 'Flowers', 'List, negotiate vendor, per-day order — including lotus (108+) for Sandhi Puja, bel pata, garlands, tulsi, durba.', 220, 1, unixepoch()),
('indoor-plants', 'Procurement', 'Indoor plants', 'Venue greenery from Shashthi till Dashami afternoon.', 230, 1, unixepoch()),
-- Bhog & Food
('bhog-order', 'Bhog & Food', 'Afternoon bhog order', 'Finalize member/coupon-holder headcount and place the caterer order; advance payment.', 240, 1, unixepoch()),
('bhog-menu', 'Bhog & Food', 'Bhog menu planning', 'Per-day menu — khichdi/luchi/pulao combinations for Saptami through Dashami.', 250, 1, unixepoch()),
('visitor-bhog', 'Bhog & Food', 'Visitor bhog in dona', '50–100 bowls a day for visitors; separate container from the vendor for dona distribution.', 260, 1, unixepoch()),
('sandesh-prasad', 'Bhog & Food', 'Daily sandesh prasad', 'Negotiate and order daily sandesh with the sweet shop.', 270, 1, unixepoch()),
('sandhi-luchi', 'Bhog & Food', 'Sandhi Puja luchi/sabji', 'For ~50 Sandhi Puja participants.', 280, 1, unixepoch()),
('drinking-water', 'Bhog & Food', 'Drinking water', 'Arrange from Shashthi till Dashami.', 290, 1, unixepoch()),
('snacks-stall', 'Bhog & Food', 'Paid snacks stall', 'Small paid stall through the pujo days.', 300, 1, unixepoch()),
-- Infrastructure
('pandal', 'Infrastructure', 'Pandal / mandap', 'Specs + quotations + decorator co-ordination: stage, backdrop frame, green room partition, lights, tables, chairs, carpets. Ready by Panchami/Shashthi.', 310, 1, unixepoch()),
('sound', 'Infrastructure', 'Sound system', 'Mics, speakers, stands, cabling, batteries; custody and assembly of equipment scattered across families.', 320, 1, unixepoch()),
('green-room', 'Infrastructure', 'Green room', 'Dressing/green room for the cultural programme, with ladies'' partition.', 330, 1, unixepoch()),
('videography', 'Infrastructure', 'Video recording & photography', 'Arrange recording and photography through the days.', 340, 1, unixepoch()),
-- Print & Design
('cultural-flex', 'Print & Design', 'Cultural background flex', 'Design, print, wooden framing; on the venue before Shashthi.', 350, 1, unixepoch()),
('invitation-cards', 'Print & Design', 'Invitation cards & patron invite', 'Design + print invitation cards; personally invite the local patron.', 360, 1, unixepoch()),
('bhog-coupons', 'Print & Design', 'Bhog coupon printing', 'Per-day numbered coupons, printed and cut before pujo.', 370, 1, unixepoch()),
('placards-badges', 'Print & Design', 'Placards & badges', 'Signage (Members Only, Don''t Wash Hands…) with stands; organiser badges.', 380, 1, unixepoch()),
('sponsor-banners', 'Print & Design', 'Sponsor banners', 'Sponsors'' flex banners; guideline ₹5K+ for a minimum 4''×3'' banner.', 390, 1, unixepoch()),
('pamphlets', 'Print & Design', 'Pamphlets', 'Around 100 copies for distribution.', 400, 1, unixepoch()),
-- Money
('fundraising', 'Money', 'Collection / fundraising drive', 'Target-based drive with named collectors; close before pujo starts.', 90, 1, unixepoch()),
('sponsorship-drive', 'Money', 'Sponsorship program', 'Drive item sponsorships — murti, bhog days, dhaki, flowers, ghee, fruits…', 100, 1, unixepoch()),
('accounting', 'Money', 'Accounting & audit', 'Book-keeping through the season till Saraswati Puja; present the collection/expense summary.', 110, 1, unixepoch()),
-- Events & Culture
('cultural-function', 'Events & Culture', 'Cultural function', 'Programme list, slots and pricing, ritual-aware scheduling (e.g. no start before dhunuchi naach on Ashtami).', 420, 1, unixepoch()),
('kids-competition', 'Events & Culture', 'Kids'' competition', 'Morning competitions for children.', 430, 1, unixepoch()),
('ananda-mela', 'Events & Culture', 'Ananda Mela', 'Community fair — venue/clubhouse, stalls, coordination.', 440, 1, unixepoch()),
('bijoya-sammelani', 'Events & Culture', 'Bijoya Sammelani', 'Post-pujo get-together — subject to collection; clubhouse booking and RSVP.', 450, 1, unixepoch()),
-- Ritual staffing
('ritual-volunteers', 'Ritual Staffing', 'Ritual volunteer slots', 'Per-ritual volunteer scheduling: thakur sthapona, bodhon, anjali, jharu-pocha, mandap prep, mahila attendance per ritual.', 410, 1, unixepoch());
