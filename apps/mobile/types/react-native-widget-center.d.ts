declare module 'react-native-widget-center' {
  /**
   * Minimal typing for react-native-widget-center 0.0.9. Only the
   * methods actually used in this codebase are typed; the upstream
   * package ships no .d.ts.
   */
  export default class WidgetCenter {
    static widgetCenterSupported: boolean;
    static reloadAllTimelines(): void;
    static reloadTimelines(kind: string): void;
  }
}
