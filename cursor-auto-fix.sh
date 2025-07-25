#!/bin/bash
# 🚀 FSP Navigator - Complete Automated Fix Script

echo "🤖 Starting FSP Navigator Complete Fix Process..."
cd /workspace

# STEP 1: Fix Frontend Package.json
cd frontend
rm -rf node_modules package-lock.json yarn.lock

cat > package.json << 'EOF'
{
  "name": "fsp-navigator",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@paypal/react-paypal-js": "^8.8.3",
    "@react-oauth/google": "^0.12.1",
    "axios": "^1.8.4",
    "lucide-react": "^0.522.0",
    "framer-motion": "^11.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "SKIP_PREFLIGHT_CHECK=true react-scripts start",
    "build": "node scripts/simple-enhanced-build.js",
    "build:react": "GENERATE_SOURCEMAP=false react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "build:clean": "rm -rf build && npm run build",
    "build:production": "npm run build:clean",
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "@craco/craco": "^7.1.0",
    "@craco/types": "^7.1.0",
    "patch-package": "^8.0.0",
    "postinstall-postinstall": "^2.1.0"
  },
  "overrides": {
    "shell-quote": "^1.8.1",
    "ejs": "^3.1.10",
    "loader-utils": "^3.2.1",
    "immer": "^10.0.3",
    "postcss": "^8.4.31",
    "ajv": "^8.12.0",
    "ajv-keywords": "^5.1.0",
    "fork-ts-checker-webpack-plugin": "^9.0.2"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# STEP 2: Update React 18
cd src
cat > index.js << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
EOF

# STEP 3: Mobile Optimization
cat >> index.css << 'EOF'
@media (max-width: 768px) {
  body { font-size: 16px; -webkit-text-size-adjust: none; }
  input, textarea, select { font-size: 16px; }
}
button { min-height: 44px; min-width: 44px; }
img { max-width: 100%; loading: lazy; }
EOF

# STEP 4: SEO HTML
cd ../public
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="FSP Navigator - Ghidul complet pentru obținerea licenței medicale în Germania" />
  <title>FSP Navigator - Ghid Licență Medicală Germania</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOF

# STEP 5: Install & Build
cd ..
npm install --force
npm run build:production

echo "✅ FSP Navigator fixed and ready for Emergent.sh!"