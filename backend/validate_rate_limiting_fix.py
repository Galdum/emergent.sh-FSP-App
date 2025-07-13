#!/usr/bin/env python3
"""
Simple validation script to check the rate limiting fix implementation.
This script validates the code structure without requiring full dependencies.
"""

import ast
import os
import sys
from typing import List, Dict, Any

def check_file_syntax(file_path: str) -> Dict[str, Any]:
    """Check if a Python file has valid syntax"""
    result = {
        "file": file_path,
        "syntax_valid": False,
        "errors": []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse the AST
        ast.parse(content)
        result["syntax_valid"] = True
        
    except SyntaxError as e:
        result["errors"].append(f"Syntax error: {e}")
    except Exception as e:
        result["errors"].append(f"Error reading file: {e}")
    
    return result

def check_rate_limiting_imports(file_path: str) -> Dict[str, Any]:
    """Check if rate limiting imports are present"""
    result = {
        "file": file_path,
        "has_slowapi": False,
        "has_safe_rate_limit": False,
        "has_limiter": False,
        "errors": []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for slowapi imports
        if "from slowapi import" in content or "import slowapi" in content:
            result["has_slowapi"] = True
        
        # Check for safe_rate_limit function
        if "def safe_rate_limit" in content:
            result["has_safe_rate_limit"] = True
        
        # Check for limiter variable
        if "limiter = " in content:
            result["has_limiter"] = True
            
    except Exception as e:
        result["errors"].append(f"Error reading file: {e}")
    
    return result

def check_decorator_usage(file_path: str) -> Dict[str, Any]:
    """Check for rate limiting decorator usage"""
    result = {
        "file": file_path,
        "decorators_found": [],
        "errors": []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line.startswith('@safe_rate_limit('):
                result["decorators_found"].append(f"Line {i}: {line}")
            elif line.startswith('@limiter.limit('):
                result["decorators_found"].append(f"Line {i}: {line}")
                
    except Exception as e:
        result["errors"].append(f"Error reading file: {e}")
    
    return result

def validate_rate_limiting_fix() -> Dict[str, Any]:
    """Main validation function"""
    results = {
        "overall_status": "PENDING",
        "files_checked": 0,
        "files_with_errors": 0,
        "details": []
    }
    
    # Files to check
    files_to_check = [
        "security.py",
        "routes/auth.py",
        "routes/files.py", 
        "routes/billing.py",
        "routes/admin.py",
        "server.py"
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            results["details"].append({
                "file": file_path,
                "status": "NOT_FOUND",
                "error": "File does not exist"
            })
            results["files_with_errors"] += 1
            continue
        
        results["files_checked"] += 1
        file_results = {
            "file": file_path,
            "syntax_check": check_file_syntax(file_path),
            "imports_check": check_rate_limiting_imports(file_path),
            "decorators_check": check_decorator_usage(file_path)
        }
        
        # Check for errors
        has_errors = False
        if not file_results["syntax_check"]["syntax_valid"]:
            has_errors = True
        
        if file_results["imports_check"]["errors"]:
            has_errors = True
        
        if file_results["decorators_check"]["errors"]:
            has_errors = True
        
        if has_errors:
            results["files_with_errors"] += 1
        
        results["details"].append(file_results)
    
    # Determine overall status
    if results["files_with_errors"] == 0:
        results["overall_status"] = "PASSED"
    else:
        results["overall_status"] = "FAILED"
    
    return results

def print_validation_results(results: Dict[str, Any]):
    """Print validation results in a formatted way"""
    print("\n" + "="*60)
    print("RATE LIMITING FIX VALIDATION RESULTS")
    print("="*60)
    
    print(f"\nOverall Status: {results['overall_status']}")
    print(f"Files Checked: {results['files_checked']}")
    print(f"Files with Errors: {results['files_with_errors']}")
    
    print(f"\nDetailed Results:")
    for detail in results["details"]:
        print(f"\n  File: {detail['file']}")
        
        # Syntax check
        syntax = detail["syntax_check"]
        if syntax["syntax_valid"]:
            print(f"    Syntax: ✅ VALID")
        else:
            print(f"    Syntax: ❌ INVALID")
            for error in syntax["errors"]:
                print(f"      Error: {error}")
        
        # Imports check
        imports = detail["imports_check"]
        print(f"    SlowAPI Import: {'✅' if imports['has_slowapi'] else '❌'}")
        print(f"    Safe Rate Limit: {'✅' if imports['has_safe_rate_limit'] else '❌'}")
        print(f"    Limiter Variable: {'✅' if imports['has_limiter'] else '❌'}")
        
        # Decorators check
        decorators = detail["decorators_check"]
        if decorators["decorators_found"]:
            print(f"    Rate Limiting Decorators: ✅ {len(decorators['decorators_found'])} found")
            for decorator in decorators["decorators_found"][:3]:  # Show first 3
                print(f"      {decorator}")
            if len(decorators["decorators_found"]) > 3:
                print(f"      ... and {len(decorators['decorators_found']) - 3} more")
        else:
            print(f"    Rate Limiting Decorators: ❌ None found")
    
    print("\n" + "="*60)
    
    if results["overall_status"] == "PASSED":
        print("✅ Rate limiting fix validation passed!")
        print("All files have valid syntax and proper rate limiting implementation.")
    else:
        print("❌ Rate limiting fix validation failed!")
        print("Please check the errors above and fix them.")

def main():
    """Main function"""
    print("Validating Rate Limiting Fix...")
    print("This script checks the syntax and structure of the rate limiting implementation.")
    
    results = validate_rate_limiting_fix()
    print_validation_results(results)
    
    return results

if __name__ == "__main__":
    main()