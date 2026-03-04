# AI-Powered Personalized Tour Planner 🌍✈️

A complete travel planning ecosystem that leverages AI to create personalized travel itineraries, manage expenses, and provide real-time travel insights.

## ✨ Key Features

### 🧠 AI & Planning
- **Smart Itinerary Generation**: Personalized trip plans powered by AI (OpenRouter/OpenAI).
- **AI Recommendations**: Get destination, activity, and budget suggestions.
- **Eco-Trip Sustainability**: Calculate and optimize your travel carbon footprint.
- **Cultural Compass**: AI-driven cultural etiquette and travel tips.

### 💰 Financial Management
- **Expense Tracking**: Log all your travel costs with cloud persistence.
- **Splitwise-style Splitting**: Automatic cost distribution among travel companions.
- **Smart Receipt Scanner**: AI-assisted OCR for quick expense logging.

### 🚗 Logistics & Real-time
- **Transport Hub**: Book jeeps, bikes, and cars with real-time availability.
- **Weather Watch**: 6-day forecasts with automated packing checklists.
- **Emergency Beacon**: AI-powered local emergency assistance and distress messaging.

### 👥 Collaboration
- **Real-time Interaction**: Integrated collaboration chat for group trips.
- **Shared Itineraries**: Invite buddies and plan together.

## 🛠️ Tech Stack

- **Frontend**: React.js 18, Material-UI (MUI), Context API.
- **Backend**: Python Flask 2.3, Socket.IO for real-time features.
- **Database**: MongoDB Atlas (Cloud) with local memory fallback.
- **AI Engine**: OpenRouter (Gemini, Llama, GPT-4 fallback support).
- **Communication**: JWT-based Authentication.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- MongoDB Atlas account (or local MongoDB)
- OpenRouter API Key

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_Tour_Planner
   ```

2. **Configure Backend**
   ```bash
   cd backend
   # Create .env file with following:
   # OPENROUTER_API_KEY=your_key
   # MONGODB_URI=your_mongodb_uri
   
   python -m venv .venv
   .\.venv\Scripts\activate  # On Linux/macOS: source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend (Terminal 1)**
   ```bash
   cd backend
   python app_dev.py
   ```
   *Expected: `[SUCCESS] MongoDB Connected Successfully!`*

2. **Start Frontend (Terminal 2)**
   ```bash
   cd frontend
   npm start
   ```
   *Expected: App running on http://localhost:3000*

## 📁 Project Structure

```
AI_Tour_Planner/
├── backend/               # Flask API
│   ├── app/              # Business logic & services
│   ├── app_dev.py        # Main entry point (Dev/Prod)
│   └── .env              # Configuration
├── frontend/             # React App
│   ├── src/
│   │   ├── pages/        # All feature pages
│   │   ├── contexts/     # Global state (Itinerary, Expense, etc.)
│   │   └── services/     # API integration
│   └── public/           # Static assets
└── Technical_Documentation.md # Detailed API & Architecture
```

## 📜 License

MIT License - see the LICENSE file for details.
