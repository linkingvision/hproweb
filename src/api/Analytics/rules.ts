import axios from '../http';

export const GetAnalyticsApi = () => axios({
  url: '/uapi/v1/Analytics',
  method: 'GET'
})

export const GetRecordingTemplateApi = () => axios({
  url: '/uapi/v1/RecordingTemplate',
  method: 'GET'
})

export const GetFaceLibraryApi = () => axios({
  url: '/uapi/v1/FaceLibrary/List',
  method: 'GET'
})

// 新增规则配置
export const SetAnalyticsApi = (data: any) => axios({
  url: '/uapi/v1/Analytics',
  method: 'POST',
  data
})

// 修改规则配置
export const UpdateAnalyticsApi = (data: any) => axios({
  url: '/uapi/v1/Analytics',
  method: 'PUT',
  data
})

interface DelParams {
  ids: number[]
}
export const DeleteAnalyticsApi = (data: DelParams) => axios({
  url: '/uapi/v1/Analytics',
  method: 'DELETE',
  data
})

interface CopyParams {
  anaUUID: string,
  copyDevUUID: string[]
}
export const CopyAnalyticsApi = (data: CopyParams) => axios({
  url: '/uapi/v1/Analytics/Copy',
  method: 'POST',
  data
})