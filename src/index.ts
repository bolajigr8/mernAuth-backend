import 'dotenv/config' // Load environment variables

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config/app.config'
import { Request, Response } from 'express'
import connectDB from './database/database'
import { errorHandler } from './middleware/errorHandler'
import { HTTPSTATUS } from './config/http.config'
import { asyncHandler } from './middleware/asyncHandler'
import authRoutes from './modules/auth/auth.routes'
import passport from './middleware/passport'
import { authenticateJWT } from './common/strategies/jwt.strategy'
import sessionRoutes from './modules/session/session.routes'
import mfaRoutes from './modules/mfa/mfa.routes'

// Creating an Express application instance. This is the foundation of our backend server, where routes and middleware are registered.
const app = express()
const BASE_PATH = config.BASE_PATH

// Middleware

// To parse incoming requests with JSON payloads. Allows the server to handle `application/json` content types easily.
app.use(express.json())

// Middleware to parse URL-encoded bodies (e.g., form submissions). Setting `extended: true` allows for rich objects and arrays to be encoded into the URL-encoded format.
app.use(express.urlencoded({ extended: true }))

// Middleware to enable CORS with specific configurations. The `origin` option restricts access to the allowed domain (defined in config.APP_ORIGIN). The `credentials` option allows cookies and authorization headers to be sent in cross-origin requests.
app.use(cors({ origin: config.APP_ORIGIN, credentials: true }))

// Middleware to parse cookies in incoming requests. Makes cookies accessible via `req.cookies`.
app.use(cookieParser())

// for protected routes
app.use(passport.initialize())

// Routes

// Defining a basic GET route at the root URL ('/'). The route handler receives the `Request` and `Response` objects.
app.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: 'Hello',
    })
  })
)

app.use(`${BASE_PATH}/auth`, authRoutes)

app.use(`${BASE_PATH}/mfa`, mfaRoutes)

app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes)

// Middleware to handle errors. This is a catch-all error handler that logs the error and sends a generic error message to the client.

app.use(errorHandler)

// Starting the server on the configured port (`config.PORT`). The callback function logs a message indicating the server is running and the current environment.
app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`)
  await connectDB()
})
