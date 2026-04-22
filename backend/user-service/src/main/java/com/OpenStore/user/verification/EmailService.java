package com.OpenStore.user.verification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String name, UUID token) throws MessagingException {
        String verificationUrl = baseUrl + "/api/auth/verify-email?token=" + token;

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(toEmail);
        helper.setFrom(fromEmail);
        helper.setSubject("OpenStore — Verifica tu correo electrónico");
        helper.setText(buildEmailBody(name, verificationUrl), true);

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String name, UUID token) throws MessagingException {
        String resetUrl = baseUrl + "/api/auth/reset-password?token=" + token;

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(toEmail);
        helper.setFrom(fromEmail);
        helper.setSubject("OpenStore — Recuperación de contraseña");
        helper.setText(buildPasswordResetEmailBody(name, resetUrl), true);

        mailSender.send(message);
    }

    private String buildEmailBody(String name, String verificationUrl) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
                  <h2 style="color:#9ACD32;margin-bottom:8px">¡Bienvenido a OpenStore, %s!</h2>
                  <p style="color:#374151">Gracias por registrarte. Por favor verifica tu dirección de correo haciendo clic en el botón de abajo:</p>
                  <div style="text-align:center;margin:32px 0">
                    <a href="%s"
                       style="display:inline-block;background:#9ACD32;color:#fff;padding:14px 32px;
                              border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
                      Verificar Email
                    </a>
                  </div>
                  <p style="color:#6b7280;font-size:13px">Este enlace expira en 24 horas.</p>
                  <p style="color:#6b7280;font-size:13px">Si no creaste una cuenta en OpenStore, puedes ignorar este correo.</p>
                </div>
                """.formatted(name, verificationUrl);
    }

    private String buildPasswordResetEmailBody(String name, String resetUrl) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
                  <h2 style="color:#9ACD32;margin-bottom:8px">Recuperación de contraseña</h2>
                  <p style="color:#374151">Hola <strong>%s</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en OpenStore.</p>
                  <p style="color:#374151">Haz clic en el botón de abajo para crear una nueva contraseña:</p>
                  <div style="text-align:center;margin:32px 0">
                    <a href="%s"
                       style="display:inline-block;background:#9ACD32;color:#fff;padding:14px 32px;
                              border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
                      Restablecer Contraseña
                    </a>
                  </div>
                  <p style="color:#6b7280;font-size:13px">Este enlace expira en 15 minutos.</p>
                  <p style="color:#6b7280;font-size:13px">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu cuenta permanece segura.</p>
                </div>
                """.formatted(name, resetUrl);
    }
}
