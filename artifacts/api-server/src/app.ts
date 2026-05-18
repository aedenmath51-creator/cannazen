import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { helmetMiddleware } from "./middlewares/security";
import { loadUser } from "./middlewares/auth";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(helmetMiddleware);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, cb) {
      // Allow same-origin / curl / server-to-server
      if (!origin) return cb(null, true);
      // Allow listed origins or any vercel preview/prod of this project
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https:\/\/cannazen(-[a-z0-9-]+)?\.vercel\.app$/.test(origin))
        return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
  }),
);
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      // Preserve raw body for webhook signature verification (Sendcloud, etc.)
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(loadUser);

app.use("/api", router);

export default app;
