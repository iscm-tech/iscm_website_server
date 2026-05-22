import z from "zod";

export const UserSchema = z.object({
  id: z.number(),
  username: z.string().email().or(z.literal("admin")),
});

export type UserType = z.TypeOf<typeof UserSchema>;

export const RegisterBody = z
  .object({
    username: z.string().email().or(z.literal("admin")),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Confirm Password incorrect",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterBodyType = z.TypeOf<typeof RegisterBody>;

export const RegisterRes = z.object({
  data: z.object({
    token: z.string(),
    expires: z.date(),
    account: z.object({
      id: z.number(),
      username: z.string().email().or(z.literal("admin")),
    }),
  }),
  message: z.string(),
});

export type RegisterResType = z.TypeOf<typeof RegisterRes>;

export const ActivitiesUserSchema = UserSchema.extend({
  editedHistory: z.array(
    z.object({
      time: z.string().datetime(),
      section: z.object({
        part: z.string(),
        id: z.string(),
      }),
    }),
  ),
});

export type ActivitiesUserType = z.TypeOf<typeof ActivitiesUserSchema>;

export const LoginBody = z.discriminatedUnion("auth_provider", [
  z.object({
    auth_provider: z.literal("google"),
    username: z.string().email(),
    password: z.undefined().optional(),
  }),
  z.object({
    auth_provider: z.literal("password"),
    username: z.string().email().or(z.literal("admin")),
    password: z.string().min(8),
  }),
]);
export type LoginBodyType = z.TypeOf<typeof LoginBody>;

export const LoginRes = z.object({
  data: z.object({
    token: z.string(),
    expires: z.date(),
  }),
  message: z.string(),
});
export type LoginResType = z.TypeOf<typeof LoginRes>;

export const SlideSessionBody = z.object({}).strict();
export type SlideSessionBodyType = z.TypeOf<typeof SlideSessionBody>;

export const SlideSessionRes = RegisterRes;
export type SlideSessionResType = z.TypeOf<typeof SlideSessionRes>;
