import mongoose, { Document, Schema } from 'mongoose'
import { thirtyDaysFromNow } from '../../common/utils/date-time'

/**
 * - `mongoose`: Handles MongoDB schema and data modeling.
 * - `Document`: Adds typing for MongoDB documents.
 * - `Schema`: Used to define the structure for collections.
 * - `thirtyDaysFromNow`: A utility function that calculates a date 30 days into the future, used for session expiration.
 */

// Interface for the Session document
export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId // Links the session to a specific user
  userAgent?: string // Optional field to store details about the user's device/browser
  expiredAt: Date // The expiration date for the session
  createdAt: Date // Auto-generated timestamp for when the session was created
}

// Schema defining the structure for session documents
const sessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId, // Stores a reference to the User model
    ref: 'User', // Specifies the related model (User)
    index: true, // Adds an index for faster queries based on userId
    required: true, // Ensures that a session is always linked to a user
  },
  userAgent: {
    type: String, // A string field to store the user agent
    required: false, // This field is optional
  },
  createdAt: {
    type: Date, // Stores the creation timestamp
    default: Date.now, // Automatically sets to the current date and time
  },
  expiredAt: {
    type: Date, // Stores the session expiration timestamp
    required: true, // Ensures the session has an expiration date
    default: thirtyDaysFromNow, // Uses the utility function to set the default to 30 days from now
  },
})

/**
 * Why:
 * - `userId`: Links sessions to users for tracking and authentication.
 * - `userAgent`: Helps identify the user's device or browser, useful for logging or security checks.
 * - `createdAt`: Tracks when the session was created, aiding in session management.
 * - `expiredAt`: Ensures sessions automatically expire after a set duration, improving security.
 */

// Creating the Session model based on the schema
const SessionModel = mongoose.model<SessionDocument>('Session', sessionSchema)

/**
 * Why:
 * The `SessionModel` provides a centralized interface for interacting with the `sessions` collection,
 * enabling CRUD operations and queries such as finding sessions by user or invalidating expired sessions.
 */

export default SessionModel
