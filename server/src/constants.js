// Mock identities used for the demo. There is deliberately NO Users table and
// no login: the presenter simply picks who they are "acting as" in the UI.
export const OWNERS = [
  { id: 'aarav', name: 'Aarav Sharma' },
  { id: 'priya', name: 'Priya Nair' },
  { id: 'rahul', name: 'Rahul Verma' },
  { id: 'sneha', name: 'Sneha Iyer' },
  { id: 'kabir', name: 'Kabir Mehta' },
  { id: 'ananya', name: 'Ananya Reddy' },
];

export const GENRES = [
  'Fiction',
  'Literature',
  'Science',
  'Technology',
  'Computer Science',
  'Engineering',
  'Mathematics',
  'History',
  'Business',
  'Self-Help',
  'Other',
];

export const EXCHANGE_PREFERENCES = ['exchange', 'lend', 'give away', 'sell'];
export const BOOK_STATUSES = ['available', 'reserved', 'unavailable'];
export const REQUEST_TYPES = ['borrow', 'exchange', 'purchase'];
export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'];

export function findOwner(id) {
  return OWNERS.find((owner) => owner.id === id) ?? null;
}
