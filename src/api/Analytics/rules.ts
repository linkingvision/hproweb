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