import z from "zod";
import { FastifyInstance } from "fastify";
import fs from "fs";

import {
  createNewMember,
  deleteMember,
  getMember,
  getMemberList,
  updateMember,
} from "@/controllers/member.controller";
import {
  CreateUpdateMemberResType,
  MemberListResType,
  MemberParamsRequestType,
  MemberResType,
} from "@/types/member.types";
import { ErrorResType } from "@/types/error.types";
import {
  CreateMemberBody,
  CreateMemberType,
  UpdateMemberBody,
  UpdateMemberType,
} from "@/schemaValidation/member.schema";
import { requiredLoginedHook } from "@/hooks/auth.hook";

async function memberRoute(server: FastifyInstance) {
  server.get<{
    Params: MemberParamsRequestType;
    Querystring: { lang: LangType; type?: string };
    Reply: { 200: MemberListResType; 500: ErrorResType };
  }>(
    "/:category",
    {
      schema: {
        params: z.object({
          category: z.enum(["members", "intern", "advisory", "network"]),
        }),
      },
    },
    getMemberList,
  );

  server.get<{
    Params: MemberParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: MemberResType; 500: ErrorResType; 404: { message: string } };
  }>("/:category/:id_member", getMember);

  server.post<{
    Querystring: { lang: LangType };
    Body: CreateMemberType;
    Params: MemberParamsRequestType;
    Reply: { 200: CreateUpdateMemberResType; 500: ErrorResType };
  }>(
    "/:category/:id_member",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: CreateMemberBody,
      },
    },
    createNewMember,
  );

  server.put<{
    Querystring: { lang: LangType };
    Body: UpdateMemberType;
    Params: MemberParamsRequestType;
    Reply: { 200: CreateUpdateMemberResType; 500: ErrorResType };
  }>(
    "/:category/:id_member",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: UpdateMemberBody,
      },
    },
    updateMember,
  );

  server.delete<{
    Querystring: { lang: LangType };
    Params: MemberParamsRequestType;
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>(
    "/:category/:id_member",
    { preValidation: [requiredLoginedHook] },
    deleteMember,
  );
}

export default memberRoute;
