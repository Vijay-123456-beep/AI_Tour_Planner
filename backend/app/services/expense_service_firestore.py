"""
Firestore service module for expense management
Replaces in-memory storage with persistent Firestore database
"""
from firebase_admin import firestore
from datetime import datetime
from typing import List, Dict, Optional

class ExpenseService:
    def __init__(self):
        self.db = firestore.client()
        self.collection = 'expenses'
    
    def add_expense(self, user_id: str, itinerary_id: str, expense_data: Dict) -> Dict:
        """Add a new expense to Firestore"""
        try:
            expense_doc = {
                'user_id': user_id,
                'itinerary_id': itinerary_id,
                'description': expense_data.get('description'),
                'amount': float(expense_data.get('amount', 0)),
                'category': expense_data.get('category', 'misc'),
                'paid_by': expense_data.get('paid_by'),
                'split_among': expense_data.get('split_among', []),
                'notes': expense_data.get('notes', ''),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Add to Firestore and get the document reference
            doc_ref = self.db.collection(self.collection).add(expense_doc)
            doc_id = doc_ref[1].id
            expense_doc['id'] = doc_id
            
            return expense_doc
        except Exception as e:
            raise Exception(f"Error adding expense: {str(e)}")
    
    def get_itinerary_expenses(self, user_id: str, itinerary_id: str) -> List[Dict]:
        """Get all expenses for a specific itinerary"""
        try:
            expenses = []
            docs = self.db.collection(self.collection)\
                .where('user_id', '==', user_id)\
                .where('itinerary_id', '==', itinerary_id)\
                .order_by('created_at', direction=firestore.Query.DESCENDING)\
                .stream()
            
            for doc in docs:
                expense = doc.to_dict()
                expense['id'] = doc.id
                expenses.append(expense)
            
            return expenses
        except Exception as e:
            raise Exception(f"Error fetching expenses: {str(e)}")
    
    def delete_expense(self, user_id: str, expense_id: str) -> bool:
        """Delete an expense"""
        try:
            # Get the expense to verify ownership
            doc = self.db.collection(self.collection).document(expense_id).get()
            
            if not doc.exists:
                raise Exception("Expense not found")
            
            expense = doc.to_dict()
            if expense.get('user_id') != user_id:
                raise Exception("Unauthorized - cannot delete this expense")
            
            # Delete the document
            self.db.collection(self.collection).document(expense_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting expense: {str(e)}")
    
    def update_expense(self, user_id: str, expense_id: str, updates: Dict) -> Dict:
        """Update an expense"""
        try:
            # Get the expense to verify ownership
            doc = self.db.collection(self.collection).document(expense_id).get()
            
            if not doc.exists:
                raise Exception("Expense not found")
            
            expense = doc.to_dict()
            if expense.get('user_id') != user_id:
                raise Exception("Unauthorized - cannot update this expense")
            
            # Prepare update data
            update_data = {}
            allowed_fields = ['description', 'amount', 'category', 'paid_by', 'split_among', 'notes']
            
            for field in allowed_fields:
                if field in updates:
                    if field == 'amount':
                        update_data[field] = float(updates[field])
                    else:
                        update_data[field] = updates[field]
            
            update_data['updated_at'] = datetime.utcnow()
            
            # Update in Firestore
            self.db.collection(self.collection).document(expense_id).update(update_data)
            
            # Return updated expense
            updated_doc = self.db.collection(self.collection).document(expense_id).get()
            updated_expense = updated_doc.to_dict()
            updated_expense['id'] = expense_id
            
            return updated_expense
        except Exception as e:
            raise Exception(f"Error updating expense: {str(e)}")
    
    def calculate_splits(self, user_id: str, itinerary_id: str, travelers_count: int = 2) -> Dict:
        """Calculate expense splits for an itinerary"""
        try:
            expenses = self.get_itinerary_expenses(user_id, itinerary_id)
            
            total_amount = sum(exp.get('amount', 0) for exp in expenses)
            per_person = total_amount / travelers_count if travelers_count > 0 else 0
            
            splits = {}
            for exp in expenses:
                paid_by = exp.get('paid_by', 'Unknown')
                if paid_by not in splits:
                    splits[paid_by] = {'paid': 0, 'owes': 0}
                
                splits[paid_by]['paid'] += exp.get('amount', 0)
                
                split_among = exp.get('split_among', [])
                if split_among:
                    amount_per_person = exp.get('amount', 0) / len(split_among)
                    for person in split_among:
                        if person not in splits:
                            splits[person] = {'paid': 0, 'owes': 0}
                        splits[person]['owes'] += amount_per_person
            
            # Calculate settlements
            settlements = []
            for person, totals in splits.items():
                balance = totals['paid'] - totals['owes']
                if balance > 0.01:
                    settlements.append({
                        'person': person,
                        'amount': round(balance, 2),
                        'type': 'receives'
                    })
                elif balance < -0.01:
                    settlements.append({
                        'person': person,
                        'amount': round(abs(balance), 2),
                        'type': 'pays'
                    })
            
            return {
                'total_amount': round(total_amount, 2),
                'per_person': round(per_person, 2),
                'travelers_count': travelers_count,
                'splits': splits,
                'settlements': settlements,
                'expense_count': len(expenses)
            }
        except Exception as e:
            raise Exception(f"Error calculating splits: {str(e)}")
    
    def get_category_summary(self, user_id: str, itinerary_id: str) -> Dict:
        """Get expense summary grouped by category"""
        try:
            expenses = self.get_itinerary_expenses(user_id, itinerary_id)
            
            category_summary = {}
            for exp in expenses:
                category = exp.get('category', 'misc')
                if category not in category_summary:
                    category_summary[category] = {'total': 0, 'count': 0, 'items': []}
                
                category_summary[category]['total'] += exp.get('amount', 0)
                category_summary[category]['count'] += 1
                category_summary[category]['items'].append({
                    'id': exp.get('id'),
                    'description': exp.get('description'),
                    'amount': exp.get('amount'),
                    'paid_by': exp.get('paid_by')
                })
            
            return category_summary
        except Exception as e:
            raise Exception(f"Error getting category summary: {str(e)}")
