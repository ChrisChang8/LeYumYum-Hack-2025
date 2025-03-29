# FoodTauh 1.0: AI-Powered Food Recommendation System

## Overview
FoodTauh is an intelligent food recommendation system that combines machine learning with personalized preference testing to help users discover food options that match their tastes and nutritional needs.

## Features

### 🧠 Smart Recommendation Engine
- Utilizes machine learning to analyze user preferences
- Considers both nutritional content and user taste patterns
- Adapts recommendations based on health scores and dietary preferences

### 🎯 Preference Testing System
- Interactive swipe-based preference testing
- Visual food type categorization
- Real-time health score indicators
- Detailed nutritional information display

### 🔍 Custom Search Options
- Filter by:
  - Food type (e.g., Sandwiches, Burgers, Salads)
  - Protein type (e.g., Chicken, Beef, Veggie)
  - Restaurant
  - Health score range
  - Nutritional content

### 💾 Data Management
- SQLite database for efficient data storage
- Comprehensive food item details including:
  - Nutritional facts
  - Health scores
  - Restaurant information
  - Food categorization

## Technical Stack

### Frontend
- React.js with modern hooks
- Tailwind CSS for styling
- Portal-based modal system
- Responsive design

### Backend
- Python Flask server
- SQLite database
- Pandas for data processing
- Machine learning model for recommendations

### ML Components
- Preference learning algorithm
- Health score calculation system
- Category-based filtering
- Personalized recommendation engine

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FoodTauh-1.0.git
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

3. Initialize the database:
```bash
python db_setup.py
```

4. Start the development servers:
```bash
# Frontend
npm run dev

# Backend
python app.py
```

## Data Sources
The system uses a classified dataset of food items with detailed nutritional information and custom health scoring algorithms.

## Future Enhancements
- Enhanced ML model with deep learning
- More sophisticated preference analysis
- Expanded food database
- Dietary restriction filtering
- Social sharing features
