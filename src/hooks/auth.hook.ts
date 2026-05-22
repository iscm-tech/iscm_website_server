import { FastifyReply, FastifyRequest } from "fastify";
import { verifySessionToken } from "@/utils/jwt";
import { UserSchema } from "@/schemaValidation/users.schema";
import AuthModel from "@/models/token.model";
import AccountModel from "@/models/account.model";

// Middleware to ensure the user is logged in by validating the session token
async function requiredLoginedHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionToken: string = request.headers.authorization || ""; // Get session token from Authorization header

  const authModel = new AuthModel(); // Create an instance of AuthModel
  const accountModel = new AccountModel("members"); // Create an instance of AccountModel for 'staffs' table

  try {
    const session = await authModel.getToken(sessionToken); // Check if the session token exists in DB

    if (session.rowCount) {
      // If session exists
      try {
        const decode = verifySessionToken(sessionToken); // Verify and decode the session token

        const response = await accountModel.getInfoByID(decode.userId); // Get user info by decoded userId
        if (!response.rowCount) {
          // If user not found
          // authModel.deleteToken(sessionToken); // Delete the invalid session token
          reply.code(401).send({ message: "Required Login" }); // Respond with 401 Unauthorized
          return;
        }

        const user = UserSchema.safeParse(response.rows[0]); // Parsing user data with schema

        if (!user.success) {
          // If validation fails
          throw new Error(user.error.message); // Throw error with validation message
        }

        request.user = user.data; // Attach validated user data to request object
      } catch (error) {
        // Catch errors in token verification or user lookup
        console.log(error);
        authModel.deleteToken(sessionToken); // Delete the invalid session token
        reply.code(401).send({ message: "Required Login" }); // Respond with 401 Unauthorized
        return;
      }
    } else {
      // If session does not exist
      reply.code(404).send({ message: "Invalid session token" }); // Respond with 404 Not Found
    }
  } catch (error) {
    // Catch errors in DB operations
    console.log(error, "error in requiredLoginedHook");
    reply.code(500).send({ message: error }); // Respond with 500 Internal Server Error
  }
}

// Middleware to ensure the user is an admin
async function requiredAdminHook(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.username !== "admin") {
    // Check if user is not admin
    reply.code(403).send({ message: "Admins only" }); // Respond with 403 Forbidden
    return;
  }
}

// Utility to check if a user is logged in (without sending a response)
async function checkIsLogined(request: FastifyRequest) {
  const sessionToken: string = request.headers.authorization || ""; // Get session token from Authorization header

  if (!sessionToken) return; // If no token, exit

  const authModel = new AuthModel(); // Create AuthModel instance
  const accountModel = new AccountModel("members"); // Create AccountModel instance

  const session = await authModel.getToken(sessionToken); // Check if session exists

  if (session.rows) {
    // If session exists
    try {
      const decode = verifySessionToken(sessionToken); // Verify and decode token

      const response = await accountModel.getInfoByID(decode.userId); // Get user info

      if (!response.rowCount) return; // If user not found, exit

      const user = UserSchema.safeParse(response.rows[0]); // Validate user data

      if (!user.success) {
        return; // If validation fails, exit
      }

      request.user = user.data; // Attach user data to request
    } catch (error) {
      return; // On error, exit
    }
  }
}

export { requiredLoginedHook, checkIsLogined, requiredAdminHook };
