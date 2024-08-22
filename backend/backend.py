import json
import os
import pickle
from flask import Flask, request, jsonify
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from geopy.geocoders import Nominatim
import pandas as pd
import math

from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity


app = Flask(__name__)
CORS(app)

with open('./modelv2/lstm_model.pkl', 'rb') as file:
    lstm_model = pickle.load(file)

with open('./modelv2/knn_model.pkl', 'rb') as file:
    knn_model = pickle.load(file)

with open('./modelv2/le_user.pkl', 'rb') as file:
    le_user = pickle.load(file)

with open('./modelv2/le_venue.pkl', 'rb') as file:
    le_venue = pickle.load(file)

with open('./modelv2/scaler.pkl', 'rb') as file:
    scaler = pickle.load(file)

df = pd.read_csv('./data/dataset_TSMC2014_NYC.csv')

geolocator = Nominatim(user_agent="venue_locator")


USER_DATA_FILE = './data/users.json'

# Ensure the user data file exists
if not os.path.exists(USER_DATA_FILE):
    with open(USER_DATA_FILE, 'w') as file:
        json.dump({}, file)

def save_user_data(user_data):
    with open(USER_DATA_FILE, 'w') as file:
        json.dump(user_data, file, indent=4)

def load_user_data():
    with open(USER_DATA_FILE, 'r') as file:
        return json.load(file)

def save_user(user_data):
    with open(USER_DATA_FILE, 'w') as file:
        json.dump({'users': user_data}, file, indent=4)

def load_user():
    with open(USER_DATA_FILE, 'r') as file:
        return json.load(file).get('users', [])

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    print("username", username)
    print("password", password)
    user_data = load_user()

    for user in user_data:
        if user['username'] == username and user['password'] == password:
            return jsonify(user), 200
    
    return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data['username']
    password = data['password']

    user_data = load_user()

    if any(user['username'] == username for user in user_data):
        return jsonify({'error': 'Username already exists'}), 400

    user_id = str(len(user_data) + 1)

    new_user = {
        'username': username,
        'user_id': user_id,
        'password': password,
        'venue_history': []
    }

    user_data.append(new_user)
    save_user(user_data)

    return jsonify({'message': 'Signup successful', 'userId': user_id})


def user_user_collaborative_filtering(target_user_id, user_data, user_ratings, n_similar_users=5, n_recommendations=10):
    user_venue_matrix = pd.DataFrame(columns=['user_id', 'venue_id', 'rating'])
    
    # Add venue history data
    for user in user_data:
        for venue in user['venue_history']:
            new_row = pd.DataFrame({
                'user_id': [user['user_id']],
                'venue_id': [venue],
                'rating': [1]  # Default rating for visited venues
            })
            user_venue_matrix = pd.concat([user_venue_matrix, new_row], ignore_index=True)
    
    # Add rating data
    for rating in user_ratings:
        new_row = pd.DataFrame({
            'user_id': [rating['user_id']],
            'venue_id': [rating['venue_id']],
            'rating': [rating['rating']]
        })
        user_venue_matrix = pd.concat([user_venue_matrix, new_row], ignore_index=True)
    
    # Group by user_id and venue_id, and take the maximum rating
    user_venue_matrix = user_venue_matrix.groupby(['user_id', 'venue_id'])['rating'].max().reset_index()
    
    matrix = user_venue_matrix.pivot(index='user_id', columns='venue_id', values='rating').fillna(0)
    
    if target_user_id not in matrix.index:
        return []
    
    user_similarity = cosine_similarity(matrix)
    user_similarity_df = pd.DataFrame(user_similarity, index=matrix.index, columns=matrix.index)
    
    # Find most similar users
    similar_users = user_similarity_df[target_user_id].sort_values(ascending=False)[1:n_similar_users+1].index.tolist()
    
    # Get venues visited by similar users but not by target user
    target_user_venues = set(matrix.loc[target_user_id][matrix.loc[target_user_id] > 0].index)
    recommendations = set()
    for user in similar_users:
        user_venues = set(matrix.loc[user][matrix.loc[user] > 0].index)
        recommendations.update(user_venues - target_user_venues)
    
    return list(recommendations)[:n_recommendations]


def predict_lstm(venue_history):
    sample_sequence = le_venue.transform(venue_history[-10:])
    sample_sequence = pad_sequences([sample_sequence], maxlen=10)
    lstm_prediction = lstm_model.predict(sample_sequence).argmax(axis=1)[0]
    return le_venue.inverse_transform([lstm_prediction])[0]

def recommend_knn(user_latitude, user_longitude):
    user_location = np.array([[user_latitude, user_longitude]])
    knn_distances, knn_indices = knn_model.kneighbors(user_location)
    return df.iloc[knn_indices[0]].to_dict('records')

def calculate_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in kilometers
    R = 6371

    # Convert latitude and longitude to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Difference in coordinates
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    # Haversine formula
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    distance = R * c

    return distance

def get_exact_location(latitude, longitude):
    location = geolocator.reverse((latitude, longitude), exactly_one=True)
    if location:
        address = location.address
        coordinates = {
            'latitude': location.latitude,
            'longitude': location.longitude
        }
        return address, coordinates
    else:
        return "Location not found", {'latitude': latitude, 'longitude': longitude}
    
@app.route('/recommend_destination', methods=['POST'])
def recommend_destination():
    data = request.get_json()
    user_id = data['user_id']
    user_latitude = data['user_latitude']
    user_longitude = data['user_longitude']

    user_data = load_user()
    user_info = next((user for user in user_data if user['user_id'] == user_id), None)

    # Load user ratings
    with open('./data/user_ratings.json', 'r') as file:
        user_ratings = json.load(file)

    collaborative_recommendations = user_user_collaborative_filtering(user_id, user_data, user_ratings)

    if user_info and len(user_info['venue_history']) >= 10:
        lstm_prediction = predict_lstm(user_info['venue_history'])
        lstm_venue = df[df['venueId'] == lstm_prediction].iloc[0]
        lstm_score = 1  # Base score for LSTM prediction

        knn_venues = recommend_knn(user_latitude, user_longitude)
        
        combined_venues = [lstm_venue] + knn_venues + [df[df['venueId'] == venue_id].iloc[0] for venue_id in collaborative_recommendations]
        
        # Score venues based on distance from user, LSTM prediction, and collaborative filtering
        for venue in combined_venues:
            venue_lat, venue_lon = venue['latitude'], venue['longitude']
            distance = calculate_distance(user_latitude, user_longitude, venue_lat, venue_lon)
            venue['score'] = 1 / (1 + distance)
            if venue['venueId'] == lstm_prediction:
                venue['score'] += lstm_score
            if venue['venueId'] in collaborative_recommendations:
                venue['score'] += 0.5  # Add a score for collaborative filtering recommendations

        best_venue = max(combined_venues, key=lambda x: x['score'])

    else:
        # Use KNN model and collaborative filtering for cold start
        knn_venues = recommend_knn(user_latitude, user_longitude)
        collaborative_venues = [df[df['venueId'] == venue_id].iloc[0] for venue_id in collaborative_recommendations]
        combined_venues = knn_venues + collaborative_venues
        
        for venue in combined_venues:
            venue_lat, venue_lon = venue['latitude'], venue['longitude']
            distance = calculate_distance(user_latitude, user_longitude, venue_lat, venue_lon)
            venue['score'] = 1 / (1 + distance)
            if venue['venueId'] in collaborative_recommendations:
                venue['score'] += 0.5

        best_venue = max(combined_venues, key=lambda x: x['score'])

    exact_location, coordinates = get_exact_location(best_venue['latitude'], best_venue['longitude'])
    response = {
        'venue_id': best_venue['venueId'],
        'venue_category': best_venue['venueCategory'],
        'location': exact_location,
        'coordinates': coordinates
    }

    if user_info:
        user_info['venue_history'].append(best_venue['venueId'])
        save_user(user_data)

    return jsonify(response)


@app.route('/submit_rating', methods=['POST'])
def submit_rating():
    data = request.get_json()
    user_id = data['user_id']
    venue_id = data['venue_id']
    rating = data['rating']
    user_latitude = data['user_latitude']
    user_longitude = data['user_longitude']

    # Load existing ratings from file or create a new list if the file does not exist
    try:
        with open('./data/user_ratings.json', 'r') as file:
            user_ratings = json.load(file)
    except FileNotFoundError:
        user_ratings = []

    user_ratings.append({
        'user_id': user_id,
        "input_coordinates": [user_latitude, user_longitude], 
        'venue_id': venue_id,
        'rating': rating
    })

    with open('./data/user_ratings.json', 'w') as file:
        json.dump(user_ratings, file, indent=4)

    return jsonify({'message': 'Rating submitted successfully'})

if __name__ == '__main__':
    app.run(debug=True)