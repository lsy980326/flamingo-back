import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel, CreateUserPayload } from "../models/user.model";
import logger from "./logger";

export const setupPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          const googleId = profile.id;
          const name = profile.displayName;
          if (!email)
            return done(
              new Error("Google profile did not return an email."),
              undefined
            );
          let user = await UserModel.findByEmail(email);
          if (user) {
            if (user.provider !== "google") {
              user = await UserModel.updateProvider(
                user.id,
                "google",
                googleId
              );
            }
          } else {
            const newUserPayload: CreateUserPayload = {
              email,
              name,
              provider: "google",
              provider_id: googleId,
              status: "active",
              email_verified: true,
              agree_terms: true,
              agree_privacy: true,
            };
            user = await UserModel.create(newUserPayload);
          }
          return done(null, user);
        } catch (error) {
          logger.error("Error in Google Strategy", error);
          return done(error as Error, undefined);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as any));
};
