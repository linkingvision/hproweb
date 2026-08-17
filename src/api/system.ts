import axios from './http'

export const GetSystemInfo = () => axios({
  url: '/uapi/v1/System/Version',
  method: 'GET'
})

export const GetLicenseInfoApi = () => axios({
  url: '/uapi/v1/Cluster/GetLicenseInfo',
  method: 'GET'
})

export const ReqFreePersonalProvisionApi = () => axios({
  url: '/uapi/v1/System/ReqFreePersonalProvision',
  method: 'GET'
})

export const GetReqProvisionStatusApi = () => axios({
  url: '/uapi/v1/System/GetReqProvisionStatus',
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
export interface SystemEventListParams {
  beginTime: string
  endTime: string
  pageSize: number
  name?: string
  moduleType?: string[]
}

export interface SystemEventItem {
  id?: string | number
  name?: string
  uuid?: string
  moduleType?: string
  strTime?: string
  strImg?: string
  token?: string
}

export const GetLogApi = (data: GetLogParamType) => axios({
  url: '/uapi/v1/UscLog/List',
  method: 'POST',
  data
})

export const GetSystemEventListApi = (data: SystemEventListParams) => axios({
  url: '/uapi/v1/Event/List',
  method: 'POST',
  data
})

// System upgrade file upload URL
export const UploadUrl = '/uapi/v1/System/Bin/Patcher?session=';

export const GetUpgradeStatusApi = () => axios({
  url: '/uapi/v1/System/GetUpgradeStatus',
  method: 'GET'
})

// Database import URL
export const DBUploadUrl = '/uapi/v1/DB/Import?session=';

// Restart server
export const ResetServiceApi = () => axios({
  url: '/uapi/v1/System/Restart',
  method: 'GET'
})

export const ConfigExportUrl = '/uapi/v1/Conf/Export?session=';

export const SqlExportApi = (isEvent: boolean) => axios({
  url: '/uapi/v1/DB/Migration/Start?isEvent=' + isEvent,
  method: 'GET'
})

// Database export progress
export const SetDBStatus = (key: string) => axios({
  url: '/uapi/v1/DB/Migration/Status?key=' + key,
  method: 'GET'
})

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

// ─── User config (per-user preferences, e.g. DefaultStorage) ─────────────
export const GetUserConfigApi = () => axios({
  url: '/uapi/v1/UserConfig/Item',
  method: 'GET'
})

export const UpdateUserConfigApi = (data: { key: string; value: string }) => axios({
  url: '/uapi/v1/UserConfig/Item',
  method: 'PUT',
  data
})

// ─── Auto Backup ──────────────────────────────────────────────────────────────
export const GetNodeListApi = () => axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

export const GetAutoBackupConfigApi = () => axios({
  url: '/uapi/v1/Auto/Backup',
  method: 'GET'
})

interface SaveAutoBackupConfigParams {
  uuid: string
  startTime: string
  backupType: string
  isEvent: boolean
  enabled: boolean
}
export const SaveAutoBackupConfigApi = (data: SaveAutoBackupConfigParams) => axios({
  url: '/uapi/v1/Auto/Backup',
  method: 'PUT',
  data
})

export const GetBackupPathsApi = (nodeId: string) => axios({
  url: `/uapi/v1/Auto/BackupPath?nodeId=${nodeId}`,
  method: 'GET'
})

interface SaveBackupPathParams {
  nodeId: string
  backupPath: string
}
export const SaveBackupPathApi = (data: SaveBackupPathParams) => axios({
  url: '/uapi/v1/Auto/BackupPath',
  method: 'PUT',
  data
})