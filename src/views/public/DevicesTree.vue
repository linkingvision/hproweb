import Vue from 'vue';
import axios from 'axios';
import store from '../../store';
import VueI18n from 'vue-i18n';
import LangEn from '../../../static/lang/en.json';
import LangZhCHS from '../../../static/lang/zh.json';
import LangZhCHT from '../../../static/lang/zh-tw.json';
import LangPT from '../../../static/lang/pt.json';
import LangES from '../../../static/lang/es.json';
import uuid from '../../assets/js/uuid';
Vue.use(VueI18n)
const i18n = new VueI18n({
  locale: 'zhchs',
  messages: {
    'en': LangEn,
    'zhchs': LangZhCHS,
    'zhcht': LangZhCHT,
    'pt': LangPT,
    'es': LangES,
  }
})
i18n.locale = store.state.lang;

let root = store.state.IPPORT;
var DevicePartitionData = [];// 设备分区全部
var DevPartitionNoDevice = [];//只有设备分区，没有设备
var DevicePartitionStreamProfile = [];//设备分区有主辅码流节点
var DevicePartitionNoStreamProfile = [];//设备分区没有主辅码流节点
var AllDevicePartitionStreamProfile = [];//设备分区有主辅码流节点
var AllDevicePartitionNoStreamProfile = [];//设备分区没有主辅码流节点
var CasDevicePartition = [];//级联分区(如果级联分区在设备分区下则会显示设备分区，会过滤掉没有级联分区的设备分区)
var CasDevicePartitionNoDevice = [];//只有级联分区没有设备
var CasDevicePartitionStreamProfile = [];//设备分区有主辅码流节点(级联)
var CasDevicePartitionNoStreamProfile = [];//设备分区没有有主辅码流节点(级联)
var AccessDevicePartition = [];//设备分区(门禁)
var DevCasPartition = [];//设备分区和级联分区(没有设备)

var DevicePartitionDataFilterNode = [];//FilterNode搜索过滤(EnablePartitionTreeCacheSearch)

var LogicPartitionDeviceData = [];// 逻辑分区全部(有主辅码流节点)
var LogicPartitionDeviceDataNoStreamProfile = [];// 逻辑分区全部(没有主辅码流节点)
var LogicPartitionNoDevice = [];//只有逻辑分区，没有设备

var GroupData = [];// 组织列表
var RoleData = [];// 角色列表
var MapData = [];// 地图列表
var UserData = [];//用户配置

// 设备分区的type有哪些可以传的
// ("USC_CHANNEL", "USC_DEV_PARTITION", "USC_CAS_PARTITION", "USC_DEVICE", "USC_MAP", "USC_VIEW", "USC_ACCESS_DEVICE")
// 获取设备分区
function DevicePartition(type, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, devPartitionId = 10000) {
  let DevicePartitionUrl = '/uapi/v1/DevPartition/List?pageSize=100000';
  if (EnableDevPartitionLazyLoading) {
    DevicePartitionUrl = '/uapi/v1/DevPartition/Item/' + devPartitionId;
  }
  let url = root + DevicePartitionUrl;
  if (type) {
    if (url.includes("?")) {
      url = url + "&type=" + type;
    } else {
      url = url + "?type=" + type;
    }
  }
  return axios.get(url);
}
// 设备分区搜索过滤节点
function DevPartitionFilterNode(filterText) {
  let url = root + '/uapi/v1/DevPartition/FilterNode?filterText=' + filterText;
  return axios.get(url);
}
async function getdevicePartition(result, EnableDevPartitionShowDeviceNode, filterText) {
  if (result.status == 200 && result.data.msg == 'Success') {
    var data = result.data.result;
    if (data) {
      for (let i = 0; i < data.length; i++) {
        var srcGroup = { children: [] };
        if (store.state.lang && store.state.lang == 'zhchs') {
          srcGroup.label = i18n.tc('CommDev.comm_dev_root');
        } else {
          srcGroup.label = data[i].devPartitionName;
        }
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.devPartitionId = data[i].devPartitionId;
        srcGroup.parentId = data[i].parentId;
        srcGroup.description = data[i].description;
        srcGroup.uuid = data[i].uuid;
        srcGroup.CustomUuid = data[i].uuid;
        srcGroup.DifferentType = 'Root';
        srcGroup.children = data[i].children ? await Fn(data[i].children, null, EnableDevPartitionShowDeviceNode, filterText) : [];
        srcGroup.enableGB = data[i].enableGB;
        srcGroup.cascadeCode = data[i].cascadeCode;
        srcGroup.regionCodeName = data[i].regionCodeName;
        if (data[i].dev) {
          var dev = data[i].dev;
          var AllChannel = [];
          for (let k = 0; k < dev.length; k++) {
            if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
              var newItem = {
                token: dev[k].token,
                label: dev[k].name,
                type: dev[k].type,
                DifferentType: 'dev',
                enabled: dev[k].enabled,
                iconclass: 'iconfont icon-Device',
                children: [],
                DevicesQuantity: true,
                isFilter: true,
                online: 0,
                length: 0,
                uuid: dev[k].token,
                CustomUuid: dev[k].token,
              };
              if (!dev[k].online) {
                newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
                newItem['iconclass4'] = 'el-tree-camera';
              }
              if (!filterText) {
                let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
                newItem.children.push(res);
                srcGroup.children.push(newItem);
              } else {
                if (dev[k].channels?.length > 0) {
                  channelFilterNode(dev[k].channels, newItem, srcGroup);
                } else {
                  srcGroup.children.push(newItem);
                }
              }
            } else if (EnableDevPartitionShowDeviceNode == false) {
              AllChannel.push(dev[k].token);
            }
          }
          if (AllChannel.length > 0) {
            var channel = {
              tokens: AllChannel,
            };
            await DevPartitionShowDeviceNode(channel, null, srcGroup);
          }
        }
        if (data[i].casDev) {
          var casDev = data[i].casDev;
          for (let k = 0; k < casDev.length; k++) {
            var newItem = {
              token: casDev[k].token,
              label: casDev[k].name,
              type: casDev[k].casType,
              DifferentType: 'casDev',
              enabled: casDev[k].enabled,
              gbId: casDev[k].gbId,
              devId: casDev[k].devId,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: casDev[k].token,
              CustomUuid: casDev[k].token,
            };
            if (!casDev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if (!filterText) {
              let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
              newItem.children.push(res);
              srcGroup.children.push(newItem);
            } else {
              if (casDev[k].casPartition) {
                if (casDev[k].casPartition[0].children?.length > 0) {
                  newItem.children = CascadeChildren(casDev[k].casPartition[0].children, null, null, null, filterText);
                }
                if (casDev[k].casPartition[0].chan?.length > 0) {
                  CascadeChan(casDev[k].casPartition[0].chan, newItem, null, null, filterText);
                }
              }
              srcGroup.children.push(newItem);
            }
          }
        }
        if (data[i].map) {
          var map = data[i].map;
          for (let k = 0; k < map.length; k++) {
            var newItem = {
              token: map[k].mapId,
              label: map[k].mapName,
              type: map[k].type,
              DifferentType: 'map',
              // enabled: map[k].enabled,
              iconclass: 'iconfont icon-ditu',
              extent: map[k].extent,
              center: map[k].center,
              projection: map[k].projection,
              zoom: map[k].zoom,
              imgData: map[k].imgData,
              mapUrl: map[k].mapUrl,
              mapUrl2: map[k].mapUrl2,
              // children: [],
              isFilter: true,
              online: 0,
              length: 0,
              uuid: map[k].uuid,
              CustomUuid: map[k].uuid,
              disabled_me: false,
              zoom: map[k].zoom,
              maxZoom: map[k].maxZoom,
              minZoom: map[k].minZoom,
              centerCord: map[k].centerCord,
              tileX: map[k].tileX,
              tileY: map[k].tileY,
              onlineTile: map[k].onlineTile,
              systemDefaultMap: map[k].systemDefaultMap,
            };
            // let res = { EmptyItem: 1 };
            // newItem.children.push(res);
            srcGroup.children.push(newItem);
          }
        }
        if (data[i].view) {
          var view = data[i].view;
          for (let k = 0; k < view.length; k++) {
            var newItem = {
              token: view[k].viewId,
              label: view[k].viewName,
              type: view[k].viewType,
              DifferentType: 'view',
              enabled: view[k].enabled,
              iconclass: 'iconfont icon-shitu2',
              // children: [],
              isFilter: true,
              online: 0,
              length: 0,
              uuid: view[k].uuid,
              CustomUuid: view[k].uuid,
              disabled_me: false,
              dwellTimeShow: false, //巡更配置使用
              dwellTime: 20, //巡更配置使用
            };
            // let res = { EmptyItem: 1 };
            // newItem.children.push(res);
            srcGroup.children.push(newItem);
          }
        }
        if (data[i].accessDev) {
          var accessDev = data[i].accessDev;
          for (let k = 0; k < accessDev.length; k++) {
            var newItem = {
              token: accessDev[k].accessToken,
              label: accessDev[k].name,
              type: accessDev[k].type,
              DifferentType: 'accessDev',
              enabled: accessDev[k].enabled,
              accessController: accessDev[k].accessController,
              accessDevId: accessDev[k].accessDevId,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: accessDev[k].uuid,
              CustomUuid: accessDev[k].uuid,
            };
            if (!accessDev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
            newItem.children.push(res);
            srcGroup.children.push(newItem);
          }
        }
        if (!filterText) {
          DevicePartitionData.push(srcGroup);
        } else {
          DevicePartitionDataFilterNode.push(srcGroup);
        }

        var srcGroup2 = JSON.parse(JSON.stringify(srcGroup));
        var srcGroup3 = await Fn1(srcGroup2);
        DevPartitionNoDevice.push(await Fn2(srcGroup3));

        var srcGroup4 = JSON.parse(JSON.stringify(srcGroup));
        DevCasPartition.push(await Fn3(srcGroup4));

        var srcGroup5 = JSON.parse(JSON.stringify(srcGroup));
        var srcGroup6 = await Fn3(srcGroup5);
        CasDevicePartition.push(await Fn4(srcGroup6));
      }
    }
  }
}
// 设备分区懒加载
async function getdevicePartitionItem(result, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      var data = result.data.result;
      var srcGroup = { children: [] };
      if (data.devPartitionId == 10000) {
        srcGroup.label = i18n.tc('CommDev.comm_dev_root');
        srcGroup.DifferentType = 'Root';
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.devPartitionId = data.devPartitionId;
        srcGroup.parentId = data.parentId;
        srcGroup.description = data.description;
        srcGroup.uuid = data.uuid;
        srcGroup.CustomUuid = data.uuid;
        srcGroup.enableGB = data.enableGB;
        srcGroup.cascadeCode = data.cascadeCode;
        srcGroup.regionCodeName = data.regionCodeName;
      }
      srcGroup.children = data.children ? await Fn(data.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode) : [];
      if (data.dev) {
        var dev = data.dev;
        var AllChannel = [];
        for (let k = 0; k < dev.length; k++) {
          if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
            var newItem = {
              token: dev[k].token,
              label: dev[k].name,
              type: dev[k].type,
              DifferentType: 'dev',
              enabled: dev[k].enabled,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: dev[k].token,
              CustomUuid: dev[k].token,
            };
            if (!dev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
            newItem.children.push(res);
            srcGroup.children.push(newItem);
          } else if (EnableDevPartitionShowDeviceNode == false) {
            AllChannel.push(dev[k].token);
          }
        }
        if (AllChannel.length > 0) {
          var channel = {
            tokens: AllChannel,
          };
          await DevPartitionShowDeviceNode(channel, null, srcGroup);
        }
      }
      if (data.casDev) {
        var casDev = data.casDev;
        for (let k = 0; k < casDev.length; k++) {
          var newItem = {
            token: casDev[k].token,
            label: casDev[k].name,
            type: casDev[k].casType,
            DifferentType: 'casDev',
            enabled: casDev[k].enabled,
            gbId: casDev[k].gbId,
            devId: casDev[k].devId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: casDev[k].token,
            CustomUuid: casDev[k].token,
          };
          if (!casDev[k].online) {
            newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
          newItem.children.push(res);
          srcGroup.children.push(newItem);
        }
      }
      if (data.map) {
        var map = data.map;
        for (let k = 0; k < map.length; k++) {
          var newItem = {
            token: map[k].mapId,
            label: map[k].mapName,
            type: map[k].type,
            DifferentType: 'map',
            // enabled: map[k].enabled,
            iconclass: 'iconfont icon-ditu',
            extent: map[k].extent,
            center: map[k].center,
            projection: map[k].projection,
            zoom: map[k].zoom,
            imgData: map[k].imgData,
            mapUrl: map[k].mapUrl,
            mapUrl2: map[k].mapUrl2,
            // children: [],
            isFilter: true,
            online: 0,
            length: 0,
            uuid: map[k].uuid,
            CustomUuid: map[k].uuid,
            disabled_me: false,
            zoom: map[k].zoom,
            maxZoom: map[k].maxZoom,
            minZoom: map[k].minZoom,
            centerCord: map[k].centerCord,
            tileX: map[k].tileX,
            tileY: map[k].tileY,
            onlineTile: map[k].onlineTile,
            systemDefaultMap: map[k].systemDefaultMap,
          };
          // let res = { EmptyItem: 1 };
          // newItem.children.push(res);
          srcGroup.children.push(newItem);
        }
      }
      if (data.view) {
        var view = data.view;
        for (let k = 0; k < view.length; k++) {
          var newItem = {
            token: view[k].viewId,
            label: view[k].viewName,
            type: view[k].viewType,
            DifferentType: 'view',
            enabled: view[k].enabled,
            iconclass: 'iconfont icon-shitu2',
            // children: [],
            isFilter: true,
            online: 0,
            length: 0,
            uuid: view[k].uuid,
            CustomUuid: view[k].uuid,
            disabled_me: false,
            dwellTimeShow: false, //巡更配置使用
            dwellTime: 20, //巡更配置使用
          };
          // let res = { EmptyItem: 1 };
          // newItem.children.push(res);
          srcGroup.children.push(newItem);
        }
      }
      if (data.accessDev) {
        var accessDev = data.accessDev;
        for (let k = 0; k < accessDev.length; k++) {
          var newItem = {
            token: accessDev[k].accessToken,
            label: accessDev[k].name,
            type: accessDev[k].type,
            DifferentType: 'accessDev',
            enabled: accessDev[k].enabled,
            accessController: accessDev[k].accessController,
            accessDevId: accessDev[k].accessDevId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: accessDev[k].uuid,
            CustomUuid: accessDev[k].uuid,
          };
          if (!accessDev[k].online) {
            newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
          newItem.children.push(res);
          srcGroup.children.push(newItem);
        }
      }
      if (data.devPartitionId == 10000) {
        DevicePartitionData.push(srcGroup);
      } else {
        DevicePartitionData = srcGroup.children;
      }

      var srcGroup2 = JSON.parse(JSON.stringify(srcGroup));
      var srcGroup3 = await Fn1(srcGroup2);
      DevPartitionNoDevice.push(await Fn2(srcGroup3));

      var srcGroup4 = JSON.parse(JSON.stringify(srcGroup));
      DevCasPartition.push(await Fn3(srcGroup4));

      var srcGroup5 = JSON.parse(JSON.stringify(srcGroup));
      var srcGroup6 = await Fn3(srcGroup5);
      CasDevicePartition.push(await Fn4(srcGroup6));
    }
  }
}
// 节点搜索过滤下的通道
function channelFilterNode(channels, ParentItem, srcGroup, fromPage) {
  var res = channels;
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;
  for (let k = 0; k < res.length; k++) {
    if (res[k].online && res[k].enabled) {
      number = number + 1;
    }
    var newItem = {
      token: res[k].token,
      label: res[k].name,
      name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
      type: res[k].type,
      DifferentType: 'devChannel',
      enabled: res[k].enabled,
      iconclass: 'iconfont icon-shexiangjizaixian',
      devChannel: res[k].devChannel,
      disabled_me: false,
      children: [],
      nodeId: res[k].nodeId,
      online: res[k].online,
      parentToken: res[k].parentToken,
      dome: res[k].dome,
      alias: res[k].alias,
      iconclass1: '',
      icontype: '',
      uuid: res[k].uuid,
      CustomUuid: res[k].uuid,
      setting: res[k].setting,
      recording: res[k].recording,
      metaEnabled: res[k].metaEnabled,
      longitude: res[k].longitude,
      latitude: res[k].latitude,
    };
    if (res[k].online == true) {
      newItem['bOnline'] = true;
    } else if (res[k].online == false) {
      newItem['bOnline'] = false;
    }
    if (!res[k].online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (res[k].recording == true) {
      if (res[k].dome == true) {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baiqiuji';
        } else {
          newItem['iconclass2'] = '#icon-heiqiuji';
        }
      } else {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baishexiangji';
        } else {
          newItem['iconclass2'] = '#icon-heishexiangji';
        }
      }
      newItem['recording'] = true;
    } else if (res[k].recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (res[k].enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (res[k].enabled == false) {
      if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (res[k].enabled == false && store.state.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      if (!isDisabledExempt) {
        continue;
      }
    }
    if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    if (fromPage) {
      if (localStorage.getItem(store.state.user)) {
        let localToken = JSON.parse(localStorage.getItem(store.state.user))['src'];
        for (let i = 0; i < localToken.length; i++) {
          const playtoken = localToken[i]['strToken'];
          if (playtoken == res[k].token && res[k].online == true) {
            newItem['iconclass'] = 'iconfont icon-shexiangjizaixian';
            newItem['iconclass1'] = 'el-tree-camera-play';
            newItem['iconclass3'] = 'none';
            newItem['iconclass4'] = '';
            if (res[k].recording) {
              if (res[k].dome == true) {
                newItem['iconclass2'] = '#icon-lvqiuji';
              } else {
                newItem['iconclass2'] = '#icon-lvshexiangji';
              }
            }
          }
        }
      }
    }
    if (res[k].dome == true) {
      if (!res[k].online) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }
    var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
    if (!res[k].online || res[k].disabled_me) {
      ParentItem.children.push(NoStreamProfileItem);
    } else {
      ParentItem.children.unshift(NoStreamProfileItem);
    }
  }
  srcGroup.children.push(ParentItem);
}
// 设备分区下的子分区，和设备
async function Fn(data, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, filterText) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    if (item.dev || item.casDev || item.map || item.view || item.accessDev) {
      var devChildren = {
        // ...item, // 如果想在原数组添加属性
        parentId: item.parentId,
        devPartitionId: item.devPartitionId,
        label: item.devPartitionName,
        description: item.description,
        uuid: item.uuid,
        CustomUuid: item.uuid,
        iconclass: 'iconfont icon-gen',
        DifferentType: 'PartitionNode',
        disOrder: item.disOrder,
        enableGB: item.enableGB,
        cascadeCode: item.cascadeCode,
        regionCodeName: item.regionCodeName,
        children: item.children ? await Fn(item.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, filterText) : [] // 判断当前是否还有子节点
      }
      if (item.dev) {
        var AllChannel = [];
        for (let k = 0; k < item.dev.length; k++) {
          if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
            var newItem = {
              token: item.dev[k].token,
              label: item.dev[k].name,
              type: item.dev[k].type,
              DifferentType: 'dev',
              enabled: item.dev[k].enabled,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: item.dev[k].token,
              CustomUuid: item.dev[k].token,
            };
            if (!item.dev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if (!filterText) {
              let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
              newItem.children.push(res);
              devChildren.children.push(newItem);
            } else {
              if (item.dev[k].channels?.length > 0) {
                channelFilterNode(item.dev[k].channels, newItem, devChildren);
              } else {
                devChildren.children.push(newItem);
              }
            }
          } else if (EnableDevPartitionShowDeviceNode == false) {
            AllChannel.push(item.dev[k].token);
          }
        }
        if (AllChannel.length > 0) {
          var channel = {
            tokens: AllChannel,
          }
          await DevPartitionShowDeviceNode(channel, null, devChildren); // 使用 await
        }
      }
      if (item.casDev) {
        for (let k = 0; k < item.casDev.length; k++) {
          var newItem = {
            token: item.casDev[k].token,
            label: item.casDev[k].name,
            type: item.casDev[k].casType,
            DifferentType: 'casDev',
            enabled: item.casDev[k].enabled,
            gbId: item.casDev[k].gbId,
            devId: item.casDev[k].devId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.casDev[k].token,
            CustomUuid: item.casDev[k].token,
          };
          if (!item.casDev[k].online) {
            newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          if (!filterText) {
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
            newItem.children.push(res);
            devChildren.children.push(newItem);
          } else {
            if (item.casDev[k].casPartition) {
              if (item.casDev[k].casPartition[0].children?.length > 0) {
                newItem.children = CascadeChildren(item.casDev[k].casPartition[0].children, null, null, null, filterText);
              }
              if (item.casDev[k].casPartition[0].chan?.length > 0) {
                CascadeChan(item.casDev[k].casPartition[0].chan, newItem, null, null, filterText);
              }
            }
            devChildren.children.push(newItem);
          }
        }
      }
      if (item.map) {
        for (let k = 0; k < item.map.length; k++) {
          var newItem = {
            token: item.map[k].mapId,
            label: item.map[k].mapName,
            type: item.map[k].type,
            DifferentType: 'map',
            // enabled: item.map[k].enabled,
            iconclass: 'iconfont icon-ditu',
            extent: item.map[k].extent,
            center: item.map[k].center,
            projection: item.map[k].projection,
            zoom: item.map[k].zoom,
            imgData: item.map[k].imgData,
            mapUrl: item.map[k].mapUrl,
            mapUrl2: item.map[k].mapUrl2,
            // children: [],
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.map[k].uuid,
            CustomUuid: item.map[k].uuid,
            disabled_me: false,
            zoom: item.map[k].zoom,
            maxZoom: item.map[k].maxZoom,
            minZoom: item.map[k].minZoom,
            centerCord: item.map[k].centerCord,
            tileX: item.map[k].tileX,
            tileY: item.map[k].tileY,
            onlineTile: item.map[k].onlineTile,
            systemDefaultMap: item.map[k].systemDefaultMap,
          };
          // let res = { EmptyItem: 1 };
          // newItem.children.push(res);
          devChildren.children.push(newItem);
        }
      }
      if (item.view) {
        for (let k = 0; k < item.view.length; k++) {
          var newItem = {
            token: item.view[k].viewId,
            label: item.view[k].viewName,
            type: item.view[k].viewType,
            DifferentType: 'view',
            enabled: item.view[k].enabled,
            iconclass: 'iconfont icon-shitu2',
            // children: [],
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.view[k].uuid,
            CustomUuid: item.view[k].uuid,
            disabled_me: false,
            dwellTimeShow: false, //巡更配置使用
            dwellTime: 20, //巡更配置使用
          };
          // let res = { EmptyItem: 1 };
          // newItem.children.push(res);
          devChildren.children.push(newItem);
        }
      }
      if (item.accessDev) {
        for (let k = 0; k < item.accessDev.length; k++) {
          var newItem = {
            token: item.accessDev[k].accessToken,
            label: item.accessDev[k].name,
            type: item.accessDev[k].type,
            DifferentType: 'accessDev',
            enabled: item.accessDev[k].enabled,
            accessController: item.accessDev[k].accessController,
            accessDevId: item.accessDev[k].accessDevId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.accessDev[k].uuid,
            CustomUuid: item.accessDev[k].uuid,
          };
          if (!item.accessDev[k].online) {
            newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
          newItem.children.push(res);
          devChildren.children.push(newItem);
        }
      }
      result.push(devChildren);
    } else {
      var children = [];
      let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
      children.push(res);
      result.push({
        parentId: item.parentId,
        devPartitionId: item.devPartitionId,
        label: item.devPartitionName,
        description: item.description,
        uuid: item.uuid,
        CustomUuid: item.uuid,
        iconclass: 'iconfont icon-gen',
        DifferentType: 'PartitionNode',
        disOrder: item.disOrder,
        enableGB: item.enableGB,
        cascadeCode: item.cascadeCode,
        regionCodeName: item.regionCodeName,
        children: item.children && item.children.length > 0 ? await Fn(item.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, filterText) : (EnableDevPartitionLazyLoading ? children : [])
      });
    }
  }
  result.sort((a, b) => a.disOrder - b.disOrder);
  return result;
}
// 设备分区，过滤设备
function Fn1(data) {
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      if (data.children[i].isFilter) {
        // delete data.children[i];
        data.children[i] = {};
        // data.children.splice(i,1)
      } else {
        if (data.children[i].children) {
          Fn1(data.children[i])
        }
      }
    }
  }
  return data;
}
function Fn2(data) {
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      if (JSON.stringify(data.children[i]) == '{}') {
        if (JSON.stringify(data.children) == '{}') {
          data.children = [];
        } else {
          data.children.splice(i, 1);
          i--;
        }
      } else {
        if (data.children[i].children) {
          Fn2(data.children[i]);
        }
      }
    }
  }
  return data;
}
// 设备分区下除了级联的都过滤掉
function Fn3(data) {
  if (Array.isArray(data.children)) {
    for (let i = 0; i < data.children.length; i++) {
      if (data.children[i].DifferentType == 'dev' || data.children[i].DifferentType == 'map' || data.children[i].DifferentType == 'view' || data.children[i].DifferentType == 'accessDev' || data.children[i].DifferentType == 'devChannel' || data.children[i].DifferentType == 'CasDevChannel') {
        data.children.splice(i, 1);
        i--;
        continue;
      } else if (data.children[i].DifferentType == 'PartitionNode' || data.children[i].DifferentType == 'casDev' || data.children[i].DifferentType == 'CasDevChildren') {
        Fn3(data.children[i]);
      }
    }
  }
  return data;
}
// 设备分区下如果没有级联就过滤掉
function Fn4(node) {
  // 如果没有子节点，直接返回 null
  if (!node.children || !Array.isArray(node.children)) {
    return null;
  }
  // 使用 filter 和 some 处理子节点
  const filteredChildren = node.children.filter(child => {
    if (child.DifferentType === 'casDev') {
      return true; // 保留 casDev 子节点
    }
    const result = Fn4(child); // 递归调用
    return result !== null; // 只保留有结果的子节点
  });
  // 更新节点的子节点
  node.children = filteredChildren;
  // 标记当前节点是否有 casDev 子节点
  const hasCasDevChild = node.children.some(child => child.DifferentType === 'casDev');
  // 如果当前节点是 casDev，直接返回它
  if (node.DifferentType === 'casDev') {
    return node; // 返回 casDev 节点
  }
  // 如果当前节点没有 casDev 子节点且没有其他子节点，返回 null
  if (!hasCasDevChild && node.children.length === 0) {
    return null; // 过滤掉当前节点
  }
  // 返回当前节点（如果有保留的子节点或祖先节点）
  return node;
}
// 获取设备下的通道
function DeviceChannels(token, isDisabledExempt) {
  let url = `${root}/uapi/v1/Device/Channels?token=${token}`;
  if (isDisabledExempt || store.state.devicemarktoggle === 'true') {
    url += '&all=true';
  }
  return axios.get(url);
}
function channelThen(result, isDisabledExempt, fromPage, srcGroup) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var number = 0;
      var numberbDisable = 0;
      var offlineNumber = 0;
      var disableNumber = 0;
      var IdleNumber = 0;

      //新增临时数组
      var tempStream = [];
      var tempNoStream = [];

      for (let k = 0; k < res.length; k++) {
        if (res[k].online && res[k].enabled) {
          number = number + 1;
        }
        var newItem = {
          token: res[k].token,
          label: res[k].name,
          name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
          type: res[k].type,
          DifferentType: 'devChannel',
          enabled: res[k].enabled,
          iconclass: 'iconfont icon-shexiangjizaixian',
          devChannel: res[k].devChannel,
          disabled_me: false,
          children: [],
          nodeId: res[k].nodeId,
          online: res[k].online,
          parentToken: res[k].parentToken,
          dome: res[k].dome,
          alias: res[k].alias,
          iconclass1: '',
          icontype: '',
          uuid: res[k].uuid,
          CustomUuid: res[k].uuid,
          setting: res[k].setting,
          recording: res[k].recording,
          metaEnabled: res[k].metaEnabled,
          longitude: res[k].longitude,
          latitude: res[k].latitude,
        };
        if (res[k].online == true) {
          newItem['bOnline'] = true;
        } else if (res[k].online == false) {
          newItem['bOnline'] = false;
        }
        if (!res[k].online) {
          newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
        }
        if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
          offlineNumber = offlineNumber + 1;
        }
        if (res[k].recording == true) {
          if (res[k].dome == true) {
            if (store.state.darkMode) {
              newItem['iconclass2'] = '#icon-baiqiuji';
            } else {
              newItem['iconclass2'] = '#icon-heiqiuji';
            }
          } else {
            if (store.state.darkMode) {
              newItem['iconclass2'] = '#icon-baishexiangji';
            } else {
              newItem['iconclass2'] = '#icon-heishexiangji';
            }
          }
          newItem['recording'] = true;
        } else if (res[k].recording == false) {
          newItem['recording'] = false;
          newItem['iconclass2'] = '';
        }
        if (res[k].enabled == false) {
          newItem['disabled_me'] = true;
          newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera camera';
        }
        if (res[k].enabled == false) {
          if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
            disableNumber = disableNumber + 1;
          }
        }
        if (res[k].enabled == false && store.state.devicemarktoggle == 'false') {
          numberbDisable = numberbDisable + 1;
          if (!isDisabledExempt) {
            continue;
          }
        }
        if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
          newItem['idle'] = true;
          newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
          IdleNumber = IdleNumber + 1;
        }
        if (fromPage) {
          // if (localStorage.getItem(store.state.user)) {
          //   let localToken = JSON.parse(localStorage.getItem(store.state.user))['src'];
          //   for (let i = 0; i < localToken.length; i++) {
          //     const playtoken = localToken[i]['strToken'];
          //     if (playtoken == res[k].token && res[k].online == true) {
          //       newItem['iconclass'] = 'iconfont icon-shexiangjizaixian';
          //       newItem['iconclass1'] = 'el-tree-camera-play';
          //       newItem['iconclass3'] = 'none';
          //       newItem['iconclass4'] = '';
          //       if (res[k].recording) {
          //         if (res[k].dome == true) {
          //           newItem['iconclass2'] = '#icon-lvqiuji';
          //         } else {
          //           newItem['iconclass2'] = '#icon-lvshexiangji';
          //         }
          //       }
          //     }
          //   }
          // }
        }
        if (res[k].dome == true) {
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
          } else {
            newItem['iconclass'] = 'iconfont icon-zaixian';
          }
        }
        var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
        // if (!res[k].online || res[k].disabled_me) {
        //   DevicePartitionNoStreamProfile.push(NoStreamProfileItem);
        //   DevicePartitionStreamProfile.push(newItem);
        //   if (srcGroup) {
        //     srcGroup.children.push(newItem);
        //   }
        // } else {
        //   DevicePartitionNoStreamProfile.unshift(NoStreamProfileItem);
        //   DevicePartitionStreamProfile.unshift(newItem);
        //   if (srcGroup) {
        //     srcGroup.children.unshift(newItem);
        //   }
        // }
        tempStream.push(newItem);
        tempNoStream.push(NoStreamProfileItem);

        tempStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });
        tempNoStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });

        DevicePartitionStreamProfile = tempStream;
        DevicePartitionNoStreamProfile = tempNoStream;

        if(srcGroup){
          srcGroup.children = tempStream;
        }


        DevicePartitionNoStreamProfile.AllLength = result.data.result.length - numberbDisable;
        DevicePartitionNoStreamProfile.online = number;
        DevicePartitionNoStreamProfile.offline = offlineNumber;
        DevicePartitionNoStreamProfile.disable = disableNumber;
        DevicePartitionNoStreamProfile.idle = IdleNumber;

        DevicePartitionStreamProfile.AllLength = result.data.result.length - numberbDisable;
        DevicePartitionStreamProfile.online = number;
        DevicePartitionStreamProfile.offline = offlineNumber;
        DevicePartitionStreamProfile.disable = disableNumber;
        DevicePartitionStreamProfile.idle = IdleNumber;
        for (var i = 0; i < DevicePartitionStreamProfile.length; i++) {
          // 主副流
          var node = [{
            token: DevicePartitionStreamProfile[i].token,
            streamprofile: 'main',
            label: i18n.tc('CommDev.comm_dev_main_stream'),
            name: DevicePartitionStreamProfile[i].label + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
            iconclass: 'mdi mdi-playlist-play fa-fw',
            disabled_me: false,
            DifferentType: 'devChannel',
            uuid: DevicePartitionStreamProfile[i].label + 'main' + DevicePartitionStreamProfile[i].token,
            CustomUuid: DevicePartitionStreamProfile[i].label + 'main' + DevicePartitionStreamProfile[i].token,
            setting: DevicePartitionStreamProfile[i].setting,
            recording: DevicePartitionStreamProfile[i].recording,
          }, {
            token: DevicePartitionStreamProfile[i].token,
            streamprofile: 'sub',
            label: i18n.tc('CommDev.comm_dev_sub_stream'),
            name: DevicePartitionStreamProfile[i].label + '--' + i18n.tc('CommDev.comm_dev_sub_stream'),
            iconclass: 'mdi mdi-playlist-play fa-fw',
            disabled_me: false,
            DifferentType: 'devChannel',
            uuid: DevicePartitionStreamProfile[i].label + 'sub' + DevicePartitionStreamProfile[i].token,
            CustomUuid: DevicePartitionStreamProfile[i].label + 'sub' + DevicePartitionStreamProfile[i].token,
            recording: DevicePartitionStreamProfile[i].recording,
          }]
          // DevicePartitionStreamProfile[i].children = node;
        }
      }
    }
  }
}
// 获取设备下所有的的通道
function DeviceChannelsAll(data) {
  var url = root + '/uapi/v1/Device/Channels';
  return axios.post(url, data);
}
function channelThenAll(result, isDisabledExempt, srcGroup) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var number = 0;
      var numberbDisable = 0;
      var offlineNumber = 0;
      var disableNumber = 0;
      var IdleNumber = 0;

      //新增临时数组
      var tempStream = [];
      var tempNoStream = [];

      for (let k = 0; k < res.length; k++) {
        if (res[k].online && res[k].enabled) {
          number = number + 1;
        }
        var newItem = {
          token: res[k].token,
          label: res[k].name,
          name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
          type: res[k].type,
          DifferentType: 'devChannel',
          enabled: res[k].enabled,
          iconclass: 'iconfont icon-shexiangjizaixian',
          devChannel: res[k].devChannel,
          disabled_me: false,
          children: [],
          nodeId: res[k].nodeId,
          online: res[k].online,
          parentToken: res[k].parentToken,
          dome: res[k].dome,
          alias: res[k].alias,
          iconclass1: '',
          icontype: '',
          uuid: res[k].uuid,
          CustomUuid: res[k].uuid,
          setting: res[k].setting,
          recording: res[k].recording,
          metaEnabled: res[k].metaEnabled,
          longitude: res[k].longitude,
          latitude: res[k].latitude,
        };
        if (res[k].online == true) {
          newItem['bOnline'] = true;
        } else if (res[k].online == false) {
          newItem['bOnline'] = false;
        }
        if (!res[k].online) {
          newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
        }
        if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
          offlineNumber = offlineNumber + 1;
        }
        if (res[k].recording == true) {
          if (res[k].dome == true) {
            if (store.state.darkMode) {
              newItem['iconclass2'] = '#icon-baiqiuji';
            } else {
              newItem['iconclass2'] = '#icon-heiqiuji';
            }
          } else {
            if (store.state.darkMode) {
              newItem['iconclass2'] = '#icon-baishexiangji';
            } else {
              newItem['iconclass2'] = '#icon-heishexiangji';
            }
          }
          newItem['recording'] = true;
        } else if (res[k].recording == false) {
          newItem['recording'] = false;
          newItem['iconclass2'] = '';
        }
        if (res[k].enabled == false) {
          newItem['disabled_me'] = true;
          newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera camera';
        }
        if (res[k].enabled == false) {
          if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
            disableNumber = disableNumber + 1;
          }
        }
        if (res[k].enabled == false && store.state.devicemarktoggle == 'false') {
          numberbDisable = numberbDisable + 1;
          if (!isDisabledExempt) {
            continue;
          }
        }
        if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
          newItem['idle'] = true;
          newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
          IdleNumber = IdleNumber + 1;
        }
        if (res[k].dome == true) {
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
          } else {
            newItem['iconclass'] = 'iconfont icon-zaixian';
          }
        }
        var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
        // if (!res[k].online || res[k].disabled_me) {
        //   AllDevicePartitionNoStreamProfile.push(NoStreamProfileItem);
        //   AllDevicePartitionStreamProfile.push(newItem);
        //   if (srcGroup) {
        //     srcGroup.children.push(newItem);
        //   }
        // } else {
        //   AllDevicePartitionNoStreamProfile.unshift(NoStreamProfileItem);
        //   AllDevicePartitionStreamProfile.unshift(newItem);
        //   if (srcGroup) {
        //     srcGroup.children.unshift(newItem);
        //   }
        // }
        tempStream.push(newItem);
        tempNoStream.push(NoStreamProfileItem);

        tempStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });
        tempNoStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });

        AllDevicePartitionStreamProfile = tempStream;
        AllDevicePartitionNoStreamProfile = tempNoStream;

        if(srcGroup){
          srcGroup.children = tempStream;
        }
        AllDevicePartitionNoStreamProfile.AllLength = result.data.result.length - numberbDisable;
        AllDevicePartitionNoStreamProfile.online = number;
        AllDevicePartitionNoStreamProfile.offline = offlineNumber;
        AllDevicePartitionNoStreamProfile.disable = disableNumber;
        AllDevicePartitionNoStreamProfile.idle = IdleNumber;

        AllDevicePartitionStreamProfile.AllLength = result.data.result.length - numberbDisable;
        AllDevicePartitionStreamProfile.online = number;
        AllDevicePartitionStreamProfile.offline = offlineNumber;
        AllDevicePartitionStreamProfile.disable = disableNumber;
        AllDevicePartitionStreamProfile.idle = IdleNumber;
        for (var i = 0; i < AllDevicePartitionStreamProfile.length; i++) {
          // 主副流
          var node = [{
            token: AllDevicePartitionStreamProfile[i].token,
            streamprofile: 'main',
            label: i18n.tc('CommDev.comm_dev_main_stream'),
            name: AllDevicePartitionStreamProfile[i].label + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
            iconclass: 'mdi mdi-playlist-play fa-fw',
            disabled_me: false,
            DifferentType: 'devChannel',
            uuid: AllDevicePartitionStreamProfile[i].label + 'main' + AllDevicePartitionStreamProfile[i].token,
            CustomUuid: AllDevicePartitionStreamProfile[i].label + 'main' + AllDevicePartitionStreamProfile[i].token,
            setting: AllDevicePartitionStreamProfile[i].setting,
            recording: AllDevicePartitionStreamProfile[i].recording,
          }, {
            token: AllDevicePartitionStreamProfile[i].token,
            streamprofile: 'sub',
            label: i18n.tc('CommDev.comm_dev_sub_stream'),
            name: AllDevicePartitionStreamProfile[i].label + '--' + i18n.tc('CommDev.comm_dev_sub_stream'),
            iconclass: 'mdi mdi-playlist-play fa-fw',
            disabled_me: false,
            DifferentType: 'devChannel',
            uuid: AllDevicePartitionStreamProfile[i].label + 'sub' + AllDevicePartitionStreamProfile[i].token,
            CustomUuid: AllDevicePartitionStreamProfile[i].label + 'sub' + AllDevicePartitionStreamProfile[i].token,
            recording: AllDevicePartitionStreamProfile[i].recording,
          }]
          // AllDevicePartitionStreamProfile[i].children = node;
        }
      }
    }
  }
}
// 获取设备下的所有通道
async function DevPartitionShowDeviceNode(data, isDisabledExempt, srcGroup) {
  var url = root + '/uapi/v1/Device/Channels';
  try {
    const result = await axios.post(url, data);
    if (result.status == 200) {
      if (result.data.msg == 'Success') {
        var res = result.data.result;
        var number = 0;
        var numberbDisable = 0;
        var offlineNumber = 0;
        var disableNumber = 0;
        var IdleNumber = 0;

        var tempChildren = [];
        for (let k = 0; k < res.length; k++) {
          if (res[k].online && res[k].enabled) {
            number = number + 1;
          }
          var newItem = {
            token: res[k].token,
            label: res[k].name,
            name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
            type: res[k].type,
            DifferentType: 'devChannel',
            enabled: res[k].enabled,
            iconclass: 'iconfont icon-shexiangjizaixian',
            devChannel: res[k].devChannel,
            disabled_me: false,
            children: [],
            nodeId: res[k].nodeId,
            online: res[k].online,
            parentToken: res[k].parentToken,
            dome: res[k].dome,
            alias: res[k].alias,
            iconclass1: '',
            icontype: '',
            uuid: res[k].uuid,
            CustomUuid: res[k].uuid,
            setting: res[k].setting,
            recording: res[k].recording,
            metaEnabled: res[k].metaEnabled,
            longitude: res[k].longitude,
            latitude: res[k].latitude,
          };
          if (res[k].online == true) {
            newItem['bOnline'] = true;
          } else if (res[k].online == false) {
            newItem['bOnline'] = false;
          }
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
            offlineNumber = offlineNumber + 1;
          }
          if (res[k].recording == true) {
            if (res[k].dome == true) {
              if (store.state.darkMode) {
                newItem['iconclass2'] = '#icon-baiqiuji';
              } else {
                newItem['iconclass2'] = '#icon-heiqiuji';
              }
            } else {
              if (store.state.darkMode) {
                newItem['iconclass2'] = '#icon-baishexiangji';
              } else {
                newItem['iconclass2'] = '#icon-heishexiangji';
              }
            }
            newItem['recording'] = true;
          } else if (res[k].recording == false) {
            newItem['recording'] = false;
            newItem['iconclass2'] = '';
          }
          if (res[k].enabled == false) {
            newItem['disabled_me'] = true;
            newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera camera';
          }
          if (res[k].enabled == false) {
            if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
              disableNumber = disableNumber + 1;
            }
          }
          if (res[k].enabled == false && store.state.devicemarktoggle == 'false') {
            numberbDisable = numberbDisable + 1;
            if (!isDisabledExempt) {
              continue;
            }
          }
          if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
            newItem['idle'] = true;
            newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
            IdleNumber = IdleNumber + 1;
          }
          if (res[k].dome == true) {
            if (!res[k].online) {
              newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
            } else {
              newItem['iconclass'] = 'iconfont icon-zaixian';
            }
          }
          // if (!res[k].online || res[k].disabled_me) {
          //   if (srcGroup) {
          //     srcGroup.children.push(newItem);
          //   }
          // } else {
          //   if (srcGroup) {
          //     srcGroup.children.unshift(newItem);
          //   }
          // }
          tempChildren.push(newItem);

          tempChildren.sort((a, b) => {
            if (a.online === true && b.online !== true) return -1;
            if (a.online !== true && b.online === true) return 1;
            return 0;
          });

          if(srcGroup){
            srcGroup.children = tempChildren;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching device channels:', error);
  }
}
// 获取级联设备下的通道
function CascadeHierarchy(token, casPartitionToken = token) {
  var url = root + '/uapi/v1/Cascade/List/Hierarchy?token=' + token + '&casPartitionToken=' + casPartitionToken;
  return axios.get(url);
}
function CascadeThen(result, isDisabledExempt) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      let item = result.data.result;
      let srcGroup = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      let srcGroup1 = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      let srcGroup2 = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      if (item.children?.length > 0) {
        srcGroup.children = CascadeChildren(item.children, null, null, isDisabledExempt);
      }
      if (item.chan?.length > 0) {
        CascadeChan(item.chan, srcGroup, null, isDisabledExempt);
      }
      if (item.children?.length > 0) {
        srcGroup1.children = CascadeChildren(item.children, 'NoStreamProfile', null, isDisabledExempt);
      }
      if (item.chan?.length > 0) {
        CascadeChan(item.chan, srcGroup1, 'NoStreamProfile', isDisabledExempt);
      }
      // 只有级联分区，没有设备
      if (item.children?.length > 0) {
        srcGroup2.children = CascadeChildren(item.children, 'NoStreamProfile', 'NoDevice', isDisabledExempt);
      }
      CasDevicePartitionNoDevice.push(srcGroup2)
      CasDevicePartitionStreamProfile.push(srcGroup);
      CasDevicePartitionNoStreamProfile.push(srcGroup1);
    }
  }
}
// 级联下的设备
function CascadeChildren(data, NoStreamProfile, NoDevice, isDisabledExempt, filterText) {
  data = data.map(item => {
    var devChildren = {
      // ...item, // 如果想在原数组添加属性
      parentId: item.parentId,
      casPartitionId: item.casPartitionId,
      label: item.casPartitionName,
      token: item.token,
      rootToken: item.rootToken,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      iconclass: 'iconfont icon-gen',
      DifferentType: 'CasDevChildren',
      disOrder: item.disOrder,
      children: [] // 判断当前是否还有子节点
    }
    if (!NoDevice && item.chan) {
      CascadeChan(item.chan, devChildren, NoStreamProfile, isDisabledExempt);
    }
    if (!filterText) {
      let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid(), };
      devChildren.children.push(res);
    } else {
      if (item.children) {
        devChildren.children = CascadeChildren(item.children, NoStreamProfile, NoDevice, isDisabledExempt, filterText);
      }
    }
    return devChildren;
  })
  data.sort((a, b) => a.disOrder - b.disOrder);
  return data;
}
function CascadeChan(res, data, NoStreamProfile, isDisabledExempt) {
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;

  var tempChildren = [];

  for (let k = 0; k < res.length; k++) {
    var newItem = {
      token: res[k].token,
      label: res[k].name,
      name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
      type: res[k].type,
      DifferentType: 'CasDevChannel',
      enabled: res[k].enabled,
      iconclass: 'iconfont icon-shexiangjizaixian',
      devChannel: res[k].devChannel,
      disabled_me: false,
      children: [],
      nodeId: res[k].nodeId,
      online: res[k].online,
      parentToken: res[k].parentToken,
      dome: res[k].dome,
      alias: res[k].alias,
      iconclass1: '',
      icontype: '',
      uuid: res[k].uuid,
      CustomUuid: res[k].uuid,
      setting: res[k].setting,
      recording: res[k].recording,
      metaEnabled: res[k].metaEnabled,
      longitude: res[k].longitude,
      latitude: res[k].latitude,
    };
    if (res[k].online == true) {
      newItem['bOnline'] = true;
    } else if (res[k].online == false) {
      newItem['bOnline'] = false;
    }
    if (!res[k].online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (res[k].recording == true) {
      if (res[k].dome == true) {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baiqiuji';
        } else {
          newItem['iconclass2'] = '#icon-heiqiuji';
        }
      } else {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baishexiangji';
        } else {
          newItem['iconclass2'] = '#icon-heishexiangji';
        }
      }
      newItem['recording'] = true;
    } else if (res[k].recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (res[k].enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (res[k].enabled == false) {
      if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (res[k].enabled == false && store.state.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      if (!isDisabledExempt) {
        continue;
      }
    }
    if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    if (localStorage.getItem(store.state.user)) {
      let localToken = JSON.parse(localStorage.getItem(store.state.user))['src'];
      for (let i = 0; i < localToken.length; i++) {
        const playtoken = localToken[i]['strToken'];
        if (playtoken == res[k].token && res[k].online == true) {
          newItem['iconclass'] = 'iconfont icon-shexiangjizaixian';
          newItem['iconclass1'] = 'el-tree-camera-play';
          newItem['iconclass3'] = 'none';
          if (res[k].recording) {
            if (res[k].dome == true) {
              newItem['iconclass2'] = '#icon-lvqiuji';
            } else {
              newItem['iconclass2'] = '#icon-lvshexiangji';
            }
          }
        }
      }
    }
    if (res[k].dome == true) {
      if (!res[k].online) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }

    tempChildren.push(newItem);

    // if (!res[k].online || res[k].disabled_me) {
    //   data.children.push(newItem);
    // } else {
    //   data.children.unshift(newItem);
    // }
    tempChildren.sort((a, b) => {
      if (a.online === true && b.online !== true) return -1;
      if (a.online !== true && b.online === true) return 1;
      return 0;
    });

    data.children = tempChildren;

    data.AllLength = res.length - numberbDisable;
    data.online = number;
    data.offline = offlineNumber;
    data.disable = disableNumber;
    data.idle = IdleNumber;
    if (!NoStreamProfile) {
      var node = [{
        token: res[k].token,
        streamprofile: 'main',
        label: i18n.tc('CommDev.comm_dev_main_stream'),
        name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
        iconclass: 'mdi mdi-playlist-play fa-fw',
        disabled_me: false,
        DifferentType: 'CasDevChannel',
        uuid: res[k].name + 'main' + res[k].token,
        CustomUuid: res[k].name + 'main' + res[k].token,
        setting: res[k].setting,
        recording: res[k].recording,
        metaEnabled: res[k].metaEnabled,
      }, {
        token: res[k].token,
        streamprofile: 'sub',
        label: i18n.tc('CommDev.comm_dev_sub_stream'),
        name: res[k].name + '--' + i18n.tc('CommDev.comm_dev_sub_stream'),
        iconclass: 'mdi mdi-playlist-play fa-fw',
        disabled_me: false,
        DifferentType: 'CasDevChannel',
        uuid: res[k].name + 'sub' + res[k].token,
        CustomUuid: res[k].name + 'sub' + res[k].token,
        setting: res[k].setting,
        recording: res[k].recording,
        metaEnabled: res[k].metaEnabled,
      }]
      // newItem.children = node;
    }
  }
}
// 获取门禁设备下的通道
function AccessDevice(token) {
  var url = root + '/uapi/v1/AccessDevice/' + token;
  return axios.get(url);
}
function AccessThen(result) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var srcGroup = { children: [] };
      if (res.accessController.length > 0) {
        srcGroup.children = AccessChildren(res.accessController, res.accessToken);
      }
      AccessDevicePartition.push(srcGroup);
    }
  }
}
function AccessChildren(data, accessToken) {
  data = data.map(item => {
    return {
      // ...item, // 如果想在原数组添加属性
      accessControllerId: item.accessControllerId,
      accessDevId: item.accessDevId,
      module: item.module,
      name: item.name,
      online: item.online,
      sn: item.sn,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      type: item.type,
      accessToken: accessToken,
      iconclass: 'iconfont icon-kongzhiqi',
      DifferentType: 'AccessChildren',
      children: item.Doors ? Doors(item.Doors, accessToken) : [] // 判断当前是否还有子节点
    }
  })
  return data;
}
function Doors(data, accessToken) {
  data = data.map(item => {
    return {
      alarm: item.alarm,
      connect: item.connect,
      controlUUID: item.controlUUID,
      controllerId: item.controllerId,
      id: item.id,
      name: item.name,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      relay: item.relay,
      sensor: item.sensor,
      accessToken: accessToken,
      iconclass: 'iconfont icon-kaimen',
      DifferentType: 'AccessChildrenDoors',
      children: item.Readers ? Readers(item.Readers, accessToken) : [] // 判断当前是否还有子节点
    }
  })
  return data;
}
function Readers(data, accessToken) {
  data = data.map(item => {
    return {
      DoorId: item.DoorId,
      doorUUID: item.doorUUID,
      id: item.id,
      name: item.name,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      readerNo: item.readerNo,
      readerState: item.readerState,
      accessToken: accessToken,
      iconclass: 'iconfont icon-dukaqi',
      DifferentType: 'AccessChildrenReaders',
    }
  })
  return data;
}

// 逻辑分区
function LogicPartition() {
  //url
  var url = root + '/uapi/v1/LogicPartition/List?pageSize=100000';
  return axios.get(url);
}
function LogicPartitionDevice(result) {
  if (result?.status == 200) {
    if (result.data.msg == 'Success') {
      var data = result.data.result;
      if (!data) {
        return;
      }
      for (let i = 0; i < data.length; i++) {
        var tree = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        var tree1 = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children, 'NoDevice'),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        var tree2 = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children, null, 'NoStreamProfile'),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        if (data[i].channel.length > 0) {
          FnChildrenChannel(FnChannel(data[i].channel), tree);
        }
        if (data[i].channel.length > 0) {
          FnChildrenChannel(FnChannel(data[i].channel), tree2, 'NoStreamProfile');
        }
        LogicPartitionDeviceData.push(tree);
        LogicPartitionNoDevice.push(tree1);
        LogicPartitionDeviceDataNoStreamProfile.push(tree2);
      }
      LogicPartitionDeviceData.sort((a, b) => a.disOrder - b.disOrder);
      LogicPartitionNoDevice.sort((a, b) => a.disOrder - b.disOrder);
      LogicPartitionDeviceDataNoStreamProfile.sort((a, b) => a.disOrder - b.disOrder);
    }
  }
}
function FnChildrenDevice(data, NoDevice, NoStreamProfile) {
  data = data.map(item => {
    var newItem = {
      // ...item, // 如果想在原数组添加属性
      parentId: item.parentId,
      id: item.id,
      label: item.logicPartitionName,
      description: item.description,
      iconclass: 'iconfont icon-gen',
      children: [], // 判断当前是否还有子节点
      uuid: item.uuid,
      disOrder: item.disOrder,
      LogicPartitionType: 'LogicPartition',
    }
    if (item.children) {
      if (NoDevice && NoDevice != null) {
        newItem.children = FnChildrenDevice(item.children, NoDevice);
      } else if (NoStreamProfile) {
        newItem.children = FnChildrenDevice(item.children, null, NoStreamProfile)
      } else {
        newItem.children = FnChildrenDevice(item.children)
      }
    }
    // item.children ? (NoDevice ? FnChildrenDevice(item.children, NoDevice) : (NoStreamProfile ? FnChildrenDevice(item.children, '', NoStreamProfile) : FnChildrenDevice(item.children))) : item.children;
    if (!NoDevice && (NoDevice != null || NoDevice == undefined)) {
      if (NoStreamProfile) {
        FnChildrenChannel(FnChannel(item.channel), newItem, NoStreamProfile);
      } else {
        FnChildrenChannel(FnChannel(item.channel), newItem);
      }
    }
    return newItem;
  })
  data.sort((a, b) => a.disOrder - b.disOrder);
  return data;
}
function FnChannel(data) {
  data = data.map(item => {
    return {
      // ...item, // 如果想在原数组添加属性
      devChannel: item.devChannel,
      enabled: item.enabled,
      label: item.name,
      name: item.name,
      online: item.online,
      token: item.token,
      nodeId: item.nodeId,
      type: item.type,
      parentToken: item.parentToken,
      iconclass: 'iconfont icon-shexiangjizaixian',
      children: [],
      disabled_me: false,
      dome: item.dome,
      alias: item.alias,
      chanNo: item.chanNo,
      icontype: '',
      uuid: item.uuid,
      LogicPartitionType: 'LogicPartitionChannel',
      setting: item.setting,
      recording: item.recording,
    }
  })
  return data;
}
// 逻辑分区下的通道
function FnChildrenChannel(data, tree, NoStreamProfile) {
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;

    var tempChildren = [];

  for (let k = 0; k < data.length; k++) {
    let item = data[k];
    if (item.online && item.enabled) {
      number = number + 1;
    }
    let newItem = {
      devChannel: item.devChannel,
      enabled: item.enabled,
      label: item.label,
      online: item.online,
      token: item.token,
      name: item.name + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
      nodeId: item.nodeId,
      type: item.type,
      parentToken: item.parentToken,
      iconclass: 'iconfont icon-shexiangjizaixian',
      children: [],
      disabled_me: false,
      dome: item.dome,
      alias: item.alias,
      chanNo: item.chanNo,
      iconclass1: '',
      icontype: '',
      uuid: item.uuid,
      LogicPartitionType: 'LogicPartitionChannel',
      setting: item.setting,
      recording: item.recording,
    }
    newItem.treeid = uuid();
    if (item.online == true) {
      newItem['bOnline'] = true;
    } else if (item.online == false) {
      newItem['bOnline'] = false;
    }
    if (!item.online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!item.online && item.idle == false && item.enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (item.recording == true) {
      if (item.dome == true) {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baiqiuji';
        } else {
          newItem['iconclass2'] = '#icon-heiqiuji';
        }
      } else {
        if (store.state.darkMode) {
          newItem['iconclass2'] = '#icon-baishexiangji';
        } else {
          newItem['iconclass2'] = '#icon-heishexiangji';
        }
      }
      newItem['recording'] = true;
    } else if (item.recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (item.enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (item.enabled == false) {
      if (store.state.devicemarktoggle == undefined || store.state.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (item.enabled == false && store.state.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      continue;
    }
    if (item.idle == true && item.enabled == true && !item.online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    if (item.dome == true) {
      if (!item.online && item.disabled_me == false) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }
    // if (!item.online || item.disabled_me) {
    //   tree.children.push(newItem);
    // } else {
    //   tree.children.unshift(newItem);
    // }
    tempChildren.push(newItem);
    tempChildren.sort((a, b) => {
      if (a.online === true && b.online !== true) return -1;
      if (a.online !== true && b.online === true) return 1;
      return 0;
    });
    tree.children = tempChildren;
    if (!NoStreamProfile) {
      for (var i = 0; i < tree.children.length; i++) {
        // 主副流
        var node = [{
          token: tree.children[i].token,
          streamprofile: 'main',
          label: i18n.tc('CommDev.comm_dev_main_stream'),
          name: tree.children[i].label + '--' + i18n.tc('CommDev.comm_dev_main_stream'),
          iconclass: 'mdi mdi-playlist-play fa-fw',
          disabled_me: false,
          uuuid: tree.children[i].label + 'main' + tree.children[i].token,
          setting: tree.children[i].setting,
          recording: tree.children[i].recording,
        }, {
          token: tree.children[i].token,
          streamprofile: 'sub',
          label: i18n.tc('CommDev.comm_dev_sub_stream'),
          name: tree.children[i].label + '--' + i18n.tc('CommDev.comm_dev_sub_stream'),
          iconclass: 'mdi mdi-playlist-play fa-fw',
          disabled_me: false,
          uuuid: tree.children[i].label + 'sub' + tree.children[i].token,
          setting: tree.children[i].setting,
          recording: tree.children[i].recording,
        }]
        if (tree.children[i].LogicPartitionType == 'LogicPartitionChannel') {
          // tree.children[i].children = node;
        }
      }
    }
  }
}

// 获取组织列表
function GetGroupList() {
  var url = root + '/uapi/v1/Group/List?pageSize=100000';
  return axios.get(url);
}
function GetGroupListThen(result) {
  if (result?.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var srcGroup = { children: [] };
      for (let i = 0; i < res.length; i++) {
        if (store.state.lang && store.state.lang == 'zhchs') {
          srcGroup.groupName = i18n.tc('CommDev.comm_dev_root');
        } else {
          srcGroup.groupName = res[i].groupName;
        }
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.groupId = res[i].groupId;
        srcGroup.parentId = res[i].parentId;
        srcGroup.description = res[i].description;
        srcGroup.uuid = res[i].uuid;
        srcGroup.roleId = res[i].roleId;
        srcGroup.children = GroupChildren(res[i].children);
        GroupData.push(srcGroup);
      }
    }
  }
}
function GroupChildren(data) {
  data = data.map(item => {
    return {
      parentId: item.parentId,
      groupId: item.groupId,
      groupName: item.groupName,
      description: item.description,
      uuid: item.uuid,
      iconclass: 'iconfont icon-gen',
      roleId: item.roleId,
      children: item.children ? GroupChildren(item.children) : item.children,
    }
  })
  return data;
}
// 获取角色列表
function GetRoleList() {
  var url = root + '/uapi/v1/Role/List?pageSize=100000';
  return axios.get(url);
}
function GetRoleListThen(result) {
  if (result?.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result.list;
      for (let i = 0; i < res.length; i++) {
        var item = res[i];
        store.state.passwordLength = item.passwordLength;
        var data = {
          index: i + 1,
          roleName: item.name,
          roleId: item.roleId,
          description: item.description,
          passwordLength: item.passwordLength,
          userLockTime: item.userLockTime,
          userLockLimit: item.userLockLimit,
          userLockTimeAgain: item.userLockTimeAgain,
          passwordExpiryTime: item.passwordExpiryTime,
          passwordAlertTime: item.passwordAlertTime,
          passwordExpiryChange: item.passwordExpiryChange,
          passwordRule: item.passwordRule,
          passwordFirstChange: item.passwordFirstChange,
          funcGroup: item.funcGroup,
          devPartition: item.devPartition,
        }
        RoleData.push(data);
      }
    }
  }
}
// 获取地图列表
function GetMapList() {
  var url = root + '/uapi/v1/Map/List';
  return axios.get(url);
}
function GetMapListThen(result) {
  if (result?.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      for (let i = 0; i < res.length; i++) {
        var item = res[i];
        var data = {
          index: i + 1,
          center: item.center,
          centerCord: item.centerCord,
          description: item.description,
          devPartitionId: item.devPartitionId,
          extent: item.extent,
          mapElementChannel: item.mapElementChannel,
          mapElementDoor: item.mapElementDoor,
          mapElementLink: item.mapElementLink,
          mapId: item.mapId,
          mapName: item.mapName,
          mapUrl: item.mapUrl,
          mapUrl2: item.mapUrl2,
          mapView: item.mapView,
          maxZoom: item.maxZoom,
          minZoom: item.minZoom,
          onlineTile: item.onlineTile,
          projection: item.projection,
          systemDefaultMap: item.systemDefaultMap,
          tileX: item.tileX,
          tileY: item.tileY,
          type: item.type,
          uuid: item.uuid,
          zoom: item.zoom,
        }
        MapData.push(data);
      }
    }
  }
}
// 获取用户配置
function GetUserConfigItem() {
  var url = root + '/uapi/v1/UserConfig/Item';
  return axios.get(url);
}
function GetUserConfigItemThen(result) {
  if (result.status == 200) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      UserData.push(res);
    }
  }
}
// 获取系统配置
function GetSysConfigItem() {
  var url = root + '/uapi/v1/SysConfig/Item?pageSize=100000&pageIndex=1';
  return axios.get(url);
}
function GetSysConfigItemThen(result) {
  if (result.status === 200 && result.data.msg === "Success") {
    let items = result.data.result.list;
    if (items.length === 0) {
      return;
    }
    for (let item of items) {
      if (item.key === 'PartitionLoadDeviceOnly') {
        store.state.PartitionLoadDeviceOnly = JSON.parse(item.value);
      }
      if (item.key === 'PlaybackShowStorageMode') {
        store.state.PlaybackShowStorageMode = JSON.parse(item.value);
      }
      if (item.key === 'EnablePartitionTreeCacheSearch') {
        store.state.EnablePartitionTreeCacheSearch = JSON.parse(item.value);
      }
      if (item.key === 'EnableDevPartitionLazyLoading') {
        store.state.EnableDevPartitionLazyLoading = JSON.parse(item.value);
      }
      if (item.key === 'EnableDevPartitionShowDeviceNode') {
        store.state.EnableDevPartitionShowDeviceNode = JSON.parse(item.value);
      }
    }
  }
}

async function GetDevPartition(type, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, devPartitionId) {
  try {
    const res = await DevicePartition(type, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, devPartitionId);
    DevicePartitionData = [];
    DevPartitionNoDevice = [];
    CasDevicePartition = [];
    DevCasPartition = [];
    if (EnableDevPartitionLazyLoading) {
      await getdevicePartitionItem(res, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode);
    } else {
      await getdevicePartition(res, EnableDevPartitionShowDeviceNode);
    }
    return { DevicePartitionData, DevPartitionNoDevice, CasDevicePartition, DevCasPartition };
  } catch (err) {
    console.log(err);
  }
}
function GetDevPartitionFilterNode(filterText) {
  return new Promise(resolve => {
    DevPartitionFilterNode(filterText).then((res) => {
      DevicePartitionDataFilterNode = [];
      getdevicePartition(res, true, filterText);
      resolve({ DevicePartitionDataFilterNode });
    });
  })
}
function GetDeviceChannels(token, isDisabledExempt, fromPage, srcGroup) {
  return new Promise(resolve => {
    DeviceChannels(token, isDisabledExempt).then((res) => {
      DevicePartitionStreamProfile = [];
      DevicePartitionNoStreamProfile = [];
      channelThen(res, isDisabledExempt, fromPage, srcGroup);
      resolve({ DevicePartitionStreamProfile, DevicePartitionNoStreamProfile });
    });
  })
}
function GetDeviceChannelsAll(data, isDisabledExempt, srcGroup) {
  return new Promise(resolve => {
    DeviceChannelsAll(data).then((res) => {
      AllDevicePartitionStreamProfile = [];
      AllDevicePartitionNoStreamProfile = [];
      channelThenAll(res, isDisabledExempt, srcGroup);
      resolve({ AllDevicePartitionStreamProfile, AllDevicePartitionNoStreamProfile });
    });
  })
}
function GetCascadeHierarchy(token, casPartitionId, isDisabledExempt) {
  return new Promise(resolve => {
    CascadeHierarchy(token, casPartitionId).then((res) => {
      CasDevicePartitionStreamProfile = [];
      CasDevicePartitionNoStreamProfile = [];
      CasDevicePartitionNoDevice = [];
      CascadeThen(res, isDisabledExempt);
      resolve({ CasDevicePartitionStreamProfile, CasDevicePartitionNoStreamProfile, CasDevicePartitionNoDevice });
    });
  })
}
function GetAccessDevice(token) {
  return new Promise(resolve => {
    AccessDevice(token).then((res) => {
      AccessDevicePartition = [];
      AccessThen(res);
      resolve({ AccessDevicePartition });
    });
  })
}
function GetLogicPartition(data) {
  return new Promise(resolve => {
    LogicPartition(data).then((res) => {
      LogicPartitionDeviceData = [];
      LogicPartitionNoDevice = [];
      LogicPartitionDeviceDataNoStreamProfile = [];
      LogicPartitionDevice(res);
      resolve({ LogicPartitionDeviceData, LogicPartitionNoDevice, LogicPartitionDeviceDataNoStreamProfile });
    });
  })
}
function GetGroup() {
  return new Promise(resolve => {
    GetGroupList().then((res) => {
      GroupData = [];
      GetGroupListThen(res);
      resolve({ GroupData });
    });
  })
}
function GetRole() {
  return new Promise(resolve => {
    GetRoleList().then((res) => {
      RoleData = [];
      GetRoleListThen(res);
      resolve({ RoleData });
    });
  })
}
function GetMap() {
  return new Promise(resolve => {
    GetMapList().then((res) => {
      MapData = [];
      GetMapListThen(res);
      resolve({ MapData });
    });
  })
}
function GetUserConfig() {
  return new Promise(resolve => {
    GetUserConfigItem().then((res) => {
      UserData = [];
      GetUserConfigItemThen(res);
      resolve({ UserData });
    });
  })
}
function GetSysConfig() {
  return new Promise(resolve => {
    GetSysConfigItem().then((res) => {
      GetSysConfigItemThen(res);
      resolve({});
    });
  })
}
export { GetDevPartition, GetDevPartitionFilterNode, GetLogicPartition, GetDeviceChannels, GetDeviceChannelsAll, GetCascadeHierarchy, GetAccessDevice, GetGroup, GetRole, GetMap, GetUserConfig, GetSysConfig }