import React, { useState, useEffect, useCallback } from 'react';
import TestModal from './TestModal';

const PreferenceTestController = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testCards, setTestCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isProcessingResults, setIsProcessingResults] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch test cards from the backend
  const fetchTestCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/test-cards');
      const data = await response.json();
      
      if (data.success) {
        setTestCards(data.cards);
      } else {
        setError(data.error || 'Failed to fetch test cards');
      }
    } catch (err) {
      setError('Network error: Could not connect to the server');
      console.error('Error fetching test cards:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle opening the test modal
  const handleOpenTest = useCallback(() => {
    if (testCards.length === 0 && !isLoading && !error) {
      fetchTestCards();
    }
    setIsOpen(true);
    setCurrentCardIndex(0);
    setIsTestCompleted(false);
    setIsProcessingResults(false);
  }, [testCards.length, isLoading, error, fetchTestCards]);

  // Save a user preference (like/dislike) to the backend
  const savePreference = useCallback(async (foodId, isLiked) => {
    try {
      const response = await fetch('http://localhost:5000/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_id: foodId,
          is_liked: isLiked,
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error('Error saving preference:', data.error);
      }
    } catch (err) {
      console.error('Network error saving preference:', err);
    }
  }, []);

  // Handle swipe action (like/dislike)
  const handleSwipe = useCallback((direction) => {
    if (currentCardIndex >= testCards.length) return;
    
    const currentCard = testCards[currentCardIndex];
    
    // Save the user's preference
    savePreference(currentCard.id, direction === 'right'); // right = like, left = dislike
    
    // Move to the next card or complete the test
    if (currentCardIndex < testCards.length - 1) {
      setCurrentCardIndex(prevIndex => prevIndex + 1);
    } else {
      // Test completed, process the results
      setIsProcessingResults(true);
      
      // Simulate processing time (in a real app, might do more calculations)
      setTimeout(() => {
        setIsProcessingResults(false);
        setIsTestCompleted(true);
      }, 1500);
    }
  }, [currentCardIndex, testCards, savePreference]);

  // Handle viewing matches after test is completed
  const handleViewMatches = useCallback(() => {
    setIsOpen(false);
    
    // Pass control to the parent component
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Fetch test cards when the component mounts
  useEffect(() => {
    fetchTestCards();
  }, [fetchTestCards]);

  return (
    <div>
      <button
        onClick={handleOpenTest}
        className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Find Your Food Match
      </button>
      
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      
      {isOpen && (
        <TestModal
          isOpen={isOpen}
          onClose={handleCloseModal}
          testCards={testCards}
          currentCardIndex={currentCardIndex}
          isProcessingResults={isProcessingResults}
          isTestCompleted={isTestCompleted}
          handleSwipe={handleSwipe}
          onViewMatches={handleViewMatches}
        />
      )}
    </div>
  );
};

export default PreferenceTestController;