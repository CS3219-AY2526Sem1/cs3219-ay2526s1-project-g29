// Chat functionality for collaboration screen
let chatSocket = null;
let currentUserId = null;
let chatOpen = false;
let unreadCount = 0;

const elements = {
  panel: null,
  messages: null,
  input: null,
  sendBtn: null,
  toggleBtn: null,
  closeBtn: null,
};

export function initializeChat(socket, userId) {
  chatSocket = socket;
  currentUserId = userId;
  
  // Get DOM elements
  elements.panel = document.getElementById('chatPanel');
  elements.messages = document.getElementById('chatMessages');
  elements.input = document.getElementById('chatInput');
  elements.sendBtn = document.getElementById('chatSendBtn');
  elements.toggleBtn = document.getElementById('chatToggleBtn');
  elements.closeBtn = document.getElementById('chatCloseBtn');
  
  if (!elements.panel || !elements.messages || !elements.input) {
    console.warn('Chat elements not found');
    return;
  }
  
  // Toggle chat panel
  if (elements.toggleBtn) {
    elements.toggleBtn.addEventListener('click', toggleChat);
  }
  
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', closeChat);
  }
  
  // Send message on button click
  if (elements.sendBtn) {
    elements.sendBtn.addEventListener('click', sendMessage);
  }
  
  // Send message on Enter (Shift+Enter for newline)
  if (elements.input) {
    elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  console.log('Chat initialized');
}

export function handleChatMessage(data) {
  const { from, username, message, timestamp } = data;
  
  if (!message || typeof message !== 'string') return;
  
  // Remove empty state if present
  const emptyState = elements.messages.querySelector('.chat-empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message';
  
  // Mark own messages
  if (from === currentUserId) {
    messageEl.classList.add('own');
  } else {
    // Increment unread count if chat is closed
    if (!chatOpen) {
      unreadCount++;
      updateUnreadBadge();
    }
  }
  
  // Format timestamp
  const time = formatTime(timestamp);
  
  // Build message HTML
  messageEl.innerHTML = `
    <div class="chat-message-header">
      <span class="chat-message-sender">${escapeHtml(username || 'Anonymous')}</span>
      <span class="chat-message-time">${time}</span>
    </div>
    <div class="chat-message-content">${escapeHtml(message)}</div>
  `;
  
  elements.messages.appendChild(messageEl);
  
  // Scroll to bottom
  scrollToBottom();
}

function toggleChat() {
  if (chatOpen) {
    closeChat();
  } else {
    openChat();
  }
}

function openChat() {
  if (!elements.panel) return;
  
  elements.panel.classList.add('open');
  elements.toggleBtn?.classList.add('active');
  chatOpen = true;
  
  // Clear unread count
  unreadCount = 0;
  updateUnreadBadge();
  
  // Focus input
  elements.input?.focus();
  
  // Scroll to bottom
  scrollToBottom();
}

function closeChat() {
  if (!elements.panel) return;
  
  elements.panel.classList.remove('open');
  elements.toggleBtn?.classList.remove('active');
  chatOpen = false;
}

function sendMessage() {
  if (!elements.input || !chatSocket) return;
  
  const message = elements.input.value.trim();
  if (!message) return;
  
  try {
    // Send via WebSocket
    chatSocket.send({
      type: 'chat',
      message: message
    });
    
    // Clear input
    elements.input.value = '';
    
    // Reset textarea height
    elements.input.style.height = 'auto';
    
  } catch (error) {
    console.error('Failed to send chat message:', error);
    showChatError('Failed to send message');
  }
}

function scrollToBottom() {
  if (!elements.messages) return;
  
  setTimeout(() => {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }, 50);
}

function updateUnreadBadge() {
  if (!elements.toggleBtn) return;
  
  // Remove existing badge
  const existingBadge = elements.toggleBtn.querySelector('.unread-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // Add new badge if there are unread messages
  if (unreadCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'unread-badge';
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    elements.toggleBtn.appendChild(badge);
  }
}

function showChatError(message) {
  // Create temporary error message
  const errorEl = document.createElement('div');
  errorEl.className = 'chat-message chat-error';
  errorEl.innerHTML = `
    <div class="chat-message-content" style="background: rgba(229, 62, 62, 0.2); border: 1px solid rgba(229, 62, 62, 0.3);">
      ⚠️ ${escapeHtml(message)}
    </div>
  `;
  
  elements.messages.appendChild(errorEl);
  scrollToBottom();
  
  // Remove after 3 seconds
  setTimeout(() => {
    errorEl.remove();
  }, 3000);
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Otherwise show date and time
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    return '';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for cleanup
export function cleanupChat() {
  chatSocket = null;
  currentUserId = null;
  chatOpen = false;
  unreadCount = 0;
}