// Importing necessary modules and utilities
import mongoose from 'mongoose'
import { VerificationEnum } from '../../common/enums/verification-code.enum'
import { Schema } from 'mongoose'
import { generateUniqueCode } from '../../common/utils/uuid'

/**
 * - `mongoose`: Used for MongoDB schema and model creation.
 * - `VerificationEnum`: Enum defining the types of verification codes (e.g., email, password reset).
 * - `generateUniqueCode`: Utility function to generate a unique verification code.
 */

// Interface defining the structure of a verification code document
export interface VerificationCodeDocument extends Document {
  userId: mongoose.Types.ObjectId // Links the verification code to a specific user
  code: string // Unique verification code
  type: VerificationEnum // Type of verification (e.g., email verification, password reset)
  expiresAt: Date // Expiration time for the code
  createdAt: Date // Timestamp for when the code was created
}

// Schema defining the structure for verification code documents
const verificationCodeSchema = new Schema<VerificationCodeDocument>({
  userId: {
    type: Schema.Types.ObjectId, // Stores a reference to the User model
    ref: 'User', // Specifies the related model (User)
    index: true, // Adds an index for faster lookups based on userId
    required: true, // Ensures the verification code is always linked to a user
  },
  code: {
    type: String, // A string field to store the unique verification code
    unique: true, // Ensures no two codes are the same
    required: true, // The code is mandatory
    default: generateUniqueCode, // Automatically generates a unique code using the utility function
  },
  type: {
    type: String, // Stores the type of verification (defined in `VerificationEnum`)
    required: true, // Ensures that the type is always specified
  },
  createdAt: {
    type: Date, // Timestamp for when the code was created
    default: Date.now, // Automatically sets the current date and time
  },
  expiresAt: {
    type: Date, // Expiration date for the code
    required: true, // Ensures the code always has a valid expiration time
  },
})

/**
 * Why:
 * - `userId`: Links the verification code to a user, enabling targeted verifications.
 * - `code`: Ensures each verification code is unique and traceable.
 * - `type`: Differentiates between various use cases, like email verification or password resets.
 * - `expiresAt`: Enforces security by ensuring codes are time-limited.
 * - `createdAt`: Tracks when the code was issued, aiding in debugging and audit trails.
 */

// Creating the VerificationCode model based on the schema
const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
  'VerificationCode', // Name of the model
  verificationCodeSchema, // Schema definition
  'verification_codes' // Explicit collection name in the database
)

/**
 * Why:
 * The `VerificationCodeModel` serves as the interface for interacting with the
 * `verification_codes` collection in the database. It provides methods for creating,
 * querying, and managing verification codes, improving security workflows.
 */

export default VerificationCodeModel
