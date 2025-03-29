import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

const FoodRecommendations = () => {
  const [hunger, setHunger] = useState('medium');
  const [health, setHealth] = useState('medium');
  const [restaurant, setRestaurant] = useState('any');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  // Fetch list of available restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/restaurants');
        const data = await response.json();
        
        if (data.success) {
          setRestaurants(data.restaurants);
        } else {
          console.error('Failed to fetch restaurants:', data.error);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      }
    };
    
    fetchRestaurants();
  }, []);

  // Get recommendations based on filters
  const getRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hunger,
          health,
          restaurant,
          count: 6, // Number of recommendations to fetch
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError('Network error: Could not connect to the server');
      console.error('Error getting recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Filter Options</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">I am feeling:</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={hunger}
                  onChange={(e) => setHunger(e.target.value)}
                >
                  <option value="all">Any hunger level</option>
                  <option value="low">Not very hungry</option>
                  <option value="medium">Moderately hungry</option>
                  <option value="high">Very hungry</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Health preference:</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={health}
                  onChange={(e) => setHealth(e.target.value)}
                >
                  <option value="all">Any health level</option>
                  <option value="high">Healthier options</option>
                  <option value="medium">Balanced options</option>
                  <option value="low">Indulgent options</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Restaurant:</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                >
                  <option value="any">Any restaurant</option>
                  {restaurants.map((rest) => (
                    <option key={rest} value={rest}>{rest}</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                onClick={getRecommendations}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Get Recommendations'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Food Recommendations</h2>
            <p className="text-muted-foreground">Select your filters and click "Get Recommendations" to see suggestions based on your criteria.</p>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                <p>{error}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="bg-muted/30 border border-border rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/50 rounded-full animate-spin mx-auto"></div>
                  <p>Finding the perfect foods for you...</p>
                </div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((item, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-lg border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.item_name}</h3>
                        <p className="text-muted-foreground text-sm">{item.restaurant}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Calories</p>
                          <p className="font-semibold">{item.calories}</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Protein</p>
                          <p className="font-semibold">{item.protein}g</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                          <p className="font-semibold">{item.carbs}g</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Fat</p>
                          <p className="font-semibold">{item.fat}g</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.health_score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                          item.health_score >= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          Health Score: {item.health_score.toFixed(1)}
                        </div>
                        
                        <div className="group relative">
                          <button 
                            className="text-primary hover:text-primary/80 transition-colors"
                            aria-label="Nutritional Information"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all absolute bottom-full right-0 mb-2 w-56 bg-popover text-popover-foreground text-xs rounded-md shadow-md p-2 z-10">
                            <p className="font-medium mb-1">Nutritional Analysis:</p>
                            <p>{item.reasoning || "No nutritional analysis available"}</p>
                          </div>
                        </div>
                      </div>
                      
                      {item.description && (
                        <div className="pt-2 border-t border-border text-sm text-muted-foreground">
                          <p>{item.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground text-center">
                  {restaurant !== 'any' 
                    ? `No recommendations found for ${restaurant} with the selected filters. Try adjusting your filters or selecting a different restaurant.`
                    : "Use the filters to get food recommendations"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodRecommendations;