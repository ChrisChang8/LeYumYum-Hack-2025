import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css';
import './globals.css';
import { Button } from './components/ui/button';
import { Bot, X, Settings, Sparkles, ChevronLeft, ChevronRight, Check, Pizza, Sandwich, Coffee, IceCream, Beef, Apple, ArrowRight, Menu, Search, ShoppingCart, User, MoreVertical, Heart } from 'lucide-react';
import logo from './assets/tacoCrown.png';
import { initialUserDataModel } from './data/userDataModel';
import TestModal from './components/TestModal';
import PreferenceTestController from './components/PreferenceTestController';
import FoodMatches from './components/FoodMatches';

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [originalRecommendations, setOriginalRecommendations] = useState([]); // Add this line
  const [visibleItems, setVisibleItems] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([
    "Arby's",
    "Buffalo Wild Wings",
    "Burger King",
    "Chick Fil A",
    "Dairy Queen",
    "Firehouse Subs",
    "In-N-Out",
    "Jack in the Box",
    "KFC",
    "McDonald's",
    "Panera Bread",
    "Pizza Hut",
    "Popeyes",
    "Raising Cane's Chicken Fingers",
    "Sonic",
    "Steak 'N Shake",
    "Taco Bell",
    "Wendy's",
    "Whataburger"
  ]);
  const [selectedRestaurants, setSelectedRestaurants] = useState(restaurants);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filters, setFilters] = useState({
    hunger: ['all'],
    health: ['all'],
    restaurants: [
      // "Arby's",
      // "Buffalo Wild Wings",
      // "Burger King",
      // "Chick Fil A",
      // "Dairy Queen",
      // "Firehouse Subs",
      // "In-N-Out",
      // "Jack in the Box",
      // "KFC",
      // "McDonald's",
      // "Panera Bread",
      // "Pizza Hut",
      // "Popeyes",
      // "Raising Cane's Chicken Fingers",
      // "Sonic",
      // "Steak 'N Shake",
      // "Taco Bell",
      // "Wendy's",
      // "Whataburger"
    ],
    count: [999],
    profile: ['0']  
  });
  const [sortConfig, setSortConfig] = useState({
    activeKeys: [],
    directions: {}
  });
  const [filterMode, setFilterMode] = useState('custom'); // 'custom' or 'ai'
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userDataModel, setUserDataModel] = useState(initialUserDataModel);
  const [showUserDataDropdown, setShowUserDataDropdown] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testCards, setTestCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeResults, setSwipeResults] = useState([]);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isProcessingResults, setIsProcessingResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLaunchPage, setShowLaunchPage] = useState(true);
  const [showOptionsPage, setShowOptionsPage] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadMoreRef = useRef(null);
  const [showMatches, setShowMatches] = useState(false);
  const [preferenceTestCompleted, setPreferenceTestCompleted] = useState(false);
  const [matchedFoods, setMatchedFoods] = useState([]);
  const [proteinTypes, setProteinTypes] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [selectedProteinType, setSelectedProteinType] = useState('any');
  const [selectedFoodType, setSelectedFoodType] = useState('any');

  const getFoodRecommendation = useCallback(async () => {
    if (!filters.hunger.length || !filters.health.length || !filters.count.length) {
      setError('Please select all filter options before getting recommendations');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (filterMode === 'ai' && preferenceTestCompleted) {
        const response = await fetch('http://localhost:5000/api/matches');
        const data = await response.json();
        
        if (data.success) {
          setOriginalRecommendations(data.matches);
          setRecommendations(data.matches);
          setShowMatches(true);
        } else {
          setError(data.error || 'Failed to get matches');
        }
      } else {
        const likedCategories = swipeResults
          .filter(result => result.liked)
          .map(result => result.item.category);
        
        const response = await fetch('http://localhost:5000/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...filters,
            hunger: filters.hunger[0],
            health: filters.health[0],
            count: filters.count[0],
            restaurant: filters.restaurants.length > 0 ? filters.restaurants : 'any',
            preferredCategories: likedCategories
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          setOriginalRecommendations(data.recommendations);
          setRecommendations(data.recommendations);
        } else {
          setError(data.error || 'Failed to get recommendations');
        }
      }
    } catch (error) {
      setError('Error connecting to server');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, filterMode, preferenceTestCompleted, swipeResults, setError, setLoading, setRecommendations, setShowMatches]);

  useEffect(() => {
    if (selectedProteinType || selectedFoodType) {
      getFoodRecommendation();
    }
  }, [selectedProteinType, selectedFoodType, getFoodRecommendation]);

  useEffect(() => {
    if (originalRecommendations.length > 0) {
      let filtered = [...originalRecommendations];
      
      if (selectedFoodType !== 'any') {
        filtered = filtered.filter(item => item.food_type === selectedFoodType);
      }
      
      if (selectedProteinType !== 'any') {
        filtered = filtered.filter(item => item.protein_type === selectedProteinType);
      }
      
      setRecommendations(filtered);
    }
  }, [selectedFoodType, selectedProteinType, originalRecommendations]);

  const handleFilterChange = (name, value) => {
    // Handle the classification filters
    if (name === 'proteinType') {
      setSelectedProteinType(value);
      setOpenDropdown(null);
      return;
    }
    
    if (name === 'foodType') {
      setSelectedFoodType(value);
      setOpenDropdown(null);
      return;
    }
  
    setFilters(prev => ({
      ...prev,
      [name]: [value]
    }));
    setOpenDropdown(null);
  };

  const sortData = useCallback((data) => {
    if (sortConfig.activeKeys.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const key of sortConfig.activeKeys) {
        if (a[key] < b[key]) {
          return sortConfig.directions[key] === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.directions[key] === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      const newDirections = { ...prevConfig.directions };
      
      if (key in newDirections) {
        if (newDirections[key] === 'asc') {
          newDirections[key] = 'desc';
        } else {
          // If it's already desc, remove it
          delete newDirections[key];
          return {
            activeKeys: prevConfig.activeKeys.filter(k => k !== key),
            directions: newDirections
          };
        }
      } else {
        newDirections[key] = 'asc';
      }

      const newActiveKeys = key in newDirections 
        ? [...new Set([...prevConfig.activeKeys, key])]
        : prevConfig.activeKeys.filter(k => k !== key);

      return {
        activeKeys: newActiveKeys,
        directions: newDirections
      };
    });
  };

  const filterBySearch = useCallback((data) => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      item.item_name.toLowerCase().includes(query) || 
      item.restaurant.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        const filteredCount = filterBySearch(sortData(recommendations)).length;
        if (target.isIntersecting && !isLoadingMore && visibleItems < filteredCount) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleItems(prev => Math.min(prev + 8, filteredCount));
            setIsLoadingMore(false);
          }, 400);
        }
      },
      {
        root: null,
        rootMargin: '20px',
        threshold: 0.1
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visibleItems, isLoadingMore, recommendations, filterBySearch, sortData]);

  useEffect(() => {
    // Fetch restaurants when component mounts
    fetch('http://localhost:5000/api/restaurants')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setRestaurants(data.restaurants);
        }
      })
      .catch(error => console.error('Error fetching restaurants:', error));

    // Generate initial recommendations
    if (!recommendations.length) {
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          await getFoodRecommendation();
        } catch (error) {
          console.error('Error fetching initial data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [recommendations, filters, userDataModel]);

  useEffect(() => {
      // Fetch protein types
  fetch('http://localhost:5000/api/protein-types')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      setProteinTypes(data.protein_types);
    }
  })
  .catch(error => console.error('Error fetching protein types:', error));

// Fetch food types
fetch('http://localhost:5000/api/food-types')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      setFoodTypes(data.food_types);
    }
  })
  .catch(error => console.error('Error fetching food types:', error));
  }, []);

  const sortOptions = [
    { value: 'health_score', label: 'Health Score' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'calories', label: 'Calories' },
    { value: 'protein', label: 'Protein' },
  ];

  const hungerOptions = [
    { value: 'all', label: 'All (0-2000 cal)' },
    { value: 'low', label: 'Low (0-400 cal)' },
    { value: 'medium', label: 'Medium (401-999 cal)' },
    { value: 'high', label: 'High (1000-2000 cal)' }
  ];

  const healthOptions = [
    { value: 'all', label: 'All (1-10)' },
    { value: 'low', label: 'Low (1-4.9)' },
    { value: 'medium', label: 'Medium (5-7.9)' },
    { value: 'high', label: 'High (8-10)' }
  ];

  const countOptions = [
    { value: 999, label: 'All Results' },
    { value: 8, label: '8 Results' },
  ];

  const getHealthScoreColor = (score) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getHealthScoreTextColor = (score) => {
    if (score >= 8) return 'text-emerald-700 font-semibold';
    if (score >= 5) return 'text-amber-700 font-semibold';
    return 'text-rose-700 font-semibold';
  };

  const dailyValues = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78,
    fiber: 28,
    sugar: 50,
    sodium: 2300
  };

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.item_name === item.item_name);
      if (existingItem) {
        return prevItems.map(i => 
          i.item_name === item.item_name 
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCartItems(prevItems => {
      const newItems = [...prevItems];
      const newQuantity = (newItems[index].quantity || 1) + delta;
      if (newQuantity < 1) {
        newItems.splice(index, 1);
      } else {
        newItems[index] = { ...newItems[index], quantity: newQuantity };
      }
      return newItems;
    });
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotalNutrients = () => {
    return cartItems.reduce((acc, item) => ({
      calories: acc.calories + item.calories * (item.quantity || 1),
      protein: acc.protein + (item.protein || 0) * (item.quantity || 1),
      carbs: acc.carbs + (item.carbs || 0) * (item.quantity || 1),
      fat: acc.fat + (item.fat || 0) * (item.quantity || 1),
      fiber: acc.fiber + (item.fiber || 0) * (item.quantity || 1),
      sugar: acc.sugar + (item.sugar || 0) * (item.quantity || 1),
      sodium: acc.sodium + (item.sodium || 0) * (item.quantity || 1)
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  };

  const getNutrientStatus = (current, recommended) => {
    const percentage = (current / recommended) * 100;
    if (percentage < 70) return 'low';
    if (percentage > 130) return 'high';
    return 'balanced';
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getMealSuggestions = () => {
    const nutrients = calculateTotalNutrients();
    const suggestions = [];

    if (nutrients.protein < dailyValues.protein * 0.7) {
      suggestions.push("more protein-rich foods (meat, fish, legumes)");
    }
    if (nutrients.fiber < dailyValues.fiber * 0.7) {
      suggestions.push("more fiber (vegetables, whole grains)");
    }
    if (nutrients.carbs < dailyValues.carbs * 0.7) {
      suggestions.push("complex carbohydrates (whole grains, rice)");
    }
    if (nutrients.sugar > dailyValues.sugar * 1.3) {
      suggestions.push("less sugary items");
    }
    if (nutrients.sodium > dailyValues.sodium * 1.3) {
      suggestions.push("less salty foods");
    }

    if (suggestions.length === 0) {
      return "Your meal is well balanced!";
    }

    return `Consider adding ${suggestions.join(", ")} to balance your meal.`;
  };

  const sampleFoodItems = useMemo(() => [
    {
      id: 1,
      name: "Double Cheeseburger",
      restaurant: "Wendy's",
      calories: 850,
      protein: 45,
      carbs: 35,
      fat: 52,
      health_score: 4.2,
      category: "American"
    },
    {
      id: 2,
      name: "Chicken Tacos",
      restaurant: "Taco Bell",
      calories: 450,
      protein: 28,
      carbs: 42,
      fat: 22,
      health_score: 6.5,
      category: "Mexican"
    },
    {
      id: 3,
      name: "Chicken Fingers",
      restaurant: "Raising Cane's",
      calories: 620,
      protein: 38,
      carbs: 48,
      fat: 32,
      health_score: 5.8,
      category: "American"
    },
    {
      id: 4,
      name: "Curly Fries",
      restaurant: "Jack in the Box",
      calories: 380,
      protein: 4,
      carbs: 52,
      fat: 18,
      health_score: 3.5,
      category: "American"
    },
    {
      id: 5,
      name: "Spicy Chicken Sandwich",
      restaurant: "Wendy's",
      calories: 510,
      protein: 32,
      carbs: 45,
      fat: 24,
      health_score: 6.2,
      category: "American"
    },
    {
      id: 6,
      name: "Supreme Nachos",
      restaurant: "Taco Bell",
      calories: 760,
      protein: 22,
      carbs: 85,
      fat: 38,
      health_score: 4.0,
      category: "Mexican"
    }
  ], []);

  const fetchTestCards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test-cards');
      const data = await response.json();
      if (data.success) {
        setTestCards(data.cards);
      } else {
        console.error('Failed to fetch test cards:', data.error);
      }
    } catch (error) {
      console.error('Error fetching test cards:', error);
    }
  };

  useEffect(() => {
    if (isTestModalOpen) {
      fetchTestCards();
      setCurrentCardIndex(0);
      setSwipeResults([]);
      setIsTestCompleted(false);
      setIsProcessingResults(false);
    }
  }, [isTestModalOpen, sampleFoodItems]);

  const handleSwipe = (direction) => {
    setSwipeResults(prev => [...prev, { 
      item: testCards[currentCardIndex],
      liked: direction === 'right'
    }]);

    if (currentCardIndex < testCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setIsProcessingResults(true);
      // Simulate processing time
      setTimeout(() => {
        setIsProcessingResults(false);
        setIsTestCompleted(true);
      }, 2000);
    }
  };

  const onViewMatches = () => {
    setIsTestModalOpen(false);
    setPreferenceTestCompleted(true);
    setShowMatches(true);
    getFoodRecommendation(); // Will now use the matches endpoint since preferenceTestCompleted is true
  };

  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLaunchPage(false);
      setShowOptionsPage(true);
      setIsTransitioning(false);
    }, 600);
  };

  const handleOptionSelect = (mode) => {
    setIsTransitioning(true);
    setVisibleItems(8); // Reset visible items count
    setTimeout(() => {
      setShowOptionsPage(false);
      setFilterMode(mode);
      getFoodRecommendation(); // Load recommendations after changing mode
      setIsTransitioning(false);
    }, 600);
  };

  const handleFoodDatabaseClick = () => {
    setSidebarOpen(false); // Close the sidebar
    setShowOptionsPage(false); // Hide options page
    setShowLaunchPage(false); // Hide launch page
    setIsTransitioning(true); // Start transition
    setVisibleItems(8); // Reset visible items count
    setFilterMode('custom'); // Set to custom mode for database view
    getFoodRecommendation(); // Load initial recommendations
    setTimeout(() => {
      setIsTransitioning(false); // End transition after animation
    }, 300);
  };

  const FloatingFoodIcons = () => (
    <div className="absolute inset-0 pointer-events-none">
      <Pizza className="absolute top-[15%] left-[15%] w-16 h-16 text-primary/40 animate-float-1" />
      <Sandwich className="absolute top-[25%] right-[20%] w-12 h-12 text-accent/40 animate-float-2" />
      <Coffee className="absolute bottom-[20%] left-[25%] w-14 h-14 text-primary/30 animate-float-3" />
      <IceCream className="absolute top-[40%] left-[75%] w-10 h-10 text-accent/30 animate-float-1" />
      <Beef className="absolute bottom-[30%] right-[25%] w-16 h-16 text-primary/40 animate-float-2" />
      <Apple className="absolute top-[60%] left-[20%] w-12 h-12 text-accent/40 animate-float-3" />
    </div>
  );

  const SkeletonCard = () => (
    <div className="bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden border border-border">
      <div className="p-6 relative animate-pulse">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 relative">
            <div className="h-6 bg-muted rounded-md w-3/4 mb-2"></div>
            <div className="h-6 bg-muted rounded-md w-1/2 mb-4"></div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-muted rounded-full"></div>
          <div className="h-5 bg-muted rounded-md w-32"></div>
        </div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-muted rounded-md w-24"></div>
              <div className="h-4 bg-muted rounded-md w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDropdown = (label, options, name, show, setShow, currentValue) => {
    const currentOption = options.find(opt => opt.value === currentValue);
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={() => setShow(show ? null : name)}
          className="w-full px-3 py-2 text-left border border-border rounded-md bg-background/95 hover:bg-accent flex justify-between items-center text-sm"
        >
          <span className={currentOption ? "text-foreground" : "text-muted-foreground"}>
            {currentOption ? currentOption.label : `Select ${label}...`}
          </span>
          <svg 
            className={`h-4 w-4 transition-transform text-muted-foreground ${show ? 'transform rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {show && (
          <div className="absolute z-10 w-56 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-auto">
            <div className="p-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-muted-foreground"
                >
                  <input
                    type="radio"
                    checked={currentValue === option.value}
                    onChange={() => handleFilterChange(name, option.value)}
                    className="h-3 w-3 rounded-full border-input bg-background text-primary focus:ring-1 focus:ring-ring"
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (showLaunchPage) {
    return (
      <div className="flex h-screen dark items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 opacity-50" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
        </div>
        
        <FloatingFoodIcons />

        <div className={`text-center space-y-6 relative bg-background/30 backdrop-blur-sm p-12 rounded-2xl shadow-2xl ${isTransitioning ? 'animate-slide-out-up' : 'animate-fade-in'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-accent/5 rounded-2xl" />
          <div className="relative">
            <h1 className="text-7xl font-bold text-foreground mb-4 tracking-tight">
              LeYumYum
            </h1>
            <p className="text-xl text-muted-foreground mb-8 delay-100 animate-fade-in">
              Tinder... but for food ♡
            </p>
            <button 
              onClick={handleGetStarted}
              className="group px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200
                       shadow-lg hover:shadow-xl transform hover:-translate-y-1 delay-200 animate-fade-in
                       text-lg font-semibold inline-flex items-center gap-2"
            >
              Let's Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOptionsPage) {
    return (
      <div className="flex h-screen dark items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 opacity-50" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
        </div>
        
        <FloatingFoodIcons />

        <div className={`text-center space-y-8 relative bg-background/30 backdrop-blur-sm p-12 rounded-2xl shadow-2xl ${isTransitioning ? 'animate-slide-out-up' : 'animate-slide-in-up'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-accent/5 rounded-2xl" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-foreground mb-8">Choose Your Experience</h2>
            <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
              <button
                onClick={() => handleOptionSelect('custom')}
                className="group p-6 rounded-xl bg-background/50 hover:bg-background/70 border border-border transition-all duration-200
                         shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Custom Search</h3>
                      <p className="text-muted-foreground">Filter and search through our food database</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleOptionSelect('ai')}
                className="group p-6 rounded-xl bg-background/50 hover:bg-background/70 border border-border transition-all duration-200
                         shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">AI Recommendations</h3>
                      <p className="text-muted-foreground">Get personalized food suggestions</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>

              <button
                onClick={handleFoodDatabaseClick}
                className="group p-6 rounded-xl bg-background/50 hover:bg-background/70 border border-border transition-all duration-200
                         shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Food Database</h3>
                      <p className="text-muted-foreground">Browse our complete collection</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen dark overflow-hidden animate-fade-in`}>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-12'} border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out flex-shrink-0 relative h-screen`}>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-4 bg-background border border-border rounded-full p-1 shadow-sm hover:bg-accent transition-colors z-50"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-6" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        <div className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 invisible'} transition-opacity duration-200 px-4 py-4 h-full overflow-y-auto relative`}>
          <div className="space-y-1">
            <div className="filter-mode-container relative flex rounded-lg">
              <div 
                className="filter-mode-slider"
                data-state={filterMode}
              />
              <button
                onClick={() => setFilterMode('custom')}
                className="filter-mode-button flex-1 px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-2"
                data-active={filterMode === 'custom'}
              >
                <Settings className="w-4 h-4" />
                Custom
              </button>
              <button
                onClick={() => setFilterMode('ai')}
                className="filter-mode-button flex-1 px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-2"
                data-active={filterMode === 'ai'}
              >
                <Sparkles className="w-4 h-4" />
                AI
              </button>
            </div>
            <div className="space-y-3">
              {filterMode === 'custom' && (
                <div className="space-y-2">
                  <div>
                    {renderDropdown(
                      "Hunger Level",
                      hungerOptions,
                      'hunger',
                      openDropdown === 'hunger',
                      setOpenDropdown,
                      filters.hunger[0]
                    )}
                  </div>

                  <div>
                    {renderDropdown(
                      "Health Preference",
                      healthOptions,
                      'health',
                      openDropdown === 'health',
                      setOpenDropdown,
                      filters.health[0]
                    )}
                  </div>

                  <div>
                    {renderDropdown(
                      "Food Type",
                      [
                        { value: 'any', label: 'Any Food Type' },
                        ...foodTypes.map(type => ({ 
                          value: type, 
                          label: type.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')
                        }))
                      ],
                      'foodType',
                      openDropdown === 'foodType',
                      setOpenDropdown,
                      selectedFoodType
                    )}
                  </div>

                  <div>
                    {renderDropdown(
                      "Protein Type",
                      [
                        { value: 'any', label: 'Any Protein Type' },
                        ...proteinTypes.map(type => ({ 
                          value: type, 
                          label: type
                        }))
                      ],
                      'proteinType',
                      openDropdown === 'proteinType',
                      setOpenDropdown,
                      selectedProteinType
                    )}
                  </div>

                  <div>
                    {renderDropdown(
                      "Number of Results",
                      countOptions,
                      'count',
                      openDropdown === 'count',
                      setOpenDropdown,
                      filters.count[0],
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Restaurants</label>
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (openDropdown === 'restaurants') {
                            setOpenDropdown(null);
                          } else {
                            setOpenDropdown('restaurants');
                          }
                        }}
                        className="w-full px-3 py-2 text-left border border-border rounded-md bg-background/95 hover:bg-accent flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground">
                          {filters.restaurants.length === 0 
                            ? "Select Restaurants..." 
                            : filters.restaurants.length === 19
                              ? "All Restaurants"
                              : `${filters.restaurants.length} selected`}
                        </span>
                        <svg 
                          className={`h-4 w-4 transition-transform text-muted-foreground ${openDropdown === 'restaurants' ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === 'restaurants' && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          <div className="p-1">
                            <label
                              className="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-muted-foreground"
                            >
                              <input
                                type="checkbox"
                                checked={filters.restaurants.length === restaurants.length}
                                onChange={() => {
                                  if (filters.restaurants.length === restaurants.length) {
                                    setFilters(prev => ({ ...prev, restaurants: [] }));
                                  } else {
                                    setFilters(prev => ({ ...prev, restaurants: [...restaurants] }));
                                  }
                                  setOpenDropdown(null); // Close dropdown when selecting/deselecting all
                                }}
                                className="h-3 w-3 rounded border-input bg-background text-primary focus:ring-1 focus:ring-ring"
                              />
                              <span className="ml-2">All Restaurants</span>
                            </label>
                            {restaurants.map((restaurant) => (
                              <label
                                key={restaurant}
                                className="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-muted-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked={filters.restaurants.includes(restaurant)}
                                  onChange={() => handleFilterChange('restaurants', restaurant)}
                                  className="h-3 w-3 rounded border-input bg-background text-primary focus:ring-1 focus:ring-ring"
                                />
                                <span className="ml-2">{restaurant}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {filters.restaurants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.restaurants.map(restaurant => (
                          <span
                            key={restaurant}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-md text-xs"
                          >
                            {restaurant}
                            <button
                              onClick={() => handleFilterChange('restaurants', restaurant)}
                              className="tag-close-button"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
{filterMode === 'ai' && (
  <div className="space-y-8">
    {/* AI User Data Models Section */}
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-foreground">Don't Know What to Eat?</h3>

      <p className="text-sm text-muted-foreground">
        Our AI will analyze your preferences and provide personalized food recommendations!
      </p>

      {/* Replace the existing test button with PreferenceTestController */}
      <PreferenceTestController 
        onComplete={() => {
          // This will be called when the test is completed
          setIsTestModalOpen(false);
          getFoodRecommendation();
        }}
      />
{/* 
      <div className="space-y-2 p-3 rounded-md bg-muted/50">
        <div>
          {renderDropdown(
            "Profile",
            userDataModel.profiles.map((profile, index) => ({
              value: index.toString(),
              label: profile.name
            })),
            'profile',
            openDropdown === 'profile',
            setOpenDropdown,
            filters.profile[0]
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2 mt-3">
          <div className="italic">{userDataModel.profiles[parseInt(filters.profile[0] || 0)].description}</div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <div>Favorite Cook: {userDataModel.profiles[parseInt(filters.profile[0] || 0)].preferences.favoriteCuisines.join(', ')}</div>
            <div>Protein Preferences: {userDataModel.profiles[parseInt(filters.profile[0] || 0)].preferences.spiceLevel}</div>
            <div>Restaurant Preferences: {userDataModel.profiles[parseInt(filters.profile[0] || 0)].preferences.priceRange}</div>
          </div>
        </div>
      </div> */}

      {/* <div className="flex gap-2">
        <Button
          onClick={() => {
            const dataStr = JSON.stringify(userDataModel, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'user-preferences.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="flex-1 text-xs"
          variant="outline"
        >
          Export Data
        </Button>
        <Button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const data = JSON.parse(event.target.result);
                  setUserDataModel(data);
                } catch (error) {
                  console.error('Error parsing JSON:', error);
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
          className="flex-1 text-xs"
          variant="outline"
        >
          Import Data
        </Button>
      </div> */}
    </div>
  </div>
              )}

              {/* <Button 
                onClick={getFoodRecommendation}
                disabled={loading}
                className="w-full mt-4 bg-primary hover:bg-primary/90"
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button> */}
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out flex flex-col min-h-0`}>
        <div className="sticky top-0 z-50 backdrop-blur bg-transparent border-b border-border">
          <div className="flex items-center justify-between h-16 px-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">LeYumYum</h1>
                <img src={logo} alt="LeYumYum Logo" className="w-10 h-10" />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search foods or restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                />
              </div>

              <div className="flex items-center gap-2">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`px-3 py-3 text-xs rounded-md transition-colors hover:bg-muted/50 ${
                      sortConfig.activeKeys.includes(option.value)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted hover:bg-muted/100 text-muted-foreground'
                    }`}
                  >
                    {option.label}
                    {sortConfig.activeKeys.includes(option.value) && (
                      <span className="ml-1">
                        {sortConfig.directions[option.value] === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
                <div className="text-sm text-muted-foreground border-l border-border pl-2 ml-2">
                  <span className="font-medium text-foreground">{visibleItems}</span>
                  <span className="mx-1">/</span>
                  <span>{filterBySearch(sortData(recommendations)).length}</span>
                  <span className="ml-1">items</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mr-auto pr-2">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowUserDataDropdown(!showUserDataDropdown)}
                className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                <User className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 p-5 pt-5 overflow-y-auto min-h-0">
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 110px)" }}>
            {filterMode === 'ai' && showMatches ? (
              // When the preference test is completed and we're in AI mode, show the matches component
              <FoodMatches matches={recommendations} />
            ) : (
              // Otherwise show the regular grid view
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pr-4 auto-rows-[345px] min-h-[calc(100vh-200px)]">
                {loading ? (
                  [...Array(8)].map((_, index) => (
                    <SkeletonCard key={`skeleton-${index}`} />
                  ))
                ) : filterBySearch(sortData(recommendations)).length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                    <Search className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-center">No results found</h3>
                    <p className="text-muted-foreground max-w-sm mb-2 text-center">
                      {searchQuery ? (
                        <>No items match your search "<span className="font-medium">{searchQuery}</span>"</>
                      ) : (
                        "No items match your current filters"
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm text-center">
                      Try {searchQuery ? "checking your spelling or " : ""}adjusting your filters:
                      <br />
                      {filters.restaurants.length < 19 && "• Selected restaurants"}
                      {filters.hunger[0] !== 'all' && "• Hunger level"}
                      {filters.health[0] !== 'all' && "• Health preferences"}
                    </p>
                  </div>
                ) : (
                  // Your existing card rendering code remains the same
                  filterBySearch(sortData(recommendations)).slice(0, visibleItems).map((item, index) => (
                    <div key={index} className="bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden border border-border">
                      <div className="p-6 relative">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0 relative group">
                            <h3 className="text-lg font-semibold truncate">
                              {item.item_name.length > 40 ? `${item.item_name.slice(0, 37)}...` : item.item_name}
                            </h3>
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-popover border border-border text-popover-foreground px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-[300px] break-words">
                              {item.item_name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {cartItems.find(i => i.item_name === item.item_name)?.quantity > 0 && (
                              <button
                                onClick={() => {
                                  const existingItem = cartItems.findIndex(i => i.item_name === item.item_name);
                                  if (existingItem !== -1) {
                                    updateQuantity(existingItem, -1);
                                  }
                                }}
                                className="w-8 h-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                            )}
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-base font-bold mb-2 text-muted-foreground">
                          {item.restaurant}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          {(item.food_type || item.protein_type) && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.food_type && item.food_type !== 'Unknown' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {item.food_type}
                                </span>
                              )}
                              {item.protein_type && item.protein_type !== 'Unknown' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  item.protein_type === 'Chicken' ? 'bg-amber-100 text-amber-800' :
                                  item.protein_type === 'Beef' ? 'bg-red-100 text-red-800' :
                                  item.protein_type === 'Veggie' ? 'bg-emerald-100 text-emerald-800' :
                                  item.protein_type === 'Cheese' ? 'bg-yellow-100 text-yellow-800' :
                                  item.protein_type === 'Pork' ? 'bg-pink-100 text-pink-800' :
                                  item.protein_type === 'Turkey' ? 'bg-orange-100 text-orange-800' :
                                  item.protein_type === 'Steak' ? 'bg-red-200 text-red-900' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.protein_type}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 relative group ml-auto">
                            <div className={`w-3 h-3 rounded-full ${getHealthScoreColor(item.health_score)}`}></div>
                            <span className={`text-sm ${getHealthScoreTextColor(item.health_score)}`}>
                              Health Score: {item.health_score ? item.health_score.toFixed(1) : '0.0'}
                            </span>
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-popover border border-border text-popover-foreground px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-[300px] break-words">
                              {item.reasoning}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            const getHealthStatus = (value, recommended, lowThreshold = 0.5, highThreshold = 1.5) => {
                              const ratio = value / recommended;
                              if (ratio < lowThreshold) return "low";
                              if (ratio > highThreshold) return "high";
                              return "good";
                            };

                            return (
                              <>
                                <div className="nutrient-bar" data-type="calories">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.calories || 0, 2000, 0.7, 1.3)}
                                    style={{ width: `${Math.min((item.calories / 2000) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Calories</span>
                                    <span className="nutrient-bar-value">{item.calories || 0}</span>
                                  </div>
                                </div>
                                
                                <div className="nutrient-bar" data-type="protein">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.protein || 0, 50)}
                                    style={{ width: `${Math.min((item.protein / 50) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Protein</span>
                                    <span className="nutrient-bar-value">{item.protein || 0}g</span>
                                  </div>
                                </div>

                                <div className="nutrient-bar" data-type="carbs">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.carbs || 0, 300)}
                                    style={{ width: `${Math.min((item.carbs / 300) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Carbs</span>
                                    <span className="nutrient-bar-value">{item.carbs || 0}g</span>
                                  </div>
                                </div>

                                <div className="nutrient-bar" data-type="fat">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.fat || 0, 65)}
                                    style={{ width: `${Math.min((item.fat / 65) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Fat</span>
                                    <span className="nutrient-bar-value">{item.fat || 0}g</span>
                                  </div>
                                </div>

                                <div className="nutrient-bar" data-type="fiber">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.fiber || 0, 28)}
                                    style={{ width: `${Math.min((item.fiber / 28) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Fiber</span>
                                    <span className="nutrient-bar-value">{item.fiber || 0}g</span>
                                  </div>
                                </div>

                                <div className="nutrient-bar" data-type="sugar">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.sugar || 0, 50, 0, 1)}
                                    style={{ width: `${Math.min((item.sugar / 50) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Sugar</span>
                                    <span className="nutrient-bar-value">{item.sugar || 0}g</span>
                                  </div>
                                </div>

                                <div className="nutrient-bar" data-type="sodium">
                                  <div 
                                    className="nutrient-bar-fill"
                                    data-health={getHealthStatus(item.sodium || 0, 2300, 0, 1)}
                                    style={{ width: `${Math.min((item.sodium / 2300) * 100, 100)}%` }}
                                  />
                                  <div className="nutrient-bar-content">
                                    <span className="nutrient-bar-label">Sodium</span>
                                    <span className="nutrient-bar-value">{item.sodium || 0}mg</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}
            
            {!showMatches && visibleItems < filterBySearch(sortData(recommendations)).length && (
              <div 
                className="flex justify-center py-8"
                ref={loadMoreRef}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* <footer className="mt-auto border-t border-border/40 bg-background/30 backdrop-blur-sm supports-[backdrop-filter]:bg-background/10">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="text-sm text-muted-foreground">
              Made with <span className="text-primary">♥</span> by Chris
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Food Recommender
            </div>
          </div>
        </footer> */}
      </main>

      {/* Modals */}
      {isTestModalOpen && !preferenceTestCompleted && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <TestModal 
            isOpen={isTestModalOpen}
            onClose={() => setIsTestModalOpen(false)}
            testCards={testCards}
            currentCardIndex={currentCardIndex}
            isProcessingResults={isProcessingResults}
            isTestCompleted={isTestCompleted}
            handleSwipe={handleSwipe}
            onViewMatches={onViewMatches}
          />
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50">
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden border border-border w-1/2 p-6 pointer-events-auto animate-openCart">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.doordash.com/search/store/${encodeURIComponent(
                      Array.from(new Set(cartItems.map(item => item.restaurant))).join(',')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-md transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.071 8.409c0-4.39-3.579-7.968-7.97-7.968H.516v23.117h14.585c4.391 0 7.97-3.578 7.97-7.969V8.409zm-14.585.484h3.587v5.678h-3.587V8.893z"/>
                    </svg>
                    Order
                  </a>
                  <button
                    onClick={clearCart}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors text-sm flex items-center gap-1.5 border border-zinc-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    Clear
                  </button>
                  <button
                    onClick={() => setShowCart(false)}
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty.</p>
              ) : (
                <>
                  <div className="max-h-[40vh] overflow-y-auto mb-4 pr-2">
                    <div className="space-y-4">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-foreground font-medium">{item.item_name}</span>
                            <p className="text-sm text-muted-foreground mt-0.5">{item.restaurant}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(index, -1)}
                                className="w-6 h-6 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <span className="text-foreground min-w-[20px] text-center">{item.quantity || 1}</span>
                              <button
                                onClick={() => updateQuantity(index, 1)}
                                className="w-6 h-6 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="bg-destructive/10 hover:bg-destructive/20 transition-colors rounded-full p-2"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="space-y-2">
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <p className="text-muted-foreground text-sm">{getMealSuggestions()}</p>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Total Nutrients</h3>
                      <div className="space-y-2">
                        {Object.keys(calculateTotalNutrients()).map((nutrient) => {
                          const total = calculateTotalNutrients()[nutrient];
                          const status = getNutrientStatus(total, dailyValues[nutrient]);
                          return (
                            <div key={nutrient} className="flex justify-between">
                              <span className="text-muted-foreground">{nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}:</span>
                              <span className={`text-${status === 'high' ? 'destructive' : status === 'low' ? 'yellow-500' : 'emerald-500'}`}>
                                {total} {nutrient === 'sodium' ? 'mg' : 'g'} / {status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <style>
            {
              `.animate-openCart {
                animation: openCart 0.3s ease-in-out forwards;
              }
              @keyframes openCart {
                0% {
                  transform: scale(0.8);
                  opacity: 0;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }`
            }
          </style>
        </div>
      )}
    </div>
  );
}

export default App;
