import { Request } from 'express'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import UserModel from '../../database/models/user.model'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/utils/catch-errors'
import SessionModel from '../../database/models/session.model'
import { refreshTokenSignOptions, signJwtToken } from '../../common/utils/jwt'

export class MfaService {
  public async generateMFASetup(req: Request) {
    const user = req.user

    // Ensure the user is authorized and prevent re-enabling MFA if it's already active.
    if (!user) {
      throw new UnauthorizedException('User not authorized')
    }
    if (user.userPreferences.enable2FA) {
      return {
        message: 'MFA already enabled',
      }
    }

    // Generate a new secret key if one does not exist for the user.
    let secretKey = user.userPreferences.twoFactorSecret
    if (!secretKey) {
      const secret = speakeasy.generateSecret({ name: 'Micbol' })
      // Assign the generated secret key in base32 encoding to the user's preferences.
      secretKey = secret.base32
      user.userPreferences.twoFactorSecret = secretKey
      await user.save()
    }

    // Generate the OTP Auth URL and convert it to a QR code for easy setup.
    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: `${user.name}`,
      issuer: 'micbol.com',
      encoding: 'base32',
    })
    const qrImageUrl = await qrcode.toDataURL(url)

    return {
      message: 'Scan the QR code or use the setup key.',
      secret: secretKey,
      qrImageUrl,
    }
  }

  public async verifyMFASetup(req: Request, code: string, secretKey: string) {
    const user = req.user

    // Ensure the user is authorized and avoid re-verifying an already enabled MFA.
    if (!user) {
      throw new UnauthorizedException('User not authorized')
    }
    if (user.userPreferences.enable2FA) {
      return {
        message: 'MFA is already enabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      }
    }

    // Verify the provided MFA code using the secret key.
    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: code,
    })

    // Handle invalid MFA codes.
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code. Please try again.')
    }

    // Enable MFA for the user and save their preferences.
    user.userPreferences.enable2FA = true
    await user.save()

    return {
      message: 'MFA setup completed successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    }
  }

  public async revokeMFA(req: Request) {
    const user = req.user

    // Ensure the user is authorized and MFA is active before revoking.
    if (!user) {
      throw new UnauthorizedException('User not authorized')
    }
    if (!user.userPreferences.enable2FA) {
      return {
        message: 'MFA is not enabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      }
    }

    // Remove the secret key and disable MFA for the user.
    user.userPreferences.twoFactorSecret = undefined
    user.userPreferences.enable2FA = false
    await user.save()

    return {
      message: 'MFA revoke successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    }
  }

  public async verifyMFAForLogin(
    code: string,
    email: string,
    userAgent?: string
  ) {
    // Fetch the user by email and ensure they have MFA enabled.
    const user = await UserModel.findOne({ email })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (
      !user.userPreferences.enable2FA &&
      !user.userPreferences.twoFactorSecret
    ) {
      throw new UnauthorizedException('MFA not enabled for this user')
    }

    // Verify the provided MFA code.
    const isValid = speakeasy.totp.verify({
      secret: user.userPreferences.twoFactorSecret!,
      encoding: 'base32',
      token: code,
    })

    // Handle invalid MFA codes.
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code. Please try again.')
    }

    // Create a new session and generate access and refresh tokens.
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    })

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    })

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    )

    return {
      user,
      accessToken,
      refreshToken,
    }
  }
}

/*
 * Quick Summary:
 * 1. generateMFASetup: Prepares MFA setup for users by generating a secret key and providing a QR code for app integration.
 * 2. verifyMFASetup: Confirms the MFA setup using a user-provided code and enables MFA for the user upon successful verification.
 * 3. revokeMFA: Disables MFA for the user, removing the secret key and updating their preferences.
 * 4. verifyMFAForLogin: Validates the MFA code during login, creates a session, and generates authentication tokens.
 */
