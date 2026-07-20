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
  devUUID: string,
  setting: {
    manualRecEnable: boolean
  }
}
export const setRecEnableApi = (data: setRecEnableParmas) => axios({
  url: '/uapi/v1/ManualRecEnable',
  method: 'put',
  data
})

// Get dates with recordings for device
export const GetRecordCalendar = (token: string, year: string | number, month: string | number) => axios({
  url: '/api/v1/SearchStorRecordCalendar?token=' + token + '&year=' + year + '&month=' + month,
  method: 'GET'
})

// Get time slots with recordings for device
export const getSearchStorRecordByTimeApi = (token: string, start: string, end: string) => axios({
  url: '/api/v1/SearchStorRecordByTime?token=' + token + '&start=' + start + '&end=' + end,
  method: 'GET'
})

// Get time slots with recordings from device storage（对照uscweb Advancepb.vue）
export const getSearchDeviceRecordByTimeApi = (token: string, start: string, end: string) => axios({
  url: '/uapi/v1/SearchDeviceRecordByTime?token=' + token + '&start=' + encodeURIComponent(start) + '&end=' + encodeURIComponent(end) + '&maxlen=86400',
  method: 'GET'
})

// Get device bitrate info
export const GetInformationDataApi = (token: string) => axios({
  url: '/uapi/v1/GetVidStreamStatus?token=' + token + '&stream=main',
  method: 'GET'
})

// Get PTZ preset positions for device
export const GetPresetsApi = (token: string) => axios({
  url: '/uapi/v1/GetPresets?token=' + token,
  method: 'GET'
})

// Jump to PTZ preset position
export const PresetJumpApi = (ptzToken: string, presetToken: string, speed: number) => axios({
  url: '/uapi/v1/Ptz?token=' + ptzToken + '&action=preset&preset=' + presetToken + '&speed=' + speed,
  method: 'GET'
})

// Set PTZ preset position
export const SetPresetApi = (ptzToken: string, inputVal: string, presetToken: string) => axios({
  url: '/uapi/v1/SetPreset?token=' + ptzToken + '&presetname=' + inputVal + '&presettoken=' + presetToken,
  method: 'GET'
})

// PTZ control
export const PtzApi = (ptzToken: string, action: string, speed: number) => axios({
  url: '/uapi/v1/Ptz?token=' + ptzToken + '&action=' + action + '&speed=' + speed,
  method: 'GET'
})

// View query
export const GetViewApi = (id: string) => axios({
  url: '/uapi/v1/View/' + id,
  method: 'GET'
})