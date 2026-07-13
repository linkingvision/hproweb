import axios from '../http';

// Get work server info
export const GetNodeApi = () => axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

// Get inference server config
export const GetEngineApi = (nodeId: string) => axios({
  url: '/uapi/v1/Analytics/Engine?nodeId=' + nodeId,
  method: 'GET'
})

// Update inference server config
interface PutEngineData {
  nodeId: string,
  engine: string,
  modelAccuracy: string,
  loadedModel: {
    bEnableCrowdDet?: boolean,
    bEnableFaceRecog?: boolean,
    bEnableFirSmoDet?: boolean,
    bEnableLprDet?: boolean,
    bEnableLprRecog?: boolean,
    bEnableObjDet?: boolean,
    bEnablePpeDet?: boolean
  }
}
export const PutEngineApi = (data: PutEngineData) => axios({
  url: '/uapi/v1/Analytics/Engine',
  method: 'PUT',
  data
})

// Get inference server status
export const GetEngineStatusApi = (nodeId: string) => axios({
  url: '/uapi/v1/Analytics/Engine/Status?nodeId=' + nodeId,
  method: 'GET'
})

// Get time-range search data list
interface AnaEventParams {
  pageIndex: number,
  pageSize: number,
  beginTime: string,
  endTime: string,
  channelName: string,
  ruleTypes: string[] | []
}
export const GetAnaEventApi = (data: AnaEventParams) => axios({
  url: '/uapi/v1/AnaEvent/List',
  method: 'POST',
  data
})

// Get classifier list
interface GetClassifierApi {
  pageIndex: number,
  pageSize: number
}
export const GetClassifierListApi = (data: GetClassifierApi) => axios({
  url: '/uapi/v1/Classifier/List',
  method: 'POST',
  data
})

// Delete classifier
export const DeleteClassifierApi = (data: {ids: number[]}) => axios({
  url: '/uapi/v1/Classifier/Delete',
  method: 'DELETE',
  data
})

// Add classifier
interface addClassifierApi {
  name: string
  txtList: string[] | []
  generateAlarm: boolean
  language: string
  objClassList: string[] | []
  alarmClassIndex: number[] | []
  uuid?: string
}
export const AddClassifierApi = (data: addClassifierApi) => axios({
  url: '/uapi/v1/Classifier/Add',
  method: 'POST',
  data
})

// Update classifier
export const UpdateClassifierApi = (data: addClassifierApi) => axios({
  url: '/uapi/v1/Classifier/Update',
  method: 'PUT',
  data
})