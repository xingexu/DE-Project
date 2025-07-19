#!/bin/bash
echo "Clearing TypeScript caches..."
rm -rf node_modules/.cache
rm -rf .vite
echo "Restarting development server..."
npm run dev 