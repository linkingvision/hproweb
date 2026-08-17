import Axios from '../http';

export interface IscsiPortalParam {
  iscsiPortalId?: number
  username: string
  password: string
  ip: string
  port: string
}

export interface DeleteIscsiPortalParam {
  ids: number[]
}

export interface UpdateIscsiLunParam {
  iscsiLunId: number
  nodeId: string
}

export interface IscsiLunIdParam {
  iscsiLunId: number
}

export const GetIscsiPortalApi = () => Axios({
  url: '/uapi/v1/Iscsi/Portal',
  method: 'GET'
})

export const AddIscsiPortalApi = (data: IscsiPortalParam) => Axios({
  url: '/uapi/v1/Iscsi/Portal',
  method: 'POST',
  data
})

export const UpdateIscsiPortalApi = (data: IscsiPortalParam) => Axios({
  url: '/uapi/v1/Iscsi/Portal',
  method: 'PUT',
  data
})

export const DeleteIscsiPortalApi = (data: DeleteIscsiPortalParam) => Axios({
  url: '/uapi/v1/Iscsi/Portal',
  method: 'DELETE',
  data
})

export const GetIscsiLunApi = (iscsiPortalId: number) => Axios({
  url: '/uapi/v1/Iscsi/Lun?iscsiPortalId=' + iscsiPortalId,
  method: 'GET'
})

export const UpdateIscsiLunApi = (data: UpdateIscsiLunParam) => Axios({
  url: '/uapi/v1/Iscsi/Lun',
  method: 'PUT',
  data
})

export const FormatIscsiLunApi = (data: IscsiLunIdParam) => Axios({
  url: '/uapi/v1/Iscsi/Lun/Format',
  method: 'PUT',
  data
})

export const GetIscsiLunStatusApi = (data: IscsiLunIdParam) => Axios({
  url: '/uapi/v1/Iscsi/Lun/Status',
  method: 'PUT',
  data
})
