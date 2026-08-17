import Axios from '../http'

export interface PatrolElementView {
  viewId: number | string
  dwellTime: number
}

export interface PatrolRow {
  index?: number
  patrolId?: number
  uuid: string
  patrolName: string
  elementView: PatrolElementView[]
}

export interface AddPatrolPayload {
  patrolName: string
  elementView: PatrolElementView[]
}

export interface UpdatePatrolPayload extends AddPatrolPayload {
  uuid: string
}

export const GetPatrolListApi = () => Axios({
  url: '/uapi/v1/Patrol/List',
  method: 'GET'
})

export const AddPatrolApi = (data: AddPatrolPayload) => Axios({
  url: '/uapi/v1/Patrol',
  method: 'POST',
  data
})

export const UpdatePatrolApi = (data: UpdatePatrolPayload) => Axios({
  url: '/uapi/v1/Patrol',
  method: 'PUT',
  data
})

export const DeletePatrolApi = (ids: number[]) => Axios({
  url: '/uapi/v1/Patrol',
  method: 'DELETE',
  data: { ids }
})
