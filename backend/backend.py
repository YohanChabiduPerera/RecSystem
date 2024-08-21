import pickle
from flask import Flask, request, jsonify
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from geopy.geocoders import Nominatim
import pandas as pd

app = Flask(__name__)

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

@app.route('/predict_next_venue', methods=['POST'])
def predict_next_venue():
    data = request.get_json()
    user_id = data['user_id']
    user_history = data['user_history']

    # Prepare the last 10 venues visited by the user
    sample_sequence = le_venue.transform(user_history[-10:])
    sample_sequence = pad_sequences([sample_sequence], maxlen=10)

    # Predict the next venue
    lstm_prediction = lstm_model.predict(sample_sequence).argmax(axis=1)[0]
    predicted_venue_id = le_venue.inverse_transform([lstm_prediction])[0]

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
