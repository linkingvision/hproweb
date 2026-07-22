import axios from './http'

interface AlarmEventHomeListParams {
  beginTime: string
  endTime: string
  username: string
}

export const GetAlarmEventHomeList = (data: AlarmEventHomeListParams) => axios({
  url: '/uapi/v1/AlarmEvent/Home/List',
  method: 'POST',
  data
})

export const GetDeviceSummaryApi = () => axios({
  url: '/uapi/v1/GetDeviceSummary',
  method: 'GET'
})

export const GetDeviceInfoApi = () => axios({
  url: '/uapi/v1/Device/Info',
  method: 'GET'
})

export const GetWorkServerListApi = () => axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

export const GetRunInfoApi = (nodeId: string) => axios({
  url: `/uapi/v1/GetRunInfo?nodeId=${nodeId}`,
  method: 'GET'
})

export const GetRunTimeApi = (nodeId: string) => axios({
  url: `/uapi/v1/GetRunTime?nodeId=${nodeId}`,
  method: 'GET'
})

export const GetDiscoverServiceSiteApi = () => axios({
  url: '/uapi/v1/DiscoverService/Site',
  method: 'GET'
})
