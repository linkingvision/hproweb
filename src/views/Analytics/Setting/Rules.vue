<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { useUserStore } from '@/store/user';
import { Search } from '@element-plus/icons-vue'
import { GetDevPartitionApi } from '@/api/configuration/device';
import { GetDeviceChannels } from '@/api/channel';
import { GetAnalyticsApi, GetRecordingTemplateApi, GetFaceLibraryApi } from '@/api/Analytics/rules';
import { H5sPlayerWS, H5sPlayerRTC } from '@/assets/js/h5splayer.js';
// import { AiDraw, H5sPlayerWS2 } from '@/assets/js/h5jssdk.js';
import '@/assets/js/h5jssdk.js';
import { H5siOS } from '@/assets/js/h5splayerhelper.js';


interface TreeNode {
  id: string;
  label: string;
  type: 'partition' | 'device' | 'map' | 'view';
  children?: TreeNode[];
  online?: boolean;
  data: any;
  isLeaf?: boolean; // 标记是否为叶子节点
  loaded?: boolean; // 标记是否已加载过子节点
  isDeviceChannel?: boolean; // 标记是否为设备通道（展开设备后的子节点）
}

const { t } = useI18n()
const store = useStore()
const userStore = useUserStore()

const filterText = ref<string>('')
const tableData = ref<any[]>([])
const total = ref<number>(0)

const channelData = ref<any>([])
const originalChannelData = ref<any>([]) // 保存原始数据
const props = {
  value: 'id',
  label: 'label',
  children: 'children'
}
// 添加加载状态和缓存
let isLoading = ref(false);
let deviceCache = new Map(); // 缓存设备通道数据

// 递归过滤树节点
const filterTreeNodes = (nodes: TreeNode[], filterValue: string): TreeNode[] => {
  if (!filterValue) return nodes;
  
  const filtered: TreeNode[] = [];
  
  for (const node of nodes) {
    // 如果是设备通道或占位符节点，不参与过滤匹配，但会被保留（当其父设备匹配时）
    if (node.isDeviceChannel || node.id === 'loading') {
      continue;
    }
    
    // 检查当前节点是否匹配（不区分大小写）
    // 只对 partition、device、map、view 类型的节点进行匹配
    const nodeMatches = node.label.toLowerCase().includes(filterValue.toLowerCase());
    
    // 处理子节点
    let filteredChildren: TreeNode[] = [];
    if (node.children && node.children.length > 0) {
      // 如果当前节点是设备且匹配，保留所有通道子节点
      if (node.type === 'device' && nodeMatches) {
        // 设备匹配时，保留所有子节点（包括通道）
        filteredChildren = [...node.children];
      } else {
        // 递归过滤非通道子节点
        filteredChildren = filterTreeNodes(node.children, filterValue);
        
        // 如果当前节点是设备且有匹配的子节点，也要保留所有通道
        if (node.type === 'device' && filteredChildren.length > 0) {
          const channels = node.children.filter(child => child.isDeviceChannel);
          filteredChildren = [...filteredChildren, ...channels];
        }
      }
    }
    
    // 如果当前节点匹配或有匹配的子节点，则包含此节点
    if (nodeMatches || filteredChildren.length > 0) {
      const newNode = { ...node };
      if (filteredChildren.length > 0) {
        newNode.children = filteredChildren;
      }
      filtered.push(newNode);
    }
  }
  
  return filtered;
};


const getDeviceList = async () => {
  if (isLoading.value) {
    // console.log('正在加载中，跳过重复请求');
    return;
  }
  
  isLoading.value = true;
  try {
    channelData.value = [];
    const res = await GetDevPartitionApi();
    if (res.status == 200 && res.data.code == 0) {
      const result = res.data.result;
      // 使用扁平化函数，按照优先级排序
      const list = flattenRootNodes(result);
      
      originalChannelData.value = list;
      channelData.value = list;
      // console.log('设备树数据加载完成:', channelData.value);
    }
  } finally {
    isLoading.value = false;
  }
}
const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) ||
                       (partition.dev && partition.dev.length > 0) ||
                       (partition.map && partition.map.length > 0) ||
                       (partition.view && partition.view.length > 0);
    
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      data: partition,
      isLeaf: !hasChildren,
      loaded: false
    };
    
    // 只有当有实际的子数据时，才设置children属性
    if (hasChildren) {
      partitionNode.children = [];
      
      // 1. 优先展示children（子分区）
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }
      
      // 2. 其次展示dev设备
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            // 添加占位符子节点来显示展开图标
            children: [{ id: 'loading', label: 'Loading...', type: 'device', data: null, isLeaf: true }],
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. 然后展示map地图 - map是叶子节点，不需要展开图标
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            isLeaf: true, // map是叶子节点
            loaded: true
          });
        });
      }
      
      // 4. 最后展示view视图 - view是叶子节点，不需要展开图标
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            isLeaf: true, // view是叶子节点
            loaded: true
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    // 没有子数据时不设置children属性，这样树组件就不会显示展开图标
    
    result.push(partitionNode);
  });
  return result;
}
// 扁平化根节点，直接展示其内容，按照优先级排序
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. 优先展示children（子分区）
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. 其次展示dev设备
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          // 添加占位符子节点来显示展开图标
          children: [{ id: 'loading', label: 'Loading...', type: 'device', data: null, isLeaf: true }],
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. 然后展示map地图 - map是叶子节点，不需要展开图标
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true, // map是叶子节点
          loaded: true
        });
      });
    }
    
    // 4. 最后展示view视图 - view是叶子节点，不需要展开图标
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          isLeaf: true, // view是叶子节点
          loaded: true
        });
      });
    }
  });
  
  return result;
};
// 获取节点样式类
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // 获取在线状态
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};
// 获取节点图标
const getNodeIcon = (node: TreeNode) => {
  switch (node.type) {
    case 'partition':
      // children节点使用icon-gen
      return 'icon-gen';
    case 'device':
      // 如果是设备通道（叶子节点），使用摄像机图标
      if (node.isLeaf || node.isDeviceChannel) {
        return 'icon-shexiangjizaixian';
      }
      // dev里的设备使用icon-Device
      return 'icon-Device';
    case 'map':
      // map里的使用icon-ditu
      return 'icon-ditu';
    case 'view':
      // view里的使用icon-shipin
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};
// 获取节点颜色
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // 获取在线状态
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
};
// 节点点击事件
const handleNodeClick = (data: TreeNode, node: any) => {
  // console.log('节点被点击:', data, node.data);
  ruleConfigVisible.value = false;
  closeVideo()
  tableData.value = [];
  if (data.isDeviceChannel) {
    const row = {
      index: 1,
      channelName: node.data.name,
      channelToken: node.data.token,
      data: node.data,
      rules: analyticsCount.value[node.data.uuid] ? analyticsCount.value[node.data.uuid].length : 0
    }
    // console.log('节点被点击 =>', row)
    tableData.value.push(row)
    // console.log(tableData.value)
    total.value = tableData.value.length;
  }
};

// 懒加载设备通道
const loadDeviceChannels = async (deviceNode: TreeNode) => {
  if (!deviceNode.data || !deviceNode.data.token) {
    return;
  }

  const cacheKey = deviceNode.data.token;
  
  // 检查缓存
  if (deviceCache.has(cacheKey)) {
    const cachedData = deviceCache.get(cacheKey);
    if (cachedData.length > 0) {
      deviceNode.children = cachedData;
      deviceNode.loaded = true;
      deviceNode.isLeaf = false;
    } else {
      // 没有通道时，移除children并设置为叶子节点
      delete deviceNode.children;
      deviceNode.loaded = true;
      deviceNode.isLeaf = true;
    }
    return;
  }

  try {
    const res = await GetDeviceChannels(deviceNode.data.token);
    if (res.status == 200 && res.data.code == 0 && res.data.result.length > 0) {
      // 将通道数据转换为树节点格式，保持在线状态
      const channels = res.data.result.map((channel: any, index: number) => ({
        id: `channel_${deviceNode.data.devId}_${index}`,
        label: channel.name || `通道 ${index + 1}`,
        name: channel.name || `通道 ${index + 1}`,
        token: channel.token,
        online: channel.online,
        type: 'device', // 通道也是device类型，但通过isDeviceChannel区分
        data: channel,
        isLeaf: true,
        isDeviceChannel: true // 标记为设备通道
      }));
      
      // 缓存数据
      deviceCache.set(cacheKey, channels);
      
      deviceNode.children = channels;
      deviceNode.loaded = true;
      deviceNode.isLeaf = false;
    } else {
      // 缓存空结果
      deviceCache.set(cacheKey, []);
      
      // 设备没有通道时，移除children并设置为叶子节点
      delete deviceNode.children;
      deviceNode.loaded = true;
      deviceNode.isLeaf = true;
    }
  } catch (error) {
    console.error(`加载设备 ${deviceNode.data.devId} 的通道失败:`, error);
    // 出错时移除children并设置为叶子节点
    delete deviceNode.children;
    deviceNode.loaded = true;
    deviceNode.isLeaf = true;
  }
};

// 在原始数据中查找并更新节点
const findAndUpdateNode = (nodes: TreeNode[], targetId: string, updatedNode: TreeNode): boolean => {
  if (!nodes || nodes.length === 0) return false;
  
  for (let i = 0; i < nodes.length; i++) {
    const currentNode = nodes[i];
    if (!currentNode) continue;
    
    if (currentNode.id === targetId) {
      // 更新节点
      nodes[i] = { ...currentNode, ...updatedNode };
      return true;
    }
    
    if (currentNode.children && currentNode.children.length > 0) {
      if (findAndUpdateNode(currentNode.children, targetId, updatedNode)) {
        return true;
      }
    }
  }
  return false;
};

// 节点展开事件
const handleNodeExpand = async (data: TreeNode, node: any) => {
  // 如果是通道节点，不处理展开事件
  if (data.isDeviceChannel) {
    return;
  }
  tableData.value = [];
  // console.log('节点展开:', data, node.data);
  // 如果是设备节点且未加载过子节点，则懒加载通道
  if (data.type === 'device' && !data.loaded) {
    await loadDeviceChannels(data);
    
    // 更新原始数据中的节点
    findAndUpdateNode(originalChannelData.value, data.id, data);
    
    // 手动触发数据更新，避免watch循环
    const currentFilterText = filterText.value.trim();
    if (currentFilterText) {
      channelData.value = filterTreeNodes(originalChannelData.value, currentFilterText);
    } else {
      channelData.value = [...originalChannelData.value];
    }
  }
  if (node.data.children && node.data.children.length > 0) {
    node.data.children.forEach((item: any, index: number) => {
      if (item.type == 'device' && (item.isLeaf || item.isDeviceChannel)) {
        const row = {
          index: index + 1,
          channelName: item.data.name,
          channelToken: item.data.token,
          data: item.data,
          rules: analyticsCount.value[item.data.uuid] ? analyticsCount.value[item.data.uuid].length : 0
        }
        tableData.value.push(row);
        total.value = tableData.value.length;
      }
    })
  }
};

// 节点合并事件
const handleNodeCollapse = (data: TreeNode, node: any) => {
  // 如果是通道节点，不处理合并事件
  if (data.isDeviceChannel) {
    return;
  }
  tableData.value = [];
  // console.log('节点合并:', data, node);
  if (node.data.children && node.data.children.length > 0) {
    node.data.children.forEach((item: any, index: number) => {
      if (item.type == 'device' && (item.isLeaf || item.isDeviceChannel)) {
        const row = {
          index: index + 1,
          channelName: item.data.name,
          channelToken: item.data.token,
          data: item.data,
          rules: analyticsCount.value[item.data.uuid] ? analyticsCount.value[item.data.uuid].length : 0
        }
        tableData.value.push(row);
        total.value = tableData.value.length;
      }
    })
  }
};

// const ruleSearch = ref<string>('')
const rulesTableData = ref<any[]>([])
const rulesTotal = ref<number>(0)
const pageIndex = ref<number>(1)
const pageSize = ref<number>(5)
let confCount = 0
const analyticsCount = ref<any>({})

const GetAnalytics = async (channelUUID?: string, bEnable?: boolean) => {
  rulesTableData.value = [];
  rulesTotal.value = 0;
  confCount = 0;
  const res = await GetAnalyticsApi()
  if (res.status == 200 && res.data.code == 0) {
    const list = res.data.result;
    for (let i = 0; i < list.length; i++) {
      if (list[i].channelUUID == channelUUID) {
        rulesTableData.value.push(list[i]);
        rulesTotal.value = rulesTableData.value.length
      }
      if (list[i].setting.ruleType == "USC_ANA_RULE_CONF" && channelUUID == list[i].channelUUID) {
        confCount += 1;
        if (bEnable) {
          goClick(list[i]);
        }
      }
      if (analyticsCount.value[list[i].channelUUID]) {
        if (list[i].setting.ruleType == "USC_ANA_RULE_CONF") {
          continue
        }
        analyticsCount.value[list[i].channelUUID].push(list[i].id)
      } else {
        if (list[i].setting.ruleType == "USC_ANA_RULE_CONF") {
          continue
        }
        let data = [list[i].id]
        analyticsCount.value[list[i].channelUUID] = data
      }
    }
  }
}

// 点击表格列表
const goClick = (row: any, column?: any) => {}



// 获取录像计划
const GetRecordingTemplate = async () => {
  const res = await GetRecordingTemplateApi();
  if (res.status == 200 && res.data.code == 0) {
    // console.log('Recording Template =>', res)
    const result = res.data.result;
    for (const item of result) {
      const newItem = {
        name: scheduleName[item.recordingTemplateName] ?? item.recordingTemplateName,
        uuid: item.uuid,
      };

      scheduleArr.value.push(newItem);

      if (item.recordingTemplateName === "Object recording") {
        ruleForm.value.schedule = item.uuid;
      }
    }
  }
}
// 获取人脸库
const GetFaceLibrary = async () => {
  const res = await GetFaceLibraryApi();
  if (res.status == 200 && res.data.code == 0) {
    faceLibraryList.value = res.data.result;
    if (res.data.result.length > 0) {
      ruleForm.value.faceLibraryId = res.data.result[0].faceLibraryId
    }
  }
}

// 
const objSizeStart = ref<boolean>(false);
const h5handler = ref<any>(null)
const channelUUID = ref<string>('')
const playVideo = async (data: any) => {
  closeVideo();
  // ruleForm.value.stream = data.streamprofile || '';
  const conf: any = {
    videoid: "h5videoRule",
    protocol: window.location.protocol, //http: or https:
    host: userStore.WSROOT,
    streamprofile: ruleForm.value.stream || 'main',
    rootpath: '/', // '/'
    token: data.token,
    hlsver: 'v1', //v1 is for ts, v2 is for fmp4
    rtcengine: localStorage.getItem('H5sRtcengine') || 'v1',
    session: userStore.session,
    consolelog: 'true'
  }
  await nextTick()
  if (store.liveviewrtc === 'RTC' || (H5siOS() === true)) {
    console.log('RTC-------------------')
    h5handler.value = new H5sPlayerRTC(conf)
  } else if (store.liveviewrtc === 'WS') {
    // console.log('WS--------------', H5sPlayerWS)
    h5handler.value = new H5sPlayerWS(conf)
  } else if (store.liveviewrtc === 'WS2') {
    console.log('WS2---------------')
    conf.buffersize = store.RBufferTime; //jitter buffer, unit is ms, only for ws2, default is 300.
    conf.h264cpumode = store.H264CpuDecode; //if h264cpumode is true, h264 will force use cpu. only for ws2, default is false
    h5handler.value = new (window as any).H5sPlayerWS2(conf);
  }
  objSizeStart.value = true;
  channelUUID.value = data.uuid;
  h5handler.value.connect();
}
const closeVideo = () => {
  if (h5handler.value) {
    h5handler.value.disconnect();
    delete h5handler.value;
    h5handler.value = null;
    channelUUID.value = ''
  }
}

const ruleConfigVisible = ref<boolean>(false);
const channelName = ref<string>('');
const currentChannel = ref<any>({})

const ruleConfigBread = (row: any) => {
  ruleConfigVisible.value = true;
  console.log('ruleConfigBread row =>', row);
  channelName.value = row.data.name;
  currentChannel.value = row.data
  GetAnalytics(row.data.uuid)
  playVideo(row.data);
}
const quitConfig = () => {
  ruleConfigVisible.value = false;
  closeVideo();
  channelName.value = '';
  channelUUID.value = '';
}

const startDraw = ref<boolean>(false)
const ruleForm = ref<any>({
  name: 'Rule1',
  ruleType: 'USC_ANA_RULE_CONF',
  time: 60, // 停留时间
  objectSize: 30, // 检测最小对象大小
  fps: 0.5, // 帧率
  schedule: '', // 计划
  stream: 'main', // 码流
  priorityLevel: 'Medium',  // 级别
  faceLibraryId: '',  // 人脸库
  faceSimilarityThreshold: 60,  // 人脸 相似阈值
  faceMinimumSize: 40,  // 人脸 最小尺寸
  lprConfidenceThreshold: 60, // 车牌 相似阈值
  detType: 'person',  // 人员聚集 检测目标类型
  threshold: 2, // 人员聚集 报警人数
  triggerInterval: 10,  // 人员聚集 报警间隔时间
  lprWidthMin: 60,  // 车牌最小宽度
  lprHeightMin: 20, // 车牌最小高度
  lprWidthMax: 180, // 车牌最大宽度
  lprHeightMax: 60, // 车牌最大高度
})
const RuleTypeData = [
  { label: '常规配置', value: 'USC_ANA_RULE_CONF', icon: 'icon-changguipeizhi' },
  { label: '安全帽检测', value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat' },
  { label: '区域入侵', value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin' },
  { label: '跌倒检测', value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance' },
  { label: '绊线检测', value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance' },
  // { label: "车牌识别", value: '1', icon: 'icon-chepaishibie' },
  { label: '人员逗留', value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu' },
  // { label: "人脸识别", value: '2', icon: 'icon-face' },
  { label: '违法停车', value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche' },
  // { label: "工服检测", value: '3', icon: 'icon-gongfujiance' },
  { label: '车辆计数', value: 'USC_ANA_RULE_VECT', icon: 'icon-cheliangjishu' },
  // { label: "火焰&烟雾", value: '4', icon: 'icon-huoyanyanwu' },
  { label: '人员计数', value: 'USC_ANA_RULE_PECT', icon: 'icon-renyuanjishu' },
  { label: '人脸识别', value: 'USC_ANA_RULE_FARE', icon: 'icon-renlianshibie1' },
  { label: '车牌识别', value: 'USC_ANA_RULE_LPRE', icon: 'icon-chepaishibie' },
  { label: '人员聚集', value: 'USC_ANA_RULE_CROD', icon: 'icon-renyuanjishu' },
]
const fpsOptions = [{
  value: 0.5,
  label: '2秒1次'
}, {
  value: 0.2,
  label: '5秒1次'
}, {
  value: 0.1,
  label: '10秒1次'
}, {
  value: 0.033,
  label: '30秒一次'
}, {
  value: 0.017,
  label: '60秒1次'
}, {
  value: 0.008,
  label: '120秒一次'
}]
const scheduleName: Record<string, string> = {
  "Recording always": "持续录像",
  "Motion recording": "移动侦测录像",
  "Object recording": "物体侦测录像",
  "Motion & Object recording": "移动&物体侦测录像",
  "Not recording": "不录像",
}
const faceLibraryList = ref<any[]>([])
const scheduleArr = ref<any[]>([])
const ruleTypeLabel = ref<string>('常规配置')
const checkboxgroupShow = ref<boolean>(false);
const checkList = ref<any[]>([]);
const direction = ref<string>('AB');



// 检查类型 选择面板 显示/隐藏
const popoverVisible = ref<boolean>(false);
const handleVisibleChange = (visible: boolean) => {
  if (visible) popoverVisible.value = visible;
}
const selectRuleType = (item: any) => {
  if (!item) {
    popoverVisible.value = false;
    return
  }
  handleChange(item.value);
  ruleForm.value.ruleType = item.value;
  ruleTypeLabel.value = item.label;
  popoverVisible.value = false;
}
const handleChange = (value: string) => {
  startDraw.value = false;
  checkboxgroupShow.value = true;
  switch (value) {
    case "USC_ANA_RULE_LOIT":
    case "USC_ANA_RULE_PECT":
    case "USC_ANA_RULE_CONF":
    case "USC_ANA_RULE_PPE":
    case "USC_ANA_RULE_FARE":
    case "USC_ANA_RULE_LPRE":
    case "USC_ANA_RULE_PEFA":
      checkboxgroupShow.value = false;
      break;
    case "USC_ANA_RULE_VECT":
    case "USC_ANA_RULE_STVE":
      checkList.value = ["vehicle", "motorcycle", "bicycle"]
      break;
    case "USC_ANA_RULE_CROD":
      checkboxgroupShow.value = false
      break;
    default:
      break;
  }
  // console.log('checkboxgroupShow =>', checkboxgroupShow.value)
}

// 人脸识别-最小尺寸变化
const updateFareSize = () => {}
// 监听过滤文本变化
watch(filterText, () => {
  if (filterText.value.trim()) {
    channelData.value = filterTreeNodes(originalChannelData.value, filterText.value.trim());
  } else {
    channelData.value = [...originalChannelData.value];
  }
}, { immediate: true });

onMounted(() => {
  GetAnalytics()
  getDeviceList()
  GetRecordingTemplate()
  GetFaceLibrary()
  const div = document.getElementById('h5videoRule');
  const canvas = document.getElementById('h5vcanvasRule') as HTMLCanvasElement | null;
  if (!div || !canvas) return;
  // 获取div的宽高
  var divWidth = div?.offsetWidth;
  var divHeight = div?.offsetHeight;

  // 将div的宽高赋值给canvas
  canvas.width = divWidth;
  canvas.height = divHeight;
})

onBeforeUnmount(() => {
  closeVideo()
})

const activeNames = ['1']
</script>

<template>
  <div class="rule-config">
    <!-- 左侧数据栏 -->
    <div class="rules_left">
      <el-collapse v-model="activeNames">
        <el-collapse-item name="1" id="headswitch">
          <template #title>
            <div style="display: flex;justify-content: space-between;width: 85%;align-items: center;">
              <div>{{ t('Common.comm_root') }}</div>
              <div class="rules_colltitle">
                <!-- <div class="rules_titleicon1" @click.stop="Refresh"></div> -->
              </div>
            </div>
          </template>
          <el-input v-model="filterText" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
          <el-tree-v2
            ref="treeRef"
            style="max-width: 100%;"
            :data="channelData"
            :props="props"
            node-key="id"
            :height="770"
            @node-click="handleNodeClick"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
          >
            <template #default="{ node, data }">
              <div
                v-if="data.id !== 'loading'"
                style="display: flex; align-items: center;"
                :class="getNodeClass(data)">
                <i :class="`iconfont ${getNodeIcon(data)}`" 
                   :style="{
                     opacity: getNodeColor(data),
                     marginRight: '8px',
                     fontSize: data.type === 'device' && data.isLeaf ? '16px' : '16px'
                   }"></i>
                <span :style="{opacity: getNodeColor(data)}">{{ node.label }}</span>
              </div>
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
    </div>
    <!-- 右侧表格 -->
    <div v-if="!ruleConfigVisible" class="table_right rule-right">
      <el-table :data="tableData" stripe height="100%" style="width: 100%;">
        <el-table-column prop="index" :label="t('CommTableEdit.comm_table_serial_number')" width="160" align="center"></el-table-column>
        <el-table-column prop="channelName" :label="t('Common.comm_channel_name')" align="center"></el-table-column>
        <el-table-column prop="channelToken" :label="t('CommTableEdit.comm_table_token')" width="500" align="center"></el-table-column>
        <el-table-column prop="rules" :label="t('Analytics.ana_rules')" align="center"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_operational')">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="ruleConfigBread(row)">{{ t('Router.router_configuration') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else class="conf_right rule-right">
      <div class="conf-top">
        <div class="conf-img">
          <div class="header">
            <div class="back">
              <span class="quit" @click="quitConfig">规则配置</span>
              >
              <span>配置{{ channelName }}</span>
            </div>
            <div class="opeartion">
              <el-button v-if="!startDraw" size="small"><i class="iconfont icon-bianji"></i></el-button>
              <el-button v-else size="small"><i class="iconfont icon-duihao1"></i></el-button>
              <el-button size="small" type="primary"><i class="iconfont icon-huifu"></i></el-button>
            </div>
          </div>
          <div class="analytics_rule_right_video">
            <video class="h5video" id="h5videoRule" autoplay webkit-playsinline playsinline></video>
            <canvas class="h5vcanvas" id="h5vcanvasRule"></canvas>
            <div v-show="objSizeStart && ruleForm.ruleType == 'USC_ANA_RULE_CONF'" class="objSize"></div>
            <div v-show="objSizeStart && ruleForm.ruleType == 'USC_ANA_RULE_FARE'" class="fareSize"></div>
            <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" class="lprMinSize"></div>
            <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" class="lprMaxSize"></div>
          </div>
        </div>
        <div class="conf-form">
          <div class="header"></div>
          <el-form :model="ruleForm" label-position="left" label-width="100px" style="padding: 10px 20px;">
            <el-form-item label="名称">
              <el-input v-model="ruleForm.name" style="width: 210px;"></el-input>
            </el-form-item>
            <el-form-item label="检查类型">
              <el-select v-model="ruleTypeLabel" @visible-change="handleVisibleChange" popper-class="ruleTypeSelect"
                style="width: 210px;"></el-select>
            </el-form-item>
            <el-form-item label="对象" v-show="checkboxgroupShow">
              <el-checkbox-group class="checkboxgroup" v-model="checkList">
                <el-checkbox label="person"
                  :disabled="ruleForm.ruleType == 'USC_ANA_RULE_STVE' || ruleForm.ruleType == 'USC_ANA_RULE_VECT' || ruleForm.ruleType == 'USC_ANA_RULE_FARE' || ruleForm.ruleType == 'USC_ANA_RULE_LPRE'">
                  <i class="iconfont icon-person" style="font-size: 24px;"></i>
                </el-checkbox>
                <el-checkbox label="vehicle"
                    :disabled="ruleForm.ruleType == 'USC_ANA_RULE_LOIT' || ruleForm.ruleType == 'USC_ANA_RULE_PECT'">
                    <i class="iconfont icon-car" style="font-size: 24px;"></i></el-checkbox>
                  <el-checkbox label="motorcycle"
                    :disabled="ruleForm.ruleType == 'USC_ANA_RULE_LOIT' || ruleForm.ruleType == 'USC_ANA_RULE_PECT'">
                    <i class="iconfont icon-motorcycle" style="font-size: 24px;"></i></el-checkbox>
                  <el-checkbox label="bicycle"
                    :disabled="ruleForm.ruleType == 'USC_ANA_RULE_LOIT' || ruleForm.ruleType == 'USC_ANA_RULE_PECT'">
                    <i class="iconfont icon-bicycle" style="font-size: 24px;"></i></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="停留时间" v-show="ruleForm.ruleType == 'USC_ANA_RULE_LOIT' || ruleForm.ruleType == 'USC_ANA_RULE_STVE'">
              <el-input v-model="ruleForm.time" style="width: 210px;"></el-input>
            </el-form-item>
            <el-form-item label="方向" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CRAL'">
              <el-radio-group v-model="direction" v-show="store.darkMode">
                <el-radio label="BA"><img src="../imgs/blackA.svg" width="25"></el-radio>
                <el-radio label="AB"><img src="../imgs/blackB.svg" width="25"></el-radio>
                <el-radio label="BOTH"><img src="../imgs/blackAB.svg" width="25"></el-radio>
              </el-radio-group>
              <el-radio-group v-model="direction" v-show="!store.darkMode">
                <el-radio label="BA"><img src="../imgs/whiteA.svg" width="25"></el-radio>
                <el-radio label="AB"><img src="../imgs/whiteB.svg" width="25"></el-radio>
                <el-radio label="BOTH"><img src="../imgs/whiteAB.svg" width="25"></el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="帧率" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.fps" style="width: 210px;" filterable>
                <el-option v-for="item in fpsOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="计划" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.schedule" style="width: 210px;">
                <el-option v-for="(item, index) in scheduleArr" :key="index" :label="item.name" :value="item.uuid"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="'码流'" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.stream" style="width: 210px;">
                <el-option :label="'主码流'" value="main"></el-option>
                <el-option :label="'辅码流'" value="sub"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="'级别'" v-show="ruleForm.ruleType != 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.priorityLevel" style="width: 210px;">
                <el-option label="Critical" value="Critical"></el-option>
                <el-option label="High" value="High"></el-option>
                <el-option label="Medium" value="Medium"></el-option>
                <el-option label="Low" value="Low"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="'人脸库'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-select v-model="ruleForm.faceLibraryId" style="width: 210px;">
                <el-option v-for="(item, i) in faceLibraryList" :key="i" :label="item.faceLibraryName"
                  :value="item.faceLibraryId"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="'相似阈值'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-input v-model="ruleForm.faceSimilarityThreshold" style="width: 210px;"
                placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="'最小尺寸'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-input v-model="ruleForm.faceMinimumSize" style="width: 210px;"
                @change="updateFareSize"></el-input>
            </el-form-item>
            <el-form-item :label="'相似阈值'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'">
              <el-input v-model="ruleForm.lprConfidenceThreshold" style="width: 210px;"
                placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="'检测目标类型'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-select v-model="ruleForm.detType" style="width: 210px;">
                <el-option label="head" value="head"></el-option>
                <el-option label="person" value="person"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="'报警人数'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-input v-model="ruleForm.threshold" style="width: 210px;" placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="'报警时间间隔'"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-input v-model="ruleForm.triggerInterval" style="width: 210px;"></el-input>
            </el-form-item>
          </el-form>
          <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" style="padding: 0 20px;">
            车牌最小尺寸&nbsp; 
            <span class="iconfont icon-xiaotishi" style="font-size: 12px;color: #F70502;"></span>
            <el-form class="el_form" v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" label-position="right"
              label-width="70px" :model="ruleForm"
              style="display: flex; flex-direction: row;justify-content: space-between;width: 81%;padding-left:30px;">
              <el-form-item>
                <el-input v-model="ruleForm.lprWidthMin" style="width: 80px;">
                  <template #suffix>
                    <span>W</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="ruleForm.lprHeightMin" style="width: 65px;">
                  <template #suffix>
                    <span>H</span>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
          <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" style="padding: 0 20px;">
            车牌最大尺寸&nbsp; 
            <span class="iconfont icon-xiaotishi" style="font-size: 12px;color: #F3F300;"></span>
            <el-form class="el_form" v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" label-position="right"
              label-width="70px" :model="ruleForm"
              style="display: flex; flex-direction: row;justify-content: space-between;width: 81%;padding-left:30px;">
              <el-form-item>
                <el-input v-model="ruleForm.lprWidthMax" style="width: 80px;">
                  <span slot="suffix">W</span>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="ruleForm.lprHeightMax" style="width: 65px;">
                  <span slot="suffix">H</span>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
          <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'" style="margin: 0 20px;">
            <div>检测最小对象大小</div>
            <br>
            <el-slider v-model="ruleForm.objectSize" show-input></el-slider>
            <!-- <el-input style="width: 80px;" v-model="formLabelAlign.objectSize"></el-input> -->
          </div>
          <div style="width: 100%; padding: 20px; display: flex; justify-content: space-between;">
            <el-button v-if="ruleForm.ruleType == 'USC_ANA_RULE_CONF'" class="iconfont icon-fuzhi" style="width: 60px; height: 28px;"></el-button>
            <el-button v-else  style="border:0px;background-color: transparent;"></el-button>
            <el-button class="form_butt" type="primary" :disabled="startDraw" style="width: 60px; height: 28px;">确定</el-button>
          </div>
        </div>
      </div>
      <div class="conf-table">
        <el-table 
          :data="rulesTableData.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)"
          height="260"
        >
          <el-table-column prop="name" label="名称" width="120" align="center"></el-table-column>
          <el-table-column prop="uuid" label="UUID" width="300" align="center"></el-table-column>
          <el-table-column prop="setting.ruleType" label="检查类型" width=200 align="center"></el-table-column>
          <el-table-column label="对象" align="center"></el-table-column>
          <el-table-column label="开启" width="120" align="center">
            <template #default="{ row }">
            <div>
              <el-switch v-model="row.enabled" disabled></el-switch>
            </div>
          </template>
          </el-table-column>
          <el-table-column label="方向" width="160" align="center">
            <template #default="{ row }">
              <div v-if="row.setting.ruleType == 'USC_ANA_RULE_CRAL'">
                <span>{{ row.setting.Rule.Cral.direction }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="保留时间" width="120" align="center">
            <template #default="{ row }">
              <div v-if="row.setting.ruleType == 'USC_ANA_RULE_LOIT'">
                <span>{{ row.setting.Rule.Loit.dwellTime }}</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_STVE'">
                <span>{{ row.setting.Rule.Stve.dwellTime }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="text" >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="Pagination">
        <el-pagination
          v-model:current-page="pageIndex"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="rulesTotal"
        ></el-pagination>
      </div>
      <div v-if="popoverVisible && ruleConfigVisible" class="popoverRuleType">
        <div class="ruleTypeHeader">
          <span>检查类型</span>
          <i class="iconfont icon-guanbixiaoanniu" style="cursor: pointer; font-size: 20px;" @click="selectRuleType(false)"></i>
        </div>
        <div class="ruleTypeContainer">
          <div class="ruleTypeItem" :class="{'active': ruleForm.ruleType === item.value}"
            v-for="(item, index) in RuleTypeData" :key="index" :data-value="item.value" @click="selectRuleType(item)">
            <i class="iconfont" :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.Pagination {
  background-color: transparent !important;
}
.conf_right {
  .conf-table {
    width: 100%;
    :deep(.el-table__inner-wrapper) {
      .el-table__body-wrapper {
        background-color: transparent !important;
      }
      .el-table__row {
        background-color: transparent;
      }
    }
  }
}
.conf-top {
  width: 100%;
  height: 65%;
  background-color: #232323;
  display: flex;
  .conf-img {
    width: 70%;
    height: 100%;
    .analytics_rule_right_video {
      width: 100%;
      height: calc(100% - 48px);
      // background-color: #212121;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      .lprMinSize {
        position: absolute;
        width: 40px;
        height: 20px;
        border: 2px solid #F70502;
      }

      .lprMaxSize {
        position: absolute;
        border: 1px solid #F3F300;
      }
      .h5vcanvas {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 100
      }
      .objSize {
        width: 30px;
        height: 30px;
        position: absolute;
        bottom: 100px;
        right: 100px;
        border: 2px solid red;
      }

      .fareSize {
        width: 30px;
        height: 30px;
        position: absolute;
        bottom: 100px;
        right: 100px;
        border: 2px solid red;
      }
    }
  }
  .conf-form {
    flex: 1;
    height: 100%;
    .el-form {
      padding: 10px;
    }
  }
  .header {
    width: 100%;
    height: 48px;
    background-color: #2D2D2D;
    // line-height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
      margin: 0 5px;
    }
    .quit {
      color: #0399FE;
      cursor: pointer;
    }
    .opeartion {
      .el-button {
        width: 60px;
        height: 28px;
        i {
          font-size: 18px;
        }
      }
    }
  }
}
.popoverRuleType {
  position: absolute;
  left: 35%;
  top: 18%;
  width: 500px;
  height: 384px;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  z-index: 101;
  background-color: #333;
  .ruleTypeHeader {
    width: 100%;
    height: 34px;
    border-radius: 2px 2px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    background-color: #454545;
  }
  .ruleTypeContainer {
    flex: 1;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px 34px 34px 34px;
    .ruleTypeItem {
      width: 200px;
      height: 32px;
      border-radius: 4px;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      background-color: #454545;
      i {
        margin-right: 10px;
      }
    }
    .ruleTypeItem.active {
      background-color: #0399FE;
      color: #fff;
    }
  }
}
.rule-config {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  position: relative;
  .rules_left {
    width: 16%;
    height: 100%;
    background-color: #232323;
    :deep(.el-collapse-item__title) {
      padding-left: 10px;
      color: #fff;
    }
    :deep(.el-collapse-item__wrap) {
      padding: 10px;
      background-color: transparent;
    }
    :deep(.el-collapse) {
      border: 0;
      .el-collapse-item__header {
        background-color: #303030;
        border: 0;
        color: #fff;
        height: 48px;
      }
      .el-collapse-item__wrap {
        background-color: transparent;
        border: 0;
      }
      .el-tree {
        background-color: transparent;
        .el-tree-node:focus>.el-tree-node__content {
          background-color: transparent;
        }
        .el-tree-node__content:hover {
          background-color: rgba($color: #fff, $alpha: 0.2);
        }
      }
    }
    :deep(.el-input) {
      margin-bottom: 10px;
      .el-input__wrapper {
        background-color: #1a1a1a;
        border: 1px solid #404040;
        .el-input__inner {
          color: #fff;
        }
      }
    }
  }
  .rule-right {
    flex: 1;
    height: 100%;
    position: relative;
    :deep(.el-table__header) {
      height: 100%;
      tr, th {
        height: 48px;
      }
    }
  }
}

// 设备树节点样式
.tree-node {
  cursor: pointer;
  &.device-online {
    color: #fff;
  }
  &.device-offline {
    color: rgba(255, 255, 255, 0.6);
  }
}
:deep(.el-form) {
  .el-checkbox .el-checkbox__input {
    display: none !important;
  }
  .el-radio .el-radio__input {
    display: none !important;
  }
}
</style>

<style lang="scss">
  // 隐藏规则配置的检查类型样式
.ruleTypeSelect {
  display: none !important;
}
</style>