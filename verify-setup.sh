#!/bin/bash

# ============================================================================
# Verify Teachers System Setup
# ============================================================================

echo "🔍 Verifying Teachers System Setup..."
echo ""

# Check if .env exists and has required variables
echo "1️⃣ Checking environment variables..."
if [ -f .env ]; then
    if grep -q "PUBLIC_SUPABASE_URL=https://" .env && \
       grep -q "PUBLIC_SUPABASE_ANON_KEY=eyJ" .env && \
       grep -q "SUPABASE_SERVICE_ROLE_KEY=eyJ" .env; then
        echo "   ✅ .env configured correctly"
    else
        echo "   ❌ .env missing required variables"
        exit 1
    fi
else
    echo "   ❌ .env file not found"
    exit 1
fi

# Check if SQL file exists
echo ""
echo "2️⃣ Checking SQL schema file..."
if [ -f supabase-teachers-table.sql ]; then
    echo "   ✅ supabase-teachers-table.sql exists"
else
    echo "   ❌ supabase-teachers-table.sql not found"
    exit 1
fi

# Check if component exists
echo ""
echo "3️⃣ Checking TeacherManager component..."
if [ -f src/components/admin/TeacherManager.tsx ]; then
    echo "   ✅ TeacherManager.tsx exists"
else
    echo "   ❌ TeacherManager.tsx not found"
    exit 1
fi

# Check if admin page exists
echo ""
echo "4️⃣ Checking admin page..."
if [ -f src/pages/admin/guru.astro ]; then
    echo "   ✅ /admin/guru page exists"
else
    echo "   ❌ /admin/guru page not found"
    exit 1
fi

# Check if public page exists
echo ""
echo "5️⃣ Checking public page..."
if [ -f src/pages/guru.astro ]; then
    echo "   ✅ /guru page exists"
else
    echo "   ❌ /guru page not found"
    exit 1
fi

# Check dev server
echo ""
echo "6️⃣ Checking dev server..."
if lsof -Pi :4321 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Dev server running on port 4321"
elif lsof -Pi :4322 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Dev server running on port 4322"
else
    echo "   ⚠️  Dev server not running"
    echo "      Run: npm run dev"
fi

echo ""
echo "============================================================================"
echo "✅ All checks passed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open Supabase Dashboard: https://app.supabase.com"
echo "   2. Run SQL: supabase-teachers-table.sql"
echo "   3. Create storage bucket 'teachers' (PUBLIC)"
echo "   4. Test admin page: http://localhost:4322/admin/guru"
echo "   5. Click 'Impor Data Default' to import 11 teachers"
echo ""
echo "============================================================================"
