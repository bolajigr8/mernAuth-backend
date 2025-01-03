import { HTTPSTATUS, HttpStatusCode } from '../../config/http.config'
import { ErrorCode } from '../enums/error-code.enum'

// The AppError class is a custom error class that extends the built-in Error class.
// It adds additional properties like statusCode (HTTP status code) and errorCode (application-specific error code)
// to make error handling more structured and consistent.
export class AppError extends Error {
  public statusCode: HttpStatusCode // Represents the HTTP status code for the error (e.g., 400, 401, 500).
  public errorCode?: ErrorCode // Optional property for the specific application error code (e.g., AUTH_USER_NOT_FOUND).

  constructor(
    message: string, // A descriptive error message.
    statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR, // Default HTTP status code is 500 (Internal Server Error).
    errorCode?: ErrorCode // Optional application-specific error code for more granular error categorization.
  ) {
    super(message) // Call the base Error class constructor to initialize the message property.

    // Assign the provided HTTP status code to the instance. This makes it easy to send the correct response in APIs.
    this.statusCode = statusCode

    // Assign the optional errorCode to the instance. This allows identifying the specific type of error for better debugging.
    this.errorCode = errorCode

    // Capture the stack trace at the point where this error was created, excluding the constructor itself.
    // This is useful for debugging as it provides a clear trace of where the error occurred.
    Error.captureStackTrace(this, this.constructor)
  }
}
