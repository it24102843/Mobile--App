import { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppTextField } from '../../components/AppTextField';
import { BrandLogo } from '../../components/BrandLogo';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { submitInquiry } from '../../services/contactApi';
import { theme } from '../../theme';
import {
  hasMinLength,
  isValidEmail,
  isValidPhone,
  normalizeInput,
} from '../../utils/validation';

const CONTACT_DETAILS = {
  phoneDisplay: '+94 77 123 4567',
  phoneDial: '+94771234567',
  email: 'support@wildhaven.com',
  address: 'Kataragama, Sri Lanka',
  hours: 'Daily • 8:00 AM - 8:00 PM',
  mapQuery: 'Kataragama, Sri Lanka',
};

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

function buildDefaultName(user) {
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  return fullName || '';
}

export default function ContactUsScreen() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('muted');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: current.fullName || buildDefaultName(user),
      email: current.email || user?.email || '',
      phone: current.phone || user?.phone || '',
    }));
  }, [user]);

  const contactCards = useMemo(
    () => [
      {
        key: 'phone',
        icon: 'phone-outline',
        title: 'Phone Number',
        value: CONTACT_DETAILS.phoneDisplay,
      },
      {
        key: 'email',
        icon: 'email-outline',
        title: 'Email Address',
        value: CONTACT_DETAILS.email,
      },
      {
        key: 'address',
        icon: 'map-marker-outline',
        title: 'Location',
        value: CONTACT_DETAILS.address,
      },
      {
        key: 'hours',
        icon: 'clock-time-four-outline',
        title: 'Opening Hours',
        value: CONTACT_DETAILS.hours,
      },
    ],
    []
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!normalizeInput(form.fullName)) {
      nextErrors.fullName = 'Full name is required.';
    } else if (!hasMinLength(form.fullName, 3)) {
      nextErrors.fullName = 'Full name must contain at least 3 characters.';
    }

    if (!normalizeInput(form.email)) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (normalizeInput(form.phone) && !isValidPhone(form.phone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    if (!normalizeInput(form.subject)) {
      nextErrors.subject = 'Subject is required.';
    }

    if (!normalizeInput(form.message)) {
      nextErrors.message = 'Message is required.';
    } else if (!hasMinLength(form.message, 10)) {
      nextErrors.message = 'Message must contain at least 10 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openExternalUrl = async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      setStatusTone('error');
      setStatusMessage('This action is not available on your device right now.');
      return;
    }

    await Linking.openURL(url);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      setStatusTone('error');
      setStatusMessage('Please review the highlighted fields and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage('');

      const payload = {
        fullName: normalizeInput(form.fullName),
        email: normalizeInput(form.email).toLowerCase(),
        phone: normalizeInput(form.phone),
        subject: normalizeInput(form.subject),
        message: normalizeInput(form.message),
      };

      const response = await submitInquiry(payload, isAuthenticated ? token : null);

      setStatusTone('success');
      setStatusMessage(
        response?.message || 'Your message has been sent successfully. We will get back to you soon.'
      );

      setForm({
        ...INITIAL_FORM,
        fullName: buildDefaultName(user),
        email: user?.email || '',
        phone: user?.phone || '',
      });

      if (isAuthenticated && response?.inquiry?.id) {
        setTimeout(() => {
          router.push(`/inquiries/${response.inquiry.id}`);
        }, 400);
      }

    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to send your message.';
      setStatusTone('error');
      setStatusMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Contact Us"
          subtitle="We’re here to help plan your perfect stay"
          fallbackHref="/(tabs)"
        />

        <AppCard variant="primary" style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <BrandLogo size="sm" pressable href="/(tabs)" />
          </View>

          <Text style={styles.heroTitle}>Contact WildHaven</Text>
          <Text style={styles.heroSubtitle}>
            Reach our team for stays, safari planning, dining questions, and travel support across your WildHaven experience.
          </Text>
        </AppCard>

        <View style={styles.infoGrid}>
          {contactCards.map((card) => (
            <AppCard key={card.key} style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <MaterialCommunityIcons name={card.icon} size={22} color={theme.colors.accent} />
              </View>
              <Text style={styles.infoTitle}>{card.title}</Text>
              <Text style={styles.infoValue}>{card.value}</Text>
            </AppCard>
          ))}
        </View>

        <AppCard style={styles.actionsCard}>
          <Text style={styles.sectionEyebrow}>Quick Actions</Text>
          <Text style={styles.sectionTitle}>Reach us instantly</Text>

          <View style={styles.actionsRow}>
            <View style={styles.actionButtonWrap}>
              <AppButton
                title="Call Now"
                onPress={() => void openExternalUrl(`tel:${CONTACT_DETAILS.phoneDial}`)}
              />
            </View>
            <View style={styles.actionButtonWrap}>
              <AppButton
                title="Send Email"
                variant="secondary"
                onPress={() => void openExternalUrl(`mailto:${CONTACT_DETAILS.email}`)}
              />
            </View>
          </View>

          <AppButton
            title="Open Map"
            variant="info"
            onPress={() =>
              void openExternalUrl(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_DETAILS.mapQuery)}`
              )
            }
          />
        </AppCard>

        <AppCard style={styles.formCard}>
          <Text style={styles.sectionEyebrow}>Send an Inquiry</Text>
          <Text style={styles.sectionTitle}>Tell us how we can help</Text>
          <Text style={styles.sectionSubtitle}>
            Submit a real message to the WildHaven inquiry system. Signed-in guests can send inquiries with their saved details.
          </Text>

          <View style={styles.formFields}>
            <AppTextField
              label="Full Name"
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              error={errors.fullName}
              placeholder="Your full name"
              autoCapitalize="words"
            />

            <AppTextField
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              error={errors.email}
              placeholder="guest@wildhaven.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppTextField
              label="Phone Number"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              error={errors.phone}
              placeholder="+94 77 123 4567"
              keyboardType="phone-pad"
            />

            <AppTextField
              label="Subject"
              value={form.subject}
              onChangeText={(value) => updateField('subject', value)}
              error={errors.subject}
              placeholder="Booking help, safari support, dining request..."
            />

            <AppTextField
              label="Message"
              value={form.message}
              onChangeText={(value) => updateField('message', value)}
              error={errors.message}
              placeholder="Tell us what you need and our team will get back to you."
              multiline
            />
          </View>

          {statusMessage ? (
            <View
              style={[
                styles.statusBanner,
                statusTone === 'success' ? styles.statusBannerSuccess : null,
                statusTone === 'error' ? styles.statusBannerError : null,
              ]}>
              <MaterialCommunityIcons
                name={
                  statusTone === 'success'
                    ? 'check-circle-outline'
                    : statusTone === 'error'
                      ? 'alert-circle-outline'
                      : 'information-outline'
                }
                size={18}
                color={
                  statusTone === 'success'
                    ? theme.colors.success
                    : statusTone === 'error'
                      ? theme.colors.errorText
                      : theme.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.statusText,
                  statusTone === 'success' ? styles.statusTextSuccess : null,
                  statusTone === 'error' ? styles.statusTextError : null,
                ]}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          <AppButton
            title={isSubmitting ? 'Sending...' : 'Send Message'}
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
          />

          {isAuthenticated ? (
            <AppButton
              title="View My Inquiries"
              variant="secondary"
              onPress={() => router.push('/inquiries')}
            />
          ) : null}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F2E9',
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: theme.spacing.md,
    shadowColor: '#10223D',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  heroTitle: {
    color: theme.colors.textOnDark,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#D7E3F3',
    ...theme.typography.body,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoCard: {
    width: '47.5%',
    gap: theme.spacing.sm,
    backgroundColor: '#FFFDF9',
    borderColor: '#E6DDCC',
    minHeight: 148,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF2DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: theme.colors.text,
    ...theme.typography.label,
  },
  infoValue: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actionsCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#E6DDCC',
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    ...theme.typography.eyebrow,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButtonWrap: {
    flex: 1,
  },
  formCard: {
    gap: theme.spacing.md,
    backgroundColor: '#FFFDF9',
    borderColor: '#E6DDCC',
  },
  formFields: {
    gap: theme.spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBannerSuccess: {
    backgroundColor: '#ECFDF3',
    borderColor: '#BBF7D0',
  },
  statusBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    flex: 1,
    color: theme.colors.textMuted,
    ...theme.typography.bodySmall,
  },
  statusTextSuccess: {
    color: '#166534',
  },
  statusTextError: {
    color: theme.colors.errorText,
  },
});
