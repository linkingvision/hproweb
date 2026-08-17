import Axios from '../http'

export const NOTIFICATION_EMAIL = 'USC_RULE_EVENT_NOTIFI_EMAIL'
export const NOTIFICATION_HTTP = 'USC_RULE_EVENT_NOTIFI_HTTP'
export const NOTIFICATION_MQTT = 'USC_RULE_EVENT_NOTIFI_MQTT'

export type NotificationType = typeof NOTIFICATION_EMAIL | typeof NOTIFICATION_HTTP | typeof NOTIFICATION_MQTT

export interface RuleEventSetting {
  eventType: string[]
  channelUUID: string[]
  timeTemplate: string
  actionType: NotificationType | string
  Action: {
    Notification: string
  }
}

export interface RuleEventRow {
  index?: number
  id?: number
  ruleEventId?: number
  uuid?: string
  ruleEventName: string
  description: string
  enabled: boolean
  setting: RuleEventSetting
}

export interface RuleEventPayload {
  uuid?: string
  ruleEventId?: number
  ruleEventName: string
  description: string
  enabled: boolean
  setting: RuleEventSetting
}

export interface DeletePayload {
  ids: number[]
}

export interface NotificationConf {
  index?: number
  id?: number
  uuid?: string
  name: string
  notificationType: NotificationType | string | number
  description?: string
  emailRecipients?: string
  emailSubject?: string
  emailMessage?: string
  includeImage?: boolean
  url?: string
  method?: string
  header?: Record<string, string> | Array<{ name: string; value: string }>
  server?: string
  topic?: string
  username?: string
  password?: string
  showPassword?: boolean
}

export interface EmailServerConfig {
  form?: string
  senderEmailAddress: string
  smtpHost: string
  smtpPort: number | string
  password: string
  ssl: boolean
}

export function normalizeNotificationType(type: NotificationConf['notificationType']): NotificationType | string {
  if (type === 1 || type === '1') return NOTIFICATION_EMAIL
  if (type === 2 || type === '2') return NOTIFICATION_HTTP
  if (type === 3 || type === '3') return NOTIFICATION_MQTT
  return String(type || '')
}

export const GetRuleEventListApi = () => Axios({
  url: '/uapi/v1/RuleEvent/List',
  method: 'GET'
})

export const AddRuleEventApi = (data: RuleEventPayload) => Axios({
  url: '/uapi/v1/RuleEvent/Add',
  method: 'POST',
  data
})

export const UpdateRuleEventApi = (data: RuleEventPayload) => Axios({
  url: '/uapi/v1/RuleEvent/Update',
  method: 'PUT',
  data
})

export const DeleteRuleEventApi = (data: DeletePayload) => Axios({
  url: '/uapi/v1/RuleEvent/Delete',
  method: 'DELETE',
  data
})

export const GetNotificationConfListApi = (notificationType?: NotificationType | string) => Axios({
  url: notificationType
    ? `/uapi/v1/NotificationConf/List?notificationType=${encodeURIComponent(notificationType)}`
    : '/uapi/v1/NotificationConf/List',
  method: 'GET'
})

export const AddNotificationConfApi = (data: NotificationConf) => Axios({
  url: '/uapi/v1/NotificationConf/Add',
  method: 'POST',
  data
})

export const UpdateNotificationConfApi = (data: NotificationConf) => Axios({
  url: '/uapi/v1/NotificationConf/Update',
  method: 'PUT',
  data
})

export const DeleteNotificationConfApi = (data: DeletePayload) => Axios({
  url: '/uapi/v1/NotificationConf/Delete',
  method: 'DELETE',
  data
})

export const GetEmailServerApi = () => Axios({
  url: '/uapi/v1/EmailServer',
  method: 'GET'
})

export const UpdateEmailServerApi = (data: EmailServerConfig) => Axios({
  url: '/uapi/v1/EmailServer/Update',
  method: 'PUT',
  data
})
