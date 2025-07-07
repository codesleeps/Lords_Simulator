import requests
import json
import sys
from datetime import datetime

class LordsMobileAPITester:
    def __init__(self, base_url="https://f5ac0ce4-182d-4c11-945a-82d91004d6b9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"Health check response: {response}")
        return success

    def test_battle_simulation(self):
        """Test battle simulation endpoint"""
        test_data = {
            "player_army": {
                "composition": {"infantry": 1000, "ranged": 800, "cavalry": 600, "siege": 200},
                "hero": {"name": "Test Hero", "army_attack": 15, "army_defense": 10, "army_hp": 8},
                "research_attack": 25,
                "research_defense": 20,
                "research_hp": 15
            },
            "enemy_army": {
                "composition": {"infantry": 900, "ranged": 700, "cavalry": 500, "siege": 100},
                "hero": {"name": "Enemy Hero", "army_attack": 12, "army_defense": 8, "army_hp": 5},
                "research_attack": 20,
                "research_defense": 15,
                "research_hp": 10
            }
        }
        
        success, response = self.run_test(
            "Battle Simulation",
            "POST",
            "api/battle/simulate",
            200,
            data=test_data
        )
        
        if success:
            print("\nBattle Simulation Results:")
            print(f"Win Probability: {response.get('win_probability', 'N/A')}")
            print(f"Confidence Level: {response.get('confidence_level', 'N/A')}")
            print(f"Recommendation: {response.get('recommendation', 'N/A')}")
            
            # Check if expected fields are present
            required_fields = ['battle_id', 'win_probability', 'expected_losses', 
                              'enemy_losses', 'recommendation', 'confidence_level', 'details']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ Missing fields in response: {missing_fields}")
                return False
            
            return True
        return False

    def test_army_optimization(self):
        """Test army optimization endpoint"""
        params = {
            "total_troops": 2000,
            "enemy_infantry": 900,
            "enemy_ranged": 700,
            "enemy_cavalry": 500,
            "enemy_siege": 100
        }
        
        success, response = self.run_test(
            "Army Optimization",
            "GET",
            "api/army/optimize",
            200,
            params=params
        )
        
        if success:
            print("\nArmy Optimization Results:")
            if 'optimal_composition' in response:
                print("Optimal Composition:")
                for unit, count in response['optimal_composition'].items():
                    print(f"  {unit}: {count}")
            else:
                print("❌ Missing 'optimal_composition' in response")
                return False
                
            if 'reasoning' in response:
                print(f"Reasoning: {response['reasoning']}")
            else:
                print("❌ Missing 'reasoning' in response")
                return False
                
            return True
        return False

    def test_battle_history(self):
        """Test battle history endpoint"""
        success, response = self.run_test(
            "Battle History",
            "GET",
            "api/battle/history",
            200
        )
        
        if success:
            if 'battles' in response:
                battles = response['battles']
                print(f"\nRetrieved {len(battles)} battle(s) from history")
                if battles:
                    print("First battle details:")
                    print(f"  Timestamp: {battles[0].get('timestamp', 'N/A')}")
                    print(f"  Win Probability: {battles[0].get('result', {}).get('win_probability', 'N/A')}")
                return True
            else:
                print("❌ Missing 'battles' in response")
                return False
        return False

def main():
    # Setup
    tester = LordsMobileAPITester()
    
    # Run tests
    health_check_passed = tester.test_health_check()
    battle_sim_passed = tester.test_battle_simulation()
    army_opt_passed = tester.test_army_optimization()
    battle_history_passed = tester.test_battle_history()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Summary
    print("\n📋 Test Summary:")
    print(f"Health Check: {'✅ Passed' if health_check_passed else '❌ Failed'}")
    print(f"Battle Simulation: {'✅ Passed' if battle_sim_passed else '❌ Failed'}")
    print(f"Army Optimization: {'✅ Passed' if army_opt_passed else '❌ Failed'}")
    print(f"Battle History: {'✅ Passed' if battle_history_passed else '❌ Failed'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())