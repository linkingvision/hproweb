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
  strMountpoint: string
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