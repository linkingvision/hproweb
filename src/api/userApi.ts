import Axios from './http';
import axios from 'axios';
import { useUserStore } from '@/store/user';
const userStore = useUserStore();

// export const GetNonce = (data?:any) => Axios<any>({
//   url: '/iapi/v1/GetNonce',
//   method: 'GET',
//   params: data
// });

interface loginParams {
  username: string,
  // nonceKey: string,
  // digestAlgorithm: undefined | string,
  password: string
}
export const loginApi = (data: loginParams) => axios<any>({
  url: userStore.IPPORT + '/uapi/v1/Login',
  method: 'POST',
  data
})

export const LoginSessionApi = () => Axios({
  url: userStore.IPPORT + '/uapi/v1/User/LoginSession',
  method: 'GET'
})

interface UpdateUserParams {
  username: string,
  oldPassword: string,
  newPassword: string
}
export const UpdateUserApi = (data: UpdateUserParams) => Axios<any>({
  url: '/uapi/v1/User/Password/Set',
  method: 'PUT',
  data
})

export const KeepAlive = () => Axios({
  url: '/uapi/v1/User/Keepalive',
  method: 'GET'
})

export const logoutApi = () => Axios({
  url: '/uapi/v1/Logout',
  method: 'POST'
})