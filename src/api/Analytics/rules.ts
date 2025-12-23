import axios from '../http';

export const GetAnalyticsApi = () => axios({
  url: '/uapi/v1/Analytics',
  method: 'GET'
})