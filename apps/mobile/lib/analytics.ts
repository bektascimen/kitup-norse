import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
};

const apiKey = extra.POSTHOG_API_KEY;
const host = extra.POSTHOG_HOST ?? 'https://app.posthog.com';

export const posthog: PostHog | null = apiKey ? new PostHog(apiKey, { host }) : null;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export function track(event: string, props?: Record<string, Json>) {
  posthog?.capture(event, props);
}
