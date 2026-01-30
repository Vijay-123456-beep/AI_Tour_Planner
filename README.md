# AI-Powered Personalized Tour Planner

A comprehensive travel planning platform that leverages AI to create personalized travel itineraries with social collaboration features, real-time updates, and smart packing recommendations.

## Features

- 🧠 AI-Powered Itinerary Generation
- 👥 Social Collaboration & Cost Sharing
- ⚡ Real-time Alerts & Adaptive Recommendations
- 🎒 Dynamic Packing List Generator
- 🗺️ Interactive Maps & Route Optimization
- 🔐 Secure Authentication & User Profiles

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Python Flask
- **Database**: Firebase (Authentication & Firestore)
- **Maps**: Google Maps API
- **AI/ML**: Python (scikit-learn, TensorFlow)
- **Deployment**: Docker, Heroku/Netlify

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python (3.8+)
- Firebase account
- Google Cloud Platform account (for Maps API)

### Installation

1. Clone the repository
2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables (see .env.example files)

5. Run the development servers:
   ```bash
   # In backend directory
   python app.py
   
   # In frontend directory
   npm start
   ```

## Project Structure

```
AI_Tour_Planner/
├── backend/               # Flask server
│   ├── app/              # Application package
│   ├── config.py         # Configuration
│   ├── requirements.txt  # Python dependencies
│   └── app.py            # Application entry point
├── frontend/             # React application
│   ├── public/           # Static files
│   └── src/              # React source code
├── docs/                 # Documentation
└── README.md             # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
