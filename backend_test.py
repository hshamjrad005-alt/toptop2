#!/usr/bin/env python3
"""
Backend API Testing for Arabic Gaming Store 2025
Tests all public and admin endpoints
"""

import requests
import sys
import json
from datetime import datetime
import hashlib

class GamingStoreAPITester:
    def __init__(self, base_url="https://fef7d33e-5102-43ff-a8a8-486a0ff9b4f2.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {"games": [], "news": [], "banners": []}

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def run_api_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        details += f", Response keys: {list(response_data.keys())}"
                except:
                    details += ", Response: Non-JSON"
            
            return self.log_test(name, success, details), response

        except Exception as e:
            return self.log_test(name, False, f"Error: {str(e)}"), None

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_api_test("Root Endpoint", "GET", "", 200)
        return success

    def test_public_endpoints(self):
        """Test all public endpoints"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test games endpoint
        success, response = self.run_api_test("Get Games", "GET", "api/games", 200)
        if success and response:
            try:
                data = response.json()
                games = data.get('games', [])
                print(f"   📊 Found {len(games)} games")
                if games:
                    print(f"   🎮 Sample game: {games[0].get('name_ar', 'N/A')}")
            except:
                pass

        # Test news endpoint
        success, response = self.run_api_test("Get News", "GET", "api/news", 200)
        if success and response:
            try:
                data = response.json()
                news = data.get('news', [])
                print(f"   📰 Found {len(news)} news items")
            except:
                pass

        # Test banners endpoint
        success, response = self.run_api_test("Get Banners", "GET", "api/banners", 200)
        if success and response:
            try:
                data = response.json()
                banners = data.get('banners', [])
                print(f"   🖼️ Found {len(banners)} banners")
            except:
                pass

        return True

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test with correct credentials
        login_data = {"username": "admin", "password": "xliunx"}
        success, response = self.run_api_test("Admin Login (Valid)", "POST", "api/admin/login", 200, login_data)
        
        if success and response:
            try:
                data = response.json()
                self.admin_token = data.get('token')
                print(f"   🔑 Admin token obtained: {self.admin_token[:20]}...")
            except:
                success = False

        # Test with invalid credentials
        invalid_login = {"username": "admin", "password": "wrong"}
        self.run_api_test("Admin Login (Invalid)", "POST", "api/admin/login", 401, invalid_login)
        
        return success

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        if not self.admin_token:
            print("❌ No admin token available, skipping admin tests")
            return False

        print("\n🛠️ Testing Admin Endpoints...")
        
        auth_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test admin games endpoint
        success, response = self.run_api_test("Admin Get Games", "GET", "api/admin/games", 200, headers=auth_headers)
        if success and response:
            try:
                data = response.json()
                games = data.get('games', [])
                print(f"   🎮 Admin view: {len(games)} games")
            except:
                pass

        # Test admin news endpoint
        self.run_api_test("Admin Get News", "GET", "api/admin/news", 200, headers=auth_headers)
        
        # Test admin banners endpoint
        self.run_api_test("Admin Get Banners", "GET", "api/admin/banners", 200, headers=auth_headers)
        
        # Test admin orders endpoint
        self.run_api_test("Admin Get Orders", "GET", "api/admin/orders", 200, headers=auth_headers)

        return True

    def test_order_creation(self):
        """Test order creation"""
        print("\n🛒 Testing Order Creation...")
        
        # First get a game to create order for
        success, response = self.run_api_test("Get Games for Order", "GET", "api/games", 200)
        if not success or not response:
            return False

        try:
            data = response.json()
            games = data.get('games', [])
            if not games:
                print("❌ No games available for order testing")
                return False

            game = games[0]
            if not game.get('prices'):
                print("❌ No prices available for order testing")
                return False

            price_package = game['prices'][0]
            
            # Create test order
            order_data = {
                "game_id": game['id'],
                "game_name": game['name_ar'],
                "player_id": "test_player_123",
                "amount": price_package['amount'],
                "price": price_package['price'],
                "currency": price_package['currency'],
                "customer_name": "أحمد محمد",
                "customer_phone": "+967777123456",
                "customer_email": "test@example.com"
            }
            
            success, response = self.run_api_test("Create Order", "POST", "api/orders", 200, order_data)
            
            if success and response:
                try:
                    result = response.json()
                    if result.get('success') and result.get('whatsapp_url'):
                        print(f"   📱 WhatsApp URL generated successfully")
                        print(f"   🆔 Order ID: {result.get('order_id', 'N/A')}")
                        # Verify WhatsApp URL contains expected phone number
                        if "967777826667" in result['whatsapp_url']:
                            print("   ✅ WhatsApp URL contains correct phone number")
                        else:
                            print("   ⚠️ WhatsApp URL phone number mismatch")
                    else:
                        success = False
                except:
                    success = False
            
            return success

        except Exception as e:
            print(f"❌ Order creation test failed: {str(e)}")
            return False

    def test_admin_crud_operations(self):
        """Test admin CRUD operations"""
        if not self.admin_token:
            print("❌ No admin token available, skipping CRUD tests")
            return False

        print("\n🔧 Testing Admin CRUD Operations...")
        
        auth_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test creating a news item
        news_data = {
            "title": "Test News",
            "title_ar": "خبر تجريبي",
            "content": "Test content",
            "content_ar": "محتوى تجريبي",
            "is_active": True
        }
        
        success, response = self.run_api_test("Create News Item", "POST", "api/admin/news", 200, news_data, auth_headers)
        
        if success and response:
            try:
                result = response.json()
                news_id = result.get('id')
                if news_id:
                    self.created_items['news'].append(news_id)
                    print(f"   📰 Created news item: {news_id}")
                    
                    # Test updating the news item
                    updated_news = news_data.copy()
                    updated_news['title_ar'] = "خبر تجريبي محدث"
                    
                    self.run_api_test("Update News Item", "PUT", f"api/admin/news/{news_id}", 200, updated_news, auth_headers)
                    
                    # Test deleting the news item
                    self.run_api_test("Delete News Item", "DELETE", f"api/admin/news/{news_id}", 200, headers=auth_headers)
                    
            except:
                pass

        return True

    def test_unauthorized_access(self):
        """Test unauthorized access to admin endpoints"""
        print("\n🚫 Testing Unauthorized Access...")
        
        # Test admin endpoints without token
        self.run_api_test("Admin Games (No Auth)", "GET", "api/admin/games", 401)
        self.run_api_test("Admin News (No Auth)", "GET", "api/admin/news", 401)
        
        # Test with invalid token
        invalid_headers = {'Authorization': 'Bearer invalid_token'}
        self.run_api_test("Admin Games (Invalid Token)", "GET", "api/admin/games", 401, headers=invalid_headers)
        
        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Arabic Gaming Store API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Run test suites
        self.test_root_endpoint()
        self.test_public_endpoints()
        self.test_admin_login()
        self.test_admin_endpoints()
        self.test_order_creation()
        self.test_admin_crud_operations()
        self.test_unauthorized_access()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = GamingStoreAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())