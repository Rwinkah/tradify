import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { readFile, readdir } from 'fs/promises';
import * as path from 'path';

@Injectable()
export class NotificationService {
  private emailSender: nodemailer.Transporter;
  private templates: Record<string, string> = {};

  constructor(private configService: ConfigService) {
    this.emailSender = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async onModuleInit() {
    await this.loadTemplates();
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    return this.emailSender.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      text,
      html,
    });
  }

  async sendOtpEmail(to: string, firstName: string, otp: string) {
    const text = `Hello ${firstName}, your OTP code is ${otp}. It expires in 10 minutes.`;
    const html = this.templates['otpRequest']
      .replace('{{OTP}}', otp)
      .replace('{{FIRST_NAME}}', firstName);

    return this.emailSender.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Verify your email address',
      text,
      html,
    });
  }

  private async loadTemplates() {
    const templatesDir = path.join(
      process.cwd(),
      'src',
      'notification',
      'emailTemplates',
    );
    const files = await readdir(templatesDir);

    for (const file of files) {
      const filePath = path.join(templatesDir, file);
      const templateName = path.basename(file, path.extname(file)); // Get the file name without extension
      const content = await readFile(filePath, 'utf-8');
      this.templates[templateName] = content;
    }
  }
}
