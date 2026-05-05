import WidgetKit
import SwiftUI

struct TodayEntry: TimelineEntry {
  let date: Date
  let title: String
  let day: Int
  let totalDays: Int
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry {
    TodayEntry(date: Date(), title: "Yggdrasil", day: 1, totalDays: 21)
  }
  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    let entry = read()
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60*60))))
  }
  private func read() -> TodayEntry {
    let suite = UserDefaults(suiteName: "group.com.kitup.norse")
    guard let data = suite?.data(forKey: "today.json"),
          let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return TodayEntry(date: Date(), title: "kitUP Norse", day: 0, totalDays: 21)
    }
    return TodayEntry(
      date: Date(),
      title: (dict["title"] as? String) ?? "—",
      day: (dict["day"] as? Int) ?? 0,
      totalDays: (dict["totalDays"] as? Int) ?? 21
    )
  }
}

struct TodayWidgetView: View {
  let entry: TodayEntry
  var body: some View {
    Link(destination: URL(string: "kitup://lesson/today")!) {
      VStack(alignment: .leading, spacing: 6) {
        Text("DAY \(entry.day) / \(entry.totalDays)")
          .font(.caption2).foregroundColor(Color(red: 201/255, green: 169/255, blue: 110/255))
        Text(entry.title).font(.headline).foregroundColor(.white).lineLimit(2)
      }
      .padding()
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .background(Color(red: 11/255, green: 14/255, blue: 20/255))
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
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
