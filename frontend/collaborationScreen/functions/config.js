export const COLLAB_CONFIG = {
  // Collaboration service
  httpBase: "http://localhost:8001",
  wsBase: "ws://localhost:8001/collab",
  // User service (for auth/session verification)
  apiBase: "http://localhost:8004",
  routes: {
    dashboard: "../dashboardScreen/dashboardScreen.html",
  },
  defaultLanguage: "javascript",
  defaultContent:
    `// Welcome to PeerPrep Collaboration\n// Your session will sync across both participants.`,
};
