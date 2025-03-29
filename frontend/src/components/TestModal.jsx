import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { Button } from './ui/button';

const TestModal = ({ 
  isOpen,
  onClose,
  testCards,
  currentCardIndex,
  isProcessingResults,
  isTestCompleted,
  handleSwipe,
  onViewMatches 
}) => {
  if (!isOpen) return null;

  // Component for food type image with fallback
  const FoodCategoryImage = ({ food_type }) => {
    const [useFallback, setUseFallback] = useState(false);
    const imageType = useFallback ? 'jpg' : 'png';
    
    if (!food_type || food_type === 'Unknown') return null;
    
    // Convert food type to kebab case for file naming
    const imageKey = food_type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    console.log(`Rendering image for food type: ${imageKey}, using ${imageType}`);
    
    return (
      <img 
        src={`/images/${imageKey}.${imageType}`} 
        alt={`${food_type} icon`}
        className="h-26 w-26 md:h-24 md:w-24 object-contain"
        onError={() => {
          if (!useFallback) {
            // If PNG fails, try JPEG
            setUseFallback(true);
          }
          // If both formats fail, the error will just show the alt text or nothing
        }}
      />
    );
  };

  // Use createPortal to render at document.body instead of in the component hierarchy
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto p-4 md:p-6 animate-in fade-in-50 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">Food Preference Test</h3>
          
          {testCards.length > 0 && !isProcessingResults && !isTestCompleted && (
            <div className="relative h-[60vh] max-h-[500px] w-full">
              {testCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`absolute inset-0 transition-all duration-300 ${
                    index === currentCardIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <div className="bg-card rounded-lg shadow-lg h-full p-3 md:p-4 lg:p-6 border border-border overflow-auto">
                    <div className="space-y-3 md:space-y-4">
                      <div className="space-y-1 md:space-y-2 border-b border-border pb-3">
                        <h4 className="text-lg md:text-xl font-semibold">{card.name}</h4>
                        <p className="text-muted-foreground text-sm md:text-base">{card.restaurant}</p>
                      </div>

                      <div className="flex justify-center my-2">
                        <FoodCategoryImage 
                          food_type={card.food_type}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium ${
                          card.health_score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                          card.health_score >= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          Health Score: {card.health_score.toFixed(1)}
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <h5 className="font-medium text-base md:text-lg">Nutritional Facts</h5>
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          <div className="bg-muted/50 p-1.5 rounded-lg">
                            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Calories</p>
                            <p className="font-semibold text-base md:text-lg">{card.calories}</p>
                          </div>
                          <div className="bg-muted/50 p-1.5 rounded-lg">
                            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Protein</p>
                            <p className="font-semibold text-base md:text-lg">{card.protein}g</p>
                          </div>
                          <div className="bg-muted/50 p-1.5 rounded-lg">
                            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Carbs</p>
                            <p className="font-semibold text-base md:text-lg">{card.carbs}g</p>
                          </div>
                          <div className="bg-muted/50 p-1.5 rounded-lg">
                            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Fat</p>
                            <p className="font-semibold text-base md:text-lg">{card.fat}g</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isProcessingResults && (
            <div className="h-[60vh] max-h-[500px] w-full bg-card rounded-lg shadow-lg border border-border p-4 md:p-6">
              <div className="h-full flex flex-col justify-center space-y-4 md:space-y-6">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-1000 animate-progress"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold">Processing Your Food Preferences</h3>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">We're analyzing your choices to find the best matches...</p>
                </div>
              </div>
            </div>
          )}

          {isTestCompleted && (
            <div className="h-[60vh] max-h-[500px] w-full bg-card rounded-lg shadow-lg border border-border p-4 md:p-6">
              <div className="h-full flex flex-col items-center justify-center space-y-4 md:space-y-6">
                <div className="text-center space-y-3 md:space-y-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary">
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold">Test Completed!</h3>
                  <p className="text-sm md:text-base text-muted-foreground">We've got your food preferences.</p>
                </div>
                <Button onClick={onViewMatches} className="mt-2 md:mt-4">
                  View Your Matches
                </Button>
              </div>
            </div>
          )}

          {!isTestCompleted && !isProcessingResults && (
            <div className="flex justify-center gap-3 md:gap-4 mt-3 md:mt-4">
              <Button
                onClick={() => handleSwipe('left')}
                variant="outline"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
              </Button>
              <Button
                onClick={() => handleSwipe('right')}
                variant="outline"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <span className="text-xl md:text-2xl text-primary">♥</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TestModal;