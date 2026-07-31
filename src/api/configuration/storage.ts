import Axios from '../http';

export const GetWorkServerListApi = () => Axios({
  url: '/uapi/v1/WorkServer/List',
  method: 'GET'
})

export const GetStorageModeApi = (nodeId: string) => Axios({
  url: '/uapi/v1/Storage/StorageMode?nodeId=' + nodeId,
  method: 'GET'
})

interface StorageModeParam {
  mode: string,
  nodeId: string
}
export const SetStorageModeApi = (data: StorageModeParam) => Axios({
  url: '/uapi/v1/Storage/StorageMode',
  method: 'put',
  data
})

export const GetMetaStorageApi = (nodeId: string) => Axios({
  url: '/uapi/v1/Storage/MetaStorage?nodeId=' + nodeId,
  method: 'GET'
})

export const GetDiskPartitionApi = (nodeId: string) => Axios({
  url: '/uapi/v1/Storage/List/DiskPartitions?nodeId=' + nodeId,
  method: 'GET'
})

interface MetaStorageParam {
  nodeId: string,
  bEnableMetaStorage: boolean,
  strMetaPartitionDevice: string,
  strMetaPartitionMountpoint: string,
  nMetaRetentionInDay: number
}

export const SetMetaStorageApi = (data: MetaStorageParam) => Axios({
  url: '/uapi/v1/Storage/MetaStorage',
  method: 'put',
  data
})

export const GetObjPartitionsApi = (nodeId: string)  => Axios({
  url: '/uapi/v1/Storage/List/ObjPartitions?nodeId=' + nodeId,
  method: 'GET'
})

interface ObjPartitionParam {
  // part: {
  //   nIndex: number,
  //   strDevice: string,
  //   strMountpoint: string
  // },
  // update: boolean
  nodeId: string,
  nIndex: number,
  strDevice: string,
  strMountpoint: string,
  nAutoDelPercent?: number
}
export const AddObjPartitionApi = (data: ObjPartitionParam) => Axios({
  url: '/uapi/v1/Storage/Add/ObjPartition',
  method: 'POST',
  data
})

interface DelObjPartitionParam {
  nodeId: string,
  nIndex: number,
  strMountpoint: string
}
export const DelObjPartitionApi = (data: DelObjPartitionParam) => Axios({
  url: '/uapi/v1/Storage/ObjPartition',
  method: 'Delete',
  data
})

export const GetS3BucketsApi = (nodeId: string) => Axios({
  url: '/uapi/v1/Storage/List/S3Buckets?nodeId=' + nodeId,
  method: 'GET'
})

interface S3BucketParam {
  // part: {
  //   nIndex: 1,
  //   strAccessKey: string,
  //   strSecretKey: string,
  //   strRegionName: string,
  //   strBucketName: string,
  //   strEndpoint: string
  // },
  // update: boolean
  nodeId: string
  nIndex: number
  strAccessKey: string
  strSecretKey: string
  strRegionName: string
  strBucketName: string
  strEndpoint: string
}
export const AddS3BucketApi = (data: S3BucketParam) => Axios({
  url: '/uapi/v1/Storage/Add/S3Bucket',
  method: 'POST',
  data
})

export const EditS3BucketApi = (data: S3BucketParam) => Axios({
  url: '/uapi/v1/Storage/Update/S3Bucket',
  method: 'PUT',
  data
})

interface DelS3BucketParam {
  nodeId: string
  nIndex: number
  strBucketName: string
  strEndpoint: string
}
export const DeleteS3BucketApi = (data: DelS3BucketParam) => Axios({
  url: '/uapi/v1/Storage/S3Bucket',
  method: 'DELETE',
  data
})

interface AddRecordPartitionParam {
  nodeId: string
  nIndex: number
  nMaxSizeInM: number
  strDevice: string
  strMountPoint: string
  strColor: string
}
export const AddRecordPartitionApi = (data: AddRecordPartitionParam) => Axios({
  url: '/uapi/v1/Storage/Add/RecordPartition',
  method: 'POST',
  data
})

interface FormatRecordPartitionParam {
  nodeId: string
  strMountPoint: string
  nIndex: number
}
export const FormatRecordPartitionApi = (data: FormatRecordPartitionParam) => Axios({
  url: '/uapi/v1/Storage/Format/RecordPartition',
  method: 'POST',
  data
})

interface DelRecordPartitionParam {
  nodeId: string
  strMountPoint: string
  nIndex: number
}
export const DelRecordPartitionApi = (data: DelRecordPartitionParam) => Axios({
  url: '/uapi/v1/Storage/RecordPartition',
  method: 'DELETE',
  data
})

// ──────────────── Recording Template ────────────────

export const GetRecordingTemplateApi = () => Axios({
  url: '/uapi/v1/RecordingTemplate',
  method: 'GET'
})

export interface RecordingRange {
  index: number
  startTime: string
  endTime: string
  enable: string
  type: string
  stream: string
}

export interface TemplateDay {
  dayIndex: number
  recordingRange: RecordingRange[]
}

export interface RecordingTemplateParam {
  uuid?: string
  recordingTemplateName: string
  preRecInSecond: number
  postRecInSecond: number
  RecordingExpireInDay: number
  ANR: boolean
  ANRTimeInHour: number
  setting: { templateData: TemplateDay[] }
}

export const AddRecordingTemplateApi = (data: RecordingTemplateParam) => Axios({
  url: '/uapi/v1/RecordingTemplate',
  method: 'POST',
  data
})

export const UpdateRecordingTemplateApi = (data: RecordingTemplateParam) => Axios({
  url: '/uapi/v1/RecordingTemplate',
  method: 'PUT',
  data
})

export const DeleteRecordingTemplateApi = (data: { ids: number[] }) => Axios({
  url: '/uapi/v1/RecordingTemplate',
  method: 'DELETE',
  data
})

// ──────────────── Public Holiday ────────────────

export const GetPublicHolidayApi = () => Axios({
  url: '/uapi/v1/PublicHoliday',
  method: 'GET'
})

export interface PublicHolidayParam {
  year: string
  setting: { publicHoliday: { holiday: string }[] }
}

export const AddPublicHolidayApi = (data: PublicHolidayParam) => Axios({
  url: '/uapi/v1/PublicHoliday',
  method: 'POST',
  data
})

export const DeletePublicHolidayApi = (data: { ids: number[] }) => Axios({
  url: '/uapi/v1/PublicHoliday',
  method: 'DELETE',
  data
})

// ──────────────── Snapshot Template ────────────────

export interface SnapshotTemplateParam {
  uuid?: string
  snapshotTemplateName: string
  scheduleSnapshot: number
  snapshotWidth: number
  snapshotHeight: number
  snapshotQuality: string
  snapshotIntervalInSec: number
  snapshotExpireInDay: number
  setting: { templateData: TemplateDay[] }
}

export const GetSnapshotTemplateApi = () => Axios({
  url: '/uapi/v1/SnapshotTemplate',
  method: 'GET'
})

export const AddSnapshotTemplateApi = (data: SnapshotTemplateParam) => Axios({
  url: '/uapi/v1/SnapshotTemplate',
  method: 'POST',
  data
})

export const UpdateSnapshotTemplateApi = (data: SnapshotTemplateParam) => Axios({
  url: '/uapi/v1/SnapshotTemplate',
  method: 'PUT',
  data
})

export const DeleteSnapshotTemplateApi = (data: { ids: number[] }) => Axios({
  url: '/uapi/v1/SnapshotTemplate',
  method: 'DELETE',
  data
})

// ──────────────── Archive Storage ────────────────

export const GetArchiveVolumeConfApi = (nodeId: string) => Axios({
  url: '/uapi/v1/GetArchiveVolumeConf?nodeId=' + nodeId,
  method: 'GET'
})

interface SetArchiveVolumeConfParam {
  nodeId: string
  storpath: string
  autodelpercent: number
  maxFileLength: number
}
export const SetArchiveVolumeConfApi = (params: SetArchiveVolumeConfParam) => Axios({
  url: '/uapi/v1/SetArchiveVolumeConf',
  method: 'GET',
  params
})