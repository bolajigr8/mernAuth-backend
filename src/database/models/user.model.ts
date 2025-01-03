import mongoose, { Document, Schema } from 'mongoose'
import { compareValue, hashValue } from '../../common/utils/bcrypt'

/**
 * - `mongoose`: Handles MongoDB schema and data modeling.
 * - `Document`: Adds typing for MongoDB documents.
 * - `Schema`: Used to define the blueprint for collections.
 * - `compareValue` & `hashValue`: Utility functions for password security.
 */

// Interface for user preferences, encapsulating optional and default settings
interface UserPreferences {
  enable2FA: boolean // Enables or disables two-factor authentication
  emailNotification: boolean // Toggles email notifications
  twoFactorSecret?: string // Optional: Secret key for 2FA
}

// Main interface for the User document with all necessary fields and methods
export interface UserDocument extends Document {
  name: string // User's name
  email: string // Unique email address
  password: string // Hashed password
  isEmailVerified: boolean // Flag indicating if the email is verified
  createdAt: Date // Auto-generated timestamp for document creation
  updatedAt: Date // Auto-generated timestamp for document updates
  userPreferences: UserPreferences // Nested object for user-specific preferences
  comparePassword(value: string): Promise<boolean> // Custom method for password comparison
}

// Schema for user preferences, defining default values and optional fields
const userPreferencesSchema = new Schema<UserPreferences>({
  enable2FA: { type: Boolean, default: false }, // Default is 2FA disabled
  emailNotification: { type: Boolean, default: true }, // Default is email notifications enabled
  twoFactorSecret: { type: String, required: false }, // Optional field
})

// Main schema for user documents
const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true, // Name is mandatory
    },
    email: {
      type: String,
      unique: true, // Ensures emails are unique across the collection
      required: true, // Email is mandatory
    },
    password: {
      type: String,
      required: true, // Password is mandatory
    },
    isEmailVerified: {
      type: Boolean,
      default: false, // Default is email not verified
    },
    userPreferences: {
      type: userPreferencesSchema, // Embeds the userPreferences schema
      default: {}, // Sets default preferences if not provided
    },
  },
  {
    timestamps: true, // Automatically manages `createdAt` and `updatedAt` fields
    toJSON: {}, // Customizes how the data is serialized
  }
)

// Pre-save middleware to hash the password before saving to the database
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // Hashes the password only if it has been modified
    this.password = await hashValue(this.password)
  }
  next()
})

/**
 * Why:
 * This ensures that plain-text passwords are never stored in the database,
 * improving overall security and protecting sensitive user data.
 */

// Custom method for comparing provided passwords with stored hashed passwords
userSchema.methods.comparePassword = async function (value: string) {
  return compareValue(value, this.password)
}

/**
 * Why:
 * Encapsulating password comparison logic as a method simplifies the
 * authentication process and promotes reusability.
 */

// Customize the JSON representation of user data, removing sensitive fields
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password // Removes the hashed password
    delete ret.userPreferences.twoFactorSecret // Removes sensitive 2FA secret
    return ret
  },
})

/**
 * Why:
 * This ensures sensitive information is not included in API responses,
 * enhancing user data privacy and security.
 */

// Creating the User model from the schema
const UserModel = mongoose.model<UserDocument>('User', userSchema)
export default UserModel

/**
 * Why:
 * The UserModel serves as the primary interface for interacting with the
 * `users` collection in the database, enabling CRUD operations and other queries.
 */
