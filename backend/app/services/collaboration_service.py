from firebase_admin import firestore
from datetime import datetime
import uuid

class CollaborationService:
    def __init__(self):
        self.db = firestore.client()
    
    def invite_traveler(self, inviter_id, trip_id, email, role='traveler'):
        """Invite a traveler to collaborate on a trip"""
        # Check if inviter has permission
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        if inviter_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to invite to this trip')
        
        # Create invitation
        invitation_id = str(uuid.uuid4())
        invitation_ref = self.db.collection('invitations').document(invitation_id)
        
        invitation_ref.set({
            'id': invitation_id,
            'trip_id': trip_id,
            'trip_name': trip_data.get('name', 'Unnamed Trip'),
            'inviter_id': inviter_id,
            'invitee_email': email,
            'role': role,
            'status': 'pending',  # pending, accepted, rejected
            'created_at': firestore.SERVER_TIMESTAMP,
            'expires_at': firestore.SERVER_TIMESTAMP + firestore.DELTA(days=7)
        })
        
        # In a real app, send email notification here
        
        return {
            'message': f'Invitation sent to {email}',
            'invitation_id': invitation_id
        }
    
    def get_trip_members(self, user_id, trip_id):
        """Get all members of a trip"""
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        # Check if user has access to this trip
        if user_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to view this trip')
            
        # Get detailed member information
        members = []
        for member in trip_data.get('members', []):
            user_doc = self.db.collection('users').document(member['user_id']).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                members.append({
                    'user_id': member['user_id'],
                    'name': user_data.get('name', 'Unknown User'),
                    'email': user_data.get('email'),
                    'role': member.get('role', 'traveler'),
                    'joined_at': member.get('joined_at')
                })
                
        return members
    
    def add_expense(self, trip_id, user_id, amount, description, category, paid_by, split_between=None, date=None):
        """Add an expense to a trip"""
        # Validate input
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError('Amount must be positive')
        except (ValueError, TypeError):
            raise ValueError('Invalid amount')
            
        # Get trip to verify access
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        # Verify user has access to this trip
        if user_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to add expenses to this trip')
        
        # If split_between is not provided, split equally among all members
        if not split_between:
            split_between = [m['user_id'] for m in trip_data.get('members', [])]
            
        # Create expense record
        expense_id = str(uuid.uuid4())
        expense_ref = self.db.collection('expenses').document(expense_id)
        
        expense_data = {
            'id': expense_id,
            'trip_id': trip_id,
            'amount': amount,
            'description': description,
            'category': category,
            'paid_by': paid_by,
            'split_between': split_between,
            'created_by': user_id,
            'created_at': firestore.SERVER_TIMESTAMP,
            'date': date or firestore.SERVER_TIMESTAMP
        }
        
        expense_ref.set(expense_data)
        
        # Update trip's total expenses
        trip_ref.update({
            'total_expenses': firestore.Increment(amount),
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return expense_data
    
    def get_expenses(self, user_id, trip_id):
        """Get all expenses for a trip"""
        # Verify user has access to this trip
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        if user_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to view expenses for this trip')
            
        # Get all expenses for this trip
        expenses_ref = self.db.collection('expenses')
        query = expenses_ref.where('trip_id', '==', trip_id).order_by('date', 'DESENDING')
        
        expenses = []
        for doc in query.stream():
            expense = doc.to_dict()
            # Convert Firestore timestamp to ISO format
            if 'date' in expense and hasattr(expense['date'], 'isoformat'):
                expense['date'] = expense['date'].isoformat()
            expenses.append(expense)
            
        return expenses
    
    def calculate_settlements(self, user_id, trip_id):
        """Calculate who owes what to whom for a trip"""
        # Verify user has access to this trip
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        members = [m['user_id'] for m in trip_data.get('members', [])]
        
        if user_id not in members:
            raise Exception('You do not have permission to view settlements for this trip')
            
        # Get all expenses for this trip
        expenses_ref = self.db.collection('expenses')
        query = expenses_ref.where('trip_id', '==', trip_id).stream()
        
        # Calculate total spent by each user and total amount per person
        user_balances = {user_id: 0.0 for user_id in members}
        
        for doc in query:
            expense = doc.to_dict()
            amount = float(expense['amount'])
            paid_by = expense['paid_by']
            split_between = expense.get('split_between', members)
            
            # Add to paid_by's balance
            user_balances[paid_by] = user_balances.get(paid_by, 0) + amount
            
            # Subtract from each person's share
            share = amount / len(split_between) if split_between else 0
            for user_id in split_between:
                user_balances[user_id] = user_balances.get(user_id, 0) - share
        
        # Calculate who owes what to whom
        creditors = {}
        debtors = {}
        
        for user_id, balance in user_balances.items():
            if balance > 0:
                creditors[user_id] = round(balance, 2)
            elif balance < 0:
                debtors[user_id] = round(-balance, 2)
        
        # Simple settlement algorithm
        settlements = []
        
        for debtor_id, debt_amount in debtors.items():
            remaining_debt = debt_amount
            
            # Sort creditors by amount (descending)
            sorted_creditors = sorted(creditors.items(), key=lambda x: x[1], reverse=True)
            
            for creditor_id, credit_amount in sorted_creditors:
                if remaining_debt <= 0 or credit_amount <= 0:
                    continue
                    
                settlement_amount = min(remaining_debt, credit_amount)
                
                # Add settlement
                settlements.append({
                    'from': debtor_id,
                    'to': creditor_id,
                    'amount': settlement_amount
                })
                
                # Update remaining amounts
                remaining_debt -= settlement_amount
                creditors[creditor_id] -= settlement_amount
                
                if remaining_debt <= 0:
                    break
        
        # Get user details for the response
        user_details = {}
        for user_id in set([s['from'] for s in settlements] + [s['to'] for s in settlements]):
            user_doc = self.db.collection('users').document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_details[user_id] = {
                    'name': user_data.get('name', 'Unknown User'),
                    'email': user_data.get('email')
                }
        
        # Add user details to settlements
        for settlement in settlements:
            settlement['from_user'] = user_details.get(settlement['from'], {'name': 'Unknown User'})
            settlement['to_user'] = user_details.get(settlement['to'], {'name': 'Unknown User'})
        
        return {
            'settlements': settlements,
            'total_expenses': sum(user_balances.values()) / 2,  # Each expense is counted twice (once +, once -)
            'user_balances': {
                user_id: {
                    'balance': balance,
                    'user': user_details.get(user_id, {'name': 'Unknown User'})
                }
                for user_id, balance in user_balances.items()
            }
        }
    
    def add_chat_message(self, trip_id, user_id, message):
        """Add a chat message to a trip"""
        # Verify user has access to this trip
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        if user_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to post in this trip')
            
        # Get user details
        user_doc = self.db.collection('users').document(user_id).get()
        if not user_doc.exists:
            raise Exception('User not found')
            
        user_data = user_doc.to_dict()
        
        # Create chat message
        message_id = str(uuid.uuid4())
        message_ref = self.db.collection('chat_messages').document(message_id)
        
        message_data = {
            'id': message_id,
            'trip_id': trip_id,
            'user_id': user_id,
            'user_name': user_data.get('name', 'Unknown User'),
            'user_avatar': user_data.get('photo_url'),
            'message': message,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        message_ref.set(message_data)
        
        # Update trip's last_activity
        trip_ref.update({
            'last_activity': firestore.SERVER_TIMESTAMP
        })
        
        return message_data
    
    def get_chat_messages(self, user_id, trip_id, limit=100):
        """Get chat messages for a trip"""
        # Verify user has access to this trip
        trip_ref = self.db.collection('trips').document(trip_id)
        trip = trip_ref.get()
        
        if not trip.exists:
            raise Exception('Trip not found')
            
        trip_data = trip.to_dict()
        
        if user_id not in [m['user_id'] for m in trip_data.get('members', [])]:
            raise Exception('You do not have permission to view messages for this trip')
            
        # Get chat messages
        messages_ref = self.db.collection('chat_messages')
        query = messages_ref.where('trip_id', '==', trip_id)
        
        # Order by creation date (newest first) and limit results
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        messages = []
        for doc in query.stream():
            message = doc.to_dict()
            # Convert Firestore timestamp to ISO format
            if 'created_at' in message and hasattr(message['created_at'], 'isoformat'):
                message['created_at'] = message['created_at'].isoformat()
            messages.append(message)
        
        # Return messages in chronological order (oldest first)
        return sorted(messages, key=lambda x: x.get('created_at', ''))
