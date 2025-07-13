class StudyBotApp {
    constructor() {
        this.currentSection = 'subject-selection';
        this.selectedSubject = null;
        this.selectedChatbot = null;
        this.currentMessages = [];
        this.apiKey = null;
        this.model = null;
        this.client = null;
        this.chatbotPrompts = {};
        
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadConfig();
        this.setupEventListeners();
        this.initializeChatbots();
        this.loadChatbotPrompts();
    }

    async loadConfig() {
        try {
            const response = await fetch('config.txt');
            const configText = await response.text();
            const lines = configText.split('\n');
            
            lines.forEach(line => {
                const [key, value] = line.split(':');
                if (key === 'key') this.apiKey = value;
                if (key === 'model') this.model = value;
            });

            this.client = axios.create({
                baseURL: 'https://chatapi.akash.network/api/v1',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    setupEventListeners() {
        // Subject selection
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectSubject(e.currentTarget.dataset.subject);
            });
        });

        // Navigation buttons
        document.getElementById('back-to-subjects').addEventListener('click', () => {
            this.showSection('subject-selection');
        });

        document.getElementById('back-to-chatbots').addEventListener('click', () => {
            this.showSection('chatbot-selection');
        });

        // Chat functionality
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Export buttons
        document.getElementById('export-chat').addEventListener('click', () => {
            this.exportChatHistory();
        });

        document.getElementById('export-summary').addEventListener('click', () => {
            this.exportSummaryAndGuide();
        });
    }

    initializeChatbots() {
        this.chatbots = {
            chinese: [
                { id: 'chinese-grammar', name: 'Grammar Tutor', description: 'Help with Chinese grammar and sentence structure' },
                { id: 'chinese-literature', name: 'Literature Guide', description: 'Analyze Chinese literature and poetry' },
                { id: 'chinese-writing', name: 'Writing Assistant', description: 'Improve Chinese writing skills' },
                { id: 'chinese-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'chinese-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            english: [
                { id: 'english-grammar', name: 'Grammar Expert', description: 'Master English grammar rules' },
                { id: 'english-literature', name: 'Literature Analyst', description: 'Analyze English literature and texts' },
                { id: 'english-writing', name: 'Essay Writing Coach', description: 'Improve essay writing skills' },
                { id: 'english-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'english-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            math: [
                { id: 'math-algebra', name: 'Algebra Tutor', description: 'Solve algebraic equations and problems' },
                { id: 'math-geometry', name: 'Geometry Guide', description: 'Learn shapes, angles, and spatial reasoning' },
                { id: 'math-calculus', name: 'Calculus Coach', description: 'Master derivatives and integrals' },
                { id: 'math-statistics', name: 'Statistics Helper', description: 'Understand probability and data analysis' },
                { id: 'math-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'math-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            science: [
                { id: 'science-general', name: 'General Science', description: 'Broad science topics and concepts' },
                { id: 'science-experiments', name: 'Lab Experiments', description: 'Understand scientific experiments' },
                { id: 'science-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'science-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            physics: [
                { id: 'physics-mechanics', name: 'Mechanics Tutor', description: 'Forces, motion, and energy' },
                { id: 'physics-electricity', name: 'Electricity Guide', description: 'Circuits, voltage, and current' },
                { id: 'physics-waves', name: 'Waves & Sound', description: 'Wave properties and sound physics' },
                { id: 'physics-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'physics-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            chemistry: [
                { id: 'chemistry-organic', name: 'Organic Chemistry', description: 'Carbon compounds and reactions' },
                { id: 'chemistry-inorganic', name: 'Inorganic Chemistry', description: 'Elements, compounds, and reactions' },
                { id: 'chemistry-physical', name: 'Physical Chemistry', description: 'Thermodynamics and kinetics' },
                { id: 'chemistry-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'chemistry-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            biology: [
                { id: 'biology-cell', name: 'Cell Biology', description: 'Cell structure and function' },
                { id: 'biology-genetics', name: 'Genetics Tutor', description: 'DNA, inheritance, and evolution' },
                { id: 'biology-ecology', name: 'Ecology Guide', description: 'Ecosystems and environment' },
                { id: 'biology-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'biology-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            history: [
                { id: 'history-world', name: 'World History', description: 'Global historical events and periods' },
                { id: 'history-local', name: 'Local History', description: 'Regional and local historical events' },
                { id: 'history-analysis', name: 'Historical Analysis', description: 'Analyze historical sources and events' },
                { id: 'history-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'history-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            geography: [
                { id: 'geography-physical', name: 'Physical Geography', description: 'Landforms, climate, and natural processes' },
                { id: 'geography-human', name: 'Human Geography', description: 'Population, urbanization, and culture' },
                { id: 'geography-maps', name: 'Maps & Navigation', description: 'Map reading and geographical skills' },
                { id: 'geography-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'geography-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            ict: [
                { id: 'ict-programming', name: 'Programming Tutor', description: 'Learn coding and programming concepts' },
                { id: 'ict-databases', name: 'Database Guide', description: 'Database design and management' },
                { id: 'ict-networks', name: 'Networking Basics', description: 'Computer networks and internet' },
                { id: 'ict-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'ict-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ],
            steam: [
                { id: 'steam-projects', name: 'Project Guide', description: 'STEAM project ideas and guidance' },
                { id: 'steam-innovation', name: 'Innovation Tutor', description: 'Creative problem-solving and innovation' },
                { id: 'steam-integration', name: 'Subject Integration', description: 'Connecting different STEAM subjects' },
                { id: 'steam-2023', name: '2023 Past Papers', description: 'Practice with 2023 exam questions' },
                { id: 'steam-2024', name: '2024 Past Papers', description: 'Practice with 2024 exam questions' }
            ]
        };
    }

    async loadChatbotPrompts() {
        // Load prompts for each chatbot
        const promptFiles = [
            'chinese-grammar', 'chinese-literature', 'chinese-writing', 'chinese-2023', 'chinese-2024',
            'english-grammar', 'english-literature', 'english-writing', 'english-2023', 'english-2024',
            'math-algebra', 'math-geometry', 'math-calculus', 'math-statistics', 'math-2023', 'math-2024',
            'science-general', 'science-experiments', 'science-2023', 'science-2024',
            'physics-mechanics', 'physics-electricity', 'physics-waves', 'physics-2023', 'physics-2024',
            'chemistry-organic', 'chemistry-inorganic', 'chemistry-physical', 'chemistry-2023', 'chemistry-2024',
            'biology-cell', 'biology-genetics', 'biology-ecology', 'biology-2023', 'biology-2024',
            'history-world', 'history-local', 'history-analysis', 'history-2023', 'history-2024',
            'geography-physical', 'geography-human', 'geography-maps', 'geography-2023', 'geography-2024',
            'ict-programming', 'ict-databases', 'ict-networks', 'ict-2023', 'ict-2024',
            'steam-projects', 'steam-innovation', 'steam-integration', 'steam-2023', 'steam-2024'
        ];

        for (const promptFile of promptFiles) {
            try {
                const response = await fetch(`prompts/${promptFile}.txt`);
                if (response.ok) {
                    this.chatbotPrompts[promptFile] = await response.text();
                }
            } catch (error) {
                console.warn(`Could not load prompt for ${promptFile}:`, error);
            }
        }
    }

    selectSubject(subject) {
        this.selectedSubject = subject;
        this.showChatbots(subject);
        this.showSection('chatbot-selection');
    }

    showChatbots(subject) {
        const chatbotGrid = document.getElementById('chatbot-grid');
        const subjectTitle = document.getElementById('selected-subject-title');
        
        subjectTitle.textContent = `${subject.charAt(0).toUpperCase() + subject.slice(1)} - Select Your Chatbot`;
        
        chatbotGrid.innerHTML = '';
        
        if (this.chatbots[subject]) {
            this.chatbots[subject].forEach(chatbot => {
                const chatbotCard = document.createElement('div');
                chatbotCard.className = 'chatbot-card';
                chatbotCard.innerHTML = `
                    <h4>${chatbot.name}</h4>
                    <p>${chatbot.description}</p>
                `;
                chatbotCard.addEventListener('click', () => {
                    this.selectChatbot(chatbot);
                });
                chatbotGrid.appendChild(chatbotCard);
            });
        }
    }

    selectChatbot(chatbot) {
        this.selectedChatbot = chatbot;
        this.currentMessages = [];
        document.getElementById('current-chatbot-title').textContent = chatbot.name;
        document.getElementById('chat-messages').innerHTML = '';
        
        // Add initial message
        this.addMessage('assistant', `Hello! I'm your ${chatbot.name}. How can I help you with your studies today?`);
        
        this.showSection('chat-interface');
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Handle thinking process
        if (role === 'assistant' && content.includes('<thinking>')) {
            const { mainContent, thinkingContent } = this.parseThinkingContent(content);
            
            messageDiv.innerHTML = mainContent;
            
            if (thinkingContent) {
                const thinkingDiv = document.createElement('div');
                thinkingDiv.className = 'thinking-process';
                thinkingDiv.innerHTML = `
                    <div class="thinking-header">
                        <span class="thinking-toggle">▶</span>
                        <span>Thinking Process</span>
                    </div>
                    <div class="thinking-content">${thinkingContent}</div>
                `;
                
                const header = thinkingDiv.querySelector('.thinking-header');
                const toggleIcon = thinkingDiv.querySelector('.thinking-toggle');
                const content = thinkingDiv.querySelector('.thinking-content');
                
                header.addEventListener('click', () => {
                    content.classList.toggle('expanded');
                    toggleIcon.classList.toggle('expanded');
                });
                
                messageDiv.appendChild(thinkingDiv);
            }
        } else {
            messageDiv.textContent = content;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        this.currentMessages.push({ role, content });
    }

    parseThinkingContent(content) {
        const thinkingRegex = /<thinking>(.*?)<\/thinking>/s;
        const match = content.match(thinkingRegex);
        
        if (match) {
            const thinkingContent = match[1].trim();
            const mainContent = content.replace(thinkingRegex, '').trim();
            return { mainContent, thinkingContent };
        }
        
        return { mainContent: content, thinkingContent: null };
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        document.getElementById('send-btn').disabled = true;
        
        // Add user message
        this.addMessage('user', message);
        
        // Show loading
        this.showLoading(true);
        
        try {
            // Prepare messages for API
            const messages = [];
            
            // Add system prompt if available
            if (this.chatbotPrompts[this.selectedChatbot.id]) {
                messages.push({
                    role: 'system',
                    content: this.chatbotPrompts[this.selectedChatbot.id]
                });
            }
            
            // Add conversation history
            this.currentMessages.forEach(msg => {
                if (msg.role !== 'system') {
                    messages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            });
            
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            });
            
            const aiMessage = response.data.choices[0].message.content;
            this.addMessage('assistant', aiMessage);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            this.showLoading(false);
            document.getElementById('send-btn').disabled = false;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    exportChatHistory() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text('Chat History', 20, 20);
        
        // Subtitle
        doc.setFontSize(14);
        doc.text(`Subject: ${this.selectedSubject}`, 20, 35);
        doc.text(`Chatbot: ${this.selectedChatbot.name}`, 20, 45);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
        
        // Chat messages
        let yPosition = 70;
        doc.setFontSize(12);
        
        this.currentMessages.forEach(message => {
            const role = message.role === 'user' ? 'Student' : 'AI Tutor';
            const lines = doc.splitTextToSize(`${role}: ${message.content}`, 170);
            
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += 7;
            });
            
            yPosition += 5; // Extra space between messages
        });
        
        doc.save(`${this.selectedSubject}_${this.selectedChatbot.id}_chat_history.pdf`);
    }

    async exportSummaryAndGuide() {
        this.showLoading(true);
        
        try {
            // Generate summary using AI
            const summaryPrompt = `Based on the following conversation, provide a comprehensive summary and revision guide that includes:
            1. Key topics covered
            2. Student's strengths
            3. Areas for improvement
            4. Recommended study points
            5. Specific revision suggestions
            
            Conversation:
            ${this.currentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`;
            
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an educational assessment expert. Provide detailed academic analysis and recommendations.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });
            
            const summary = response.data.choices[0].message.content;
            
            // Create PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('Study Summary & Revision Guide', 20, 20);
            
            // Subtitle
            doc.setFontSize(14);
            doc.text(`Subject: ${this.selectedSubject}`, 20, 35);
            doc.text(`Chatbot: ${this.selectedChatbot.name}`, 20, 45);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
            
            // Summary content
            let yPosition = 70;
            doc.setFontSize(12);
            
            const lines = doc.splitTextToSize(summary, 170);
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += 7;
            });
            
            doc.save(`${this.selectedSubject}_${this.selectedChatbot.id}_summary_guide.pdf`);
            
        } catch (error) {
            console.error('Error generating summary:', error);
            alert('Error generating summary. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudyBotApp();
});