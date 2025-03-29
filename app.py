from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os
import sqlite3

app = Flask(__name__)
CORS(app)

# Load the model
MODEL_PATH = 'food_model.pkl'

# Path to SQLite database
DB_PATH = 'food_app.db'

# Define target meal values for nutritional reasoning
meal_values = {
    'calories': 600,  # Average meal calories
    'total_fat': 20,  # grams
    'saturated_fat': 7,  # grams
    'trans_fat': 0.5,  # grams
    'cholesterol': 60,  # mg
    'sodium': 800,  # mg
    'dietary_fiber': 5,  # grams
    'sugar': 25,  # grams
    'protein': 20  # grams
}

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def compute_reasoning(row):
    high = []
    low = []

    for k in ['calories', 'total_fat', 'saturated_fat', 'trans_fat', 'cholesterol', 'sodium', 'sugar']:
        if row[k] > meal_values[k]:
            high.append(k.replace('_', ' '))

    for k in ['dietary_fiber', 'protein']:
        if row[k] < meal_values[k] * 0.7:
            low.append(k.replace('_', ' '))

    if not high and not low:
        return "Balanced"

    parts = []
    if high:
        parts.append(f"High: {', '.join(high)}")
    if low:
        parts.append(f"Low: {', '.join(low)}")

    return " | ".join(parts)

def load_model():
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def recommend_food(df, hunger, health, restaurant="any", count=5):
    # Calorie ranges based on hunger level
    hunger_map = {
        "all": (0, 2000),
        "low": (0, 400),
        "medium": (401, 999),
        "high": (1000, 2000)
    }

    # Health score ranges
    health_map = {
        "all": (1, 10),
        "high": (8, 10),
        "medium": (5, 7.9),
        "low": (1, 4.9)
    }

    # Apply filters
    low_cal, high_cal = hunger_map[hunger]
    low_score, high_score = health_map[health]

    filtered = df[
        (df['calories'] >= low_cal) & (df['calories'] <= high_cal) &
        (df['health_score'] >= low_score) & (df['health_score'] <= high_score)
    ]

    if restaurant != "any":
        if isinstance(restaurant, list):
            # Handle multiple restaurants
            filtered = filtered[filtered['restaurant'].isin(restaurant)]
        else:
            # Handle single restaurant
            filtered = filtered[filtered['restaurant'].str.lower() == restaurant.lower()]

    # Select and format top results
    recommendations = []
    if not filtered.empty:
        results = filtered.sample(min(count, len(filtered)))
        for _, row in results.iterrows():
            recommendations.append({
                'id': int(row['id']) if 'id' in row else None,
                'restaurant': row['restaurant'],
                'item_name': row['item_name'],
                'calories': row['calories'],
                'health_score': float(row['health_score']),
                'protein': row['protein'],
                'carbs': row['carbohydrates'],
                'fat': row['total_fat'],
                'fiber': row['dietary_fiber'],
                'sugar': row['sugar'],
                'sodium': row['sodium'],
                'reasoning': compute_reasoning(row),
                'description': row['item_description'] if pd.notna(row['item_description']) else 'No description available.'
            })
    return recommendations

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    try:
        conn = get_db_connection()
        restaurants = conn.execute('SELECT DISTINCT restaurant FROM foods').fetchall()
        conn.close()
        
        restaurant_list = [r['restaurant'] for r in restaurants]
        
        return jsonify({
            'success': True,
            'restaurants': restaurant_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

model_package = None
if os.path.exists(MODEL_PATH):
    model_package = load_model()



@app.route('/api/test-cards', methods=['GET'])
def get_test_cards():
    try:
        conn = get_db_connection()
        
        # Get a balanced selection of items across different health scores
        query = '''
        SELECT 
            id, item_name, restaurant, calories, protein,
            carbohydrates, total_fat, health_score,
            protein_type, food_type, reasoning
        FROM foods 
        WHERE health_score BETWEEN ? AND ?
        ORDER BY RANDOM()
        LIMIT ?
        '''
        
        test_cards = []
        # Get 5 items from different health score ranges
        ranges = [(7, 10, 2), (4, 6.9, 2), (1, 3.9, 1)]  # (min, max, count)
        
        for min_score, max_score, count in ranges:
            items = conn.execute(query, (min_score, max_score, count)).fetchall()
            for item in items:
                test_cards.append({
                    'id': item['id'],
                    'name': item['item_name'],
                    'restaurant': item['restaurant'],
                    'calories': int(item['calories']),
                    'protein': float(item['protein']),
                    'carbs': float(item['carbohydrates']),
                    'fat': float(item['total_fat']),
                    'health_score': float(item['health_score']),
                    'protein_type': item['protein_type'],
                    'food_type': item['food_type']
                })
        
        conn.close()
        return jsonify({'success': True, 'cards': test_cards})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/preferences', methods=['POST'])
def save_preference():
    try:
        data = request.get_json()
        food_id = data.get('food_id')
        is_liked = data.get('is_liked', False)
        
        if not food_id:
            return jsonify({'success': False, 'error': 'Missing food_id'}), 400
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO preferences (food_id, is_liked) VALUES (?, ?)',
            (food_id, 1 if is_liked else 0)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/protein-types', methods=['GET'])
def get_protein_types():
    """Get all unique protein types in the database"""
    try:
        conn = get_db_connection()
        types = conn.execute('SELECT DISTINCT protein_type FROM foods WHERE protein_type IS NOT NULL AND protein_type != "Unknown"').fetchall()
        conn.close()
        
        protein_types = [t['protein_type'] for t in types if t['protein_type']]
        
        return jsonify({
            'success': True,
            'protein_types': protein_types
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/food-types', methods=['GET'])
def get_food_types():
    """Get all unique food types in the database"""
    try:
        conn = get_db_connection()
        types = conn.execute('SELECT DISTINCT food_type FROM foods WHERE food_type IS NOT NULL AND food_type != "Unknown"').fetchall()
        conn.close()
        
        food_types = [t['food_type'] for t in types if t['food_type']]
        
        return jsonify({
            'success': True,
            'food_types': food_types
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Update the recommend endpoint
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        if model_package is None:
            return jsonify({'success': False, 'error': 'Model not loaded'}), 500
            
        data = request.get_json()
        hunger = data.get('hunger', 'medium')
        health = data.get('health', 'medium')
        restaurant = data.get('restaurant', 'any')
        count = data.get('count', 5)
        food_type = data.get('food_type', 'any')  # Food type filter
        protein_type = data.get('protein_type', 'any')  # Protein type filter
        
        # Get dataframe from the model
        df = model_package['data']
        
        # Apply hunger and health filters first
        hunger_map = {
            "all": (0, 2000),
            "low": (0, 400),
            "medium": (401, 999),
            "high": (1000, 2000)
        }
        
        health_map = {
            "all": (1, 10),
            "low": (1, 4.9),
            "medium": (5, 7.9),
            "high": (8, 10)
        }
        
        low_cal, high_cal = hunger_map[hunger]
        low_score, high_score = health_map[health]
        
        # Filter based on calories and health score
        filtered = df[
            (df['calories'] >= low_cal) & (df['calories'] <= high_cal) &
            (df['health_score'] >= low_score) & (df['health_score'] <= high_score)
        ]
        
        # Filter by restaurant
        if restaurant != "any":
            if isinstance(restaurant, list):
                # Handle multiple restaurants
                filtered = filtered[filtered['restaurant'].isin(restaurant)]
            else:
                # Handle single restaurant
                filtered = filtered[filtered['restaurant'].str.lower() == restaurant.lower()]
        
        # Filter by food type
        if food_type != "any":
            filtered = filtered[filtered['food_type'] == food_type]
        
        # Filter by protein type
        if protein_type != "any":
            filtered = filtered[filtered['protein_type'] == protein_type]
        
        # If we filtered too aggressively, relax the constraints
        if len(filtered) < count:
            # Try relaxing protein type requirement
            if protein_type != "any":
                # Keep food type filter but remove protein type filter
                relaxed = df[
                    (df['calories'] >= low_cal) & (df['calories'] <= high_cal) &
                    (df['health_score'] >= low_score) & (df['health_score'] <= high_score)
                ]
                
                if restaurant != "any":
                    if isinstance(restaurant, list):
                        relaxed = relaxed[relaxed['restaurant'].isin(restaurant)]
                    else:
                        relaxed = relaxed[relaxed['restaurant'].str.lower() == restaurant.lower()]
                
                if food_type != "any":
                    relaxed = relaxed[relaxed['food_type'] == food_type]
                
                # Add previously filtered results first
                combined = pd.concat([filtered, relaxed])
                # Remove duplicates
                filtered = combined.drop_duplicates(subset=['id', 'restaurant', 'item_name'])
        
        # If still not enough, try relaxing food type
        if len(filtered) < count and food_type != "any":
            # Keep protein type filter but remove food type filter
            relaxed = df[
                (df['calories'] >= low_cal) & (df['calories'] <= high_cal) &
                (df['health_score'] >= low_score) & (df['health_score'] <= high_score)
            ]
            
            if restaurant != "any":
                if isinstance(restaurant, list):
                    relaxed = relaxed[relaxed['restaurant'].isin(restaurant)]
                else:
                    relaxed = relaxed[relaxed['restaurant'].str.lower() == restaurant.lower()]
            
            if protein_type != "any":
                relaxed = relaxed[relaxed['protein_type'] == protein_type]
            
            # Add previously filtered results first
            combined = pd.concat([filtered, relaxed])
            # Remove duplicates
            filtered = combined.drop_duplicates(subset=['id', 'restaurant', 'item_name'])
        
        # If we still don't have enough, just get the top N by health score
        if len(filtered) < count:
            # Fall back to just hunger and health filters
            filtered = df[
                (df['calories'] >= low_cal) & (df['calories'] <= high_cal) &
                (df['health_score'] >= low_score) & (df['health_score'] <= high_score)
            ]
            
            if restaurant != "any":
                if isinstance(restaurant, list):
                    filtered = filtered[filtered['restaurant'].isin(restaurant)]
                else:
                    filtered = filtered[filtered['restaurant'].str.lower() == restaurant.lower()]
            
            # Sort by health score
            filtered = filtered.sort_values('health_score', ascending=False)
        
        # Sample or take top N results
        if len(filtered) > count:
            results = filtered.sample(count)
        else:
            results = filtered
        
        # Format the results
        recommendations = []
        for _, row in results.iterrows():
            recommendations.append({
                'id': int(row['id']) if 'id' in row else None,
                'restaurant': row['restaurant'],
                'item_name': row['item_name'],
                'calories': int(row['calories']),
                'health_score': float(row['health_score']),
                'protein': float(row['protein']),
                'carbs': float(row['carbohydrates']),
                'fat': float(row['total_fat']),
                'fiber': float(row['dietary_fiber']),
                'sugar': float(row['sugar']),
                'sodium': float(row['sodium']),
                'protein_type': row.get('protein_type', 'Unknown'),
                'food_type': row.get('food_type', 'Unknown'),
                'reasoning': row['reasoning'] if pd.notna(row['reasoning']) else 'No nutritional analysis available.'
            })
        
        return jsonify({
            'success': True, 
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

import sqlite3
import pandas as pd
import pickle
import os

def init_db():
    """Create the initial database structure"""
    conn = sqlite3.connect('food_app.db')
    c = conn.cursor()
    
    # Create foods table with columns for the classification data
    c.execute('''
    CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY,
        food_category TEXT,
        restaurant TEXT,
        item_name TEXT,
        item_description TEXT,
        calories INTEGER,
        total_fat REAL,
        saturated_fat REAL,
        trans_fat REAL,
        cholesterol REAL,
        sodium REAL,
        carbohydrates REAL,
        dietary_fiber REAL,
        sugar REAL,
        protein REAL,
        health_score REAL,
        reasoning TEXT,
        protein_type TEXT,
        food_type TEXT
    )
    ''')
    
    # Create preferences table
    c.execute('''
    CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY,
        food_id INTEGER,
        is_liked INTEGER,
        FOREIGN KEY (food_id) REFERENCES foods (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database created successfully.")

def load_excel_to_db(excel_path):
    """Load data from Excel to SQLite using the existing classification columns"""
    # Load the Excel file
    print(f"Loading data from {excel_path}...")
    df = pd.read_excel(excel_path)
    
    # Connect to SQLite database
    conn = sqlite3.connect('food_app.db')
    
    # Insert data into foods table, including the classification columns
    print("Inserting data into database...")
    for _, row in df.iterrows():
        conn.execute('''
        INSERT INTO foods (
            food_category, restaurant, item_name, item_description, 
            calories, total_fat, saturated_fat, trans_fat, 
            cholesterol, sodium, carbohydrates, dietary_fiber, 
            sugar, protein, health_score, reasoning,
            protein_type, food_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            row.get('food_category', ''),
            row.get('restaurant', ''),
            row.get('item_name', ''),
            row.get('item_description', ''),
            row.get('calories', 0),
            row.get('total_fat', 0),
            row.get('saturated_fat', 0),
            row.get('trans_fat', 0),
            row.get('cholesterol', 0),
            row.get('sodium', 0),
            row.get('carbohydrates', 0),
            row.get('dietary_fiber', 0),
            row.get('sugar', 0),
            row.get('protein', 0),
            row.get('health_score', 0),
            row.get('reasoning', ''),
            row.get('protein_type', 'Unknown'),  # Use the existing classification
            row.get('food_type', 'Unknown'),     # Use the existing classification
        ))
    
    # Commit and close
    conn.commit()
    conn.close()
    print("Data loaded successfully.")

def create_model_pickle():
    """Create a pickle file for the model"""
    # Connect to SQLite database
    conn = sqlite3.connect('food_app.db')
    
    # Load data into DataFrame
    df = pd.read_sql_query("SELECT * FROM foods", conn)
    conn.close()
    
    # Create the model package
    model_package = {
        'data': df,
        'version': '1.0'
    }
    
    # Save as pickle
    with open('food_model.pkl', 'wb') as f:
        pickle.dump(model_package, f)
    
    print("Model pickle file created successfully.")

if __name__ == "__main__":
    # Initialize the database
    init_db()
    
    # Check if Excel file exists
    excel_path = 'classifiedDataset.xlsx'
    if os.path.exists(excel_path):
        # Load data from Excel to SQLite (including the classification data)
        load_excel_to_db(excel_path)
        
        # Create the model pickle
        create_model_pickle()
    else:
        print(f"Excel file '{excel_path}' not found. Please place it in the same directory.")
        
# Update the matches endpoint to include the classification data
@app.route('/api/matches', methods=['GET'])
def get_matches():
    try:
        conn = get_db_connection()
        
        # Get liked and disliked food IDs
        liked = conn.execute('SELECT food_id FROM preferences WHERE is_liked = 1').fetchall()
        disliked = conn.execute('SELECT food_id FROM preferences WHERE is_liked = 0').fetchall()
        
        conn.close()
        
        liked_ids = [item['food_id'] for item in liked]
        disliked_ids = [item['food_id'] for item in disliked]
        
        # If we don't have any preferences yet, return health-based recommendations
        if not liked_ids:
            if model_package is None:
                return jsonify({'success': False, 'error': 'Model not loaded'}), 500
                
            # Return some healthy options
            df = model_package['data']
            healthy_options = df.sort_values('health_score', ascending=False).head(10)
            
            matches = []
            for _, item in healthy_options.iterrows():
                matches.append({
                    'id': int(item['id']) if 'id' in item else None,
                    'restaurant': item['restaurant'],
                    'item_name': item['item_name'],
                    'calories': int(item['calories']),
                    'health_score': float(item['health_score']),
                    'protein': float(item['protein']),
                    'carbs': float(item['carbohydrates']),
                    'fat': float(item['total_fat']),
                    'fiber': float(item['dietary_fiber']),
                    'protein_type': item.get('protein_type', 'Unknown'),
                    'protein_confidence': float(item.get('protein_confidence', 0.0)),
                    'food_type': item.get('food_type', 'Unknown'),
                    'food_type_confidence': float(item.get('food_type_confidence', 0.0)),
                    'reasoning': item['reasoning'] if pd.notna(item['reasoning']) else 'No nutritional analysis available.'
                })
                
            return jsonify({
                'success': True,
                'matches': matches,
                'message': 'No preferences recorded yet. Showing healthy options.'
            })
        
        # We have preferences, implement a matching algorithm that includes classifications
        if model_package is None:
            return jsonify({'success': False, 'error': 'Model not loaded'}), 500
            
        df = model_package['data'].copy()
        
        # Calculate average nutritional values of liked items
        liked_items = df[df['id'].isin(liked_ids)]
        
        if liked_items.empty:
            return jsonify({'success': False, 'error': 'Liked items not found in database'}), 500
            
        # Calculate averages of nutritional values
        avg_calories = liked_items['calories'].mean()
        avg_protein = liked_items['protein'].mean()
        avg_fat = liked_items['total_fat'].mean()
        avg_carbs = liked_items['carbohydrates'].mean()
        avg_health = liked_items['health_score'].mean()
        
        # Get preferred food types and protein types from liked items
        preferred_food_types = liked_items['food_type'].value_counts().index.tolist()
        preferred_protein_types = liked_items['protein_type'].value_counts().index.tolist()
        
        # Only consider items that haven't been rated yet
        rated_ids = liked_ids + disliked_ids
        unrated_items = df[~df['id'].isin(rated_ids)].copy()
        
        if unrated_items.empty:
            return jsonify({
                'success': True,
                'matches': [],
                'message': 'You have already rated all available items!'
            })
        
        # Calculate similarity score for each unrated item
        def calculate_similarity(row):
            cal_sim = 1 - min(abs(row['calories'] - avg_calories) / 1000, 1)
            pro_sim = 1 - min(abs(row['protein'] - avg_protein) / 50, 1)
            fat_sim = 1 - min(abs(row['total_fat'] - avg_fat) / 70, 1)
            carb_sim = 1 - min(abs(row['carbohydrates'] - avg_carbs) / 100, 1)
            health_sim = 1 - min(abs(row['health_score'] - avg_health) / 10, 1)
            
            # Category bonus - if this item is from a category user liked
            cat_bonus = 0.3 if row['food_category'] in liked_items['food_category'].values else 0
            
            # Restaurant bonus - if this item is from a restaurant user liked
            rest_bonus = 0.2 if row['restaurant'] in liked_items['restaurant'].values else 0
            
            # Food type bonus - prefer items with the same food type
            food_type_match = 0.3 if row['food_type'] in preferred_food_types else 0
            
            # Protein type bonus - prefer items with the same protein type
            protein_type_match = 0.25 if row['protein_type'] in preferred_protein_types else 0
            
            # Calculate weighted similarity score
            return (cal_sim * 0.1) + (pro_sim * 0.15) + (fat_sim * 0.1) + \
                   (carb_sim * 0.1) + (health_sim * 0.1) + cat_bonus + rest_bonus + \
                   food_type_match + protein_type_match
        
        # Apply similarity calculation
        unrated_items['match_score'] = unrated_items.apply(calculate_similarity, axis=1)
        
        # Get top matches
        top_matches = unrated_items.sort_values('match_score', ascending=False).head(10)
        
        # Format the results
        matches = []
        for _, item in top_matches.iterrows():
            matches.append({
                'id': int(item['id']) if 'id' in item else None,
                'restaurant': item['restaurant'],
                'item_name': item['item_name'],
                'calories': int(item['calories']),
                'health_score': float(item['health_score']),
                'protein': float(item['protein']),
                'carbs': float(item['carbohydrates']),
                'fat': float(item['total_fat']),
                'fiber': float(item['dietary_fiber']),
                'sugar': float(item['sugar']),
                'sodium': float(item['sodium']),
                'match_score': round(float(item['match_score']) * 100, 1),
                'protein_type': item.get('protein_type', 'Unknown'),
                'protein_confidence': float(item.get('protein_confidence', 0.0)),
                'food_type': item.get('food_type', 'Unknown'),
                'food_type_confidence': float(item.get('food_type_confidence', 0.0)),
                'reasoning': item['reasoning'] if pd.notna(item['reasoning']) else 'No nutritional analysis available.'
            })
            
        return jsonify({
            'success': True,
            'matches': matches
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)