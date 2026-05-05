import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { palette, fontFamily, fontSize, space } from '../theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: palette.bg,
  },
  title: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: palette.textHigh },
  link: { marginTop: space.lg, paddingVertical: space.md },
  linkText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.md, color: palette.accent },
});
