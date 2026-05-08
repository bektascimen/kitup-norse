-- Sigil (badge) strings for the Profile screen.
-- One row per (key, locale). Idempotent via ON CONFLICT.

insert into translations (key, locale, value) values
  -- Section header + UI chrome
  ('profile.section.sigils', 'tr', 'Sigiller'),
  ('profile.section.sigils', 'en', 'Sigils'),
  ('badge.detail.close', 'tr', 'Kapat'),
  ('badge.detail.close', 'en', 'Close'),
  ('badge.unlocked.eyebrow', 'tr', 'Sigil Kazanıldı'),
  ('badge.unlocked.eyebrow', 'en', 'Sigil Unlocked'),

  -- first_spark
  ('badge.first_spark.title', 'tr', 'İlk Kıvılcım'),
  ('badge.first_spark.title', 'en', 'First Spark'),
  ('badge.first_spark.condition', 'tr', 'İlk dersini tamamla'),
  ('badge.first_spark.condition', 'en', 'Complete your first lesson'),
  ('badge.first_spark.lore', 'tr', 'Yggdrasil''ın gölgesinde ilk meşale yandı. Yolculuk başladı.'),
  ('badge.first_spark.lore', 'en', 'The first torch flickered to life beneath Yggdrasil''s shade. The journey has begun.'),

  -- half_path
  ('badge.half_path.title', 'tr', 'Yarı Yolun Ozanı'),
  ('badge.half_path.title', 'en', 'Half-Path Bard'),
  ('badge.half_path.condition', 'tr', '21 günün yarısını aş'),
  ('badge.half_path.condition', 'en', 'Cross the halfway mark of the 21-day path'),
  ('badge.half_path.lore', 'tr', 'Bifrost''un orta köprü taşına ulaştın. Asgard ufukta görünüyor.'),
  ('badge.half_path.lore', 'en', 'You reached the middle stone of Bifrost. Asgard rises on the horizon.'),

  -- odins_journey
  ('badge.odins_journey.title', 'tr', 'Odin''in Yolculuğu'),
  ('badge.odins_journey.title', 'en', 'Odin''s Journey'),
  ('badge.odins_journey.condition', 'tr', '21 günün tamamını bitir'),
  ('badge.odins_journey.condition', 'en', 'Finish all 21 days'),
  ('badge.odins_journey.lore', 'tr', 'Mimir''in kuyusundan içtin. Bilgi artık seninle bir.'),
  ('badge.odins_journey.lore', 'en', 'You drank from Mimir''s well. Knowledge is yours to keep.'),

  -- week_falcon
  ('badge.week_falcon.title', 'tr', 'Yedi Gece Şahini'),
  ('badge.week_falcon.title', 'en', 'Falcon of Seven Nights'),
  ('badge.week_falcon.condition', 'tr', '7 gün üst üste çalış'),
  ('badge.week_falcon.condition', 'en', 'Practise seven days in a row'),
  ('badge.week_falcon.lore', 'tr', 'Freyja''nın şahini yedi gece boyunca seninle uçtu.'),
  ('badge.week_falcon.lore', 'en', 'Freyja''s falcon rode the wind with you for seven nights.'),

  -- fortnight_walker
  ('badge.fortnight_walker.title', 'tr', 'On Dört Geceye Tanık'),
  ('badge.fortnight_walker.title', 'en', 'Witness of Fourteen Nights'),
  ('badge.fortnight_walker.condition', 'tr', '14 gün üst üste çalış'),
  ('badge.fortnight_walker.condition', 'en', 'Practise fourteen days in a row'),
  ('badge.fortnight_walker.lore', 'tr', 'Hugin ve Munin omuzlarına kondu — hafıza ve düşünce yorulmadı.'),
  ('badge.fortnight_walker.lore', 'en', 'Hugin and Munin perched on your shoulders — memory and thought never tired.'),

  -- wise_speaker
  ('badge.wise_speaker.title', 'tr', 'Bilge Ses'),
  ('badge.wise_speaker.title', 'en', 'Wise Voice'),
  ('badge.wise_speaker.condition', 'tr', 'Quiz ortalaman %80 ve üzeri olsun'),
  ('badge.wise_speaker.condition', 'en', 'Hold a quiz average of 80% or higher'),
  ('badge.wise_speaker.lore', 'tr', 'Sözlerin Skald''ın altın yüzüğüne çekiç vurur gibi tınladı.'),
  ('badge.wise_speaker.lore', 'en', 'Your answers rang like a hammer striking the Skald''s golden ring.')
on conflict (key, locale) do update set value = excluded.value;
