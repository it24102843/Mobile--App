export function createAuthConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function createOptionalAuthConfig(token) {
  if (!token) {
    return {};
  }

  return createAuthConfig(token);
}
