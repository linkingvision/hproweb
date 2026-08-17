import Axios from './http'

export interface AlarmEventItem {
  uuid: string
  strTime?: string
  time?: string
  alarmLevel?: string | number
  moduleType?: string
  channelName?: string
  channelToken?: string
  stateName?: string
  stateLevel?: number
  assigned?: string
  assignedTo?: string
  reason?: string
  comment?: string
  strImg?: string
  [key: string]: any
}

export interface AlarmEventListParams {
  beginTime: string
  endTime: string
  channelName?: string
  moduleType?: string[]
  pageSize: number
  pageIndex: number
  username?: string
}

export interface AlarmEventStateListParams {
  username?: string
  pageSize: number
  pageIndex: number
  stateLevel: number
}

export interface AlarmEventUpdatePayload {
  uuid: string
  assignedTo?: string
  stateLevel?: number
  alarmLevel?: string | number
  reason?: string
  comment?: string
}

export interface AlarmEventStateCount {
  all?: number
  new?: number
  inProgress?: number
  onHold?: number
  closed?: number
  [key: string]: number | undefined
}

export const GetAlarmEventListApi = (data: AlarmEventListParams) => Axios({
  url: '/uapi/v1/AlarmEvent/List',
  method: 'POST',
  data
})

export const GetAlarmEventStateListApi = (data: AlarmEventStateListParams) => Axios({
  url: '/uapi/v1/AlarmEvent/State/List',
  method: 'POST',
  data
})

export const GetAlarmEventStateCountApi = (username: string) => Axios({
  url: `/uapi/v1/AlarmEvent/State/Count?username=${encodeURIComponent(username)}`,
  method: 'GET'
})

export const UpdateAlarmEventInfoApi = (data: AlarmEventUpdatePayload) => Axios({
  url: '/uapi/v1/AlarmEvent/Info',
  method: 'PUT',
  data
})
