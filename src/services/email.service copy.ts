import nodemailer from "nodemailer";
import logger from "../config/logger";

let transporter: nodemailer.Transporter;

async function initializeTransporter() {
  // 개발 환경에서는 Ethereal 테스트 계정을 사용
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    logger.info(`📧 Ethereal test account ready: User: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // 운영 환경(또는 development가 아닌 모든 환경)에서는 .env의 실제 SMTP 정보를 사용
    logger.info(`📧 Using production SMTP server: ${process.env.SMTP_HOST}`);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
}

const transporterPromise = initializeTransporter().catch((err) => {
  logger.error("Failed to initialize email transporter", err);
  return null;
});

async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  logger.info(
    `📧 Ethereal test account created: User: ${testAccount.user}, Pass: ${testAccount.pass}`
  );

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

createTestAccount().catch((err) =>
  logger.error("Failed to create Ethereal test account", err)
);

// 인증 이메일 발송 함수
export async function sendVerificationEmail(to: string, token: string) {
  const transporter = await transporterPromise;
  if (!transporter) {
    logger.error("Transporter is not available. Email not sent.");
    return;
  }

  // 프론트엔드 인증 페이지 URL
  const verificationUrl = `${process.env.CLIENT_URL}/auth/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
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

  try {
    const info = await transporter.sendMail(mailOptions);

    // 개발 환경일 때만 Ethereal 미리보기 URL을 출력
    if (process.env.NODE_ENV === "development") {
      logger.info(`▶ Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    }
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
  }
}
