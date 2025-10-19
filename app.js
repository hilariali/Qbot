class StudyBotApp {
    constructor() {
        this.selectedChatbot = null;
        this.currentSubject = null;
        this.currentMessages = [];
        this.sidebarActive = false;
        this.marked = null;
        this.chatbots = [];
        this.chatbotPrompts = {};
        this.config = {
            apiKey: 'sk-UVKYLhiNf0MKXRqbnDiehA',
            baseURL: 'https://chatapi.akash.network/api/v1',
            model: 'Meta-Llama-4-Maverick-17B-128E-Instruct-FP8'
        };
    }

    async initializeApp() {
        console.log('Initializing StudyBot App...');
        this.setupMarkdownRenderer();
        await this.loadConfig();
        this.initializeChatbots();
        this.setupEventListeners();
        await this.loadChatbotPrompts();
        this.setupSidebar();
        console.log('App initialized successfully');
    }

    setupMarkdownRenderer() {
        console.log('Setting up markdown renderer...');
        // Configure marked options
        this.marked = marked;
        this.marked.setOptions({
            highlight: function(code, lang) {
                if (typeof hljs !== 'undefined') {
                    if (lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return hljs.highlightAuto(code).value;
                }
                return code;
            },
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });

        // Custom renderer for math
        const renderer = new this.marked.Renderer();
        
        renderer.text = function(text) {
            if (typeof text !== 'string') {
                return text;
            }
            // Handle display math $$...$$ first
            text = text.replace(/\$\$([^$]+)\$\$/g, '<div class="math-display">\\[$1\\]</div>');
            // Handle inline math $...$
            text = text.replace(/\$([^$]+)\$/g, '<span class="math-inline">\\($1\\)</span>');
            return text;
        };

        this.marked.use({ renderer });

        // Initialize KaTeX if available
        if (typeof renderMathInElement !== 'undefined') {
            console.log('KaTeX available for math rendering');
        } else {
            console.warn('KaTeX not available - math rendering may not work properly');
        }
    }

    async loadConfig() {
        console.log('Loading configuration...');
        try {
            const response = await fetch('config.txt');
            if (response.ok) {
                const text = await response.text();
                text.split(/\n+/).forEach(line => {

                    if (!line.trim() || line.trim().startsWith('#')) return;
                    const idx = line.indexOf(':');
                    if (idx === -1) return;
                    const key = line.slice(0, idx).trim();
                    const value = line.slice(idx + 1).trim();
                    if (!key || !value) return;


                    if (key === 'key') {
                        this.config.apiKey = value;
                    } else if (key === 'model') {
                        this.config.model = value;
                    } else if (key === 'baseURL') {
                        this.config.baseURL = value;
                    }
                });
                console.log('Configuration loaded from file');
            } else {
                console.log('Config file not found - using defaults');
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
      
        // Sidebar toggle - with error handling
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        // Mobile overlay
        const mobileOverlay = document.getElementById('mobile-overlay');
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Navigation items - with improved event handling
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const section = item.dataset.section;
                const subject = item.dataset.subject;
                
                console.log('Nav item clicked:', { section, subject }); // Debug log
                
                if (section === 'home') {
                    this.showHomeSection();
                    this.setActiveNavItem(item);
                    // Close sidebar on mobile after selection
                    if (window.innerWidth <= 768) {
                        this.closeSidebar();
                    }
                } else if (subject) {
                    this.toggleSubject(item, subject);
                }
            });
        });

        // Navigation subitems (chatbots) - with improved event handling
        document.querySelectorAll('.nav-subitem').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const chatbotId = item.dataset.chatbot;
                console.log('Subitem clicked:', chatbotId); // Debug log
                
                if (chatbotId) {
                    this.selectChatbotFromSidebar(chatbotId, item);
                }
            });
        });

        // Subject selection
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectSubject(e.currentTarget.dataset.subject);
            });
        });

        // Navigation buttons
        const backToSubjects = document.getElementById('back-to-subjects');
        if (backToSubjects) {
            backToSubjects.addEventListener('click', () => {
                this.showSection('subject-selection');
            });
        }

        const backToChatbots = document.getElementById('back-to-chatbots');
        if (backToChatbots) {
            backToChatbots.addEventListener('click', () => {
                if (this.currentSubject) {
                    this.showChatbots(this.currentSubject);
                } else {
                    this.showSection('chatbot-selection');
                }
            });
        }

        // Chat functionality
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            // Auto-resize functionality
            chatInput.addEventListener('input', () => {
                this.autoResizeTextarea(chatInput);
            });
            
            // Enter key handling
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Export buttons
        const exportChatBtn = document.getElementById('export-chat');
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => {
                this.exportChatHistory();
            });
        }

        const exportSummaryBtn = document.getElementById('export-summary');
        if (exportSummaryBtn) {
            exportSummaryBtn.addEventListener('click', () => {
                this.exportSummaryAndGuide();
            });
        }
    }

    autoResizeTextarea(textarea) {
        // Reset height to auto to calculate the new height
        textarea.style.height = 'auto';
        
        // Calculate the new height based on scroll height
        const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
        
        // Set the new height
        textarea.style.height = newHeight + 'px';
        
        // Smooth animation
        textarea.style.transition = 'height 0.1s ease';
    }

    setupSidebar() {
        console.log('Setting up sidebar...');
        // Initialize sidebar state
        this.sidebarActive = false;
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');
        const toggle = document.getElementById('sidebar-toggle');


        if (!sidebar || !overlay) {
            console.error('Sidebar or overlay element not found');
            return;
        }

        this.sidebarActive = !this.sidebarActive;

        if (this.sidebarActive) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (toggle) toggle.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            if (toggle) toggle.classList.remove('active');

        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');
        const toggle = document.getElementById('sidebar-toggle');


        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (toggle) toggle.classList.remove('active');


        this.sidebarActive = false;
    }

    toggleSubject(navItem, subject) {
        console.log('Toggle subject called:', subject); // Debug log
        
        // Close other expanded items first
        document.querySelectorAll('.nav-item.expanded').forEach(item => {
            if (item !== navItem) {
                item.classList.remove('expanded');
            }
        });
        
        // Toggle expanded state
        const isExpanded = navItem.classList.contains('expanded');
        if (isExpanded) {
            navItem.classList.remove('expanded');
        } else {
            navItem.classList.add('expanded');
        }
        
        // Set as active
        this.setActiveNavItem(navItem);
        
        console.log('Subject expanded:', !isExpanded); // Debug log
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    setActiveSubitem(activeItem) {
        document.querySelectorAll('.nav-subitem').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    selectChatbotFromSidebar(chatbotId, subitem) {
        const chatbot = this.findChatbotById(chatbotId);
        if (chatbot) {
            this.selectChatbot(chatbot);
            this.setActiveSubitem(subitem);
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }
        } else {
            console.error('Chatbot not found:', chatbotId);
        }
    }

    findChatbotById(chatbotId) {
        return this.chatbots.find(bot => bot.id === chatbotId);
    }

    getSubjectFromChatbotId(chatbotId) {
        const chatbot = this.findChatbotById(chatbotId);
        return chatbot ? chatbot.subject : null;
    }

    enableChatInput() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = 'Type your question here...';
        }
        if (sendBtn) {
            sendBtn.disabled = false;
        }
    }

    disableChatInput() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Select a chatbot to start chatting...';
        }
        if (sendBtn) {
            sendBtn.disabled = true;
        }
    }

    clearChatMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        this.currentMessages = [];
    }

    initializeChatbots() {
        console.log('Initializing chatbots...');
        this.chatbots = [
            // Chinese
            { id: 'chinese-grammar', name: 'Grammar Tutor', subject: 'chinese', description: 'Master Chinese grammar with expert guidance' },
            { id: 'chinese-literature', name: 'Literature Guide', subject: 'chinese', description: 'Explore Chinese literature and poetry' },
            { id: 'chinese-writing', name: 'Writing Assistant', subject: 'chinese', description: 'Improve your Chinese writing skills' },
            { id: 'chinese-2023', name: '2023 Past Papers', subject: 'chinese', description: 'Practice with 2023 DSE Chinese papers' },
            { id: 'chinese-2024', name: '2024 Past Papers', subject: 'chinese', description: 'Practice with 2024 DSE Chinese papers' },
            
            // English
            { id: 'english-grammar', name: 'Grammar Expert', subject: 'english', description: 'Perfect your English grammar' },
            { id: 'english-literature', name: 'Literature Analyst', subject: 'english', description: 'Analyze English literature and texts' },
            { id: 'english-writing', name: 'Essay Writing Coach', subject: 'english', description: 'Master essay writing techniques' },
            { id: 'english-2023', name: '2023 Past Papers', subject: 'english', description: 'Practice with 2023 DSE English papers' },
            { id: 'english-2024', name: '2024 Past Papers', subject: 'english', description: 'Practice with 2024 DSE English papers' },
            
            // Mathematics
            { id: 'math-algebra', name: 'Algebra Tutor', subject: 'math', description: 'Master algebraic concepts and equations' },
            { id: 'math-geometry', name: 'Geometry Guide', subject: 'math', description: 'Explore geometric principles and proofs' },
            { id: 'math-calculus', name: 'Calculus Coach', subject: 'math', description: 'Learn differential and integral calculus' },
            { id: 'math-statistics', name: 'Statistics Helper', subject: 'math', description: 'Master statistical analysis and probability' },
            { id: 'math-2023', name: '2023 Past Papers', subject: 'math', description: 'Practice with 2023 DSE Math papers' },
            { id: 'math-2024', name: '2024 Past Papers', subject: 'math', description: 'Practice with 2024 DSE Math papers' },
            
            // Science
            { id: 'science-general', name: 'General Science', subject: 'science', description: 'Explore fundamental scientific concepts' },
            { id: 'science-experiments', name: 'Lab Experiments', subject: 'science', description: 'Understand scientific methodology' },
            { id: 'science-2023', name: '2023 Past Papers', subject: 'science', description: 'Practice with 2023 DSE Science papers' },
            { id: 'science-2024', name: '2024 Past Papers', subject: 'science', description: 'Practice with 2024 DSE Science papers' },
            
            // ICT
            { id: 'ict-programming', name: 'Programming Tutor', subject: 'ict', description: 'Learn programming fundamentals' },
            { id: 'ict-databases', name: 'Database Design', subject: 'ict', description: 'Master database concepts and SQL' },
            { id: 'ict-networks', name: 'Networking Guide', subject: 'ict', description: 'Understand computer networks' },
            { id: 'ict-corea', name: 'CoreA', subject: 'ict', description: 'Core A: Information Processing' },
            { id: 'ict-coreb-computersystem', name: 'CoreB_ComputerSystem', subject: 'ict', description: 'Core B: Computer System' },
            { id: 'ict-coree', name: 'CoreE', subject: 'ict', description: 'Core E: Social and Ethical Issues' },
            { id: 'ict-2023', name: '2023 Past Papers', subject: 'ict', description: 'Practice with 2023 DSE ICT papers' },
            { id: 'ict-2024', name: '2024 Past Papers', subject: 'ict', description: 'Practice with 2024 DSE ICT papers' },
            
            // STEAM
            { id: 'steam-engineering', name: 'Engineering Projects', subject: 'steam', description: 'Explore engineering principles' },
            { id: 'steam-technology', name: 'Technology Innovation', subject: 'steam', description: 'Learn about emerging technologies' },
            { id: 'steam-arts', name: 'Arts Integration', subject: 'steam', description: 'Combine arts with STEM concepts' },
            { id: 'steam-2023', name: '2023 Past Papers', subject: 'steam', description: 'Practice with 2023 STEAM assessments' },
            { id: 'steam-2024', name: '2024 Past Papers', subject: 'steam', description: 'Practice with 2024 STEAM assessments' },
            
            // Physics
            { id: 'physics-mechanics', name: 'Classical Mechanics', subject: 'physics', description: 'Master motion and forces' },
            { id: 'physics-electricity', name: 'Electricity & Magnetism', subject: 'physics', description: 'Understand electromagnetic phenomena' },
            { id: 'physics-waves', name: 'Waves & Optics', subject: 'physics', description: 'Explore wave properties and light' },
            { id: 'physics-2023', name: '2023 Past Papers', subject: 'physics', description: 'Practice with 2023 DSE Physics papers' },
            { id: 'physics-2024', name: '2024 Past Papers', subject: 'physics', description: 'Practice with 2024 DSE Physics papers' },
            
            // Chemistry
            { id: 'chemistry-organic', name: 'Organic Chemistry', subject: 'chemistry', description: 'Master organic compounds and reactions' },
            { id: 'chemistry-inorganic', name: 'Inorganic Chemistry', subject: 'chemistry', description: 'Understand inorganic substances' },
            { id: 'chemistry-physical', name: 'Physical Chemistry', subject: 'chemistry', description: 'Learn thermodynamics and kinetics' },
            { id: 'chemistry-2023', name: '2023 Past Papers', subject: 'chemistry', description: 'Practice with 2023 DSE Chemistry papers' },
            { id: 'chemistry-2024', name: '2024 Past Papers', subject: 'chemistry', description: 'Practice with 2024 DSE Chemistry papers' },
            
            // Biology
            { id: 'biology-molecular', name: 'Molecular Biology', subject: 'biology', description: 'Explore DNA, RNA, and proteins' },
            { id: 'biology-ecology', name: 'Ecology & Environment', subject: 'biology', description: 'Understand ecosystems and biodiversity' },
            { id: 'biology-human', name: 'Human Biology', subject: 'biology', description: 'Learn about human body systems' },
            { id: 'biology-2023', name: '2023 Past Papers', subject: 'biology', description: 'Practice with 2023 DSE Biology papers' },
            { id: 'biology-2024', name: '2024 Past Papers', subject: 'biology', description: 'Practice with 2024 DSE Biology papers' },
            
            // History
            { id: 'history-world', name: 'World History', subject: 'history', description: 'Explore global historical events' },
            { id: 'history-china', name: 'Chinese History', subject: 'history', description: 'Study Chinese historical periods' },
            { id: 'history-modern', name: 'Modern History', subject: 'history', description: 'Understand 20th century developments' },
            { id: 'history-2023', name: '2023 Past Papers', subject: 'history', description: 'Practice with 2023 DSE History papers' },
            { id: 'history-2024', name: '2024 Past Papers', subject: 'history', description: 'Practice with 2024 DSE History papers' },
            
            // Geography
            { id: 'geography-physical', name: 'Physical Geography', subject: 'geography', description: 'Study landforms and climate' },
            { id: 'geography-human', name: 'Human Geography', subject: 'geography', description: 'Explore population and urbanization' },
            { id: 'geography-environment', name: 'Environmental Geography', subject: 'geography', description: 'Learn about environmental issues' },
            { id: 'geography-2023', name: '2023 Past Papers', subject: 'geography', description: 'Practice with 2023 DSE Geography papers' },
            { id: 'geography-2024', name: '2024 Past Papers', subject: 'geography', description: 'Practice with 2024 DSE Geography papers' }
        ];
        
        console.log(`Initialized ${this.chatbots.length} chatbots`);
    }

    async loadChatbotPrompts() {
        console.log('Loading chatbot prompts...');
        
        const promptFiles = [
            'chinese-grammar', 'chinese-literature', 'chinese-writing', 'chinese-2023', 'chinese-2024',
            'english-grammar', 'english-literature', 'english-writing', 'english-2023', 'english-2024',
            'math-algebra', 'math-geometry', 'math-calculus', 'math-statistics', 'math-2023', 'math-2024',
            'science-general', 'science-experiments', 'science-2023', 'science-2024',
            'ict-programming', 'ict-databases', 'ict-networks', 'ict-corea', 'ict-coreb-computersystem', 'ict-coree', 'ict-2023', 'ict-2024',
            'steam-engineering', 'steam-technology', 'steam-arts', 'steam-2023', 'steam-2024',
            'physics-mechanics', 'physics-electricity', 'physics-waves', 'physics-2023', 'physics-2024',
            'chemistry-organic', 'chemistry-inorganic', 'chemistry-physical', 'chemistry-2023', 'chemistry-2024',
            'biology-molecular', 'biology-ecology', 'biology-human', 'biology-2023', 'biology-2024',
            'history-world', 'history-china', 'history-modern', 'history-2023', 'history-2024',
            'geography-physical', 'geography-human', 'geography-environment', 'geography-2023', 'geography-2024'
        ];

        for (const promptFile of promptFiles) {
            try {
                const response = await fetch(`prompts/${promptFile}.txt`);
                if (response.ok) {
                    this.chatbotPrompts[promptFile] = await response.text();
                } else {
                    console.warn(`Could not load prompt for ${promptFile}`);
                    this.chatbotPrompts[promptFile] = `You are a helpful ${promptFile.replace('-', ' ')} tutor for DSE exam preparation. Help students understand concepts and solve problems.`;
                }
            } catch (error) {
                console.warn(`Error loading prompt for ${promptFile}:`, error);
                this.chatbotPrompts[promptFile] = `You are a helpful ${promptFile.replace('-', ' ')} tutor for DSE exam preparation. Help students understand concepts and solve problems.`;
            }
        }
        
        console.log('Chatbot prompts loaded');
    }

    selectSubject(subject) {
        this.currentSubject = subject;
        this.showChatbots(subject);
    }

    showChatbots(subject) {
        const subjectChatbots = this.chatbots.filter(bot => bot.subject === subject);
        const chatbotGrid = document.getElementById('chatbot-grid');
        
        // Update the subject title
        const subjectTitle = document.getElementById('selected-subject-title');
        if (subjectTitle) {
            const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
            subjectTitle.textContent = `${subjectName} - Select Your Chatbot`;
        }
        
        if (chatbotGrid && subjectChatbots.length > 0) {
            chatbotGrid.innerHTML = subjectChatbots.map(bot => `
                <div class="chatbot-card" data-chatbot="${bot.id}">
                    <h4>${bot.name}</h4>
                    <p>${bot.description}</p>
                </div>
            `).join('');
            
            // Add event listeners to new chatbot cards
            chatbotGrid.querySelectorAll('.chatbot-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const chatbotId = e.currentTarget.dataset.chatbot;
                    const chatbot = this.findChatbotById(chatbotId);
                    if (chatbot) {
                        this.selectChatbot(chatbot);
                    }
                });
            });
        }
        
        this.showSection('chatbot-selection');
    }

    selectChatbot(chatbot) {
        console.log('Selecting chatbot:', chatbot);
        this.selectedChatbot = chatbot;
        this.currentSubject = chatbot.subject;
        this.clearChatMessages();
        this.enableChatInput();
        
        // Update chat header
        const chatTitle = document.getElementById('chat-title');
        if (chatTitle) {
            chatTitle.textContent = chatbot.name;
        }
        
        // Show welcome message
        const welcomeMessage = `Welcome! I'm your ${chatbot.name}. I'm here to help you with ${chatbot.subject} topics and exam preparation. What would you like to learn about today?`;
        this.addMessage('assistant', welcomeMessage);
        
        this.showSection('chat-interface');
    }

    showSection(sectionId) {
        console.log('Showing section:', sectionId);
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    showHomeSection() {
        console.log('Showing home section with subject selection');
        // Hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show both home and subject-selection sections for the complete home view
        const homeSection = document.getElementById('home');
        const subjectSelectionSection = document.getElementById('subject-selection');
        
        if (homeSection) {
            homeSection.classList.add('active');
        }
        if (subjectSelectionSection) {
            subjectSelectionSection.classList.add('active');
        }
    }

    renderMarkdown(content) {
        console.log('🎨 renderMarkdown called with:', content, 'type:', typeof content);
        
        const stringContent = typeof content === 'string' ? content : String(content);
        console.log('🎨 String content for rendering:', stringContent);
        
        // Enhanced markdown processing with math support
        let result = stringContent
            // Handle math expressions first (before other replacements)
            .replace(/\$\$([\s\S]*?)\$\$/g, '<span class="math-block">$1</span>')  // Block math
            .replace(/\$([^$\n]+?)\$/g, '<span class="math-inline">$1</span>')    // Inline math
            .replace(/\^(\d+)/g, '<sup>$1</sup>')                                 // Superscript numbers
            .replace(/\^{([^}]+)}/g, '<sup>$1</sup>')                             // Superscript with braces
            .replace(/_(\d+)/g, '<sub>$1</sub>')                                  // Subscript numbers
            .replace(/_{([^}]+)}/g, '<sub>$1</sub>')                              // Subscript with braces
            // Standard markdown
            .replace(/\n\n/g, '</p><p>')                                          // Paragraphs
            .replace(/\n/g, '<br>')                                               // Line breaks
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')                     // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')                                 // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>')                               // Inline code
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')           // Code blocks
            // Lists
            .replace(/^\* (.+)$/gm, '<li>$1</li>')                                // Bullet points
            .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>');                      // Numbered lists
        
        // Wrap standalone list items in ul tags
        result = result.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        
        // Wrap in paragraph if it doesn't start with a tag
        if (!result.startsWith('<')) {
            result = '<p>' + result + '</p>';
        }
        
        console.log('🎨 Enhanced rendering result:', result);
        
        // Apply KaTeX rendering if available
        setTimeout(() => {
            if (typeof renderMathInElement !== 'undefined') {
                console.log('🎨 Applying KaTeX rendering...');
                try {
                    const mathElements = document.querySelectorAll('.math-inline, .math-block');
                    mathElements.forEach(element => {
                        const mathText = element.textContent;
                        const isBlock = element.classList.contains('math-block');
                        try {
                            if (typeof katex !== 'undefined') {
                                element.innerHTML = katex.renderToString(mathText, {
                                    displayMode: isBlock,
                                    throwOnError: false
                                });
                            }
                        } catch (e) {
                            console.warn('KaTeX rendering failed for:', mathText, e);
                        }
                    });
                } catch (e) {
                    console.warn('KaTeX rendering error:', e);
                }
            }
        }, 100);
        
        return result;
    }

    renderMathInElement(element) {
        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(element, {
                    delimiters: [
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '$$', right: '$$', display: true}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error('Math rendering error:', error);
            }
        }
    }

    addMessage(role, content) {
        console.log('🔍 addMessage called with:', { role, content, contentType: typeof content });
        console.log('🔍 Raw content value:', content);
        console.log('🔍 Content stringified:', String(content));
        
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // AGGRESSIVE content string conversion
        let safeContent = content;
        
        // More detailed debugging
        console.log('🔍 Before conversion - safeContent:', safeContent, 'type:', typeof safeContent);
        
        // Force conversion to string - try multiple methods
        if (typeof safeContent !== 'string') {
            console.warn('⚠️ Content is not a string, converting:', typeof safeContent, safeContent);
            
            if (safeContent === null || safeContent === undefined) {
                safeContent = '[No content received]';
                console.log('🔧 Handled null/undefined');
            } else if (typeof safeContent === 'object') {
                console.log('🔧 Content is object, attempting extraction...');
                
                // Try multiple object properties
                if (safeContent.text && typeof safeContent.text === 'string') {
                    safeContent = safeContent.text;
                    console.log('🔧 Extracted from .text:', safeContent);
                } else if (safeContent.content && typeof safeContent.content === 'string') {
                    safeContent = safeContent.content;
                    console.log('🔧 Extracted from .content:', safeContent);
                } else if (safeContent.message && typeof safeContent.message === 'string') {
                    safeContent = safeContent.message;
                    console.log('🔧 Extracted from .message:', safeContent);
                } else if (safeContent.data && typeof safeContent.data === 'string') {
                    safeContent = safeContent.data;
                    console.log('🔧 Extracted from .data:', safeContent);
                } else {
                    // Last resort - JSON stringify
                    try {
                        safeContent = JSON.stringify(safeContent, null, 2);
                        console.log('🔧 JSON stringified:', safeContent);
                    } catch (e) {
                        safeContent = '[Could not convert object to string]';
                        console.log('🔧 JSON stringify failed, using fallback');
                    }
                }
            } else {
                safeContent = String(safeContent);
                console.log('🔧 String() conversion:', safeContent);
            }
        }
        
        // Final safety check and forced conversion
        if (typeof safeContent !== 'string') {
            console.error('❌ Still not a string after conversion, forcing...');
            safeContent = String(safeContent || '[Empty content]');
        }
        
        // Check for [object Object] specifically
        if (safeContent === '[object Object]') {
            console.error('❌ Got [object Object] - replacing with error message');
            safeContent = '[Error: Content could not be processed properly]';
        }
        
        console.log('✅ Final safe content:', safeContent);

        // Create WhatsApp-style message bubble
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        
        // Handle thinking process
        if (role === 'assistant' && safeContent.includes('<thinking>')) {
            const { mainContent, thinkingContent } = this.parseThinkingContent(safeContent);
            
            // Render main content with markdown
            const renderedContent = this.renderMarkdown(mainContent);
            messageBubble.innerHTML = renderedContent;
            
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
                const thinkingContentDiv = thinkingDiv.querySelector('.thinking-content');
                
                header.addEventListener('click', () => {
                    thinkingContentDiv.classList.toggle('expanded');
                    toggleIcon.classList.toggle('expanded');
                });
                
                messageBubble.appendChild(thinkingDiv);
            }
        } else {
            // Render content with markdown for both user and assistant messages
            if (role === 'assistant') {
                const renderedContent = this.renderMarkdown(safeContent);
                console.log('🖼️ About to set innerHTML with rendered content:', renderedContent, 'type:', typeof renderedContent);
                messageBubble.innerHTML = renderedContent;
                console.log('🖼️ messageBubble.innerHTML after setting:', messageBubble.innerHTML);
            } else {
                // For user messages, just escape HTML to prevent XSS
                console.log('🖼️ Setting textContent for user message:', safeContent);
                messageBubble.textContent = safeContent;
                console.log('🖼️ messageBubble.textContent after setting:', messageBubble.textContent);
            }
        }
        
        messageDiv.appendChild(messageBubble);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Render any math expressions in the new message
        if (role === 'assistant') {
            this.renderMathInElement(messageBubble);
        }
        
        // Store message
        this.currentMessages.push({ role, content: safeContent });
    }
    
    addLoadingMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant loading';
        loadingDiv.id = 'loading-message';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        messageBubble.innerHTML = `
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <span class="loading-text">Thinking...</span>
        `;
        
        loadingDiv.appendChild(messageBubble);
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeLoadingMessage() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
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
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message || !this.selectedChatbot) {
            return;
        }
        
        // Add user message
        this.addMessage('user', message);
        chatInput.value = '';
        
        // Reset textarea height
        this.autoResizeTextarea(chatInput);
        
        // Add loading indicator
        this.addLoadingMessage();
        
        // Disable input while processing
        chatInput.disabled = true;
        document.getElementById('send-btn').disabled = true;
        
        try {
            const systemPrompt = this.chatbotPrompts[this.selectedChatbot.id] || 
                `You are a helpful ${this.selectedChatbot.name} for DSE exam preparation.`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.currentMessages.slice(-10), // Keep last 10 messages for context
                { role: 'user', content: message }
            ];
            
            console.log('Sending request with messages:', messages);
            console.log('Using config:', {
                baseURL: this.config.baseURL,
                model: this.config.model,
                apiKey: this.config.apiKey ? 'sk-***' + this.config.apiKey.slice(-4) : 'not set'
            });
            
            const client = axios.create({
                baseURL: this.config.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 30000  // 30 second timeout
            });

            const response = await client.post('/chat/completions', {
                model: this.config.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            });
            
            const data = response.data;
            
            // Enhanced debug logging
            console.log('🚀 Full API Response object:', response);
            console.log('🚀 Response status:', response.status);
            console.log('🚀 Response headers:', response.headers);
            console.log('🚀 Response data:', data);
            console.log('🚀 Data type:', typeof data);
            console.log('🚀 Data keys:', data ? Object.keys(data) : 'no data');
            console.log('🚀 Response structure (full JSON):', JSON.stringify(data, null, 2));
            
            // Check if response has expected structure
            if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('❌ Unexpected API response structure:', data);
                console.error('❌ Data exists:', !!data);
                console.error('❌ Choices exists:', !!(data && data.choices));
                console.error('❌ First choice exists:', !!(data && data.choices && data.choices[0]));
                console.error('❌ Message exists:', !!(data && data.choices && data.choices[0] && data.choices[0].message));
                throw new Error('Invalid API response structure');
            }
            
            console.log('🔍 Choices array:', data.choices);
            console.log('🔍 First choice object:', data.choices[0]);
            console.log('🔍 Message object:', data.choices[0].message);
            console.log('🔍 Raw content from API:', data.choices[0].message.content);
            console.log('🔍 Content type:', typeof data.choices[0].message.content);
            
            let aiResponse = data.choices[0].message.content;
            
            // Handle different content formats
            console.log('🔍 Raw AI response content:', aiResponse, 'type:', typeof aiResponse);
            
            if (typeof aiResponse !== 'string') {
                console.warn('⚠️ AI response content is not a string, attempting to extract...');
                
                // Try different extraction methods
                if (aiResponse && typeof aiResponse === 'object') {
                    // If it's an object, try common properties
                    if (aiResponse.text) {
                        aiResponse = aiResponse.text;
                        console.log('🔧 Extracted from .text property:', aiResponse);
                    } else if (aiResponse.content) {
                        aiResponse = aiResponse.content;
                        console.log('🔧 Extracted from .content property:', aiResponse);
                    } else if (aiResponse.message) {
                        aiResponse = aiResponse.message;
                        console.log('🔧 Extracted from .message property:', aiResponse);
                    } else if (typeof aiResponse.toString === 'function') {
                        aiResponse = aiResponse.toString();
                        console.log('🔧 Converted using toString():', aiResponse);
                    } else {
                        aiResponse = JSON.stringify(aiResponse);
                        console.log('🔧 Converted to JSON string:', aiResponse);
                    }
                } else {
                    aiResponse = String(aiResponse);
                    console.log('🔧 Forced string conversion:', aiResponse);
                }
            }
            
            // Final validation
            if (typeof aiResponse !== 'string' || aiResponse.trim() === '') {
                console.error('❌ Could not extract valid string from AI response');
                throw new Error('Invalid response content - could not convert to string');
            }
            
            console.log('✅ Final AI Response content:', aiResponse);
            
            // Remove loading indicator
            this.removeLoadingMessage();
            
            // Add AI response
            this.addMessage('assistant', aiResponse);
            
        } catch (error) {
            console.error('Error sending message:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            
            this.removeLoadingMessage();
            
            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error.response) {
                errorMessage += ` (Status: ${error.response.status})`;
            }
            
            this.addMessage('assistant', errorMessage);
        } finally {
            // Re-enable input
            chatInput.disabled = false;
            document.getElementById('send-btn').disabled = false;
            chatInput.focus();
        }
    }

    exportChatHistory() {
        if (!this.selectedChatbot || this.currentMessages.length === 0) {
            alert('No chat history to export. Please have a conversation first.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text(`${this.selectedChatbot.name} - Chat History`, 20, 20);
        
        // Date
        doc.setFontSize(12);
        doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        let yPosition = 50;
        const pageHeight = doc.internal.pageSize.height;
        const marginBottom = 20;
        
        this.currentMessages.forEach((msg, index) => {
            if (yPosition > pageHeight - marginBottom) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(msg.role === 'user' ? 'You:' : 'AI:', 20, yPosition);
            
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(msg.content, 170);
            doc.text(lines, 20, yPosition + 7);
            
            yPosition += (lines.length * 7) + 10;
        });
        
        doc.save(`${this.selectedChatbot.name}_chat_history.pdf`);
    }

    async exportSummaryAndGuide() {
        if (!this.selectedChatbot || this.currentMessages.length === 0) {
            alert('No chat history to export. Please have a conversation first.');
            return;
        }

        try {
            // Generate summary using AI
            const summaryPrompt = `Please create a comprehensive study summary and revision guide based on our conversation. Include:
1. Key topics discussed
2. Important concepts and definitions
3. Study tips and recommendations
4. Practice suggestions

Our conversation:
${this.currentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`;

            const client = axios.create({
                baseURL: this.config.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            const { data } = await client.post('/chat/completions', {
                model: this.config.model,
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.3,
                max_tokens: 1500
            });
            const summary = data.choices[0].message.content;

            // Create PDF with summary
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text(`${this.selectedChatbot.name} - Study Guide`, 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
            
            const lines = doc.splitTextToSize(summary, 170);
            doc.text(lines, 20, 50);
            
            doc.save(`${this.selectedChatbot.name}_study_guide.pdf`);
            
        } catch (error) {
            console.error('Error generating summary:', error);
            alert('Error generating summary. Please try again.');
        }
    }
    
    // Test function for debugging - call this in browser console
    async testAPI() {
        console.log('🧪 Testing API directly...');
        try {
            const response = await fetch('https://chatapi.akash.network/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: 'Hello, test message' }],
                    temperature: 0.7,
                    max_tokens: 100
                })
            });
            
            const data = await response.json();
            console.log('🧪 Direct API test result:', data);
            console.log('🧪 Response content:', data.choices[0].message.content);
            console.log('🧪 Content type:', typeof data.choices[0].message.content);
            
            // Test addMessage with this response
            this.addMessage('assistant', data.choices[0].message.content);
            
        } catch (error) {
            console.error('🧪 Direct API test error:', error);
        }
    }
    
    // Test function for addMessage - call this in browser console
    testAddMessage() {
        console.log('🧪 Testing addMessage with different content types...');
        
        // Test with string
        this.addMessage('assistant', 'Test string message');
        
        // Test with object (this should trigger the conversion)
        this.addMessage('assistant', { test: 'object message' });
        
        // Test with null
        this.addMessage('assistant', null);
        
        // Test with undefined
        this.addMessage('assistant', undefined);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new StudyBotApp();
    app.initializeApp();
    
    // Make app globally accessible for debugging
    window.studyBot = app;
});

// Global test functions for debugging
window.testAPI = () => window.studyBot?.testAPI();
window.testAddMessage = () => window.studyBot?.testAddMessage();
