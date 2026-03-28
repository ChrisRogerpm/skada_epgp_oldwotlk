/**
 * Utilidad para enviar notificaciones a Discord a través de un Webhook.
 * 
 * Para usarlo, debes configurar DISCORD_WEBHOOK_URL en tu archivo .env.local
 */

interface DiscordMessage {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    thumbnail?: {
      url: string;
    };
    footer?: {
      text: string;
      icon_url?: string;
    };
  }>;
}

export async function sendDiscordNotification(message: DiscordMessage) {
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
        avatar_url: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg", // Puedes cambiar por el logo de tu guild
        ...message,
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

/**
 * Ejemplo de uso: Notificar cuando se actualizan las reglas de loteo
 */
export async function notifyRulesUpdate(adminName: string) {
  return sendDiscordNotification({
    embeds: [
      {
        title: "📜 Actualización de Reglas de Loteo / EPGP",
        description: `Las reglas del portal han sido actualizadas por el oficial **${adminName}**.`,
        color: 0x10b981, // Emerald-500
        fields: [
          {
            name: "Acción requerida",
            value: "Por favor, revisa el portal para ver los últimos cambios en la prioridad de ítems o bonificaciones.",
          }
        ],
        footer: {
          text: "Sistema automatizado de Old Legends",
        }
      }
    ]
  });
}
