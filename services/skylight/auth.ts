import { Platform } from 'react-native';

const BASE_URL = 'https://app.ourskylight.com';

export interface AuthenticatedUser {
  id: string;
  email: string;
  token: string;
  subscriptionStatus: string;
}

export interface LoginResult {
  user: AuthenticatedUser;
  authToken: string; // Base64 encoded "id:token" for Authorization header
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function base64Encode(str: string): string {
  if (Platform.OS === 'web') {
    return btoa(str);
  }
  // React Native doesn't have btoa, use a simple implementation
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const byte1 = str.charCodeAt(i);
    const byte2 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const byte3 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;

    if (i + 1 >= str.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    } else if (i + 2 >= str.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    } else {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }
  }
  return output;
}

interface AuthResponse {
  data: {
    id: string;
    type: 'authenticated_user';
    attributes: {
      email: string;
      token: string;
      subscription_status: string;
    };
  };
  meta?: {
    password_reset?: boolean;
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthError('Invalid email or password');
    }
    if (response.status === 422) {
      throw new AuthError('Invalid email format or missing fields');
    }
    throw new AuthError(`Login failed (${response.status})`);
  }

  const data: AuthResponse = await response.json();

  const userId = data.data.id;
  const token = data.data.attributes.token;

  // Create the auth token: Base64(id:token)
  const authToken = base64Encode(`${userId}:${token}`);

  return {
    user: {
      id: userId,
      email: data.data.attributes.email,
      token: token,
      subscriptionStatus: data.data.attributes.subscription_status,
    },
    authToken,
  };
}

// Fetch the user's frame ID (needed for all other API calls)
export async function getFrameId(authToken: string, userId: string): Promise<string> {
  // Try multiple approaches to discover frame ID

  // Approach 1: Try /api/frames to list all frames
  try {
    const framesResponse = await fetch(`${BASE_URL}/api/frames`, {
      headers: {
        Authorization: `Basic ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (framesResponse.ok) {
      const framesData = await framesResponse.json();
      if (framesData.data && Array.isArray(framesData.data) && framesData.data.length > 0) {
        console.log('Found frame via /api/frames:', framesData.data[0].id);
        return framesData.data[0].id;
      }
    }
  } catch (e) {
    console.log('Failed to fetch /api/frames:', e);
  }

  // Approach 2: Try /api/users/me with include=frames
  try {
    const meResponse = await fetch(`${BASE_URL}/api/users/me?include=frames`, {
      headers: {
        Authorization: `Basic ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (meResponse.ok) {
      const data = await meResponse.json();
      // Check for frame in relationships
      if (data.data?.relationships?.frames?.data?.[0]?.id) {
        console.log('Found frame via /users/me relationships');
        return data.data.relationships.frames.data[0].id;
      }
      // Check in included
      if (data.included) {
        const frame = data.included.find((item: { type: string }) => item.type === 'frame' || item.type === 'frames');
        if (frame) {
          console.log('Found frame via /users/me included');
          return frame.id;
        }
      }
    }
  } catch (e) {
    console.log('Failed to fetch /api/users/me:', e);
  }

  // Approach 3: Try /api/users/{userId}
  try {
    const userResponse = await fetch(`${BASE_URL}/api/users/${userId}?include=frames`, {
      headers: {
        Authorization: `Basic ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (userResponse.ok) {
      const data = await userResponse.json();
      if (data.data?.relationships?.frames?.data?.[0]?.id) {
        console.log('Found frame via /users/{id} relationships');
        return data.data.relationships.frames.data[0].id;
      }
      if (data.included) {
        const frame = data.included.find((item: { type: string }) => item.type === 'frame' || item.type === 'frames');
        if (frame) {
          console.log('Found frame via /users/{id} included');
          return frame.id;
        }
      }
    }
  } catch (e) {
    console.log('Failed to fetch /api/users/{id}:', e);
  }

  throw new AuthError('Could not determine frame ID. The Skylight API may have changed.');
}
