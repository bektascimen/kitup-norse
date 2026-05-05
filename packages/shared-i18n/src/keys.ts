export const I18N_KEYS = {
  app: {
    name: 'app.name',
    tagline: 'app.tagline',
  },
  onboarding: {
    welcome_title: 'onboarding.welcome.title',
    welcome_body: 'onboarding.welcome.body',
    cta_continue: 'onboarding.cta.continue',
    language_pick_title: 'onboarding.language.title',
  },
  tabs: {
    today: 'tabs.today',
    path: 'tabs.path',
    profile: 'tabs.profile',
  },
  today: {
    streak_days_one: 'today.streak.days_one',
    streak_days_other: 'today.streak.days_other',
    reviews_due: 'today.reviews_due',
    cta_start: 'today.cta.start',
  },
  lesson: {
    cta_continue_quiz: 'lesson.cta.continue_quiz',
    audio_play: 'lesson.audio.play',
  },
  quiz: {
    correct: 'quiz.correct',
    incorrect: 'quiz.incorrect',
    explanation_title: 'quiz.explanation.title',
    submit: 'quiz.submit',
    next_question: 'quiz.next',
    finish: 'quiz.finish',
  },
  day_complete: {
    title: 'day.complete.title',
    body: 'day.complete.body',
  },
  profile: {
    create_account: 'profile.create_account',
    sign_in_apple: 'profile.signin.apple',
    sign_in_email: 'profile.signin.email',
    language: 'profile.language',
    notification_time: 'profile.notification_time',
    sign_out: 'profile.sign_out',
  },
  notifications: {
    daily_title: 'notifications.daily.title',
    daily_body: 'notifications.daily.body',
  },
} as const;

type Leaf = string;
type DeepLeaves<T> = T extends Leaf ? T : T extends object ? DeepLeaves<T[keyof T]> : never;
export type I18nKey = DeepLeaves<typeof I18N_KEYS>;
