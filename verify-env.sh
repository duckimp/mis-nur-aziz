#!/bin/bash
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  🔍 VERIFIKASI ENVIRONMENT VARIABLES'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo ''
if [ ! -f .env ]; then
    echo '❌ File .env tidak ditemukan!'
    exit 1
fi
echo '📁 File .env: ✅'
echo ''
URL=$(grep "^PUBLIC_SUPABASE_URL=" .env | cut -d "=" -f2)
if [[ $URL == *"your_supabase_url"* ]] || [[ -z $URL ]]; then
    echo '❌ PUBLIC_SUPABASE_URL masih placeholder'
    exit 1
fi
if [[ $URL == https://\* ]]; then
    echo "✅ PUBLIC_SUPABASE_URL: Valid"
else
    echo '❌ PUBLIC_SUPABASE_URL: Invalid'
    exit 1
fi
echo ''
ANON=$(grep "^PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d "=" -f2)
if [[ $ANON == *"your_supabase_anon"* ]] || [[ -z $ANON ]]; then
    echo '❌ PUBLIC_SUPABASE_ANON_KEY masih placeholder'
    exit 1
fi
echo '✅ PUBLIC_SUPABASE_ANON_KEY: Valid'
echo ''
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  ✅ ENVIRONMENT VARIABLES VALID!'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo ''
echo '📌 Next: npm run dev'
