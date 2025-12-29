import axios from '../http';

// 获取归属服务器信息
export const GetNodeApi = () => axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

// 推理服务配置信息
export const GetEngineApi = (nodeId: string) => axios({
  url: '/uapi/v1/Analytics/Engine?nodeId=' + nodeId,
  method: 'GET'
})

// 修改推理服务配置信息
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

// 推理服务器状态
export const GetEngineStatusApi = (nodeId: string) => axios({
  url: '/uapi/v1/Analytics/Engine/Status?nodeId=' + nodeId,
  method: 'GET'
})

// 获取时间搜索数据列表
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

// 获取分类器列表
interface GetClassifierApi {
  pageIndex: number,
  pageSize: number
}
export const GetClassifierListApi = (data: GetClassifierApi) => axios({
  url: '/uapi/v1/Classifier/List',
  method: 'POST',
  data
})

// 删除分类器
export const DeleteClassifierApi = (data: {ids: number[]}) => axios({
  url: '/uapi/v1/Classifier/Delete',
  method: 'DELETE',
  data
})

// 添加分类器
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

// 修改分类器
export const UpdateClassifierApi = (data: addClassifierApi) => axios({
  url: '/uapi/v1/Classifier/Update',
  method: 'PUT',
  data
})