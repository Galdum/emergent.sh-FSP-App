#!/usr/bin/env python3
"""
Test script to verify that all rate-limited endpoints have the required request parameter.
This helps prevent runtime errors when slowapi tries to extract client IP addresses.
"""

import ast
import sys
from pathlib import Path

def find_rate_limited_endpoints(file_path):
    """Find all endpoints with @limiter.limit decorators in a file."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    tree = ast.parse(content)
    rate_limited_endpoints = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # Check if function has @limiter.limit decorator
            has_limiter_decorator = False
            for decorator in node.decorator_list:
                if (isinstance(decorator, ast.Attribute) and 
                    isinstance(decorator.value, ast.Name) and
                    decorator.value.id == 'limiter' and
                    decorator.attr == 'limit'):
                    has_limiter_decorator = True
                    break
                elif (isinstance(decorator, ast.Call) and
                      isinstance(decorator.func, ast.Attribute) and
                      isinstance(decorator.func.value, ast.Name) and
                      decorator.func.value.id == 'limiter' and
                      decorator.func.attr == 'limit'):
                    has_limiter_decorator = True
                    break
            
            if has_limiter_decorator:
                # Check if function has 'request' parameter
                has_request_param = False
                for arg in node.args.args:
                    if arg.arg == 'request':
                        has_request_param = True
                        break
                
                rate_limited_endpoints.append({
                    'name': node.name,
                    'line': node.lineno,
                    'has_request_param': has_request_param
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
            print(f"   {status} {endpoint['name']} (line {endpoint['line']})")
            
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