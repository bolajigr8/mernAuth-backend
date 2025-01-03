import {
  NotFoundException,
  UnauthorizedException,
} from '../../common/utils/catch-errors'
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from '../../common/utils/cookie'
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationEmailSchema,
} from '../../common/validators/auth.validator'
import { HTTPSTATUS } from '../../config/http.config'
import { UserDocument } from '../../database/models/user.model'
import { asyncHandler } from '../../middleware/asyncHandler'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'

export class AuthController {
  private authService: AuthService
  // Declares a private instance of AuthService, used for authentication-related operations.

  constructor(authService: AuthService) {
    this.authService = authService
    // Initializes the AuthService instance via dependency injection in the constructor.
  }

  // Defines the `register` method, which is wrapped with `asyncHandler` for error handling

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      })

      // to validate this body to make sure the user sent correct body, we will be making use of zod from validator folder

      const { user } = await this.authService.register(body)

      return res.status(HTTPSTATUS.CREATED).json({
        message: 'User registered successfully',
        data: user,
      })
    }
  )

  // Defines the `Login` method, which is wrapped with `asyncHandler` for error handling

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers['User Agent']
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      })

      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body)

      if (mfaRequired) {
        return res.status(HTTPSTATUS.OK).json({
          message: 'Verify MFA authentification',
          mfaRequired: true,
          user,
        })
      }

      // we are aso sending the refresh tokens and accesstoken through the cookies with the user data
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: 'User Login successfully',
          mfaRequired,
          user,
        })
    }
  )

  // Defines the `Refresh token` method

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Retrieve the refresh token from the request cookies
      const refreshToken = req.cookies.refreshToken as string | undefined

      // If no refresh token is found, throw an exception
      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token')
      }

      // Call the authService's refreshToken method to get the new tokens
      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken)

      // If a new refresh token is generated, set it in the response cookies
      if (newRefreshToken) {
        res.cookie(
          'refreshToken', // Cookie name for the refresh token
          newRefreshToken, // Value of the new refresh token
          getRefreshTokenCookieOptions() // Cookie options (expiration, security, etc.)
        )
      }

      // Return the response with the access token and success message
      return res
        .status(HTTPSTATUS.OK) // HTTP status code 200 (OK)
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions()) // Set the access token in the cookies
        .json({
          message: 'Refresh access token successfully', // Response message
        })
    }
  )

  // Defines the `Verify email` method
  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Parse the incoming request body to extract the verification code
      const { code } = verificationEmailSchema.parse(req.body)

      // Call the authService's verifyEmail method to handle the email verification logic
      await this.authService.verifyEmail(code)

      // Return a success response to the client indicating the email was verified
      return res.status(HTTPSTATUS.OK).json({
        message: 'Email verified successfully',
      })
    }
  )

  // Defines the `Forgot password` method
  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email)

      await this.authService.forgotPassword(email)

      return res.status(HTTPSTATUS.OK).json({
        message: 'Password reset email sent',
      })
    }
  )

  // Defines the `Reset password` method

  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = resetPasswordSchema.parse(req.body)

      await this.authService.resetPassword(body)

      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: 'Password reset successfully',
      })
    }
  )

  // Logout which requires jwt authentication

  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.sessionId

      if (!sessionId) {
        throw new NotFoundException('Session ID not found')
      }

      await this.authService.logout(sessionId)

      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: 'User logged out successfully',
      })
    }
  )
}
