import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import logger from "../config/logger";

let sesClient: SESv2Client | null = null;
let isEmailServiceReady = false;

export async function initializeEmailService() {
  if (process.env.NODE_ENV === "development") {
    logger.info(`📧 [Email] Development mode: Email sending is mocked.`);
    isEmailServiceReady = true;
    return;
  }

  try {
    logger.info(`📧 [Email] Production mode: Initializing AWS SES client...`);
    sesClient = new SESv2Client({
      region: process.env.AWS_REGION || "ap-northeast-2",
    });

    isEmailServiceReady = true;
    logger.info("✅ [Email] AWS SES client initialized successfully.");
  } catch (error) {
    logger.error(
      "❌ CRITICAL [Email]: Failed to initialize AWS SES client. Email sending will be disabled.",
      error
    );
    isEmailServiceReady = false;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  if (!isEmailServiceReady || !sesClient) {
    logger.error(
      `[Email] Email service is not ready. Could not send verification email to ${to}.`
    );
    throw new Error(
      `Email service is not ready, could not send email to ${to}.`
    );
  }

  const verificationUrl = `${
    process.env.CLIENT_URL || "http://localhost:3000"
  }/auth/verify?token=${token}`;
  const fromEmail = process.env.EMAIL_FROM;

  if (!fromEmail) {
    logger.error("[Email] EMAIL_FROM environment variable is not set.");
    throw new Error("Sender email address is not configured.");
  }

  const command = new SendEmailCommand({
    FromEmailAddress: fromEmail,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: {
          Data: "🦩 Flamingo 회원가입 인증 메일입니다.",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <h1>Flamingo에 오신 것을 환영합니다!</h1>
              <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
                이메일 인증하기
              </a>
              <p>또는 다음 링크를 브라우저에 붙여넣으세요: <a href="${verificationUrl}">${verificationUrl}</a></p>
            `,
            Charset: "UTF-8",
          },
        },
      },
    },
  });

  try {
    const result = await sesClient.send(command);
    logger.info(
      `[Email] Sent successfully to ${to} via SES. Message ID: ${result.MessageId}`
    );
  } catch (error) {
    logger.error(`[Email] Failed to send email to ${to} with SES.`, error);
    throw error;
  }
}
