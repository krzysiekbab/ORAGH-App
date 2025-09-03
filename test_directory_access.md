# Directory Access Control Test

## Test Cases

### 1. Non-existent Directory
- URL: http://localhost:5173/forum/directory/999
- Expected: "Directory not found" error message with return to forum button

### 2. Board Directory (Access Denied for Regular Users)
- URL: http://localhost:5173/forum/directory/8 
- Expected: "Access denied" error message for regular users
- Note: Directory ID 8 is "Dział zarządu" with access_level='board'

### 3. Valid Directory 
- URL: http://localhost:5173/forum/directory/1
- Expected: Normal directory view
- Note: Directory ID 1 is "Orkiestra" with access_level='all'

## Implementation Details

The DirectoryPage now includes:
1. **Error State Management**: 
   - `directoryNotFound` state for 404 errors
   - `accessDenied` state for 403 errors
   - `userGroups` state to track user's group membership

2. **User Permissions Loading**:
   - Calls `/api/users/permissions/` to get user groups
   - Checks if user is in 'board' group for board-level directories

3. **Enhanced Error Handling**:
   - Catches 404 responses and shows "Directory not found"
   - Catches 403 responses and shows "Access denied" 
   - Provides clear error messages with navigation back to forum

4. **Access Control Logic**:
   ```typescript
   // Check access permissions for board directories
   if (directoryData.access_level === 'board' && !userGroups.includes('board')) {
     setAccessDenied(true)
     return
   }
   ```

## Testing Steps

1. Open browser and navigate to http://localhost:5173
2. Login with a regular user account
3. Test each URL above
4. Verify appropriate error messages are displayed
5. Test "Return to forum" button functionality
