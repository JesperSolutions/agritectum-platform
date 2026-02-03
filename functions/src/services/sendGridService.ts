import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from 'firebase-functions';

export interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: { email: string; name?: string } | string;
  replyTo?: string;
  template: {
    name: string;
    data: Record<string, any>;
  };
  subject?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SendGridService {
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
  private subjectCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  private getTemplateDir(): string {
    return path.resolve(__dirname, '../../../email/templates');
  }

  private registerPartials(templateDir: string): void {
    const partials = ['_header.hbs', '_footer.hbs'];
    partials.forEach(file => {
      const filePath = path.join(templateDir, file);
      if (fs.existsSync(filePath)) {
        const name = file.replace('.hbs', '').replace('_', '');
        const content = fs.readFileSync(filePath, 'utf-8');
        Handlebars.registerPartial(name, content);
      }
    });
  }

  private registerHelpers(): void {
    if (!Handlebars.helpers.formatDate) {
      Handlebars.registerHelper('formatDate', (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('da-DK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      });
    }

    if (!Handlebars.helpers.formatCurrency) {
      Handlebars.registerHelper('formatCurrency', (amount: number) => {
        return new Intl.NumberFormat('da-DK', {
          style: 'currency',
          currency: 'DKK',
        }).format(amount);
      });
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private loadSubjectTemplate(templateName: string): Handlebars.TemplateDelegate {
    if (this.subjectCache.has(templateName)) {
      return this.subjectCache.get(templateName)!;
    }

    const templateDir = this.getTemplateDir();
    const configPath = path.join(templateDir, 'template-config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const templateConfig = config.templates?.[templateName];
      if (templateConfig?.subject) {
        const compiled = Handlebars.compile(templateConfig.subject);
        this.subjectCache.set(templateName, compiled);
        return compiled;
      }
    }

    const fallback = Handlebars.compile('Notification from Agritectum');
    this.subjectCache.set(templateName, fallback);
    return fallback;
  }

  private loadTemplate(templateName: string): {
    html: Handlebars.TemplateDelegate;
    text: Handlebars.TemplateDelegate;
    subject: Handlebars.TemplateDelegate;
  } {
    if (this.templateCache.has(templateName)) {
      const cached = this.templateCache.get(templateName)!;
      return {
        html: cached,
        text: cached,
        subject: this.loadSubjectTemplate(templateName),
      };
    }

    const templateDir = this.getTemplateDir();
    const htmlPath = path.join(templateDir, `${templateName}.hbs`);
    const textPath = path.join(templateDir, `${templateName}.txt.hbs`);

    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    this.registerPartials(templateDir);
    this.registerHelpers();

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const textContent = fs.existsSync(textPath)
      ? fs.readFileSync(textPath, 'utf-8')
      : this.htmlToText(htmlContent);

    const htmlTemplate = Handlebars.compile(htmlContent);
    const textTemplate = Handlebars.compile(textContent);

    this.templateCache.set(templateName, htmlTemplate);

    return {
      html: htmlTemplate,
      text: textTemplate,
      subject: this.loadSubjectTemplate(templateName),
    };
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const templates = this.loadTemplate(request.template.name);
      const html = templates.html(request.template.data);
      const text = templates.text(request.template.data);
      const subject = request.subject || templates.subject(request.template.data);

      const msg: sgMail.MailDataRequired = {
        to: request.to,
        from:
          request.from ||
          ({
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@taklaget.app',
            name: process.env.SENDGRID_FROM_NAME || 'Agritectum',
          } as { email: string; name: string }),
        replyTo: request.replyTo,
        subject,
        html,
        text,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
        categories: ['agritectum-platform', request.template.name],
      };

      if (request.cc) msg.cc = request.cc;
      if (request.bcc) msg.bcc = request.bcc;
      if (request.attachments) msg.attachments = request.attachments;

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error: any) {
      logger.error('SendGrid email failed', {
        error: error?.message,
        response: error?.response?.body,
      });

      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }
}

export const sendGridService = new SendGridService();
