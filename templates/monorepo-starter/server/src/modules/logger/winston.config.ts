import * as winston from "winston";
import "winston-daily-rotate-file";
import { utilities } from "nest-winston";
import { appName } from "@/lib/constants/app";

const isProduction = process.env.NODE_ENV === "production";

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: isProduction ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        utilities.format.nestLike(appName, { prettyPrint: true })
      ),
    }),

    new winston.transports.DailyRotateFile({
      dirname: "logs",
      filename: "app-%DATE%.log",
      datePattern: "DD-MM-YYYY",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info",
    }),

    new winston.transports.DailyRotateFile({
      dirname: "logs",
      filename: "error-%DATE%.log",
      datePattern: "DD-MM-YYYY",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
    }),
  ],

  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],

  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
};
