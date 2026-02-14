# NITP Exam Pilot

An AI-powered exam strategy tool that uses Gemini 3 Flash to cross-reference university syllabi with past exam papers, helping students identify high-priority topics.

## Features

- 📄 **Dual PDF Upload**: Upload syllabus and past year question papers
- 🤖 **AI Analysis**: Uses Gemini 3 Flash with Medium thinking level for deep analysis
- 📊 **Priority Matrix**: Identifies "Low Effort, High Reward" topics
- 🎯 **Confidence Scores**: Each topic gets a likelihood percentage
- 📝 **Markdown Export**: Download results for Notion/Obsidian
- 🎨 **Modern UI**: Elevated Neutral theme with Deep Violet accents

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then add your Gemini API key to `.env`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. Upload your syllabus PDF in the first dropzone
2. Upload past year question papers PDF in the second dropzone
3. Click "Analyze Exam Strategy"
4. Review the priority list with confidence scores
5. Export results as Markdown for your notes

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@google/generative-ai** - Gemini API integration

## Project Structure

```
src/
  components/     # React components
  hooks/          # Custom React hooks
  services/       # API services
```

## License

MIT
# Exam-Pilot
