# Quick Start Guide - WanderWise with Firestore

## System Status

✅ **Backend**: Flask server with Firestore integration ready  
✅ **Frontend**: React app with updated services  
✅ **Firebase**: Credentials configured and loaded  
✅ **Services**: All API clients ready  

---

## Running the Application

### Option 1: Start Both Services (Recommended)

**Terminal 1 - Backend**:
```powershell
cd c:\Users\vijay\OneDrive\Desktop\AI_Tour_Planner\backend
.\.venv\Scripts\Activate
python app.py
# Expected: Flask server running on http://localhost:5000
```

**Terminal 2 - Frontend**:
```powershell
cd c:\Users\vijay\OneDrive\Desktop\AI_Tour_Planner\frontend
npm start
# Expected: React app running on http://localhost:3001
```

**Terminal 3 - Monitor (Optional)**:
```powershell
cd c:\Users\vijay\OneDrive\Desktop\AI_Tour_Planner
# Watch for changes and keep track of both servers
```

### Option 2: Manual Startup Script

Create a file called `start-servers.ps1` in your project root:

```powershell
# Start backend
Start-Process powershell -ArgumentList {
    Set-Location "c:\Users\vijay\OneDrive\Desktop\AI_Tour_Planner\backend"
    .\.venv\Scripts\Activate
    python app.py
}

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList {
    Set-Location "c:\Users\vijay\OneDrive\Desktop\AI_Tour_Planner\frontend"
    npm start
}

Write-Host "Backend and Frontend servers starting..."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3001"
```

Run it:
```powershell
.\start-servers.ps1
```

---

## Access the Application

1. Open browser to **http://localhost:3001**
2. Login/Register with test credentials
3. Start creating itineraries!

---

## Feature Overview

### 🏖️ Create Itineraries
- Destination, dates, budget
- Travelers count
- Interests selection
- Auto-persisted in Firestore

### 💰 Track Expenses
- Add expenses with categories
- Split expenses among travelers
- View category breakdown
- Calculate who owes whom

### 🚗 Book Transport
- Select from available transport options
- Book jeeps, bikes, or cabs
- Track all bookings per itinerary
- Update or cancel bookings

### 🌤️ Weather Integration
- Get forecasts for your destination
- Personalized packing recommendations
- Health tips based on climate

---

## Firestore Integration

### What Gets Saved in Firestore?

| Item | Collection | Persisted | Query |
|------|-----------|-----------|-------|
| Itineraries | `itineraries` | ✅ Yes | By user_id |
| Expenses | `expenses` | ✅ Yes | By itinerary_id |
| Transport Bookings | `transport_bookings` | ✅ Yes | By itinerary_id |

### Data Flow

```
Frontend (React) 
  ↓
API Client (with JWT token)
  ↓
Flask Route Handler (validates JWT)
  ↓
Firestore Service (authorizes user_id)
  ↓
Firestore Database (persistent storage)
  ↓
Auto-sync back to frontend
```

---

## Key API Endpoints

### Itineraries
```
POST   /api/itinerary/create                 - Create itinerary
GET    /api/itinerary/                       - Get all user's itineraries
GET    /api/itinerary/{id}                   - Get specific itinerary
PUT    /api/itinerary/{id}/update            - Update itinerary
DELETE /api/itinerary/{id}                   - Delete itinerary
GET    /api/itinerary/{id}/stats             - Get stats (expenses, transport, budget)
```

### Expenses
```
POST   /api/expenses/add                     - Add expense
GET    /api/expenses/itinerary/{id}          - Get expenses for itinerary
PUT    /api/expenses/{id}                    - Update expense
DELETE /api/expenses/{id}                    - Delete expense
GET    /api/expenses/split-calculation/{id}  - Calculate splits
GET    /api/expenses/category-summary/{id}   - Get category breakdown
```

### Transport
```
GET    /api/transport/options                - Get available transport
POST   /api/transport/book                   - Book transport
GET    /api/transport/bookings               - Get all user's bookings
GET    /api/transport/itinerary/{id}/bookings - Get bookings for itinerary
GET    /api/transport/bookings/{id}          - Get booking details
PUT    /api/transport/{id}                   - Update booking
DELETE /api/transport/{id}                   - Delete booking
```

---

## Testing Workflow

### Test 1: Create Itinerary
1. Navigate to "My Itineraries" page
2. Click "Create Itinerary"
3. Fill in:
   - Destination: "Maredumilli Forest"
   - Start Date: Choose date
   - End Date: Choose later date
   - Budget: 50000
   - Select interests
4. Click Submit
5. ✅ Should see itinerary in list
6. ✅ Data saved in Firestore `itineraries` collection

### Test 2: Add Expenses
1. From itinerary view, go to Expenses tab
2. Click "Add Expense"
3. Fill in:
   - Description: "Lunch"
   - Amount: 500
   - Category: "Food"
   - Paid by: Your name
   - Split among: Select names
4. Click Submit
5. ✅ Expense appears in list
6. ✅ Data saved in Firestore `expenses` collection

### Test 3: Book Transport
1. From itinerary view, go to Transport tab
2. Click "Book Transport"
3. Select provider (Jeep, Bike, or Cab)
4. Fill in dates and travelers
5. Click Book
6. ✅ Booking appears in list
7. ✅ Data saved in Firestore `transport_bookings` collection

### Test 4: Verify Persistence
1. Create an itinerary with expenses and bookings
2. Refresh the browser (F5)
3. ✅ All data reloads from Firestore
4. ✅ No data loss

### Test 5: Test Authorization
1. Create a second user account (different email)
2. Try accessing first user's itinerary with different user
3. ✅ Get "Unauthorized" error
4. ✅ Cannot see other user's data

---

## Debugging Tips

### Check Backend Errors
```bash
# In backend terminal, look for errors like:
# - Firebase credentials not found
# - Firestore connection error
# - JWT validation error
```

### Check Frontend Errors
```bash
# Press F12 in browser to open DevTools
# Check Console tab for errors
# Common issues:
# - 401 Unauthorized (JWT token expired)
# - 403 Forbidden (User authorization failed)
# - 500 Server Error (Backend error)
```

### Monitor Firestore

Visit [Firebase Console](https://console.firebase.google.com/):
1. Select project `ai-tour-planner-502d1`
2. Go to Firestore Database
3. View collections in real-time:
   - `itineraries`
   - `expenses`
   - `transport_bookings`

### Verify JWT Token

Check browser storage:
1. Press F12 (DevTools)
2. Go to Application tab
3. Check localStorage for `token`
4. Token format: `Bearer eyJhbGc...` (JWT)

---

## Common Issues & Solutions

### Issue: "Cannot find firebase-credentials.json"
**Solution**: Ensure file exists at:
```
backend/firebase-credentials.json
```

### Issue: "TypeError: Cannot read property 'collection' of undefined"
**Solution**: Firebase not initialized. Check credentials are valid.

### Issue: Frontend shows "Unauthorized" on every request
**Solution**: 
1. Check JWT token is being sent
2. Verify token format in Authorization header
3. Check token hasn't expired

### Issue: Firestore shows no data
**Solution**:
1. Verify collections are being created
2. Check security rules allow read/write
3. Confirm user_id is matching

### Issue: "npm start" fails
**Solution**:
```bash
cd frontend
npm install --no-audit --no-fund
npm start
```

### Issue: Backend won't start
**Solution**:
```bash
cd backend
pip install --upgrade -r requirements.txt
python app.py
```

---

## Performance Tips

### For Better Speed

1. **Enable Firestore Indexes** (See FIREBASE_SETUP_GUIDE.md)
2. **Reduce Re-renders**: Use React DevTools profiler
3. **Optimize Images**: Compress large images
4. **Use Pagination**: For large result sets (coming in Phase 3)

### Monitor Usage

Visit Firebase Console → Firestore → Usage:
- Track read/write operations
- Monitor storage growth
- Estimate monthly costs

---

## Before Going to Production

### Required Steps
- [ ] Set production security rules in Firestore
- [ ] Enable CORS properly for your domain
- [ ] Update API base URL for production
- [ ] Configure environment variables
- [ ] Set up automated backups
- [ ] Enable Google Cloud monitoring
- [ ] Test all features thoroughly
- [ ] Get SSL certificate for HTTPS
- [ ] Update API documentation

### Security Checklist
- [ ] Remove debug logging from production
- [ ] Validate all inputs on backend
- [ ] Set proper CORS headers
- [ ] Use HTTPS only
- [ ] Implement rate limiting
- [ ] Add request timeout handling
- [ ] Secure JWT secret key

---

## File Structure Reference

```
AI_Tour_Planner/
├── backend/
│   ├── .venv/                          # Python virtual environment
│   ├── app.py                          # Flask entry point
│   ├── firebase-credentials.json       # Firebase service account
│   ├── requirements.txt                # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── routes/
│       │   ├── itinerary.py           # Firestore integrated
│       │   ├── expense.py             # Firestore integrated
│       │   └── transport.py           # Firestore integrated
│       └── services/
│           ├── itinerary_service_firestore.py
│           ├── expense_service_firestore.py
│           └── transport_service_firestore.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── pages/
│   │   │   └── index.js               # Updated with API calls
│   │   ├── services/
│   │   │   ├── api.js                 # Base axios config
│   │   │   ├── itineraryService.js   # NEW - Firestore integration
│   │   │   ├── transportService.js   # Updated with itinerary_id
│   │   │   └── expenseService.js     # Compatible
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   ├── ItineraryContext.js
│   │   │   ├── TransportContext.js
│   │   │   └── ExpenseContext.js
│   │   └── components/
│   │       └── Layout.js
│   └── package.json
│
├── PHASE_2_FIRESTORE_INTEGRATION.md   # Implementation details
├── FIREBASE_SETUP_GUIDE.md            # Setup instructions
├── FRONTEND_SERVICE_UPDATES.md        # Service changes
├── DEPLOYMENT_CHECKLIST.md            # Pre-production checklist
└── README.md
```

---

## Next Phase (Phase 3)

After verifying Firestore integration works:

1. **AI Itinerary Generation**
   - ML recommendations based on interests
   - Route optimization
   - Budget optimization

2. **Group Collaboration**
   - Real-time expense sharing
   - Multi-user editing
   - Group notifications

3. **Advanced Features**
   - Mobile app support
   - PDF export
   - Real-time sync

---

## Support Resources

📖 **Documentation**:
- [PHASE_2_FIRESTORE_INTEGRATION.md](./PHASE_2_FIRESTORE_INTEGRATION.md) - Detailed implementation
- [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) - Setup details
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Production checklist

🔗 **External Resources**:
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)

💬 **Troubleshooting**:
- Check browser console (F12)
- Check backend terminal output
- Visit Firebase Console to verify data
- Review error messages in API responses

---

## Success Indicators

You'll know everything is working when:

✅ Backend starts without Firebase errors  
✅ Frontend loads on http://localhost:3001  
✅ Can create itinerary → appears in Firestore  
✅ Can add expenses → persists after refresh  
✅ Can book transport → shows in itinerary  
✅ No authorization errors with correct user  
✅ Cannot access other user's data  
✅ All data loads from Firestore on page refresh  

---

## Ready to Start!

Everything is configured and ready. Just run:

```bash
# Terminal 1
cd backend && .\.venv\Scripts\Activate && python app.py

# Terminal 2
cd frontend && npm start

# Then visit http://localhost:3001
```

Enjoy building WanderWise! 🧳✈️
