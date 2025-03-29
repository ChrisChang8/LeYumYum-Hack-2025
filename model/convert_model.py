import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle
import os

def recommend_food(df, hunger, health, restaurant="any", count=5):
    # Calorie ranges based on hunger level
    hunger_map = {
        "low": (0, 400),
        "medium": (401, 999),
        "high": (1000, 2000)
    }

    # Health score ranges
    health_map = {
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

    if restaurant.lower() != "any":
        filtered = filtered[filtered['restaurant'].str.lower() == restaurant.lower()]

    # Select and format top results
    recommendations = []
    if not filtered.empty:
        results = filtered.sample(min(count, len(filtered)))
        for _, row in results.iterrows():
            recommendations.append({
                'restaurant': row['restaurant'],
                'item_name': row['item_name'],
                'calories': row['calories'],
                'health_score': row['health_score'],
                'protein': row['protein'],
                'carbs': row['carbohydrates'],
                'fat': row['total_fat'],
                'description': row['item_description']
            })
    return recommendations

def convert_model():
    # Load and preprocess the data
    df = pd.read_excel('fast_food_data.xlsx')

    # Ensure required columns exist
    required_columns = ['item_name', 'restaurant', 'calories', 'total_fat', 'saturated_fat',
                       'trans_fat', 'cholesterol', 'sodium', 'carbohydrates', 'dietary_fiber',
                       'sugar', 'protein', 'item_description']
    
    if not all(col in df.columns for col in required_columns):
        raise ValueError("Missing required columns in the dataset. Please ensure all required columns are present.")

    # Fill missing descriptions with a default value
    df['item_description'] = df['item_description'].fillna('No description available.')

    # Features for the model (excluding target and non-numeric columns)
    features = ['calories', 'total_fat', 'saturated_fat', 'trans_fat',
               'cholesterol', 'sodium', 'carbohydrates', 'dietary_fiber',
               'sugar', 'protein']

    # Create target variable (health score)
    # Higher score = healthier (1-10 scale)
    df['health_score'] = (
        # Protein content (positive factor)
        (df['protein'] / df['calories']) * 3 +
        # Fiber content (positive factor)
        (df['dietary_fiber'] / df['calories']) * 2 -
        # Saturated fat (negative factor)
        (df['saturated_fat'] / df['calories']) * 2 -
        # Sugar content (negative factor)
        (df['sugar'] / df['calories']) * 2 -
        # Sodium content (negative factor)
        (df['sodium'] / 2000) * 1  # Daily value reference
    )

    # Normalize health score to 1-10 scale
    df['health_score'] = (df['health_score'] - df['health_score'].min()) / (df['health_score'].max() - df['health_score'].min()) * 9 + 1

    # Prepare features and target
    X = df[features]
    target = 'health_score'
    y = df[target]

    # Split the dataset into training and testing sets (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Initialize and train a Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Make predictions on the test set
    y_pred = model.predict(X_test)

    # Calculate performance metrics
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"Model Performance - MSE: {mse:.4f}, R²: {r2:.4f}")

    # Create a model package containing all necessary components
    model_package = {
        'model': model,
        'features': features,
        'data': df
    }
    
    # Save the model package
    with open('food_model.pkl', 'wb') as f:
        pickle.dump(model_package, f)
    
    print("Model successfully converted and saved!")

if __name__ == '__main__':
    convert_model()
