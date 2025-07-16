# ResumeAI - AI-Powered Resume Analysis and Cover Letter Generation

ResumeAI is a comprehensive web application that leverages Google Gemini AI to analyze resumes and generate professional cover letters. The application provides detailed insights into resume quality, LaTeX formatting recommendations, and personalized cover letter creation.

## 🚀 Features

### Resume Analysis
- **AI-Powered Analysis**: Uses Google Gemini 2.0 Flash for comprehensive resume evaluation
- **Quality Scoring**: Provides detailed scoring across multiple dimensions
- **LaTeX Generation**: Creates professional LaTeX-formatted resumes
- **Improvement Suggestions**: Actionable recommendations for enhancement

### Cover Letter Generation
- **Personalized Content**: Generates tailored cover letters based on job descriptions
- **Multiple Templates**: Industry-specific templates with professional styling
- **Tone Customization**: Professional, friendly, confident, and conversational tones
- **Resume Integration**: Seamlessly integrates with analyzed resume data
- **Multi-Format Export**: PDF, DOCX, HTML, LaTeX, and TXT export options

### Pro Features
- **Advanced Templates**: Premium templates for different industries
- **Analytics Dashboard**: Performance tracking and success metrics
- **Industry Benchmarks**: Compare against industry standards
- **Custom Styling**: Professional styling options for exports

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Framer Motion
- **AI Integration**: Google Gemini 2.0 Flash
- **File Processing**: PDF parsing, document extraction
- **Runtime**: Node.js with Bun support

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Google Gemini API key
- Bun (recommended) or npm

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd resumify-ai

# Run the automated setup script
./scripts/setup-dev.sh
```

### Option 2: Manual Setup

1. **Install dependencies**:
   ```bash
   bun install
   # or
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run type checking**:
   ```bash
   bunx tsc --noEmit
   ```

4. **Start development server**:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `NODE_ENV` | No | `development` | Environment mode |
| `GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | AI model to use |
| `RATE_LIMIT_MAX` | No | `10` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `MAX_TOKENS` | No | `4096` | Maximum tokens per request |
| `REQUEST_TIMEOUT` | No | `30000` | Request timeout in ms |
| `ADMIN_API_KEY` | No | - | Admin API access key |
| `BASE_URL` | No | `http://localhost:3000` | Application base URL |

### Getting API Keys

1. **Google Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env.local` file

## 🏗️ Project Structure

```
resumify-ai/
├── components/          # React components
│   └── ui/             # UI components
├── lib/                # Utility libraries
│   ├── config.ts       # Configuration management
│   ├── error-handler.ts # Error handling utilities
│   ├── secure-logger.ts # Secure logging system
│   ├── performance-monitor.ts # Performance tracking
│   └── api-utils.ts    # API utilities
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   └── ...            # Page components
├── public/            # Static assets
├── scripts/           # Development scripts
└── styles/            # Global styles
```

## 📊 API Endpoints

### Core APIs
- `POST /api/analysis` - Resume analysis
- `POST /api/latex-recommendation` - LaTeX generation
- `POST /api/cover-letter/generate` - Cover letter generation
- `POST /api/cover-letter/export` - Export cover letter
- `GET /api/cover-letter/analytics` - Analytics data

### Monitoring
- `GET /api/health` - Health check
- `GET /api/metrics` - Performance metrics (requires admin key)

## 🧪 Development

### Available Commands

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Quality Assurance
bun run lint         # Run ESLint
bun run lint:fix     # Fix linting issues
bun run typecheck    # Run TypeScript checking

# Testing
bun run test         # Run tests (if configured)
```

### Development Workflow

1. **Code Quality**: The project uses ESLint and TypeScript for code quality
2. **Performance Monitoring**: Built-in performance tracking for API endpoints
3. **Error Handling**: Comprehensive error handling with secure logging
4. **Security**: Input validation and secure logging practices

### Adding New Features

1. **API Endpoints**: Use the `withApiHandler` utility from `lib/api-utils.ts`
2. **UI Components**: Follow existing patterns in `components/ui/`
3. **Error Handling**: Use standardized error classes from `lib/error-handler.ts`
4. **Logging**: Use the secure logger from `lib/secure-logger.ts`

## 🔒 Security Features

- **Input Validation**: Comprehensive validation for all API inputs
- **Secure Logging**: Sensitive data is automatically redacted from logs
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Error Handling**: Prevents information leakage through error messages
- **Environment Variables**: Secure configuration management

## 📈 Performance Monitoring

The application includes built-in performance monitoring:

- **API Response Times**: Automatic tracking of endpoint performance
- **Error Rates**: Monitoring of failed requests
- **Health Checks**: System health monitoring
- **Metrics Dashboard**: Admin-accessible metrics endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use the secure logger for all logging
- Implement proper error handling
- Add performance monitoring to new APIs

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure your API keys are valid
4. Check the health endpoint: `/api/health`

## 🔄 Recent Updates

- ✅ Added comprehensive cover letter generation
- ✅ Implemented secure logging system
- ✅ Added performance monitoring
- ✅ Improved error handling
- ✅ Enhanced TypeScript support
- ✅ Added development setup scripts

---

## Project Info

**Original URL**: https://lovable.dev/projects/c79d01b5-315f-4a88-800c-aad3ec79ceab