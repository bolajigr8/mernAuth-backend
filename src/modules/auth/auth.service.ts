import { ErrorCode } from '../../common/enums/error-code.enum'
import { VerificationEnum } from '../../common/enums/verification-code.enum'
import {
  LoginDto,
  RegisterDto,
  resetPasswordDto,
} from '../../common/interface/auth.interface'
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/utils/catch-errors'
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from '../../common/utils/date-time'
import SessionModel from '../../database/models/session.model'
import UserModel, { UserDocument } from '../../database/models/user.model'
import VerificationCodeModel from '../../database/models/verification.model'
import { config } from '../../config/app.config'
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from '../../common/utils/jwt'
import { sendEmail } from '../../mailers/mailer'
import { verify } from 'jsonwebtoken'
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '../../mailers/templates/template'
import { HTTPSTATUS } from '../../config/http.config'
import { hashValue } from '../../common/utils/bcrypt'

export class AuthService {
  // Logic to register a new user
  public async register(registerData: RegisterDto) {
    const { name, email, password } = registerData

    const existingUser = await UserModel.exists({
      email,
    })

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      )
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
    })

    const userId = newUser._id

    // Additional logic to create email verification
    const verification = await VerificationCodeModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    })

    // logic to send email verification link by email

    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verification.code}`

    await sendEmail({
      to: newUser.email,
      ...verifyEmailTemplate(verificationUrl),
    })

    return {
      user: newUser,
    }
  }

  // Logic to login a user

  public async login(LoginData: LoginDto) {
    const { email, password, userAgent } = LoginData

    const user = await UserModel.findOne({
      email: email,
    })

    if (!user) {
      throw new BadRequestException(
        'Invalid email or password',
        ErrorCode.AUTH_USER_NOT_FOUND
      )
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      throw new BadRequestException(
        'Invalid email or password',
        ErrorCode.AUTH_USER_NOT_FOUND
      )
    }

    // Check if the user  enables 2fa for user verification

    if (user.userPreferences.enable2FA) {
      return {
        user: null,
        mfaRequired: true,
        accessToken: '',
        refreshToken: '',
      }
    }

    // creating sessions

    const session = await SessionModel.create({ userId: user._id, userAgent })

    // taking the  signJwtToken function from the jwt.ts file in utils

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session.id,
    })

    const refreshToken = signJwtToken(
      {
        sessionId: session.id,
      },
      refreshTokenSignOptions
    )

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    }
  }

  // Logic to refresh token

  public async refreshToken(refreshToken: string) {
    // Verify the JWT refresh token and decode the payload
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret, // Secret used for verifying the JWT token
    })

    // If the payload is missing, the refresh token is invalid
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // Retrieve the session from the database using the session ID from the token's payload
    const session = await SessionModel.findById(payload.sessionId)
    const now = Date.now() // Get the current timestamp

    // If no session is found, throw an exception that the session doesn't exist
    if (!session) {
      throw new UnauthorizedException('Session does not exist')
    }

    // If the session has expired, throw an exception
    if (session.expiredAt.getTime() <= now) {
      throw new UnauthorizedException('Session expired')
    }

    // Check if the session is about to expire within the next 24 hours
    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS

    // If the session requires refreshing, update its expiration date
    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN)
      await session.save() // Save the updated session to the database
    }

    // Generate a new refresh token if the session was refreshed
    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session._id, // Payload includes session ID
          },
          refreshTokenSignOptions // Use the refresh token signing options
        )
      : undefined

    // Generate an access token using the user ID and session ID
    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
    })

    // Return the access token and new refresh token (if applicable)
    return {
      accessToken,
      newRefreshToken,
    }
  }

  // Logic to verify email
  public async verifyEmail(code: string) {
    // Check if the verification code exists, is of type email verification, and hasn't expired

    const validCode = await VerificationCodeModel.findOne({
      code, // The verification code provided by the user
      type: VerificationEnum.EMAIL_VERIFICATION, // Type of verification is email verification
      expiresAt: { $gte: new Date() }, // Ensure the code has not expired
    })

    // If the verification code is invalid or expired, throw an exception
    if (!validCode) {
      throw new BadRequestException('Invalid or expired verification code')
    }

    // Update the user's record to set `isEmailVerified` to true
    const updatedUser = await UserModel.findByIdAndUpdate(
      validCode.userId, // The user ID associated with the verification code
      { isEmailVerified: true }, // Update the email verification status
      { new: true } // Return the updated user document
    )

    // If updating the user record fails, throw an exception
    if (!updatedUser) {
      throw new BadRequestException(
        'Unable to verify email address', // Error message
        ErrorCode.VALIDATION_ERROR // Error code for validation issues
      )
    }

    // Delete the verification code from the database since it's no longer needed
    await validCode.deleteOne()

    // Return the updated user object as a confirmation
    return {
      user: updatedUser,
    }
  }

  // forgot Password Logic

  public async forgotPassword(email: string) {
    const user = await UserModel.findOne({
      email: email,
    })

    if (!user) {
      throw new NotFoundException(
        'User not found with this email',
        ErrorCode.AUTH_USER_NOT_FOUND
      )

      // check mail rate is 2 emails per 3 or 10 minutes
    }

    const timeAgo = threeMinutesAgo()
    const maxAttempts = 2

    const count = await VerificationCodeModel.countDocuments({
      userId: user?._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gte: timeAgo },
    })

    if (count >= maxAttempts) {
      throw new HttpException(
        'Too many requests, please try again later',
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      )
    }

    const expiresAt = anHourFromNow()

    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    })

    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    })

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`)
    }

    return {
      url: resetLink,
      emailId: data.id,
    }
  }

  // Reset Password Logic
  public async resetPassword({ verificationCode, password }: resetPasswordDto) {
    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt: { $gte: new Date() },
    })

    if (!validCode) {
      throw new NotFoundException('Invalid or expired verification code')
    }

    const hashedPassword = await hashValue(password)

    const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    })

    if (!updatedUser) {
      throw new BadRequestException('Failed to reset password')
    }

    await validCode.deleteOne()

    await SessionModel.deleteMany({
      userId: updatedUser._id,
    })

    return {
      user: updatedUser,
    }
  }

  // Logout Logic

  public async logout(sessionId: string) {
    return await SessionModel.findByIdAndDelete(sessionId)
  }
}

// AuthService is a service class responsible for handling business logic related to authentication.
