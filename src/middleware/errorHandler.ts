import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { HTTPSTATUS } from '../config/http.config'
import { AppError } from '../common/utils/AppError'
import { z } from 'zod'
import {
  clearAuthenticationCookies,
  REFRESH_PATH,
} from '../common/utils/cookie'

const formatZodError = (res: Response, err: z.ZodError) => {
  const errors = err?.issues?.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return res
    .status(HTTPSTATUS.BAD_REQUEST)
    .json({ message: 'Validation Error', errors: errors })
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  // Log the error to the console
  console.error(`Error occured on PATH: ${req.path}`, err)

  // clear tokens from cookies
  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res)
  }

  // syntax error
  if (err instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: 'Invalid JSON format, please check your request body',
    })
  }

  // Zod error

  if (err instanceof z.ZodError) {
    return formatZodError(res, err)
  }

  // App error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errorCode: err.errorCode,
    })
  }

  // Respond with a generic error message
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: 'Internal Server Error',
    error: err?.message || 'Unknown error occurred',
  })
}
