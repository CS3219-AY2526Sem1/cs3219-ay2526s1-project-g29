import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getYDoc, docs } = require('y-websocket/bin/utils');

const DEFAULT_TEMPLATE = `// Welcome to PeerPrep Collaboration\n// Share this session ID with your partner to start coding together!`;

const trackedListeners = new Map();

function toBase64(buffer) {
  if (buffer instanceof Uint8Array) {
    return Buffer.from(buffer).toString('base64');
  }
  return Buffer.from(buffer).toString('base64');
}

export function ensureDocument(sessionId, messageBus) {
  const doc = getYDoc(sessionId);
  const meta = doc.getMap('meta');
  const text = doc.getText('code');

  if (!meta.get('initialized') && text.length === 0) {
    text.insert(0, DEFAULT_TEMPLATE);
    meta.set('initialized', true);
  }

  if (!trackedListeners.has(sessionId)) {
    const listener = (update, origin) => {
      const payload = {
        sessionId,
        update: toBase64(update),
        timestamp: new Date().toISOString(),
      };

      if (origin?.user) {
        payload.user = {
          id: origin.user.id,
          username: origin.user.username,
        };
      }

      try {
        const result = messageBus?.publish?.('session.document.update', payload);
        if (result && typeof result.then === 'function') {
          result.catch((error) => {
            console.error('[collaboration-service] failed to publish document update', error);
          });
        }
      } catch (error) {
        console.error('[collaboration-service] failed to publish document update', error);
      }
    };

    doc.on('update', listener);
    doc.once('destroy', () => {
      trackedListeners.delete(sessionId);
    });
    trackedListeners.set(sessionId, listener);

    try {
      const result = messageBus?.publish?.('session.document.created', {
        sessionId,
        timestamp: new Date().toISOString(),
      });
      if (result && typeof result.then === 'function') {
        result.catch((error) => {
          console.error('[collaboration-service] failed to publish document created event', error);
        });
      }
    } catch (error) {
      console.error('[collaboration-service] failed to publish document created event', error);
    }
  }

  return doc;
}

export function maybeCleanupDocument(sessionId) {
  const doc = docs.get(sessionId);
  if (!doc) {
    return;
  }

  if (doc.conns && doc.conns.size > 0) {
    return;
  }

  const listener = trackedListeners.get(sessionId);
  if (listener) {
    doc.off('update', listener);
    trackedListeners.delete(sessionId);
  }

  docs.delete(sessionId);
  doc.destroy();

  console.log(`[collaboration-service] disposed document for session ${sessionId}`);
}
