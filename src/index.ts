import * as dotenv from "dotenv";
import path from "path";
import cors from "@fastify/cors";
import fastify, { FastifyRequest, HookHandlerDoneFunction } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyMultipart from "@fastify/multipart";

import newsRoute from "./routes/news.route";
import eventRoute from "./routes/event.route";
import memberRoute from "./routes/member.route";
import researchRoute from "./routes/research.route";
import competitionRoute from "./routes/competition.route";
import courseRoute from "./routes/course.route";
import usersRoute from "./routes/users.route";
import validatorCompilerPlugin from "./plugins/validatorCompiler.plugin";
import envConfig from "config";
import uploadImageRoute from "./routes/upload.route";
import portalRoute from "./routes/portal.route";
import studiolabRoute from "./routes/studiolab.route";
import evolvingResearchRoute from "./routes/evolving-research.route";
import admissionRoute from "./routes/admission.route";
import utilsRoute from "./routes/utils.route";
import recruitmentRoute from "./routes/recruitment.route";
import studentLifeRoute from "./routes/student_life.route";

dotenv.config();

(async function main() {
  const server = fastify();

  // Plugins
  server.register(cors, {
    credentials: true,
    origin: (origin, cb) => {
      /* Do not check API calls from the server,
         just apply on APIs called from browser */
      if (!origin) return cb(null, true);

      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // Allow ueh.edu.vn + subdomain
        if (
          hostname === "localhost" ||
          hostname === "ueh.edu.vn" ||
          hostname.endsWith(".ueh.edu.vn")
        ) {
          return cb(null, true);
        }

        return cb(new Error("Not allowed by CORS"), false);
      } catch (error) {
        return cb(new Error("Invalid origin"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  server.register((await import("@fastify/static")).default, {
    root: path.join(process.cwd(), "public"),
    prefix: "/public/",
  });

  server.register(validatorCompilerPlugin);

  server.register(fastifyCookie);
  server.register(fastifySession, { secret: envConfig.SESSION_TOKEN_SECRET });

  server.register(fastifyMultipart, {
    limits: {
      fileSize: 2e7,
      files: Infinity,
    },
  });

  // Routes
  server.addHook(
    "preHandler",
    (
      request: FastifyRequest<{
        Querystring: { lang: LangType };
      }>,
      _,
      done: HookHandlerDoneFunction,
    ) => {
      const lang: LangType = request.query.lang || "en";
      request.lang = lang;
      done();
    },
  );

  // Register Routes
  server.register(newsRoute, { prefix: "api/news" });
  server.register(studentLifeRoute, { prefix: "api/student_life" });
  server.register(eventRoute, { prefix: "api/events" });
  server.register(memberRoute, { prefix: "api/people" });
  server.register(researchRoute, { prefix: "api/research" });
  server.register(competitionRoute, { prefix: "api/competition" });
  server.register(courseRoute, { prefix: "api/education" });
  server.register(studiolabRoute, { prefix: "api/studiolab" });
  server.register(evolvingResearchRoute, { prefix: "api/evolving-research" });
  server.register(admissionRoute, { prefix: "api/open-admission" });
  server.register(recruitmentRoute, { prefix: "api/recruitment" });
  server.register(portalRoute, { prefix: "api/portal" });
  server.register(usersRoute, { prefix: "api/users" });
  server.register(uploadImageRoute, { prefix: "api/upload" });
  server.register(utilsRoute, { prefix: "api/utils" });

  try {
    await server.listen({
      port: Number(envConfig.PORT),
      host: "0.0.0.0",
    });
    console.log(`Server ready at ${envConfig.PORT}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
