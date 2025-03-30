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