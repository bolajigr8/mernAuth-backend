// - `jsonwebtoken` is used for creating and verifying JWTs (JSON Web Tokens).
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'
import { SessionDocument } from '../../database/models/session.model'
import { UserDocument } from '../../database/models/user.model'
import { config } from '../../config/app.config'

// Defining the structure of the payload for access tokens
// It includes a `userId` and `sessionId` to uniquely identify the user and session.
export type AccessTPayload = {
  userId: UserDocument['_id'] // The ID of the user
  sessionId: SessionDocument['_id'] // The ID of the session
}

// Defining the structure of the payload for refresh tokens
// Refresh tokens typically only need to identify the session.
export type RefreshTPayload = {
  sessionId: SessionDocument['_id'] // The ID of the session
}

// Extending `SignOptions` to include a `secret` property
// `secret` is required for signing JWTs.
type SignOptsAndSecret = SignOptions & {
  secret: string // Secret key for signing the JWT
}

// Defining default options for JWTs
// These defaults specify the audience that the token is intended for.
const defaults: SignOptions = {
  audience: ['user'], // Indicates that the token is meant for users
}

// Defining signing options for access tokens
// Includes expiration time and secret key for signing.
export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.EXPIRES_IN, // Expiration time from configuration
  secret: config.JWT.SECRET, // Secret key from configuration
}

// Defining signing options for refresh tokens
// Refresh tokens generally have longer expiration times and a separate secret.
export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.REFRESH_EXPIRES_IN, // Expiration time for refresh tokens
  secret: config.JWT.REFRESH_SECRET, // Separate secret key for refresh tokens
}

// Function to sign a JWT
// - Accepts a payload and optional signing options.
// - Uses defaults or the provided options to generate the JWT.
export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload, // Payload can be for access or refresh token
  options?: SignOptsAndSecret // Optional signing options
) => {
  const { secret, ...opts } = options || accessTokenSignOptions // Use provided options or default access token options
  return jwt.sign(payload, secret, {
    ...defaults, // Include default options
    ...opts, // Include provided or default options
  })
}

// Function to verify a JWT
// - Generic function to verify tokens of different payload types.
// - Returns either the payload or an error.
export const verifyJwtToken = <TPayload extends object = AccessTPayload>( // Generic type for payload
  token: string, // JWT string to verify
  options?: VerifyOptions & { secret: string } // Optional verification options
) => {
  try {
    const { secret = config.JWT.SECRET, ...opts } = options || {} // Use provided secret or default secret
    const payload = jwt.verify(token, secret, {
      ...defaults, // Include default options
      ...opts, // Include provided options
    }) as TPayload // Type-cast the payload to the expected type
    return { payload } // Return the decoded payload
  } catch (err: any) {
    return {
      error: err.message, // Return the error message if verification fails
    }
  }
}

// This code provides utilities for signing and verifying JSON Web Tokens (JWTs), with predefined configurations for access and refresh tokens. It uses the jsonwebtoken library, incorporates custom payload types, and ensures flexibility by allowing overrides of default options.
