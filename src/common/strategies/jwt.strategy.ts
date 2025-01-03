import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptionsWithRequest,
} from 'passport-jwt'

import { UnauthorizedException } from '../utils/catch-errors'
import { ErrorCode } from '../enums/error-code.enum'
import { config } from '../../config/app.config'
import passport, { PassportStatic } from 'passport'
import { userService } from '../../modules/user/user.module'

// Define the shape of the JWT payload
interface JwtPayload {
  userId: string // ID of the user associated with the JWT.
  sessionId: string // ID of the session associated with the JWT.
}

// Options for configuring the JWT strategy, the reason we are sendding with request is to assign session id to the request
const options: StrategyOptionsWithRequest = {
  // Function to extract JWT from the request
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      // Extract the access token from cookies
      const accessToken = req.cookies.accessToken
      if (!accessToken) {
        // Throw an exception if the token is not found
        throw new UnauthorizedException(
          'Unauthorized access token', // Error message
          ErrorCode.AUTH_TOKEN_NOT_FOUND // Associated error code
        )
      }
      return accessToken // Return the extracted token
    },
  ]),
  secretOrKey: config.JWT.SECRET, // Secret key used to verify the JWT signature
  audience: ['user'], // Audience validation for the token
  algorithms: ['HS256'], // Algorithm used to sign the JWT
  passReqToCallback: true, // Pass the request object to the callback function
}

// Function to set up the JWT strategy
export const setupJwtStrategy = (passport: PassportStatic) => {
  // Define and register a new JWT strategy
  passport.use(
    new JwtStrategy(options, async (req, payload: JwtPayload, done) => {
      try {
        // Find the user in the database using the userId from the payload
        const user = await userService.findUserById(payload.userId)
        if (!user) {
          // If no user is found, return 'false' to indicate authentication failure
          return done(null, false)
        }
        // Attach the sessionId from the payload to the request object
        req.sessionId = payload.sessionId
        // Return the user to indicate successful authentication
        return done(null, user)
      } catch (error) {
        // Handle errors that occur during user lookup
        return done(error, false)
      }
    })
  )
}

// Middleware to authenticate requests using the configured JWT strategy
export const authenticateJWT = passport.authenticate('jwt', { session: false })
// The `session: false` option ensures that Passport doesn't use sessions to store authentication state.
