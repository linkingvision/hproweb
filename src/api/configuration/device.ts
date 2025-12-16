import axios from '../http'

export const GetNodeApi = () => axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

export const GetDeviceListApi = () => axios({
  url: '/uapi/v1/Device/List?pageSize=100000',
  method: 'GET',
})

// 获取设备根目录
export const GetDevPartitionApi = () => axios({
  url: '/uapi/v1/DevPartition/List?pageSize=100000',
  method: 'GET'
})

// 获取视频文件
export const GetDevFileApi = () => axios({
  url: '/uapi/v1/Device/DevFileList',
  method: 'GET'
})

interface DeviceParam {
  token: string
}
export const GetDeviceApi = (data: DeviceParam) => axios({
  url: '/iapi/v1/GetDevice',
  method: 'POST',
  data
})

export const GetDeviceChannelsApi = (data: DeviceParam) => axios({
  url: '/iapi/v1/GetDeviceChannels',
  method: 'POST',
  data
})

interface addOnfstg {
  nodeId: string,
  name: string,
  username: string,
  password: string,
  devIP: string,
  devPort: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  rBufferTime: number,
  sandbox: boolean,
  maxChannel: number,
}
export const AddOnfstgApi = (data: addOnfstg) => axios({
  url: '/uapi/v1/Device/Add/OnfStg',
  method: 'POST',
  data
})

interface addRTSP {
  nodeId: string,
  setToken: boolean,
  token: string,
  name: string,
  username: string,
  password: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  strUrl: string,
  bEnableUrlSub: boolean,
  strUrlSub: string,
  h5RTSPConnectType: string,
}
export const AddRTSPApi = (data: addRTSP) => axios({
  url: '/uapi/v1/Device/Add/RTSP',
  method: 'POST',
  data
})

interface addFile {
  nodeId: string,
  setToken?: boolean,
  token?: string,
  name: string,
  strUrl: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number
}
export const AddFileApi = (data: addFile) => axios({
  url: '/uapi/v1/Device/Add/FILE',
  method: 'POST',
  data
})

export interface editDevice {
  nodeId: string,
  devId: number,
  name: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  username?: string,
  password?: string,
  devIP?: string,
  devPort?: string,
  strUrl?: string,
  bEnableUrlSub?: boolean,
  strUrlSub?: string,
  h5RTSPConnectType?: string,
  rBufferTime?: number,
  maxChannel?: number,
  sandbox?: boolean
}
export const EditDevApi = (data: editDevice) => axios({
  url: '/uapi/v1/Device/Update',
  method: 'PUT',
  data
})

export interface delDeviceParams {
  ids: number[] | []
}
export const DelDeviceApi = (data: delDeviceParams) => axios({
  url: '/uapi/v1/Device',
  method: 'DELETE',
  data
})