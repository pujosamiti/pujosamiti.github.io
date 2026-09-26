/**
 * The bank behind উমা's question of the day, one a day from 26 Sep 2026.
 *
 * Days 0–25 (26 Sep – 21 Oct, Dashami) are intermediate questions on Durga
 * Pujo, its history and Kolkata's great pujos, researched for this bank:
 * guide-based answers were checked against a verbatim passage of their
 * chapter (`source`), and every answer from outside the guide against at
 * least two independent reputable sources, with `readMore` pointing to the
 * best of them. The pujo days get their own day's question (Mahalaya 10 Oct =
 * day 14, Panchami–Dashami 15–21 Oct = days 19–25). The season ends on
 * Dashami: exactly 26 questions, one per day (UMA_SEASON_DAYS). Verified
 * questions not used this year are kept outside git in
 * docs/tmp/uma-quiz-reserve-2026.ts.
 *
 * The quiz is shown in Bengali, with the English beneath in small type. The
 * Bengali spells names, rituals and places the way the guide itself does;
 * names the guide never writes in Bengali use their standard spellings.
 */
export interface UmaQuizQuestion {
  q: string
  qBn: string
  options: [string, string, string, string]
  optionsBn: [string, string, string, string]
  /** Index of the right option, 0–3 — the same in both languages. */
  answer: 0 | 1 | 2 | 3
  /** One or two sentences, shown after answering. */
  explain: string
  explainBn: string
  /** Guide chapter slug ("" = the guide's opening page); null when the answer is from outside the guide. */
  source: string | null
  /** For answers outside the guide: the best public page to read more. */
  readMore?: { href: string; label: string }
}

export const UMA_QUIZ: UmaQuizQuestion[] = [
  // day 0 · 26 Sep
  {
    q: "The Sabarna Roy Choudhury family's pujo at Barisha, often called Kolkata's oldest, traces its start to which year?",
    qBn: "বড়িশার সাবর্ণ রায়চৌধুরী পরিবারের পুজোকে প্রায়ই কলকাতার প্রাচীনতম পুজো বলা হয়। এই পুজোর শুরু কোন সালে?",
    options: ["1757", "1610", "1790", "1919"],
    optionsBn: ["১৭৫৭", "১৬১০", "১৭৯০", "১৯১৯"],
    answer: 1,
    explain: "The family has held its pujo since 1610, when Lakshmikanta Gangopadhyay Majumdar and his wife Bhagawati Devi began it at the aatchala in Barisha. The other years belong to Shobhabazar (1757), the Guptipara barowari (about 1790) and Bagbazar (1919).",
    explainBn: "১৬১০ সালে বড়িশার আটচালায় এই পুজো শুরু করেন লক্ষ্মীকান্ত গঙ্গোপাধ্যায় মজুমদার ও তাঁর স্ত্রী ভগবতী দেবী। বাকি সালগুলি শোভাবাজারের (১৭৫৭), গুপ্তিপাড়ার বারোয়ারির (মোটামুটি ১৭৯০) আর বাগবাজারের (১৯১৯)।",
    source: null,
    readMore: { href: "https://www.millenniumpost.in/kolkata/citys-oldest-puja-of-sabarna-roy-chowdhury-to-enter-its-413rd-year-493379", label: "City's oldest Puja of Sabarna Roy Chowdhury (Millennium Post)" },
  },
  // day 1 · 27 Sep
  {
    q: "The Chandi (Devi Mahatmya), recited through the pujo, is part of which Purana?",
    qBn: "পুজোর দিনগুলিতে যে চণ্ডী (দেবীমাহাত্ম্য) পাঠ হয়, সেটি কোন পুরাণের অংশ?",
    options: ["Kalika Purana", "Devi Bhagavata Purana", "Skanda Purana", "Markandeya Purana"],
    optionsBn: ["কালিকা পুরাণ", "দেবীভাগবত পুরাণ", "স্কন্দ পুরাণ", "মার্কণ্ডেয় পুরাণ"],
    answer: 3,
    explain: "The Devi Mahatmya, the Chandi of seven hundred verses, is embedded in the Markandeya Purana. That is why it opens with the sage Markandeya beginning a story.",
    explainBn: "সাতশো শ্লোকের চণ্ডী — দেবীমাহাত্ম্য — মার্কণ্ডেয় পুরাণের ভেতরেই গাঁথা। তাই এর শুরুতেই মার্কণ্ডেয় মুনি কাহিনি বলতে শুরু করেন।",
    source: "the-goddess-and-her-story",
  },
  // day 2 · 28 Sep
  {
    q: "Kolkata's bonedi families of the 1700s brought in potters to make their Durgas. Where did those potters come from?",
    qBn: "আঠারো শতকে কলকাতার বনেদি বাড়িগুলি দুর্গাপ্রতিমা গড়াতে কুমোর নিয়ে এসেছিল। সেই কুমোররা এসেছিলেন কোথা থেকে?",
    options: ["Krishnanagar, in Nadia", "Bishnupur", "Chandannagar", "Guptipara"],
    optionsBn: ["নদিয়ার কৃষ্ণনগর", "বিষ্ণুপুর", "চন্দননগর", "গুপ্তিপাড়া"],
    answer: 0,
    explain: "They came from Krishnanagar in Nadia, where clay artists had flourished under Maharaja Krishnachandra Ray. They settled on the Hooghly bank, and their quarter became Kumortuli.",
    explainBn: "তাঁরা এসেছিলেন নদিয়ার কৃষ্ণনগর থেকে, যেখানে মহারাজ কৃষ্ণচন্দ্র রায়ের আমলে মৃৎশিল্পীদের খুব কদর ছিল। তাঁরা বসতি গড়লেন হুগলির পাড়ে — সেই পাড়াই আজকের কুমোরটুলি।",
    source: "the-making-of-the-murti",
  },
  // day 3 · 29 Sep
  {
    q: "The goddess's white sholar saaj is carved from shola. What is shola?",
    qBn: "দেবীর ধবধবে সাদা শোলার সাজ খোদাই করা হয় শোলা থেকে। শোলা আসলে কী?",
    options: ["Carved ivory", "Dried coconut kernel", "The pith of a marsh reed", "Pressed rice paper"],
    optionsBn: ["হাতির দাঁত", "শুকনো নারকেলের শাঁস", "জলাভূমির এক গাছের সাদা মজ্জা", "চাপ দেওয়া চালের কাগজ"],
    answer: 2,
    explain: "Shola, sometimes called Indian cork, is the snow-white pith of a marsh reed from Bengal's wetlands. Malakar craftsmen carve it into feather-light crowns, breastplates and backdrops.",
    explainBn: "শোলা হল বাংলার জলাভূমিতে জন্মানো এক গাছের ধবধবে সাদা মজ্জা। মালাকার শিল্পীরা পালকের মতো হালকা এই শোলা কেটে গড়েন মুকুট, বুকের অলংকার আর প্রতিমার পেছনের সাজ।",
    source: "the-making-of-the-murti",
  },
  // day 4 · 30 Sep
  {
    q: "In December 2021, UNESCO inscribed \"Durga Puja in Kolkata\" on which of its lists?",
    qBn: "২০২১ সালের ডিসেম্বরে ইউনেস্কো \"কলকাতার দুর্গাপূজা\"-কে তাদের কোন তালিকায় জায়গা দেয়?",
    options: ["World Heritage List", "Memory of the World Register", "Creative Cities Network", "Intangible Cultural Heritage of Humanity"],
    optionsBn: ["বিশ্ব ঐতিহ্য তালিকা (ওয়ার্ল্ড হেরিটেজ)", "মেমরি অফ দ্য ওয়ার্ল্ড রেজিস্টার", "ক্রিয়েটিভ সিটিজ নেটওয়ার্ক", "মানবজাতির অধরা সাংস্কৃতিক ঐতিহ্য"],
    answer: 3,
    explain: "It joined UNESCO's Representative List of the Intangible Cultural Heritage of Humanity on 15 December 2021. That list honours living traditions, not monuments or documents.",
    explainBn: "২০২১ সালের ১৫ ডিসেম্বর কলকাতার দুর্গাপূজা ইউনেস্কোর মানবজাতির অধরা সাংস্কৃতিক ঐতিহ্যের প্রতিনিধিমূলক তালিকায় জায়গা পায়। এই তালিকা জীবন্ত ঐতিহ্যের — স্মৃতিস্তম্ভ বা নথিপত্রের নয়।",
    source: "the-goddess-and-her-story",
  },
  // day 5 · 1 Oct
  {
    q: "Bengali tradition remembers whom as the first to worship Durga, in spring, with an earthen image?",
    qBn: "বাংলার প্রথা অনুযায়ী বসন্তকালে মাটির প্রতিমায় প্রথম দুর্গাপুজো করেছিলেন কে?",
    options: ["King Suratha", "Rama, before fighting Ravana", "Raja Kangshanarayan", "The sage Markandeya"],
    optionsBn: ["রাজা সুরথ", "রাবণবধের আগে রাম", "রাজা কংসনারায়ণ", "মার্কণ্ডেয় মুনি"],
    answer: 0,
    explain: "King Suratha, taught by the sage Medhas, worshipped the Devi with an earthen image on a riverbank, and Bengal remembers him as the first to perform Durga Puja. That spring worship survives as Basanti Puja; Rama's was the later, autumn one.",
    explainBn: "মেধস মুনির উপদেশে রাজা সুরথ নদীর তীরে মাটির প্রতিমা গড়ে দেবীর পুজো করেছিলেন, আর বাংলা তাঁকেই প্রথম দুর্গাপুজোর কর্তা বলে মনে রাখে। সেই বসন্তের পুজোই আজকের বাসন্তী পূজা; রামের পুজো পরের, শরৎকালের।",
    source: "shashthi",
  },
  // day 6 · 2 Oct
  {
    q: "London's first Durga Puja, held in 1963, was organised by whom?",
    qBn: "লন্ডনের প্রথম দুর্গাপুজো হয়েছিল ১৯৬৩ সালে। সেটির আয়োজন করেছিলেন কারা?",
    options: ["The Indian High Commission", "A Kolkata rajbari family", "A group of Bengali students", "The Ramakrishna Mission"],
    optionsBn: ["ভারতীয় হাইকমিশন", "কলকাতার এক রাজবাড়ির পরিবার", "একদল বাঙালি ছাত্র", "রামকৃষ্ণ মিশন"],
    answer: 2,
    explain: "A group of young Bengali students held it at the Mary Ward Centre near Russell Square, with an idol donated by Tushar Kanti Ghosh, editor of Jugantar. The pujo grew and moved to Belsize Park in 1966.",
    explainBn: "একদল তরুণ বাঙালি ছাত্র রাসেল স্কোয়্যারের কাছে মেরি ওয়ার্ড সেন্টারে এই পুজো করেন; প্রতিমা দান করেছিলেন যুগান্তর পত্রিকার সম্পাদক তুষারকান্তি ঘোষ। পুজো বাড়তে বাড়তে ১৯৬৬ সালে উঠে যায় বেলসাইজ পার্কে।",
    source: null,
    readMore: { href: "https://www.globalindian.com/story/cover-story/from-1963-to-2023-the-60th-anniversary-of-londons-oldest-durga-puja/", label: "The 60th anniversary of London's oldest Durga Puja (Global Indian)" },
  },
  // day 7 · 3 Oct
  {
    q: "In which year was the Asian Paints Sharad Samman, Kolkata's award for pujo committees, instituted?",
    qBn: "কলকাতার পুজো কমিটিগুলির জন্য এশিয়ান পেন্টস শারদ সম্মান চালু হয় কোন সালে?",
    options: ["1985", "1971", "1997", "2004"],
    optionsBn: ["১৯৮৫", "১৯৭১", "১৯৯৭", "২০০৪"],
    answer: 0,
    explain: "It was instituted in 1985, launched with a newspaper advertisement, and it changed how the city looked at its own festival.",
    explainBn: "১৯৮৫ সালে একটি সংবাদপত্রের বিজ্ঞাপন দিয়ে এই সম্মানের সূচনা, আর তা বদলে দিয়েছিল শহরের নিজের উৎসবকে দেখার চোখ।",
    source: null,
    readMore: { href: "https://en.wikipedia.org/wiki/Asian_Paints_Sharad_Shamman", label: "Asian Paints Sharad Shamman (Wikipedia)" },
  },
  // day 8 · 4 Oct
  {
    q: "Raja Nabakrishna Deb's grand 1757 pujo at Shobhabazar celebrated which event?",
    qBn: "১৭৫৭ সালে শোভাবাজারে রাজা নবকৃষ্ণ দেবের জাঁকালো পুজো কোন ঘটনার উদযাপনে হয়েছিল?",
    options: ["Fort William's completion", "Job Charnock's landing", "The Battle of Buxar", "The Battle of Plassey"],
    optionsBn: ["ফোর্ট উইলিয়াম তৈরি শেষ হওয়া", "জোব চার্নকের আগমন", "বক্সারের যুদ্ধ", "পলাশীর যুদ্ধ"],
    answer: 3,
    explain: "It celebrated the East India Company's victory at Plassey, and Robert Clive himself attended. The guide calls it a landmark in the festival's history, and a morally complicated one.",
    explainBn: "পুজোটি ছিল পলাশীর যুদ্ধে ইস্ট ইন্ডিয়া কোম্পানির জয়ের উদযাপন, আর তাতে স্বয়ং রবার্ট ক্লাইভ উপস্থিত ছিলেন। আমাদের গাইড একে বলেছে পুজোর ইতিহাসে এক মাইলফলক — তবে নৈতিকভাবে জটিল এক মাইলফলক।",
    source: "the-making-of-the-murti",
  },
  // day 9 · 5 Oct
  {
    q: "Tradition credits an early grand autumn pujo to Raja Kangshanarayan of Taherpur. Where is Taherpur?",
    qBn: "প্রথা অনুযায়ী শরৎকালের গোড়ার দিকের এক জাঁকালো দুর্গাপুজোর কৃতিত্ব তাহেরপুরের রাজা কংসনারায়ণের। তাহেরপুর কোথায়?",
    options: ["Burdwan", "Rajshahi, in Bangladesh", "Hooghly", "Sylhet, in Bangladesh"],
    optionsBn: ["বর্ধমান", "রাজশাহী, বাংলাদেশ", "হুগলি", "সিলেট, বাংলাদেশ"],
    answer: 1,
    explain: "Taherpur is in Rajshahi, in today's Bangladesh. Tradition places Kangshanarayan's lavish pujo in the late sixteenth century, and landholding houses across both Bengals followed.",
    explainBn: "তাহেরপুর আজকের বাংলাদেশের রাজশাহীতে। প্রথা মতে কংসনারায়ণের সেই জাঁকালো পুজো ষোড়শ শতকের শেষ দিকের, আর তারপর দুই বাংলার জমিদার বাড়িগুলি সেই পথ ধরে।",
    source: "the-goddess-and-her-story",
  },
  // day 10 · 6 Oct
  {
    q: "Kolkata's first barowari Durga Puja, around 1909–10, is generally credited to which neighbourhood?",
    qBn: "মোটামুটি ১৯০৯–১০ সালে কলকাতার প্রথম বারোয়ারি দুর্গাপুজো হয়েছিল বলে সাধারণত ধরা হয় কোন পাড়ায়?",
    options: ["Bagbazar", "Shyampukur", "Bhowanipore", "Simla"],
    optionsBn: ["বাগবাজার", "শ্যামপুকুর", "ভবানীপুর", "সিমলা"],
    answer: 2,
    explain: "It is credited to the Bhowanipore Sanatan Dharmotsahini Sabha, on Balaram Bose Ghat Road, in 1909 (some accounts say 1910). Shyampukur followed in 1911 and Bagbazar in 1919.",
    explainBn: "কৃতিত্ব দেওয়া হয় ভবানীপুরের সনাতন ধর্মোৎসাহিনী সভাকে — বলরাম বসু ঘাট রোডে, ১৯০৯ সালে (কারও মতে ১৯১০)। তারপর ১৯১১-তে শ্যামপুকুর, আর ১৯১৯-এ বাগবাজার।",
    source: "khunti-puja",
  },
  // day 11 · 7 Oct
  {
    q: "Which Kumortuli sculptor is credited with first breaking the ek-chala into separate figures?",
    qBn: "কুমোরটুলির কোন শিল্পী প্রথম একচালা ভেঙে প্রতিমার মূর্তিগুলি আলাদা আলাদা করে গড়েছিলেন বলে ধরা হয়?",
    options: ["Jamini Roy", "Ramkinkar Baij", "Mintu Pal", "Gopeshwar Pal"],
    optionsBn: ["যামিনী রায়", "রামকিঙ্কর বেইজ", "মিন্টু পাল", "গোপেশ্বর পাল"],
    answer: 3,
    explain: "Gopeshwar Pal (G. Paul), who had amazed Wembley with his speed-modelling in the 1920s, is credited with separating the figures in the late 1930s. His naturalistic style opened the door to the theme pujo's free compositions.",
    explainBn: "বিশের দশকে ওয়েম্বলিতে ঝড়ের গতিতে মূর্তি গড়ে তাক লাগানো গোপেশ্বর পাল তিরিশের দশকের শেষে প্রথম মূর্তিগুলি আলাদা করেন বলে ধরা হয়। তাঁর বাস্তবধর্মী ধারাই পরে থিম পুজোর মুক্ত বিন্যাসের দরজা খুলে দেয়।",
    source: "the-making-of-the-murti",
  },
  // day 12 · 8 Oct
  {
    q: "The panjika names the Goddess's vehicle of arrival each year. What does her coming by elephant promise?",
    qBn: "পঞ্জিকা প্রতি বছর বলে দেয় দেবী কোন বাহনে আসছেন। দেবী হাতিতে (গজে) এলে তার ফল কী বলে ধরা হয়?",
    options: ["Plenty", "Epidemic and upheaval", "Unrest", "Both flood and harvest"],
    optionsBn: ["সুখসমৃদ্ধি, প্রাচুর্য", "মড়ক আর বিপর্যয়", "অশান্তি", "বন্যা, আবার ফসলও"],
    answer: 0,
    explain: "By tradition the elephant promises plenty. The horse foretells unrest, the boat both flood and harvest, and the palanquin epidemic and upheaval; the vehicles are read from the weekdays of the pujo's key days.",
    explainBn: "প্রথা মতে হাতিতে আগমন মানে প্রাচুর্য। ঘোড়ায় এলে অশান্তি, নৌকায় এলে বন্যা আর ফসল দুই-ই, আর দোলায় এলে মড়ক ও বিপর্যয়। বাহন ঠিক হয় পুজোর মূল দিনগুলি সপ্তাহের কোন বারে পড়ছে তা দেখে।",
    source: "mahalaya",
  },
  // day 13 · 9 Oct
  {
    q: "By Kumortuli tradition, on which day are the goddess's eyes painted in chokkhu daan?",
    qBn: "কুমোরটুলির প্রথা অনুযায়ী চক্ষুদান — প্রতিমার চোখ আঁকা — হয় কোন দিনে?",
    options: ["Rath Yatra", "Mahalaya", "Janmashtami", "Kojagari Purnima"],
    optionsBn: ["রথযাত্রা", "মহালয়া", "জন্মাষ্টমী", "কোজাগরী পূর্ণিমা"],
    answer: 1,
    explain: "By long custom the master artisan paints the eyes on Mahalaya, the day the Goddess is said to set out toward us. With today's deadlines many images get their eyes earlier, but Mahalaya remains the ideal.",
    explainBn: "বহু দিনের প্রথা মতে প্রধান শিল্পী মহালয়ার দিন প্রতিমার চোখ আঁকেন — যেদিন দেবী আমাদের দিকে রওনা দেন বলে মনে করা হয়। আজকের তাড়াহুড়োয় অনেক প্রতিমার চোখ আগেই আঁকা হয়ে যায়, তবু আদর্শ দিন মহালয়াই।",
    source: "mahalaya",
  },
  // day 14 · 10 Oct
  {
    q: "The Mahishasuramardini recording that All India Radio still plays every Mahalaya dates from which year?",
    qBn: "আকাশবাণী প্রতি মহালয়ায় আজও মহিষাসুরমর্দিনীর যে রেকর্ডিং বাজায়, সেটি কোন সালের?",
    options: ["1931", "1947", "1966", "1976"],
    optionsBn: ["১৯৩১", "১৯৪৭", "১৯৬৬", "১৯৭৬"],
    answer: 2,
    explain: "For its first decades the programme was performed live in the studio at dawn. The definitive pre-recorded version, heard to this day, dates from 1966.",
    explainBn: "প্রথম কয়েক দশক অনুষ্ঠানটি ভোরবেলা স্টুডিয়ো থেকে সরাসরি সম্প্রচার হত। আজও যে রেকর্ডিং শোনা যায়, সেই চূড়ান্ত সংস্করণটি ১৯৬৬ সালের।",
    source: "the-mahalaya-broadcast",
  },
  // day 15 · 11 Oct
  {
    q: "Why was Simla Byayam Samiti's goddess nicknamed \"Swadeshi Thakur\" in the freedom-struggle years?",
    qBn: "স্বাধীনতা আন্দোলনের দিনে সিমলা ব্যায়াম সমিতির প্রতিমাকে লোকে \"স্বদেশী ঠাকুর\" বলত কেন?",
    options: ["Her pandal was made of jute", "She was draped in khadi", "Her image used only local clay", "Only Indian flowers were offered"],
    optionsBn: ["তাঁর প্যান্ডেল ছিল পাটের তৈরি", "তাঁকে খাদি পরানো হত", "প্রতিমায় শুধু স্থানীয় মাটি লাগত", "পুজোয় শুধু দেশি ফুল দেওয়া হত"],
    answer: 1,
    explain: "In the freedom-struggle years its goddess was clad in khadi, the homespun cloth of the swadeshi movement, so people called her the \"Swadeshi Thakur\".",
    explainBn: "স্বাধীনতা আন্দোলনের দিনে এই পুজোর প্রতিমাকে পরানো হত খাদি — স্বদেশী আন্দোলনের হাতে-বোনা কাপড়। তাই লোকের মুখে তিনি হয়ে উঠলেন \"স্বদেশী ঠাকুর\"।",
    source: null,
    readMore: { href: "https://www.outlookindia.com/national/india-news-nostalgia-from-lord-clive-to-swadeshi-thakur-as-chief-guest-heres-how-bengals-durga-puja-transformed-news-397541", label: "From Lord Clive to Swadeshi Thakur (Outlook)" },
  },
  // day 16 · 12 Oct
  {
    q: "Santosh Mitra Square, near Sealdah, honours a freedom fighter shot dead in 1931 at which detention camp?",
    qBn: "শিয়ালদার কাছে সন্তোষ মিত্র স্কোয়্যারের নাম যে স্বাধীনতা সংগ্রামীর নামে, ১৯৩১ সালে কোন বন্দিশিবিরে তাঁকে গুলি করে মারা হয়?",
    options: ["Buxa", "Deoli", "Hijli", "Cellular Jail"],
    optionsBn: ["বক্সা", "দেউলি", "হিজলি", "সেলুলার জেল"],
    answer: 2,
    explain: "Santosh Kumar Mitra and Tarakeswar Sengupta, both unarmed detainees, were shot dead by police at Hijli on 16 September 1931. The square near Sealdah named after him hosts one of Kolkata's big pujos.",
    explainBn: "১৯৩১ সালের ১৬ সেপ্টেম্বর হিজলি বন্দিশিবিরে নিরস্ত্র বন্দি সন্তোষকুমার মিত্র ও তারকেশ্বর সেনগুপ্তকে পুলিশ গুলি করে মারে। শিয়ালদার কাছে তাঁর নামের এই স্কোয়্যার কলকাতার এক বড় পুজোর ঠিকানা।",
    source: null,
    readMore: { href: "https://en.wikipedia.org/wiki/Santosh_Kumar_Mitra", label: "Santosh Kumar Mitra (Wikipedia)" },
  },
  // day 17 · 13 Oct
  {
    q: "In 2015, an 88-foot Durga billed as the world's tallest drew crowds so huge that police stopped the viewing. At which pujo?",
    qBn: "২০১৫ সালে 'বিশ্বের সবচেয়ে উঁচু' বলে প্রচারিত ৮৮ ফুটের এক দুর্গাপ্রতিমা দেখতে এমন ভিড় হয় যে পুলিশ দর্শন বন্ধ করে দেয়। কোন পুজোয়?",
    options: ["Santosh Mitra Square", "Sreebhumi Sporting Club", "Ekdalia Evergreen", "Deshapriya Park"],
    optionsBn: ["সন্তোষ মিত্র স্কোয়্যার", "শ্রীভূমি স্পোর্টিং ক্লাব", "একডালিয়া এভারগ্রিন", "দেশপ্রিয় পার্ক"],
    answer: 3,
    explain: "It was Deshapriya Park's 2015 idol, 88 feet tall. The crush of visitors grew dangerous, and police covered the idol's face and halted the viewing.",
    explainBn: "এটি ছিল দেশপ্রিয় পার্কের ২০১৫ সালের ৮৮ ফুট উঁচু প্রতিমা। ভিড়ের চাপ বিপজ্জনক হয়ে ওঠায় পুলিশ প্রতিমার মুখ ঢেকে দর্শন বন্ধ করে দেয়।",
    source: null,
    readMore: { href: "https://www.india.com/travel/articles/durga-puja-2015-worlds-tallest-durga-idol-3237787/", label: "Durga Puja 2015: World's tallest Durga idol (India.com)" },
  },
  // day 18 · 14 Oct
  {
    q: "College Square's pujo in central Kolkata is famous for its illuminations mirrored in what?",
    qBn: "মধ্য কলকাতার কলেজ স্কোয়্যারের পুজো বিখ্যাত আলোকসজ্জার প্রতিবিম্বের জন্য। সেই প্রতিবিম্ব পড়ে কীসে?",
    options: ["Its large central pool", "The Hooghly river", "Rabindra Sarobar lake", "A mirrored pandal wall"],
    optionsBn: ["স্কোয়্যারের মাঝের বড় জলাশয়ে", "হুগলি নদীতে", "রবীন্দ্র সরোবরে", "প্যান্ডেলের আয়নার দেওয়ালে"],
    answer: 0,
    explain: "The pandal stands beside the big pool at the heart of College Square, which is also the College Square swimming pool. At night the pujo lights shimmer in its water.",
    explainBn: "প্যান্ডেল হয় কলেজ স্কোয়্যারের মাঝের বড় জলাশয়ের ধারে — যেটি আবার কলেজ স্কোয়্যার সুইমিং পুলও। রাতে তার জলে পুজোর আলো ঝিকমিক করে।",
    source: null,
    readMore: { href: "https://en.wikipedia.org/wiki/Vidyasagar_Udyan", label: "College Square (Vidyasagar Udyan), Wikipedia" },
  },
  // day 19 · 15 Oct
  {
    q: "Which veteran Bengal minister was president of Ekdalia Evergreen's pujo for five decades, until his death in 2021?",
    qBn: "পাঁচ দশক ধরে, ২০২১ সালে মৃত্যু পর্যন্ত, একডালিয়া এভারগ্রিনের পুজোর সভাপতি ছিলেন কোন প্রবীণ মন্ত্রী?",
    options: ["Siddhartha Shankar Ray", "Subrata Mukherjee", "Prafulla Chandra Sen", "Jyoti Basu"],
    optionsBn: ["সিদ্ধার্থশংকর রায়", "সুব্রত মুখোপাধ্যায়", "প্রফুল্লচন্দ্র সেন", "জ্যোতি বসু"],
    answer: 1,
    explain: "Subrata Mukherjee headed the Ekdalia Evergreen Club for about fifty years, until he died in November 2021. He championed a traditional pujo over flashy theme-based designs.",
    explainBn: "সুব্রত মুখোপাধ্যায় প্রায় পঞ্চাশ বছর একডালিয়া এভারগ্রিন ক্লাবের সভাপতি ছিলেন, ২০২১ সালের নভেম্বরে মৃত্যু পর্যন্ত। চমকদার থিমের চেয়ে সাবেকি পুজোই ছিল তাঁর পছন্দ।",
    source: null,
    readMore: { href: "https://www.millenniumpost.in/kolkata/ekdalias-evergreen-patron-457973", label: "Ekdalia's 'Evergreen' patron (Millennium Post)" },
  },
  // day 20 · 16 Oct
  {
    q: "Rama's untimely awakening of Durga, the akal bodhon, comes from which Ramayana?",
    qBn: "অসময়ে দেবীকে জাগানো — রামের অকালবোধন — এই কাহিনি আসলে কোন রামায়ণের?",
    options: ["Valmiki's Sanskrit Ramayana", "Tulsidas's Ramcharitmanas", "Krittibas's Bengali Ramayana", "Kamban's Tamil Ramayana"],
    optionsBn: ["বাল্মীকির সংস্কৃত রামায়ণ", "তুলসীদাসের রামচরিতমানস", "কৃত্তিবাসের বাংলা রামায়ণ", "কম্বনের তামিল রামায়ণ"],
    answer: 2,
    explain: "The akal bodhon comes from Krittibas Ojha's fifteenth-century Bengali Ramayana and is absent from Valmiki's Sanskrit original. Every Shashthi bodhon repeats that out-of-season awakening.",
    explainBn: "অকালবোধনের কাহিনি কৃত্তিবাস ওঝার পনেরো শতকের বাংলা রামায়ণের; বাল্মীকির সংস্কৃত মূল রামায়ণে এটি নেই। প্রতি ষষ্ঠীর বোধন সেই অসময়ের জাগরণেরই পুনরাবৃত্তি।",
    source: "shashthi",
  },
  // day 21 · 17 Oct
  {
    q: "On Saptami the nabapatrika is bathed at dawn. Which of these is NOT one of its nine plants?",
    qBn: "সপ্তমীর ভোরে নবপত্রিকার স্নান হয়। নিচের কোনটি নবপত্রিকার ন'টি উদ্ভিদের মধ্যে নেই?",
    options: ["Pomegranate", "Tulsi", "Turmeric", "Ashoka"],
    optionsBn: ["ডালিম", "তুলসী", "হলুদ", "অশোক"],
    answer: 1,
    explain: "The nine are banana, colocasia, turmeric, jayanti, bel, pomegranate, ashoka, arum and paddy, each a form of the Devi. Tulsi, sacred as it is, is not among them.",
    explainBn: "ন'টি উদ্ভিদ হল কলা, কচু, হলুদ, জয়ন্তী, বেল, ডালিম, অশোক, মান আর ধান — প্রত্যেকটি দেবীর এক এক রূপ। তুলসী পবিত্র হলেও এদের মধ্যে নেই।",
    source: "saptami",
  },
  // day 22 · 18 Oct
  {
    q: "On Ashtami morning, Bagbazar Sarbojanin holds \"Birashtami\". What happens at it?",
    qBn: "অষ্টমীর সকালে বাগবাজার সর্বজনীনে হয় \"বীরাষ্টমী\"। তাতে কী হয়?",
    options: ["A dhunuchi dance contest", "A kite-flying contest", "A feast for the city's dhakis", "Displays of lathi khela and wrestling"],
    optionsBn: ["ধুনুচি নাচের প্রতিযোগিতা", "ঘুড়ি ওড়ানোর প্রতিযোগিতা", "শহরের ঢাকিদের ভোজ", "লাঠিখেলা, কুস্তির মতো শক্তির প্রদর্শন"],
    answer: 3,
    explain: "Birashtami began in the freedom-struggle years as a show of strength: young men displayed stick-play, sword-fights and wrestling before the goddess. Bagbazar still keeps the custom.",
    explainBn: "বীরাষ্টমীর শুরু স্বাধীনতা আন্দোলনের দিনে, শক্তির প্রদর্শন হিসেবে: দেবীর সামনে তরুণরা দেখাত লাঠিখেলা, তলোয়ারের লড়াই, কুস্তি। বাগবাজার আজও সেই প্রথা ধরে রেখেছে।",
    source: null,
    readMore: { href: "https://www.bsde.org/about.php", label: "Baghbazar Sarbojanin Durgotsav: About (committee site)" },
  },
  // day 23 · 19 Oct
  {
    q: "Before clocks were common, how did the great houses of old Kolkata announce the moment of Sandhi Puja?",
    qBn: "ঘড়ি যখন ঘরে ঘরে ছিল না, তখন পুরনো কলকাতার জমিদার বাড়িগুলি সন্ধিপূজার মুহূর্ত ঘোষণা করত কীভাবে?",
    options: ["By firing a cannon", "By ringing a great temple bell", "By raising a flag on the roof", "By lighting a bonfire"],
    optionsBn: ["কামান দেগে", "মন্দিরের বড় ঘণ্টা বাজিয়ে", "ছাদে পতাকা তুলে", "আগুন জ্বালিয়ে"],
    answer: 0,
    explain: "Houses such as Shobhabazar timed the sandhikshan with a floating water clock and announced it with cannon fire. The Daw family of Jorasanko still fires a cannon at sandhi puja today.",
    explainBn: "শোভাবাজারের মতো বাড়িগুলি জলে ভাসানো ফুটো বাটির ঘড়িতে সন্ধিক্ষণ মাপত, আর কামান দেগে তা ঘোষণা করত। জোড়াসাঁকোর দাঁ পরিবার আজও সন্ধিপূজায় কামান দাগে।",
    source: "ashtami",
  },
  // day 24 · 20 Oct
  {
    q: "The fragrant dhuno burned in the dhunuchi for Nabami's dance is the resin of which tree?",
    qBn: "নবমীর ধুনুচি নাচে ধুনুচিতে যে সুগন্ধি ধুনো পোড়ে, সেটি কোন গাছের রজন?",
    options: ["Pine", "Neem", "Sal", "Sandalwood"],
    optionsBn: ["পাইন", "নিম", "শাল", "চন্দন"],
    answer: 2,
    explain: "Dhuno is the resin of the sal tree, burned over smouldering coconut husk in the clay dhunuchi. Its thick, fragrant smoke is what the dancers swirl before the goddess.",
    explainBn: "ধুনো হল শালগাছের রজন; মাটির ধুনুচিতে জ্বলন্ত নারকেলের ছোবড়ার ওপর তা পোড়ানো হয়। সেই ঘন সুগন্ধি ধোঁয়াই নাচিয়েরা দেবীর সামনে ঘুরিয়ে ঘুরিয়ে ছড়ান।",
    source: "nabami",
  },
  // day 25 · 21 Oct
  {
    q: "Which creeper binds the nabapatrika on Saptami, and is worshipped as a goddess on Dashami?",
    qBn: "সপ্তমীতে যে লতা দিয়ে নবপত্রিকা বাঁধা হয়, দশমীতে সেই লতাকেই দেবী রূপে পুজো করা হয়। কোন লতা?",
    options: ["Madhabilata", "Betel vine", "Gulancha (giloy)", "Aparajita (butterfly pea)"],
    optionsBn: ["মাধবীলতা", "পানের লতা", "গুলঞ্চ", "অপরাজিতা"],
    answer: 3,
    explain: "The aparajita, or butterfly-pea creeper, ties the nine plants to the banana stem on Saptami. On Dashami it is worshipped as the undefeated goddess, and a blessed strand is tied on the wrist for protection.",
    explainBn: "অপরাজিতা লতা দিয়েই সপ্তমীতে ন'টি উদ্ভিদ কলাগাছের সঙ্গে বাঁধা হয়। দশমীতে সেই লতাকেই অপরাজেয় দেবী রূপে পুজো করা হয়, আর পুজোর পর তার একটি গাছি রক্ষাকবচ হিসেবে হাতে বাঁধা হয়।",
    source: "dashami",
  },
]
