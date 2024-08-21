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

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the saved models and encoders/scalers
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

# Load the CSV dataset
df = pd.read_csv('./data/dataset_TSMC2014_NYC.csv')

geolocator = Nominatim(user_agent="venue_locator")


# JSON file to store user data
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
    # Load existing user data
    user_data = load_user()

    # Find the user with the provided username and password
    for user in user_data:
        if user['username'] == username and user['password'] == password:
            return jsonify(user), 200
    
    # If authentication fails, return an error message
    return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data['username']
    password = data['password']

    # Load existing user data
    user_data = load_user()

    # Check if username already exists
    if any(user['username'] == username for user in user_data):
        return jsonify({'error': 'Username already exists'}), 400

    # Create a new user ID
    user_id = str(len(user_data) + 1)

    # Initialize the user's venue history as an empty list
    new_user = {
        'username': username,
        'user_id': user_id,
        'password': password,
        'venue_history': []
    }

    # Append the new user to the list of users
    user_data.append(new_user)

    # Save updated user data
    save_user(user_data)

    return jsonify({'message': 'Signup successful', 'userId': user_id})


@app.route('/predict_next_venue', methods=['POST'])
def predict_next_venue():
    data = request.get_json()
    user_id = data['user_id']
    user_history = data['venue_history']

    # Prepare the last 10 venues visited by the user
    sample_sequence = le_venue.transform(user_history[-10:])
    sample_sequence = pad_sequences([sample_sequence], maxlen=10)

    # Predict the next venue
    lstm_prediction = lstm_model.predict(sample_sequence).argmax(axis=1)[0]
    predicted_venue_id = le_venue.inverse_transform([lstm_prediction])[0]

    # Save the predicted venue ID to the user's venue history
    user_data = load_user()
    for user_info in user_data:
        if user_info['user_id'] == user_id:
            user_info['venue_history'].append(predicted_venue_id)
            break
    save_user(user_data)


    # Find the venue category and location
    predicted_venue_row = df[df['venueId'] == predicted_venue_id].iloc[0]
    predicted_venue_category = predicted_venue_row['venueCategory']
    predicted_venue_latitude = predicted_venue_row['latitude']
    predicted_venue_longitude = predicted_venue_row['longitude']

     # Get the exact location using reverse geocoding
    exact_location, coordinates = get_exact_location(predicted_venue_latitude, predicted_venue_longitude)

    response = {
        'predicted_venue_id': predicted_venue_id,
        'predicted_venue_category': predicted_venue_category,
        'exact_location': exact_location,
        'coordinates': coordinates
    }

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

    # Add the new rating
    user_ratings.append({
        'user_id': user_id,
        "input_coordinates": [user_latitude, user_longitude], 
        'venue_id': venue_id,
        'rating': rating
    })

    # Save the updated ratings back to the file
    with open('./data/user_ratings.json', 'w') as file:
        json.dump(user_ratings, file, indent=4)

    return jsonify({'message': 'Rating submitted successfully'})

@app.route('/recommend_nearby_venues', methods=['POST'])
def recommend_nearby_venues():
    data = request.get_json()
    user_id = data['user_id']
    user_latitude = data['user_latitude']
    user_longitude = data['user_longitude']

    # Find the nearest neighbors
    user_location = np.array([[user_latitude, user_longitude]])
    knn_distances, knn_indices = knn_model.kneighbors(user_location)

    # Get the recommended venues
    recommended_venues = df.iloc[knn_indices[0]]
    recommended_venue_ids = recommended_venues['venueId'].unique().tolist()
    recommended_venue_categories = recommended_venues['venueCategory'].unique().tolist()

    # Save the first recommended venue ID to the user's venue history
    first_recommended_venue_id = recommended_venue_ids[0] if recommended_venue_ids else None
    if first_recommended_venue_id:
        user_data = load_user()
        for user_info in user_data:
            if user_info['user_id'] == user_id:
                user_info['venue_history'].append(first_recommended_venue_id)
                break
        save_user(user_data)

    # Prepare the response
    venue_list = []
    for _, venue in recommended_venues.iterrows():
        exact_location, coordinates = get_exact_location(venue['latitude'], venue['longitude'])
        venue_list.append({
            'venue_id': venue['venueId'],
            'venue_category': venue['venueCategory'],
            'location': exact_location,
            'coordinates': coordinates
        })

    response = {
        'recommended_venues': venue_list,
        'recommended_venue_categories': recommended_venue_categories
    }

    return jsonify(response)

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

if __name__ == '__main__':
    app.run(debug=True)