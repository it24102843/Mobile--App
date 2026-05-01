import Constants from 'expo-constants';

function normalizeUrl(url) {
  return url.replace(/\/+$/, '');
}

function extractHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHost(host) {
  return host === 'localhost' || host === '127.0.0.1';
}

function isPrivateIpv4(host) {
  if (!host || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return false;
  }

  const [first, second] = host.split('.').map(Number);

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function extractExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri ?? null;

  if (!hostUri) {
    return null;
  }

  const withoutProtocol = hostUri.replace(/^https?:\/\//, '');
  const hostWithOptionalPort = withoutProtocol.split('/')[0] ?? '';
  const host = hostWithOptionalPort.split(':')[0] ?? '';

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

function replaceUrlHost(url, nextHost) {
  try {
    const parsed = new URL(url);
    parsed.hostname = nextHost;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return normalizeUrl(url);
  }
}

const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHost = extractExpoHost();
const explicitApiHost = extractHost(explicitApiUrl || '');

const resolvedExplicitApiUrl = explicitApiUrl
  ? isLoopbackHost(explicitApiHost) && expoHost
    ? replaceUrlHost(explicitApiUrl, expoHost)
    : expoHost && explicitApiHost && isPrivateIpv4(explicitApiHost) && explicitApiHost !== expoHost
      ? replaceUrlHost(explicitApiUrl, expoHost)
      : normalizeUrl(explicitApiUrl)
  : null;

export const API_BASE_URL = resolvedExplicitApiUrl
  ? resolvedExplicitApiUrl
  : expoHost
    ? `http://${expoHost}:5000/api`
    : 'http://localhost:5000/api';

export const API_CONNECTION_HINT = resolvedExplicitApiUrl
  ? resolvedExplicitApiUrl !== explicitApiUrl
    ? `Adjusted EXPO_PUBLIC_API_URL to current Expo host: ${API_BASE_URL}`
    : `Using EXPO_PUBLIC_API_URL: ${API_BASE_URL}`
  : expoHost
    ? `Using Expo Go host detection: ${API_BASE_URL}`
    : 'Using localhost fallback. On a physical device, set EXPO_PUBLIC_API_URL or make sure Expo Go can detect your computer IP.';

export const IS_LOCALHOST_FALLBACK = !resolvedExplicitApiUrl && !expoHost;
