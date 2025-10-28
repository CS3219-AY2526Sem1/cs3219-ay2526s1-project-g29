// Simple session shape for reference and validation points.
export function toPublicSession(session) {
  return {
    id: session.id,
    participants: session.participants.map((p) => ({ id: p.id, username: p.username })),
    status: session.status,
    createdAt: session.createdAt,
    question: session.question
      ? {
          id: session.question.id,
          title: session.question.title,
          description: session.question.description,
          difficulty: session.question.difficulty,
          topics: session.question.topics || [],
        }
      : null,
  };
}
