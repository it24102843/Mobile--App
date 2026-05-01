import { DefaultTheme } from '@react-navigation/native';

const colors = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFD',
  inputBackground: '#FFFFFF',
  badgeInner: '#FFFFFF',
  primary: '#173B6C',
  primarySoft: '#EAF1FB',
  primaryMuted: '#C9D7EC',
  header: '#173B6C',
  accent: '#F28C28',
  accentPressed: '#D97719',
  accentSoft: '#FFF0DD',
  gold: '#C9A23A',
  goldMuted: '#FFF6DE',
  warning: '#C9A23A',
  warningSurface: '#FFF8E5',
  warningText: '#7A6118',
  danger: '#D64545',
  dangerSurface: '#FDECEC',
  dangerText: '#A03333',
  dangerBorder: '#F2B9B9',
  info: '#8B7CF0',
  infoSurface: '#F2EEFF',
  infoText: '#5440B5',
  infoBorder: '#D7D0FF',
  text: '#1E293B',
  textMuted: '#5F6F85',
  textSubtle: '#8A97A8',
  textOnDark: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  border: '#D9E2EC',
  borderStrong: '#BCC9D8',
  shadow: '#173B6C',
  success: '#1F9D68',
  successSurface: '#E7F7EF',
  successText: '#146948',
  errorSurface: '#FDECEC',
  errorBorder: '#F2B9B9',
  errorText: '#A03333',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

const typography = {
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
};

const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  subtle: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  layout: {
    screenPaddingHorizontal: spacing.xxl,
    screenPaddingVertical: spacing.xl,
  },
  components: {
    button: {
      minHeight: 54,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.lg,
      variants: {
        primary: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          textColor: colors.textOnPrimary,
        },
        secondary: {
          backgroundColor: colors.surface,
          borderColor: colors.accent,
          textColor: colors.accent,
        },
        warning: {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
          textColor: colors.textOnPrimary,
        },
        danger: {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          textColor: colors.textOnPrimary,
        },
        info: {
          backgroundColor: colors.info,
          borderColor: colors.info,
          textColor: colors.textOnPrimary,
        },
        ghost: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: colors.primary,
        },
      },
    },
    card: {
      padding: spacing.xl,
      borderRadius: radii.xl,
      variants: {
        default: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        subtle: {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        primary: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        warning: {
          backgroundColor: colors.warningSurface,
          borderColor: colors.warning,
        },
        info: {
          backgroundColor: colors.infoSurface,
          borderColor: colors.infoBorder,
        },
        danger: {
          backgroundColor: colors.dangerSurface,
          borderColor: colors.dangerBorder,
        },
      },
    },
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.accent,
    notification: theme.colors.accent,
  },
};
