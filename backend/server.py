from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
from pymongo import MongoClient
import uuid
from datetime import datetime
import math

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['lords_mobile_ai']
battles_collection = db['battles']
strategies_collection = db['strategies']

app = FastAPI(title="Lords Mobile AI Assistant")

# CORS configuration - Secure settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs only
    allow_credentials=False,  # Disabled for security
    allow_methods=["GET", "POST", "OPTIONS"],  # Only required methods
    allow_headers=["Content-Type", "Authorization"],  # Specific headers only
)

# Security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# Data models
class UnitComposition(BaseModel):
    infantry: int = 0
    ranged: int = 0
    cavalry: int = 0
    siege: int = 0

class Hero(BaseModel):
    name: str = ""
    attack_bonus: float = 0.0
    defense_bonus: float = 0.0
    hp_bonus: float = 0.0
    army_attack: float = 0.0
    army_defense: float = 0.0
    army_hp: float = 0.0

class Army(BaseModel):
    composition: UnitComposition
    hero: Optional[Hero] = None
    research_attack: float = 0.0
    research_defense: float = 0.0
    research_hp: float = 0.0

class BattleRequest(BaseModel):
    player_army: Army
    enemy_army: Army
    scenario: str = "field_battle"

class BattleResult(BaseModel):
    battle_id: str
    win_probability: float
    expected_losses: UnitComposition
    enemy_losses: UnitComposition
    recommendation: str
    confidence_level: str
    details: Dict

# Unit stats (base values)
UNIT_STATS = {
    "infantry": {"attack": 100, "defense": 120, "hp": 800, "strong_vs": "ranged", "weak_vs": "cavalry"},
    "ranged": {"attack": 110, "defense": 80, "hp": 600, "strong_vs": "cavalry", "weak_vs": "infantry"},
    "cavalry": {"attack": 130, "defense": 90, "hp": 700, "strong_vs": "infantry", "weak_vs": "ranged"},
    "siege": {"attack": 200, "defense": 60, "hp": 500, "strong_vs": "wall", "weak_vs": "all"}
}

def calculate_effective_stats(composition: UnitComposition, hero: Optional[Hero], research_attack: float, research_defense: float, research_hp: float):
    """Calculate effective army stats with bonuses"""
    total_attack = 0
    total_defense = 0
    total_hp = 0
    
    for unit_type, count in composition.dict().items():
        if count > 0:
            base_stats = UNIT_STATS[unit_type]
            
            # Apply research bonuses
            attack = base_stats["attack"] * (1 + research_attack / 100)
            defense = base_stats["defense"] * (1 + research_defense / 100)
            hp = base_stats["hp"] * (1 + research_hp / 100)
            
            # Apply hero bonuses
            if hero:
                attack *= (1 + hero.army_attack / 100)
                defense *= (1 + hero.army_defense / 100)
                hp *= (1 + hero.army_hp / 100)
            
            total_attack += attack * count
            total_defense += defense * count
            total_hp += hp * count
    
    return {
        "total_attack": total_attack,
        "total_defense": total_defense,
        "total_hp": total_hp,
        "unit_count": sum(composition.dict().values())
    }

def calculate_type_advantage(player_comp: UnitComposition, enemy_comp: UnitComposition):
    """Calculate type advantage multiplier"""
    player_units = player_comp.dict()
    enemy_units = enemy_comp.dict()
    
    advantage_score = 0
    
    # Calculate advantage for each unit type
    for unit_type, count in player_units.items():
        if count > 0:
            strong_vs = UNIT_STATS[unit_type]["strong_vs"]
            if strong_vs in enemy_units:
                advantage_score += count * enemy_units[strong_vs] * 0.25
    
    total_player_units = sum(player_units.values())
    total_enemy_units = sum(enemy_units.values())
    
    if total_player_units > 0 and total_enemy_units > 0:
        return 1 + (advantage_score / (total_player_units * total_enemy_units))
    return 1.0

def simulate_battle(player_army: Army, enemy_army: Army):
    """Simulate battle outcome"""
    # Calculate effective stats
    player_stats = calculate_effective_stats(
        player_army.composition, 
        player_army.hero, 
        player_army.research_attack, 
        player_army.research_defense, 
        player_army.research_hp
    )
    
    enemy_stats = calculate_effective_stats(
        enemy_army.composition, 
        enemy_army.hero, 
        enemy_army.research_attack, 
        enemy_army.research_defense, 
        enemy_army.research_hp
    )
    
    # Calculate type advantages
    player_advantage = calculate_type_advantage(player_army.composition, enemy_army.composition)
    enemy_advantage = calculate_type_advantage(enemy_army.composition, player_army.composition)
    
    # Apply advantages
    effective_player_attack = player_stats["total_attack"] * player_advantage
    effective_enemy_attack = enemy_stats["total_attack"] * enemy_advantage
    
    # Calculate battle power
    player_power = effective_player_attack * player_stats["total_hp"] / 1000
    enemy_power = effective_enemy_attack * enemy_stats["total_hp"] / 1000
    
    # Calculate win probability
    total_power = player_power + enemy_power
    win_probability = player_power / total_power if total_power > 0 else 0.5
    
    # Calculate expected losses
    damage_to_player = (enemy_power / player_power) if player_power > 0 else 1
    damage_to_enemy = (player_power / enemy_power) if enemy_power > 0 else 1
    
    # Calculate unit losses proportionally
    player_loss_rate = min(damage_to_player * 0.3, 0.8)
    enemy_loss_rate = min(damage_to_enemy * 0.3, 0.8)
    
    if win_probability < 0.5:
        player_loss_rate = min(player_loss_rate * 1.5, 0.9)
    else:
        enemy_loss_rate = min(enemy_loss_rate * 1.5, 0.9)
    
    player_losses = UnitComposition(
        infantry=int(player_army.composition.infantry * player_loss_rate),
        ranged=int(player_army.composition.ranged * player_loss_rate),
        cavalry=int(player_army.composition.cavalry * player_loss_rate),
        siege=int(player_army.composition.siege * player_loss_rate)
    )
    
    enemy_losses = UnitComposition(
        infantry=int(enemy_army.composition.infantry * enemy_loss_rate),
        ranged=int(enemy_army.composition.ranged * enemy_loss_rate),
        cavalry=int(enemy_army.composition.cavalry * enemy_loss_rate),
        siege=int(enemy_army.composition.siege * enemy_loss_rate)
    )
    
    return {
        "win_probability": win_probability,
        "player_losses": player_losses,
        "enemy_losses": enemy_losses,
        "player_power": player_power,
        "enemy_power": enemy_power,
        "type_advantage": player_advantage - enemy_advantage
    }

def generate_recommendation(battle_result: Dict, player_army: Army, enemy_army: Army):
    """Generate strategic recommendation"""
    win_prob = battle_result["win_probability"]
    type_advantage = battle_result["type_advantage"]
    
    if win_prob >= 0.7:
        return "Strong victory expected! Proceed with confidence."
    elif win_prob >= 0.5:
        return "Favorable battle. Consider attacking if losses are acceptable."
    elif win_prob >= 0.3:
        recommendation = "Close battle. "
        if type_advantage < -0.1:
            recommendation += "Consider adjusting army composition for better type advantage."
        else:
            recommendation += "Consider adding more troops or improving hero/research bonuses."
        return recommendation
    else:
        recommendation = "High risk of defeat. "
        if type_advantage < -0.1:
            recommendation += "Your army composition is weak against enemy. "
            
            # Suggest specific changes
            enemy_comp = enemy_army.composition.dict()
            max_enemy_type = max(enemy_comp, key=enemy_comp.get)
            
            if max_enemy_type == "infantry":
                recommendation += "Add more cavalry to counter their infantry."
            elif max_enemy_type == "ranged":
                recommendation += "Add more infantry to counter their ranged."
            elif max_enemy_type == "cavalry":
                recommendation += "Add more ranged to counter their cavalry."
        else:
            recommendation += "Consider significantly increasing army size or improving bonuses."
        
        return recommendation

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Lords Mobile AI Assistant"}

@app.post("/api/battle/simulate", response_model=BattleResult)
async def simulate_battle_endpoint(battle_request: BattleRequest):
    """Simulate battle and provide strategic recommendation"""
    try:
        # Run battle simulation
        battle_result = simulate_battle(battle_request.player_army, battle_request.enemy_army)
        
        # Generate recommendation
        recommendation = generate_recommendation(
            battle_result, 
            battle_request.player_army, 
            battle_request.enemy_army
        )
        
        # Determine confidence level
        win_prob = battle_result["win_probability"]
        if win_prob >= 0.7 or win_prob <= 0.3:
            confidence = "High"
        elif win_prob >= 0.6 or win_prob <= 0.4:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        # Create battle result
        battle_id = str(uuid.uuid4())
        
        result = BattleResult(
            battle_id=battle_id,
            win_probability=round(win_prob, 3),
            expected_losses=battle_result["player_losses"],
            enemy_losses=battle_result["enemy_losses"],
            recommendation=recommendation,
            confidence_level=confidence,
            details={
                "player_power": round(battle_result["player_power"], 2),
                "enemy_power": round(battle_result["enemy_power"], 2),
                "type_advantage": round(battle_result["type_advantage"], 3)
            }
        )
        
        # Save to database
        battles_collection.insert_one({
            "battle_id": battle_id,
            "timestamp": datetime.now(),
            "player_army": battle_request.player_army.dict(),
            "enemy_army": battle_request.enemy_army.dict(),
            "result": result.dict(),
            "scenario": battle_request.scenario
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Battle simulation failed: {str(e)}")

@app.get("/api/battle/history")
async def get_battle_history(limit: int = 10):
    """Get recent battle simulations"""
    try:
        battles = list(battles_collection.find(
            {}, 
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit))
        
        return {"battles": battles}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve battle history: {str(e)}")

@app.get("/api/army/optimize")
async def optimize_army_composition(
    total_troops: int,
    enemy_infantry: int = 0,
    enemy_ranged: int = 0,
    enemy_cavalry: int = 0,
    enemy_siege: int = 0
):
    """Suggest optimal army composition against specific enemy"""
    try:
        enemy_comp = UnitComposition(
            infantry=enemy_infantry,
            ranged=enemy_ranged,
            cavalry=enemy_cavalry,
            siege=enemy_siege
        )
        
        # Calculate optimal composition based on enemy
        enemy_units = enemy_comp.dict()
        total_enemy = sum(enemy_units.values())
        
        if total_enemy == 0:
            # Balanced composition if no enemy info
            optimal_comp = UnitComposition(
                infantry=int(total_troops * 0.3),
                ranged=int(total_troops * 0.3),
                cavalry=int(total_troops * 0.3),
                siege=int(total_troops * 0.1)
            )
        else:
            # Counter-composition
            infantry_needed = int(enemy_ranged * 1.2)
            ranged_needed = int(enemy_cavalry * 1.2)
            cavalry_needed = int(enemy_infantry * 1.2)
            siege_needed = int(total_troops * 0.1)
            
            total_needed = infantry_needed + ranged_needed + cavalry_needed + siege_needed
            
            if total_needed > total_troops:
                # Scale down proportionally
                scale = total_troops / total_needed
                infantry_needed = int(infantry_needed * scale)
                ranged_needed = int(ranged_needed * scale)
                cavalry_needed = int(cavalry_needed * scale)
                siege_needed = int(siege_needed * scale)
            
            # Fill remaining with balanced units
            remaining = total_troops - (infantry_needed + ranged_needed + cavalry_needed + siege_needed)
            if remaining > 0:
                infantry_needed += remaining // 3
                ranged_needed += remaining // 3
                cavalry_needed += remaining - (2 * (remaining // 3))
            
            optimal_comp = UnitComposition(
                infantry=infantry_needed,
                ranged=ranged_needed,
                cavalry=cavalry_needed,
                siege=siege_needed
            )
        
        return {
            "optimal_composition": optimal_comp.dict(),
            "reasoning": f"Optimized for {total_troops} troops against the given enemy composition",
            "type_advantages": {
                "infantry_counters": enemy_ranged,
                "ranged_counters": enemy_cavalry,
                "cavalry_counters": enemy_infantry
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Army optimization failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Bind to localhost only for security
    uvicorn.run(app, host="127.0.0.1", port=8001)
