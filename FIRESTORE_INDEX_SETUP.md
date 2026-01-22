# Firebase Firestore Composite Index Setup

## Issue
Your application is querying the `dailyAttendance` collection with multiple fields and ordering, which requires composite indexes in Firestore.

## Required Indexes

### Index 1: For `getAttendanceStats()` and `getAttendanceCalendar()`
**Collection:** `dailyAttendance`
**Fields:**
- `studentId` (Ascending)
- `date` (Ascending)  
- Document ID `__name__` (Ascending)

**Query Pattern:**
```
where('studentId', '==', studentId)
where('date', '>=', startDateStr)
where('date', '<=', endDateStr)
orderBy('date', 'asc' or 'desc')
```

### Index 2: For `getRecentActivity()`
**Collection:** `dailyAttendance`
**Fields:**
- `studentId` (Ascending)
- `date` (Descending)

**Query Pattern:**
```
where('studentId', '==', studentId)
orderBy('date', 'desc')
limit(limitCount)
```

## How to Create Indexes

### Option 1: Via Firebase Console (Recommended)
1. Open [Firebase Console](https://console.firebase.google.com)
2. Navigate to your project: **uncommonattendance**
3. Go to **Firestore Database** → **Indexes** → **Composite Indexes**
4. Click **Create Index**
5. Fill in the details:
   - **Collection ID:** `dailyAttendance`
   - **Fields:** Add the required fields in order with their directions
6. Click **Create**

### Option 2: Via Error Link
The error message in the console includes a direct link to create the index:
- Click the link provided in the error message
- Review the index configuration
- Click "Create Index"

### Option 3: Via Firebase CLI
```bash
firebase firestore:indexes --import firestore.indexes.json
```

Update `firestore.indexes.json` to include:
```json
{
  "indexes": [
    {
      "collectionGroup": "dailyAttendance",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "studentId", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "ASCENDING"},
        {"fieldPath": "__name__", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "dailyAttendance",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "studentId", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Timeline
Index creation typically takes 5-10 minutes. Once created, the queries will work without errors.

## Related Files
- [src/services/dailyAttendanceService.ts](src/services/dailyAttendanceService.ts) - Contains the queries requiring these indexes
