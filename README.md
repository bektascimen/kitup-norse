# kitUP — Norse Mythology Microlearning

Mobile microlearning app + admin web + Gemini-powered content generation.
Case study for kitUP. See `docs/superpowers/specs/` for design and `docs/superpowers/plans/` for implementation plan.

## Quick start

```bash
pnpm install
pnpm dev # starts mobile + admin in parallel
```

Setup details to be expanded in Phase 14.

### iOS home-screen widget

The `TodayWidget` Swift target is scaffolded under `apps/mobile/widgets/ios/`. To build:

1. Set `appleTeamId` in `apps/mobile/app.config.ts` to your Apple Developer team ID.
2. Run `pnpm --filter @kitup/mobile expo prebuild --platform ios --clean`.
3. Run `pnpm --filter @kitup/mobile ios` (or open `ios/kitup-norse.xcworkspace` in Xcode).
4. The widget reads JSON from App Group `group.com.kitup.norse`, key `today.json`. The
   `syncTodayWidget` helper currently logs only — wire a native bridge (e.g.
   `react-native-shared-group-preferences`) before the demo.
