import Markdown from 'react-native-markdown-display';
import { palette, fontFamily, fontSize } from '../theme';

export default function Body({ children }: { children: string }) {
  return (
    <Markdown
      style={{
        body: { color: palette.textHigh, fontFamily: fontFamily.body, fontSize: fontSize.md, lineHeight: 24 },
        heading1: { color: palette.textHigh, fontFamily: fontFamily.display, fontSize: fontSize.xxl },
        heading2: { color: palette.textHigh, fontFamily: fontFamily.display, fontSize: fontSize.xl },
        em: { color: palette.accent },
        strong: { color: palette.rune },
        bullet_list: { color: palette.textMid },
      }}
    >
      {children}
    </Markdown>
  );
}
