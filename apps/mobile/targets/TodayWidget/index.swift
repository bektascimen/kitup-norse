import WidgetKit
import SwiftUI

// MARK: - Palette (mirrors apps/mobile/theme/tokens.ts)

private let forge = Color(red: 201/255, green: 169/255, blue: 110/255)
private let forgeDeep = Color(red: 140/255, green: 115/255, blue: 73/255)
private let bg = Color(red: 11/255, green: 14/255, blue: 20/255)
private let bgDeeper = Color(red: 7/255, green: 9/255, blue: 18/255)
private let parchment = Color(red: 232/255, green: 230/255, blue: 220/255)
private let mist = Color(red: 168/255, green: 164/255, blue: 150/255)

// MARK: - Timeline

struct TodayEntry: TimelineEntry {
  let date: Date
  let title: String
  let day: Int
  let totalDays: Int
  let streak: Int
  /// Empty string falls back to the app root URL.
  let lessonId: String
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry {
    TodayEntry(
      date: Date(),
      title: "Yggdrasil ve Dokuz Dünya",
      day: 2,
      totalDays: 21,
      streak: 3,
      lessonId: ""
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    completion(read())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    let entry = read()
    // Refresh every 15 minutes. iOS will rate-limit our actual reload
    // budget anyway, so this is more of a hint. Host app currently
    // doesn't call WidgetCenter.reloadAllTimelines (no bridge yet);
    // dropping from 1h → 15m keeps the lockscreen / home from
    // showing yesterday's content too long after a day completes.
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60 * 15))))
  }

  private func read() -> TodayEntry {
    let suite = UserDefaults(suiteName: "group.com.kitup.norse")
    // The JS bridge (react-native-shared-group-preferences) stores values
    // via `setValue:forKey:` which writes an NSString. We JSON-decode on
    // this side. Reading via `data(forKey:)` returns nil because the
    // underlying storage is a string, not Data — that was the original
    // "DAY 00 / kitUP Norse" placeholder bug.
    guard let raw = suite?.string(forKey: "today.json"),
          let data = raw.data(using: .utf8),
          let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return TodayEntry(
        date: Date(),
        title: "kitUP Norse",
        day: 0,
        totalDays: 21,
        streak: 0,
        lessonId: ""
      )
    }
    return TodayEntry(
      date: Date(),
      title: (dict["title"] as? String) ?? "—",
      day: (dict["day"] as? Int) ?? 0,
      totalDays: (dict["totalDays"] as? Int) ?? 21,
      streak: (dict["streak"] as? Int) ?? 0,
      lessonId: (dict["lessonId"] as? String) ?? ""
    )
  }
}

// MARK: - Atomics

/// 21-tick rune strip — filled segments forge-gold, remaining segments
/// dimmed. Visually communicates progress through the course at a glance,
/// way more legible than a "2 / 21" string.
struct ProgressStrip: View {
  let day: Int
  let totalDays: Int

  var body: some View {
    GeometryReader { geo in
      let count = max(totalDays, 1)
      let gap: CGFloat = 3
      let tick = max(2, (geo.size.width - gap * CGFloat(count - 1)) / CGFloat(count))
      HStack(spacing: gap) {
        ForEach(0..<count, id: \.self) { i in
          Capsule()
            .fill(i < day ? forge : forge.opacity(0.18))
            .frame(width: tick, height: 4)
        }
      }
    }
    .frame(height: 4)
  }
}

/// Streak chip with a runic mark. Hidden when streak is 0 — empty
/// states should feel quiet, not preachy.
struct StreakChip: View {
  let streak: Int

  var body: some View {
    if streak > 0 {
      HStack(spacing: 4) {
        Text("ᚺ")
          .font(.system(size: 11, weight: .bold, design: .serif))
          .foregroundColor(forge)
        Text("\(streak)")
          .font(.system(size: 11, weight: .semibold, design: .serif))
          .foregroundColor(parchment)
        Text("NIGHT STREAK")
          .font(.system(size: 8, weight: .semibold))
          .tracking(1.6)
          .foregroundColor(mist)
      }
    }
  }
}

// MARK: - Layouts

struct SmallView: View {
  let entry: TodayEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Eyebrow + decorative rune
      HStack {
        Text("ᛞ DAY")
          .font(.system(size: 9, weight: .semibold, design: .serif))
          .tracking(2.6)
          .foregroundColor(forge)
        Spacer()
        Text("ᛟ")
          .font(.system(size: 14, weight: .regular, design: .serif))
          .foregroundColor(forge.opacity(0.4))
      }

      // Big day / total
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(String(format: "%02d", entry.day))
          .font(.system(size: 46, weight: .bold, design: .serif))
          .foregroundColor(parchment)
          .kerning(-1.5)
        Text("/ \(entry.totalDays)")
          .font(.system(size: 13, weight: .regular, design: .serif))
          .foregroundColor(mist)
      }
      .padding(.top, -2)

      ProgressStrip(day: entry.day, totalDays: entry.totalDays)
        .padding(.top, 6)

      Spacer(minLength: 6)

      Text(entry.title)
        .font(.system(size: 12, weight: .medium, design: .serif))
        .foregroundColor(parchment)
        .lineLimit(2)
        .multilineTextAlignment(.leading)
    }
  }
}

struct MediumView: View {
  let entry: TodayEntry

  var body: some View {
    HStack(alignment: .top, spacing: 14) {
      // Left: big day number column
      VStack(alignment: .leading, spacing: 4) {
        Text("ᛞ DAY")
          .font(.system(size: 9, weight: .semibold, design: .serif))
          .tracking(2.6)
          .foregroundColor(forge)
        Text(String(format: "%02d", entry.day))
          .font(.system(size: 60, weight: .bold, design: .serif))
          .foregroundColor(parchment)
          .kerning(-2)
          .padding(.top, -4)
        Text("OF \(entry.totalDays)")
          .font(.system(size: 9, weight: .semibold, design: .serif))
          .tracking(2.4)
          .foregroundColor(mist)
      }

      // Vertical hairline divider
      Rectangle()
        .fill(forge.opacity(0.3))
        .frame(width: 1)
        .padding(.vertical, 4)

      // Right: title + progress + streak
      VStack(alignment: .leading, spacing: 8) {
        Text(entry.title)
          .font(.system(size: 15, weight: .semibold, design: .serif))
          .foregroundColor(parchment)
          .lineLimit(3)
          .multilineTextAlignment(.leading)
        Spacer(minLength: 0)
        ProgressStrip(day: entry.day, totalDays: entry.totalDays)
        StreakChip(streak: entry.streak)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

// MARK: - Container

struct TodayWidgetView: View {
  let entry: TodayEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    // Open the actual lesson row when a real id is in the payload;
    // otherwise just open the app to its launch route (Bugün tab).
    let url = entry.lessonId.isEmpty
      ? URL(string: "kitup://")!
      : URL(string: "kitup://lesson/\(entry.lessonId)")!
    Link(destination: url) {
      Group {
        switch family {
        case .systemSmall:
          SmallView(entry: entry)
        default:
          MediumView(entry: entry)
        }
      }
    }
    .containerBackground(for: .widget) {
      ZStack {
        bgDeeper
        // Soft warm halo top-left + cool falloff bottom-right —
        // matches the admin/mobile gradient backdrop tone so the
        // widget reads as part of the same atmosphere.
        RadialGradient(
          gradient: Gradient(colors: [forge.opacity(0.12), .clear]),
          center: .topLeading,
          startRadius: 4,
          endRadius: 220
        )
        RadialGradient(
          gradient: Gradient(colors: [forgeDeep.opacity(0.08), .clear]),
          center: .bottomTrailing,
          startRadius: 8,
          endRadius: 240
        )
      }
    }
  }
}

@main
struct TodayWidget: Widget {
  let kind: String = "TodayWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: TodayProvider()) { entry in
      TodayWidgetView(entry: entry)
    }
    .configurationDisplayName("Today's Norse Lesson")
    .description("Your daily passage of Yggdrasil.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
