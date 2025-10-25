class ChatInClass {
    constructor() {
        this.currentUser = {
            name: '',
            role: '', // 'teacher' or 'student'
            id: this.generateUserId()
        };
        this.currentSubject = 'general';
        this.messages = {};
        this.onlineUsers = new Map();
        this.typingUsers = new Set();
        
        // Initialize message storage for each subject
        this.subjects = ['general', 'math', 'english', 'science', 'physics', 'chemistry', 'biology'];
        this.subjects.forEach(subject => {
            this.messages[subject] = [];
        });
        
        this.init();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.setupEventListeners();
        this.showRoleModal();
        this.loadStoredMessages();
        this.updateOnlineCount();
    }

    setupEventListeners() {
        // Role selection
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectRole(e.currentTarget.dataset.role);
            });
        });

        // Name input
        const nameInput = document.getElementById('user-name');
        nameInput.addEventListener('input', () => {
            this.validateJoinButton();
        });

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('join-chatroom').disabled) {
                this.joinChatroom();
            }
        });

        // Join chatroom
        document.getElementById('join-chatroom').addEventListener('click', () => {
            this.joinChatroom();
        });

        // Role toggle
        document.getElementById('role-toggle').addEventListener('click', () => {
            this.showRoleModal();
        });

        // Subject selection
        document.querySelectorAll('.subject-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectSubject(e.currentTarget.dataset.subject);
            });
        });

        // Message input
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('input', () => {
            this.autoResizeTextarea(messageInput);
            this.handleTyping();
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e.currentTarget.dataset.action);
            });
        });

        // File attachment (placeholder)
        document.getElementById('attach-file').addEventListener('click', () => {
            this.handleFileAttachment();
        });

        // Emoji (placeholder)
        document.getElementById('add-emoji').addEventListener('click', () => {
            this.handleEmojiPicker();
        });
    }

    showRoleModal() {
        document.getElementById('role-modal').style.display = 'flex';
    }

    hideRoleModal() {
        document.getElementById('role-modal').style.display = 'none';
    }

    selectRole(role) {
        document.querySelectorAll('.role-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelector(`[data-role="${role}"]`).classList.add('selected');
        this.currentUser.role = role;
        this.validateJoinButton();
    }

    validateJoinButton() {
        const nameInput = document.getElementById('user-name');
        const joinBtn = document.getElementById('join-chatroom');
        
        const isValid = this.currentUser.role && nameInput.value.trim().length >= 2;
        joinBtn.disabled = !isValid;
    }

    joinChatroom() {
        const nameInput = document.getElementById('user-name');
        this.currentUser.name = nameInput.value.trim();
        
        // Update UI
        this.updateUserInfo();
        this.enableChatInput();
        this.hideRoleModal();
        
        // Add user to online list
        this.addUserToOnlineList(this.currentUser);
        
        // Send welcome message
        this.addSystemMessage(`${this.currentUser.name} (${this.currentUser.role}) joined the chatroom`);
        
        // Load messages for current subject
        this.displayMessages();
    }

    updateUserInfo() {
        const userRoleElement = document.getElementById('user-role');
        const roleIcon = this.currentUser.role === 'teacher' ? '👨‍🏫' : '👨‍🎓';
        const roleText = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        
        userRoleElement.textContent = `${roleIcon} ${this.currentUser.name} (${roleText})`;
    }

    enableChatInput() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-message');
        
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = 'Type your message here...';
        messageInput.focus();
    }

    selectSubject(subject) {
        // Update active subject
        document.querySelectorAll('.subject-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-subject="${subject}"]`).classList.add('active');
        
        this.currentSubject = subject;
        
        // Update subject title
        const subjectNames = {
            general: 'General Discussion',
            math: 'Mathematics',
            english: 'English',
            science: 'Science',
            physics: 'Physics',
            chemistry: 'Chemistry',
            biology: 'Biology'
        };
        
        document.getElementById('current-subject').textContent = subjectNames[subject];
        
        // Load messages for this subject
        this.displayMessages();
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        const message = {
            id: this.generateMessageId(),
            content: content,
            sender: this.currentUser.name,
            role: this.currentUser.role,
            timestamp: new Date(),
            subject: this.currentSubject
        };
        
        // Add to messages
        this.messages[this.currentSubject].push(message);
        
        // Display message
        this.displayMessage(message);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Save to localStorage
        this.saveMessages();
        
        // Update message count
        this.updateMessageCount(this.currentSubject);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Simulate real-time for demo (in real app, this would be via WebSocket)
        this.simulateResponse(message);
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        
        // Remove welcome message if it exists
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        messageElement.innerHTML = `
            <div class="message-bubble">
                <div class="message-header">
                    <span class="message-role">${message.sender}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-content">${this.formatMessageContent(message.content)}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    displayMessages() {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';
        
        const subjectMessages = this.messages[this.currentSubject];
        
        if (subjectMessages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-content">
                        <h3>👋 Welcome to ${document.getElementById('current-subject').textContent}!</h3>
                        <p>Start a conversation by typing a message below</p>
                        <p>Teachers can make announcements and ask questions</p>
                        <p>Students can ask for help and participate in discussions</p>
                    </div>
                </div>
            `;
        } else {
            subjectMessages.forEach(message => {
                this.displayMessage(message);
            });
        }
    }

    formatMessageContent(content) {
        // Basic formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    formatTime(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMs = now - messageTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        
        return messageTime.toLocaleDateString();
    }

    addSystemMessage(content) {
        const message = {
            id: this.generateMessageId(),
            content: content,
            sender: 'System',
            role: 'announcement',
            timestamp: new Date(),
            subject: this.currentSubject
        };
        
        this.messages[this.currentSubject].push(message);
        this.displayMessage(message);
        this.saveMessages();
        this.updateMessageCount(this.currentSubject);
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = newHeight + 'px';
    }

    handleTyping() {
        // Show typing indicator (placeholder for real implementation)
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.textContent = 'You are typing...';
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            typingIndicator.textContent = '';
        }, 1000);
    }

    handleQuickAction(action) {
        const messageInput = document.getElementById('message-input');
        
        switch (action) {
            case 'help':
                messageInput.value = '🆘 I need help with: ';
                break;
            case 'question':
                messageInput.value = '❓ Question: ';
                break;
            case 'announcement':
                if (this.currentUser.role === 'teacher') {
                    messageInput.value = '📢 Announcement: ';
                } else {
                    alert('Only teachers can make announcements');
                    return;
                }
                break;
        }
        
        messageInput.focus();
        messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
    }

    handleFileAttachment() {
        // Placeholder for file attachment
        alert('File attachment feature coming soon!');
    }

    handleEmojiPicker() {
        // Simple emoji insertion
        const emojis = ['😊', '👍', '❤️', '😂', '🤔', '👏', '🎉', '📚', '✅', '❌'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const messageInput = document.getElementById('message-input');
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }

    addUserToOnlineList(user) {
        this.onlineUsers.set(user.id, user);
        this.updateOnlineUsersList();
        this.updateOnlineCount();
    }

    updateOnlineUsersList() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        this.onlineUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = `user-item ${user.role}`;
            userElement.innerHTML = `
                <div class="user-status"></div>
                <span>${user.name}</span>
            `;
            usersList.appendChild(userElement);
        });
    }

    updateOnlineCount() {
        document.getElementById('online-count').textContent = this.onlineUsers.size;
    }

    updateMessageCount(subject) {
        const messageCount = this.messages[subject].length;
        const subjectElement = document.querySelector(`[data-subject="${subject}"] .message-count`);
        if (subjectElement) {
            subjectElement.textContent = messageCount;
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    saveMessages() {
        localStorage.setItem('chatinclass_messages', JSON.stringify(this.messages));
    }

    loadStoredMessages() {
        const stored = localStorage.getItem('chatinclass_messages');
        if (stored) {
            try {
                this.messages = JSON.parse(stored);
                // Update message counts
                this.subjects.forEach(subject => {
                    this.updateMessageCount(subject);
                });
            } catch (e) {
                console.error('Error loading stored messages:', e);
            }
        }
    }

    simulateResponse(originalMessage) {
        // Simulate other users responding (for demo purposes)
        if (Math.random() < 0.3) { // 30% chance of response
            setTimeout(() => {
                const responses = {
                    teacher: [
                        "Great question! Let me help you with that.",
                        "That's an interesting point. Here's what I think...",
                        "Good observation! Can you elaborate on that?",
                        "Let's work through this step by step.",
                        "Does anyone else have thoughts on this?"
                    ],
                    student: [
                        "I have the same question!",
                        "Thanks for explaining that!",
                        "Could you give an example?",
                        "I think I understand now.",
                        "That makes sense!"
                    ]
                };
                
                const responseRole = originalMessage.role === 'teacher' ? 'student' : 'teacher';
                const possibleResponses = responses[responseRole];
                const response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
                
                const responseMessage = {
                    id: this.generateMessageId(),
                    content: response,
                    sender: responseRole === 'teacher' ? 'Ms. Smith' : 'Alex',
                    role: responseRole,
                    timestamp: new Date(),
                    subject: this.currentSubject
                };
                
                this.messages[this.currentSubject].push(responseMessage);
                
                // Only display if we're still on the same subject
                if (this.currentSubject === responseMessage.subject) {
                    this.displayMessage(responseMessage);
                }
                
                this.saveMessages();
                this.updateMessageCount(this.currentSubject);
            }, 1000 + Math.random() * 3000); // Random delay 1-4 seconds
        }
    }
}

// Initialize the chatroom when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatInClass();
});