-- Uma · সংখ্যা ১ — the AI-written debut issue.
-- Idempotent: wipes any earlier uma1-*/demo-* rows and sankhya-1, then reseeds.
-- Articles land as ACCEPTED into a DRAFT sankhya — the chief editor reviews and publishes from the desk.
DELETE FROM uma_article WHERE id LIKE 'uma1-%' OR id LIKE 'demo-%';
DELETE FROM uma_issue WHERE id = 'sankhya-1';
INSERT INTO uma_issue (id, number, title, status, editorial_note, created_at)
VALUES ('sankhya-1', 1, 'প্রথম সংখ্যা', 'draft', 'উমার প্রথম সংখ্যায় স্বাগতম।

বাঙালি কেবল উৎসব করে না; উৎসবকে লিখে রাখে — গল্পে, কবিতায়, রান্নার স্বাদে, ভ্রমণের খাতায়, ছবির রেখায়। পুনে থেকে বাংলার নদী, মাঠ, মফস্‌সলের গলি কিংবা গ্রামের উঠোন মানচিত্রে দূরে; স্মৃতিতে নয়। সেই স্মৃতি আর আমাদের আজকের জীবনকে একই পাতায় পাশাপাশি বসানোর ছোট্ট প্রয়াস **উমা**।

এই সংখ্যার গল্প, শিল্প, কবিতা, ভ্রমণ, রান্না, স্বাস্থ্য, পুরাণ ও সমকালে তাই চেনা পৃথিবীকে একটু নতুন করে দেখার চেষ্টা রয়েছে। কোনও লেখা পড়ে যদি মনে পড়ে যায় আপনার দেখা কোনও মানুষ, হারিয়ে যাওয়া সকাল, পারিবারিক রান্না, প্রিয় ভ্রমণ কিংবা বহুদিন ধরে মনে জমে থাকা কোনও প্রশ্ন — লিখে ফেলুন।

নিখুঁত ভাষার জন্য অপেক্ষা করবেন না। অভিজ্ঞতা ও কণ্ঠস্বরটি আপনার হওয়াই যথেষ্ট; প্রয়োজন হলে সম্পাদনার দায়িত্ব আমরা নেব। গল্প, কবিতা, স্মৃতিকথা, প্রবন্ধ, রেসিপি, ভ্রমণকাহিনি বা ছবি — WhatsApp-এ পাঠিয়ে দিন সম্পাদকদের।

**উমার হাতেখড়ি হল। এবার তার পাতায় পাতায় থাকুন আপনারা।**

---

Welcome to the first issue of **Uma**.

Bengalis do not merely celebrate a season; we preserve it — in stories and poems, in recipes, travel journals and lines drawn upon a page. From Pune, Bengal''s rivers, fields, small-town lanes and village courtyards may be distant on the map, but never in memory. **Uma** is our modest attempt to bring those memories into conversation with the lives we live today.

Across stories, art, poetry, travel, food, health, mythology and current affairs, this issue tries to look again at a world we thought we knew. If something here brings back a person, a lost morning, a family recipe, a memorable journey or a question you have carried for years, write it down.

Do not wait for perfect prose. What matters is that the experience and the voice are yours; the editors can help shape the rest. Send us your stories, poems, memoirs, essays, recipes, travel notes or photographs on WhatsApp.

**Uma has traced its first letters. Now its pages are yours.**', strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-kurseong', 'kurseong', 'travel', 'Kurseong at the Breakfast Table', 'কার্শিয়াং: সকালের টেবিলে পাহাড়',
  'Shailesh Maitra', 'শৈলেশ মৈত্র', NULL, 1,
  'রোহিণীর বাঁক, চা-বাগানের ঢাল, টয় ট্রেনের রেল — শেষে এমন একটি জানলার ধারে প্রাতরাশ, যেখানে গোটা কার্শিয়াং এসে বসে।', '*রোহিণীর বাঁক, চা-বাগানের ঢাল, টয় ট্রেনের রেল — শেষে এমন একটি জানলার ধারে প্রাতরাশ, যেখানে গোটা কার্শিয়াং এসে বসে।*

শিলিগুড়ি ছাড়লেই পাহাড় শুরু হয় না। প্রথমে রাস্তার স্বভাব বদলায়।

সমতলের সোজা পথটি রোহিণীর দিকে উঠে গিয়ে বাঁক নিতে শেখে। শালের ছায়া গাড়ির কাচে এসে পড়ে, চা-বাগানের সারিগুলি পাহাড়ের গায়ে সবুজ হাতের লেখার মতো ফুটে ওঠে। কোনও বাঁকে নীচের সমতল হঠাৎ মানচিত্রের মতো খুলে যায়; পরের বাঁকেই মেঘ এসে সব মুছে দেয়।

শৈশবের পাহাড়যাত্রায় এইখানেই বড়রা বলতেন, "জানলাটা খোল — পাহাড়ের গন্ধ পাবি।" গন্ধটি ঠিক কিসের — ভেজা পাতা, মাটি না দূরের চায়ের কারখানা — কখনও বোঝা যায়নি। শুধু মনে হত, ছুটি সত্যিই শুরু হয়েছে।

কার্শিয়াংয়ের কাছে এসে রাস্তার পাশে দেখা দেয় সরু রেললাইন। কখনও দোকানের সামনে দিয়ে, কখনও বাড়ির দরজা ঘেঁষে চলে যাওয়া দার্জিলিং হিমালয়ান রেলওয়ের পথ। এখানে শহর, রাস্তা আর রেলের মধ্যে কোনও স্পষ্ট সীমানা নেই; যেন দীর্ঘদিন পাশাপাশি থাকতে থাকতে তারা একে অন্যকে একটু জায়গা ছেড়ে দিয়েছে।

এই রেলপথ অনুসরণ করেই পৌঁছনো যায় স্টেশনের কাছের **Cafe Kurseong Diaries**-এ। গল্পটির শুরু আরও আগে — ১৯৭৬ সালে, এই এলাকাতেই চালু হওয়া অমরজিৎ রেস্তোরাঁ দিয়ে। পরের প্রজন্ম সেই পারিবারিক স্মৃতিকে ক্যাফে ও বেকারিতে এগিয়ে নিয়ে গেছে।

ভিতরে ঢুকে প্রথম সিদ্ধান্ত খাবার নয় — কোন টেবিল।

জানলার ধারের টেবিলটি পেলে নীচে স্টেশন, বাজারের ছাদ আর তারও পরে নেমে যাওয়া উপত্যকা দেখা যায়। এক মুহূর্তে রোদ; পরের মুহূর্তে কাচের ওপারে শুধু সাদা মেঘ। শহরের আবহাওয়া যেন প্রাতরাশের সঙ্গে নিজের দৃশ্যও পরিবেশন করে।

সকালের মেনুতে ডিম, পাউরুটি, প্যানকেক কিংবা বেকারির পেস্ট্রি থাকতে পারে। কিন্তু স্থানীয় স্বাদ চাইলে সেদিন কী পাওয়া যাচ্ছে জিজ্ঞেস করুন। ক্যাফে নিজেই তার বিশেষ খাবারের মধ্যে **Badi ko Aloo Dum** এবং **Nanas Momos**-এর কথা বলে — স্থানীয় বাজারের উপকরণে তৈরি পারিবারিক স্বাদের পদ। পাহাড়ে মেনুও মেঘের মতো; ঋতু ও রান্নাঘর অনুযায়ী বদলাতে পারে।

এক পাত্র দার্জিলিং চা এসে গেলে তাড়াহুড়ো করবেন না। প্রথম চুমুকের আগে কাপটি একটু ঠান্ডা হতে দিন। অতিরিক্ত গরম চায়ে শুধু তাপ বোঝা যায়; উষ্ণ হলে পাতার গন্ধ ও স্বাদ স্পষ্ট হয়।

ঠিক তখনই নীচে হুইসল শোনা গেল।

মেঘের ভিতর থেকে টয় ট্রেনটি বেরিয়ে বাজারের পাশ দিয়ে ধীরে এগিয়ে গেল। দোকানদার এক পা পিছোলেন, পথচারী দাঁড়ালেন, তারপর ট্রেনটি চলে যেতেই শহর আবার নিজের কাজে ফিরে গেল।

কার্শিয়াংকে বোঝার জন্য সারাদিন দর্শনীয় স্থান টিক দিয়ে যাওয়া জরুরি নয়। কখনও একটি জানলা, ধোঁয়া-ওঠা চায়ের কাপ আর রেললাইনের ওপারে নেমে যাওয়া পাহাড়ই যথেষ্ট।

কিছু শহর ঘুরে দেখতে হয়। কার্শিয়াংকে এক সকাল বসে দেখতে হয়।', '*Rohini''s bends, slopes written with tea bushes and the toy-train railway — all leading to a breakfast window where Kurseong comes to the table.*

The mountains do not begin the moment Siliguri ends. First, the road changes its habits.

The straight lines of the plains begin to bend as the climb towards Rohini gathers height. Shadows of sal trees pass across the windows. Rows of tea bushes appear on the slopes like green handwriting. Around one corner, the plains open below like a map; at the next, a bank of cloud erases them.

During childhood journeys to the hills, this was where an elder would say, "Open the window — you''ll smell the mountains." No one could identify that smell precisely. Wet leaves, perhaps, or earth, or a distant tea factory. It simply meant that the holiday had begun.

Near Kurseong, the narrow railway appears beside the road. The track of the Darjeeling Himalayan Railway passes shopfronts and house doors with astonishing intimacy. Here, town, road and railway possess no firm boundaries; after living together for generations, each seems to have learnt how much room the others require.

Follow those rails towards the station and you reach **Cafe Kurseong Diaries**. Its story began nearby in 1976 with Amarjeet Restaurant. Later generations carried that family enterprise into the present cafe and bakery.

Inside, the first decision is not what to eat. It is where to sit.

From a window table, you can look across the station, the market roofs and the valley falling away beyond them. There may be sunlight when you order and nothing but white mist beyond the glass when breakfast arrives. Kurseong serves its weather alongside the meal.

The morning menu may bring eggs, bread, pancakes or something from the adjoining bakery. For a more local flavour, ask what the kitchen has that day. The cafe highlights **Badi ko Aloo Dum** and **Nanas Momos** among its house specialities — family-rooted dishes prepared with ingredients from local markets. In the hills, menus can change almost as readily as clouds.

When the pot of Darjeeling tea arrives, allow the cup to cool slightly before the first sip. Tea that is fiercely hot reveals little beyond heat; as it becomes warm, its aroma and finer flavours emerge.

That was when a whistle sounded below.

The toy train appeared through the mist and moved slowly past the market. A shopkeeper stepped back. Pedestrians waited. Once the final carriage had passed, the town quietly resumed its morning.

You need not spend a day ticking off viewpoints to understand Kurseong. Sometimes a window, a cup of tea and a railway disappearing around the mountain are enough.

Some towns must be toured. Kurseong should be watched over breakfast.', '/uma-media/kurseong.webp', 'bn', 'accepted', 'sankhya-1', 7, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-shillong', 'shillong', 'travel', 'Shillong: Pines, Rain and Rock ’n’ Roll', 'শিলং: পাইন, বৃষ্টি আর রক ’এন’ রোল',
  'Shailesh Maitra', 'শৈলেশ মৈত্র', NULL, 1,
  'The road climbs past Umiam into a rain-washed city where music is not arranged for tourists — it has been living in the neighbourhood for generations.', '*The road climbs past Umiam into a rain-washed city where music is not arranged for tourists — it has been living in the neighbourhood for generations.*

The road from Guwahati begins with heat, traffic and the flat certainty of the plains. Beyond Nongpoh, it starts to climb. Ferns crowd the cut slopes, clouds lower themselves towards the windscreen, and rain arrives without consulting the forecast.

Then, around a bend on National Highway 6, **Umiam** opens below.

It looks ancient enough to have been left there by the mountains. In fact, it is a reservoir created in the early 1960s when the Umiam River was dammed for hydropower. Time has softened the engineering into landscape: wooded islands, long inlets and water turning from blue to pewter beneath the clouds.

Fifteen kilometres later, Shillong begins in pine-covered slopes, churches, school walls and tin roofs still ticking with rain.

Do not spend the evening working through a list of viewpoints. Instead, follow the wet roads towards Dhankheti and climb the vinyl-lined staircase to **Dylan''s Café** — North-East India''s first Bob Dylan tribute café.

Posters cover the walls. Dylan''s face appears on cushions and record sleeves. Above, the ceiling is a patchwork of hand-painted square tiles. Visitors are invited to paint their own tribute; once finished, the tile joins the growing collage overhead. The room has become an album assembled by strangers.

The café is not merely borrowing a famous musician''s name. Shillong''s relationship with Dylan goes back to **24 May 1972**, when local musician Lou Majaw organised the city''s first concert celebrating Dylan''s birthday. He has sustained that annual tradition for more than five decades, turning one musician''s admiration into part of Shillong''s cultural calendar.

On announced music evenings, the café hosts intimate acoustic sessions — Dylan standards alongside songs rooted closer to home. The significant thing is not that Shillong listens to Western music. Many cities do. It is the ease with which church harmonies, Khasi musical traditions, blues, folk and rock occupy the same neighbourhood.

Order coffee, pancakes or the appropriately named Bob''s Burger if it remains on the day''s menu. Then look around. Someone near the window may know every lyric. At another table, a student may be tapping out the chords on an invisible guitar.

Outside, rain polishes the road. A taxi passes with music leaking through its closed windows.

Check the café''s programme before going; live performances are held on selected evenings, not necessarily every night. Shillong''s music is generous, but it does not exist on demand for travellers.

Some cities give you attractions to photograph. Shillong gives you a song, then lets the rain change its key.', '*উমিয়াম পেরিয়ে রাস্তা উঠে যায় বৃষ্টিভেজা এক শহরে — যেখানে পর্যটকদের জন্য গান সাজিয়ে রাখা হয়নি; বহু প্রজন্ম ধরে গান পাড়ায় পাড়ায় বাস করে।*

গুয়াহাটি ছাড়ার সময় রাস্তায় সমতলের গরম, যানজট আর একটানা ছুটে চলার নিশ্চয়তা। নংপো পেরিয়ে পথটি উঠতে শুরু করে। কাটা পাহাড়ের গায়ে ফার্নের ভিড়, মেঘ নেমে আসে গাড়ির কাচের কাছে, আর আবহাওয়ার খবরকে না জানিয়েই বৃষ্টি শুরু হয়।

তারপর জাতীয় সড়ক ৬-এর একটি বাঁক ঘুরতেই নীচে খুলে যায় **উমিয়াম**।

দেখে মনে হয় পাহাড়ের জন্ম থেকেই বুঝি জলটি সেখানে ছিল। আসলে এটি একটি জলাধার — জলবিদ্যুৎ প্রকল্পের জন্য ষাটের দশকের গোড়ায় উমিয়াম নদীতে বাঁধ দেওয়ার ফলে তৈরি। সময় মানুষের প্রকৌশলকে প্রকৃতির ভিতর মিশিয়ে দিয়েছে; এখন সেখানে জঙ্গল-ঢাকা দ্বীপ, পাহাড়ের ফাঁকে ঢুকে যাওয়া দীর্ঘ জলরেখা আর মেঘের নীচে নীল থেকে ধূসর হয়ে আসা জল।

আরও প্রায় পনেরো কিলোমিটার পরে শুরু হয় শিলং — পাইন-ঢাকা ঢাল, গির্জা, স্কুলের পাঁচিল আর সদ্য থামা বৃষ্টিতে টুপটাপ শব্দ-করা টিনের ছাদ।

সন্ধ্যাটা দর্শনীয় স্থানের তালিকা মিলিয়ে নষ্ট না করে ভেজা রাস্তা ধরে ধানখেতির দিকে যান। রেকর্ডে সাজানো সিঁড়ি বেয়ে উঠে পড়ুন **Dylan''s Café**-তে — উত্তর-পূর্ব ভারতের প্রথম বব ডিলান ট্রিবিউট ক্যাফে।

দেওয়ালজুড়ে পোস্টার, রেকর্ডের মলাট আর ডিলানের মুখ। মাথার উপরে রঙিন বর্গাকার টাইলসে তৈরি অদ্ভুত এক ছাদ। অতিথিরা নিজেদের মতো একটি টাইল এঁকে রেখে যেতে পারেন; পরে সেটি অন্য অচেনা মানুষের আঁকার পাশে জায়গা পায়। গোটা ঘরটি যেন বহু পথিকের হাতে বানানো একটি অ্যালবাম।

ক্যাফেটি শুধু বিখ্যাত এক গায়কের নাম ধার করেনি। ডিলানের সঙ্গে শিলংয়ের সম্পর্ক শুরু **১৯৭২ সালের ২৪ মে**, যেদিন শহরের সংগীতশিল্পী লু মাজাও প্রথমবার বব ডিলানের জন্মদিন উপলক্ষে অনুষ্ঠান করেছিলেন। পাঁচ দশকেরও বেশি সময় ধরে তিনি সেই বার্ষিক ঐতিহ্য চালিয়ে গিয়েছেন। এক শিল্পীর ব্যক্তিগত ভালবাসা ধীরে ধীরে শহরের সাংস্কৃতিক স্মৃতির অংশ হয়ে উঠেছে।

ঘোষিত সংগীতসন্ধ্যাগুলিতে এখানে ছোট পরিসরে অ্যাকুস্টিক অনুষ্ঠান হয় — ডিলানের গান, সঙ্গে শিলংয়ের নিজস্ব সুর। বিস্ময়টি পাশ্চাত্য গান শোনায় নয়; বরং গির্জার কোরাস, খাসি সংগীতের শিকড়, ব্লুজ, ফোক আর রক — সবকিছু একই পাড়ায় কত সহজে পাশাপাশি থাকে, তাতে।

কফি, প্যানকেক কিংবা সেদিনের মেনুতে থাকলে মজার নামের **Bob''s Burger** অর্ডার করতে পারেন। তারপর ঘরটিকে একটু লক্ষ করুন। জানলার পাশের কেউ হয়তো প্রতিটি গানের কথা জানেন। অন্য টেবিলের এক ছাত্র আঙুল দিয়ে অদৃশ্য গিটারের কর্ড ধরছে।

বাইরে আবার বৃষ্টি নেমেছে। ভেজা রাস্তা দিয়ে একটি ট্যাক্সি চলে গেল — বন্ধ কাচের ভিতর থেকেও গান শোনা যাচ্ছে।

যাওয়ার আগে ক্যাফের অনুষ্ঠানের সূচি দেখে নেবেন; প্রতি সন্ধ্যায় লাইভ অনুষ্ঠান হয় না। শিলংয়ের গান উদার, কিন্তু পর্যটকের চাহিদামতো মঞ্চে ওঠে না।

কিছু শহর ছবি তোলার মতো দৃশ্য দেয়। শিলং একটি গান দেয় — তারপর বৃষ্টি এসে তার স্কেল বদলে দেয়।', '/uma-media/shillong.webp', 'en', 'accepted', 'sankhya-1', 8, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-shukto', 'shukto', 'recipes', 'Shukto', 'শুক্তো',
  'Aparna Basu', 'অপর্ণা বসু', 'Writer on food, memory and the regional flavours of Bengal', 'খাদ্য, স্মৃতি ও বাংলার আঞ্চলিক স্বাদ নিয়ে লেখেন', 1,
  'তেতো নয় — তেতো, মিষ্টি ও মোলায়েম স্বাদের নিখুঁত ভারসাম্য। সাবেকি ঘরানার দুধ-পোস্ত শুক্তোর নিখুঁত রেসিপি।', '*তেতো নয় — তেতো, মিষ্টি ও মোলায়েম স্বাদের নিখুঁত ভারসাম্য।*

ভাতের হাঁড়ির ঢাকনা সবে খোলা হয়েছে। বাংলার নিস্তব্ধ দুপুরে মাথার উপর ঘুরছে পাখা, আর কাঁসার থালার পাশে অপেক্ষা করছে ফ্যাকাশে শুক্তোর বাটি। বহু বাঙালির কাছে ওই গন্ধটুকুর ভিতরেই লুকিয়ে থাকে একটি গোটা হারিয়ে যাওয়া সংসার: ঠাকুমার রান্নাঘর, হাতার শব্দ, রোদ নরম হওয়ার আগেই সেরে ফেলা দুপুরের খাওয়া।

ভালো শুক্তো ধাপে ধাপে খোলে। প্রথমে আসে মৃদু তেতো, তারপর দুধ ও পোস্তর কোমলতা, শেষে রাঁধুনির গন্ধমাখা সংযত মিষ্টি। এ নিছক তেতো তরকারি নয়; এ ভারসাম্যের অনুশীলন।

"আসল শুক্তো" বলে একটিমাত্র রেসিপি নেই। কোনও বাড়িতে পাঁচফোড়ন, কোথাও শুধু রাঁধুনি। এক রান্নাঘরে সর্ষে ঢোকে, পরের বাড়িতে ঢোকে না; কোনও শুক্তো হালকা হলদেটে, কোনওটি প্রায় হাতির দাঁতের মতো সাদা। এখানে দেওয়া হল **রাঁধুনি, পোস্ত, সামান্য হলুদ সর্ষে ও দুধ দিয়ে তৈরি সাবেকি ফ্যাকাশে শুক্তোর** রেসিপি — মৃদু, মোলায়েম এবং ইচ্ছে করেই লঙ্কাবিহীন।

## যে কৌশলটি আসল

শুরু থেকে সব সবজি একসঙ্গে রান্না করবেন না। আলু আর পেঁপে নরম হতে হতে বেগুন গলে যাবে। আর উচ্ছে যদি গোড়া থেকেই ঝোলে বসে থাকে, তেতোর মাত্রা নিয়ন্ত্রণ করা কঠিন হয়ে পড়ে।

বরং:

1. শক্ত সবজিগুলি আগে আধসেদ্ধ করে নিন।
2. উচ্ছে, কাঁচকলা ও বেগুন আলাদা করে ভেজে নিন।
3. দুধ দিন একেবারে শেষে, খুব কম আঁচে।

এতে প্রতিটি সবজি নিজের চেহারা ধরে রাখে, অথচ স্বাদগুলি ঝোলের ভিতরে এসে মেলে।

## এক নজরে

* পরিমাণ: ৬ জন
* প্রস্তুতি: ৩৫ মিনিট
* রান্না: ৩৫–৪০ মিনিট
* বিশ্রাম: ১০ মিনিট
* চরিত্র: মৃদু তেতো, সামান্য মিষ্টি, মোলায়েম অথচ হালকা
* পরিবেশন: ভাতের পাতে শুরুর দিকে, গরম সাদা ভাতের সঙ্গে

## সবজি

* উচ্ছে — ৬০ গ্রাম, বা ১টি মাঝারি
* আলু — ১৩০ গ্রাম, বা ১টি মাঝারি
* রাঙা আলু — ১২০ গ্রাম
* কাঁচকলা — ১৫০ গ্রাম, বা ১টি মাঝারি
* কাঁচা পেঁপে — ১৬০ গ্রাম
* বেগুন — ১২০ গ্রাম
* শিম — ১০০ গ্রাম, প্রায় ৬–৮টি
* সজনে ডাঁটা — ১৫০ গ্রাম, প্রায় ২টি
* কলাইয়ের বড়ি — ১০–১২টি

তালিকা ছোট করতে হলে রাঙা আলু বা শিম বাদ দিতে পারেন। উচ্ছে, কাঁচকলা, পেঁপে ও সজনে ডাঁটা রাখলে পদটির নিজস্ব চরিত্র বজায় থাকবে।

## বাটা ও মশলা

* পোস্ত — ২ টেবিল চামচ, প্রায় ২৫ গ্রাম
* সাদা বা হলুদ সর্ষে — ১ টেবিল চামচ, প্রায় ১২ গ্রাম
* আদা বাটা — ১ টেবিল চামচ, ভরা
* রাঁধুনি — ¾ চা চামচ, দুই ভাগে
* তেজপাতা — ২টি
* নুন — প্রায় ২½ চা চামচ, পরে স্বাদমতো
* চিনি — ২ চা চামচ; প্রয়োজনে আরও ১ চা চামচ
* সর্ষের তেল — ৪–৫ টেবিল চামচ
* ঘি — ২ চা চামচ

## ঝোলের জন্য

* ফুল-ফ্যাট দুধ — ২৫০ মিলিলিটার, ঘরের তাপমাত্রায়
* চালের গুঁড়ো বা ময়দা — ১ চা চামচ
* জল — প্রায় ৭০০ মিলিলিটার

এই সংস্করণে হলুদ, লঙ্কা, জিরে বা গরমমশলা নেই। এর বৈশিষ্ট্যই তার ফ্যাকাশে রং আর চাপা সুবাস।

## বাটা ও সবজি তৈরি

পোস্ত ও সর্ষে আলাদা বাটিতে ২০ মিনিট ভিজিয়ে রাখুন। পোস্ত অল্প জল দিয়ে মিহি করে বেটে নিন।

সর্ষে ¼ চা চামচ নুন ও ঠান্ডা জল দিয়ে বাটুন। অকারণে বেশিক্ষণ বা শুকনো অবস্থায় পিষবেন না; তাতে বাটা কটু তেতো হয়ে যেতে পারে। ঝোল একেবারে মসৃণ চাইলে সর্ষে বাটা সামান্য জলে গুলে মিহি ছাঁকনিতে ছেঁকে নিন।

সবজিগুলি কাছাকাছি মাপে কাটুন:

* আলু, রাঙা আলু, কাঁচকলা ও পেঁপে: প্রায় ৫ সেন্টিমিটার লম্বা, দেড় সেন্টিমিটার মোটা টুকরো
* বেগুন: একই দৈর্ঘ্যে, সামান্য মোটা
* সজনে ডাঁটা: শক্ত আঁশ ছাড়িয়ে ৫ সেন্টিমিটার টুকরো
* শিম: দু''পাশের সুতো তুলে আড়াআড়ি অর্ধেক
* উচ্ছে: লম্বালম্বি অর্ধেক করে ৫ মিলিমিটার পুরু স্লাইস

কাটা কাঁচকলা রং কালো হওয়া আটকাতে নুন-জলে রাখুন; ভাজার আগে জল ঝরিয়ে ভালো করে শুকিয়ে নিন।

## ধাপ ১: শক্ত সবজি আধসেদ্ধ করা

৭০০ মিলিলিটার জল ও ১ চা চামচ নুন ফুটতে দিন।

প্রথমে পেঁপে ও সজনে ডাঁটা দিন। ৩ মিনিট পরে আলু ও রাঙা আলু দিন। আরও ৫ মিনিট পরে শিম দিয়ে ২ মিনিট রান্না করুন।

সবজি প্রায় ৭০ শতাংশ সেদ্ধ হবে: ছুরির ডগা ঢুকবে, কিন্তু মাঝখানে সামান্য বাধা থাকবে। সবজি তুলে নিন এবং **সেদ্ধ করার জল পুরোটা রেখে দিন** — এই জলেই পরে ঝোল হবে।

## ধাপ ২: আলাদা করে ভাজা

সর্ষের তেল ধোঁয়া ওঠার মুখে গরম করে আঁচ মাঝারি করুন।

প্রথমে বড়ি ৩০–৪৫ সেকেন্ড সোনালি করে ভেজে সঙ্গে সঙ্গে তুলে ফেলুন; বড়ি খুব দ্রুত পুড়ে যায়।

এবার সবজি আলাদা আলাদা ভাজুন:

* উচ্ছে: ৩–৪ মিনিট, কিনারা হালকা বাদামি হওয়া পর্যন্ত
* কাঁচকলা: ৩–৪ মিনিট, বাইরেটা শক্ত হওয়া পর্যন্ত
* বেগুন: ২–৩ মিনিট, সামান্য রং ধরা পর্যন্ত

প্রতিটি ব্যাচ তুলে নিয়ে তবেই পরেরটি দিন।

উচ্ছে আলাদা ভাজলে তার তেতো চলে যায় না। কাঁচা ঝাঁঝটুকু নরম হয়, আর ঠিক কতটা তেতো শেষ ঝোলে ঢুকবে, তা রাঁধুনির হাতে থাকে।

## ধাপ ৩: স্বাদের ভিত গড়া

কড়াইয়ে প্রায় ২ টেবিল চামচ তেল রাখুন। আঁচ কমিয়ে তেজপাতা ও ½ চা চামচ রাঁধুনি দিন।

রাঁধুনি কয়েক সেকেন্ডেই গন্ধ ছাড়ে এবং সহজে পুড়ে যায়। দানা কালো হওয়ার আগেই আদা বাটা দিন। ৩০–৪০ সেকেন্ড নাড়ুন।

সংরক্ষিত সবজি-সেদ্ধ জলের ছিটে দিয়ে পোস্ত বাটা দিন। কম আঁচে ১ মিনিট রান্না করে ছেঁকে রাখা সর্ষে বাটা দিন। আরও ১–২ মিনিট নাড়ুন।

মিশ্রণটি বাদামি করবেন না, শুকিয়েও ফেলবেন না। বেশি রান্না হলে সর্ষে কটু হয়ে যায়, আর শুকনো পোস্ত বাটা ঝোলকে মোলায়েম না করে ভারী করে তোলে।

## ধাপ ৪: সবজি মিলিয়ে দেওয়া

আধসেদ্ধ আলু, রাঙা আলু, পেঁপে, সজনে ডাঁটা ও শিম দিন, তারপর ভাজা কাঁচকলা। ২ মিনিট ধরে আলতো হাতে বাটার সঙ্গে মিশিয়ে নিন।

সংরক্ষিত জল থেকে ৪৫০ মিলিলিটার ঢালুন। ১ চা চামচ নুন ও ২ চা চামচ চিনি দিন। ঢাকা দিয়ে মাঝারি-কম আঁচে ৫ মিনিট রান্না করুন।

এবার ভাজা বেগুন ও উচ্ছে দিন। জোরে নাড়ার বদলে কড়াইয়ের হাতল ধরে আলতো করে দুলিয়ে মেশান। আরও ৩ মিনিট রান্না করুন।

## ধাপ ৫: দুধ দেওয়ার সঠিক নিয়ম

ঘরের তাপমাত্রার দুধে চালের গুঁড়ো বা ময়দা মিশিয়ে একেবারে মসৃণ করে নিন।

কড়াই থেকে এক হাতা গরম ঝোল তুলে ধীরে ধীরে দুধে মেশান। এতে কড়াইয়ে পড়ার আগেই দুধের তাপমাত্রা বেড়ে যায়।

আঁচ একেবারে কমিয়ে দুধের মিশ্রণটি ঢেলে দিন। ঝোলে শুধু ছোট ছোট বুদবুদ কাঁপবে; জোরে ফুটবে না। ঢাকা না দিয়ে ৩–৪ মিনিট রান্না করুন।

ঝোল বেশি ঘন লাগলে সংরক্ষিত জল আরও দিন। তৈরি শুক্তোর ঝোল হালকা হবে, সবজির গায়ে পাতলা আস্তরণ রেখে যাবে।

## শেষ পরশ ও বিশ্রাম

ভাজা বড়ি দিন। নরম পছন্দ হলে ২ মিনিট ফোটান; একটু মুচমুচে রাখতে চাইলে পরিবেশনের ঠিক আগে দিন।

বাকি ¼ চা চামচ রাঁধুনি হালকা ভেঙে উপরে ছড়িয়ে দিন। ঘি দিন, আঁচ বন্ধ করুন এবং অন্তত ১০ মিনিট ঢাকা দিয়ে রাখুন।

এই বিশ্রামটুকুও রেসিপিরই অংশ। এই সময়েই আলাদা আলাদা গন্ধ একে অপরের ভিতরে বসে যায়।

## শুক্তোর স্বাদ কেমন হবে

প্রথম অনুভূতি হবে মৃদু তেতো, কিন্তু মুখ কষে যাওয়ার মতো নয়। সেই তেতো গলে যাবে দুধ ও পোস্তর কোমলতায়, তারপর আসবে সংযত মিষ্টি আর রাঁধুনির সেলারি-ঘেঁষা সুবাস।

শুক্তো মিষ্টি তরকারিও নয়, তেতোর পরীক্ষাও নয়। নুন, চিনি বা উচ্ছে — কোনও একটি যদি বাকি সবাইকে ছাপিয়ে নিজের কথা জানান দেয়, তবে ভারসাম্য এখনও ঠিক হয়নি।

## সমস্যা হলে

**অতিরিক্ত তেতো হলে:**
২–৩ টেবিল চামচ গরম দুধ, ½ চা চামচ চিনি ও এক চিমটি নুন দিন। প্রচুর চিনি ঢেলে তেতো চাপা দেওয়ার চেষ্টা করবেন না।

**ঝোল পাতলা হলে:**
এক টুকরো সেদ্ধ আলু বা পেঁপে ঝোলে চটকে দিন। অথবা ½ চা চামচ চালের গুঁড়ো ঠান্ডা জলে গুলে কম আঁচে মিশিয়ে দিন।

**সবজি ভেঙে গেলে:**
পরের বার শক্ত সবজি ৭০ শতাংশের বেশি সেদ্ধ করবেন না, বেগুন দেবেন দেরিতে, আর খুন্তি না চালিয়ে কড়াই দুলিয়ে মেশাবেন।

**দুধ কেটে গেলে:**
সঙ্গে সঙ্গে আঁচ বন্ধ করুন। পদটি খাওয়া যাবে, তবে ঝোল আর নিখুঁত মসৃণ হবে না। পরের বার গরম কড়াইয়ে সরাসরি ঠান্ডা দুধ দেবেন না এবং দুধ দেওয়ার পরে কখনও জোরে ফোটাবেন না।

**রাঁধুনি না পেলে:**
½ চা চামচ পাঁচফোড়ন দিয়ে ফোড়ন দিন। স্বাদ আলাদা হবে, তবু চেনা বাঙালি সুবাসের ভিতটুকু থাকবে।

## পরিবেশন ও সংরক্ষণ

গরম সাদা ভাতের সঙ্গে, পাতের শুরুর দিকে পরিবেশন করুন। ১০–১৫ মিনিট বিশ্রামের পরে শুক্তোর স্বাদ আরও খোলে; অনেকের কাছে পরদিনের নরম, মিলেমিশে যাওয়া স্বাদটিই বেশি প্রিয়।

অবশিষ্ট শুক্তো দ্রুত ঠান্ডা করে দুই ঘণ্টার মধ্যে ঢাকা পাত্রে ফ্রিজে রাখুন। আবার গরম করার সময় কম আঁচে শুধু ধোঁয়া ওঠা পর্যন্ত গরম করুন। বারবার ফোটালে সবজি ভেঙে যাবে, দুধের ঝোলও কেটে যেতে পারে।

প্রথম গ্রাসের আগে এক মুহূর্ত থামুন। রাঁধুনির অভ্যাসই হল পুরোনো দরজা খুলে দেওয়া: রোদ-পড়া এক রান্নাঘর, পাখার একটানা শব্দ, কিংবা এমন কারও স্মৃতি — যিনি কোনওদিন কিছু মাপেননি, অথচ প্রতিবার শুক্তোর স্বাদ ঠিক একই রকম হত।', '*The craft lies not in bitterness, but in balancing bitter, sweet and mellow flavours.*

A pot of rice has just been opened. The ceiling fan turns above a quiet Bengal afternoon, and beside the brass plate waits a bowl of pale shukto. For many Bengalis, that fragrance carries an entire vanished household within it: a grandmother''s kitchen, the scrape of a ladle, lunch eaten before the heat began to soften.

Good shukto unfolds in stages. A mild bitterness arrives first, followed by the gentleness of milk and poppy seed, and finally a restrained sweetness scented with radhuni. It is not merely a bitter vegetable curry; it is an exercise in balance.

There is no single universal shukto. Some families use panch phoron, others only radhuni. Mustard appears in one kitchen and disappears in the next; some versions are lightly yellow, while others remain almost ivory. This recipe makes a **classic pale shukto with radhuni, poppy seed, a little yellow mustard and milk** — mild, creamy and deliberately free of chilli.

## The technique that matters

Do not cook every vegetable together from the beginning. By the time the potato and papaya soften, the aubergine will have collapsed. If the bitter gourd sits in the gravy throughout, controlling the bitterness becomes difficult.

Instead:

1. Parboil the firm vegetables.
2. Fry the bitter gourd, plantain and aubergine separately.
3. Add the milk only at the end, over very low heat.

This preserves the shape of each vegetable while allowing their flavours to meet in the gravy.

## At a glance

* Serves: 6
* Preparation: 35 minutes
* Cooking: 35–40 minutes
* Resting: 10 minutes
* Character: mildly bitter, faintly sweet, creamy but light
* Serve: near the beginning of a Bengali meal, with hot plain rice

## Vegetables

* Bitter gourd — 60 g, or 1 medium
* Potato — 130 g, or 1 medium
* Sweet potato — 120 g
* Green plantain — 150 g, or 1 medium
* Raw papaya — 160 g
* Aubergine — 120 g
* Hyacinth beans — 100 g, about 6–8
* Drumsticks — 150 g, about 2
* Sun-dried lentil dumplings, or bori — 10–12

If you need to shorten the list, omit the sweet potato or beans. Retaining the bitter gourd, plantain, papaya and drumsticks will preserve the dish''s essential character.

## Pastes and seasoning

* Poppy seeds — 2 tbsp, about 25 g
* White or yellow mustard seeds — 1 tbsp, about 12 g
* Ginger paste — 1 heaped tbsp
* Radhuni — ¾ tsp, divided
* Bay leaves — 2
* Salt — about 2½ tsp, then adjust
* Sugar — 2 tsp, plus up to 1 tsp if required
* Mustard oil — 4–5 tbsp
* Ghee — 2 tsp

## For the gravy

* Full-fat milk — 250 ml, at room temperature
* Rice flour or plain flour — 1 tsp
* Water — about 700 ml

There is no turmeric, chilli, cumin or garam masala in this version. Its distinction lies in its pale colour and quiet aroma.

## Prepare the pastes and vegetables

Soak the poppy and mustard seeds separately for 20 minutes. Grind the poppy seeds with a little water to make a smooth paste.

Grind the mustard with ¼ teaspoon salt and cold water. Do not run the grinder for an unnecessarily long time or grind the seeds dry, as the paste may become unpleasantly bitter. For an especially smooth gravy, dilute the mustard paste with a little water and pass it through a fine strainer.

Cut the vegetables into pieces of similar length:

* Potato, sweet potato, plantain and papaya: batons about 5 cm long and 1.5 cm thick
* Aubergine: slightly thicker batons
* Drumsticks: 5 cm lengths, with the tough outer fibres removed
* Beans: stringed and halved
* Bitter gourd: halved lengthwise, then cut into 5 mm slices

Keep the cut plantain in lightly salted water to prevent discolouration, then drain and dry it before frying.

## Step 1: Parboil the firm vegetables

Bring 700 ml water and 1 teaspoon salt to a simmer.

Add the papaya and drumsticks first. After 3 minutes, add the potato and sweet potato. Cook for another 5 minutes, add the beans, and simmer for 2 minutes more.

The vegetables should be about 70 per cent cooked: the point of a knife should enter but meet some resistance at the centre. Lift out the vegetables and reserve all the cooking water. It will become the gravy.

## Step 2: Fry separately

Heat the mustard oil until it just begins to smoke, then reduce the heat to medium.

Fry the bori first for 30–45 seconds, until golden. Remove immediately; they burn quickly.

Fry the vegetables separately:

* Bitter gourd: 3–4 minutes, until lightly browned at the edges
* Plantain: 3–4 minutes, until the exterior firms
* Aubergine: 2–3 minutes, until lightly coloured

Remove each batch before adding the next.

Frying the bitter gourd separately does not remove its bitterness. It softens the raw edge and lets you control how much bitterness enters the final gravy.

## Step 3: Build the flavour base

Leave approximately 2 tablespoons oil in the pan. Reduce the heat and add the bay leaves and ½ teaspoon radhuni.

Radhuni releases its aroma within seconds and burns easily. Add the ginger paste before the seeds darken. Stir for 30–40 seconds.

Add the poppy-seed paste with a splash of the reserved vegetable water. Cook gently for 1 minute, then add the strained mustard paste. Stir over low heat for another 1–2 minutes.

Do not brown the mixture or fry it until dry. Overcooked mustard becomes harsh, while dry poppy paste makes the gravy heavy rather than creamy.

## Step 4: Bring the vegetables together

Add the parboiled potato, sweet potato, papaya, drumsticks and beans, followed by the fried plantain. Fold them gently through the paste for 2 minutes.

Pour in 450 ml of the reserved vegetable water. Add 1 teaspoon salt and 2 teaspoons sugar. Cover and simmer over medium-low heat for 5 minutes.

Add the fried aubergine and bitter gourd. Rather than stirring vigorously, hold the handles and gently shake the pan. Cook for another 3 minutes.

## Step 5: Add the milk correctly

Whisk the room-temperature milk with the rice flour or plain flour until completely smooth.

Take one ladleful of hot gravy from the pan and whisk it gradually into the milk. This gently raises the milk''s temperature before it enters the pan.

Turn the heat to its lowest setting and pour in the milk mixture. The gravy should only tremble with small bubbles; it must not boil furiously. Cook uncovered for 3–4 minutes.

If the gravy is too thick, add more of the reserved vegetable water. Finished shukto should have a light gravy that leaves a thin coating on the vegetables.

## Finish and rest

Add the fried bori. Simmer for 2 minutes if you prefer them soft; for some crispness, add them immediately before serving.

Lightly crush the remaining ¼ teaspoon radhuni and scatter it over the curry. Add the ghee, turn off the heat and cover the pan for at least 10 minutes.

This rest is part of the recipe. It allows the separate aromas to settle into one another.

## How the finished shukto should taste

The first impression should be gently bitter, but never mouth-puckering. The bitterness should give way to the softness of milk and poppy seed, followed by restrained sweetness and the celery-like fragrance of radhuni.

Shukto is neither a sweet curry nor an ordeal in bitterness. If salt, sugar or bitter gourd announces itself more loudly than everything else, the balance still needs adjustment.

## Troubleshooting

**If it is too bitter:**
Add 2–3 tablespoons warm milk, ½ teaspoon sugar and a pinch of salt. Do not attempt to bury the bitterness under a large quantity of sugar.

**If the gravy is thin:**
Mash one piece of cooked potato or papaya into the gravy. Alternatively, mix ½ teaspoon rice flour with cold water and stir it in over low heat.

**If the vegetables collapse:**
Next time, parboil the firm vegetables only until 70 per cent cooked, add the aubergine late, and shake the pan instead of stirring with a spatula.

**If the milk separates:**
Turn off the heat immediately. The dish will remain edible, though the gravy cannot be made perfectly smooth again. Next time, avoid adding cold milk directly to the hot pan and never boil vigorously after adding it.

**If radhuni is unavailable:**
Temper the oil with ½ teaspoon panch phoron. The flavour will be different, but the dish will still have a recognisably Bengali aromatic base.

## Serving and storage

Serve with hot plain rice near the beginning of the meal. Shukto improves after resting for 10–15 minutes, and many people prefer its softer, more integrated flavour the following day.

Cool leftovers promptly and refrigerate them in a covered container within two hours. Reheat gently only until steaming. Repeated boiling will break the vegetables and may cause the milk gravy to separate.

Before taking the first mouthful, pause for a moment. Radhuni has a habit of opening old doors: a sunlit kitchen, the whirr of a ceiling fan, or the memory of someone who never measured a single ingredient and yet made the shukto taste exactly the same every time.', '/uma-media/shukto.webp', 'bn', 'accepted', 'sankhya-1', 9, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-mangshor-jhol', 'sunday-mangshor-jhol', 'recipes', 'The Sunday Mangshor Jhol', 'রবিবারের মাংসের ঝোল',
  'Aparna Basu', 'অপর্ণা বসু', 'Writer on food, memory and the regional flavours of Bengal', 'খাদ্য, স্মৃতি ও বাংলার আঞ্চলিক স্বাদ নিয়ে লেখেন', 1,
  'Bone-in goat and big pieces of potato in a thin, brick-red gravy — the Sunday jhol, and the eternal question of who gets the potato.', 'On Sunday mornings in Bengal, lunch often announces itself long before it reaches the table. There is the queue outside the neighbourhood meat shop, the thud of a cleaver against its wooden block, and, a little later, the first whistle from somebody''s pressure cooker. By noon, the smell of mustard oil, goat meat and garam masala has travelled across balconies and garden walls.

This is not kosha mangsho. It is not meant to be dark, dry or overwhelmingly spiced. Sunday mangshor jhol is lighter and more generous: bone-in goat and large pieces of potato in a warm, brick-red gravy, thin enough to run through a mound of rice but substantial enough to cling to every grain.

The meat matters, certainly. But everyone remembers who received the potato.

## The technique that makes the jhol

The crucial moment comes after the meat has been added to the cooked onion and spices.

It must be **koshano** — braised patiently until its released water evaporates, the colour deepens and the oil begins to reappear. But it must not be taken as far as kosha mangsho. If the onions and meat become very dark, the resulting gravy will be heavy rather than fresh and flowing.

Then comes the second decision: cook the goat under pressure first and add the fried potatoes afterwards. Goat varies greatly in age and tenderness; potatoes do not. Cooking both for an arbitrary number of whistles may leave one tough or turn the other into mash.

## At a glance

* Serves: 6
* Preparation: 30 minutes
* Marination: 1–8 hours
* Cooking: approximately 60–75 minutes
* Best vessel: 5-litre stovetop pressure cooker or a heavy kadai
* Character: light, aromatic, moderately hot, with plenty of gravy
* Serve with: plain rice, lime and green chilli

## Choosing the meat

Ask for **1 kg bone-in goat meat**, cut into pieces of roughly 4–5 cm. A mixture of shoulder, foreleg, ribs and a few fattier pieces produces a more flavourful jhol than uniformly lean, boneless meat.

The bones and connective tissue enrich the gravy during cooking. The meat should eventually yield easily to the pressure of a spoon, but it should not disintegrate or fall away from the bone before it reaches the plate.

## For the marinade

* Bone-in goat meat — 1 kg
* Plain full-fat yoghurt — 100 g
* Mustard oil — 1 tbsp
* Ginger paste — 1 tbsp
* Garlic paste — 1 tbsp
* Turmeric — 1 tsp
* Kashmiri chilli powder — 1 tsp
* Salt — 2 tsp

## For the curry

* Potatoes — 450 g, about 3 medium
* Onions — 300 g, thinly sliced
* Ginger paste — 1 tbsp
* Garlic paste — ½ tbsp
* Kashmiri chilli powder — 1½ tsp
* Hot red chilli powder — ½ tsp, optional
* Cumin powder — 2 tsp
* Coriander powder — 1½ tsp
* Turmeric — ½ tsp
* Mustard oil — 3–4 tbsp
* Sugar — 2 tsp
* Salt — approximately 1½ tsp more, then adjust
* Hot water — 600–700 ml
* Green chillies — 4, slit

## Whole spices

* Bay leaves — 2
* Dried red chillies — 2
* Green cardamom — 4
* Cloves — 4
* Cinnamon — one 5 cm piece

## To finish

* Bengali garam masala — ½ tsp
* Ghee — 1 tsp
* Lime wedges — for the table

Bengali garam masala is a restrained mixture of green cardamom, cinnamon and cloves. It should perfume the finished curry, not dominate it.

## Marinate the goat

Pat the meat dry and place it in a non-reactive bowl. Whisk the yoghurt until smooth, then mix it with mustard oil, ginger, garlic, turmeric, Kashmiri chilli and salt.

Coat every piece of meat thoroughly. Cover and refrigerate for at least 1 hour. Four to eight hours is ideal; an overnight marinade is unnecessary but may be used if kept refrigerated.

Take the bowl out of the refrigerator while you prepare the remaining ingredients. Do not leave raw meat standing at room temperature for an extended period.

## Prepare the potatoes and spice paste

Peel the potatoes and cut each into two or three large pieces, about 5 cm across. Small pieces will break before the goat becomes tender.

Mix the potatoes with a pinch each of salt and turmeric.

In a small bowl, combine the cumin, coriander, Kashmiri chilli, optional hot chilli and remaining turmeric with 4 tablespoons water. Making a wet spice paste prevents the powdered spices from burning in the hot oil.

## Step 1: Fry the potatoes

Heat the mustard oil in the pressure cooker or a heavy kadai until it just begins to smoke. Reduce the heat to medium and allow the oil to settle for a few seconds.

Add the potatoes and fry for 5–7 minutes, turning them until the edges are golden. They do not need to cook through. This frying builds flavour and forms a firmer exterior, helping the pieces hold their shape later.

Remove and set aside.

## Step 2: Build a light, aromatic base

In the same oil, add the bay leaves, dried chillies, cardamom, cloves and cinnamon. Let them sizzle for 15–20 seconds.

Add the sugar. As soon as it begins to melt and turn pale amber, add the sliced onions. Do not wait for the sugar to become dark brown — it will turn bitter.

Add a small pinch of salt and cook the onions over medium heat for 12–15 minutes. They should become soft, reduced and evenly golden, not deeply browned.

Add the remaining ginger and garlic pastes. Cook for 2–3 minutes, until their raw smell disappears.

Lower the heat and add the wet spice paste. Cook for 3–4 minutes, stirring frequently. If it begins to stick, add a tablespoon of hot water. The spices are ready when the mixture looks glossy and small beads of oil appear around its edges.

## Step 3: Koshao — but know when to stop

Add the marinated goat along with every bit of the marinade. Raise the heat and turn the pieces for 4–5 minutes so that their surfaces meet the hot pan.

Reduce to medium and cook uncovered for another 20–25 minutes. Stir thoroughly every few minutes, scraping the bottom and turning the meat.

At first, the goat and yoghurt will release water. Continue cooking until most of this moisture evaporates, the meat darkens slightly and the masala clings closely to the pieces. Small pools of oil should begin to reappear.

This is the point to stop koshano. The onions should be golden-brown, not mahogany; the masala should be concentrated, but not dry or scorched.

## Step 4: Pressure-cook the goat

Pour in 550 ml hot water and scrape the bottom of the cooker to release all the flavourful browned material. Add two green chillies.

Secure the lid. Bring the cooker to full pressure over high heat, then reduce the heat to low and cook under steady pressure for approximately 15–18 minutes.

Do not rely solely on the number of whistles: pressure cookers differ, and so does goat meat.

Turn off the heat and allow the pressure to fall naturally. Open the cooker and test a piece. A spoon should enter the meat with some resistance, but the meat should be nearly tender.

If it is still distinctly tough, close the cooker and cook under pressure for another 5–8 minutes before proceeding. Tough goat needs more time — not more spice.

## Step 5: Add the potatoes

Add the fried potatoes and the remaining green chillies. Pour in another 100–150 ml hot water, depending on how much gravy you want. Taste the liquid and adjust the salt.

Simmer with the lid resting loosely on the cooker for 12–18 minutes, until the potatoes are tender and the goat yields easily to a spoon.

Cooking the potatoes without pressure at this stage allows you to stop at the exact moment when their centres become soft but their edges remain intact.

The finished gravy should be thinner than an ordinary curry. Remember that it will thicken slightly as it rests and again when poured over rice.

## Finish and rest

Crush the Bengali garam masala between your fingers and scatter it over the curry. Add the ghee, switch off the heat and cover for 10 minutes.

Do not boil the curry after adding the finishing garam masala. Its most delicate aromas would disappear into the kitchen instead of remaining in the pot.

## How to judge the result

The meat should be tender but still attached to the bone. The potato should remain whole until pressed with a finger or spoon. The gravy should carry the sweetness of onion, the warmth of ginger and chilli, and the aroma of cardamom and cinnamon — without tasting like a thick restaurant curry.

Pour a ladle beside a mound of rice. If the jhol runs easily between the grains and leaves a light red sheen, the consistency is right.

## If something goes wrong

**The goat is still tough:**
Add a little hot water and pressure-cook for another 5–8 minutes. Meat becomes tender with sufficient moist cooking; adding extra yoghurt or spices will not help.

**The potatoes are breaking:**
Remove the cooked pieces carefully and finish the meat separately. Next time, cut them larger, fry them more thoroughly and add them only after pressure-cooking the goat.

**The gravy is too thin:**
Simmer uncovered for 5–10 minutes. You may also mash a small corner of one potato into the gravy, but do not turn the jhol into a thick sauce.

**The gravy is too thick:**
Add hot water, never cold, and simmer for 2–3 minutes so that the water and masala become one gravy again.

**The yoghurt has split:**
This is usually cosmetic. Keep cooking the masala patiently; it will become smoother as the moisture evaporates and the oil reappears. Well-whisked, full-fat yoghurt is less likely to split visibly.

**The curry tastes bitter:**
The sugar or powdered spices may have burnt. A little hot water, a pinch of salt and ½ teaspoon sugar may soften the bitterness, but severe scorching cannot be repaired.

## Slow-cooking without a pressure cooker

After koshano, add approximately 1.2 litres hot water. Cover and simmer on low heat for 75–120 minutes, stirring every 15 minutes and adding more hot water when necessary.

Add the fried potatoes when the meat is nearly tender and cook for a final 20–30 minutes. This method takes longer but gives excellent control and a naturally fuller-bodied gravy.

## At the Sunday table

Serve the jhol with plain rice, a green chilli and a wedge of lime. Let people decide whether the lime belongs on the meat, the potato or nowhere near the plate.

And if you now live far from the lane where Sunday once began with a butcher''s queue, this is the sort of dish that briefly folds distance. The first pressure-cooker whistle, the smell reaching the staircase, somebody calling everyone to lunch — and the familiar argument over who has taken the last potato.', 'বাংলার রবিবারে দুপুরের খাবার টেবিলে আসার অনেক আগেই নিজের আগমন জানিয়ে দেয়। সকালবেলা পাড়ার মাংসের দোকানে লাইন, কাঠের গুঁড়ির উপর ভারী দা পড়ার শব্দ, আর একটু বেলা বাড়তেই কোনও বাড়ি থেকে ভেসে আসে প্রেশার কুকারের প্রথম সিটি। দুপুরের মধ্যে সর্ষের তেল, পাঁঠার মাংস আর গরমমশলার গন্ধ বারান্দা পেরিয়ে ছড়িয়ে পড়ে গোটা পাড়ায়।

এ কষা মাংস নয়। এর রং অতটা গাঢ় হবে না, মশলা হবে না ভারী, ঝোলও মাংসের গায়ে লেগে থাকবে না। রবিবারের মাংস মানে হাড়সমেত নরম পাঁঠা, বড় বড় আলু আর ইট-লাল রঙের এমন ঝোল — যা ভাতের মধ্যে অনায়াসে ছড়িয়ে পড়বে, অথচ প্রতিটি দানায় স্বাদ রেখে যাবে।

মাংস অবশ্যই গুরুত্বপূর্ণ। কিন্তু কার পাতে আলু পড়েছিল, সেটাই সকলে বেশি দিন মনে রাখে।

## এই ঝোলের আসল কৌশল

পেঁয়াজ-মশলার মধ্যে মাংস দেওয়ার পরেই রান্নার সবচেয়ে গুরুত্বপূর্ণ পর্যায়টি শুরু হয় — **কষানো**।

মাংস থেকে বেরোনো জল শুকিয়ে, রং সামান্য গাঢ় হয়ে, তেল আবার দেখা দেওয়া পর্যন্ত ধৈর্য ধরে কষাতে হবে। কিন্তু কষা মাংসের মতো পেঁয়াজ ও মাংসকে খুব গাঢ় বা শুকনো করা চলবে না। বেশি কষালে ঝোলের হালকা, ঘরোয়া স্বভাবটি হারিয়ে যাবে।

দ্বিতীয় কৌশলটি আলু নিয়ে। পাঁঠার মাংস কতক্ষণে নরম হবে তা তার বয়স ও কোন অংশের মাংস তার উপর নির্ভর করে; আলুর ক্ষেত্রে সেই অনিশ্চয়তা নেই। তাই নির্দিষ্ট সংখ্যক সিটির জন্য মাংস ও আলু একসঙ্গে রান্না না করে, আগে মাংস প্রেসারে প্রায় নরম করে পরে ভাজা আলু দেওয়াই সবচেয়ে নির্ভরযোগ্য পদ্ধতি।

## এক নজরে

* পরিবেশন: ৬ জন
* প্রস্তুতি: ৩০ মিনিট
* ম্যারিনেশন: ১–৮ ঘণ্টা
* রান্না: প্রায় ৬০–৭৫ মিনিট
* পাত্র: ৫ লিটারের প্রেশার কুকার বা ভারী কড়াই
* স্বাদ: হালকা ঝাল, সুগন্ধি, প্রচুর পাতলা ঝোল
* সঙ্গে: সাদা ভাত, কাঁচালঙ্কা ও পাতিলেবু

## মাংস বাছাই

হাড়সমেত **১ কেজি পাঁঠার মাংস**, প্রায় ৪–৫ সেমি টুকরো করে কাটিয়ে নিন। কাঁধ, সামনের পা, পাঁজর এবং সামান্য চর্বিযুক্ত কয়েকটি টুকরোর মিশ্রণ একেবারে চর্বিহীন মাংসের তুলনায় বেশি সুস্বাদু ঝোল তৈরি করে।

রান্নার পরে চামচের চাপে মাংস নরম হয়ে যাবে, কিন্তু পাতে পড়ার আগেই হাড় থেকে খুলে যাওয়া উচিত নয়।

## ম্যারিনেশনের জন্য

* হাড়সমেত পাঁঠার মাংস — ১ কেজি
* টক নয় এমন পূর্ণচর্বিযুক্ত দই — ১০০ গ্রাম
* সর্ষের তেল — ১ টেবিল চামচ
* আদা বাটা — ১ টেবিল চামচ
* রসুন বাটা — ১ টেবিল চামচ
* হলুদ — ১ চা চামচ
* কাশ্মীরি লঙ্কার গুঁড়ো — ১ চা চামচ
* নুন — ২ চা চামচ

## ঝোলের জন্য

* আলু — ৪৫০ গ্রাম বা ৩টি মাঝারি
* পেঁয়াজ — ৩০০ গ্রাম, পাতলা করে কাটা
* আদা বাটা — ১ টেবিল চামচ
* রসুন বাটা — ½ টেবিল চামচ
* কাশ্মীরি লঙ্কার গুঁড়ো — ১½ চা চামচ
* ঝাল লাল লঙ্কার গুঁড়ো — ½ চা চামচ, ইচ্ছেমতো
* জিরে গুঁড়ো — ২ চা চামচ
* ধনে গুঁড়ো — ১½ চা চামচ
* হলুদ — ½ চা চামচ
* সর্ষের তেল — ৩–৪ টেবিল চামচ
* চিনি — ২ চা চামচ
* নুন — আরও প্রায় ১½ চা চামচ, পরে স্বাদমতো
* গরম জল — ৬০০–৭০০ মিলিলিটার
* কাঁচালঙ্কা — ৪টি, চেরা

## গোটা মশলা

* তেজপাতা — ২টি
* শুকনো লঙ্কা — ২টি
* ছোট এলাচ — ৪টি
* লবঙ্গ — ৪টি
* দারচিনি — ৫ সেমি

## শেষে

* বাংলা গরমমশলা — ½ চা চামচ
* ঘি — ১ চা চামচ
* পাতিলেবু — পরিবেশনের জন্য

বাংলা গরমমশলা বলতে ছোট এলাচ, দারচিনি ও লবঙ্গের সংযত মিশ্রণ। তার কাজ শেষ মুহূর্তে সুবাস দেওয়া, ঝোলের মূল স্বাদ ঢেকে দেওয়া নয়।

## মাংস ম্যারিনেট করুন

মাংসের গায়ের অতিরিক্ত জল মুছে নিন। দই মসৃণ করে ফেটিয়ে তার সঙ্গে সর্ষের তেল, আদা, রসুন, হলুদ, কাশ্মীরি লঙ্কা ও নুন মেশান।

মিশ্রণটি প্রতিটি মাংসের টুকরোয় ভালো করে মাখিয়ে ঢাকা দিয়ে ফ্রিজে রাখুন। অন্তত ১ ঘণ্টা, সম্ভব হলে ৪–৮ ঘণ্টা ম্যারিনেট করুন।

বাকি উপকরণ তৈরি করার সময় বাটিটি ফ্রিজ থেকে বার করে রাখুন। তবে কাঁচা মাংস দীর্ঘক্ষণ ঘরের তাপমাত্রায় ফেলে রাখবেন না।

## আলু ও গুঁড়ো মশলা তৈরি রাখুন

আলু ছাড়িয়ে প্রতিটি দুই বা তিনটি বড় টুকরোয় কাটুন — প্রায় ৫ সেমি মাপের। ছোট আলু মাংস নরম হওয়ার আগেই ভেঙে যেতে পারে।

আলুতে এক চিমটি নুন ও হলুদ মাখিয়ে রাখুন।

একটি ছোট বাটিতে জিরে, ধনে, কাশ্মীরি লঙ্কা, ইচ্ছেমতো ঝাল লঙ্কা ও বাকি হলুদ ৪ টেবিল চামচ জলের সঙ্গে গুলে রাখুন। শুকনো গুঁড়ো মশলা সরাসরি গরম তেলে দিলে সহজেই পুড়ে যেতে পারে; জলে গুলে নিলে মশলা সমানভাবে রান্না হবে।

## ধাপ ১: আলু ভাজুন

প্রেশার কুকার বা ভারী কড়াইয়ে সর্ষের তেল গরম করুন। হালকা ধোঁয়া উঠতে শুরু করলে আঁচ মাঝারি করে কয়েক সেকেন্ড অপেক্ষা করুন।

আলু দিয়ে ৫–৭ মিনিট ভাজুন। চারপাশে সোনালি রং ধরবে, কিন্তু ভিতরটি কাঁচাই থাকবে। ভাজা আলু তুলে রাখুন।

এই ধাপে আলুর স্বাদ বাড়ার পাশাপাশি বাইরে একটি শক্ত স্তর তৈরি হয়, যা পরে ঝোলে তার আকার ধরে রাখতে সাহায্য করে।

## ধাপ ২: হালকা পেঁয়াজ-মশলার ভিত তৈরি করুন

একই তেলে তেজপাতা, শুকনো লঙ্কা, এলাচ, লবঙ্গ ও দারচিনি দিন। ১৫–২০ সেকেন্ড ফোড়ন উঠতে দিন।

চিনি দিন। চিনি গলে হালকা সোনালি হওয়া মাত্র পেঁয়াজ দিয়ে দিন। চিনি গাঢ় বাদামি হওয়া পর্যন্ত অপেক্ষা করলে ঝোলে তেতো স্বাদ আসতে পারে।

এক চিমটি নুন দিয়ে পেঁয়াজ মাঝারি আঁচে ১২–১৫ মিনিট রান্না করুন। পেঁয়াজ নরম ও সমান সোনালি হবে — খুব গাঢ় বাদামি নয়।

বাকি আদা ও রসুন বাটা দিয়ে ২–৩ মিনিট রান্না করুন। কাঁচা গন্ধ চলে গেলে আঁচ কমিয়ে জলে গোলা মশলা দিন।

ঘন ঘন নেড়ে ৩–৪ মিনিট কষান। মশলা তলায় ধরতে চাইলে এক টেবিল চামচ গরম জল ছিটিয়ে দিন। মশলা চকচকে হয়ে চারপাশে ছোট ছোট তেলের বিন্দু দেখা দিলে পরের ধাপে যান।

## ধাপ ৩: কষান — কিন্তু কোথায় থামতে হবে জানুন

ম্যারিনেট করা মাংস সমস্ত মশলাসহ কুকারে দিন। আঁচ বাড়িয়ে ৪–৫ মিনিট ভালো করে উল্টেপাল্টে নিন, যাতে প্রতিটি টুকরো গরম পাত্রের সংস্পর্শে আসে।

আঁচ মাঝারি করে আরও ২০–২৫ মিনিট ঢাকা ছাড়া কষান। প্রতি কয়েক মিনিট অন্তর তলা থেকে মশলা তুলে মাংস উল্টে দিন।

প্রথমে মাংস ও দই থেকে বেশ কিছুটা জল বেরোবে। সেই জল প্রায় শুকিয়ে, মাংসের রং সামান্য গাঢ় হয়ে, মশলা টুকরোগুলির গায়ে লেগে এবং অল্প তেল আবার দেখা দেওয়া পর্যন্ত কষাতে হবে।

এইখানেই থামুন। পেঁয়াজ সোনালি-বাদামি থাকবে, গাঢ় খয়েরি নয়; মশলা ঘন হবে, কিন্তু শুকনো বা পোড়া নয়।

## ধাপ ৪: মাংস প্রেসারে রান্না করুন

৫৫০ মিলিলিটার গরম জল ঢেলে কুকারের তলায় লেগে থাকা মশলা ভালো করে তুলে দিন। দুটি চেরা কাঁচালঙ্কা দিন।

ঢাকনা বন্ধ করে বেশি আঁচে পূর্ণ প্রেসার আসতে দিন। তারপর আঁচ কমিয়ে প্রায় ১৫–১৮ মিনিট স্থির প্রেসারে রান্না করুন।

শুধু সিটির সংখ্যা ধরে সময় ঠিক করবেন না। একেক ধরনের কুকারে প্রেসার আলাদা হয়, আর একেক পাঁঠার মাংস নরম হতেও একেক সময় লাগে।

আঁচ বন্ধ করে প্রেসার নিজে থেকে নামতে দিন। ঢাকনা খুলে একটি টুকরো পরীক্ষা করুন। চামচ ঢুকবে, তবে সামান্য বাধা থাকবে — মাংস প্রায় নরম হয়ে এসেছে।

মাংস যদি এখনও বেশ শক্ত থাকে, আলু দেওয়ার আগে আরও ৫–৮ মিনিট প্রেসারে রান্না করুন। শক্ত মাংসের প্রয়োজন বেশি সময়; বেশি মশলা নয়।

## ধাপ ৫: আলু দিন

ভাজা আলু এবং বাকি কাঁচালঙ্কা দিন। কতটা ঝোল চান তার উপর নির্ভর করে আরও ১০০–১৫০ মিলিলিটার গরম জল মেশান। ঝোল চেখে নুন ঠিক করুন।

কুকারের ঢাকনা আলগা করে রেখে ১২–১৮ মিনিট অল্প আঁচে ফোটান। আলুর মাঝখান নরম এবং মাংস চামচের চাপে সহজে কেটে গেলে রান্না শেষ।

আলুকে এই পর্যায়ে প্রেসার ছাড়া রান্না করলে ঠিক যে মুহূর্তে তার ভিতরটি নরম অথচ বাইরেটি অটুট থাকে, তখনই আঁচ বন্ধ করা যায়।

ঝোল সাধারণ তরকারির চেয়ে পাতলা রাখুন। বিশ্রাম নেওয়ার সময় এবং ভাতের উপর ঢাললে এটি সামান্য ঘন হবে।

## শেষ সুবাস ও বিশ্রাম

আঙুলের মধ্যে গরমমশলা সামান্য চটকে ঝোলের উপর ছড়িয়ে দিন। ঘি দিয়ে আঁচ বন্ধ করে কুকার ১০ মিনিট ঢাকা রাখুন।

গরমমশলা দেওয়ার পরে আর ফোটাবেন না। বেশি ফোটালে তার সূক্ষ্ম সুবাস ঝোলে না থেকে রান্নাঘরের বাতাসে হারিয়ে যাবে।

## ঠিক হয়েছে কীভাবে বুঝবেন

মাংস নরম, কিন্তু হাড়ের সঙ্গে লেগে থাকবে। আলু গোটা থাকবে, অথচ চামচের চাপে সহজে ভেঙে যাবে। ঝোলে পেঁয়াজের মিষ্টতা, আদা-লঙ্কার উষ্ণতা এবং এলাচ-দারচিনির সুবাস থাকবে — কোনওটিই আলাদা করে অন্য স্বাদকে ঢেকে দেবে না।

এক হাতা ঝোল ভাতের পাশে ঢালুন। ঝোল যদি দানার ফাঁক দিয়ে সহজে ছড়িয়ে পড়ে এবং ভাতের গায়ে হালকা লাল আভা রেখে যায়, ঘনত্ব ঠিক হয়েছে।

## সমস্যা হলে

**মাংস শক্ত থাকলে:**
অল্প গরম জল দিয়ে আরও ৫–৮ মিনিট প্রেসারে রান্না করুন। অতিরিক্ত দই বা মশলা দিয়ে মাংস নরম করা যাবে না।

**আলু ভেঙে গেলে:**
সেদ্ধ আলু সাবধানে তুলে রেখে মাংসের রান্না শেষ করুন। পরের বার বড় করে কাটুন, ভালো করে ভাজুন এবং মাংস প্রেসারে রান্না হওয়ার পরে দিন।

**ঝোল বেশি পাতলা হলে:**
ঢাকনা ছাড়া ৫–১০ মিনিট ফোটান। চাইলে একটি আলুর সামান্য অংশ ঝোলে চটকে দেওয়া যায়, কিন্তু ঝোলকে ঘন কষায় পরিণত করবেন না।

**ঝোল বেশি ঘন হলে:**
গরম জল দিয়ে ২–৩ মিনিট ফুটিয়ে নিন। ঠান্ডা জল দিলে তেল-মশলা ও জল এক হতে বেশি সময় লাগবে।

**দই কেটে গেলে:**
সাধারণত এটি শুধু দেখতে খারাপ লাগে; স্বাদ নষ্ট হয় না। ধৈর্য ধরে কষালে জল শুকিয়ে তেল বেরোনোর সঙ্গে ঝোল আবার মসৃণ দেখাবে। ভালো করে ফেটানো পূর্ণচর্বিযুক্ত দই সহজে কাটে না।

**তেতো স্বাদ এলে:**
চিনি বা গুঁড়ো মশলা পুড়ে থাকতে পারে। অল্প গরম জল, এক চিমটি নুন ও ½ চা চামচ চিনি স্বাদ কিছুটা ঠিক করতে পারে; বেশি পুড়ে গেলে সম্পূর্ণ সারানো কঠিন।

## প্রেশার কুকার ছাড়া

কষানোর পরে প্রায় ১.২ লিটার গরম জল দিন। ঢেকে অল্প আঁচে ৭৫–১২০ মিনিট রান্না করুন। প্রতি ১৫ মিনিটে নেড়ে দেখুন এবং প্রয়োজনে গরম জল যোগ করুন।

মাংস প্রায় নরম হয়ে এলে ভাজা আলু দিয়ে আরও ২০–৩০ মিনিট রান্না করুন। এই পদ্ধতিতে সময় বেশি লাগে, কিন্তু মাংস ও ঝোলের ঘনত্বের উপর সম্পূর্ণ নিয়ন্ত্রণ থাকে।

## রবিবারের পাতে

গরম সাদা ভাত, কাঁচালঙ্কা আর এক টুকরো পাতিলেবুর সঙ্গে পরিবেশন করুন। লেবু মাংসে পড়বে, আলুতে পড়বে, না কি ঝোল থেকে নিরাপদ দূরত্বে থাকবে — সে সিদ্ধান্ত যার যার নিজের।

আর যাঁরা এখন সেই পুরনো পাড়া বা মফস্‌সলের বাড়ি থেকে অনেক দূরে থাকেন, তাঁদের জন্য এই রান্না দূরত্বটাকে কিছুক্ষণের জন্য ভাঁজ করে দিতে পারে। কুকারের প্রথম সিটি, সিঁড়ি বেয়ে উঠে আসা মাংসের গন্ধ, ভাত বেড়ে সবাইকে ডাক — আর শেষ আলুটি কে নিল, সেই চিরকালীন অভিযোগ।', '/uma-media/mangshor-jhol.webp', 'en', 'accepted', 'sankhya-1', 10, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-hata', 'roj-adh-ghonta-hata', 'health', 'The Half-Hour Walk', 'রোজ আধ ঘণ্টার হাঁটা',
  'Ambika Sen', 'অম্বিকা সেন', 'Writer on health and everyday habits', 'স্বাস্থ্য ও দৈনন্দিন অভ্যাসের লেখক', 1,
  'পঁয়তাল্লিশে ভালো হাঁটার অর্থ — হৃৎপিণ্ডকে একটু বেশি কাজ করানো, কিন্তু হাঁটু-কোমরকে শাস্তি না দেওয়া। মনে রাখুন তিনটি সংখ্যা: ৫–২০–৫।', 'পঁয়তাল্লিশে হাঁটা কোনও দৌড়ের প্রস্তুতি নয়, দশ হাজার পা পূর্ণ করার প্রতিযোগিতাও নয়। এই বয়সে ভালো হাঁটার অর্থ — হৃৎপিণ্ডকে একটু বেশি কাজ করানো, কিন্তু হাঁটু-কোমরকে অকারণে শাস্তি না দেওয়া। দ্রুততার চেয়ে ছন্দ গুরুত্বপূর্ণ; এক দিনের রেকর্ডের চেয়ে পরের দিন আবার বেরোতে পারা বেশি জরুরি।

মনে রাখুন শুধু তিনটি সংখ্যা: **৫–২০–৫**।

## প্রথম ৫ মিনিট: শরীরকে জানান

সহজ গতিতে হাঁটা শুরু করুন। প্রথমেই দ্রুত হাঁটবেন না। মাথা সোজা, চোখ মাটিতে নয় — কয়েক মিটার সামনে। কাঁধ ও ঘাড় শিথিল রাখুন; বুক তুলে ধরবেন, কিন্তু শরীর শক্ত করে নয়।

হাত কনুই থেকে সামান্য বাঁকানো থাকবে এবং হাঁটার সঙ্গে স্বাভাবিকভাবে সামনে-পিছনে দুলবে। হাত বুকের সামনে আড়াআড়ি আনবেন না।

## মাঝের ২০ মিনিট: দ্রুত, কিন্তু নিয়ন্ত্রিত

এবার গতি এমন করুন যাতে শ্বাসের বেগ বাড়ে, তবু পাশের মানুষটির সঙ্গে একটি সম্পূর্ণ বাক্য বলা যায়। কথা বলা যাবে, কিন্তু স্বচ্ছন্দে গান গাওয়া যাবে না — এটাই মাঝারি তীব্রতার সহজ **টক টেস্ট**।

বড় বড় পা ফেলে গতি বাড়াবেন না। তাতে গোড়ালি শরীরের অনেক সামনে পড়ে হাঁটুতে ধাক্কা বাড়তে পারে। তার বদলে সামান্য ছোট, দ্রুত ও সমান পদক্ষেপ নিন। পা শরীরের কাছাকাছি পড়বে এবং গোড়ালি থেকে আঙুলের দিকে স্বাভাবিকভাবে গড়িয়ে যাবে।

পেটের পেশি আলতো করে সক্রিয় রাখুন, কোমর থেকে সামনে ঝুঁকবেন না। উঁচু পথে ওঠার সময় পদক্ষেপ আরও ছোট করুন — শরীর ভেঙে সামনে ফেলবেন না।

## শেষ ৫ মিনিট: ধীরে ফিরুন

শেষ পাঁচ মিনিটে গতি ধীরে কমান। শ্বাস ও হৃদ্‌স্পন্দন স্বাভাবিক হতে দিন। হাঁটা শেষ করেই হঠাৎ বসে পড়ার বদলে এক মিনিট দাঁড়িয়ে গোড়ালি ওঠানো-নামানো বা হালকা কাফ স্ট্রেচ করতে পারেন।

## একেবারে নতুন হলে

প্রথম সপ্তাহে ১৫–২০ মিনিট, সপ্তাহে চার দিন দিয়ে শুরু করুন। পরের দিন হাঁটু, গোড়ালি বা কোমরে ব্যথা না বাড়লে প্রতি সপ্তাহে পাঁচ মিনিট করে সময় যোগ করুন। আগে সময় বাড়ান, পরে গতি বা চড়াই।

একটানা আধ ঘণ্টা না পেলে ১০ মিনিট করে তিনবার হাঁটলেও দৈনিক সক্রিয়তার হিসাবে তা যোগ হয়। দুপুর বা রাতের খাবারের পরে ১০–১৫ মিনিটের সহজ হাঁটা খাবার-পরবর্তী রক্তে গ্লুকোজের বৃদ্ধি কমাতে সাহায্য করতে পারে; তবে এটি ডায়াবেটিসের ওষুধ বা চিকিৎসার বিকল্প নয়।

## হাঁটার আগে ছোট পরীক্ষা

জুতো দামি হওয়ার দরকার নেই; গোড়ালি যেন পিছলে না যায়, আঙুলের সামনে সামান্য জায়গা থাকে এবং ক্ষয়ে যাওয়া তলা যেন একদিকে হেলে না পড়ে। প্রথম কয়েক সপ্তাহ সমতল, পরিচিত পথ বেছে নিন।

স্বাভাবিক পেশির টান বা হালকা ক্লান্তি আর ধারালো জয়েন্টের ব্যথা এক নয়। হাঁটার ভঙ্গি বদলে গেলে, খুঁড়িয়ে হাঁটতে হলে বা ব্যথা পরদিনও বাড়তে থাকলে দূরত্ব কমিয়ে চিকিৎসক বা ফিজিয়োথেরাপিস্টের পরামর্শ নিন।

## কখন থামবেন

হাঁটার সময় বুকে চাপ বা ব্যথা, অস্বাভাবিক শ্বাসকষ্ট, মাথা ঘোরা, অজ্ঞান হওয়ার অনুভূতি, ঠান্ডা ঘাম অথবা হাত, পিঠ, ঘাড় কিংবা চোয়ালে ছড়ানো অস্বস্তি হলে সঙ্গে সঙ্গে থামুন এবং জরুরি চিকিৎসা নিন।

পরিচিত হৃদ্‌রোগ, ডায়াবেটিসের জটিলতা, কিডনির অসুখ বা সাম্প্রতিক হাড়-জয়েন্টের সমস্যা থাকলে পরিকল্পনাটি চিকিৎসকের সঙ্গে মিলিয়ে নেওয়া উচিত। তবে কোনও উপসর্গ বা পরিচিত গুরুতর অসুখ না থাকলে অধিকাংশ মানুষ অল্প সময়ের হালকা হাঁটা দিয়ে ধীরে ধীরে শুরু করতে পারেন।

লক্ষ্য শুধু সপ্তাহে পাঁচ দিন আধ ঘণ্টা হাঁটা নয়। লক্ষ্য হল এমনভাবে হাঁটা, যাতে পঁয়তাল্লিশের শরীর পঞ্চান্নতেও পথটাকে নিজের বলে চিনতে পারে।', 'At forty-five, walking need not become a race towards ten thousand steps. The useful walk is one that asks a little more of the heart without punishing the knees and hips. Rhythm matters more than speed; being able to walk again tomorrow matters more than setting a record today.

Remember just three numbers: **5–20–5**.

## The first 5 minutes: let the body know

Begin at an easy pace. Keep your head up and look several metres ahead rather than down at your feet. Let the neck and shoulders relax. Stand tall, but do not hold the body stiffly.

Keep the elbows slightly bent and allow the arms to swing naturally forwards and backwards. Avoid swinging them across the chest.

## The middle 20 minutes: brisk, not breathless

Increase the pace until your breathing becomes noticeably faster but you can still speak a complete sentence. You should be able to talk, but not sing comfortably. This simple **talk test** is a more useful guide than trying to match somebody else''s speed.

Do not accelerate by reaching farther forwards with every step. Overstriding can make each landing harsher. Instead, take slightly shorter, quicker and even steps. Let the foot land reasonably close beneath the body and roll smoothly from heel towards toe.

Keep the abdominal muscles gently engaged and avoid bending forwards from the waist. When walking uphill, shorten the stride further rather than folding the body towards the slope.

## The final 5 minutes: come home gradually

Reduce the pace during the final five minutes and allow breathing and heart rate to settle. Instead of stopping and sitting immediately, remain standing for a minute and perform a few gentle heel raises or a light calf stretch.

## If you are beginning again

Start with 15–20 minutes on four days during the first week. If knee, ankle or back discomfort is not worse the following day, add about five minutes the next week. Build duration first; add speed or hills later.

If half an hour is difficult to schedule, three 10-minute walks still contribute to the day''s activity. An easy 10–15-minute walk after lunch or dinner may also reduce the rise in blood glucose after the meal. It complements diabetes treatment; it does not replace medication or medical advice.

## Check the path and shoes

Walking shoes need not be expensive. The heel should not slip, the toes should have some space, and the sole should not be worn unevenly. Begin on a level, familiar surface before adding slopes.

Mild muscular effort is different from sharp joint pain. If pain changes your gait, makes you limp or is worse the next day, reduce the distance and seek advice from a doctor or physiotherapist if it persists.

## Know when to stop

Stop walking and seek urgent medical help for chest pressure or pain, unusual breathlessness, dizziness, near-fainting, cold sweating, or discomfort spreading into an arm, the back, neck or jaw.

People with known heart disease, diabetes-related complications, kidney disease or a recent bone or joint problem should discuss a new exercise plan with their clinician. An otherwise well person without warning symptoms can usually begin with short, light-to-moderate walks and progress gradually.

The goal is not merely to complete thirty minutes on five days this week. It is to walk in a way that the body at fifty-five will still recognise as its own.', '/uma-media/adh-ghonta-hata.webp', 'bn', 'accepted', 'sankhya-1', 11, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-bhog-guide', 'five-days-of-bhog', 'health', 'Five Days of Bhog, Zero Regrets', 'পাঁচ দিনের ভোগ, শূন্য আফসোস',
  'Ambika Sen', 'অম্বিকা সেন', 'Writer on health and everyday habits', 'স্বাস্থ্য ও দৈনন্দিন অভ্যাসের লেখক', 1,
  'Five days of khichuri, labra and one long table — and why the bhog is the healthiest meal you will eat all pujo.', '*Five days of khichuri, labra and one long table — and why the bhog is the healthiest meal you will eat all pujo.*

Somewhere around Nabami, usually while reaching for a second helping, the same thought arrives: five days of this, and what exactly is it doing to me?

The honest answer is reassuring. The bhog is not the problem. It is very likely the best-composed meal of your pujo day — and it is worth knowing why.

## What is actually on that plate

**Khichuri** is rice and moong dal cooked together, and that pairing is quietly clever. Cereals run short of the amino acid lysine; pulses run short of methionine. Eaten in the same mouthful, they complete each other — which is why khichuri has fed this country''s convalescents, monsoons and temples for centuries.

**Labra** is the other half of the argument: five, six, sometimes eight seasonal vegetables in one preparation. Dietary fibre is what the bacteria in the large intestine actually feed on, and a spread of different plants is associated with a more varied gut community than the same two vegetables every day.

Then the honest part. **The beguni or fritter is fried, and the payesh is sugar and milk.** They are the celebration, not the nutrition. Enjoy them as such and the plate is still a well-built meal.

And note what is absent for five days: packaged snacks, restaurant oil, a screen instead of a table. The bhog is cooked that morning, in one kitchen, and eaten sitting down, at a normal hour, with two hundred people you know. Regular timing and unhurried eating in company are not folklore; they are the boring foundations of ordinary gut comfort.

## The fast that actually happens here

The hunger risk in our pandal is not bhog. It is **pushpanjali**. Many people take no food or water until the anjali is over, and on a crowded Ashtami morning that can run well past ten.

For most healthy adults this is unremarkable. But if you take insulin, or a sulfonylurea, or any medicine that can drop your blood sugar, a long morning fast standing in a queue deserves a conversation with your doctor **before** Ashtami — not a decision made in the line. Carry fast-acting sugar in your pocket regardless.

For everyone: drink water once the anjali is done, sit down for ten minutes, and let the bhog be lunch rather than a rescue.

## Where the trouble really comes from

Look honestly at the pujo day, and the bhog is rarely the culprit. The weight comes from what surrounds it — the evening rolls and chowmein, the cold drinks in October heat, dinner at eleven because the cultural programme overran, and four consecutive nights of five hours'' sleep.

If you want to change one thing this pujo, change the evening, not the plate at noon.

## Small things at the counter

Eat sitting down if a chair exists. Wait ten minutes before a second helping — fullness travels more slowly than a serving spoon. Drink water through the afternoon; thirst in Pune''s October sun impersonates hunger convincingly.

And glance at the food, not out of suspicion but out of sense: hot bhog should reach you hot, and payesh should be properly chilled rather than standing lukewarm through a long shift. Our volunteers manage this well, but a mass kitchen is still a mass kitchen. Devotion has no effect on bacteria.

## Three personal cautions

**Diabetes:** keep your usual meal and medicine timing as close to normal as you can, remember that khichuri with payesh is a substantial carbohydrate load, and follow your clinician''s monitoring advice — especially around the anjali fast.

**Acidity or reflux:** smaller portions, and try not to lie down for about three hours after a late dinner.

**High blood pressure, heart or kidney disease:** your doctor''s instructions on salt, fluid and medicines outrank any festival article, this one included.

Five days of freshly cooked rice, dal and vegetables, eaten at a table with people you like, is not something to apologise for. It may be the most sensibly you eat all year.

On Dashami, let the heaviness come from the dhaak falling silent — not from the plate.', '*পাঁচ দিনের খিচুড়ি, লাবড়া আর একটিই লম্বা টেবিল — আর কেন গোটা পুজোয় ভোগই আপনার সবচেয়ে স্বাস্থ্যকর খাবার।*

নবমীর আশপাশে, সাধারণত দ্বিতীয়বার হাত বাড়ানোর মুহূর্তেই মনে প্রশ্নটি আসে: পরপর পাঁচ দিন — শরীরের উপর এর প্রভাবটা ঠিক কী?

সৎ উত্তরটি স্বস্তির। ভোগ সমস্যা নয়। বরং পুজোর দিনটিতে ওটিই সম্ভবত সবচেয়ে ভালোভাবে সাজানো খাবার — আর কেন, সেটা জানা ভালো।

## পাতে আসলে কী থাকে

**খিচুড়ি** মানে চাল আর মুগ ডাল একসঙ্গে — আর এই জুটিটি চুপিসারে বুদ্ধিমান। শস্যে অ্যামাইনো অ্যাসিড লাইসিন কম পড়ে; ডালে কম পড়ে মেথিওনিন। একই গ্রাসে দুটি একসঙ্গে গেলে তারা একে অপরের ঘাটতি পূরণ করে। এই কারণেই শতাব্দীর পর শতাব্দী ধরে খিচুড়ি এ দেশের রোগীর পথ্য, বর্ষার খাবার আর মন্দিরের ভোগ।

**লাবড়া** যুক্তির অন্য অর্ধেক: এক পদে পাঁচ, ছয়, কখনও আটরকম মরসুমি সবজি। বৃহদন্ত্রের ব্যাকটেরিয়া আসলে খাদ্যতন্তু বা ফাইবারের উপরেই বাঁচে, আর রোজ একই দুটি সবজির বদলে নানা রকম গাছপালা পাতে পড়লে অন্ত্রের জীবাণু-সমাজ তুলনায় বৈচিত্র্যময় হয় বলে দেখা গেছে।

এবার সৎ কথাটি। **বেগুনি বা ভাজা তেলে ভাজা, আর পায়েস মানে দুধ-চিনি।** ওগুলি উৎসব, পুষ্টি নয়। উৎসব হিসেবেই উপভোগ করুন — তাতেও পাতটি সুগঠিত খাবারই থাকবে।

আর খেয়াল করুন, এই পাঁচ দিন পাতে কী কী থাকে না: প্যাকেটের খাবার, রেস্তোরাঁর তেল, টেবিলের বদলে মোবাইলের পর্দা। ভোগ রান্না হয়েছে সেই সকালেই, একটিই রান্নাঘরে, আর খাওয়া হচ্ছে বসে, স্বাভাবিক সময়ে, চেনা দুশো মানুষের সঙ্গে। নির্দিষ্ট সময়ে খাওয়া আর তাড়াহুড়ো না করে খাওয়া — এ কোনও লোককথা নয়, সুস্থ হজমের সাদামাটা ভিত।

## আসল উপোসটি কোথায়

আমাদের মণ্ডপে খিদের ঝুঁকি ভোগে নয়। ঝুঁকি **পুষ্পাঞ্জলিতে**। অনেকেই অঞ্জলি শেষ না হওয়া পর্যন্ত জল বা খাবার কিছুই নেন না, আর ভিড়ের অষ্টমীর সকালে তা দশটা পেরিয়ে যেতেই পারে।

সুস্থ প্রাপ্তবয়স্কদের বেশির ভাগের ক্ষেত্রে এতে বিশেষ কিছু হয় না। কিন্তু আপনি যদি ইনসুলিন নেন, কিংবা সালফোনাইলইউরিয়া বা রক্তে সুগার নামিয়ে দিতে পারে এমন কোনও ওষুধ খান, তবে লাইনে দাঁড়িয়ে দীর্ঘ সকাল উপোস করার সিদ্ধান্তটি **অষ্টমীর আগেই** চিকিৎসকের সঙ্গে আলোচনা করে নেওয়া উচিত — লাইনে দাঁড়িয়ে নয়। যা-ই হোক, পকেটে দ্রুত কাজ করে এমন শর্করা রাখুন।

সকলের জন্য: অঞ্জলি শেষ হলে জল খান, দশ মিনিট বসুন, আর ভোগকে উদ্ধারকর্তা না ভেবে দুপুরের খাওয়া হিসেবেই নিন।

## গোলমালটা আসলে কোথা থেকে আসে

পুজোর দিনটির দিকে সৎভাবে তাকালে দেখা যাবে, দোষটি ভোগের নয়। ভার আসে তার চারপাশ থেকে — সন্ধ্যার রোল আর চাউমিন, অক্টোবরের গরমে ঠান্ডা পানীয়, সাংস্কৃতিক অনুষ্ঠান গড়ানোয় এগারোটায় রাতের খাওয়া, আর পরপর চার রাত পাঁচ ঘণ্টার ঘুম।

এই পুজোয় যদি একটিমাত্র জিনিস বদলাতে চান, দুপুরের পাত নয় — সন্ধ্যাটা বদলান।

## কাউন্টারে ছোট কয়েকটি কথা

চেয়ার থাকলে বসে খান। দ্বিতীয়বার নেওয়ার আগে দশ মিনিট অপেক্ষা করুন — পেট ভরার খবর হাতার চেয়ে ধীরে পৌঁছয়। সারা দুপুর জল খান; পুনের অক্টোবরের রোদে তেষ্টা দিব্যি খিদের অভিনয় করে।

আর খাবারটির দিকে একবার তাকিয়ে নিন — সন্দেহ থেকে নয়, বিবেচনা থেকে: গরম ভোগ আপনার পাতে গরমই আসা উচিত, আর পায়েস দীর্ঘক্ষণ ঈষদুষ্ণ পড়ে না থেকে ঠান্ডা থাকা দরকার। আমাদের স্বেচ্ছাসেবকেরা এ কাজটি ভালোই সামলান, তবু বড় রান্নাঘর শেষ পর্যন্ত বড় রান্নাঘরই। ভক্তি জীবাণুর উপর কোনও কাজ করে না।

## নিজের শরীরের জন্য তিনটি সতর্কতা

**ডায়াবেটিস:** খাবার ও ওষুধের স্বাভাবিক সময় যথাসম্ভব বজায় রাখুন, মনে রাখুন খিচুড়ির সঙ্গে পায়েস মানে যথেষ্ট পরিমাণ শর্করা, এবং চিকিৎসকের নির্দেশমতো সুগার পরীক্ষা করুন — বিশেষত অঞ্জলির উপোসের দিনটিতে।

**অ্যাসিডিটি বা রিফ্লাক্স:** পরিমাণ কম রাখুন, আর রাতের খাবারের পরে প্রায় তিন ঘণ্টা শুয়ে না পড়ার চেষ্টা করুন।

**উচ্চ রক্তচাপ, হৃদ্‌রোগ বা কিডনির অসুখ:** নুন, জল ও ওষুধ নিয়ে আপনার চিকিৎসকের নির্দেশই শেষ কথা — এই লেখাটি সমেত যে কোনও উৎসবের প্রবন্ধের উপরে।

পাঁচ দিন ধরে টাটকা রান্না করা ভাত-ডাল-সবজি, প্রিয় মানুষদের সঙ্গে টেবিলে বসে খাওয়া — এর জন্য অপরাধবোধের কিছু নেই। সারা বছরে হয়তো এই পাঁচ দিনেই আপনি সবচেয়ে বুদ্ধিমানের মতো খান।

দশমীতে ভারী হয়ে উঠুক শুধু ঢাক থেমে যাওয়া মন — পেট নয়।', '/uma-media/bhog-thala.webp', 'en', 'accepted', 'sankhya-1', 12, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-uma-elo', 'uma-elo-ghore', 'poetry', 'Uma Comes Home', 'উমা এল ঘরে',
  'Haimabati Sen', 'হৈমবতী সেন', NULL, NULL, 1,
  'শরতের ভোরে উমার ঘরে ফেরার গান — একটি আগমনী কবিতা।', 'কাশফুলে ঢেউ খেলে যায় নদীর কিনারায়,  
শিউলিতলা ভরে আছে ভোরের শিশিরে,  
আকাশখানা নীল হয়েছে সাদা মেঘের নায়,  
ঢাকের আওয়াজ ভেসে আসে পাড়ার ভিতরে।  

বছর ঘুরে আবার এল মেয়ে আমার ঘরে,  
চার দিনের এই আলোর মেলা, সোনার সংসার,  
মণ্ডপে মণ্ডপে প্রদীপ জ্বলে থরে থরে,  
মায়ের মুখের হাসি দেখে জুড়োয় বুক সবার।  

দশমী এলেই মন খারাপের সিঁদুর-মাখা মেঘ,  
তবু জানি আসছে বছর আবার হবে দেখা,  
চোখের জলে মিষ্টিমুখে বিদায়ের আবেগ —  
উমা আমার ঘরের মেয়ে, থাকে না সে একা।', 'The kaash is swaying, wave on wave, along the river''s rim,  
the shiuli court lies carpeted in dawn''s first dewy light,  
the sky has turned that slower blue where white cloud-vessels swim,  
and floating in from para lanes — the dhaak, in earshot''s flight.  

The year has turned, and once again my daughter is at my door:  
four days of lamps and festival, a household spun of gold;  
in mandap after mandap burn the pradips, row on row —  
one look at Mother''s smiling face, and every heart''s consoled.  

Dashami brings its heavy sky, a sindoor-tinted cloud,  
yet this I know: the coming year will bring her back to me;  
with tear-wet eyes and sweets at lips we say farewell aloud —  
Uma is this house''s own girl. Alone she''ll never be.', '/uma-media/uma-elo-ghore.webp', 'bn', 'accepted', 'sankhya-1', 15, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-october-light', 'october-light', 'poetry', 'October Light', 'অক্টোবরের আলো',
  'Nayana Mitra', 'নয়না মিত্র', NULL, NULL, 1,
  'Twelve lines for the season of kaash and clay — waiting for the daughter of the hills to come home.', 'September folds its monsoon grey  
and hangs the morning out to dry,  
the kaash stands white along the way,  
a slower blue repaints the sky.  

In narrow lanes the patient clay  
takes shape beneath a sculptor''s care,  
who saves the eyes for Mahalaya —  
the morning breath enters the stare.  

So sweep the steps and string the light,  
let sandalwood and incense roam:  
for four gold days and starry nights  
the mountain''s daughter has come home.', 'সেপ্টেম্বর গুটিয়ে রাখে বর্ষার ধূসর শাড়ি,  
সকালটাকে মেলে দেয় নরম রোদে শুকোতে,  
পথের ধারে সাদা হয়ে দাঁড়ায় কাশের সারি,  
আকাশ মাখে ধীরে ধীরে গাঢ় নীলের ছোপ।  

সরু গলিতে ধৈর্য ধরে জমে থাকা মাটি  
শিল্পীর হাতের যত্নে একটু একটু শরীর পায়,  
চোখ দুটি তোলা থাকে মহালয়ার ভোরের জন্য —  
যে মুহূর্তে চাহনির ভিতরে নিঃশ্বাস ঢুকে যায়।  

তবে ধুয়ে রাখো সিঁড়ি, টাঙিয়ে দাও আলোর মালা,  
চন্দনের গন্ধ আর ধূপ ছড়িয়ে যাক ঘরময়:  
চারটি সোনালি দিন আর তারাভরা রাতের জন্য  
পাহাড়ের মেয়ে ঘরে ফিরেছে — এই তো সময়।', '/uma-media/october-light.webp', 'en', 'accepted', 'sankhya-1', 16, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-sona', 'sonar-dam', 'commentary', 'After Gold Crossed ₹1.5 Lakh', 'সোনা যখন দেড় লাখও ছাড়াল',
  'Rudranil Basu', 'রুদ্রনীল বসু', NULL, NULL, 1,
  'এক লাখ এখন পুরোনো মাইলফলক। কেন এতটা বাড়ল, আর দোকানে দাঁড়িয়ে ক্রেতার হিসেবটা কী হওয়া উচিত।', 'এক লাখ এখন পুরোনো মাইলফলক। ২০২৫ সালের ২২ এপ্রিল মুম্বইয়ের বাজারে ২৪ ক্যারেট সোনা প্রথম দশ গ্রামে ₹১,০১,৩৫০ ছুঁয়েছিল। ২০২৬-এর ২৮ অগস্টে IBJA-র ৯৯৯ সোনার ক্লোজিং দর দাঁড়ায় ₹১,৫৯,৫৭৮ — জিএসটি ছাড়া। অর্থাৎ গত বছর যে দাম বিস্ময় ছিল, এ বছর সেটাই ইতিহাস।

## এতটা বাড়ল কেন

প্রথম কারণ বিশ্ববাজার। ২০২৬-এর দ্বিতীয় ত্রৈমাসিকে LBMA সোনার গড় দাম ছিল আউন্সে $৪,৫০৬ — এক বছর আগের তুলনায় ৩৭ শতাংশ বেশি। যুদ্ধ, বাণিজ্য-সংঘাত, সরকারি ঋণ ও মুদ্রাস্ফীতির আশঙ্কা বিনিয়োগকারীদের এমন সম্পদের দিকে ঠেলেছে, যার মূল্য কোনও একটি সরকার বা মুদ্রার প্রতিশ্রুতির উপর দাঁড়িয়ে নেই।

দ্বিতীয় বড় ক্রেতা কেন্দ্রীয় ব্যাঙ্ক। তারা ওই ত্রৈমাসিকে নিট ২৮৯ টন সোনা কিনেছে — গত বছরের একই সময়ের তুলনায় ৬২ শতাংশ বেশি। উদ্দেশ্য স্বল্পমেয়াদি মুনাফা নয়; বৈদেশিক মুদ্রার রিজার্ভকে শুধু ডলার বা অন্য কোনও একক সম্পদের উপর নির্ভরশীল না রাখা। তবে ছবিটি একমুখী নয়: বছরের প্রথমার্ধে কেন্দ্রীয় ব্যাঙ্কের মোট কেনাকাটা ছিল ২০২২-এর পর সর্বনিম্ন।

তৃতীয় কারণ জোগান। খনি থেকে উৎপাদন বেড়েছে মাত্র ২ শতাংশ; মোট জোগান প্রায় অপরিবর্তিত। নতুন খনি আবিষ্কার থেকে উৎপাদন পর্যন্ত বহু বছর লাগে। চাহিদা হঠাৎ বাড়লে তাই তার বড় অংশ সরাসরি দামে পড়ে।

চতুর্থত, সুদ ও ডলার। সোনা নিজে কোনও সুদ দেয় না। প্রকৃত সুদের হার কমার প্রত্যাশা তৈরি হলে সোনা ধরে রাখার আপেক্ষিক খরচ কমে; ডলার বা বন্ডের ফলন বাড়লে উল্টোটাও ঘটে। দ্বিতীয় ত্রৈমাসিকে Gold ETF থেকে প্রায় ৪৫ টন বেরিয়ে যাওয়া মনে করিয়ে দেয় — এই বাজার শুধু ওঠে না, দ্রুত নামতেও পারে।

শেষ কারণটি ভারতীয়: দুর্বল টাকা। ২৮ অগস্ট ডলার-পিছু রেফারেন্স রেট ছিল প্রায় ₹৯৫.৫৬। বিশ্ববাজারে সোনা স্থির থাকলেও ডলার কিনতে বেশি টাকা লাগলে এ দেশে তার দাম বাড়ে।

## ক্রেতার হিসেব

উচ্চ দামের অভিঘাত ইতিমধ্যেই স্পষ্ট। দ্বিতীয় ত্রৈমাসিকে বিশ্বে গয়নার ব্যবহার পরিমাণে ১৭ শতাংশ কমেছে, অথচ খরচ বেড়েছে ১৪ শতাংশ — মানুষ কম সোনা কিনেও বেশি টাকা দিয়েছে।

গয়না এবং বিনিয়োগকে তাই আলাদা রাখুন। দোকানের বোর্ডে লেখা ২৪ ক্যারেটের দর ২২ ক্যারেট গয়নার শেষ দাম নয়। বিলে থাকবে সোনার নিট ওজন ও বিশুদ্ধতা, পাথরের মূল্য, মজুরি এবং মোট লেনদেনমূল্যের উপর ৩ শতাংশ GST। ছয় অঙ্কের HUID, BIS চিহ্ন ও ২২K৯১৬-এর মতো বিশুদ্ধতার ছাপ দেখে BIS Care অ্যাপে যাচাই করুন।

পুরনো গয়না বদলালে গৃহীত বিশুদ্ধতা, বাদ দেওয়া ওজন এবং নতুন মজুরি লিখিত নিন। বিনিয়োগের জন্য গয়নার বদলে নিয়ন্ত্রিত Gold ETF অধিক স্বচ্ছ; অ্যাপের "digital gold"-কে ETF ভাববেন না — SEBI এ নিয়ে সতর্ক করেছে। সামনে বিয়ে থাকলে কেনার সময় ভাগ করা দামের ঝুঁকি কমায়। বিনিয়োগকারী হলে বাজারের পিছনে না ছুটে নিজের নির্ধারিত সম্পদ-বণ্টনে স্থির থাকাই ভালো।

সোনা এখনও শ্রী, স্মৃতি ও উত্তরাধিকার। কিন্তু দশ গ্রাম যখন ₹১.৬ লাখের কাছাকাছি, তখন সে আবেগের পাশাপাশি একটি অত্যন্ত দামি আর্থিক সিদ্ধান্তও।', 'One lakh is already an old milestone. On 22 April 2025, 24-carat gold first touched ₹1,01,350 per ten grams in Mumbai. By 28 August 2026, the IBJA closing benchmark for 999 gold stood at ₹1,59,578 — before GST. Last year''s astonishing price has already become history.

## Why did it rise so far?

The first reason is the global market. The LBMA gold price averaged $4,506 an ounce in the second quarter of 2026 — 37 per cent higher than a year earlier. Wars, trade conflict, public-debt concerns and inflation risk have pushed investors towards an asset whose value does not rest upon the promise of one government or currency.

Central banks are the second major force. They purchased a net 289 tonnes during the quarter, 62 per cent more than a year earlier. Their objective is not a quick profit but reserve diversification — reducing dependence on the dollar or any other single financial asset. The picture is not entirely one-way, however: their total first-half purchases were the lowest since 2022.

Third comes supply. Mine production grew by only 2 per cent, while total supply was virtually unchanged. Discovering, approving and developing a new mine takes years. When demand rises abruptly, much of that pressure therefore passes directly into price.

Interest rates and the dollar form the fourth part of the equation. Gold pays no interest, so expectations of lower real rates reduce the opportunity cost of holding it. Stronger bond yields or a stronger dollar can reverse that calculation. The outflow of roughly 45 tonnes from Gold ETFs during the second quarter is a useful warning: this market can correct sharply even within a powerful rally.

The final reason is distinctly Indian — the rupee. On 28 August, the dollar reference rate was approximately ₹95.56. Even unchanged international gold becomes dearer here when more rupees are required to buy each dollar.

## The buyer''s calculation

The effect of high prices is already visible. Global jewellery consumption fell 17 per cent by volume during the second quarter, while spending rose 14 per cent. Consumers bought less gold and still paid more.

Jewellery and investment should therefore be treated separately. The displayed 24-carat rate is not the final price of a 22-carat ornament. The invoice must include net gold weight and purity, stones, making charges and 3 per cent GST on the total transaction value. Look for the BIS mark, the purity mark — such as 22K916 — and a six-digit HUID; verify it in the BIS Care app.

When exchanging old jewellery, obtain the accepted purity, weight deduction and new making charge in writing. For investment, a regulated Gold ETF is more transparent than jewellery. Nor should app-based "digital gold" be confused with an ETF — SEBI has specifically cautioned investors about it. If a wedding purchase is unavoidable, spreading it across several dates reduces timing risk. Investors should resist chasing the rally and remain within their predetermined asset allocation.

Gold remains memory, inheritance and Lakshmi. But near ₹1.6 lakh per ten grams, it is also a very expensive financial decision.', '/uma-media/sonar-dam.webp', 'bn', 'accepted', 'sankhya-1', 17, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-vietnam', 'vietnam-factory-lessons', 'commentary', 'What Vietnam’s Factories Are Telling Us', 'ভিয়েতনামের কারখানা কী বলছে',
  'Ishan Majumdar', 'ঈশান মজুমদার', NULL, NULL, 1,
  'Đổi Mới, seventeen trade agreements and thirty years of preparation — China-plus-one was luck, but being ready for it was policy.', '"Made in Vietnam" is no longer found only on shoes and shirts. It now appears on phones, computers, cameras and industrial machinery. The numbers behind the label are striking: Vietnam''s economy grew 8 per cent in 2025 and another 8.18 per cent year-on-year in the first half of 2026. Half-year exports reached $266.5 billion, up 21 per cent.

This did not begin with China-plus-one. It began four decades earlier.

## What the government actually changed

The 1986 **Đổi Mới**, or renovation, reforms started dismantling the command economy. Subsequent agricultural reforms gave families long-term rights to use farmland — ownership formally remained with the state — and allowed them to sell surplus produce. Food production rose, rural incomes improved and workers could gradually move from farms to factories.

The 1987 Foreign Investment Law opened the door to overseas capital. The 1999 Enterprise Law made it easier to establish private companies. WTO membership in 2007 then locked Vietnam into clearer rules on tariffs, customs, trading rights and foreign participation.

Vietnam kept opening after that. By 2025 it had 17 bilateral and regional trade agreements covering 53 countries responsible for about 87 per cent of world GDP. Those agreements reduced its average applied tariff on manufactured goods from 16.6 to 1.1 per cent. A factory in Vietnam was therefore not producing for a country of 100 million people; it was producing for the world.

## Why companies chose Vietnam

Trade access was matched by execution: export-oriented industrial zones, improving ports and roads, tax incentives, widespread electricity, strong basic education and a young workforce whose wages remained below China''s. Its long coastline and proximity to Chinese component suppliers shortened supply chains.

Foreign investment supplied more than money. It brought machinery, production systems, worker training, global customers and guaranteed orders. FDI averaged 4.8 per cent of GDP between 2015 and 2023 — higher than in Vietnam''s ASEAN peers, China or India. Disbursed FDI reached a record $13 billion in the first half of 2026.

When rising Chinese costs and trade tensions pushed companies towards a "China plus one" strategy, Vietnam was ready. Geography provided the opportunity; thirty years of policy preparation captured it.

## The unfinished revolution

The success also reveals Vietnam''s weakness. Foreign-owned firms produce 73 per cent of its exports; electronics and machinery supply nearly half. Samsung alone accounts for roughly one-fifth. Vietnam has become excellent at assembly, but too little design, intellectual property and supplier profit remains with Vietnamese firms.

Hanoi now wants the next step. Resolution 57 made science, technology and digital transformation national priorities; Resolution 68 called the private sector a principal engine of growth; and the 2025 Investment Law simplified approvals while favouring high-technology and innovative projects.

The test is no longer whether Vietnam can attract another factory. It is whether a Vietnamese company can design the product, own the technology and sell it under its own name.

For India, that is the useful lesson. Factories follow market access, infrastructure, skilled workers and rules that survive the next announcement. China-plus-one was luck. Being ready for it was policy.', '"মেড ইন ভিয়েতনাম" এখন শুধু জুতো বা জামার লেবেলে নয়; মোবাইল ফোন, কম্পিউটার, ক্যামেরা ও শিল্পযন্ত্রেও। লেবেলটির পিছনের সংখ্যাগুলি আরও চমকপ্রদ। ২০২৫ সালে ভিয়েতনামের অর্থনীতি বেড়েছে ৮ শতাংশ; ২০২৬-এর প্রথম ছয় মাসে বৃদ্ধির হার ৮.১৮ শতাংশ। ওই ছয় মাসেই পণ্য রপ্তানি হয়েছে $২৬৬.৫ বিলিয়ন — এক বছর আগের তুলনায় ২১ শতাংশ বেশি।

এই উত্থান China-plus-one দিয়ে শুরু হয়নি। তার ভিত তৈরি হয়েছিল চার দশক আগে।

## সরকার আসলে কী বদলেছিল

১৯৮৬ সালের **Đổi Mới** বা নবায়ন সংস্কার কেন্দ্রীয়ভাবে নিয়ন্ত্রিত অর্থনীতির বাঁধন আলগা করতে শুরু করে। পরবর্তী কৃষি-সংস্কারে পরিবারগুলিকে জমির দীর্ঘমেয়াদি ব্যবহারাধিকার দেওয়া হয় — মালিকানা রাষ্ট্রের কাছেই থাকে — এবং উদ্বৃত্ত ফসল বাজারে বিক্রির সুযোগ তৈরি হয়। খাদ্য উৎপাদন ও গ্রামের আয় বাড়ে; ধীরে ধীরে কৃষি থেকে শ্রমিক আসে কারখানায়।

১৯৮৭ সালের Foreign Investment Law বিদেশি পুঁজির দরজা খোলে। ১৯৯৯ সালের Enterprise Law বেসরকারি সংস্থা তৈরি সহজ করে। ২০০৭ সালে WTO-তে যোগ দিয়ে ভিয়েতনাম শুল্ক, কাস্টমস, ব্যবসার অধিকার ও বিদেশি বিনিয়োগের বহু নিয়ম আন্তর্জাতিক কাঠামোয় বেঁধে ফেলে।

তারপরও দরজা খোলা থামেনি। ২০২৫ নাগাদ ভিয়েতনামের ১৭টি দ্বিপাক্ষিক ও আঞ্চলিক বাণিজ্যচুক্তি ৫৩টি দেশকে জুড়েছে — যাদের সম্মিলিত অর্থনীতি বিশ্বের GDP-র প্রায় ৮৭ শতাংশ। এই চুক্তিগুলি শিল্পপণ্যে ভিয়েতনামের গড় কার্যকর শুল্ক ১৬.৬ শতাংশ থেকে ১.১ শতাংশে নামিয়েছে। ফলে ভিয়েতনামের কারখানা শুধু দশ কোটি মানুষের দেশের জন্য নয়, গোটা বিশ্বের জন্য উৎপাদন করতে পারে।

## কারখানাগুলি সেখানে গেল কেন

বাজারে প্রবেশাধিকারের পাশে ছিল বাস্তব প্রস্তুতি: রপ্তানিমুখী শিল্পাঞ্চল, উন্নত বন্দর ও সড়ক, কর-সুবিধা, সর্বব্যাপী বিদ্যুৎ, শক্তিশালী প্রাথমিক শিক্ষা এবং চীনের তুলনায় কম মজুরির তরুণ শ্রমশক্তি। দীর্ঘ সমুদ্রতট ও চীনের যন্ত্রাংশ-সরবরাহকারীদের নৈকট্যও পরিবহণের সময় কমিয়েছে।

বিদেশি বিনিয়োগ শুধু টাকা আনেনি; এনেছে যন্ত্র, উৎপাদন-পদ্ধতি, প্রশিক্ষণ, বিদেশি ক্রেতা এবং নিশ্চিত অর্ডার। ২০১৫–২৩ সময়ে FDI ছিল বছরে গড়ে GDP-র ৪.৮ শতাংশ — ভিয়েতনামের ASEAN প্রতিবেশী, এমনকি ভারত ও চীনের চেয়েও বেশি। ২০২৬-এর প্রথমার্ধে বাস্তবায়িত FDI ছুঁয়েছে রেকর্ড $১৩ বিলিয়ন।

চীনে খরচ বাড়া এবং বাণিজ্য-সংঘাতের পরে বহুজাতিক সংস্থাগুলি যখন China-plus-one খুঁজল, ভিয়েতনাম প্রস্তুত ছিল। সুযোগটি দিয়েছে ভূগোল; তাকে কাজে লাগিয়েছে তিরিশ বছরের নীতি।

## অসমাপ্ত বিপ্লব

এই সাফল্যের মধ্যেই দুর্বলতা রয়েছে। বিদেশি মালিকানাধীন সংস্থাগুলি ভিয়েতনামের ৭৩ শতাংশ রপ্তানি করে; ইলেকট্রনিক্স ও যন্ত্রপাতি দেয় প্রায় অর্ধেক। শুধু Samsung-এর অংশই প্রায় এক-পঞ্চমাংশ। অ্যাসেম্বলিতে ভিয়েতনাম দক্ষ হয়েছে, কিন্তু নকশা, মেধাস্বত্ব এবং সরবরাহকারীর লাভের খুব কম অংশ দেশীয় সংস্থার হাতে থাকে।

তাই নতুন নীতির লক্ষ্য বদলাচ্ছে। Resolution 57 বিজ্ঞান, প্রযুক্তি ও ডিজিটাল রূপান্তরকে জাতীয় অগ্রাধিকার দিয়েছে; Resolution 68 বেসরকারি ক্ষেত্রকে বৃদ্ধির প্রধান চালক বলেছে; ২০২৫-এর Investment Law অনুমোদনের প্রক্রিয়া সরল করে উচ্চপ্রযুক্তি ও উদ্ভাবনী বিনিয়োগকে উৎসাহ দিয়েছে।

এখন পরীক্ষা আর একটি বিদেশি কারখানা আনা নয়। পরীক্ষা হল — পণ্যটির নকশা কি কোনও ভিয়েতনামি সংস্থা করবে, প্রযুক্তির মালিক হবে এবং নিজের নামে বিশ্ববাজারে বিক্রি করবে?

ভারতের জন্য শিক্ষাটি সেখানেই। কারখানা আসে বাজারে প্রবেশাধিকার, পরিকাঠামো, দক্ষ শ্রমিক এবং স্থায়ী নিয়মের পিছনে। China-plus-one ছিল সুযোগ; তার জন্য প্রস্তুত থাকাটা ছিল নীতি।', '/uma-media/vietnam.webp', 'en', 'accepted', 'sankhya-1', 18, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-alpona', 'lakshmir-pa', 'art', 'The Footprints Made with a Fist', 'মুঠোর ছাপে লক্ষ্মীর পা',
  'Gauri Majumdar', 'গৌরী মজুমদার', NULL, 1,
  'কোজাগরী পূর্ণিমার উঠোনে ঠাকুমার কাছে শেখা — লক্ষ্মীর পা আঁকা হয় না, ছাপা হয়। একটি গোল মুঠো, পাঁচটি আঙুলের টিপ, আর সব পায়ের মুখ ঘরের দিকে।', 'পূর্ব বর্ধমানের এক ছোট্ট গ্রামে কোজাগরী পূর্ণিমার বিকেল। ধানখেতের উপর রোদ তখন নরম হয়ে এসেছে। নিকোনো উঠোন শুকিয়ে খয়েরি; দাওয়ায় নারকেল নাড়ু ঠান্ডা হচ্ছে। মেঘলা স্টিলের বাটিতে সাদা পিটুলি নিয়ে বসে একটা পাতলা তুলি খুঁজছিল।

ঠাকুমা হেসে বললেন, "লক্ষ্মীর পা আঁকতে তুলি লাগে না।"

উঠোনের একধারে তখন পদ্ম আর ধানের শিষের আলপনা তৈরি। বাকি শুধু দরজা থেকে ঠাকুরঘর পর্যন্ত ছোট ছোট পায়ের ছাপ — যেন সন্ধ্যা নামলে দেবী সেই পথ ধরেই ঘরে আসবেন।

এই পায়ের ছাপের কৌশলটাই চমৎকার: পা দু''টি আসলে আঁকা নয়, ছাপা।

চাল ভিজিয়ে মিহি বেটে জল মিশিয়ে তৈরি হয় পিটুলি। মিশ্রণ এমন হবে যাতে মুঠোর গায়ে সাদা আস্তরণ ধরে, অথচ মেঝেতে ছাপ ফেললে চারদিকে গড়িয়ে না যায়।

প্রথমে চার আঙুল আলগোছে ভাঁজ করে ছোট্ট গোল মুঠো করুন। মুঠোর কনিষ্ঠার দিকের গোল অংশটি পিটুলিতে হালকা ছুঁইয়ে মেঝেতে একবার চাপুন। তৈরি হবে পায়ের তলার মতো ছোট্ট ছাপ। অনেক বাড়িতে এরপর আঙুলের ডগায় পিটুলি নিয়ে সামনে পাঁচটি বিন্দু বসানো হয় — পায়ের আঙুল।

একটি ডান, তার একটু সামনে একটি বাঁ — এইভাবে জোড়া জোড়া ছাপ সদর থেকে ঠাকুরের আসনের দিকে এগোবে। সব পায়ের মুখ থাকবে ঘরের ভিতরের দিকে।

বেশি পিটুলি নিলে ছাপ থ্যাবড়ে যাবে; বেশি চাপ দিলে মুঠোর খাঁজ হারিয়ে যাবে। তাই ঠাকুমা প্রথম ছাপটি উঠোনের এক কোণে পরীক্ষা করে নিলেন। আলপনার বড় নকশায় হাত কাঁপলেও চোখ এড়িয়ে যায়; লক্ষ্মীর এই ছোট্ট পায়ে সামান্য ভুলও ধরা পড়ে।

মেঘলা দ্বিতীয় জোড়াটি করল। একটি পা বড়, অন্যটি ছোট। সে ভয়ে ভয়ে ঠাকুমার মুখের দিকে তাকাতেই ঠাকুমা বললেন, "অত মাপজোক করলে দেবী পথ চিনবেন কী করে? এ তো আমাদের বাড়ির পথ।"

সন্ধ্যা ঘনিয়ে এল। পুকুরপাড় থেকে শাঁখের শব্দ উঠল, উঠোনে ভেসে এল ধূপের গন্ধ। সাদা পায়ের সারি অন্ধকার দরজা পেরিয়ে আলো-জ্বলা ঠাকুরঘরে ঢুকে গেল।

বাড়ি ছেড়ে বহু দূরে থাকা মানুষ পরে হয়তো নকশার সব পাপড়ি ভুলে যায়। কিন্তু এই ছোট্ট কৌশলটি ভোলে না — একটি গোল মুঠো, পাঁচটি আঙুলের টিপ, আর সব পায়ের মুখ ঘরের দিকে।

অদ্ভুত, যে পা ঘরে আসার, তার ছাপ রেখে যায় হাত। আর সেই হাতের স্মৃতিই একদিন দূরে থাকা মানুষকে আবার গ্রামের উঠোনে ফিরিয়ে আনে।', 'It is the afternoon of Kojagari Purnima in a small village in Purba Bardhaman. The sunlight over the paddy fields has begun to soften. A freshly swept courtyard is drying to a deep earthen brown, while coconut naru cools on the veranda. Meghla sits beside a steel bowl of white rice paste, searching for a thin brush.

Her grandmother smiles. "You do not need a brush for Lakshmi''s feet."

At one end of the courtyard, an alpona of lotuses and rice stalks is already taking shape. Only the little footprints remain — the ones that will travel from the entrance towards the shrine, as though the goddess might follow them into the house after dusk.

The delightful secret is that these feet are not really drawn. They are printed.

Rice is soaked, ground smooth and mixed with water to make the white paste. It must be thick enough to coat the hand, but not so wet that a print spreads across the floor.

Curl four fingers into a small, relaxed fist. Lightly coat the rounded outer edge — the side below the little finger — and press it once against the floor. The mark resembles the sole of a tiny foot. In many homes, five dots of paste are then placed above it with a fingertip to make the toes.

Stamp one right foot, then a left foot slightly ahead of it, continuing in pairs from the outer door towards the place of worship. Every pair must face inward.

Too much paste produces a shapeless puddle; too much pressure erases the delicate creases of the fist. Grandmother therefore tests the first print in an unnoticed corner. A wavering line may disappear inside a large alpona, but a tiny footprint reveals every hesitation.

Meghla attempts the second pair. One foot is large and the other small. She looks anxiously at her grandmother.

"If you measure everything," Grandmother says, "how will the goddess recognise the path? This is the path to our house."

Evening settles over the village. A conch sounds somewhere beyond the pond; incense drifts across the courtyard. The small white footprints cross the dark threshold and enter the lamplit shrine.

Years later, someone living far from home may forget the exact petals of the lotus or the turn of every vine. This little technique remains: one rounded fist, five fingertip dots and every pair of feet facing homeward.

How curious that the footprints of an arriving goddess are left by a hand — and that the hand''s memory can one day lead us back to a village courtyard.', '/uma-media/lakshmir-pa.webp', 'bn', 'accepted', 'sankhya-1', 1, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-kumortuli', 'kumortuli', 'art', 'Kumortuli, Where Goddesses Are Grown', 'কুমোরটুলি: যেখানে দেবী গড়ে ওঠেন',
  'Ishan Ray', 'ঈশান রায়', NULL, 1,
  'Before the colours and the eyes, Durga receives two skins of clay — one to hold her body together, another to remember the curve of a smile.', '*Before the colours and the eyes, Durga receives two skins of clay — one to hold her body together, another to remember the curve of a smile.*

On an Ashwin afternoon in a small Bankura town, a lorry noses into the club ground. The carrom game stops. Tea cools untouched in clay cups. Before the dhaak, before the lights, Pujo arrives beneath a tarpaulin, carrying the smell of damp earth and straw.

When the covering is lifted, everyone sees Durga''s painted face. No one sees the two different clays beneath it.

Weeks earlier, in a narrow Kumortuli workshop, the body began as *kathamo* — a base of wood and bamboo. Straw was bundled and tied into a *bena*: shoulders, waist, the curve of the lion, the crouch of Mahishasura. This was not yet sculpture. It was the hidden engineering that made a large idol possible to build and to transport.

Then came the first clay: sticky *entel mati* mixed with *tush*, or rice husk. The fibrous mixture grips the straw and allows the artisan to build volume. At this stage Durga is deliberately rough. A thumb''s hollow may become a waist; one firm press may establish a shoulder.

Beauty can wait. The first coat''s work is to hold.

Only after that layer dries does the second clay arrive — *bele mati*. Finer and smoother, it covers the fibrous surface, closes small cracks and accepts detail. Under the artisan''s damp fingers, a blunt ridge becomes a collarbone; a narrow wooden tool finds the edge of an eyelid. Even when a face begins in a mould, its final expression is refined by hand.

The first clay builds the body. The second teaches it how to be seen.

Recipes and working methods differ between studios, but the craft everywhere solves the same problem: no single material can be asked for strength and delicacy in the same measure. The rough coat must cling to straw; the finishing coat must remember the curve of a lip.

Back in Bankura, the idol is lifted from the lorry. The club''s older members call instructions; children hover just beyond the ropes. Soon there will be fabric, flowers, incense and noise. By Shashthi, no trace of bamboo, husk or the artisan''s thumb will remain.

That disappearance is part of the mastery. Kumortuli''s greatest trick is not making clay visible, but making all the labour beneath the goddess vanish.

Years later, someone living far from that club ground may forget the pandal''s theme or the colour of its lights. But the smell released when the tarpaulin rose — the mingling of straw and damp clay — can return an entire autumn.

Perhaps the goddess begins there: not with paint or ornaments, but at the instant an artisan decides which clay must hold her, and which clay must remember her smile.', '*রং আর চোখের আগেই দেবী পান মাটির দুই ত্বক — একটি তাঁর শরীর ধরে রাখে, অন্যটি মনে রাখে হাসির বাঁক।*

আশ্বিনের এক বিকেলে বাঁকুড়ার ছোট্ট শহরের ক্লাবমাঠে লরিটি ঢুকতেই ক্যারমের গুটি থেমে যায়। মাটির ভাঁড়ে চা ঠান্ডা হতে থাকে। ঢাক আসার আগে, আলো জ্বলার আগে, ত্রিপলের নীচে ভেজা মাটি আর খড়ের গন্ধ নিয়ে পুজো এসে পৌঁছয়।

ত্রিপল সরলে সকলে দেখবে দুর্গার রাঙানো মুখ। কিন্তু সেই মুখের নীচে লুকিয়ে থাকা দুই রকম মাটি কেউ দেখবে না।

কয়েক সপ্তাহ আগে কুমোরটুলির সরু কর্মশালায় শরীরটির শুরু হয়েছিল কাঠামো দিয়ে — কাঠের পাটাতন ও বাঁশের কঙ্কাল। তার গায়ে দড়ি দিয়ে বাঁধা খড়ের বেনা: কাঁধ, কোমর, সিংহের পিঠ, মহিষাসুরের ঝুঁকে থাকা ধড়। এ তখনও ভাস্কর্য নয়; বড় প্রতিমাকে গড়া ও বয়ে নিয়ে যাওয়ার গোপন কারিগরি।

তারপর প্রথম মাটি — তুষ মেশানো আঠালো এঁটেল মাটি। আঁশযুক্ত এই মিশ্রণ খড়ের গায়ে আটকে শরীরের আয়তন তৈরি করে। এই পর্বে দেবী ইচ্ছে করেই অমসৃণ। বুড়ো আঙুলের এক চাপে কোমরের খাঁজ, তালুর ধাক্কায় কাঁধের ঢাল।

সৌন্দর্য পরে আসবে; প্রথম মাটির কাজ শরীরটিকে ধরে রাখা।

সেই প্রলেপ শুকোলে আসে দ্বিতীয় মাটি — বেলে মাটি। তুলনায় মিহি ও মসৃণ এই স্তর তুষের খসখসে ভাব ঢেকে দেয়, ছোট ফাটল ভরাট করে, সূক্ষ্ম গড়ন ফুটিয়ে তোলে। কারিগরের ভেজা আঙুলে উঁচু মাটির রেখা হয়ে ওঠে কণ্ঠার হাড়; সরু কাঠের হাতিয়ারে বেরিয়ে আসে চোখের পাতার কিনারা। মুখ ছাঁচে তৈরি হলেও তার শেষ অভিব্যক্তি হাতেই গড়া হয়।

প্রথম মাটি শরীর বানায়। দ্বিতীয় মাটি তাকে দৃশ্যমান করে।

কর্মশালাভেদে উপকরণ ও পদ্ধতিতে কিছু পার্থক্য থাকে। কিন্তু সমস্যাটি সর্বত্র এক: যে স্তর খড়কে আঁকড়ে ধরবে, তার কাছে ঠোঁটের সূক্ষ্ম বাঁকও একইভাবে চাওয়া যায় না। একটি মাটি শক্তির জন্য, অন্যটি সৌন্দর্যের জন্য।

বাঁকুড়ার মাঠে ততক্ষণে প্রতিমা নামছে। বড়রা নির্দেশ দিচ্ছেন, ছোটরা দড়ির বাইরে দাঁড়িয়ে। ষষ্ঠীর দিনে কাপড়, ফুল, ধূপ আর আলোয় বাঁশ, তুষ, দড়ি — সব অদৃশ্য হয়ে যাবে।

এই অদৃশ্য করে দেওয়াটাই কুমোরটুলির আসল জাদু।

বহু বছর পরে, বাড়ি থেকে দূরে থাকা কেউ হয়তো সেই মণ্ডপের থিম বা আলোর রং ভুলে যাবেন। কিন্তু ত্রিপল ওঠার মুহূর্তে বেরিয়ে আসা খড় আর সোঁদা মাটির গন্ধে একটি গোটা শরৎ ফিরে আসতে পারে।

দেবীর জন্ম বোধহয় রং বা অলংকারে নয় — সেই মুহূর্তে, যখন কারিগর ঠিক করেন কোন মাটি তাঁকে ধরে রাখবে, আর কোন মাটি মনে রাখবে তাঁর হাসির বাঁক।', '/uma-media/kumortuli-mukh.webp', 'en', 'accepted', 'sankhya-1', 2, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-laal-paar', 'laal-paar-shada', 'fashion', 'White, Edged in Red', 'লাল পাড়ে সাদা',
  'Shailaja Ray', 'শৈলজা রায়', NULL, 1,
  'সব লাল-পাড় সাদা শাড়ি গরদ নয় — রং ছাড়িয়ে সুতো ও বুননে তাদের চিনে নেওয়ার গল্প।', '*সব লাল-পাড় সাদা শাড়ি গরদ নয় — রং ছাড়িয়ে সুতো ও বুননে তাদের চিনে নেওয়ার গল্প।*

অষ্টমীর ভোরে রঘুনাথগঞ্জের বাড়িটায় তখনও রোদ ঢোকেনি। উঠোনে শিউলি কুড়োনো শেষ, দূরের মণ্ডপ থেকে মাইকে চণ্ডীপাঠ ভেসে আসছে। ঠাকুমা কাঠের আলমারির পাল্লা খুলতেই বেরিয়ে এল নিমপাতা, চন্দন আর বহু পুজো ধরে জমে থাকা এক অদ্ভুত গন্ধ।

মেঘ তিনটি লাল-পাড় সাদা শাড়ি নামিয়ে জিজ্ঞেস করল, "কোন গরদটা পরবে?"

ঠাকুমা হেসে বললেন, "সব লাল-পাড় সাদাই গরদ নয় রে।"

সেই এক বাক্যে শুরু হল শাড়ি চেনার পাঠ।

প্রথম শাড়িটি সুতির তাঁত। তার জমি ধবধবে সাদা, আঙুলে শুকনো ও হালকা; আলো পড়লে ঝিকমিক না করে যেন আলোটুকু শুষে নেয়। গরমে আরাম, সহজে ভাঁজ পড়ে — সপ্তমীর সকাল থেকে পাড়ার ভোগ বিলি পর্যন্ত, সবেতেই তার অবাধ যাতায়াত। কিন্তু লাল পাড় আছে বলেই তাকে গরদ বলা যাবে না।

দ্বিতীয়টি গরদ — মুর্শিদাবাদ ও বীরভূমের রেশমি ঐতিহ্য। ঠাকুমা শাড়ির জমিতে হাত বুলিয়ে দেখালেন, তার সাদা রং আসলে সাদা নয়; রং না-করা রেশমের নিজস্ব ঘিয়ে বা হাতির দাঁতের আভা। পাড় সাধারণত লাল কিংবা মেরুন, নকশা সংযত; জমিতে ছোট বুটি থাকতেও পারে। গরদের সৌন্দর্য তার চাকচিক্যে নয় — তার শান্ত, স্বাভাবিক দীপ্তিতে।

তৃতীয় শাড়িটি কোরিয়াল। গরদের ঘনিষ্ঠ আত্মীয়, কিন্তু তার লাল পাড় আরও গাঢ়, স্পষ্ট ও জমাট। অনেক কোরিয়ালে আঁচল ও পাড়ে বুননের কাজও বেশি চোখে পড়ে। দূর থেকে দুটিকে একই মনে হতে পারে; পাশাপাশি রাখলেই বোঝা যায় — গরদ কথা বলে নিচু স্বরে, কোরিয়াল একটু উৎসব করে বলে।

"তাহলে দোকানে চিনব কী করে?" মেঘ জিজ্ঞেস করল।

"শুধু রং দেখে কিনবি না," ঠাকুমা বললেন। "সুতো কী, কোথায় বোনা, সেটা জিজ্ঞেস করবি। গরদ বললেই সত্যিই সিল্ক কি না দেখবি। আর খুব নীলচে ধবধবে সাদা ও কাচের মতো কড়া ঝিলিক দেখলে সাবধান হবি।"

গরদ ও কোরিয়াল — দুটি নামই আজ ভৌগোলিক নির্দেশক বা GI স্বীকৃতির আওতায়। অর্থাৎ এগুলি শুধু লাল-সাদার সাজ নয়; নির্দিষ্ট অঞ্চল, উপকরণ ও তাঁতশিল্পের পরিচয় বহন করে।

টিপ, সিঁদুর, সোনার গয়না — সবই পরার মানুষের পছন্দ; কোনওটিই শাড়ির পরিচয়পত্র নয়। শাড়িকে চিনতে হয় তার সুতোয়, বুননে আর জমির আলোয়।

ঠাকুমা শেষ পর্যন্ত পুরোনো গরদটিই তুললেন। আঁচল মেলতেই ভাঁজের ভিতর থেকে বেরোল একটি বিবর্ণ শিউলির ডাঁটি — কোন অষ্টমীর, কেউ আর মনে করতে পারল না।

বহু বছর পরে, বাড়ি থেকে অনেক দূরে কোনও শরতের সকালে মেঘ হয়তো সেই শাড়ির ভাঁজ খুলবে। শিউলিটি থাকবে না। কিন্তু নিমপাতার গন্ধ, মাইকের চণ্ডীপাঠ আর ঠাকুমার আঙুলের স্পর্শ — সব ফিরে আসবে।

কাপড় স্মৃতি ধরে রাখে না, এমন কথা কে বলেছে?', '*Not every white sari with a red border is Garad — the difference lies beyond colour, in fibre, weave and light.*

On the morning of Ashtami, the sun had not yet entered the house in Raghunathganj. Shiuli flowers had been gathered from the courtyard, and the morning''s Chandipath drifted from a distant pandal. When Grandmother opened the wooden wardrobe, it released the mingled scent of dried neem leaves, sandalwood and many Pujos stored together.

Megh brought down three white saris with red borders. "Which Garad will you wear?"

Grandmother smiled. "Not every red-bordered white sari is Garad."

And so began the lesson.

The first was cotton taant — light, dry beneath the fingers and cool against the skin. Its white body absorbed the morning light instead of shining in it. Comfortable through crowded pandals and long afternoons serving bhog, it spoke the same red-and-white language. But colour alone could not make it Garad.

The second was Garad, part of the silk-weaving tradition of Murshidabad and Birbhum. Grandmother spread it across the bed. Its body was not the sharp white of bleached cloth, but the warm ivory of silk left in its natural colour. The border was red or maroon, the ornament restrained; small woven motifs might appear across the field. Its beauty lay in a quiet, almost inward lustre.

The third was Korial, Garad''s close relative. Its red border appeared deeper, stronger and more solid; many examples carried more noticeable woven decoration along the border and anchal. From across a room the two could resemble each other. Side by side, their temperaments differed: Garad spoke softly; Korial entered the festivities.

"How will I know in a shop?" Megh asked.

"Do not buy a name merely because the colours match," Grandmother replied. "Ask what the fibre is and where it was woven. If it is called Garad, confirm that it really is silk. Be cautious of an unnaturally blue-white body or a hard, glassy shine."

Garad and Korial both come under Geographical Indication recognition today. They are not simply festive colour combinations, but textiles connected to particular materials, looms and weaving regions.

A red bindi, sindoor or gold jewellery may complete someone''s chosen look; none of them defines the sari. Its identity lives in the thread, the weave and the way its surface receives light.

Grandmother chose the old Garad. As its folds opened, a faded shiuli stem slipped onto the bed. No one could remember which Ashtami had left it there.

Years later, on an autumn morning far from home, Megh might unfold that sari again. The flower would be gone. Yet the neem-scented wardrobe, the distant Chandipath and Grandmother''s fingertips would return.

Who says cloth cannot remember?', '/uma-media/laal-paar-shada.webp', 'bn', 'accepted', 'sankhya-1', 3, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-panjabi', 'pujo-panjabi-guide', 'fashion', 'A Gentleman''s Guide to the Pujo Panjabi', 'পুজোর পাঞ্জাবি-নামা',
  'Somesh Dutta', 'সোমেশ দত্ত', NULL, 1,
  'The colour may win your heart, but the shoulders decide whether a Panjabi truly belongs to you.', '*The colour may win your heart, but the shoulders decide whether a Panjabi truly belongs to you.*

On Panchami night in Katwa, the market had pulled down its shutters. Only the neighbourhood tailor''s shop remained awake. Inside, the pedal machine rattled like a late local train, loose threads covered the floor, and brown-paper parcels waited beneath names written in blue pencil.

Anirban had come to collect the first Pujo Panjabi bought with his own salary. It was deep indigo, with restrained embroidery at the collar. His father admired the colour. The tailor ignored it and pressed a finger against the shoulder seam.

"A Panjabi is chosen at the shoulder," he said. "Everything below can still be persuaded."

That is the first rule worth remembering. The seam should meet the natural edge of the shoulder. If it hangs down the arm, the Panjabi will droop; if it stops too far inward, the sleeve and chest will pull. Length, sleeve and side width are comparatively straightforward to alter. Resetting a shoulder means disturbing the armhole and sleeve — and becomes especially difficult when embroidery crosses the seams.

Once the shoulder fits, perform the tailor''s **three Pujo tests**.

First, fold your arms across your chest, as though handing a plate across the bhog counter. The back should allow the movement without the front placket gaping.

Next, raise your joined palms towards your forehead, as at anjali. The armholes should not bite, and the entire garment should not climb towards your chest.

Finally, sit on a low stool — or cross-legged if you comfortably can. The side slits should open without pulling the buttons or trapping the thighs.

A Panjabi that passes all three will survive more than a fitting-room mirror.

Fabric answers a different question: when will you wear it? Cotton and linen breathe well through warm afternoons. Silk-cotton brings a little ceremony without excessive weight. Tussar suits an evening beautifully, though its natural character is not a polished golden glare; undyed tussar tends towards warm beige or copper, with a more textured, subdued lustre than mulberry silk.

Below it, choose according to movement and mood: pyjama, churidar, dhoti or well-fitted trousers. Even jeans can work for pandal-hopping when the colours and proportions agree. Tradition is not weakened by comfortable shoes — particularly when volunteer duty runs from shifting benches and water drums to walking a lost child back to their family.

Anirban''s Panjabi passed all three tests. The tailor folded it around a sheet of newspaper and tied the parcel with cotton string.

Years later, on a Panchami evening far from Katwa, Anirban may no longer remember what the Panjabi cost. But each time he fastens its collar, he will hear that pedal machine beyond the half-closed shutter and his father saying, "Stand straight. Let him see the shoulder."

Some clothes are made to fit the body. The fortunate ones also fit a memory.', '*রং মন জয় করতে পারে, কিন্তু পাঞ্জাবিটি সত্যিই আপনার কি না — সেটা ঠিক করে তার কাঁধ।*

পঞ্চমীর রাতে কাটোয়ার বাজারে একে একে সব দোকানের ঝাঁপ নেমে গেছে। জেগে আছে শুধু বাজারপাড়ার দর্জির দোকান। ভিতরে পায়ে-চালানো মেশিনটা শেষ লোকাল ট্রেনের মতো ছুটছে, মেঝেতে সুতোর টুকরো, আর নীল পেনসিলে নাম লেখা বাদামি কাগজের প্যাকেটগুলি অপেক্ষা করছে।

অনির্বাণ এসেছে নিজের প্রথম বেতনের টাকায় কেনা পুজোর পাঞ্জাবিটি নিতে। গাঢ় নীল রং, গলার কাছে সামান্য কাজ। বাবা রংটির প্রশংসা করলেন। দর্জি সে দিকে না তাকিয়ে কাঁধের সেলাইয়ে আঙুল রাখলেন।

"পাঞ্জাবি কিনতে হয় কাঁধ দেখে," বললেন তিনি। "নীচের দিকটা পরে বোঝানো যায়।"

মনে রাখার মতো প্রথম নিয়ম এটিই। কাঁধের সেলাই বসবে কাঁধের হাড় যেখানে শেষ হয়েছে, তার কাছাকাছি। সেলাই বাহুর দিকে নেমে গেলে পাঞ্জাবি ঝুলে পড়বে; বেশি ভিতরে থাকলে বুক ও হাতার কাপড়ে টান পড়বে। লম্বা, হাতা কিংবা পাশের বাড়তি কাপড় তুলনায় সহজে ঠিক করা যায়। কিন্তু কাঁধ বদলাতে গেলে হাতা ও আর্মহোল নতুন করে বসাতে হয় — সেলাইয়ের কাছে কারুকাজ থাকলে কাজটি আরও কঠিন।

কাঁধ ঠিক হলে করুন দর্জির **পুজোর তিন পরীক্ষা**।

প্রথমে দুই হাত বুকের উপর আড়াআড়ি করুন — যেন ভোগের কাউন্টার পেরিয়ে কারও হাতে প্লেট দিচ্ছেন। পিঠে টান পড়বে না, সামনের বোতামের ফাঁকও হাঁ হয়ে যাবে না।

এবার অঞ্জলির মতো জোড়হাত কপালের দিকে তুলুন। আর্মহোল বগলে কামড়াবে না, গোটা পাঞ্জাবিও বুকের দিকে উঠে আসবে না।

শেষে নিচু টুলে বসুন — স্বচ্ছন্দ হলে মেঝেতে পা মুড়ে। পাশের চেরা সহজে খুলবে; বোতামে টান কিংবা ঊরুতে কাপড়ের বাধা পড়বে না।

যে পাঞ্জাবি এই তিন পরীক্ষায় পাশ করে, সে শুধু আয়নার সামনে নয় — গোটা পুজোতেই সঙ্গ দেবে।

কাপড় বাছবেন কখন পরবেন ভেবে। গরম দুপুরে সুতি ও লিনেন আরামদায়ক। সিল্ক-কটনে উৎসবের আভা আসে, ওজন বেশি লাগে না। সন্ধ্যায় তসর সুন্দর; তবে তসরের স্বাভাবিক রং কাচের মতো চকচকে সোনা নয়। রং না-করা তসরে থাকে উষ্ণ বেজ বা তামাটে আভা, মুগা বা মালবেরি রেশমের তুলনায় তার দীপ্তি একটু সংযত, গঠনও বেশি টেক্সচারযুক্ত।

নীচে পাজামা, চুড়িদার, ধুতি কিংবা ছিমছাম ট্রাউজার্স — পছন্দ করুন চলাফেরা ও উপলক্ষ দেখে। রং ও মাপের ভারসাম্য থাকলে প্যান্ডেল ঘোরার সঙ্গে জিনসও দিব্যি মানিয়ে যায়। আর স্বেচ্ছাসেবকের কাজ যদি বেঞ্চ সরানো থেকে হারানো শিশুকে বাড়ি পৌঁছে দেওয়া পর্যন্ত হয়, আরামদায়ক জুতো ঐতিহ্যের কোনও ক্ষতি করে না।

অনির্বাণের পাঞ্জাবিটি তিন পরীক্ষাতেই পাশ করল। দর্জি খবরের কাগজে মুড়ে সুতলি দিয়ে প্যাকেটটি বাঁধলেন।

বহু বছর পরে, কাটোয়া থেকে অনেক দূরে কোনও পঞ্চমীর সন্ধ্যায় অনির্বাণ হয়তো পাঞ্জাবিটির দাম মনে করতে পারবে না। কিন্তু গলার বোতাম লাগাতে গেলেই শুনতে পাবে অর্ধেক নামানো ঝাঁপের ওপারে সেই মেশিনের শব্দ — আর বাবার গলা, "সোজা হয়ে দাঁড়া। কাঁধটা দেখতে দে।"

কিছু পোশাক শরীরের মাপে তৈরি হয়। ভাগ্যবান পোশাকগুলি স্মৃতির মাপেও ঠিক বসে।', '/uma-media/pujo-panjabi.webp', 'en', 'accepted', 'sankhya-1', 4, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-probash', 'probasher-ashtami', 'stories', 'An Ashtami Away from Home', 'প্রবাসের অষ্টমী',
  'Shankar Maitra', 'শঙ্কর মৈত্র', NULL, 1,
  'ভিডিও কলের এপারে পুনের ফ্ল্যাট, ওপারে কালনার মণ্ডপ — ফুল ছাড়া অঞ্জলি, আর একটি জানলা খুলে দেওয়ার অনুরোধ।', 'অফিসের ক্যালেন্ডারে দিনটার নাম বুধবার। অয়নের ক্যালেন্ডারে — অষ্টমী।

সকাল ন''টায় দুটো মিটিং সরিয়ে সে ফোনের অপেক্ষায় বসেছিল। সাড়ে ন''টায় মা ফোন করলেন কালনার তেঁতুলতলার মণ্ডপ থেকে।

"দেখতে পাচ্ছিস? ঠাকুর দেখতে পাচ্ছিস, বাবু?"

দেখা যাচ্ছিল খানিকটা আকাশ, মাইকের তার আর এক কোণে পুরোহিতমশাইয়ের টাক। কখনও মায়ের কানের দুল গোটা পর্দা ঢেকে ফেলছে, কখনও ক্যামেরা ঘুরে থেমে যাচ্ছে ভিড়ের পায়ের কাছে।

অয়ন বলল, "পাচ্ছি মা। খুব সুন্দর হয়েছে।"

"কোথায় পাচ্ছিস! আমি নিজেই কিছু দেখতে পাচ্ছি না।"

মায়ের বিরক্ত গলার পিছনে ঢাক বেজে উঠল। সেই শব্দে পুনের ছোট্ট ফ্ল্যাটটা যেন এক মুহূর্তে সরে গেল। অয়ন দেখতে পেল কালনার বাড়ির উঠোন, স্নান সেরে রোদে শুকোতে দেওয়া গামছা, আর শিউলিগাছের তলায় উপুড় হয়ে পড়ে থাকা বাঁশের সাজি।

"অঞ্জলি শুরু হবে," মা বললেন। "ফুল নেই তো কী হয়েছে, হাতজোড় কর।"

ফোনটি পিতলের ঘটের গায়ে ঠেস দিয়ে রাখা হল। ছবিতে এখন কেবল মণ্ডপের লাল কাপড় আর মাঝে মাঝে উড়ে যাওয়া ধূপের ধোঁয়া। দেড় হাজার কিলোমিটারেরও বেশি দূরে অয়ন সোফার সামনে উঠে দাঁড়াল। পরনে পাজামা, গায়ে অফিসের টি-শার্ট।

পুরোহিতের মন্ত্র কখনও স্পষ্ট হল, কখনও ঢাকের ভিতর হারিয়ে গেল। অয়ন চোখ বন্ধ করে হাতজোড় করল। ফুল ছাড়াই অঞ্জলি দিল।

চোখ খুলে দেখল পর্দা স্থির। মা হাতজোড় করে দাঁড়িয়ে আছেন, ছবিটা মাঝপথে জমে গেছে। তারপর শব্দও থেমে গেল।

কয়েক সেকেন্ড পরে মায়ের বদলে বাবার মুখ ভেসে উঠল।

"শুনতে পাচ্ছিস?"

"হ্যাঁ, বাবা।"

"কলটা কাটিস না।"

বাবা ফোন হাতে মণ্ডপ থেকে বেরিয়ে পড়লেন। পর্দায় দুলতে দুলতে পেরিয়ে গেল পুকুরঘাট, বন্ধ মুদির দোকান, রিকশাস্ট্যান্ড আর সেই সরু গলি, যেখানে ছোটবেলায় অয়ন সাইকেল চালাতে শিখেছিল। মাঝে একবার নেটওয়ার্ক চলে গেল। ফিরে এলে দেখা গেল বাড়ির সবুজ দরজা।

বাবা সোজা অয়নের পুরোনো ঘরে ঢুকলেন।

বিছানার পাশে ক্রিকেট ব্যাটটি এখনও দাঁড়িয়ে। দেওয়ালে রং-চটা ভারতের মানচিত্র। টেবিলের উপর কাচের গেলাসে মা দুটো শিউলি রেখে দিয়েছেন।

"ঘরটা দেখতে পাচ্ছিস?" বাবা জিজ্ঞেস করলেন।

অয়ন উত্তর দিতে পারল না। শুধু ঘাড় নাড়ল — যেন বাবা এত দূর থেকেও দেখতে পাবেন।

"আর কিছু দেখবি?"

অনেকক্ষণ পরে অয়ন বলল, "জানলাটা একটু খুলে দাও।"

বাবা জানলার ছিটকিনি তুললেন। বাইরে শিউলিগাছটি হাওয়ায় নড়ে উঠল। দূরের মণ্ডপ থেকে আবার ঢাকের শব্দ এল। শরতের রোদ এসে পড়ল খালি বিছানার এক কোণে।

"পেলি?" বাবা জিজ্ঞেস করলেন।

ফোনে বাতাস আসে না। শিউলির গন্ধও আসে না।

তবু অয়ন চোখ বন্ধ করে বলল, "হ্যাঁ, বাবা। পেয়েছি।"', 'The office calendar called it Wednesday. Ayon''s calendar called it Ashtami.

He moved two morning meetings and waited beside his phone. At half past nine, his mother called from the Tentultala pandal in Kalna.

"Can you see her? Can you see the goddess, babu?"

He could see a piece of sky, the microphone cables and the priest''s bald head in one corner. Sometimes his mother''s earring filled the screen; sometimes the camera swung down and settled among the crowd''s feet.

"Yes, Ma. I can see. She looks beautiful."

"How can you see anything? Even I cannot tell where the camera is pointing."

A dhaak sounded behind her irritated voice. For a moment, Ayon''s small Pune flat fell away. He saw the courtyard at home, towels drying in the sun and the bamboo basket lying overturned beneath the shiuli tree.

"Anjali is about to begin," his mother said. "It does not matter if you have no flowers. Fold your hands."

She propped the phone against a brass ritual pot. Now the screen showed only the pandal''s red cloth and occasional threads of incense smoke. More than fifteen hundred kilometres away, Ayon stood before his sofa in pyjamas and an office T-shirt.

The priest''s mantra rose clearly, then disappeared beneath the dhaak. Ayon closed his eyes and joined his palms.

An anjali without flowers.

When he opened his eyes, the image had frozen. His mother remained motionless with folded hands, caught between two moments. Then the sound stopped too.

A few seconds later, his father''s face appeared.

"Can you hear me?"

"Yes, Baba."

"Do not end the call."

His father carried the phone out of the pandal. The pond steps, a shuttered grocery, the rickshaw stand and the narrow lane where Ayon had learnt to ride a bicycle swayed across the screen. The connection vanished once. When it returned, he was looking at their green front door.

His father went directly to Ayon''s old room.

The cricket bat still stood beside the bed. A faded map of India hung on the wall. On the desk, his mother had placed two shiuli flowers in a drinking glass.

"Can you see your room?" his father asked.

Ayon could not answer. He nodded, as though his father might somehow see him across the distance.

"Anything else?"

After a while, Ayon said, "Open the window, please."

His father lifted the latch. Outside, the shiuli tree stirred. The dhaak reached them again from the distant pandal. Autumn sunlight entered and rested on one corner of the empty bed.

"Did you get it?" his father asked.

A phone cannot carry a breeze. It cannot carry the scent of shiuli.

Still, Ayon closed his eyes and said, "Yes, Baba. I got it."', '/uma-media/probasher-ashtami.webp', 'bn', 'accepted', 'sankhya-1', 5, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-last-coupon', 'the-last-coupon', 'stories', 'The Last Coupon', 'শেষ কুপন',
  'Shankar Maitra', 'শঙ্কর মৈত্র', NULL, 1,
  'On Nabami afternoon, one number in the coupon ledger is still uncrossed — 217, Lahiri. Bablu-da knows exactly whose it is.', 'By half past one on Nabami, the bhog enclosure at Guskara''s Schoolpara Puja had descended into its annual, cheerful war.

Bablu-da commanded the coupon desk like a stationmaster during a delayed train — with absolute authority and no control whatsoever.

"Counter closes at two!" he announced, while three people simultaneously asked whether children needed full coupons.

At a quarter to two, the crowd began to thin. Ladles struck the bottoms of the khichuri vats, volunteers claimed they had not eaten while visibly chewing beguni, and Bablu-da opened the counterfoil book to settle the count.

Every sold number had been crossed in red except one.

**217 — Lahiri.**

He remembered Panchami evening. Lahiri-da had placed exact change on the desk and asked for one coupon.

"One?" Bablu-da had repeated before he could stop himself.

Mrs Lahiri had bought their coupons for thirty-one years — always four, in case their daughter''s family arrived unexpectedly from Singapore. She had passed away in March.

"This year, one," Lahiri-da had said, folding the pink coupon into his wallet.

Now he stood near the pandal exit, watching other families eat. His cream Panjabi had the severe creases of a garment ironed by someone who had only recently begun ironing for himself.

Bablu-da shut the ledger.

"Two-one-seven!" he shouted with the urgency of a lottery announcer. "Special counter!"

There was no special counter.

There was, suddenly, a chair beside the Boses'' long table. Mitali-boudi laid a banana leaf and produced the kitchen''s last unbroken beguni, an extra spoonful of pineapple chutney and a sandesh that had supposedly been reserved for the volunteers.

"I''m not very hungry," Lahiri-da protested.

"Excellent," said Bablu-da. "Neither is anybody after the third helping. Sit."

The Bose children quarrelled over a beguni beside him. Someone''s grandmother asked whether the khichuri needed more salt. Lahiri-da gave the only acceptable answer — "A little less than last year" — and the table erupted in agreement.

A few minutes later, he asked for another spoonful.

For the length of one banana-leaf meal, the silent flat two lanes away ceased to exist.

Lahiri-da left before the evening aarti. At the gate, he turned back.

"Next year," he said, "give me a volunteer''s badge. I seem to have time."

Bablu-da reopened the ledger and made a great show of writing it down. Beside number 217, in the margin, he wrote:

**Next year — volunteer.**

Some things are written down precisely because nobody intends to forget them.', 'নবমীর দুপুর দেড়টার মধ্যে গুসকরার স্কুলপাড়া পুজোর ভোগের জায়গাটি তার চেনা, আনন্দময় যুদ্ধক্ষেত্রে পরিণত হয়েছে।

বাবলুদা কুপনের টেবিল সামলাচ্ছেন দেরি-করা ট্রেনের স্টেশনমাস্টারের মতো — কর্তৃত্ব সম্পূর্ণ, নিয়ন্ত্রণ একেবারেই নেই।

"দুটোর সময় কাউন্টার বন্ধ!" তিনি ঘোষণা করলেন। একই সময়ে তিনজন জানতে চাইলেন, ছোটদেরও কি গোটা কুপন লাগবে।

পৌনে দুটো নাগাদ ভিড় পাতলা হল। খিচুড়ির ডেকচির তলায় হাতা ঠংঠং করে বাজছে। মুখে বেগুনি পুরে স্বেচ্ছাসেবকেরা দাবি করছে, তারা এখনও কিছু খায়নি। হিসাব মেলাতে বাবলুদা কুপনের মুড়িবই খুললেন।

বিক্রি হওয়া প্রতিটি নম্বর লাল কালিতে কাটা — শুধু একটি ছাড়া।

**২১৭ — লাহিড়ী।**

পঞ্চমীর সন্ধ্যার কথা মনে পড়ল। লাহিড়ীদা ঠিক দামটি টেবিলে রেখে একটি কুপন চেয়েছিলেন।

"একটা?" মুখ ফসকে জিজ্ঞেস করেছিলেন বাবলুদা।

একত্রিশ বছর ধরে কুপন কিনতেন লাহিড়ীবৌদি — সব সময় চারটি। যদি সিঙ্গাপুর থেকে মেয়ে-জামাই হঠাৎ চলে আসে! গত মার্চে তিনি চলে গেছেন।

"এবার একজনই," বলেছিলেন লাহিড়ীদা। গোলাপি কুপনটি যত্ন করে মানিব্যাগে রেখেছিলেন।

এখন তিনি মণ্ডপের বেরোনোর পথের কাছে দাঁড়িয়ে অন্যদের খাওয়া দেখছেন। ঘিয়ে রঙের পাঞ্জাবিতে এমন শক্ত ইস্ত্রি, যেন যিনি ইস্ত্রি করেছেন, কাজটি শিখেছেন খুব বেশিদিন হয়নি।

বাবলুদা মুড়িবই বন্ধ করলেন।

"দুই-এক-সাত!" লটারির নম্বর ঘোষণার মতো চেঁচিয়ে উঠলেন তিনি। "স্পেশাল কাউন্টার!"

কোনও স্পেশাল কাউন্টার ছিল না।

কিন্তু মুহূর্তের মধ্যে বসুদের লম্বা টেবিলের পাশে একটি চেয়ার এসে গেল। মিতালিবৌদি কলাপাতা পেতে রান্নাঘরের শেষ আস্ত বেগুনিটি দিলেন, সঙ্গে এক চামচ বেশি আনারসের চাটনি আর স্বেচ্ছাসেবকদের জন্য রাখা হয়েছিল বলে দাবি করা একটি সন্দেশ।

"আমার বিশেষ খিদে নেই," লাহিড়ীদা আপত্তি করলেন।

"খুব ভাল," বাবলুদা বললেন। "তিনবার নেওয়ার পরে কারওই থাকে না। বসুন।"

পাশে বসুদের দুই ছেলে একটি বেগুনি নিয়ে ঝগড়া করল। কারও ঠাকুমা জানতে চাইলেন, খিচুড়িতে নুন কম হয়েছে কি না। লাহিড়ীদা সকলের জানা সঠিক উত্তরটি দিলেন — "গত বছরের চেয়ে একটু কম" — আর গোটা টেবিল একসঙ্গে হেসে উঠল।

কয়েক মিনিট পরে তিনি আর এক হাতা খিচুড়ি চাইলেন।

একটি কলাপাতায় খাওয়ার সময়টুকু, দুই গলি দূরের নিঃশব্দ ফ্ল্যাটটির কোনও অস্তিত্ব রইল না।

সন্ধ্যার আরতির আগেই লাহিড়ীদা বেরিয়ে গেলেন। গেটের কাছে থেমে ফিরে তাকালেন।

"সামনের বছর," তিনি বললেন, "আমাকে একটা স্বেচ্ছাসেবকের ব্যাজ দিস। মনে হচ্ছে, সময় আছে।"

বাবলুদা মুড়িবইটি আবার খুলে খুব ব্যস্তভাবে কথাটি লিখে রাখলেন। ২১৭ নম্বরের পাশে, মার্জিনে লিখলেন —

**সামনের বছর — স্বেচ্ছাসেবক।**

কিছু কথা কেউ ভুলবে না বলেই লিখে রাখতে হয়।', '/uma-media/last-coupon.webp', 'en', 'accepted', 'sankhya-1', 6, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-sandhi', 'sandhi-pujo', 'mythology', 'The 48 Minutes of Sandhi Puja', 'সন্ধিপুজোর আটচল্লিশ মিনিট',
  'Ishan Bhattacharya', 'ঈশান ভট্টাচার্য', 'Writer on mythology, festivals and ritual traditions', 'পুরাণ, উৎসব ও আচারবিষয়ক লেখক', 1,
  'সন্ধি মানে সন্ধ্যা নয় — দুই তিথির সংযোগ। অষ্টমীর শেষ এক দণ্ড আর নবমীর প্রথম এক দণ্ড, মিলিয়ে ঠিক ৪৮ মিনিট।', 'সন্ধিপুজো যে সন্ধ্যাতেই হবে, এমন কোনও নিয়ম নেই। এখানে **সন্ধি** মানে সন্ধ্যা নয় — দুই তিথির সংযোগ।

অষ্টমী তিথির শেষ এক দণ্ড, অর্থাৎ ২৪ মিনিট, এবং নবমী তিথির প্রথম এক দণ্ড — সব মিলিয়ে ঠিক ৪৮ মিনিটই সন্ধিক্ষণ। তাই পুজো কোনও বছর দিনে, কোনও বছর গভীর রাতে পড়তে পারে। সময় নির্ধারিত হয় অষ্টমী তিথি শেষ হওয়ার মুহূর্ত ধরে; সেই জন্য পঞ্জিকার নির্ঘণ্ট মানা জরুরি।

## কেন চামুণ্ডার আরাধনা

*দেবীমাহাত্ম্য* বা *শ্রীশ্রীচণ্ডী*-র সপ্তম অধ্যায়ে বলা হয়েছে, চণ্ড ও মুণ্ডের বাহিনী আক্রমণ করলে ক্রুদ্ধ অম্বিকার কপাল থেকে আবির্ভূত হন ভয়ংকরী কালী। তিনিই চণ্ড ও মুণ্ডকে বধ করেন; তখন চণ্ডিকা তাঁর নাম দেন **চামুণ্ডা**।

গ্রন্থটি অবশ্য এই বধের সময়কে অষ্টমী-নবমীর সন্ধিক্ষণ বলে নির্দিষ্ট করে না। বাংলা দুর্গাপুজোর আচারপরম্পরায় কাহিনিটির সঙ্গে এই সন্ধিক্ষণ যুক্ত হয়েছে; তাই সন্ধিপুজোয় দুর্গা পূজিত হন চামুণ্ডারূপে।

## ১০৮ প্রদীপ ও পদ্ম

প্রচলিত বাংলা পুজোপদ্ধতিতে এই সময় ১০৮টি প্রদীপ জ্বালানো এবং ১০৮টি পদ্ম নিবেদন করা হয়। তবে অন্যান্য উপচার এবং বলির রীতি স্থান ও পরম্পরাভেদে বদলে যায়। কোথাও বলি প্রচলিত, আবার বহু পুজোয় ফল বা সবজি দিয়ে প্রতীকী বলি দেওয়া হয়।

ঘড়ির কাঁটা যখন অষ্টমী পেরিয়ে নবমীতে ঢোকে, ১০৮ প্রদীপের সামনে ঢাক চরমে ওঠে। সন্ধিপুজোর তীব্রতা কোনও অস্পষ্ট অলৌকিক সময়ে নয় — নির্ভুলভাবে চিহ্নিত সেই ৪৮ মিনিটেই।', 'Sandhi Puja need not take place in the evening. Here, **sandhi** means a junction — not dusk.

The final danda, or 24 minutes, of Ashtami tithi and the first danda of Navami together form the 48-minute sandhikshan. It may therefore fall during the day or deep at night. The published time is calculated from the precise end of Ashtami tithi, which is why the panjika timetable matters.

## Why Chamunda is worshipped

In Chapter Seven of the *Devi Mahatmya*, also recited as the *Chandi*, the armies of Chanda and Munda advance upon Ambika. From the forehead of the enraged goddess springs the terrifying Kali, who kills both asuras. Chandika then gives her the name **Chamunda**, formed from Chanda and Munda.

The text itself does not place their deaths explicitly at the Ashtami–Navami junction. Bengali ritual tradition connects the episode with this sacred interval, during which Durga is worshipped as Chamunda.

## The 108 offerings

In customary Bengali practice, 108 lamps are lit and 108 lotuses offered during Sandhi Puja. Other offerings and forms of bali vary between ritual lineages and places. Some retain sacrifice, while many substitute fruit or vegetables as symbolic bali.

As the tithi crosses from Ashtami into Navami, the 108 flames brighten and the dhaak reaches its height. The intensity of Sandhi Puja belongs not to an undefined mystical hour, but to those precisely observed 48 minutes.', '/uma-media/sandhi-pradip.webp', 'bn', 'accepted', 'sankhya-1', 13, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));
INSERT INTO uma_article (id, slug, section, title, title_bn, author_name, author_name_bn, author_bio, author_bio_bn, is_guest,
  excerpt, body_md, body_md_alt, hero_image, lang, status, issue_id, sort_order, submitted_via, submitted_on,
  hearts, claps, created_at, updated_at)
VALUES ('uma1-kola-bou', 'kala-bou-nabapatrika', 'mythology', 'Who Is Kala Bou?', 'কলাবউ কে?',
  'Somnath Bhattacharya', 'সোমনাথ ভট্টাচার্য', NULL, NULL, 1,
  'The banana plant gives her shape, but not her ritual identity. She is the Nabapatrika — nine plants bound into one sacred body.', 'Before sunrise on Saptami, while the streets are still dark, a green figure leaves the mandap to the sound of dhaak and conch shells. She will return bathed, draped in a white sari with a red border and touched with vermilion — the familiar Kala Bou.

The banana plant gives her shape, but it does not give her ritual identity. She is the **Nabapatrika**: nine plants bound into one sacred body, in which different divine forms are invoked.

## How the Nabapatrika is made

A leafy banana plant forms the outer frame. Eight other plants are arranged against it and traditionally secured with the vine of the **white aparajita** — *Clitoria ternatea* — often strengthened with yellow thread. The aparajita is the sacred binder; it is not counted among the nine.

In a commonly followed Bengali invocation, the plants and their presiding forms are:

* Banana or kadali — Brahmani
* Kochu or colocasia — Kalika
* Turmeric — Durga or Uma
* Jayanti — Kartiki
* Bel — Shiva or Śivā
* Pomegranate — Raktadantika
* Ashoka — Shokarahita
* Mankachu, a second arum — Chamunda
* Paddy — Lakshmi

Names and minor details can differ between ritual manuals and family traditions, but the nine-plant structure remains central. Collectively they are worshipped as **Nabapatrikavasini Navadurga** — the Goddess dwelling within the Nabapatrika.

## The bath and the return

At daybreak, the bundle is carried in procession to a river, pond or another prepared place of worship. The priest performs the prescribed **Nabapatrika Snan** with mantras; elaborate traditions employ several kinds of water and ritual substances. The form of the bath varies, but it is a consecration, not merely the washing of a plant.

Afterwards, the Nabapatrika is dressed in a fresh sari, veiled and marked with vermilion. Because the broad banana leaves enclose the other plants, the finished form resembles a Bengali bride.

Dhaak, conch shells and ululation accompany her return. This is **Nabapatrika Pravesh** — the ceremonial entry that opens the principal worship of Saptami. She is placed on a wooden seat beside the divine tableau, close to Ganesh, and remains there for worship through Dashami. Some Bengali ritual traditions prescribe an invocation of Chamunda immediately before the entry.

A subtle ritual distinction follows: the Nabapatrika has been physically bathed, but the clay image is not drenched. The Goddess''s **Mahasnan** is performed through her reflection in a mirror placed before the image.

## Field, grove and goddess

Her sari, veil and position near Ganesh naturally inspired the affectionate folklore of a banana bride. The ritual name, however, reveals a larger identity: nine living plants carrying the cultivated world into the mandap.

Scholars have therefore read the Nabapatrika as evidence of an older agrarian or vegetation-centred tradition absorbed into Durga Puja. That remains an interpretation, not a settled account of the festival''s origin. What the ritual says unmistakably is simpler and more beautiful: on Saptami, the Goddess is invoked not only in clay, but also in leaf, grain, fruit and root.', 'সপ্তমীর ভোর। রাস্তার অন্ধকার তখনও পুরো কাটেনি। ঢাক, শঙ্খ আর উলুধ্বনির মধ্যে মণ্ডপ থেকে বেরিয়ে পড়েন এক সবুজ অবয়ব। কিছুক্ষণ পরে তিনি ফিরবেন স্নাত হয়ে, লালপাড় সাদা শাড়িতে, সিঁদুরের ছোঁয়ায় — আমাদের চেনা কলাবউ।

কলাগাছ তাঁর বাইরের আকৃতি, কিন্তু আচারগত পরিচয় নয়। তিনি **নবপত্রিকা** — নয়টি উদ্ভিদে গঠিত একটি পবিত্র দেহ, যার মধ্যে বিভিন্ন দেবীর আবাহন করা হয়।

## কীভাবে তৈরি হয় নবপত্রিকা

সপত্র কলাগাছটিকে সামনে রেখে তার সঙ্গে সাজানো হয় আরও আটটি উদ্ভিদ। প্রথাগতভাবে সেগুলিকে বাঁধা হয় **শ্বেত অপরাজিতার লতা** দিয়ে; অনেক পদ্ধতিতে সঙ্গে থাকে হলুদ সুতো। অপরাজিতা এখানে পবিত্র বন্ধন — নবপত্রিকার দশম উদ্ভিদ নয়।

বাংলার বহুল প্রচলিত আবাহন-পদ্ধতিতে নয়টি উদ্ভিদ ও তাদের অধিষ্ঠাত্রী রূপ হল:

* কদলী বা কলা — ব্রহ্মাণী
* কচু — কালিকা
* হলুদ — দুর্গা বা উমা
* জয়ন্তী — কার্তিকী
* বেল — শিব বা শিবা
* ডালিম — রক্তদন্তিকা
* অশোক — শোকরহিতা
* মানকচু — চামুণ্ডা
* ধান — লক্ষ্মী

পূজাপদ্ধতি ও পারিবারিক প্রথাভেদে কোনও কোনও নাম বা খুঁটিনাটিতে পার্থক্য দেখা যায়। তবে নয়টি উদ্ভিদের সমাহারটিই মূল। সম্মিলিতভাবে তাঁরা পূজিত হন **নবপত্রিকাবাসিনী নবদুর্গা** রূপে।

## স্নান থেকে প্রবেশ

ভোরে নবপত্রিকাকে শোভাযাত্রা করে নদী, পুকুর বা নির্দিষ্ট পূজাস্থলে নিয়ে যাওয়া হয়। মন্ত্রোচ্চারণের সঙ্গে পুরোহিত সম্পন্ন করেন **নবপত্রিকা স্নান**। বিস্তৃত আচারপদ্ধতিতে নানা উৎসের জল ও একাধিক উপচার ব্যবহারের বিধান রয়েছে। স্থান ও প্রথাভেদে আয়োজন ছোট-বড় হলেও এটি শুধু গাছ ধোয়া নয় — দেবীর অভিষেক।

স্নানের পরে নবপত্রিকাকে নতুন লালপাড় সাদা শাড়ি পরানো হয়, ঘোমটা দেওয়া হয় এবং সিঁদুরের চিহ্ন আঁকা হয়। কলার বড় পাতাগুলি অন্য গাছগুলিকে ঘিরে রাখায় অবয়বটি হয়ে ওঠে বাংলার নববধূর মতো।

ঢাক, শঙ্খ ও উলুধ্বনির মধ্যে তাঁকে ফিরিয়ে আনার আচারটির নাম **নবপত্রিকা প্রবেশ**। এর মধ্য দিয়েই সপ্তমীর মূল পূজার প্রথাগত সূচনা। কাঠের আসনে দেবীপ্রতিমার পাশে, গণেশের কাছাকাছি, তাঁকে স্থাপন করা হয় এবং দশমী পর্যন্ত অন্য দেবদেবীর সঙ্গে পূজা করা হয়। কোনও কোনও বাংলা পূজাপদ্ধতিতে প্রবেশের ঠিক আগে নবপত্রিকার সম্মুখে চামুণ্ডার আবাহনের বিধানও রয়েছে।

এর পরের আচারটিতে রয়েছে একটি সূক্ষ্ম পার্থক্য। নবপত্রিকাকে সরাসরি জলে স্নান করানো হলেও মাটির প্রতিমাকে ভেজানো হয় না। প্রতিমার সামনে রাখা দর্পণে দেবীর প্রতিবিম্বের মাধ্যমে সম্পন্ন হয় **মহাস্নান**।

## খেত, গাছপালা ও দেবী

শাড়ি, ঘোমটা এবং গণেশের কাছাকাছি অবস্থান থেকেই সম্ভবত কলাবউকে ঘিরে বাঙালির স্নেহমিশ্রিত বধূ-কল্পনার জন্ম। কিন্তু তাঁর আচারগত পরিচয় আরও ব্যাপক — খেত, বাগান ও গৃহস্থালির নয়টি জীবন্ত উদ্ভিদ একসঙ্গে প্রবেশ করছে মণ্ডপে।

এই কারণে অনেক গবেষক নবপত্রিকার মধ্যে পুরোনো কৃষি বা উদ্ভিদ-দেবীর উপাসনার স্মৃতি দেখেছেন। সেটি একটি গুরুত্বপূর্ণ ব্যাখ্যা, দুর্গাপুজোর উৎস সম্পর্কে চূড়ান্ত সিদ্ধান্ত নয়। আচারটি নিশ্চিতভাবে যা বলে, তা আরও সরল ও সুন্দর: সপ্তমীর সকালে দেবী শুধু মাটির প্রতিমায় নন — পাতা, শস্য, ফল ও মূলের মধ্যেও আবাহিত হন।', '/uma-media/nabapatrika-snan.webp', 'en', 'accepted', 'sankhya-1', 14, NULL, '2026-08-30',
  0, 0, strftime('%s','now'), strftime('%s','now'));

-- Bilingual bodies: every article carries its translation (bn⇄en) + Bengali titles for en-primary pieces
-- Bengali byline for the AI-written debut pieces
UPDATE uma_article SET author_name_bn = 'ক্লদ · এআই' WHERE author_name = 'Claude · AI';
