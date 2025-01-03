import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { SessionService } from './session.service'
import { HTTPSTATUS } from '../../config/http.config'
import { NotFoundException } from '../../common/utils/catch-errors'
import { z } from 'zod'

export class SessionController {
  private sessionService: SessionService

  // Initialize the SessionController with a specific SessionService instance.
  constructor(sessionService: SessionService) {
    this.sessionService = sessionService
  }

  // Handle retrieving all sessions for the current user, marking the current session if it matches the sessionId.
  public getAllSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id // Get the user's ID from the request (authenticated user).
    const sessionId = req.sessionId // Get the current session ID from the request.

    // Fetch all sessions for the user using the session service.
    const { sessions } = await this.sessionService.getAllSession(userId)

    // Transform sessions, adding an "isCurrent" flag for the active session.
    const modifySessions = sessions.map((session) => ({
      ...session.toObject(),
      ...(session.id === sessionId && {
        isCurrent: true, // Add the "isCurrent" flag to identify the current session.
      }),
    }))

    // Return the transformed sessions as a JSON response with a success message.
    return res.status(HTTPSTATUS.OK).json({
      message: 'Retrieved all session successfully',
      sessions: modifySessions,
    })
  })

  // Handle retrieving a specific session using the sessionId in the request.
  public getSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req?.sessionId // Get the session ID from the request object.

    // Throw an error if the session ID is not found (e.g., user is not logged in).
    if (!sessionId) {
      throw new NotFoundException('Session ID not found. Please log in.')
    }

    // Use the session service to fetch the session by its ID and get the associated user details.
    const { user } = await this.sessionService.getSessionById(sessionId)

    // Return the user details associated with the session as a JSON response with a success message.
    return res.status(HTTPSTATUS.OK).json({
      message: 'Session retrieved successfully',
      user,
    })
  })

  // Handle deleting a session identified by its ID, ensuring the session belongs to the current user.
  public deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = z.string().parse(req.params.id) // Validate and extract the session ID from the request parameters.
    const userId = req.user?.id // Get the user's ID from the request (authenticated user).

    // Call the session service to delete the session for the given session ID and user ID.
    await this.sessionService.deleteSession(sessionId, userId)

    // Return a success message as a JSON response.
    return res.status(HTTPSTATUS.OK).json({
      message: 'Session remove successfully',
    })
  })

  /*
   * Quick Summary:
   * 1. Constructor: Initializes the controller with a SessionService to handle session-related operations.
   * 2. getAllSession: Retrieves all sessions for the user, marking the current session with an "isCurrent" flag.
   * 3. getSession: Fetches a session using the current sessionId, with proper error handling if the sessionId is missing.
   * 4. deleteSession: Validates and deletes a session by ID for the authenticated user, ensuring proper ownership.
   */
}
