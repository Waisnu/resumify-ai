#!/bin/bash

# Development Setup Script
# Sets up the development environment for ResumeAI

set -e

echo "🚀 Setting up ResumeAI development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the project root?"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
  echo "❌ Error: Node.js version $NODE_VERSION is too old. Required: $REQUIRED_NODE_VERSION or higher"
  exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
if command -v bun &> /dev/null; then
  echo "Using Bun..."
  bun install
else
  echo "Using npm..."
  npm install
fi

# Setup environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
  else
    cat > .env.local << 'EOF'
# ResumeAI Environment Variables
# Copy this file to .env.local and fill in your values

# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Configuration
NODE_ENV=development
GEMINI_MODEL=gemini-2.0-flash-exp
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=900000
MAX_TOKENS=4096
REQUEST_TIMEOUT=30000

# Optional: Admin API Key (for metrics endpoint)
ADMIN_API_KEY=your_admin_api_key_here

# Optional: Application Settings
APP_NAME=ResumeAI
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
EOF
    echo "✅ Created .env.local template"
  fi
  echo "⚠️  Please edit .env.local and add your GEMINI_API_KEY"
else
  echo "✅ .env.local already exists"
fi

# Check for required environment variables
if [ -f ".env.local" ]; then
  source .env.local
  if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "⚠️  WARNING: GEMINI_API_KEY is not set in .env.local"
    echo "   The application will not work without this key."
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
  fi
fi

# Type checking
echo "🔍 Running type check..."
if command -v bunx &> /dev/null; then
  bunx tsc --noEmit
else
  npx tsc --noEmit
fi

# Run linting
echo "🧹 Running linter..."
if command -v bun &> /dev/null; then
  bun run lint --fix
else
  npm run lint -- --fix
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p public/temp
mkdir -p logs

# Set up git hooks (if git is initialized)
if [ -d ".git" ]; then
  echo "🔗 Setting up git hooks..."
  if [ ! -f ".git/hooks/pre-commit" ]; then
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for ResumeAI

echo "Running pre-commit checks..."

# Run type check
if command -v bunx &> /dev/null; then
  bunx tsc --noEmit
else
  npx tsc --noEmit
fi

# Run linter
if command -v bun &> /dev/null; then
  bun run lint
else
  npm run lint
fi

echo "✅ Pre-commit checks passed"
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git pre-commit hook installed"
  fi
fi

# Final setup validation
echo "🧪 Validating setup..."
if command -v bun &> /dev/null; then
  bun run build
else
  npm run build
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your GEMINI_API_KEY"
echo "2. Run 'bun run dev' (or 'npm run dev') to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Available commands:"
echo "- bun run dev (or npm run dev) - Start development server"
echo "- bun run build (or npm run build) - Build for production"
echo "- bun run lint (or npm run lint) - Run linter"
echo "- bun run typecheck (or npm run typecheck) - Run type checking"
echo ""
echo "For more information, see README.md"