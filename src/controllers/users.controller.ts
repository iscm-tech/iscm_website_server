import { addMilliseconds } from "date-fns";
import ms from "ms";

import {
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  RegisterResType,
  SlideSessionResType,
  UserSchema,
} from "@/schemaValidation/users.schema";
import { comparePassword, hashPassword } from "@/utils/crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import generateID from "@/utils/generateUUID";
import envConfig from "config";
import { ErrorResType } from "@/types/error.types";
import { signSessionToken } from "@/utils/jwt";
import AuthModel from "@/models/token.model";
import AccountModel from "@/models/account.model";

async function registerUser(
  request: FastifyRequest<{ Body: RegisterBodyType }>,
  reply: FastifyReply<{
    Reply: {
      200: RegisterResType;
      500: ErrorResType;
      409: { message: string };
    };
  }>,
): Promise<void> {
  const { body } = request;
  const authModel = new AuthModel();
  const accountModel = new AccountModel("staffs");

  try {
    const hashedPassword = await hashPassword(body.password);
    const id: string = generateID();
    const user = {
      id,
      username: body.username,
      password: hashedPassword,
    };

    const accountList = await accountModel.getUserID(user.username);

    if (accountList.rowCount) {
      reply.code(409).send({ message: "Username already in use" });
      return;
    }

    await accountModel.insertAccount({
      username: user.username,
      password: user.password,
    });

    const sessionToken = signSessionToken({
      userId: id,
    });

    const expiresAt = addMilliseconds(
      new Date(),
      ms(envConfig.SESSION_TOKEN_EXPIRES_IN),
    );

    await authModel.addToken(id, sessionToken, expiresAt);

    reply
      .code(200)
      .setCookie("sessionToken", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: "none",
      })
      .send({
        message: "Create new user successfully",
        data: {
          token: sessionToken,
          account: {
            id,
            username: body.username,
          },
          expiresAt: expiresAt,
        },
      });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function loginUser(
  request: FastifyRequest<{ Body: LoginBodyType }>,
  reply: FastifyReply<{
    Reply: { 200: LoginResType; 500: ErrorResType; 404: { message: string } };
  }>,
): Promise<void> {
  const { username, password, auth_provider } = request.body;
  const accountModel = new AccountModel("members");
  const authModel = new AuthModel();

  try {
    if (auth_provider === "google") {
      const isMember =
        (await accountModel.getAllowedGoogle(username)).rows[0].count > 0;

      if (!isMember) {
        reply.code(404).send({ message: "Permission Denied!" });
        return;
      }
    } else {
      const db_password = await accountModel.getPassword(username);

      if (!db_password.rowCount) {
        reply.code(404).send({ message: "Username not found" });
        return;
      }

      const isPasswordCorrect = await comparePassword(
        password,
        db_password.rows[0].password,
      );

      if (!isPasswordCorrect) {
        reply.code(404).send({ message: "Password Incorrect" });
        return;
      }
    }

    const infoUser = (await accountModel.getUserID(username)).rows[0];

    // Handle Token
    const sessionToken = signSessionToken({
      userId: infoUser.id,
    });

    const existedToken = await authModel.getTokenByAccountID(infoUser.id);

    if (existedToken.rowCount) {
      for (const token of existedToken.rows)
        await authModel.deleteToken(token.token);
    }

    // Should be added logic for delete token which has been still expired and add new one
    const expiresAt = addMilliseconds(
      new Date(),
      ms(envConfig.SESSION_TOKEN_EXPIRES_IN),
    );

    await authModel.addToken(infoUser.id, sessionToken, expiresAt);

    reply
      .code(200)
      .setCookie("sessionToken", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: "none",
      })
      .send({
        data: {
          token: sessionToken,
          expires: expiresAt,
        },
        message: "Login successful",
      });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function logoutUser(
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>,
) {
  const sessionToken =
    request.cookies.sessionToken || request.headers.authorization || "";
  const authModel = new AuthModel();
  try {
    await authModel.deleteToken(sessionToken);

    reply
      .code(200)
      .clearCookie("sessionToken", {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .send({ message: "Logged out successfully" });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function slideSessionController(
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: { 200: SlideSessionResType; 500: ErrorResType };
  }>,
) {
  const sessionToken: string = request.headers.authorization || "";

  const expireDate = addMilliseconds(
    new Date(),
    ms(envConfig.SESSION_TOKEN_EXPIRES_IN),
  );
  const authModel = new AuthModel();

  try {
    const session = (await authModel.updateToken(sessionToken, expireDate))
      .rows[0];

    reply.code(200).send({
      data: {
        token: session.token,
        expires: session.expireDate,
        account: request.user,
      },
      message: "Slide session successfully",
    });
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: "Internal server error" });
    return;
  }
}

export { registerUser, loginUser, logoutUser, slideSessionController };
