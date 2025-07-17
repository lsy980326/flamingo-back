import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import logger from "../config/logger";

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const transporter = nodemailer.createTransport({
  SES: sesClient,
});

// 이메일 발송 함수
export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${process.env.CLIENT_URL}/auth/verify?token=${token}`;

  // sendMail의 첫 번째 인자로 전달할 객체
  const mailOptions = {
    from: `Flamingo <no-reply@flamingodraw.com>`,
    to: to,
    subject: "🦩 Flamingo 회원가입 인증 메일입니다.",
    html: `
      <h1>Flamingo에 오신 것을 환영합니다!</h1>
      <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
      <a href="${verificationUrl}" 
         style="background-color: #007bff; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
        이메일 인증하기
      </a>
      <p>또는 다음 링크를 브라우저에 붙여넣으세요: <a href="${verificationUrl}">${verificationUrl}</a></p>
    `,
  };

  const command = new SendEmailCommand({
    FromEmailAddress: mailOptions.from,
    Destination: { ToAddresses: [mailOptions.to] },
    Content: {
      Simple: {
        Subject: { Data: mailOptions.subject },
        Body: { Html: { Data: mailOptions.html } },
      },
    },
  });

  try {
    const info = await transporter.sendMail(command as any);
    logger.info(
      `Email sent successfully to ${to} via SESv2: ${info.messageId}`
    );
  } catch (error) {
    logger.error(`Failed to send email to ${to} via SESv2`, error);
  }
}
