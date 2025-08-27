import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailerService {
  private transporter?: nodemailer.Transporter;
  private from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    const port = Number(this.config.get<string>("SMTP_PORT") || 587);
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    this.from = this.config.get<string>("EMAIL_FROM") || "no-reply@example.com";

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  async sendEmailVerification(to: string, verifyUrl: string) {
    const subject = "[WithoutAlone] 이메일 주소 인증";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Apple Color Emoji,Segoe UI Emoji">
        <h2>이메일 인증 안내</h2>
        <p>아래 버튼을 눌러 이메일을 인증해주세요.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">이메일 인증하기</a></p>
        <p>링크가 보이지 않으면 아래 주소를 복사해 브라우저에 붙여넣으세요.</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `;
    if (!this.transporter) {
      console.warn(
        "SMTP not configured. Skipping email send to:",
        to,
        "url:",
        verifyUrl
      );
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
