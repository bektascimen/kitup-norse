import { Redirect } from 'expo-router';
import { useOnboarding } from '../features/onboarding/store';

export default function Index() {
  const completed = useOnboarding((s) => s.completed);
  return <Redirect href={completed ? '/(tabs)' : '/(onboarding)/welcome'} />;
}
