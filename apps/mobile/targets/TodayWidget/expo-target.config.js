/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'TodayWidget',
  displayName: "Today's Norse Lesson",
  // Explicit bundle id — the plugin's default appendix derivation
  // produces `com.kitup.norse.widget`, which is squatted on Apple's
  // side and can't be auto-registered by a personal team. A leading
  // dot here is treated as relative to the host bundle id, so this
  // resolves to `com.kitup.norse.todaywidget`.
  bundleIdentifier: '.todaywidget',
  // App Group lets the widget read the same UserDefaults suite the app
  // writes to via syncTodayWidget() / SharedGroupPreferences.
  entitlements: {
    'com.apple.security.application-groups': ['group.com.kitup.norse'],
  },
  frameworks: ['WidgetKit', 'SwiftUI'],
};
