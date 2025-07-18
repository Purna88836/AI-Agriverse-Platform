#!/usr/bin/env python3
"""
AgriVerse Backend API Testing Suite
Tests all backend functionality including authentication, land management, AI features, and marketplace
"""

import requests
import json
import base64
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://cf83162f-5269-4bf0-82de-9de5bb9b247e.preview.emergentagent.com/api"
TIMEOUT = 30

class AgriVerseAPITester:
    def __init__(self):
        self.farmer_token = None
        self.customer_token = None
        self.farmer_user = None
        self.customer_user = None
        self.test_land_id = None
        self.test_product_id = None
        self.results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "land_management": {"passed": 0, "failed": 0, "details": []},
            "ai_disease_detection": {"passed": 0, "failed": 0, "details": []},
            "ai_plant_planning": {"passed": 0, "failed": 0, "details": []},
            "product_marketplace": {"passed": 0, "failed": 0, "details": []},
            "database_models": {"passed": 0, "failed": 0, "details": []}
        }

    def log_result(self, category: str, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        if success:
            self.results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.results[category]["failed"] += 1
            status = "❌ FAIL"
        
        self.results[category]["details"].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{BASE_URL}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                if files:
                    # Remove Content-Type for file uploads
                    default_headers.pop("Content-Type", None)
                    response = requests.post(url, data=data, files=files, headers=default_headers, timeout=TIMEOUT)
                else:
                    response = requests.post(url, json=data, headers=default_headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=TIMEOUT)
            else:
                return False, {"error": "Unsupported method"}, 400
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}, 408
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}, 503
        except Exception as e:
            return False, {"error": str(e)}, 500

    def get_auth_headers(self, user_type: str) -> Dict[str, str]:
        """Get authorization headers for user type"""
        token = self.farmer_token if user_type == "farmer" else self.customer_token
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}"}

    def create_sample_image_base64(self) -> str:
        """Create a sample base64 encoded image for testing"""
        # Create a simple 1x1 pixel PNG image
        import io
        from PIL import Image
        
        try:
            # Create a simple green image (representing a plant)
            img = Image.new('RGB', (100, 100), color='green')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = buffer.getvalue()
            return base64.b64encode(img_data).decode('utf-8')
        except ImportError:
            # Fallback: create a minimal base64 string that represents an image
            # This is a 1x1 transparent PNG
            return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    def test_user_authentication(self):
        """Test user registration and login for both farmers and customers"""
        print("\n=== Testing User Authentication System ===")
        
        # Test farmer registration
        farmer_data = {
            "email": "john.farmer@agriverse.com",
            "password": "SecureFarm123!",
            "user_type": "farmer",
            "name": "John Smith",
            "phone": "+1234567890",
            "location": {"lat": 40.7128, "lng": -74.0060},
            "address": "123 Farm Road, Rural County, State 12345"
        }
        
        success, response, status_code = self.make_request("POST", "/register", farmer_data)
        if success and "access_token" in response:
            self.farmer_token = response["access_token"]
            self.farmer_user = response["user"]
            self.log_result("authentication", "Farmer Registration", True, f"User ID: {response['user']['id']}")
        else:
            self.log_result("authentication", "Farmer Registration", False, f"Status: {status_code}, Response: {response}")

        # Test customer registration
        customer_data = {
            "email": "jane.customer@agriverse.com",
            "password": "SecureCustomer123!",
            "user_type": "customer",
            "name": "Jane Doe",
            "phone": "+1987654321",
            "location": {"lat": 40.7589, "lng": -73.9851},
            "address": "456 City Street, Urban Area, State 54321"
        }
        
        success, response, status_code = self.make_request("POST", "/register", customer_data)
        if success and "access_token" in response:
            self.customer_token = response["access_token"]
            self.customer_user = response["user"]
            self.log_result("authentication", "Customer Registration", True, f"User ID: {response['user']['id']}")
        else:
            self.log_result("authentication", "Customer Registration", False, f"Status: {status_code}, Response: {response}")

        # Test farmer login
        login_data = {"email": farmer_data["email"], "password": farmer_data["password"]}
        success, response, status_code = self.make_request("POST", "/login", login_data)
        if success and "access_token" in response:
            self.log_result("authentication", "Farmer Login", True, "Token received")
        else:
            self.log_result("authentication", "Farmer Login", False, f"Status: {status_code}, Response: {response}")

        # Test customer login
        login_data = {"email": customer_data["email"], "password": customer_data["password"]}
        success, response, status_code = self.make_request("POST", "/login", login_data)
        if success and "access_token" in response:
            self.log_result("authentication", "Customer Login", True, "Token received")
        else:
            self.log_result("authentication", "Customer Login", False, f"Status: {status_code}, Response: {response}")

        # Test profile access
        if self.farmer_token:
            headers = self.get_auth_headers("farmer")
            success, response, status_code = self.make_request("GET", "/profile", headers=headers)
            if success and "email" in response:
                self.log_result("authentication", "Farmer Profile Access", True, f"Email: {response['email']}")
            else:
                self.log_result("authentication", "Farmer Profile Access", False, f"Status: {status_code}, Response: {response}")

    def test_land_management(self):
        """Test CRUD operations for farmer land management"""
        print("\n=== Testing Land Management System ===")
        
        if not self.farmer_token:
            self.log_result("land_management", "Land Management Tests", False, "No farmer token available")
            return

        headers = self.get_auth_headers("farmer")
        
        # Test create land
        land_data = {
            "name": "North Field",
            "size": 25.5,
            "location": {"lat": 40.7128, "lng": -74.0060},
            "soil_type": "Loamy",
            "crops": ["corn", "soybeans"]
        }
        
        success, response, status_code = self.make_request("POST", "/lands", land_data, headers)
        if success and "id" in response:
            self.test_land_id = response["id"]
            self.log_result("land_management", "Create Land", True, f"Land ID: {response['id']}")
        else:
            self.log_result("land_management", "Create Land", False, f"Status: {status_code}, Response: {response}")

        # Test get lands
        success, response, status_code = self.make_request("GET", "/lands", headers=headers)
        if success and isinstance(response, list):
            self.log_result("land_management", "Get Lands", True, f"Retrieved {len(response)} lands")
        else:
            self.log_result("land_management", "Get Lands", False, f"Status: {status_code}, Response: {response}")

        # Test customer cannot access land management
        if self.customer_token:
            customer_headers = self.get_auth_headers("customer")
            success, response, status_code = self.make_request("GET", "/lands", headers=customer_headers)
            if not success and status_code == 403:
                self.log_result("land_management", "Customer Access Restriction", True, "Correctly denied access")
            else:
                self.log_result("land_management", "Customer Access Restriction", False, f"Should be denied but got: {status_code}")

    def test_ai_disease_detection(self):
        """Test AI disease detection with Gemini Vision API"""
        print("\n=== Testing AI Disease Detection ===")
        
        if not self.farmer_token:
            self.log_result("ai_disease_detection", "Disease Detection Tests", False, "No farmer token available")
            return

        headers = self.get_auth_headers("farmer")
        
        # Create sample image
        sample_image = self.create_sample_image_base64()
        
        # Test disease detection
        detection_data = {
            "image_base64": sample_image,
            "crop_name": "tomato",
            "land_id": self.test_land_id
        }
        
        success, response, status_code = self.make_request("POST", "/detect-disease", detection_data, headers)
        if success and "ai_diagnosis" in response:
            self.log_result("ai_disease_detection", "Disease Detection", True, f"Confidence: {response.get('confidence', 'N/A')}%")
        else:
            self.log_result("ai_disease_detection", "Disease Detection", False, f"Status: {status_code}, Response: {response}")

        # Test get disease reports
        success, response, status_code = self.make_request("GET", "/disease-reports", headers=headers)
        if success and isinstance(response, list):
            self.log_result("ai_disease_detection", "Get Disease Reports", True, f"Retrieved {len(response)} reports")
        else:
            self.log_result("ai_disease_detection", "Get Disease Reports", False, f"Status: {status_code}, Response: {response}")

        # Test customer cannot access disease detection
        if self.customer_token:
            customer_headers = self.get_auth_headers("customer")
            success, response, status_code = self.make_request("POST", "/detect-disease", detection_data, customer_headers)
            if not success and status_code == 403:
                self.log_result("ai_disease_detection", "Customer Access Restriction", True, "Correctly denied access")
            else:
                self.log_result("ai_disease_detection", "Customer Access Restriction", False, f"Should be denied but got: {status_code}")

    def test_ai_plant_planning(self):
        """Test AI-powered plant planning with Gemini API"""
        print("\n=== Testing AI Plant Planning ===")
        
        if not self.farmer_token or not self.test_land_id:
            self.log_result("ai_plant_planning", "Plant Planning Tests", False, "No farmer token or land ID available")
            return

        headers = self.get_auth_headers("farmer")
        
        # Test create plant plan
        plan_data = {
            "land_id": self.test_land_id,
            "season": "spring",
            "preferred_crops": ["tomatoes", "peppers", "lettuce"],
            "goals": "Maximize yield while maintaining soil health and implementing sustainable farming practices"
        }
        
        success, response, status_code = self.make_request("POST", "/plant-plan", plan_data, headers)
        if success and "ai_recommendations" in response:
            self.log_result("ai_plant_planning", "Create Plant Plan", True, f"Plan ID: {response.get('id', 'N/A')}")
        else:
            self.log_result("ai_plant_planning", "Create Plant Plan", False, f"Status: {status_code}, Response: {response}")

        # Test get plant plans
        success, response, status_code = self.make_request("GET", "/plant-plans", headers=headers)
        if success and isinstance(response, list):
            self.log_result("ai_plant_planning", "Get Plant Plans", True, f"Retrieved {len(response)} plans")
        else:
            self.log_result("ai_plant_planning", "Get Plant Plans", False, f"Status: {status_code}, Response: {response}")

        # Test customer cannot access plant planning
        if self.customer_token:
            customer_headers = self.get_auth_headers("customer")
            success, response, status_code = self.make_request("POST", "/plant-plan", plan_data, customer_headers)
            if not success and status_code == 403:
                self.log_result("ai_plant_planning", "Customer Access Restriction", True, "Correctly denied access")
            else:
                self.log_result("ai_plant_planning", "Customer Access Restriction", False, f"Should be denied but got: {status_code}")

    def test_product_marketplace(self):
        """Test marketplace CRUD operations and location-based discovery"""
        print("\n=== Testing Product Marketplace ===")
        
        if not self.farmer_token:
            self.log_result("product_marketplace", "Marketplace Tests", False, "No farmer token available")
            return

        farmer_headers = self.get_auth_headers("farmer")
        
        # Test create product (farmer)
        product_data = {
            "name": "Fresh Organic Tomatoes",
            "description": "Vine-ripened organic tomatoes grown without pesticides",
            "price": 4.99,
            "unit": "lb",
            "quantity": 100,
            "category": "vegetables",
            "image_base64": self.create_sample_image_base64(),
            "location": {"lat": 40.7128, "lng": -74.0060}
        }
        
        success, response, status_code = self.make_request("POST", "/products", product_data, farmer_headers)
        if success and "id" in response:
            self.test_product_id = response["id"]
            self.log_result("product_marketplace", "Create Product (Farmer)", True, f"Product ID: {response['id']}")
        else:
            self.log_result("product_marketplace", "Create Product (Farmer)", False, f"Status: {status_code}, Response: {response}")

        # Test get farmer's products
        success, response, status_code = self.make_request("GET", "/my-products", headers=farmer_headers)
        if success and isinstance(response, list):
            self.log_result("product_marketplace", "Get Farmer Products", True, f"Retrieved {len(response)} products")
        else:
            self.log_result("product_marketplace", "Get Farmer Products", False, f"Status: {status_code}, Response: {response}")

        # Test browse all products (no auth required)
        success, response, status_code = self.make_request("GET", "/products")
        if success and isinstance(response, list):
            self.log_result("product_marketplace", "Browse All Products", True, f"Retrieved {len(response)} products")
        else:
            self.log_result("product_marketplace", "Browse All Products", False, f"Status: {status_code}, Response: {response}")

        # Test location-based product discovery
        success, response, status_code = self.make_request("GET", "/products?lat=40.7128&lng=-74.0060&radius=50")
        if success and isinstance(response, list):
            self.log_result("product_marketplace", "Location-based Discovery", True, f"Found {len(response)} nearby products")
        else:
            self.log_result("product_marketplace", "Location-based Discovery", False, f"Status: {status_code}, Response: {response}")

        # Test get specific product
        if self.test_product_id:
            success, response, status_code = self.make_request("GET", f"/products/{self.test_product_id}")
            if success and "name" in response:
                self.log_result("product_marketplace", "Get Specific Product", True, f"Product: {response['name']}")
            else:
                self.log_result("product_marketplace", "Get Specific Product", False, f"Status: {status_code}, Response: {response}")

        # Test customer cannot create products
        if self.customer_token:
            customer_headers = self.get_auth_headers("customer")
            success, response, status_code = self.make_request("POST", "/products", product_data, customer_headers)
            if not success and status_code == 403:
                self.log_result("product_marketplace", "Customer Product Creation Restriction", True, "Correctly denied access")
            else:
                self.log_result("product_marketplace", "Customer Product Creation Restriction", False, f"Should be denied but got: {status_code}")

    def test_database_models(self):
        """Test database models and data persistence"""
        print("\n=== Testing Database Models ===")
        
        # Test that all created data persists and has proper UUID structure
        tests_passed = 0
        tests_total = 0
        
        # Check farmer user data
        if self.farmer_user and "id" in self.farmer_user:
            tests_total += 1
            if len(self.farmer_user["id"]) == 36:  # UUID format
                tests_passed += 1
                self.log_result("database_models", "Farmer User UUID", True, f"Valid UUID: {self.farmer_user['id'][:8]}...")
            else:
                self.log_result("database_models", "Farmer User UUID", False, f"Invalid UUID format: {self.farmer_user['id']}")

        # Check customer user data
        if self.customer_user and "id" in self.customer_user:
            tests_total += 1
            if len(self.customer_user["id"]) == 36:  # UUID format
                tests_passed += 1
                self.log_result("database_models", "Customer User UUID", True, f"Valid UUID: {self.customer_user['id'][:8]}...")
            else:
                self.log_result("database_models", "Customer User UUID", False, f"Invalid UUID format: {self.customer_user['id']}")

        # Check land data persistence
        if self.farmer_token and self.test_land_id:
            tests_total += 1
            headers = self.get_auth_headers("farmer")
            success, response, status_code = self.make_request("GET", "/lands", headers=headers)
            if success and isinstance(response, list) and len(response) > 0:
                land = response[0]
                if "id" in land and len(land["id"]) == 36:
                    tests_passed += 1
                    self.log_result("database_models", "Land Data Persistence", True, f"Land persisted with UUID: {land['id'][:8]}...")
                else:
                    self.log_result("database_models", "Land Data Persistence", False, "Land data missing or invalid UUID")
            else:
                self.log_result("database_models", "Land Data Persistence", False, "Could not retrieve land data")

        # Check product data persistence
        if self.farmer_token and self.test_product_id:
            tests_total += 1
            success, response, status_code = self.make_request("GET", f"/products/{self.test_product_id}")
            if success and "id" in response and len(response["id"]) == 36:
                tests_passed += 1
                self.log_result("database_models", "Product Data Persistence", True, f"Product persisted with UUID: {response['id'][:8]}...")
            else:
                self.log_result("database_models", "Product Data Persistence", False, "Product data missing or invalid UUID")

        # Overall database model test
        if tests_total > 0:
            success_rate = (tests_passed / tests_total) * 100
            if success_rate >= 80:
                self.log_result("database_models", "Overall Database Models", True, f"Success rate: {success_rate:.1f}%")
            else:
                self.log_result("database_models", "Overall Database Models", False, f"Success rate: {success_rate:.1f}%")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AgriVerse Backend API Tests")
        print(f"🌐 Testing against: {BASE_URL}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run tests in order
        self.test_user_authentication()
        self.test_land_management()
        self.test_ai_disease_detection()
        self.test_ai_plant_planning()
        self.test_product_marketplace()
        self.test_database_models()
        
        end_time = time.time()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅" if failed == 0 else "❌" if passed == 0 else "⚠️"
            print(f"{status} {category.replace('_', ' ').title()}: {passed} passed, {failed} failed")
            
            # Print details for failed tests
            if failed > 0:
                for detail in results["details"]:
                    if "❌ FAIL" in detail:
                        print(f"   {detail}")
        
        print("-" * 60)
        success_rate = (total_passed / (total_passed + total_failed)) * 100 if (total_passed + total_failed) > 0 else 0
        print(f"🎯 Overall: {total_passed} passed, {total_failed} failed ({success_rate:.1f}% success rate)")
        print(f"⏱️  Total time: {end_time - start_time:.2f} seconds")
        
        if total_failed == 0:
            print("🎉 All tests passed! Backend is working correctly.")
        elif success_rate >= 80:
            print("✅ Backend is mostly working with minor issues.")
        else:
            print("❌ Backend has significant issues that need attention.")
        
        return total_failed == 0

if __name__ == "__main__":
    tester = AgriVerseAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)