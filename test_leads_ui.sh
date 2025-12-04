#!/bin/bash

# Quick test script for Phase 4: UI Components
# This script helps verify the leads UI is working correctly

echo "🧪 Testing Phase 4: UI Components - Leads Refactoring"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if leads directory exists
echo "1. Checking if /app/leads route exists..."
if [ -d "web/src/app/app/leads" ]; then
    echo -e "${GREEN}✅ Leads directory exists${NC}"
    echo "   Files found:"
    ls -1 web/src/app/app/leads/*.tsx 2>/dev/null | sed 's/^/   - /'
else
    echo -e "${RED}❌ Leads directory not found${NC}"
    exit 1
fi

echo ""
echo "2. Checking navigation link..."
if grep -q 'href="/app/leads"' web/src/app/app/layout.tsx; then
    echo -e "${GREEN}✅ Navigation link updated to /app/leads${NC}"
else
    echo -e "${RED}❌ Navigation link not found or incorrect${NC}"
fi

echo ""
echo "3. Checking for old /app/pins references in new code..."
OLD_REFS=$(grep -r "href=\"/app/pins\"" web/src/app/app/leads 2>/dev/null | wc -l)
if [ "$OLD_REFS" -eq 0 ]; then
    echo -e "${GREEN}✅ No old /app/pins references in leads directory${NC}"
else
    echo -e "${YELLOW}⚠️  Found $OLD_REFS old /app/pins references${NC}"
fi

echo ""
echo "4. Checking component naming..."
COMPONENTS=("LeadList" "LeadRow" "LeadFilterToggle" "AddLeadModal" "EditLeadModal")
for comp in "${COMPONENTS[@]}"; do
    if [ -f "web/src/app/app/leads/${comp}.tsx" ]; then
        echo -e "${GREEN}✅ ${comp}.tsx exists${NC}"
    else
        echo -e "${RED}❌ ${comp}.tsx not found${NC}"
    fi
done

echo ""
echo "5. Checking for 'pin' terminology in leads components..."
PIN_REFS=$(grep -r "Pin\|pin" web/src/app/app/leads/*.tsx 2>/dev/null | grep -v "//" | grep -v "import.*Pin" | grep -v "PersonPin" | wc -l)
if [ "$PIN_REFS" -eq 0 ]; then
    echo -e "${GREEN}✅ No 'pin' terminology found in leads components${NC}"
else
    echo -e "${YELLOW}⚠️  Found $PIN_REFS potential 'pin' references (check manually)${NC}"
    echo "   Review these lines:"
    grep -rn "Pin\|pin" web/src/app/app/leads/*.tsx 2>/dev/null | grep -v "//" | grep -v "import.*Pin" | grep -v "PersonPin" | head -5 | sed 's/^/   /'
fi

echo ""
echo "6. Checking API endpoint usage..."
if grep -q '"/api/leads"' web/src/app/app/leads/page.tsx; then
    echo -e "${GREEN}✅ Leads page uses /api/leads endpoint${NC}"
else
    echo -e "${RED}❌ Leads page not using /api/leads endpoint${NC}"
fi

echo ""
echo "=================================================="
echo "📋 Next Steps:"
echo "1. Start the dev server: cd web && npm run dev"
echo "2. Navigate to http://localhost:3000/app/leads"
echo "3. Test the UI using the test guide:"
echo "   docs/Testing/Phase4_UI_Components_Test_Guide.md"
echo ""
echo "🔍 Manual Checks:"
echo "- Verify page title says 'Leads'"
echo "- Verify 'Add Lead' button works"
echo "- Check all modals use 'lead' terminology"
echo "- Test filtering, snooze, archive functionality"
echo "- Check browser console for errors"
echo ""

