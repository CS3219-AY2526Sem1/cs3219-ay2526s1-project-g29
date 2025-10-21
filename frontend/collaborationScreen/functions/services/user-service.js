import { getStoredUser, saveUser } from "../utils/storage.js";
import { COLLAB_CONFIG } from "../config.js";

export async function resolveUserSession() {
  const cached = getStoredUser();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${COLLAB_CONFIG.apiBase}/auth/verify-token`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const user = payload?.data ?? null;
    if (user) {
      saveUser(user);
    }
    return user;
  } catch (error) {
    console.error("Failed to resolve session user", error);
    return null;
  }
}
