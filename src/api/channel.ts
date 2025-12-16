import axios from './http';

export const GetDeviceList = () => axios({
  url: '/uapi/v1/Device/List',
  method: 'GET'
})

export const GetChannels = (data: any) => axios({
  url: '/uapi/v1/Device/Channels',
  method: 'POST',
  data: data
})

export const GetDeviceChannels = (token: string) => axios({
  url: '/uapi/v1/Device/Channels?token=' + token,
  method: 'GET'
})

export const RecEnableApi = (token: string) => axios({
  url: '/uapi/v1/ManualRecEnable?devToken=' + token,
  method: 'GET'
})

interface setRecEnableParmas {
  devUUID: 'string',
  setting: {
    manualRecEnable: boolean
  }
}
export const setRecEnableApi = (data: setRecEnableParmas) => axios({
  url: '/uapi/v1/ManualRecEnable',
  method: 'put',
  data
})

// 获取设备有录像日期
export const GetRecordCalendar = (token: string, year: string, month: string) => axios({
  url: '/api/v1/SearchStorRecordCalendar?token=' + token + '&year=' + year + '&month=' + month,
  method: 'GET'
})

// 获取设备有录像时间段
export const getSearchStorRecordByTimeApi = (token: string, start: string, end: string) => axios({
  url: '/api/v1/SearchStorRecordByTime?token=' + token + '&start=' + start + '&end=' + end,
  method: 'GET'
})