# উমা — daily quiz and puzzle

`/uma` is a small daily game page: **one puzzle** and **one question**, new
every day at **5 am IST**, for the **2026 season: 26 days, 26 Sep to Dashami
(21 Oct)**. From 22 Oct the page shows a farewell — *আসছে বছর আবার হবে* — over
the Dashami photograph, until next year's season is set up. It replaced the Uma magazine on 26 Sep 2026
(archived — see [015](015-uma-magazine.md)). It is public: no sign-in, no
API, no database. Everything is decided in the browser by today's date in
India, so every phone gets the same question and the same shuffled puzzle,
and members can compare scores on WhatsApp.

## 1. Where things live

| What | File |
| --- | --- |
| The page and its two tabs — Puzzle first and the default (`/uma`), then Quiz (`/uma?tab=quiz`) | `web/src/pages/Uma.tsx` |
| The quiz | `web/src/components/uma/DailyQuiz.tsx` |
| Confetti, the badge card and its 10-second overlay | `web/src/components/uma/Confetti.tsx`, `BadgeCard.tsx`, `BadgeOverlay.tsx` |
| The strip of dates (paginator) | `web/src/components/uma/DayPager.tsx` |
| The badges — faces, prayers, times | `web/src/content/uma-badges.ts`, faces in `web/public/uma-badges/` |
| The sliding puzzle | `web/src/components/uma/SlidingPuzzle.tsx` |
| The daily clock, seeded shuffle, per-phone storage | `web/src/lib/umaDaily.ts` |
| The question bank | `web/src/content/uma-quiz.ts` |
| The puzzle photos (list) | `web/src/content/uma-puzzles.ts` |
| The puzzle photos (files, 900 × 900 WebP) | `web/public/uma-puzzle/` |

Old magazine links (`/uma/<anything>`) redirect to `/uma`. The page is
prerendered once, as a single static route, for link previews.

**Share card.** Shared on WhatsApp, Facebook or X, `/uma` previews as
"UMA · A Durga Pujo puzzle and quiz, every day" with a shuffled puzzle of Maa's face
(`web/public/uma-share.webp`, 782 × 782, ~100 KB — WhatsApp drops preview
images much over 300 KB; made from the 1.1 MB PNG kept in `docs/tmp/`). The
prerender also writes the image's size, type and alt text, which lets
WhatsApp and Facebook draw the card on the first share. Facebook caches
cards: after changing one, re-scrape the link in Facebook's Sharing Debugger.

## 2. The day

Day 0 is **26 Sep 2026** (`UMA_LAUNCH`); the season is `UMA_SEASON_DAYS` = 26. The Uma day turns over at **5 am
IST** (`UMA_DAY_STARTS_AT`): the new games are waiting when the house wakes,
and someone up past midnight is still on the evening's games. Day *n* shows
question *n* and puzzle photo *n* — each list holds exactly 26.

**A page left open.** A timer rolls an open page over at 5 am — but phones
don't keep it: iPhone Safari freezes background tabs and Android Chrome
delays their timers, so a page left open overnight could wake up still on
yesterday. The page therefore checks the day again whenever it comes back
into view (unlocking the phone, returning to the browser or the tab) and once
a minute while on screen, and moves to the new day at once. A **refresh**
icon beside the Puzzle / Quiz buttons does a real reload back to today's
game — which also brings in anything deployed since the page was opened;
games save as they go, so nothing is lost.

**Layout.** The title উমা and the Puzzle / Quiz switch share one line. On a
phone the day line and the strip of dates sit **below** the game, so the
puzzle gets the screen (a small line under the title says when the day on
screen is not today, and picking a date scrolls back up to its game); from
tablet width up they sit above the game.

**The countdown.** Above the strip of dates, each day reads as a countdown
to Shashthi (16 Oct): "19 days to Shashthi · Sun, 27 Sept", "Shashthi is
tomorrow", with Mahalaya and Panchami named in front; from Shashthi to
Dashami it names the pujo day instead (Saptami, Ashtami, Ashtami · Day 2 …),
as the Days of the Pujo list them. The dates live in `pujoCountdown` in
`umaDaily.ts`.

**Looking back and ahead.** A strip of dates (26 · 27 · … · 21, with ‹ ›)
pages through the season; the day on screen is in the address
(`/uma?day=2026-09-28`, shareable; today needs none). **Everyone** may open
today and every earlier day — to see how they did, or to play a day they
missed (it is remembered for that date, but only today's game feeds the
streak and shows the countdown). Later days are locked, except for a member
whose **portfolio is "maestro"** (set by an admin on /membership), who can
open every day as a **preview** — marked as such, playable, and never saved.
The rule is keyed to the portfolio, not to anyone's email (the site never
exposes sign-in addresses); since the content ships in the page anyway, it
is a courtesy rather than a secret. After Dashami the farewell shows, and the
strip stays for looking back. An open page
rolls over by itself.

## 3. The quiz

One multiple-choice question, four options, one tap — no second chances.
**In Bengali, with the English in brackets on the line below in small type**;
options are lettered ক খ গ ঘ. The Bengali spells names, rituals and places the
way the guide itself does (its "English (বাংলা)" pairs and mantra texts); the
few names the guide never writes in Bengali (film stars, Belur Math, the
Vedas…) use their standard spellings. Two questions were reworded because
their Bengali form answered itself — the Nabami and Dashami ones now ask for
the phrase or the ritual by description.
After answering: the right answer in green, a wrong pick in red, a line of
explanation, and a link to the guide chapter the answer comes from. Each
phone keeps its answer for the day and a streak of correct days in a row.

**Celebration.** A clock runs from the moment the question is on screen. A
right answer sets off confetti in the pujo's colours (skipped for anyone
whose phone asks for reduced motion) and earns a **badge** by speed (§5),
floating over the page for ten seconds, then settled beneath the answer. A wrong answer brings
neither.

**Play again.** Once answered, a "Play again" button (reset icon) clears the
answer and restarts the clock, so the next person on a shared family phone
gets a fresh go — confetti and badge included. The streak counts only the
day's first attempt, so a replay can't mend a wrong answer.

**The bank** (`web/src/content/uma-quiz.ts`, 26 questions — one per day). Days 0–25
(26 Sep – 21 Oct) are **intermediate** questions on Durga Pujo, its history
and Kolkata's great pujos (Sabarna Roy Choudhury, Shobhabazar, Kumortuli,
Bagbazar's Birashtami, Simla's "Swadeshi Thakur", Santosh Mitra Square…).
Answers from the guide were checked against a verbatim passage of their
chapter; answers from outside it against **at least two independent
reputable sources**, and those questions link out ("Read more ↗") to the best
one. Stable facts only — never a year's theme, prize or crowd count; living
politicians are kept out of the options. The pujo days get their own day's
question (Mahalaya, day 14, is the 1966 recording; Ashtami is Birashtami;
Dashami the aparajita). Thirty more verified questions — a Kojagari run and
the first, easier bank — are kept for next year in gitignored
`docs/tmp/uma-quiz-reserve-2026.ts`.

**Changing a question.** A saved answer remembers which question it
answered, so a question corrected on its own day simply reopens for everyone. **To add questions, append to the end of the
bank** — inserting in the middle would change the question on days already
played.

## 4. The puzzle

A 3 × 3 sliding puzzle: eight tiles from a photograph of Maa Durga, the
bottom-right square empty. **Drag** a tile in the gap's row or column toward
the gap: it follows the finger or mouse (carrying any tiles between) and
settles in when let go past about a third of a cell, or when flicked; a short,
slow drag springs back. A **tap** slides it straight in, and arrow keys work
on a computer. "Hold to peek" shows the whole picture; each tile's number sits
in its corner — on by default, and the "Numbers" button turns them off (the
phone remembers).

Dragging is built on Pointer Events — one code path for mouse and touch — so
it behaves the same in Chrome and Safari on a computer, iPhone Safari (iOS 13+)
and Android Chrome, OnePlus included. The tiles set `touch-action: none`, so a
finger drag moves the tile instead of scrolling the page.

- **Always solvable, same for everyone:** the day's shuffle is 60+ random
  legal moves from the finished picture, seeded by the date, so it can always
  be solved and every phone gets the same one.
- **Scoring:** moves (each tile moved counts one) and time from the first
  move. The first solve of the day is the one kept; "Play again" gives a
  random practice round.
- **Progress survives a reload** — the board is saved on the phone as you go.
- **Solving** sets off confetti and earns a **badge** by time (§5), floating
  over the game for ten seconds and then settled under the finished picture. Practice rounds earn badges too.

**The photographs.** Day 0 is the samiti's own 2023 pratima; Dashami (day 25)
is the boron — hands raising betel leaves to Maa's face — chosen for that day;
the other 24 are close portraits from **Pexels and Unsplash** (licences allow
free use; each photographer is credited in small type under the finished
picture). Photographers alternate day to day, and the pujo days get the most
striking faces (Mahalaya: the stylised face with golden hands). Each is
cropped square with Maa's face in the centre tile. Originals: gitignored
`docs/tmp/durga-face/`.

```sh
magick input.jpg -auto-orient -crop <side>x<side>+<x>+<y> +repage \
  -resize 900x900 -strip -quality 82 web/public/uma-puzzle/<name>.webp
```

## 5. Badges

A win earns one of five badges by speed — each a portrait of Maa in a ring of
a pujo colour (marigold, hibiscus, jarul, aparajita, lotus) and a short prayer
from the guide's **Pushpanjali** page: the Sanskrit in **Bengali script**
exactly as the guide prints it (checked by script), with the guide's own
**English** meaning. The card shows the earned badge large, the time, and all
five in a row with the earned one marked. At the moment of the win it
**floats over the game for ten seconds** (a draining bar; ✕ or a tap closes
it early), then settles into its place beneath the game and the page
scrolls to it. Ten different faces — five per game —
live in `web/public/uma-badges/`; everything else is `web/src/content/uma-badges.ts`.

| Badge | Puzzle — solved within | Quiz — answered within |
| --- | --- | --- |
| 1 (marigold) | 1 min · সর্বমঙ্গলমঙ্গল্যে… | 10 s · নমঃ মহিষঘ্নি মহামায়ে… |
| 2 (hibiscus) | 1 min 15 s · সংগ্রামে বিজয়ং দেহি… | 20 s · জয়ন্তী মঙ্গলা কালী… |
| 3 (jarul) | 1 min 30 s · নমঃ আয়ুর্দেহি যশো দেহি… | 40 s · নমঃ সৃষ্টিস্থিতিবিনাশানাং… |
| 4 (aparajita) | 1 min 45 s · সর্বস্বরূপে সর্বেশে… | 90 s · লক্ষ্মি লজ্জে মহাবিদ্যে… |
| 5 (lotus) | 2 min · নমঃ শরণাগতদীনার্ত… | any time · হর পাপং হর ক্লেশং… |

A puzzle solved in over two minutes earns no badge — the card says so and
shows the five to aim for; "Play again" gives another go. (For one afternoon
on 26 Sep 2026 a 20-second "blessing" overlay replaced the badges; the user
preferred the badges and they came back.)
