import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Restablece tu contraseña ✔',
      html: '<h1>¡Bienvenido a EcoBreak! 🎉</h1><p>Haz clic en el enlace para restablecer tu contraseña:</p><a href="{{token}}">Restablece contraseña</a>',
      context: {
        token, // variable que pasa a la plantilla
      },
    });
  }
}
