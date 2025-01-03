const enum ErrorCode {
  // Authentication-related error codes
  // These constants represent specific errors during the authentication process, making error handling more descriptive and consistent across the application.
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS', // Error when attempting to register an email that is already in use.
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN', // Error for an invalid authentication token (e.g., expired or malformed).
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND', // Error when the user cannot be found in the system.
  AUTH_NOT_FOUND = 'AUTH_NOT_FOUND', // General error for missing authentication credentials.
  AUTH_TOO_MANY_ATTEMPTS = 'AUTH_TOO_MANY_ATTEMPTS', // Error for rate-limiting due to excessive login attempts.
  AUTH_UNAUTHORIZED_ACCESS = 'AUTH_UNAUTHORIZED_ACCESS', // Error for access attempts without proper authorization.
  AUTH_TOKEN_NOT_FOUND = 'AUTH_TOKEN_NOT_FOUND', // Error when an authentication token is missing in the request.

  // Access control errors
  // These constants define errors related to permissions and access control, ensuring proper restriction of unauthorized actions.
  ACCESS_FORBIDDEN = 'ACCESS_FORBIDDEN', // Error for trying to access a resource that is explicitly forbidden.
  ACCESS_UNAUTHORIZED = 'ACCESS_UNAUTHORIZED', // Error for accessing a resource without being authenticated.

  // Validation and resource-related errors
  // These constants handle issues with input validation and resource availability, improving error clarity for users and developers.
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Error when input validation fails (e.g., invalid format or missing required fields).
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND', // Error when a requested resource (e.g., a file or database entry) cannot be found.

  // System-related errors
  // These constants represent general system issues, making debugging and logging easier for developers.
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // Generic error for unexpected system issues or crashes.
  VERIFICATION_ERROR = 'VERIFICATION_ERROR', // Error when a verification process fails (e.g., mismatched OTP or confirmation link).
}

export { ErrorCode }
