import {
  loginUser,
  logoutUser,
  registerUser,
  slideSessionController,
} from "@/controllers/users.controller";
import { requiredAdminHook, requiredLoginedHook } from "@/hooks/auth.hook";
import AuthModel from "@/models/token.model";
import {
  LoginBodyType,
  LoginResType,
  RegisterBody,
  RegisterBodyType,
  RegisterRes,
  RegisterResType,
  SlideSessionBody,
  SlideSessionBodyType,
  SlideSessionRes,
  SlideSessionResType,
} from "@/schemaValidation/users.schema";
import { ErrorResType } from "@/types/error.types";
import { verifySessionToken } from "@/utils/jwt";
import { FastifyInstance } from "fastify";

async function usersRoute(server: FastifyInstance) {
  server.post<{
    Reply: { 200: LoginResType; 500: ErrorResType; 404: { message: string } };
    Body: LoginBodyType;
  }>("/login", loginUser);

  server.post<{
    Reply: {
      200: RegisterResType;
      500: ErrorResType;
      409: { message: string };
    };
    Body: RegisterBodyType;
  }>(
    "/register",
    {
      schema: {
        response: {
          200: RegisterRes,
        },
        body: RegisterBody,
      },
      preValidation: [requiredLoginedHook, requiredAdminHook],
    },
    registerUser,
  );

  server.post<{
    Reply: { 200: SlideSessionResType; 500: ErrorResType };
    Body: SlideSessionBodyType;
  }>(
    "/slide-session",
    {
      schema: {
        response: {
          200: SlideSessionRes,
        },
        body: SlideSessionBody,
      },
      preValidation: [requiredLoginedHook],
    },
    slideSessionController,
  );

  server.post<{ Reply: { 200: { message: string }; 500: ErrorResType } }>(
    "/logout",
    {
      preValidation: [requiredLoginedHook],
    },
    logoutUser,
  );

  server.post("/checked-valid-session", async (request, reply) => {
    const sessionToken = request.headers.authorization || "";

    if (!sessionToken) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const authModel = new AuthModel();

    try {
      const decode = verifySessionToken(sessionToken);
      const token = (await authModel.getToken(sessionToken)).rows[0];

      if (
        !token?.accountID &&
        Number(token?.accountID) !== Number(decode.userId)
      ) {
        throw new Error("Session Token is Invalid");
      }

      reply.status(200).send({
        message: "Session is valid",
        token: sessionToken,
        expires: token.expireDate,
      });
    } catch (error) {
      console.log(error);
      reply.status(401).send({ message: "Error on Authorizing" });
    }
  });
}

export default usersRoute;
