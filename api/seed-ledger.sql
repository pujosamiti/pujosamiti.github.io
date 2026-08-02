-- Ledger seed: two perpetual books + the sponsorship master catalog.
-- Catalog derived from the 2025 sponsorship board (each slot = one item).
-- Murti items carry NO default amount: each year's organizer composes the
-- Murti offering (add/skip items, set prices) via sponsorship_item_year.

INSERT INTO book (id, name, notes, is_active, created_at) VALUES
  ('pujo-ledger', 'Durga Pujo · Kojagari · Bijoy Sammelani · Saraswati', 'Perpetual combined ledger for the pujo season events', 1, unixepoch()),
  ('poila-baishakh-ledger', 'Poila Baishakh', 'Perpetual ledger for Poila Baishakh', 1, unixepoch());

INSERT INTO sponsorship_item (id, category, title, default_amount, sort_order, is_active, created_at) VALUES
  -- Murti (priced per year by the organizer)
  ('durga-idol', 'Murti', 'Durga Pujo Idol', NULL, 100, 1, unixepoch()),
  ('lakshmi-idol', 'Murti', 'Lakshmi Pujo Idol', NULL, 110, 1, unixepoch()),
  ('saraswati-idol', 'Murti', 'Saraswati Pujo Idol', NULL, 120, 1, unixepoch()),
  -- Stage
  ('murti-moncha', 'Stage', 'Murti Moncha', 100000, 200, 1, unixepoch()),
  -- Bhog
  ('sasthi-bhog', 'Bhog', 'Sasthi Bhog', 20000, 300, 1, unixepoch()),
  ('saptami-bhog-1', 'Bhog', 'Saptami Bhog 1', 20000, 310, 1, unixepoch()),
  ('saptami-bhog-2', 'Bhog', 'Saptami Bhog 2', 20000, 320, 1, unixepoch()),
  ('astami-bhog', 'Bhog', 'Astami Bhog', 30000, 330, 1, unixepoch()),
  ('nabami-bhog-1', 'Bhog', 'Nabami Bhog 1', 20000, 340, 1, unixepoch()),
  ('nabami-bhog-2', 'Bhog', 'Nabami Bhog 2', 20000, 350, 1, unixepoch()),
  ('dashami-bhog-1', 'Bhog', 'Dashami Bhog 1', 15000, 360, 1, unixepoch()),
  ('dashami-bhog-2', 'Bhog', 'Dashami Bhog 2', 15000, 370, 1, unixepoch()),
  ('lakshmi-pujo-bhog', 'Bhog', 'Lakshmi Pujor Bhog', 10000, 380, 1, unixepoch()),
  -- Puja
  ('sandhi-puja-1', 'Puja', 'Sandhi Puja 1', 5000, 400, 1, unixepoch()),
  ('sandhi-puja-2', 'Puja', 'Sandhi Puja 2', 5000, 405, 1, unixepoch()),
  ('sandhi-puja-3', 'Puja', 'Sandhi Puja 3', 5000, 410, 1, unixepoch()),
  ('sandhi-puja-4', 'Puja', 'Sandhi Puja 4', 5000, 415, 1, unixepoch()),
  ('sandhi-puja-5', 'Puja', 'Sandhi Puja 5', 5000, 420, 1, unixepoch()),
  ('sandhi-puja-6', 'Puja', 'Sandhi Puja 6', 5000, 425, 1, unixepoch()),
  ('sandhi-puja-7', 'Puja', 'Sandhi Puja 7', 5000, 430, 1, unixepoch()),
  ('padma-phul', 'Puja', 'Padma Phul', 5000, 440, 1, unixepoch()),
  ('thakurer-mala', 'Puja', 'Thakur er Mala', 5000, 445, 1, unixepoch()),
  ('saptami-puja-1', 'Puja', 'Saptami Puja 1', 5000, 450, 1, unixepoch()),
  ('saptami-puja-2', 'Puja', 'Saptami Puja 2', 5000, 455, 1, unixepoch()),
  ('astami-puja-1', 'Puja', 'Astami Puja 1', 5000, 460, 1, unixepoch()),
  ('astami-puja-2', 'Puja', 'Astami Puja 2', 5000, 465, 1, unixepoch()),
  ('astami-puja-3', 'Puja', 'Astami Puja 3', 5000, 470, 1, unixepoch()),
  ('astami-puja-4', 'Puja', 'Astami Puja 4', 5000, 475, 1, unixepoch()),
  ('astami-puja-5', 'Puja', 'Astami Puja 5', 5000, 480, 1, unixepoch()),
  ('nabami-puja-1', 'Puja', 'Nabami Puja 1', 5000, 485, 1, unixepoch()),
  ('nabami-puja-2', 'Puja', 'Nabami Puja 2', 5000, 490, 1, unixepoch()),
  -- Dhak
  ('dhaki-1', 'Dhak', 'Dhaki 1', 5000, 500, 1, unixepoch()),
  ('dhaki-2', 'Dhak', 'Dhaki 2', 5000, 510, 1, unixepoch()),
  -- Dakshina
  ('purohit-dakshina-1', 'Dakshina', 'Purohit Dakshina 1', 5000, 600, 1, unixepoch()),
  ('purohit-dakshina-2', 'Dakshina', 'Purohit Dakshina 2', 5000, 610, 1, unixepoch()),
  -- Samagri
  ('puja-samagri-1', 'Samagri', 'Puja Samagri 1', 5000, 700, 1, unixepoch()),
  ('puja-samagri-2', 'Samagri', 'Puja Samagri 2', 5000, 710, 1, unixepoch()),
  ('puja-samagri-3', 'Samagri', 'Puja Samagri 3', 5000, 720, 1, unixepoch());
