export const initialUserDataModel = {
  profiles: [
    {
      name: "Balanced Eater",
      description: "A balanced mix of cuisines with moderate spice and price preferences",
      preferences: {
        favoriteCuisines: ['American', 'Mexican', 'Italian'],
        dietaryRestrictions: [],
        spiceLevel: 'medium',
        priceRange: 'medium',
        healthConsciousness: 'medium'
      }
    },
    {
      name: "Health Enthusiast",
      description: "Focused on nutritious options with high protein and lower calories",
      preferences: {
        favoriteCuisines: ['Mediterranean', 'Japanese', 'Thai'],
        dietaryRestrictions: ['low-carb'],
        spiceLevel: 'medium',
        priceRange: 'high',
        healthConsciousness: 'high'
      }
    },
    {
      name: "Spice Lover",
      description: "Enjoys bold flavors and spicy dishes from various cuisines",
      preferences: {
        favoriteCuisines: ['Indian', 'Mexican', 'Thai'],
        dietaryRestrictions: [],
        spiceLevel: 'high',
        priceRange: 'medium',
        healthConsciousness: 'medium'
      }
    },
    {
      name: "Budget Foodie",
      description: "Great value meals without compromising on taste",
      preferences: {
        favoriteCuisines: ['American', 'Chinese', 'Mexican'],
        dietaryRestrictions: [],
        spiceLevel: 'low',
        priceRange: 'low',
        healthConsciousness: 'medium'
      }
    }
  ],
  currentProfileIndex: 0,
  history: {
    recentOrders: [],
    favorites: [],
    ratings: {}
  }
};
