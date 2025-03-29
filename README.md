# Food Recommender

A food recommendation system built with Flask and React.

## Project Structure
```
foodRecommender/
├── data-set/               # Data files
├── frontend/              # React frontend
├── model/                 # Saved model files
├── app.py                 # Flask backend
├── convert_model.py       # Script to convert Jupyter model
└── requirements.txt       # Python dependencies
```

## Setup Instructions

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Convert the model:
```bash
python convert_model.py
```

3. Start the Flask backend:
```bash
python app.py
```

4. Install and start the React frontend:
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
