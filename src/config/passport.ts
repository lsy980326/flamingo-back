import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model";
import logger from "./logger";

export const setupPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"], // 구글로부터 받을 정보 범위
      },
      async (accessToken, refreshToken, profile, done) => {
        // 구글로부터 사용자 정보를 성공적으로 받아왔을 때 실행되는 함수
        try {
          const email = profile.emails?.[0].value;
          const googleId = profile.id;
          const name = profile.displayName;

          if (!email) {
            // 이메일 정보가 없는 경우 에러 처리
            return done(
              new Error("Google profile did not return an email."),
              undefined
            );
          }

          // 1. 기존 사용자인지 확인
          let user = await UserModel.findByEmail(email);

          if (user) {
            // 1-1. 기존 사용자인데, 구글 연동이 안된 경우 (이메일로 가입 후 구글 연동)
            if (user.social_type !== "google") {
              user = await UserModel.updateProvider(
                user.id,
                "google",
                googleId
              );
            }
          } else {
            // 2. 신규 사용자인 경우, 자동으로 회원가입 처리
            user = await UserModel.create({
              email,
              name,
              social_type: "google",
              social_id: googleId,
              status: "active", // 소셜 로그인은 이메일이 검증된 것으로 간주
              email_verified: true,
              agree_terms: true, // 소셜 로그인 시 필수 약관은 동의한 것으로 처리
              agree_privacy: true,
            });
          }

          // 사용자 정보를 다음 단계(컨트롤러)로 전달
          return done(null, user);
        } catch (error) {
          logger.error("Error in Google Strategy", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Passport는 세션을 사용하지 않으므로, serialize/deserialize는 비워둡니다.
  // 우리는 JWT 기반의 무상태(stateless) 인증을 사용할 것입니다.
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user as any);
  });
};
