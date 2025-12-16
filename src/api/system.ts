import axios from './http'

export const GetSystemInfo = () => axios({
  url: '/uapi/v1/System/Version',
  method: 'GET'
})

export const GetLicenseInfoApi = () => axios({
  url: '/uapi/v1/Cluster/GetLicenseInfo',
  method: 'GET'
})

export const UpLoadLicUrl = '/uapi/v1/Cluster/License/Upload?session=';

interface GetLogParamType {
  username: string,
  moduleType?: string,
  beginTime: string,
  endTime: string,
  pageSize: number,
  pageIndex: number
}
export const GetLogApi = (data: GetLogParamType) => axios({
  url: '/uapi/v1/UscLog/List',
  method: 'POST',
  data
})

// 系统升级上传文件URL
export const UploadUrl = '/uapi/v1/System/Bin/Patcher?session=';

// 获取系统升级状态
export const GetUpgradeStatusApi = () => axios({
  url: '/uapi/v1/System/GetUpgradeStatus',
  method: 'GET'
})

// 数据库导入地址
export const DBUploadUrl = '/uapi/v1/DB/Import?session=';

// 重启服务器
export const ResetServiceApi = () => axios({
  url: '/uapi/v1/System/Restart',
  method: 'GET'
})

// 配置文件导出
export const ConfigExportUrl = '/uapi/v1/Conf/Export?session=';

// 数据库导出
export const SqlExportApi = (isEvent: boolean) => axios({
  url: '/uapi/v1/DB/Migration/Start?isEvent=' + isEvent,
  method: 'GET'
})

// 数据库导出进度
export const SetDBStatus = (key: string) => axios({
  url: '/uapi/v1/DB/Migration/Status?key=' + key,
  method: 'GET'
})

// 数据库下载地址
export const DBDownloadUrl = '/uapi/v1/DB/Download?session=';

export const GetSysConfigApi = (module: string) => axios({
  url: '/uapi/v1/SysConfig/Item?pageSize=100000&pageIndex=1' + (module == 'all' ? '' : `&module=${module}`),
  method: 'GET'
})

interface UpdateSysConfigParams {
  key: string,
  value: string | number | boolean
}
export const UpdateSysConfigApi = (data: UpdateSysConfigParams) => axios({
  url: '/uapi/v1/SysConfig/Item',
  method: 'PUT',
  data
})