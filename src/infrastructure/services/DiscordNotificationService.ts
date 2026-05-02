import { INotificationService, NotificationMessage } from '../../domain/services/INotificationService';

export class DiscordNotificationService implements INotificationService {
  async sendNotification(message: NotificationMessage): Promise<boolean> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn("⚠️ DISCORD_WEBHOOK_URL no está configurado. La notificación no se enviará.");
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Old Legends Bot",
          avatar_url: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
          embeds: [
            {
              title: message.title,
              description: message.description,
              color: 0x10b981, // Emerald-500
              fields: message.fields,
              footer: {
                text: "Sistema automatizado de Old Legends",
              }
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Error enviando a Discord: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Fallo al contactar con el Webhook de Discord:", error);
      return false;
    }
  }

  async notifyRulesUpdate(adminName: string): Promise<boolean> {
    return this.sendNotification({
      title: "📜 Actualización de Reglas de Loteo / EPGP",
      description: `Las reglas del portal han sido actualizadas por el oficial **${adminName}**.`,
      fields: [
        {
          name: "Acción requerida",
          value: "Por favor, revisa el portal para ver los últimos cambios en la prioridad de ítems o bonificaciones.",
        }
      ]
    });
  }
}
