import { Stack } from 'expo-router';
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useI18nStore } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { sendMagicLink } from '../../features/auth/magicLink';
import { appleAvailable, signInWithApple } from '../../features/auth/apple';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

export default function ProfileAccount() {
  const locale = useI18nStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const T = (tr: string, en: string) => (locale === 'en' ? en : tr);

  async function onSendLink() {
    setError(null);
    setSent(false);
    const r = await sendMagicLink(email);
    if (r.ok) setSent(true);
    else setError(r.error);
  }

  const isLinked = session && session.user.email && !session.user.is_anonymous;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <Stack.Screen options={{ title: T('Hesap', 'Account') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ᚦ {T('KİMLİK', 'IDENTITY')}</Text>
        {isLinked ? (
          <Text style={styles.body}>
            {T('Bağlı hesap:', 'Linked account:')}{' '}
            <Text style={styles.bodyEmphasis}>{session.user.email}</Text>
          </Text>
        ) : (
          <Text style={styles.body}>
            {T(
              'Şu an anonim bir gezginsin. Hesap oluşturarak ilerlemeni cihazlar arası taşı.',
              'You are an anonymous traveler. Link an identity to carry your progress across devices.',
            )}
          </Text>
        )}

        {!isLinked && (
          <>
            <Text style={styles.sectionLabel}>{T('E-POSTA İLE', 'WITH EMAIL')}</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={palette.shadow}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable style={styles.primaryCta} onPress={onSendLink}>
              <Text style={styles.primaryCtaText}>
                {T('SİHİRLİ BAĞLANTI GÖNDER', 'SEND MAGIC LINK')}
              </Text>
            </Pressable>
            {sent && (
              <Text style={styles.toast}>ᛞ {T('E-postanı kontrol et', 'Check your email')}</Text>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {appleAvailable && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>{T('APPLE İLE', 'WITH APPLE')}</Text>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={radius.md}
                  style={styles.appleBtn}
                  onPress={() => signInWithApple()}
                />
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, paddingTop: space.lg },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.sm,
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    marginBottom: space.xl,
  },
  bodyEmphasis: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontStyle: 'normal',
  },
  sectionLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.shadow,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    color: palette.parchment,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: space.md,
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
  },
  primaryCta: {
    marginTop: space.sm,
    padding: space.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.forge,
  },
  primaryCtaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.bg,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  toast: {
    fontFamily: fontFamily.displayMid,
    color: palette.moss,
    fontSize: fontSize.sm,
    letterSpacing: tracking.wide,
    marginTop: space.sm,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.clottedBlood,
    fontSize: fontSize.sm,
    marginTop: space.sm,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
    marginVertical: space.lg,
  },
  appleBtn: { height: 48 },
});
