import requests
import json

url = "http://localhost:5000/api/itinerary/test-id/chat"
payload = {"user": "test-user", "text": "Hello from test script"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
