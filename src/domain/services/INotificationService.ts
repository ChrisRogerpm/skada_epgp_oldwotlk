export interface NotificationMessage {
  title?: string;
  description?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface INotificationService {
  sendNotification(message: NotificationMessage): Promise<boolean>;
  notifyRulesUpdate(adminName: string): Promise<boolean>;
}
