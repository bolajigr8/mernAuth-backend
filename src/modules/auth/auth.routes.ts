import { Router } from 'express'
import { authController } from './auth.module'
import { authenticateJWT } from '../../common/strategies/jwt.strategy'

const authRoutes = Router()
// Creates a new Router instance for defining authentication-related routes.

// Maps the POST `/register` route to the `register` method of AuthController.

authRoutes.post('/register', authController.register)
authRoutes.post('/login', authController.login)
authRoutes.post('/verify/email', authController.verifyEmail)
authRoutes.post('/forgot/password', authController.forgotPassword)
authRoutes.post('/password/reset', authController.resetPassword)
authRoutes.post('/logout', authenticateJWT, authController.logout)

authRoutes.get('/refresh', authController.refreshToken)

export default authRoutes
// Exports the authRoutes instance for integration with the main application.

/* 
Workflow Explanation:

A new router (authRoutes) is created using Express.
The POST /register route is defined and linked to the register method in AuthController.
The authRoutes instance is exported to be mounted in the main application.
*/
