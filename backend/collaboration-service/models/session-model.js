// Simple session shape for reference and validation points.
export function toPublicSession(session) {
  return {
    id: session.id,
    participants: session.participants.map((p) => ({ id: p.id, username: p.username })),
    status: session.status,
    createdAt: session.createdAt,
  };
}

