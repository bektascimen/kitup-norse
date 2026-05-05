-- Seed: bootstrap UI strings (TR + EN) for the kitUP demo
insert into translations (key, locale, value) values
  ('app.name', 'tr', 'kitUP Norse'),
  ('app.name', 'en', 'kitUP Norse'),
  ('app.tagline', 'tr', 'Mitolojiyi günde 5 dakikada öğren'),
  ('app.tagline', 'en', 'Learn mythology in 5 minutes a day'),

  ('onboarding.welcome.title', 'tr', 'Hoş geldin, gezgin'),
  ('onboarding.welcome.title', 'en', 'Welcome, traveler'),
  ('onboarding.welcome.body', 'tr', 'Yggdrasil''ın dallarına çıkmaya hazır mısın?'),
  ('onboarding.welcome.body', 'en', 'Ready to climb the branches of Yggdrasil?'),
  ('onboarding.cta.continue', 'tr', 'Devam et'),
  ('onboarding.cta.continue', 'en', 'Continue'),
  ('onboarding.language.title', 'tr', 'Dilini seç'),
  ('onboarding.language.title', 'en', 'Choose your language'),

  ('tabs.today', 'tr', 'Bugün'),
  ('tabs.today', 'en', 'Today'),
  ('tabs.path', 'tr', 'Yol'),
  ('tabs.path', 'en', 'Path'),
  ('tabs.profile', 'tr', 'Profil'),
  ('tabs.profile', 'en', 'Profile'),

  ('today.streak.days_one', 'tr', '{{count}} gün'),
  ('today.streak.days_one', 'en', '{{count}} day'),
  ('today.streak.days_other', 'tr', '{{count}} gün'),
  ('today.streak.days_other', 'en', '{{count}} days'),
  ('today.reviews_due', 'tr', '{{count}} tekrar bekliyor'),
  ('today.reviews_due', 'en', '{{count}} reviews due'),
  ('today.cta.start', 'tr', 'Bugünün dersine başla'),
  ('today.cta.start', 'en', 'Start today''s lesson'),

  ('lesson.cta.continue_quiz', 'tr', 'Quiz''e geç'),
  ('lesson.cta.continue_quiz', 'en', 'Continue to quiz'),
  ('lesson.audio.play', 'tr', 'Dinle'),
  ('lesson.audio.play', 'en', 'Listen'),

  ('quiz.correct', 'tr', 'Doğru'),
  ('quiz.correct', 'en', 'Correct'),
  ('quiz.incorrect', 'tr', 'Yanlış'),
  ('quiz.incorrect', 'en', 'Incorrect'),
  ('quiz.explanation.title', 'tr', 'Açıklama'),
  ('quiz.explanation.title', 'en', 'Explanation'),
  ('quiz.submit', 'tr', 'Gönder'),
  ('quiz.submit', 'en', 'Submit'),
  ('quiz.next', 'tr', 'Sonraki'),
  ('quiz.next', 'en', 'Next'),
  ('quiz.finish', 'tr', 'Bitir'),
  ('quiz.finish', 'en', 'Finish'),

  ('day.complete.title', 'tr', 'Bugünlük yeterli'),
  ('day.complete.title', 'en', 'Enough for today'),
  ('day.complete.body', 'tr', 'Yarın seni bekliyorum.'),
  ('day.complete.body', 'en', 'I will await you tomorrow.'),

  ('profile.create_account', 'tr', 'Hesap oluştur'),
  ('profile.create_account', 'en', 'Create account'),
  ('profile.signin.apple', 'tr', 'Apple ile devam et'),
  ('profile.signin.apple', 'en', 'Continue with Apple'),
  ('profile.signin.email', 'tr', 'E-posta ile bağlan'),
  ('profile.signin.email', 'en', 'Link with email'),
  ('profile.language', 'tr', 'Dil'),
  ('profile.language', 'en', 'Language'),
  ('profile.notification_time', 'tr', 'Hatırlatma saati'),
  ('profile.notification_time', 'en', 'Reminder time'),
  ('profile.sign_out', 'tr', 'Çıkış yap'),
  ('profile.sign_out', 'en', 'Sign out'),

  ('notifications.daily.title', 'tr', 'Yggdrasil''ın çağrısı'),
  ('notifications.daily.title', 'en', 'A call from Yggdrasil'),
  ('notifications.daily.body', 'tr', 'Bugünkü ders seni bekliyor 🐺'),
  ('notifications.daily.body', 'en', 'Today''s lesson awaits 🐺')
on conflict (key, locale) do nothing;

-- Seed: app_config defaults
insert into app_config (key, value) values
  ('feature.streak.enabled', 'true'::jsonb),
  ('feature.spaced_repetition.enabled', 'true'::jsonb),
  ('feature.ai_generation.enabled', 'true'::jsonb),
  ('ai.gemini.model', '"gemini-2.5-flash"'::jsonb),
  ('content.daily_reminder.default_time', '"19:00"'::jsonb)
on conflict (key) do nothing;
