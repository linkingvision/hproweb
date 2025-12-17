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
export const GetRecordCalendar = (token: string, year: string | number, month: string | number) => axios({
  url: '/api/v1/SearchStorRecordCalendar?token=' + token + '&year=' + year + '&month=' + month,
  method: 'GET'
})

// 获取设备有录像时间段
export const getSearchStorRecordByTimeApi = (token: string, start: string, end: string) => axios({
  url: '/api/v1/SearchStorRecordByTime?token=' + token + '&start=' + start + '&end=' + end,
  method: 'GET'
})

// 获取设备码率信息
export const GetInformationDataApi = (token: string) => axios({
  url: '/uapi/v1/GetVidStreamStatus?token=' + token + '&stream=main',
  method: 'GET'
})

// 获取设备云台预置位查询
export const GetPresetsApi = (token: string) => axios({
  url: '/uapi/v1/GetPresets?token=' + token,
  method: 'GET'
})

// 云台预置位跳转
export const PresetJumpApi = (ptzToken: string, presetToken: string, speed: number) => axios({
  url: '/uapi/v1/Ptz?token=' + ptzToken + '&action=preset&preset=' + presetToken + '&speed=' + speed,
  method: 'GET'
})

// 云台预置位设置
export const SetPresetApi = (ptzToken: string, inputVal: string, presetToken: string) => axios({
  url: '/uapi/v1/SetPreset?token=' + ptzToken + '&presetname=' + inputVal + '&presettoken=' + presetToken,
  method: 'GET'
})

// 云台控制
export const PtzApi = (ptzToken: string, action: string, speed: number) => axios({
  url: '/uapi/v1/Ptz?token=' + ptzToken + '&action=' + action + '&speed=' + speed,
  method: 'GET'
})