import { auth } from "@shared/services/auth";

export const handleApiError = (error: Error, onTokenExpiration?: () => void) => {
  if (error.message.includes('Your session has expired')) {
    // Clear the expired token
    auth.logout();
    
    // Call the callback if provided
    if (onTokenExpiration) {
      onTokenExpiration();
    }
    
    // Return a user-friendly message
    return 'Your session has expired. Please log in again.';
  }
  
  // Return the original error message for other errors
  return error.message;
};
