import axios from './http';

// ─── View ───────────────────────────────────────────────────────────────────

export const GetViewListApi = () => axios({
  url: '/uapi/v1/View',
  method: 'GET'
})

export const GetViewApi = (viewId: string | number) => axios({
  url: `/uapi/v1/View/${viewId}`,
  method: 'GET'
})

export const CreateViewApi = (data: {
  viewName: string
  viewType: string
  layoutId: number
  devPartitionId: number
  devPartitionName?: string
  viewEntity?: any[]
}) => axios({
  url: '/uapi/v1/View',
  method: 'POST',
  data
})

export const UpdateViewApi = (data: {
  viewId: number
  viewName: string
  viewType: string
  layoutId: number
  devPartitionId: number
  devPartitionName?: string
  viewEntity: any[]
}) => axios({
  url: '/uapi/v1/View',
  method: 'PUT',
  data
})

export const DeleteViewApi = (ids: number[]) => axios({
  url: '/uapi/v1/View',
  method: 'DELETE',
  data: { ids }
})

// ─── Layout ──────────────────────────────────────────────────────────────────

export const GetLayoutListApi = () => axios({
  url: '/uapi/v1/Layout',
  method: 'GET'
})

export const CreateLayoutApi = (data: {
  layoutName: string
  layoutType: string
  setting: { layoutView: any[] }
}) => axios({
  url: '/uapi/v1/Layout',
  method: 'POST',
  data
})

export const DeleteLayoutApi = (ids: number[]) => axios({
  url: '/uapi/v1/Layout',
  method: 'DELETE',
  data: { ids }
})
