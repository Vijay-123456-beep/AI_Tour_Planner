"""
Collaboration Service for Group Travel Planning
Handles collaborative itineraries, shared expenses, and group discussions
"""

from datetime import datetime
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import firestore


class CollaborationService:
    """Service for managing collaborative travel planning"""
    
    def __init__(self):
        self.db = firestore.client()
    
    def create_group_itinerary(
        self,
        created_by: str,
        itinerary_name: str,
        itinerary_id: str,
        members: List[str],
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Create a group/collaborative itinerary
        
        Args:
            created_by: User ID of creator
            itinerary_name: Name of the collaborative itinerary
            itinerary_id: Original itinerary ID to base collaboration on
            members: List of user IDs to add to the group
            description: Group description
        
        Returns:
            Created group itinerary document
        """
        try:
            # Validate itinerary exists
            itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
            itinerary = itinerary_ref.get()
            
            if not itinerary.exists:
                raise ValueError("Itinerary not found")
            
            # Create group document
            group_data = {
                'name': itinerary_name,
                'description': description,
                'itinerary_id': itinerary_id,
                'created_by': created_by,
                'members': members + [created_by],  # Add creator as member
                'role_assignments': {
                    created_by: 'organizer',
                    **{member: 'member' for member in members}
                },
                'shared_expenses': [],
                'voting_active': False,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
            }
            
            # Add to Firestore
            doc_ref = self.db.collection('collaboration_groups').document()
            doc_ref.set(group_data)
            
            return {
                'id': doc_ref.id,
                **group_data,
                'created_at': group_data['created_at'].isoformat(),
                'updated_at': group_data['updated_at'].isoformat(),
            }
        
        except Exception as e:
            raise Exception(f"Failed to create group itinerary: {str(e)}")
    
    def add_member_to_group(
        self,
        group_id: str,
        user_id: str,
        added_by: str,
        role: str = 'member'
    ) -> Dict[str, Any]:
        """Add a member to collaborative group"""
        try:
            group_ref = self.db.collection('collaboration_groups').document(group_id)
            group = group_ref.get()
            
            if not group.exists:
                raise ValueError("Group not found")
            
            group_data = group.data()
            
            # Check if user is already member
            if user_id in group_data['members']:
                raise ValueError("User is already a member")
            
            # Update group
            group_data['members'].append(user_id)
            group_data['role_assignments'][user_id] = role
            group_data['updated_at'] = datetime.utcnow()
            
            group_ref.set(group_data)
            
            return {
                'id': group_id,
                **group_data,
                'created_at': group_data['created_at'].isoformat(),
                'updated_at': group_data['updated_at'].isoformat(),
            }
        
        except Exception as e:
            raise Exception(f"Failed to add member: {str(e)}")
    
    def remove_member_from_group(
        self,
        group_id: str,
        user_id: str,
        removed_by: str
    ) -> Dict[str, Any]:
        """Remove a member from collaborative group"""
        try:
            group_ref = self.db.collection('collaboration_groups').document(group_id)
            group = group_ref.get()
            
            if not group.exists:
                raise ValueError("Group not found")
            
            group_data = group.data()
            
            # Check if user is member
            if user_id not in group_data['members']:
                raise ValueError("User is not a member")
            
            # Cannot remove if only member
            if len(group_data['members']) == 1:
                raise ValueError("Cannot remove the only member")
            
            # Remove member
            group_data['members'].remove(user_id)
            del group_data['role_assignments'][user_id]
            group_data['updated_at'] = datetime.utcnow()
            
            group_ref.set(group_data)
            
            return {
                'id': group_id,
                **group_data,
                'created_at': group_data['created_at'].isoformat(),
                'updated_at': group_data['updated_at'].isoformat(),
            }
        
        except Exception as e:
            raise Exception(f"Failed to remove member: {str(e)}")
    
    def add_shared_expense(
        self,
        group_id: str,
        paid_by: str,
        description: str,
        amount: float,
        split_among: List[str],
        category: str = 'general'
    ) -> Dict[str, Any]:
        """Add a shared expense to group (splits automatically)"""
        try:
            group_ref = self.db.collection('collaboration_groups').document(group_id)
            group = group_ref.get()
            
            if not group.exists:
                raise ValueError("Group not found")
            
            group_data = group.data()
            
            # Validate payer is member
            if paid_by not in group_data['members']:
                raise ValueError("Payer is not a member of the group")
            
            # Validate split recipients are members
            for member in split_among:
                if member not in group_data['members']:
                    raise ValueError(f"Member {member} is not part of the group")
            
            # Calculate split amount
            split_amount = amount / len(split_among)
            
            # Create expense record
            expense_data = {
                'group_id': group_id,
                'paid_by': paid_by,
                'description': description,
                'amount': amount,
                'split_amount': split_amount,
                'split_among': split_among,
                'category': category,
                'created_at': datetime.utcnow(),
            }
            
            # Add to collection
            expense_ref = self.db.collection('collaborative_expenses').document()
            expense_ref.set(expense_data)
            
            # Update group's shared expenses list
            group_data['shared_expenses'].append(expense_ref.id)
            group_ref.update({'shared_expenses': group_data['shared_expenses']})
            
            return {
                'id': expense_ref.id,
                **expense_data,
                'created_at': expense_data['created_at'].isoformat(),
            }
        
        except Exception as e:
            raise Exception(f"Failed to add shared expense: {str(e)}")
    
    def calculate_group_settlements(self, group_id: str) -> Dict[str, Any]:
        """Calculate who owes whom in the group"""
        try:
            group_ref = self.db.collection('collaboration_groups').document(group_id)
            group = group_ref.get()
            
            if not group.exists:
                raise ValueError("Group not found")
            
            group_data = group.data()
            members = group_data['members']
            
            # Initialize balance for each member
            balances = {member: 0.0 for member in members}
            
            # Get all shared expenses
            expenses_query = self.db.collection('collaborative_expenses').where(
                'group_id', '==', group_id
            ).stream()
            
            for expense_doc in expenses_query:
                expense = expense_doc.to_dict()
                paid_by = expense['paid_by']
                split_amount = expense['split_amount']
                
                # Credit to person who paid
                balances[paid_by] += expense['amount']
                
                # Debit from each person in split
                for person in expense['split_among']:
                    balances[person] -= split_amount
            
            # Calculate settlements (who owes whom)
            settlements = []
            creditors = [(member, balance) for member, balance in balances.items() if balance > 0]
            debtors = [(member, balance) for member, balance in balances.items() if balance < 0]
            
            for debtor, debt in debtors:
                remaining_debt = abs(debt)
                
                for creditor_idx, (creditor, credit) in enumerate(creditors):
                    if remaining_debt <= 0:
                        break
                    
                    settlement_amount = min(credit, remaining_debt)
                    
                    if settlement_amount > 0:
                        settlements.append({
                            'from': debtor,
                            'to': creditor,
                            'amount': round(settlement_amount, 2),
                        })
                        
                        remaining_debt -= settlement_amount
                        creditors[creditor_idx] = (creditor, credit - settlement_amount)
            
            return {
                'group_id': group_id,
                'total_shared_amount': sum(abs(b) for b in balances.values() if b < 0),
                'balances': balances,
                'settlements': settlements,
            }
        
        except Exception as e:
            raise Exception(f"Failed to calculate settlements: {str(e)}")
    
    def get_group_details(self, group_id: str) -> Dict[str, Any]:
        """Get detailed information about a collaborative group"""
        try:
            group_ref = self.db.collection('collaboration_groups').document(group_id)
            group = group_ref.get()
            
            if not group.exists:
                raise ValueError("Group not found")
            
            group_data = group.data()
            
            # Get shared expenses
            expenses_query = self.db.collection('collaborative_expenses').where(
                'group_id', '==', group_id
            ).stream()
            
            shared_expenses = []
            for expense_doc in expenses_query:
                expense = expense_doc.to_dict()
                expense['id'] = expense_doc.id
                shared_expenses.append(expense)
            
            # Get settlements
            settlements = self.calculate_group_settlements(group_id)
            
            return {
                'id': group_id,
                'name': group_data['name'],
                'description': group_data['description'],
                'members': group_data['members'],
                'roles': group_data['role_assignments'],
                'shared_expenses': shared_expenses,
                'settlements': settlements['settlements'],
                'balances': settlements['balances'],
                'created_at': group_data['created_at'].isoformat(),
                'updated_at': group_data['updated_at'].isoformat(),
            }
        
        except Exception as e:
            raise Exception(f"Failed to get group details: {str(e)}")
    
    def get_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all groups that a user is member of"""
        try:
            query = self.db.collection('collaboration_groups').where(
                'members', 'array-contains', user_id
            ).stream()
            
            groups = []
            for doc in query:
                group_data = doc.to_dict()
                groups.append({
                    'id': doc.id,
                    'name': group_data['name'],
                    'members_count': len(group_data['members']),
                    'your_role': group_data['role_assignments'].get(user_id),
                    'created_at': group_data['created_at'].isoformat(),
                })
            
            return groups
        
        except Exception as e:
            raise Exception(f"Failed to get user groups: {str(e)}")
