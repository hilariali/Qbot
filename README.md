# StudyBot - AI Revision Assistant

A comprehensive web application that helps students chat with specialized AI tutors for exam revision across multiple subjects.

## Features

- **Multi-Subject Support**: Chinese, English, Mathematics, Science, Physics, Chemistry, Biology, History, Geography, ICT, and STEAM
- **Specialized Chatbots**: Each subject has multiple chatbots focusing on specific topics or past paper years
- **Enhanced Export Functionality**: 
  - Export chat history as PDF with multi-page support
  - Export AI-generated summary and revision guide as PDF
  - **NEW**: Multi-page PDF support for long summaries
  - **NEW**: Revision-focused summaries highlighting wrong answers and corrections
- **Thinking Process Toggle**: AI responses with thinking processes are collapsible for better readability
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

1. **Download Files**: Ensure all files are in the same directory:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.txt`
   - `prompts/` directory with prompt files

2. **Configure API**: Update `config.txt` with your API credentials:
   ```
   key:your-api-key-here
   model:your-model-name-here
   baseURL:https://api.akashml.com/v1
   ```
   StudyBot reads this file on startup, so ensure it is served from the same directory as `index.html`.
   
   **Note**: The application uses the Akash ML API endpoint (`https://api.akashml.com/v1/chat/completions`). The `baseURL` is set to `https://api.akashml.com/v1` and the application automatically appends `/chat/completions` to this URL when making API requests.

3. **Serve Files**: Use a local web server to serve the files:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Access Application**: Open your browser and navigate to `http://localhost:8000`

## Usage Guide

### Getting Started
1. **Select Subject**: Choose your subject from the main screen
2. **Select Chatbot**: Pick a specific chatbot based on your needs (topic-specific or past papers)
3. **Start Chatting**: Begin your revision session with the AI tutor

### Chat Features
- **Send Messages**: Type your question and press Enter or click Send
- **View Thinking Process**: Click the "Thinking Process" toggle to see AI reasoning
- **Export Chat**: Click "Export Chat History" to save your conversation as PDF
- **Export Summary**: Click "Export Summary & Guide" to get an AI-generated revision guide
  - **NEW**: Automatically creates multiple pages if summary is long
  - **NEW**: Highlights wrong answers and corrections for focused revision
  - **NEW**: Includes questions asked and their detailed answers

### Available Chatbots

#### Chinese
- Grammar Tutor - Chinese grammar and sentence structure
- Literature Guide - Chinese literature and poetry analysis
- Writing Assistant - Chinese writing skills improvement
- 2023/2024 Past Papers - Exam practice

#### English  
- Grammar Expert - English grammar mastery
- Literature Analyst - English literature analysis
- Essay Writing Coach - Writing skills development
- 2023/2024 Past Papers - Exam practice

#### Mathematics
- Algebra Tutor - Algebraic equations and problems
- Geometry Guide - Shapes, angles, and spatial reasoning
- Calculus Coach - Derivatives and integrals
- Statistics Helper - Probability and data analysis
- 2023/2024 Past Papers - Exam practice

#### Science
- General Science - Broad science concepts
- Lab Experiments - Scientific methodology
- 2023/2024 Past Papers - Exam practice

#### Physics
- Mechanics Tutor - Forces, motion, and energy
- Electricity Guide - Circuits and electrical concepts
- Waves & Sound - Wave properties and acoustics
- 2023/2024 Past Papers - Exam practice

#### Chemistry
- Organic Chemistry - Carbon compounds and reactions
- Inorganic Chemistry - Elements and compounds
- Physical Chemistry - Thermodynamics and kinetics
- 2023/2024 Past Papers - Exam practice

#### Biology
- Cell Biology - Cellular structure and function
- Genetics Tutor - DNA, inheritance, and evolution
- Ecology Guide - Ecosystems and environment
- 2023/2024 Past Papers - Exam practice

#### History
- World History - Global historical events
- Local History - Regional historical events
- Historical Analysis - Source analysis and interpretation
- 2023/2024 Past Papers - Exam practice

#### Geography
- Physical Geography - Natural processes and landforms
- Human Geography - Population and urbanization
- Maps & Navigation - Geographical skills
- 2023/2024 Past Papers - Exam practice

#### ICT
- Programming Tutor - Coding and programming concepts
- Database Guide - Database design and management
- Networking Basics - Computer networks and internet
- 2023/2024 Past Papers - Exam practice

#### STEAM
- Project Guide - Interdisciplinary project development
- Innovation Tutor - Creative problem-solving
- Subject Integration - Connecting STEAM disciplines
- 2023/2024 Past Papers - Exam practice

## Customization

### Adding New Chatbots
1. Update the `chatbots` object in `app.js`
2. Create a corresponding prompt file in the `prompts/` directory
3. Add the prompt filename to the `promptFiles` array in `loadChatbotPrompts()`

### Modifying Prompts
Edit the relevant `.txt` files in the `prompts/` directory to customize chatbot behavior.

### Styling
Modify `styles.css` to change the appearance and layout of the application.

## Browser Requirements

- Modern web browser with JavaScript enabled
- Support for ES6+ features
- PDF generation requires jsPDF library (included via CDN)

## Dependencies

- Axios (for API requests)
- jsPDF (for PDF generation)
- highlight.js (optional code highlighting)
- Modern browser with fetch API support

## Troubleshooting

1. **API Errors**: Check your API key and model name in `config.txt`
2. **CORS Issues**: Ensure you're serving files through a web server, not opening directly in browser
3. **PDF Export Issues**: Check if jsPDF library is loading properly
4. **Prompt Not Loading**: Verify prompt files exist in the `prompts/` directory

## Security Notes

- Keep your API key secure and don't commit it to version control
- Consider implementing rate limiting for production use
- The application runs entirely in the browser - no server-side processing required

## Recent Updates

### October 2025 - PDF Export Enhancements
- ✅ **Multi-Page PDF Support**: Summary PDFs now automatically span multiple pages for long content
- ✅ **Revision-Focused Summaries**: AI summaries now highlight mistakes and wrong answers for targeted revision
- ✅ **Enhanced Content**: Increased summary detail with questions, answers, and correction highlights
- 📄 See [PDF_IMPROVEMENTS_SUMMARY.md](PDF_IMPROVEMENTS_SUMMARY.md) for technical details
- 📄 See [BEFORE_AFTER_COMPARISON.md](BEFORE_AFTER_COMPARISON.md) for visual comparison

## License

This project is open source and available under the MIT License.
