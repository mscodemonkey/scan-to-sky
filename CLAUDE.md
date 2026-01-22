# CLAUDE.md

## IMPORTANT
Never add a Co-Authored-By: Claude in any commits
Always commit as mscodemonkey 
Never commit as Claude

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npx expo start       # Start development server (opens options for iOS/Android/web)
npx expo start --ios # Start iOS simulator directly
npx expo start --android # Start Android emulator directly
npx expo start --web # Start web version
npm run lint         # Run ESLint via expo lint
```

## Architecture

This is an Expo React Native app (SDK 54) using file-based routing via expo-router.

### Routing Structure

- `app/_layout.tsx` - Root layout with ThemeProvider and Stack navigation
- `app/(tabs)/_layout.tsx` - Tab navigator configuration (Home and Explore tabs)
- `app/(tabs)/index.tsx` - Home tab screen
- `app/(tabs)/explore.tsx` - Explore tab screen
- `app/modal.tsx` - Modal screen presented over tabs

Routes use the `(tabs)` group notation for tab-based navigation. The root layout sets `unstable_settings.anchor` to `(tabs)` for initial route configuration.

### Path Aliases

Use `@/` to import from the project root (configured in tsconfig.json):
```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
```

### Theme System

- `constants/theme.ts` - Exports `Colors` (light/dark color schemes) and `Fonts` (platform-specific font families)
- `hooks/use-color-scheme.ts` - Hook for detecting system color scheme (with `.web.ts` variant)
- `hooks/use-theme-color.ts` - Hook for getting theme-aware colors
- Components: `themed-text.tsx` and `themed-view.tsx` for theme-aware primitives

### Platform-Specific Files

Use `.ios.tsx` and `.web.ts` suffixes for platform-specific implementations (e.g., `icon-symbol.ios.tsx` vs `icon-symbol.tsx`).

### Key Configuration

- `app.json` - Expo config with `newArchEnabled: true`, `typedRoutes: true`, and `reactCompiler: true` experiments enabled
- TypeScript strict mode enabled
