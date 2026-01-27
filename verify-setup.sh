#!/bin/bash

# Project Verification Checklist
# Run this to verify your Kalai Coco API project

echo "🔍 Kalai Coco API - Project Verification"
echo "========================================"
echo ""

# Check Node and npm
echo "✓ Checking prerequisites..."
node --version > /dev/null && echo "  ✅ Node.js installed"
npm --version > /dev/null && echo "  ✅ npm installed"

echo ""
echo "✓ Checking project structure..."

# Check directories
dirs=(
  "src"
  "src/config"
  "src/controllers"
  "src/services"
  "src/routes"
  "src/middleware"
  "src/types"
  "src/utils"
  "src/docs"
  "database"
  "database/migrations"
  "database/procedures"
  "tests"
  "dist"
)

for dir in "${dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir"
  else
    echo "  ❌ $dir (missing)"
  fi
done

echo ""
echo "✓ Checking source files..."

# Check key source files
files=(
  "src/app.ts"
  "src/index.ts"
  "src/config/database.ts"
  "src/config/environment.ts"
  "src/controllers/AuthController.ts"
  "src/controllers/UserController.ts"
  "src/controllers/PriceLevelController.ts"
  "src/services/AuthService.ts"
  "src/services/UserService.ts"
  "src/services/PriceLevelService.ts"
  "src/routes/authRoutes.ts"
  "src/routes/userRoutes.ts"
  "src/routes/priceLevelRoutes.ts"
  "src/middleware/auth.ts"
  "src/middleware/errorHandler.ts"
  "src/types/index.ts"
  "src/utils/jwt.ts"
  "src/utils/errors.ts"
  "src/utils/logger.ts"
  "src/docs/swagger.ts"
  "database/migrations/001_init.sql"
  "database/procedures/procedures.sql"
  "tests/utils/jwt.test.ts"
  "tests/utils/errors.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing)"
  fi
done

echo ""
echo "✓ Checking configuration files..."

# Check config files
configs=(
  "package.json"
  "tsconfig.json"
  ".eslintrc.json"
  ".prettierrc"
  "jest.config.js"
  ".lintstagedrc.json"
  ".gitignore"
  ".env"
  ".env.example"
)

for config in "${configs[@]}"; do
  if [ -f "$config" ]; then
    echo "  ✅ $config"
  else
    echo "  ❌ $config (missing)"
  fi
done

echo ""
echo "✓ Checking documentation..."

docs=(
  "README.md"
  "QUICK_START.md"
  "SETUP_COMPLETE.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (missing)"
  fi
done

echo ""
echo "✓ Checking npm packages..."

if [ -d "node_modules" ]; then
  echo "  ✅ node_modules installed"
  pkg_count=$(ls node_modules | wc -l)
  echo "     ($pkg_count packages)"
else
  echo "  ❌ node_modules not found (run: npm install)"
fi

echo ""
echo "✓ Checking build output..."

if [ -d "dist" ]; then
  echo "  ✅ dist/ directory exists"
  js_count=$(find dist -name "*.js" | wc -l)
  echo "     ($js_count JavaScript files)"
else
  echo "  ⚠️  dist/ not found (run: npm run build)"
fi

echo ""
echo "========================================"
echo "✨ Project verification complete!"
echo ""
echo "📝 Next steps:"
echo "  1. npm install                  (if not done)"
echo "  2. npm run db:migrate          (initialize database)"
echo "  3. npm run dev                 (start development server)"
echo "  4. Visit http://localhost:3000/api-docs (API documentation)"
echo ""
echo "📚 Documentation:"
echo "  • QUICK_START.md  - Quick start guide"
echo "  • README.md       - Full documentation"
echo "  • SETUP_COMPLETE.md - Setup details"
echo ""
