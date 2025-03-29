import React, { useState, useEffect } from 'react';
import { Heart, Filter, ChevronDown, Info } from 'lucide-react';
import { Button } from './ui/button';

const FoodMatches = () => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('match');

  // Fetch matches from the API
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:5000/api/matches');
        const data = await response.json();
        
        if (data.success) {
          setMatches(data.matches);
          if (data.message) {
            console.log(data.message); // Informational message
          }
        } else {
          setError(data.error || 'Failed to fetch food matches');
        }
      } catch (err) {
        setError('Network error: Could not connect to the server');
        console.error('Error fetching matches:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, []);

  // Filter the matches based on the active filter
  const filteredMatches = matches.filter(match => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'healthy' && match.health_score >= 7) return true;
    if (activeFilter === 'highProtein' && match.protein >= 25) return true;
    if (activeFilter === 'lowCalorie' && match.calories < 500) return true;
    return false;
  });
  
  // Sort the filtered matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'match') {
      // If we have match_score, use it; otherwise use default order
      if ('match_score' in a && 'match_score' in b) {
        return b.match_score - a.match_score;
      }
      return 0;
    }
    if (sortBy === 'healthScore') {
      return b.health_score - a.health_score;
    }
    if (sortBy === 'calories') {
      return a.calories - b.calories;
    }
    if (sortBy === 'protein') {
      return b.protein - a.protein;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/50 rounded-full animate-spin mx-auto"></div>
          <p>Loading your food matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-destructive/10 text-destructive p-6 rounded-lg text-center">
        <p className="font-medium">Error loading matches</p>
        <p className="text-sm mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Food Matches</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 border-none focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="match">Sort by Match</option>
            <option value="healthScore">Sort by Health Score</option>
            <option value="calories">Sort by Calories (Low to High)</option>
            <option value="protein">Sort by Protein (High to Low)</option>
          </select>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveFilter('healthy')}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === 'healthy'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Healthiest Options
            </button>
            <button
              onClick={() => setActiveFilter('highProtein')}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === 'highProtein'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              High Protein
            </button>
            <button
              onClick={() => setActiveFilter('lowCalorie')}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === 'lowCalorie'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Low Calorie
            </button>
          </div>
        </div>
      )}
      
      {/* Matches Display */}
      {sortedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMatches.map((match) => (
            <div
              key={match.id || `${match.restaurant}_${match.item_name}`}
              className="bg-card rounded-lg border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{match.item_name}</h3>
                    <p className="text-muted-foreground text-sm">{match.restaurant}</p>
                  </div>
                  {match.match_score && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{match.match_score}% Match</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Calories</p>
                    <p className="font-semibold">{match.calories}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Protein</p>
                    <p className="font-semibold">{match.protein}g</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                    <p className="font-semibold">{match.carbs}g</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Fat</p>
                    <p className="font-semibold">{match.fat}g</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    match.health_score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                    match.health_score >= 5 ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    Health Score: {match.health_score.toFixed(1)}
                  </div>
                  
                  <button 
                    className="text-primary hover:text-primary/80 transition-colors"
                    title={match.reasoning || "Nutritional Analysis"}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No matches found with the current filters.</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="mt-2 text-primary hover:text-primary/80 transition-colors"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodMatches;