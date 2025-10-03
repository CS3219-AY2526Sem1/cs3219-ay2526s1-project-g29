import { config } from "../config.js";

export function saveUser(userData) {
  const userInfo = {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    displayName: userData.displayName,
    isAdmin: userData.isAdmin,
    createdAt: userData.createdAt,
  };

  localStorage.setItem(config.storage.user, JSON.stringify(userInfo));
  return true;
}

export function getUser() {
  const userData = localStorage.getItem(config.storage.user);
  return userData ? JSON.parse(userData) : null;
}

export function hasUser() {
  return !!localStorage.getItem(config.storage.user);
}

export function clearUser() {
  localStorage.removeItem(config.storage.user);
}
