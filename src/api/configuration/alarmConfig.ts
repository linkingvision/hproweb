import Axios from '../http'

export interface AlarmRule {
  alarmRuleId?: number
  uuid?: string
  alarmRuleName: string
  description: string
  enabled: boolean
  channelUUID: string[]
  triggerEventType: string[]
  timeTemplate: string
  alarmOwner: string
  alarmLevel: string | number
  popup: boolean
  assigned?: string
}

export interface AlarmRuleAddPayload {
  alarmRuleName: string
  description: string
  enabled: boolean
  channelUUID: string[]
  triggerEventType: string[]
  timeTemplate: string
  alarmOwner: string
  alarmLevel: string | number
  popup: boolean
  assigned?: string
}

export interface AlarmRuleUpdatePayload extends AlarmRuleAddPayload {
  uuid: string
}

export interface DeleteAlarmRulesPayload {
  ids: number[]
}

export interface ChannelUuidPayload {
  uuids: string[]
  all?: boolean
}

export interface DeviceChannelsPayload {
  tokens: string[]
}

export const GetAlarmRuleListApi = () => Axios({
  url: '/uapi/v1/AlarmRule/List',
  method: 'GET'
})

export const AddAlarmRuleApi = (data: AlarmRuleAddPayload) => Axios({
  url: '/uapi/v1/AlarmRule/Add',
  method: 'POST',
  data
})

export const UpdateAlarmRuleApi = (data: AlarmRuleUpdatePayload) => Axios({
  url: '/uapi/v1/AlarmRule/Update',
  method: 'PUT',
  data
})

export const DeleteAlarmRuleApi = (data: DeleteAlarmRulesPayload) => Axios({
  url: '/uapi/v1/AlarmRule/Delete',
  method: 'DELETE',
  data
})

export const GetAlarmOwnerListApi = () => Axios({
  url: '/uapi/v1/User/List',
  method: 'GET'
})

export const GetAlarmLevelListApi = () => Axios({
  url: '/uapi/v1/AlarmLevel/List',
  method: 'GET'
})

export const GetTimeTemplateListApi = () => Axios({
  url: '/uapi/v1/TimeTemplate',
  method: 'GET'
})

export const GetChannelsByUuidApi = (data: ChannelUuidPayload) => Axios({
  url: '/uapi/v1/Device/Channels',
  method: 'POST',
  data
})

export const GetDevPartitionListApi = (type?: string) => Axios({
  url: type
    ? `/uapi/v1/DevPartition/List?pageSize=100000&type=${encodeURIComponent(type)}`
    : '/uapi/v1/DevPartition/List?pageSize=100000',
  method: 'GET'
})

export const GetDevPartitionItemApi = (devPartitionId: number | string) => Axios({
  url: `/uapi/v1/DevPartition/Item/${devPartitionId}`,
  method: 'GET'
})

export const GetDevPartitionFilterNodeApi = (filterText: string) => Axios({
  url: `/uapi/v1/DevPartition/FilterNode?filterText=${encodeURIComponent(filterText)}`,
  method: 'GET'
})

export const GetDeviceChannelsByTokenApi = (token: string) => Axios({
  url: `/uapi/v1/Device/Channels?token=${encodeURIComponent(token)}`,
  method: 'GET'
})

export const GetDeviceChannelsByTokensApi = (data: DeviceChannelsPayload) => Axios({
  url: '/uapi/v1/Device/Channels',
  method: 'POST',
  data
})

export const GetCascadeHierarchyApi = (token: string, casPartitionToken?: string) => Axios({
  url: `/uapi/v1/Cascade/List/Hierarchy?token=${encodeURIComponent(token)}${casPartitionToken ? `&casPartitionToken=${encodeURIComponent(casPartitionToken)}` : ''}`,
  method: 'GET'
})

export const GetAccessDeviceApi = (token: string | number) => Axios({
  url: `/uapi/v1/AccessDevice/${token}`,
  method: 'GET'
})

export const GetLogicPartitionListApi = () => Axios({
  url: '/uapi/v1/LogicPartition/List?pageSize=100000',
  method: 'GET'
})
