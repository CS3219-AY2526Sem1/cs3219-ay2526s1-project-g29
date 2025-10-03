import { config } from "../config.js";

export async function registerUser(userData) {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export function getErrorMessage(error) {
  const message = error.message.toLowerCase();

  if (message.includes("already exists")) {
    return "This username or email is already taken";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Connection error - please try again";
  }

  return error.message || "Something went wrong. Please try again.";
}
