

import { createRouter, createWebHashHistory } from 'vue-router'

const Login = () => import('@/containers/Login.vue');
const Home = () => import('@/views/Home/Home.vue')
const TheContainer = () => import('@/containers/TheContainer.vue')
const Monitoring = () => import('@/views/Monitoring/Monitoring.vue')
const GridCloudView = () => import('@/views/Monitoring/GridCloudView.vue')
const GridView = () => import('@/views/Monitoring/GridView.vue')
const ViewPage = () => import('@/views/Monitoring/View.vue')
const Search = () => import('@/views/Monitoring/search/Search.vue')
const RecordInfo = () =>import('@/views/Monitoring/search/RecordInfo.vue');
const Logout = () => import('@/containers/Logout.vue')
const Configuration = () => import('@/views/Configuration/Configuration.vue')
const Basic = () => import('@/views/Configuration/Basic/Basic.vue')
const StorageMode = () => import('@/views/Configuration/Basic/StorageSetting/StorageMode.vue')
const MetaStorage = () => import('@/views/Configuration/Basic/StorageSetting/MetaStorage.vue')
const LocalObjectStorage = () => import('@/views/Configuration/Basic/StorageSetting/LocalObjectStorage.vue')
const S3Storage = () => import('@/views/Configuration/Basic/StorageSetting/S3Storage.vue')
const RegularStorage = () => import('@/views/Configuration/Basic/StorageSetting/RegularStorage.vue')
const RecordingTemplate = () => import('@/views/Configuration/Basic/StorageSetting/RecordingTemplate.vue')
const ArchiveStorage = () => import('@/views/Configuration/Basic/StorageSetting/ArchiveStorage.vue')
const SnapshotTemplate = () => import('@/views/Configuration/Basic/StorageSetting/SnapshotTemplate.vue')
const UserConfigPage = () => import('@/views/Configuration/Basic/User/UserConfig.vue')
const Role = () => import('@/views/Configuration/Basic/Role.vue')
const Group = () => import('@/views/Configuration/Basic/Group.vue')
const TimeTemplate = () => import('@/views/Configuration/Basic/TimeTemplate.vue')
const DevicePartition = () => import('@/views/Configuration/Basic/DevicePartition/DevicePartition.vue')
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
const Classifier = () => import('@/views/Analytics/Setting/Classifier.vue')

const router = createRouter({
  history: createWebHashHistory(),
  linkActiveClass: 'open active',
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  },
  routes: [{
    path: '/Login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'login',
      type: ''  // no auth required
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
    name: 'Container',
    component: TheContainer,
    redirect: '/Home',
    meta: {
      type: 'Administrator' // requires auth
    },
    children: [{
      path: 'Home',
      name: 'Home',
      component: Home,
      meta: {
        title: '/Home',
        name: 'Common.comm_home',
        type: 'Operator'
      }
    }, {
      path: 'Monitoring',
      name: 'Monitoring',
      component: Monitoring,
      redirect: '/Monitoring/View',
      meta: {
        title: '/Monitoring',
        name: 'Router.router_monitoring',
        icon: 'iconfont icon-shexiangji',
        type: 'Operator'
      },
      children: [{
        path: 'GridCloudView',
        name: 'GridCloudView',
        component: GridCloudView,
        meta: {
          title: '/Monitoring/GridCloudView',
          name: 'Monitoring.mon_grid_cloud_view',
          icon: 'iconfont icon-wanggeyunshitu',
          type: 'Operator',
          hidden: true
        }
      }, {
        path: 'View',
        name: 'View',
        component: ViewPage,
        meta: {
          title: '/Monitoring/View',
          name: 'Monitoring.mon_view',
          icon: 'iconfont icon-shitu',
          type: 'Operator'
        }
      }, {
        path: 'GridView',
        name: 'GridView',
        component: GridView,
        meta: {
          title: '/Monitoring/GridView',
          name: 'Monitoring.mon_grid_view',
          icon: 'iconfont icon-wanggeshitu',
          type: 'Operator'
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
          type: 'Operator'
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
      redirect: '/Configuration/Basic/DevicePartition',
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
        redirect: '/Configuration/Basic/DevicePartition',
        meta: {
          title:'/Configuration/Basic',
          name: 'Router.router_basic',
          icon: 'iconfont icon-jiben',
          type: 'Operator'
        },
        children: [{
          path: 'DevicePartition',
          name: 'DevicePartition',
          component: DevicePartition,
          meta: {
            title: '/Configuration/Basic/DevicePartition',
            name: 'Router.router_device_partition',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'Role',
          name: 'Role',
          component: Role,
          meta: {
            title: '/Configuration/Basic/Role',
            name: 'Configuration.conf_role',
            icon: 'iconfont icon-jiaose1',
            type: 'Operator'
          }
        }, {
          path: 'Group',
          name: 'Group',
          component: Group,
          meta: {
            title: '/Configuration/Basic/Group',
            name: 'Configuration.conf_group',
            icon: 'iconfont icon-zuzhi1',
            type: 'Operator'
          }
        }, {
          path: 'TimeTemplate',
          name: 'TimeTemplate',
          component: TimeTemplate,
          meta: {
            title: '/Configuration/Basic/TimeTemplate',
            name: 'Configuration.conf_time_template',
            icon: 'iconfont icon-jihuamoban',
            type: 'Operator'
          }
        }, {
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
          path: 'RegularStorage',
          name: 'RegularStorage',
          component: RegularStorage,
          meta: {
            title: '/Configuration/Basic/RegularStorage',
            name: 'RegularStorage',
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
        }, {
          path: 'RecordingTemplate',
          name: 'RecordingTemplate',
          component: RecordingTemplate,
          meta: {
            title: '/Configuration/Basic/RecordingTemplate',
            name: 'RecordingTemplate',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'SnapshotTemplate',
          name: 'SnapshotTemplate',
          component: SnapshotTemplate,
          meta: {
            title: '/Configuration/Basic/SnapshotTemplate',
            name: 'SnapshotTemplate',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'ArchiveStorage',
          name: 'ArchiveStorage',
          component: ArchiveStorage,
          meta: {
            title: '/Configuration/Basic/ArchiveStorage',
            name: 'ArchiveStorage',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'User/UserConfig',
          name: 'UserConfig',
          component: UserConfigPage,
          meta: {
            title: '/Configuration/Basic/User/UserConfig',
            name: 'Router.router_user_config',
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
          icon: 'iconfont icon-shebei1',
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
          path: 'Rules',
          name: 'Rules',
          component: Rules,
          meta: {
            title:'/Analytics/AnaSetting/Rules',
            name: 'Rules',
            icon: '',
            type: 'Operator'
          }
        }, {
          path: 'EventSearch',
          name: 'EventSearch',
          component: EventSearch,
          meta: {
            title:'/Analytics/AnaSetting/EventSearch',
            name: 'EventSearch',
            icon: '',
            type: 'Operator'
          }
        }, {
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
        }, {
          path: 'Classifier',
          name: 'Classifier',
          component: Classifier,
          meta: {
            title: '/Analytics/AnaSetting/Classifier',
            name: 'Classifier',
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
  }, {
    path: '/:pathMatch(.*)*',
    redirect: '/Login'
  }],
})

export default router

