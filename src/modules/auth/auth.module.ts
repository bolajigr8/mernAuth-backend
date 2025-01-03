import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

const authService = new AuthService()
// Creates an instance of AuthService.

const authController = new AuthController(authService)
// Creates an instance of AuthController and injects the authService instance into it.

export { authService, authController }
// Exports the instances for use in other parts of the application.

/*

Workflow Explanation:

The auth.module.ts acts as a central module for the authentication feature.
It creates instances of AuthService and AuthController.
The AuthController is provided with the AuthService instance, ensuring dependency injection.
These instances are exported for use in the auth.routes.ts file.

*/
