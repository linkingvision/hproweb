

import { createRouter, createWebHashHistory } from 'vue-router'

const Login = () => import('@/containers/Login.vue');
const TheContainer = () => import('@/containers/TheContainer.vue')
const Monitoring = () => import('@/views/Monitoring/Monitoring.vue')
const Liveview = () => import('@/views/Monitoring/Liveview.vue')
const Search = () => import('@/views/Monitoring/search/Search.vue')
const RecordInfo = () =>import('@/views/Monitoring/search/RecordInfo.vue');
const Logout = () => import('@/containers/Logout.vue')
const Configuration = () => import('@/views/Configuration/Configuration.vue')
const Basic = () => import('@/views/Configuration/Basic/Basic.vue')
const StorageMode = () => import('@/views/Configuration/Basic/StorageSetting/StorageMode.vue')
const MetaStorage = () => import('@/views/Configuration/Basic/StorageSetting/MetaStorage.vue')
const LocalObjectStorage = () => import('@/views/Configuration/Basic/StorageSetting/LocalObjectStorage.vue')
const S3Storage = () => import('@/views/Configuration/Basic/StorageSetting/S3Storage.vue')
const Device = () => import('@/views/Configuration/Device/Device.vue')
const DeviceSDK = () => import('@/views/Configuration/Device/DeviceSDK.vue')
const System = () => import('@/views/System/System.vue')
const Setting = () => import('@/views/System/Setting/Setting.vue')
const License = () => import('@/views/System/Setting/License.vue')
const SystemConfig = () => import('@/views/System/Setting/SystemConfig.vue')
const OperationLog = () => import('@/views/System/Setting/Maintain/OperationLog.vue')
const SystemMaintenance = () => import('@/views/System/Setting/Maintain/SystemMaintenance.vue')
const SystemUpgrade = () => import('@/views/System/Setting/Maintain/SystemUpgrade.vue')
const Analytics = () => import('@/views/Analytics/Analytics.vue')
const AnaSetting = () => import('@/views/Analytics/Setting/Settings.vue')
const Rules = () => import('@/views/Analytics/Setting/Rules.vue')
const EventSearch = () => import('@/views/Analytics/Setting/EventSearch.vue')
const InferServerSetting = () => import('@/views/Analytics/Setting/InferServerSetting.vue')
const InferServerStatus = () => import('@/views/Analytics/Setting/InferServerStatus.vue')

const router = createRouter({
  history: createWebHashHistory(),
  linkActiveClass: 'open active',
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  },
  routes: [{
    path: '/',
    redirect: (to) => {
      console.log('Redirect from /, query:', to.query);
      return {
        path: '/Login',
        query: to.query // 显示传递参数
      }
    }
  },{
    path: '/Login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'login',
      type: ''  //  不需要鉴权
    }
  }, {
    path: '/Logout',
    name: 'Logout',
    component: Logout,
    meta: {
      title: 'Logout',
      type: ''
    }
  }, {
    path: '/',
    name: 'Home',
    component: TheContainer,
    meta: {
      type: 'Administrator' // 是否需要判断是否登录，这里是需要判断
    },
    children: [{
      path: 'Monitoring',
      name: 'Monitoring',
      component: Monitoring,
      redirect: '/Monitoring/View',
      meta: {
        title: '/Monitoring',
        name: 'Router.router_monitoring',
        icon: 'iconfont icon-shexiangji',
        type: 'Operator'  // 是否需要判断是否登录,这里是需要判断
      },
      children: [{
        path: 'View',
        name: 'View',
        component: Liveview,
        meta: {
          title: '/Monitoring/View',
          name: 'Router.router_view',
          icon: 'iconfont icon-shitu',
          type: 'Operator'  // 是否需要判断是否登录,这里是需要判断
        }
      }, {
        path: 'Search',
        name: 'Search',
        component: Search,
        redirect: '/Monitoring/Search/RecordInfo',
        meta: {
          title: '/Monitoring/Search',
          name: 'CommTableEdit.comm_search',
          icon: 'iconfont icon-sousuoicon',
          type: 'Operator'  // 是否需要判断是否登录,这里是需要判断
        },
        children: [{
          path: 'RecordInfo',
          name: 'RecordInfo',
          component: RecordInfo,
          meta: {
            title: '/Monitoring/Search/RecordInfo',
            name: 'RecordInfo',
            icon: '',
            type: 'Operator'
          }
        }]
      }]
    }, {
      path: 'Configuration',
      name: 'Configuration',
      component: Configuration,
      redirect: '/Configuration/Basic/StorageMode',
      meta: {
        title: '/Configuration',
        name: 'Router.router_configuration',
        icon: '',
        type: 'Operator'
      },
      children: [{
        path: 'Basic',
        name: 'Basic',
        component: Basic,
        redirect: '/Configuration/Basic/StorageMode',
        meta: {
          title:'/Configuration/Basic',
          name: 'Router.router_basic',
          icon: 'iconfont icon-jiben',
          type: 'Operator'
        },
        children: [{
          path: 'StorageMode',
          name: 'StorageMode',
          component: StorageMode,
          meta: {
            title: '/Configuration/Basic/StorageMode',
            name: 'StorageMode',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'MetaStorage',
          name: 'MetaStorage',
          component: MetaStorage,
          meta: {
            title: '/Configuration/Basic/MetaStorage',
            name: 'MetaStorage',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'LocalObjectStorage',
          name: 'LocalObjectStorage',
          component: LocalObjectStorage,
          meta: {
            title: '/Configuration/Basic/LocalObjectStorage',
            name: 'LocalObjectStorage',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'S3Storage',
          name: 'S3Storage',
          component: S3Storage,
          meta: {
            title: '/Configuration/Basic/S3Storage',
            name: 'S3Storage',
            icon: '',
            type: 'Operator'
          }
        }]
      }, {
        path: 'Device',
        name: 'Device',
        component: Device,
        redirect: '/Configuration/Device/DeviceSDK',
        meta: {
          title: '/Configuration/Device',
          name: 'Device.device_dev',
          icon: 'iconfont icon-shebei',
          type: 'Operator'
        },
        children: [{
          path: 'DeviceSDK',
          name: 'DeviceSDK',
          component: DeviceSDK,
          meta: {
            title:'/Configuration/Device/DeviceSDK',
            name: 'Device.device_video_device',
            icon: '',
            type: 'Operator'
          }
        }]
      }]
    }, {
      path: 'Analytics',
      name: 'Analytics',
      component: Analytics,
      redirect: '/Analytics/AnaSetting/Rules',
      meta: {
        title: '/Analytics',
        name: 'Router.router_analytics',
        icon: '',
        type: 'Opeartor'
      },
      children: [{
        path: 'AnaSetting',
        name: 'AnaSetting',
        component: AnaSetting,
        redirect: '/Analytics/AnaSetting/Rules',
        meta: {
          title: '/Analytics/AnaSetting',
          name: 'System.sys_setting',
          icon: 'iconfont icon-shezhiicon',
          type: 'Operator'
        },
        children: [{
        //   path: 'Rules',
        //   name: 'Rules',
        //   component: Rules,
        //   meta: {
        //     title:'/Analytics/AnaSetting/Rules',
        //     name: 'Rules',
        //     icon: '',
        //     type: 'Operator'
        //   }
        // }, {
        //   path: 'EventSearch',
        //   name: 'EventSearch',
        //   component: EventSearch,
        //   meta: {
        //     title:'/Analytics/AnaSetting/EventSearch',
        //     name: 'EventSearch',
        //     icon: '',
        //     type: 'Operator'
        //   }
        // }, {
          path: 'InferServerSetting',
          name: 'InferServerSetting',
          component: InferServerSetting,
          meta: {
            title:'/Analytics/AnaSetting/InferServerSetting',
            name: 'InferServerSetting',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'InferServerStatus',
          name: 'InferServerStatus',
          component: InferServerStatus,
          meta: {
            title:'/Analytics/AnaSetting/InferServerStatus',
            name: 'InferServerStatus',
            icon: '',
            type: 'Operator'
          }
        }]
      }]
    }, {
      path: 'System',
      name: 'System',
      component: System,
      redirect: '/System/Setting/OperationLog',
      meta: {
        title: '/System',
        name: 'System.sys_system',
        icon: '',
        type: 'Operator'
      },
      children: [{
        path: 'Setting',
        name: 'Setting',
        component: Setting,
        redirect: '/System/Setting/OperationLog',
        meta: {
          title: '/System/Setting',
          name: 'System.sys_setting',
          icon: 'iconfont icon-icon-test1',
          type: 'Operator'
        },
        children: [{
          path: 'OperationLog',
          name: 'OperationLog',
          component: OperationLog,
          meta: {
            title:'/System/Setting/OperationLog',
            name: 'OperationLog',
            icon: '',
            type: 'Operator'
          }
        },{
          path: 'SystemMaintenance',
          name: 'SystemMaintenance',
          component: SystemMaintenance,
          meta: {
            title:'/System/Setting/SystemMaintenance',
            name: 'SystemMaintenance',
            icon: '',
            type: 'Operator'
          }
        },{
          path: 'SystemUpgrade',
          name: 'SystemUpgrade',
          component: SystemUpgrade,
          meta: {
            title:'/System/Setting/SystemUpgrade',
            name: 'SystemUpgrade',
            icon: '',
            type: 'Operator'
          }
        },{
          path: 'License',
          name: 'License',
          component: License,
          meta: {
            title:'/System/Setting/License',
            name: 'System.sys_license',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'SystemConfig',
          name: 'SystemConfig',
          component: SystemConfig,
          meta: {
            title: '/System/Setting/SystemConfig',
            name: 'SystemConfig',
            icon: '',
            type: 'Operator'
          }
        }]
      }]
    }]
  }],
})

export default router

