import axios from "axios";
import { useUserStore } from '../store/user'
import router from "../router";
import i18n from "../../static/i18n";

// const store = useStore();

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// http request 拦截器
service.interceptors.request.use(
  (config) => {
    const store = useUserStore();
    if (store.Access_token) {
      config.headers.Authorization = `Bearer ${store.Access_token}`;
    } else if (store.session) {
      config.headers.Authorization = `token ${store.session}`;
      if (config.url?.includes("?")) {
        config.url = config.url + "&session=" + store.session;
      } else {
        config.url = config.url + "?session=" + store.session;
      }
    } else {
      // 使用 router.currentRoute.value 获取当前路由
      const currentRoute = router.currentRoute.value;
      router.replace({
        path: '/login',
        query: {
          ...currentRoute.query, // 保留原有参数(如 code)
          redirect: currentRoute.path 
        }
      });
    }
    return config;
  },
  (err) => {
    return Promise.reject(err)
  }
)

// http response 拦截器
service.interceptors.response.use(
  (response: any) => {
    const store = useUserStore();
    // const code = response.data.code;
    const { code, data, msg } = response.data;
    if (code == 10001 || code == 10002 || code == 10003 || code ==10004) {
      const currentRoute = router.currentRoute.value;
      currentRoute.path !== 'login' &&
        router.replace({
          path: '/login',
          query: {
            ...currentRoute.query,
            redirect: currentRoute.path
          }
        })
    } else {
      return response;
    }
  },
  error => {
    if (error.response) {
      const currentRoute = router.currentRoute.value;
      switch(error.response.status) {
        case 401:
          currentRoute.path !== 'login' &&
            router.replace({
              path: '/login',
              query: {
                ...currentRoute.query, // 保留原有参数(如 code)
                redirect: currentRoute.path
              }
            })
      }
      return Promise.reject(error.response.data)
    }
  }
)

export default service;

