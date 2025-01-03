import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { MfaService } from './mfa.service'
import { HTTPSTATUS } from '../../config/http.config'
import {
  verifyMfaForLoginSchema,
  verifyMfaSchema,
} from '../../common/validators/mfa.validator'
import { setAuthenticationCookies } from '../../common/utils/cookie'

export class MfaController {
  private mfaService: MfaService

  constructor(mfaService: MfaService) {
    // Initialize the MFA service to handle business logic related to MFA.
    this.mfaService = mfaService
  }

  public generateMFASetup = asyncHandler(
    async (req: Request, res: Response) => {
      // Generate MFA setup details (e.g., secret key and QR code URL) for a user.
      const { secret, qrImageUrl, message } =
        await this.mfaService.generateMFASetup(req)

      // Respond with the generated MFA setup information.
      return res.status(HTTPSTATUS.OK).json({
        message,
        secret,
        qrImageUrl,
      })
    }
  )

  public verifyMFASetup = asyncHandler(async (req: Request, res: Response) => {
    // Parse and validate the request body to ensure correct MFA verification details are provided.
    const { code, secretKey } = verifyMfaSchema.parse({
      ...req.body,
    })

    // Verify the provided MFA code and associate it with the user's preferences.
    const { userPreferences, message } = await this.mfaService.verifyMFASetup(
      req,
      code,
      secretKey
    )

    // Respond with a success message and the updated user preferences.
    return res.status(HTTPSTATUS.OK).json({
      message: message,
      userPreferences: userPreferences,
    })
  })

  public revokeMFA = asyncHandler(async (req: Request, res: Response) => {
    // Revoke MFA settings for the user and update their preferences.
    const { message, userPreferences } = await this.mfaService.revokeMFA(req)

    // Respond with a success message and the updated preferences after MFA is revoked.
    return res.status(HTTPSTATUS.OK).json({
      message,
      userPreferences,
    })
  })

  public verifyMFAForLogin = asyncHandler(
    async (req: Request, res: Response) => {
      // Parse and validate the request body for MFA login verification, including the user's device details.
      const { code, email, userAgent } = verifyMfaForLoginSchema.parse({
        ...req.body,
        userAgent: req.headers['user-agent'], // Include the user's device information.
      })

      // Verify the MFA code for login and retrieve authentication tokens and user data.
      const { accessToken, refreshToken, user } =
        await this.mfaService.verifyMFAForLogin(code, email, userAgent)

      // Set the authentication cookies and respond with the user data and a success message.
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: 'Verified & login successfully',
          user,
        })
    }
  )
}

/*
 * Quick Summary:
 * 1. generateMFASetup: Generates MFA setup details (e.g., QR code and secret key) for a user.
 * 2. verifyMFASetup: Validates and verifies the user's provided MFA code, saving the MFA settings in their preferences.
 * 3. revokeMFA: Removes MFA for a user, updating their preferences accordingly.
 * 4. verifyMFAForLogin: Validates the MFA code during login, generates authentication tokens, and sets them as cookies.
 */
