import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('battle');
  const [battleResult, setBattleResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  const [optimizedArmy, setOptimizedArmy] = useState(null);

  // Player army state
  const [playerArmy, setPlayerArmy] = useState({
    composition: {
      infantry: 0,
      ranged: 0,
      cavalry: 0,
      siege: 0
    },
    hero: {
      name: '',
      attack_bonus: 0,
      defense_bonus: 0,
      hp_bonus: 0,
      army_attack: 0,
      army_defense: 0,
      army_hp: 0
    },
    research_attack: 0,
    research_defense: 0,
    research_hp: 0
  });

  // Enemy army state
  const [enemyArmy, setEnemyArmy] = useState({
    composition: {
      infantry: 0,
      ranged: 0,
      cavalry: 0,
      siege: 0
    },
    hero: {
      name: '',
      attack_bonus: 0,
      defense_bonus: 0,
      hp_bonus: 0,
      army_attack: 0,
      army_defense: 0,
      army_hp: 0
    },
    research_attack: 0,
    research_defense: 0,
    research_hp: 0
  });

  // Army optimizer state
  const [optimizerData, setOptimizerData] = useState({
    total_troops: 0,
    enemy_infantry: 0,
    enemy_ranged: 0,
    enemy_cavalry: 0,
    enemy_siege: 0
  });

  useEffect(() => {
    fetchBattleHistory();
  }, []);

  const fetchBattleHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/battle/history?limit=5`);
      const data = await response.json();
      setBattleHistory(data.battles || []);
    } catch (error) {
      console.error('Failed to fetch battle history:', error);
    }
  };

  const simulateBattle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/battle/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_army: playerArmy,
          enemy_army: enemyArmy,
          scenario: 'field_battle'
        })
      });

      if (!response.ok) {
        throw new Error('Battle simulation failed');
      }

      const result = await response.json();
      setBattleResult(result);
      fetchBattleHistory();
    } catch (error) {
      console.error('Battle simulation error:', error);
      alert('Failed to simulate battle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeArmy = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams(optimizerData).toString();
      const response = await fetch(`${BACKEND_URL}/api/army/optimize?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Army optimization failed');
      }

      const result = await response.json();
      setOptimizedArmy(result);
    } catch (error) {
      console.error('Army optimization error:', error);
      alert('Failed to optimize army. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayerComposition = (unit, value) => {
    setPlayerArmy(prev => ({
      ...prev,
      composition: {
        ...prev.composition,
        [unit]: parseInt(value) || 0
      }
    }));
  };

  const updateEnemyComposition = (unit, value) => {
    setEnemyArmy(prev => ({
      ...prev,
      composition: {
        ...prev.composition,
        [unit]: parseInt(value) || 0
      }
    }));
  };

  const updatePlayerHero = (field, value) => {
    setPlayerArmy(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: field === 'name' ? value : (parseFloat(value) || 0)
      }
    }));
  };

  const updateEnemyHero = (field, value) => {
    setEnemyArmy(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: field === 'name' ? value : (parseFloat(value) || 0)
      }
    }));
  };

  const updatePlayerResearch = (field, value) => {
    setPlayerArmy(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const updateEnemyResearch = (field, value) => {
    setEnemyArmy(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const getWinProbabilityColor = (probability) => {
    if (probability >= 0.7) return 'text-green-600';
    if (probability >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'High') return 'text-green-600';
    if (confidence === 'Medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Lords Mobile AI
            </span>
          </h1>
          <p className="text-xl text-gray-300">Your Strategic Combat Assistant</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-1">
            <div className="flex space-x-2">
              {['battle', 'optimize', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {tab === 'battle' && 'Battle Simulator'}
                  {tab === 'optimize' && 'Army Optimizer'}
                  {tab === 'history' && 'Battle History'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Battle Simulator Tab */}
        {activeTab === 'battle' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Player Army */}
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                <h2 className="text-2xl font-bold text-white mb-4">Your Army</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-300">Troop Composition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(playerArmy.composition).map((unit) => (
                      <div key={unit}>
                        <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                          {unit}
                        </label>
                        <input
                          type="number"
                          value={playerArmy.composition[unit]}
                          onChange={(e) => updatePlayerComposition(unit, e.target.value)}
                          className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-300 mt-6">Hero Bonuses (%)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Hero Name</label>
                      <input
                        type="text"
                        value={playerArmy.hero.name}
                        onChange={(e) => updatePlayerHero('name', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Hero name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army Attack</label>
                      <input
                        type="number"
                        value={playerArmy.hero.army_attack}
                        onChange={(e) => updatePlayerHero('army_attack', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army Defense</label>
                      <input
                        type="number"
                        value={playerArmy.hero.army_defense}
                        onChange={(e) => updatePlayerHero('army_defense', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army HP</label>
                      <input
                        type="number"
                        value={playerArmy.hero.army_hp}
                        onChange={(e) => updatePlayerHero('army_hp', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-300 mt-6">Research Bonuses (%)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Attack</label>
                      <input
                        type="number"
                        value={playerArmy.research_attack}
                        onChange={(e) => updatePlayerResearch('research_attack', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Defense</label>
                      <input
                        type="number"
                        value={playerArmy.research_defense}
                        onChange={(e) => updatePlayerResearch('research_defense', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">HP</label>
                      <input
                        type="number"
                        value={playerArmy.research_hp}
                        onChange={(e) => updatePlayerResearch('research_hp', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enemy Army */}
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                <h2 className="text-2xl font-bold text-white mb-4">Enemy Army</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-300">Troop Composition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(enemyArmy.composition).map((unit) => (
                      <div key={unit}>
                        <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                          {unit}
                        </label>
                        <input
                          type="number"
                          value={enemyArmy.composition[unit]}
                          onChange={(e) => updateEnemyComposition(unit, e.target.value)}
                          className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-300 mt-6">Hero Bonuses (%)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Hero Name</label>
                      <input
                        type="text"
                        value={enemyArmy.hero.name}
                        onChange={(e) => updateEnemyHero('name', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Hero name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army Attack</label>
                      <input
                        type="number"
                        value={enemyArmy.hero.army_attack}
                        onChange={(e) => updateEnemyHero('army_attack', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army Defense</label>
                      <input
                        type="number"
                        value={enemyArmy.hero.army_defense}
                        onChange={(e) => updateEnemyHero('army_defense', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Army HP</label>
                      <input
                        type="number"
                        value={enemyArmy.hero.army_hp}
                        onChange={(e) => updateEnemyHero('army_hp', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-300 mt-6">Research Bonuses (%)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Attack</label>
                      <input
                        type="number"
                        value={enemyArmy.research_attack}
                        onChange={(e) => updateEnemyResearch('research_attack', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Defense</label>
                      <input
                        type="number"
                        value={enemyArmy.research_defense}
                        onChange={(e) => updateEnemyResearch('research_defense', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">HP</label>
                      <input
                        type="number"
                        value={enemyArmy.research_hp}
                        onChange={(e) => updateEnemyResearch('research_hp', e.target.value)}
                        className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulate Button */}
            <div className="text-center">
              <button
                onClick={simulateBattle}
                disabled={isLoading}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Simulating Battle...' : 'Simulate Battle'}
              </button>
            </div>

            {/* Battle Results */}
            {battleResult && (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                <h2 className="text-2xl font-bold text-white mb-4">Battle Results</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Win Probability</h3>
                    <div className={`text-3xl font-bold ${getWinProbabilityColor(battleResult.win_probability)}`}>
                      {(battleResult.win_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Confidence Level</h3>
                    <div className={`text-2xl font-bold ${getConfidenceColor(battleResult.confidence_level)}`}>
                      {battleResult.confidence_level}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Battle Power</h3>
                    <div className="text-lg text-white">
                      <div>You: {battleResult.details.player_power}</div>
                      <div>Enemy: {battleResult.details.enemy_power}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-600 bg-opacity-30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Strategic Recommendation</h3>
                  <p className="text-gray-200">{battleResult.recommendation}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Expected Losses</h3>
                    <div className="space-y-2">
                      {Object.entries(battleResult.expected_losses).map(([unit, count]) => (
                        <div key={unit} className="flex justify-between text-white">
                          <span className="capitalize">{unit}:</span>
                          <span className="text-red-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Enemy Expected Losses</h3>
                    <div className="space-y-2">
                      {Object.entries(battleResult.enemy_losses).map(([unit, count]) => (
                        <div key={unit} className="flex justify-between text-white">
                          <span className="capitalize">{unit}:</span>
                          <span className="text-green-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Army Optimizer Tab */}
        {activeTab === 'optimize' && (
          <div className="space-y-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
              <h2 className="text-2xl font-bold text-white mb-4">Army Optimizer</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Troops Available</label>
                  <input
                    type="number"
                    value={optimizerData.total_troops}
                    onChange={(e) => setOptimizerData(prev => ({ ...prev, total_troops: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Enter total troops"
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-300">Enemy Composition (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['enemy_infantry', 'enemy_ranged', 'enemy_cavalry', 'enemy_siege'].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                          {field.replace('enemy_', '')}
                        </label>
                        <input
                          type="number"
                          value={optimizerData[field]}
                          onChange={(e) => setOptimizerData(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
                          className="w-full p-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={optimizeArmy}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Optimizing...' : 'Optimize Army'}
                </button>
              </div>
            </div>

            {/* Optimization Results */}
            {optimizedArmy && (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                <h2 className="text-2xl font-bold text-white mb-4">Optimized Army Composition</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(optimizedArmy.optimal_composition).map(([unit, count]) => (
                    <div key={unit} className="text-center p-4 bg-blue-600 bg-opacity-30 rounded-lg">
                      <div className="text-lg font-semibold text-gray-300 capitalize">{unit}</div>
                      <div className="text-2xl font-bold text-white">{count}</div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-green-600 bg-opacity-30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Reasoning</h3>
                  <p className="text-gray-200">{optimizedArmy.reasoning}</p>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-600 bg-opacity-30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Type Advantages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-200">
                    <div>Infantry counters: {optimizedArmy.type_advantages.infantry_counters} ranged</div>
                    <div>Ranged counters: {optimizedArmy.type_advantages.ranged_counters} cavalry</div>
                    <div>Cavalry counters: {optimizedArmy.type_advantages.cavalry_counters} infantry</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Battle History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
              <h2 className="text-2xl font-bold text-white mb-4">Recent Battle Simulations</h2>
              
              {battleHistory.length === 0 ? (
                <p className="text-gray-300 text-center py-8">No battle simulations yet. Run some battle simulations to see history here.</p>
              ) : (
                <div className="space-y-4">
                  {battleHistory.map((battle, index) => (
                    <div key={index} className="p-4 bg-blue-600 bg-opacity-20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-300">
                          {new Date(battle.timestamp).toLocaleString()}
                        </div>
                        <div className={`font-bold ${getWinProbabilityColor(battle.result.win_probability)}`}>
                          {(battle.result.win_probability * 100).toFixed(1)}% Win
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-300 mb-1">Your Army:</div>
                          <div className="text-white">
                            {Object.entries(battle.player_army.composition).map(([unit, count]) => (
                              <span key={unit} className="mr-3 capitalize">{unit}: {count}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-300 mb-1">Enemy Army:</div>
                          <div className="text-white">
                            {Object.entries(battle.enemy_army.composition).map(([unit, count]) => (
                              <span key={unit} className="mr-3 capitalize">{unit}: {count}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-200">
                        <strong>Recommendation:</strong> {battle.result.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;