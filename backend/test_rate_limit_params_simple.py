#!/usr/bin/env python3
"""
Simple test script to verify that all rate-limited endpoints have the required request parameter.
Uses regex pattern matching instead of AST parsing for better reliability.
"""

import re
import sys
from pathlib import Path

def find_rate_limited_endpoints(file_path):
    """Find all endpoints with @limiter.limit decorators using regex."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match @limiter.limit decorator followed by function definition
    pattern = r'@limiter\.limit\([^)]+\)\s*\n\s*async def (\w+)\s*\(([^)]*)\):'
    matches = re.finditer(pattern, content, re.MULTILINE)
    
    rate_limited_endpoints = []
    
    for match in matches:
        function_name = match.group(1)
        parameters = match.group(2)
        
        # Check if 'request' is in the parameters
        has_request_param = 'request' in parameters
        
        # Get line number (approximate)
        line_number = content[:match.start()].count('\n') + 1
        
        rate_limited_endpoints.append({
            'name': function_name,
            'line': line_number,
            'has_request_param': has_request_param,
            'parameters': parameters.strip()
        })
    
    return rate_limited_endpoints

def test_rate_limit_parameters():
    """Test all rate-limited endpoints for required request parameter."""
    print("🔍 Checking rate-limited endpoints for required 'request' parameter...")
    print("=" * 70)
    
    # Files to check
    files_to_check = [
        'backend/routes/auth.py',
        'backend/routes/files.py'
    ]
    
    all_passed = True
    total_endpoints = 0
    
    for file_path in files_to_check:
        if not Path(file_path).exists():
            print(f"⚠️  File not found: {file_path}")
            continue
        
        print(f"\n📁 Checking {file_path}:")
        endpoints = find_rate_limited_endpoints(file_path)
        
        if not endpoints:
            print("   No rate-limited endpoints found")
            continue
        
        for endpoint in endpoints:
            total_endpoints += 1
            status = "✅" if endpoint['has_request_param'] else "❌"
            print(f"   {status} {endpoint['name']} (line ~{endpoint['line']})")
            print(f"      Parameters: {endpoint['parameters']}")
            
            if not endpoint['has_request_param']:
                all_passed = False
                print(f"      ⚠️  Missing 'request: Request' parameter!")
    
    print("\n" + "=" * 70)
    print(f"📊 Results: {total_endpoints} rate-limited endpoints checked")
    
    if all_passed:
        print("🎉 All rate-limited endpoints have the required 'request' parameter!")
        return 0
    else:
        print("❌ Some endpoints are missing the 'request' parameter!")
        print("\n💡 To fix this, add 'request: Request' as the first parameter")
        print("   in the function signature of the problematic endpoints.")
        return 1

def main():
    """Main function."""
    try:
        return test_rate_limit_parameters()
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())