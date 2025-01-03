import { NotFoundException } from '../../common/utils/catch-errors'
import SessionModel from '../../database/models/session.model'

export class SessionService {
  // Retrieves all active sessions for a user, filtering by userId and ensuring the session has not expired.
  public async getAllSession(userId: string) {
    const sessions = await SessionModel.find(
      {
        userId, // Filter sessions by the provided user ID.
        expiredAt: { $gt: Date.now() }, // Ensure sessions have not yet expired by checking the expiration timestamp.
      },
      {
        _id: 1, // Select only relevant fields: session ID, user ID, user agent, creation date, and expiration date.
        userId: 1,
        userAgent: 1,
        createdAt: 1,
        expiredAt: 1,
      },
      {
        sort: {
          createdAt: -1, // Sort sessions by creation date in descending order (most recent first).
        },
      }
    )

    return {
      sessions, // Return the list of sessions.
    }
  }

  // Fetches a session by its ID, including the associated user details, and handles cases where the session does not exist.
  public async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId) // Find the session by ID in the database.
      .populate('userId') // Populate user information from the related user ID field.
      .select('-expiresAt') // Exclude the expiration date field from the result.

    if (!session) {
      throw new NotFoundException('Session not found') // Throw an exception if no session is found with the given ID.
    }
    const { userId: user } = session // Extract the user object from the session data.

    return {
      user, // Return the user details linked to the session.
    }
  }

  // Deletes a session identified by sessionId and verifies it belongs to the specified userId.
  public async deleteSession(sessionId: string, userId: string) {
    const deletedSession = await SessionModel.findByIdAndDelete({
      _id: sessionId, // Match the session ID.
      userId: userId, // Ensure the session belongs to the provided user ID.
    })

    if (!deletedSession) {
      throw new NotFoundException('Session not found') // Throw an exception if no matching session is found.
    }
    return // Return nothing if the deletion was successful.
  }
}

/*
 * Quick Summary:
 * 1. getAllSession: Fetches all active sessions for a given user, filtering out expired ones, and returns them sorted by creation date.
 * 2. getSessionById: Finds a session by its ID, includes user details through population, and ensures the session exists.
 * 3. deleteSession: Deletes a session by its ID for a specific user, verifying both the session and user match, and handles errors if not found.
 */
