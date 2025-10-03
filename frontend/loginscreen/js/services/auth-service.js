import { config } from "../config.js";

export async function login(email, password) {
  const response = await fetch(`${config.apiUrl}${config.endpoints.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function checkSession() {
  try {
    const response = await fetch(`${config.apiUrl}${config.endpoints.verify}`, {
      credentials: "include",
    });

    return response.ok ? await response.json() : null;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  try {
    await fetch(`${config.apiUrl}${config.endpoints.logout}`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem(config.storage.user);
}
