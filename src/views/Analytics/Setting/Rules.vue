<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import $ from 'jquery'
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { useUserStore } from '@/store/user';
import { Search } from '@element-plus/icons-vue'
import { GetDevPartitionApi } from '@/api/configuration/device';
import { GetDeviceChannels } from '@/api/channel';
import { GetAnalyticsApi, GetRecordingTemplateApi, GetFaceLibraryApi, SetAnalyticsApi, UpdateAnalyticsApi, DeleteAnalyticsApi } from '@/api/Analytics/rules';
import { H5sPlayerWS, H5sPlayerRTC } from '@/assets/js/h5splayer.js';
import '@/assets/js/h5jssdk.js';
import { H5siOS } from '@/assets/js/h5splayerhelper.js';
import { ElMessage } from 'element-plus';
import { GetClassifierListApi } from '@/api/Analytics/setting';


interface TreeNode {
  id: string;
  label: string;
  type: 'partition' | 'device' | 'map' | 'view';
  children?: TreeNode[];
  online?: boolean;
  data: any;
  isLeaf?: boolean; // flag: is leaf node
  loaded?: boolean; // flag: children already loaded
  isDeviceChannel?: boolean; // flag: is device channel (child of expanded device)
}

const { t } = useI18n()
const store = useStore()
const userStore = useUserStore()
const { AiDraw, H5sPlayerWS2 } = (window as any).h5jssdk;

const filterText = ref<string>('')
const tableData = ref<any[]>([])
const total = ref<number>(0)

const channelData = ref<any>([])
const originalChannelData = ref<any>([]) // store original data
const props = {
  value: 'id',
  label: 'label',
  children: 'children'
}
// Loading state and cache
let isLoading = ref(false);
let deviceCache = new Map(); // cache device channel data

// Recursively filter tree nodes
const filterTreeNodes = (nodes: TreeNode[], filterValue: string): TreeNode[] => {
  if (!filterValue) return nodes;
  
  const filtered: TreeNode[] = [];
  
  for (const node of nodes) {
    if (node.isDeviceChannel || node.id === 'loading') {
      continue;
    }
    
    // Check if current node matches (case-insensitive)
    // Only match partition, device, map and view nodes
    const nodeMatches = node.label.toLowerCase().includes(filterValue.toLowerCase());
    
    // Process child nodes
    let filteredChildren: TreeNode[] = [];
    if (node.children && node.children.length > 0) {
      // Matched device node: keep all channel children
      if (node.type === 'device' && nodeMatches) {
        // Device matches: keep all children including channels
        filteredChildren = [...node.children];
      } else {
        // Recursively filter non-channel children
        filteredChildren = filterTreeNodes(node.children, filterValue);
        
        // Device with matching children: keep all channels
        if (node.type === 'device' && filteredChildren.length > 0) {
          const channels = node.children.filter(child => child.isDeviceChannel);
          filteredChildren = [...filteredChildren, ...channels];
        }
      }
    }
    
    // Include node if it or any descendant matches
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
    return;
  }
  
  isLoading.value = true;
  try {
    channelData.value = [];
    const res = await GetDevPartitionApi();
    if (res.status == 200 && res.data.code == 0) {
      const result = res.data.result;
      // Flatten helper, sorted by priority
      const list = flattenRootNodes(result);
      
      originalChannelData.value = list;
      channelData.value = list;
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
    
    // Only set children when sub-data exists
    if (hasChildren) {
      partitionNode.children = [];
      
      // 1. Sub-partitions first
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }
      
      // 2. Devices second
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            // Add placeholder child to show expand icon
            children: [{ id: 'loading', label: 'Loading...', type: 'device', data: null, isLeaf: true }],
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. Maps — leaf nodes, no expand icon
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            isLeaf: true, // map is a leaf node
            loaded: true
          });
        });
      }
      
      // 4. Views — leaf nodes, no expand icon
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            isLeaf: true, // view is a leaf node
            loaded: true
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    // No children set when empty — hides tree expand icon
    
    result.push(partitionNode);
  });
  return result;
}
// Flatten root node, display contents sorted by priority
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. Sub-partitions first
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. Devices second
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          // Add placeholder child to show expand icon
          children: [{ id: 'loading', label: 'Loading...', type: 'device', data: null, isLeaf: true }],
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. Maps — leaf nodes, no expand icon
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true, // map is a leaf node
          loaded: true
        });
      });
    }
    
    // 4. Views — leaf nodes, no expand icon
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          isLeaf: true, // view is a leaf node
          loaded: true
        });
      });
    }
  });
  
  return result;
};
// Get node CSS class
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // Get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};
// Get node icon
const getNodeIcon = (node: TreeNode) => {
  switch (node.type) {
    case 'partition':
      // Sub-partition nodes use icon-gen
      return 'icon-gen';
    case 'device':
      // Channel leaf nodes use camera icon
      if (node.isLeaf || node.isDeviceChannel) {
        return 'icon-shexiangjizaixian';
      }
      // Devices in dev use icon-Device
      return 'icon-Device';
    case 'map':
      // Map nodes use icon-ditu
      return 'icon-ditu';
    case 'view':
      // View nodes use icon-shipin
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};
// Get node colour
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // Get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
};
// Node click handler
const handleNodeClick = (data: TreeNode, node: any) => {
  quitConfig()
  tableData.value = [];
  if (data.isDeviceChannel) {
    const row = {
      index: 1,
      channelName: node.data.name,
      channelToken: node.data.token,
      data: node.data.data,
      rules: analyticsCount.value[node.data.data.uuid] ? analyticsCount.value[node.data.data.uuid].length : 0
    }
    tableData.value.push(row)
    // console.log(tableData.value)
    total.value = tableData.value.length;
  }
};

// Lazy-load device channels
const loadDeviceChannels = async (deviceNode: TreeNode) => {
  if (!deviceNode.data || !deviceNode.data.token) {
    return;
  }

  const cacheKey = deviceNode.data.token;
  
  // Check cache
  if (deviceCache.has(cacheKey)) {
    const cachedData = deviceCache.get(cacheKey);
    if (cachedData.length > 0) {
      deviceNode.children = cachedData;
      deviceNode.loaded = true;
      deviceNode.isLeaf = false;
    } else {
      // No channels — remove children and mark as leaf
      delete deviceNode.children;
      deviceNode.loaded = true;
      deviceNode.isLeaf = true;
    }
    return;
  }

  try {
    const res = await GetDeviceChannels(deviceNode.data.token);
    if (res.status == 200 && res.data.code == 0 && res.data.result.length > 0) {
      // Convert channel data to tree nodes, preserving online status
      const channels = res.data.result.map((channel: any, index: number) => ({
        id: `channel_${deviceNode.data.devId}_${index}`,
        label: channel.name || `${t('Common.comm_channel')} ${index + 1}`,
        name: channel.name || `${t('Common.comm_channel')} ${index + 1}`,
        token: channel.token,
        online: channel.online,
        type: 'device', // channels share type=device, differentiated by isDeviceChannel
        data: channel,
        isLeaf: true,
        isDeviceChannel: true // mark as device channel
      }));
      
      // Cache data
      deviceCache.set(cacheKey, channels);
      
      deviceNode.children = channels;
      deviceNode.loaded = true;
      deviceNode.isLeaf = false;
    } else {
      // Cache empty result
      deviceCache.set(cacheKey, []);
      
      // Device has no channels — mark as leaf
      delete deviceNode.children;
      deviceNode.loaded = true;
      deviceNode.isLeaf = true;
    }
  } catch (error) {
    // On error: remove children and mark as leaf
    delete deviceNode.children;
    deviceNode.loaded = true;
    deviceNode.isLeaf = true;
  }
};

// Find and update node in source data
const findAndUpdateNode = (nodes: TreeNode[], targetId: string, updatedNode: TreeNode): boolean => {
  if (!nodes || nodes.length === 0) return false;
  
  for (let i = 0; i < nodes.length; i++) {
    const currentNode = nodes[i];
    if (!currentNode) continue;
    
    if (currentNode.id === targetId) {
      // Update node
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

// Node expand handler
const handleNodeExpand = async (data: TreeNode, node: any) => {
  // Skip expand handling for channel nodes
  if (data.isDeviceChannel) {
    return;
  }
  tableData.value = [];
  // Lazy-load channels for unloaded device nodes
  if (data.type === 'device' && !data.loaded) {
    await loadDeviceChannels(data);
    
    // Update node in source data
    findAndUpdateNode(originalChannelData.value, data.id, data);
    
    // Manually trigger update to avoid watch loop
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

// Node collapse handler
const handleNodeCollapse = (data: TreeNode, node: any) => {
  // Skip collapse handling for channel nodes
  if (data.isDeviceChannel) {
    return;
  }
  tableData.value = [];
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
let confCount =ref<number>(0)
const analyticsCount = ref<any>({})

const GetAnalytics = async (channelUUID?: string, bEnable?: boolean, metaEnabled?: boolean) => {
  rulesTableData.value = [];
  rulesTotal.value = 0;
  confCount.value = 0;
  analyticsCount.value = {};
  const res = await GetAnalyticsApi()
  if (res.status == 200 && res.data.code == 0) {
    const list = res.data.result;
    for (let i = 0; i < list.length; i++) {
      if (list[i].channelUUID == channelUUID) {
        rulesTableData.value.push(list[i]);
        rulesTotal.value = rulesTableData.value.length
      }
      if (list[i].setting.ruleType == "USC_ANA_RULE_CONF" && channelUUID == list[i].channelUUID) {
        confCount.value += 1;
        if (bEnable) {
          goClick(list[i]);
          ruleForm.value.metaEnable = list[i].channel.metaEnabled
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

const anauuid = ref<string>('')
const vectPect = ref<boolean>(false)
// Table row click handler
const goClick = (row: any, column?: any) => {
  console.log('goCLick row =>', row)
  anauuid.value = row.uuid;
  gotable.value = true;
  const rule = AnalyticsSetDraw(row);
  ruleForm.value.name = row.name;
  ruleForm.value.ruleType = row.ruleType;
  const ruleTypeData = RuleTypeData.find(item => item.value == row.ruleType)
  ruleTypeLabel.value = ruleTypeData ? ruleTypeData.label : '';
  draw.value.clearCanvas();
  if (row.setting.ruleType == "USC_ANA_RULE_CONF") {
    if (rule.roiShape.points.length > 2) {
      draw.value.setPolygon(rule.roiShape.points)
    }
    ruleForm.value.schedule = rule.schedule;
    return
  }
  if (rule.shape.points.length > 2) {
    draw.value.setPolygon(rule.shape.points)
  } else {
    draw.value.setDefaultArrowDirection("AB");
    let conf = {
      uuid: row.uuid,
      point: rule.shape.points,
    }
    draw.value.setLines(conf)
  }
}

const AnalyticsSetDraw = (row: any) => {
  checkboxgroupShow.value = true;
  let videoDom = document.getElementById('h5videoRule') as HTMLVideoElement;
  switch(row.setting.ruleType) {
    case "USC_ANA_RULE_CONF":
      ruleForm.value.stream = row.setting.Rule.Conf.stream;
      ruleForm.value.fps = row.setting.Rule.Conf.fps;
      ruleForm.value.objectSize = row.setting.Rule.Conf.objSize;
      ruleForm.value.schedule = row.setting.Rule.Conf.schedule;
      ruleForm.value.motionDet = row.setting.Rule.Conf.motionDet;
      ruleForm.value.groudMode = row.setting.Rule.Conf.groudMode;
      ruleForm.value.colorDet = row.setting.Rule.Conf.colorDet;
      ruleForm.value.txtSearch = row.setting.Rule.Conf.txtSearch;
      ruleForm.value.classifiers = row.setting.Rule.Conf.classifiers || [];
      checkboxgroupShow.value = false;
      return row.setting.Rule.Conf;
    case 'USC_ANA_RULE_MIAA':
      checkList.value = row.setting.Rule.Miaa.objs;
      return row.setting.Rule.Miaa;
    case "USC_ANA_RULE_CRAL":
      direction.value = row.setting.Rule.Cral.direction;
      checkList.value = row.setting.Rule.Cral.objs;
      return row.setting.Rule.Cral;
    case "USC_ANA_RULE_LOIT":
      ruleForm.value.time = row.setting.Rule.Loit.dwellTime;
      checkboxgroupShow.value = false;
      return row.setting.Rule.Loit;
    case "USC_ANA_RULE_STVE":
      ruleForm.value.time = row.setting.Rule.Stve.dwellTime;
      checkList.value = row.setting.Rule.Stve.objs;
      return row.setting.Rule.Stve;
    case "USC_ANA_RULE_VECT":
      checkList.value = row.setting.Rule.Vect.objs;
      vectPect.value = true;
      return row.setting.Rule.Vect;
    case "USC_ANA_RULE_PECT":
      vectPect.value = true
      checkboxgroupShow.value = false;
      return row.setting.Rule.Pect;
    case "USC_ANA_RULE_PPE":
      checkboxgroupShow.value = false;
      return row.setting.Rule.Ppe;
    case "USC_ANA_RULE_PEFA":
      checkboxgroupShow.value = false;
      return row.setting.Rule.Pefa;
    case "USC_ANA_RULE_FARE":
      checkboxgroupShow.value = false;
      ruleForm.value.faceLibraryId = row.setting.Rule.Fare.faceLibraryId;
      ruleForm.value.faceSimilarityThreshold = row.setting.Rule.Fare.faceSimilarityThreshold;
      ruleForm.value.faceMinimumSize = row.setting.Rule.Fare.faceMinimumSize;
      if (videoDom && videoDom.videoWidth && videoDom.offsetWidth > 0) {
        let width = Math.min(row.setting.Rule.Fare.faceMinimumSize / (videoDom.videoWidth / videoDom.offsetWidth), videoDom.offsetWidth);
        $(".fareSize").width(width);
        let height = Math.min(row.setting.Rule.Fare.faceMinimumSize / (videoDom.videoHeight / videoDom.offsetHeight), videoDom.offsetHeight);
        $(".fareSize").height(height);
      }
      return row.setting.Rule.Fare;
    case "USC_ANA_RULE_LPRE":
      checkboxgroupShow.value = false;
      ruleForm.value.lprConfidenceThreshold = row.setting.Rule.Lpre.lprConfidenceThreshold;
      ruleForm.value.lprWidthMin = row.setting.Rule.Lpre.lprWidthMin;
      ruleForm.value.lprWidthMax = row.setting.Rule.Lpre.lprWidthMax;
      ruleForm.value.lprHeightMin = row.setting.Rule.Lpre.lprHeightMin;
      ruleForm.value.lprHeightMax = row.setting.Rule.Lpre.lprHeightMax;
      ruleForm.value.lprWidthMax = videoDom.videoWidth
      ruleForm.value.lprHeightMax = videoDom.videoHeight
      let minWidth = Math.min(row.setting.Rule.Lpre.lprWidthMin / (videoDom.videoWidth / videoDom.offsetWidth), videoDom.offsetWidth);
      $(".lprMinSize").width(minWidth);
      let minHeight = Math.min(row.setting.Rule.Lpre.lprHeightMin / (videoDom.videoHeight / videoDom.offsetHeight), videoDom.offsetHeight);
      $(".lprMinSize").height(minHeight);

      let maxWidth = Math.min(row.setting.Rule.Lpre.lprWidthMax / (videoDom.videoWidth / videoDom.offsetWidth), videoDom.offsetWidth);
      $(".lprMaxSize").width(maxWidth);
      let maxHeight = Math.min(row.setting.Rule.Lpre.lprHeightMax / (videoDom.videoHeight / videoDom.offsetHeight), videoDom.offsetHeight);
      $(".lprMaxSize").height(maxHeight);
      // console.log(this.formLabelAlign);
      return row.setting.Rule.Lpre;
    case "USC_ANA_RULE_CROD":
      checkboxgroupShow.value = false;
      ruleForm.value.detType = row.setting.Rule.Crod.detType;
      ruleForm.value.threshold = row.setting.Rule.Crod.threshold;
      ruleForm.value.triggerInterval = row.setting.Rule.Crod.triggerInterval;
      return row.setting.Rule.Crod;
    default:
      break;
  }
}

const startDraw = ref<boolean>(false)
const draw = ref<any>(null)
const gotable = ref<any>(false) // true = edit mode, false = add mode

const startDrawing = ()  => {
  if (draw.value == null) {
    return
  }
  draw.value.stopDrawing();
  gotable.value = false;
  draw.value.clearCanvas();
  startDraw.value = true;

  switch (ruleForm.value.ruleType) {
    case "USC_ANA_RULE_CONF":
    case "USC_ANA_RULE_MIAA":
    case "USC_ANA_RULE_LOIT":
    case "USC_ANA_RULE_STVE":
    case "USC_ANA_RULE_PPE":
    case "USC_ANA_RULE_PEFA":
    case "USC_ANA_RULE_FARE":
    case "USC_ANA_RULE_LPRE":
    case "USC_ANA_RULE_CROD":
      draw.value.setDrawMode("polygon");
      break;
    case "USC_ANA_RULE_CRAL":
    case "USC_ANA_RULE_VECT":
    case "USC_ANA_RULE_PECT":
      draw.value.setDrawMode("line");
      draw.value.setDefaultArrowDirection("AB");
    default:
      break;
  }
  draw.value.startDrawing();
}
const stopDrawing = () => {
  startDraw.value = false;
  draw.value.stopDrawing();
};
const clearCanvas = () => {
  startDrawing()
};

const platformyes = async () => {
  if (!h5handler.value) return
  // console.log(ruleForm.value)
  const scheduleUUID = ruleForm.value.schedule;
  const polygon = draw.value.getPolygons();
  const lines = draw.value.getLines();
  const data: any = {
    channelUUID: channelUUID.value,
    name: ruleForm.value.name,
    priorityLevel: ruleForm.value.priorityLevel,
    setting: {
      ruleType: ruleForm.value.ruleType,
      Rule: {}
    }
  }
  // console.log(scheduleUUID, polygon, lines, data)
  switch (ruleForm.value.ruleType) {
    case "USC_ANA_RULE_CONF":
      let classifiers = [];
      classifiers = ruleForm.value.classifiers;
      let conf = {
        roiShapeType: "USC_RULE_SHAPE_POLYGON",
        roiShape: {
          points: polygon.length == 0 ? [{ x: 0, y: 0 }] : draw.value.normalizeVertex(polygon[0].vertices)
        },
        fps: Number(ruleForm.value.fps),
        objSize: Number(ruleForm.value.objectSize),
        stream: ruleForm.value.stream || 'main',
        schedule: scheduleUUID,
        motionDet: ruleForm.value.motionDet,
        groudMode: ruleForm.value.groudMode,
        colorDet: ruleForm.value.colorDet,
        txtSearch: ruleForm.value.txtSearch,
        classifiers: classifiers,
      }
      data.setting.Rule.Conf = conf;
      data.metaEnabled = ruleForm.value.metaEnabled;
      if (confCount.value != 0) {
        gotable.value = true;
      } else {
        gotable.value = false;
      }
      break;
    case 'USC_ANA_RULE_MIAA':
      if (!polygon[0]) return;
      if (checkList.value.length) {
        ElMessage({
          message: t('CommTableEdit.comm_modify_failed'),
          type: 'error',
          duration: 2000
        })
        return;
      }
      const miaa = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        objs: checkList.value
      }
      data.setting.Rule.Miaa = miaa;
      break;
    case 'USC_ANA_RULE_CRAL':
      if (!lines[0]) return;
      if (checkList.value.length == 0) {
        ElMessage({
          message: t('CommTableEdit.comm_modify_failed'),
          type: 'error',
          duration: 2000
        })
        return;
      }
      const vertices = [lines[0].start, lines[0].end]
      const cral = {
        shapeType: "USC_RULE_SHAPE_DIR_LINE",
        shape: {
          points: draw.value.normalizeVertex(vertices)
        },
        objs: checkList.value,
        direction: direction.value
      }
      data.setting.Rule.Cral = cral;
      break;
    case 'USC_ANA_RULE_LOIT':
      if (!polygon[0]) return
      const loit = {
        shapeType: 'USC_RULE_SHAPE_POLYGON',
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        dwellTime: Number(ruleForm.value.time)
      }
      data.setting.Rule.Loit = loit;
      break;
    case 'USC_ANA_RULE_STVE':
      if (!polygon[0]) return;
      if (checkList.value.length == 0) {
        ElMessage({
          message: t('CommTableEdit.comm_modify_failed'),
          type: 'error',
          duration: 2000
        })
      }
      const stve = {
        shapeType: 'USC_RULE_SHAPE_POLYGON',
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        objs: checkList.value,
        dwellTime: Number(ruleForm.value.time)
      }
      data.setting.Rule.Stve = stve;
      break;
    case 'USC_ANA_RULE_VECT':
      if (!lines[0]) return;
      if (checkList.value.length == 0) {
        ElMessage({
          message: t('CommTableEdit.comm_modify_failed'),
          type: 'error',
          duration: 2000
        })
      }
      const vertice = [lines[0].start, lines[0].end];
      const vect = {
        shapeType: 'USC_RULE_SHAPE_COUNTING_LINE',
        shape: {
          points: draw.value.normalizeVertex(vertice)
        },
        objs: checkList.value
      }
      data.setting.Rule.Vect = vect;
      break;
    case 'USC_ANA_RULE_PECT':
      if (!lines[0]) return;
      var pectices = [lines[0].start, lines[0].end];
      const pect = {
        shapeType: "USC_RULE_SHAPE_COUNTING_LINE",
        shape: {
          points: draw.value.normalizeVertex(pectices)
        }
      }
      data.setting.Rule.Pect = pect
      break;
    case 'USC_ANA_RULE_PPE':
      if (!polygon[0]) return;
      let ppe = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        objs: checkList.value
      }
      data.setting.Rule.Ppe = ppe
      break;
    case 'USC_ANA_RULE_PEFA':
      if (!polygon[0]) return;
      let pefa = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        objs: checkList.value
      }
      data.setting.Rule.Pefa = pefa
      break;
    case 'USC_ANA_RULE_FARE':
      if (!polygon[0]) return;
      let fare = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        faceLibraryId: ruleForm.value.faceLibraryId,
        faceMinimumSize: parseInt(ruleForm.value.faceMinimumSize),
        faceSimilarityThreshold: parseInt(ruleForm.value.faceSimilarityThreshold)
      }
      data.setting.Rule.fare = fare
      break;
    case "USC_ANA_RULE_LPRE":
      if (!polygon[0]) return;
      let lpre = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        lprConfidenceThreshold: parseInt(ruleForm.value.lprConfidenceThreshold),
        lprWidthMin: parseInt(ruleForm.value.lprWidthMin),
        lprWidthMax: parseInt(ruleForm.value.lprWidthMax),
        lprHeightMin: parseInt(ruleForm.value.lprHeightMin),
        lprHeightMax: parseInt(ruleForm.value.lprHeightMax)
      }
      data.setting.Rule.lpre = lpre
      break;
    case "USC_ANA_RULE_CROD":
      if (!polygon[0]) return;
      let crod = {
        shapeType: "USC_RULE_SHAPE_POLYGON",
        shape: {
          points: draw.value.normalizeVertex(polygon[0].vertices)
        },
        detType: ruleForm.value.detType,
        threshold: parseInt(ruleForm.value.threshold),
        triggerInterval: parseInt(ruleForm.value.triggerInterval),
      }
      data.setting.Rule.crod = crod
      break;
    default:
      break;
  }
  if (gotable.value) {  // gotable true — update
    data.uuid = anauuid.value;
    const res = await UpdateAnalyticsApi(data);
    console.log('UpdateAnalytics =>', res)
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_modify_success'),
        type: 'success',
        duration: 2000
      })
      GetAnalytics(currentChannel.value.uuid);
    }
  } else {  // gotable false — add
    const res = await SetAnalyticsApi(data);
    console.log('SetAnalytics =>', res);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_add_successfully'),
        type: 'success',
        duration: 2000
      })
      GetAnalytics(currentChannel.value.uuid);
    }
  }
}

const delRow = async (row: any) => {
  console.log('DelRow', row)
  const ids = [row.id];
  const res = await DeleteAnalyticsApi({ ids });
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_delete_successfully'),
      type: 'success',
      duration: 2000
    })
    if (draw.value) {
      draw.value.clearCanvas();
    }
    GetAnalytics(channelUUID.value);
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_delete_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

// Fetch recording schedule
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
// Fetch face library
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
    h5handler.value = new H5sPlayerRTC(conf)
  } else if (store.liveviewrtc === 'WS') {
    h5handler.value = new H5sPlayerWS(conf)
  } else if (store.liveviewrtc === 'WS2') {
    conf.buffersize = store.RBufferTime; //jitter buffer, unit is ms, only for ws2, default is 300.
    conf.h264cpumode = store.H264CpuDecode; //if h264cpumode is true, h264 will force use cpu. only for ws2, default is false
    h5handler.value = new H5sPlayerWS2(conf);
  }
  objSizeStart.value = true;
  channelUUID.value = data.uuid;
  h5handler.value.connect();

  draw.value = new AiDraw(document.getElementById('h5vcanvasRule'));
  draw.value.setDefaultArrowDirection('AB')
}
// console.log('AiDraw =>' ,AiDraw)
const closeVideo = () => {
  if (h5handler.value) {
    h5handler.value.disconnect();
    delete h5handler.value;
    h5handler.value = null;
    channelUUID.value = '';
  }
  if (draw.value) {
    startDraw.value = false;
    draw.value.clearCanvas();
    delete draw.value;
    draw.value = null;
  }
}

const ruleConfigVisible = ref<boolean>(false);
const channelName = ref<string>('');
const currentChannel = ref<any>({})

const ruleConfigBread = async (row: any) => {
  ruleConfigVisible.value = true;
  console.log('ruleConfigBread row =>', row);
  channelName.value = row.data.name;
  currentChannel.value = row.data
  GetAnalytics(row.data.uuid, true, row.data.metaEnabled)
  playVideo(row.data);
  await nextTick();
  
  const div = document.getElementById('h5videoRule');
  const canvas = document.getElementById('h5vcanvasRule') as HTMLCanvasElement | null;
  if (!div || !canvas) return;
  // Get container dimensions
  var divWidth = div?.offsetWidth;
  var divHeight = div?.offsetHeight;
  console.log(divWidth, divHeight)
  // Set canvas size from container
  canvas.width = divWidth;
  canvas.height = divHeight;
}
const quitConfig = () => {
  ruleConfigVisible.value = false;
  gotable.value = false;
  closeVideo();
  channelName.value = '';
  channelUUID.value = '';
  ruleForm.value = {
    name: 'Rule1',
    ruleType: 'USC_ANA_RULE_CONF',
    time: 60, // dwell time (s)
    objectSize: 30, // min detectable object size
    fps: 0.5, // frame rate (fps)
    schedule: '', // schedule
    stream: 'main', // stream
    priorityLevel: 'Medium',  // priority level
    faceLibraryId: '',  // face library ID
    faceSimilarityThreshold: 60,  // face similarity threshold
    faceMinimumSize: 40,  // face min size (px)
    lprConfidenceThreshold: 60, // LPR confidence threshold
    detType: 'person',  // crowd detection target type
    threshold: 2, // crowd alert count
    triggerInterval: 10,  // crowd alert interval (s)
    lprWidthMin: 60,  // LPR min width
    lprHeightMin: 20, // LPR min height
    lprWidthMax: 180, // LPR max width
    lprHeightMax: 60, // LPR max height
    metaEnabled: true,  // enable metadata analytics
    motionDet: false, // enable motion detection
    groudMode: true,  // ground mode
    colorDet: true, // enable colour detection
    txtSearch: false, // text search
    classifiers: [],  // classifiers
  }
}
const updateObjSize = () => {
  $('.objSize').width(ruleForm.value.objectSize)
  $('.objSize').height(ruleForm.value.objectSize)
}

const ruleForm = ref<any>({
  name: 'Rule1',
  ruleType: 'USC_ANA_RULE_CONF',
  time: 60, // dwell time (s)
  objectSize: 30, // min detectable object size
  fps: 0.5, // frame rate (fps)
  schedule: '', // schedule
  stream: 'main', // stream
  priorityLevel: 'Medium',  // priority level
  faceLibraryId: '',  // face library ID
  faceSimilarityThreshold: 60,  // face similarity threshold
  faceMinimumSize: 40,  // face min size (px)
  lprConfidenceThreshold: 60, // LPR confidence threshold
  detType: 'person',  // crowd detection target type
  threshold: 2, // crowd alert count
  triggerInterval: 10,  // crowd alert interval (s)
  lprWidthMin: 60,  // LPR min width
  lprHeightMin: 20, // LPR min height
  lprWidthMax: 180, // LPR max width
  lprHeightMax: 60, // LPR max height
  metaEnabled: true,  // enable metadata analytics
  motionDet: false, // enable motion detection
  groudMode: true,  // ground mode
  colorDet: true, // enable colour detection
  txtSearch: false, // text search
  classifiers: [],  // classifiers
})
const RuleTypeData = [
  { label: t('Analytics.ana_general'), value: 'USC_ANA_RULE_CONF', icon: 'icon-changguipeizhi' }, // general config
  { label: t('Analytics.ana_rule_ppe'), value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat' }, // hardhat detection
  { label: t('Analytics.ana_rule_miaa'), value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin' },  // area intrusion
  { label: t('Analytics.ana_rule_pefa'), value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance' }, // fall detection
  { label: t('Analytics.ana_rule_cral'), value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance' },  // tripwire
  { label: t('Analytics.ana_rule_loit'), value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu' },  // loitering
  { label: t('Analytics.ana_rule_stve'), value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche' }, // illegal parking
  { label: t('Analytics.ana_rule_vect'), value: 'USC_ANA_RULE_VECT', icon: 'icon-cheliangjishu' },  // vehicle count
  { label: t('Analytics.ana_rule_pect'), value: 'USC_ANA_RULE_PECT', icon: 'icon-renyuanjishu' }, // person count
  { label: t('Analytics.ana_face_recognition'), value: 'USC_ANA_RULE_FARE', icon: 'icon-renlianshibie1' }, // face recognition
  { label: t('Analytics.ana_lpre'), value: 'USC_ANA_RULE_LPRE', icon: 'icon-chepaishibie' }, // LPR
  { label: t('Analytics.ana_rule_crod'), value: 'USC_ANA_RULE_CROD', icon: 'icon-renyuanjishu' }, // crowd detection
]
const fpsOptions = [{
  value: 0.5,
  label: t('Analytics.ana_once_2s')
}, {
  value: 0.2,
  label: t('Analytics.ana_once_5s')
}, {
  value: 0.1,
  label: t('Analytics.ana_once_10s')
}, {
  value: 0.033,
  label: t('Analytics.ana_once_30s')
}, {
  value: 0.017,
  label: t('Analytics.ana_once_60s')
}, {
  value: 0.008,
  label: t('Analytics.ana_once_120s')
}]
const scheduleName: Record<string, string> = {
  "Recording always": t('Analytics.ana_recording_always'),
  "Motion recording": t('Analytics.ana_motion_recording'),
  "Object recording": t('Analytics.ana_object_recording'),
  "Motion & Object recording": t('Analytics.ana_motion_object_recording'),
  "Not recording": t('Analytics.ana_not_recording'),
}
const shapeObj: any = {
  "person": "icon-person",
  "vehicle": "icon-car",
  "motorcycle": "icon-motorcycle",
  "bicycle": "icon-bicycle",
}
const faceLibraryList = ref<any[]>([])
const scheduleArr = ref<any[]>([])
const ruleTypeLabel = ref<string>(t('Analytics.ana_general'))
const checkboxgroupShow = ref<boolean>(false);
const checkList = ref<any[]>([]);
const direction = ref<string>('AB');



// Rule-type panel visibility
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

const moreSetting = ref<boolean>(false);
const moreSettingsClose = () => {
  moreSetting.value = false;
}
const classifierList = ref<any[]>([]);
const GetClassifierList = async () => {
  const res = await GetClassifierListApi({
    pageIndex: 1,
    pageSize: 10000
  });
  if (res.status == 200 && res.data.code == 0) {
    classifierList.value = res.data.result.list;
  }
}

// Face recognition min-size change handler
const updateFareSize = (value: any) => {
  const videoDom = document.getElementById('h5videoRule')  as HTMLVideoElement;
  let width = Math.min(ruleForm.value.faceMinimumSize / (videoDom.videoWidth / videoDom.offsetWidth), videoDom.offsetWidth);
  $(".fareSize").width(width);
  let height = Math.min(ruleForm.value.faceMinimumSize / (videoDom.videoHeight / videoDom.offsetHeight), videoDom.offsetHeight);
  $(".fareSize").height(height);
}
// Watch filter text changes
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
  GetClassifierList()
})

onBeforeUnmount(() => {
  closeVideo()
})

const activeNames = ['1']
</script>

<template>
  <div class="rule-config">
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
              <span class="quit" @click="quitConfig">{{ t('Analytics.ana_rule_config') }}</span>
              >
              <span>{{ t('Router.router_configuration') + channelName }}</span>
            </div>
            <div class="opeartion">
              <el-button v-if="!startDraw" size="small" @click="startDrawing"><i class="iconfont icon-bianji"></i></el-button>
              <el-button v-else size="small" @click="stopDrawing"><i class="iconfont icon-duihao1"></i></el-button>
              <el-button size="small" type="primary" @click="clearCanvas"><i class="iconfont icon-huifu"></i></el-button>
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
            <el-form-item :label="t('CommTableEdit.comm_table_name')">
              <el-input v-model="ruleForm.name" style="width: 210px;"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_check_type')">
              <el-select v-model="ruleTypeLabel" @visible-change="handleVisibleChange" popper-class="ruleTypeSelect"
                style="width: 210px;"></el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_object')" v-show="checkboxgroupShow">
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
            <el-form-item :label="t('Analytics.ana_dwell_time')" v-show="ruleForm.ruleType == 'USC_ANA_RULE_LOIT' || ruleForm.ruleType == 'USC_ANA_RULE_STVE'">
              <el-input v-model="ruleForm.time" style="width: 210px;"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_direction')" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CRAL'">
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
            <el-form-item :label="t('Analytics.ana_fps')" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.fps" style="width: 210px;" filterable>
                <el-option v-for="item in fpsOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_schedule')" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.schedule" style="width: 210px;">
                <el-option v-for="(item, index) in scheduleArr" :key="index" :label="item.name" :value="item.uuid"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Configuration.conf_dev_stream')" v-show="ruleForm.ruleType == 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.stream" style="width: 210px;">
                <el-option :label="t('Configuration.conf_dev_main_stream')" value="main"></el-option>
                <el-option :label="t('Configuration.conf_dev_sub_stream')" value="sub"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_priority')" v-show="ruleForm.ruleType != 'USC_ANA_RULE_CONF'">
              <el-select v-model="ruleForm.priorityLevel" style="width: 210px;">
                <el-option label="Critical" value="Critical"></el-option>
                <el-option label="High" value="High"></el-option>
                <el-option label="Medium" value="Medium"></el-option>
                <el-option label="Low" value="Low"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_face_library')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-select v-model="ruleForm.faceLibraryId" style="width: 210px;">
                <el-option v-for="(item, i) in faceLibraryList" :key="i" :label="item.faceLibraryName"
                  :value="item.faceLibraryId"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_please_similarity')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-input v-model="ruleForm.faceSimilarityThreshold" style="width: 210px;"
                placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analutics.ana_please_min_size')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_FARE'">
              <el-input v-model="ruleForm.faceMinimumSize" style="width: 210px;"
                @change="updateFareSize"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_please_similarity')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'">
              <el-input v-model="ruleForm.lprConfidenceThreshold" style="width: 210px;"
                placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_rule_detType')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-select v-model="ruleForm.detType" style="width: 210px;">
                <el-option label="head" value="head"></el-option>
                <el-option label="person" value="person"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_rule_crpe')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-input v-model="ruleForm.threshold" style="width: 210px;" placeholder="1-100"></el-input>
            </el-form-item>
            <el-form-item :label="t('Analytics.ana_rule_cooldown')"
              v-show="ruleForm.ruleType == 'USC_ANA_RULE_CROD'">
              <el-input v-model="ruleForm.triggerInterval" style="width: 210px;"></el-input>
            </el-form-item>
          </el-form>
          <div v-show="ruleForm.ruleType == 'USC_ANA_RULE_LPRE'" style="padding: 0 20px;">
            {{ t('Analytics.ana_license_plate_min_size') }}&nbsp; 
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
            {{ t('Analytics.ana_license_plate_max_size') }}&nbsp; 
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
            <div>{{ t('Analytics.ana_obj_size') }}</div>
            <br>
            <el-slider v-model="ruleForm.objectSize" show-input @input="updateObjSize"></el-slider>
            <!-- <el-input style="width: 80px;" v-model="formLabelAlign.objectSize"></el-input> -->
          </div>
          <div v-show="ruleForm.ruleType === 'USC_ANA_RULE_CONF'"
            @click="() => { moreSetting = true; console.log(ruleForm) }" style="cursor: pointer; color: #177DDC; padding: 20px 20px 0 20px;">
            {{ t('Analytics.ana_more_settings') }}
            <i class="iconfont icon-shezhianniu"></i>
          </div>
          <div style="width: 100%; padding: 20px; display: flex; justify-content: space-between;">
            <el-button v-if="ruleForm.ruleType == 'USC_ANA_RULE_CONF'" class="iconfont icon-fuzhi" style="width: 60px; height: 28px;"></el-button>
            <el-button v-else  style="border:0px;background-color: transparent;"></el-button>
            <el-button class="form_butt" type="primary" :disabled="startDraw" @click="platformyes" style="width: 60px; height: 28px;">{{ t('CommTableEdit.comm_ok') }}</el-button>
          </div>
        </div>
      </div>
      <div class="conf-table">
        <el-table 
          :data="rulesTableData.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)"
          height="260"
          highlight-current-row
          @row-click="goClick"
        >
          <el-table-column prop="name" :label="t('CommTableEdit.comm_table_name')" width="120" align="center"></el-table-column>
          <el-table-column prop="uuid" label="UUID" width="300" align="center"></el-table-column>
          <el-table-column prop="setting.ruleType" :label="t('Analytics.ana_check_type')" width=200 align="center"></el-table-column>
          <el-table-column :label="t('Analytics.ana_object')" align="center">
            <template #default="{ row }">
              <div v-if="row.setting.ruleType == 'USC_ANA_RULE_MIAA'" style="font-size: 20px;">
                <span v-for="item in row.setting.Rule.Miaa.objs" :class="'iconfont ' + shapeObj[item]"
                  :key="item">&nbsp;&nbsp;</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_CRAL'" style="font-size: 20px;">
                <span v-for="item in row.setting.Rule.Cral.objs" :class="'iconfont ' + shapeObj[item]"
                  :key="item">&nbsp;&nbsp;</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_STVE'" style="font-size: 20px;">
                <span v-for="item in row.setting.Rule.Stve.objs" :class="'iconfont ' + shapeObj[item]"
                  :key="item">&nbsp;&nbsp;</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_VECT'" style="font-size: 20px;">
                <span v-for="item in row.setting.Rule.Vect.objs" :class="'iconfont ' + shapeObj[item]"
                  :key="item">&nbsp;&nbsp;</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_PECT'" style="font-size: 20px;">
                <span v-for="item in row.setting.Rule.Pect.objs" :class="'iconfont ' + shapeObj[item]"
                  :key="item">&nbsp;&nbsp;</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_PPE'" style="font-size: 20px;">
                <span :class="'iconfont icon-person'"></span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_FARE'" style="font-size: 20px;">
                <span :class="'iconfont icon-person'"></span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_LPRE'" style="font-size: 20px;">
                <!-- <span :class="'iconfont icon-person'"></span> -->
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_PEFA'" style="font-size: 20px;">
                <span :class="'iconfont icon-person'"></span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('Common.comm_enable')" width="120" align="center">
            <template #default="{ row }">
            <div>
              <el-switch v-model="row.enabled" disabled></el-switch>
            </div>
          </template>
          </el-table-column>
          <el-table-column :label="t('Analytics.ana_direction')" width="160" align="center">
            <template #default="{ row }">
              <div v-if="row.setting.ruleType == 'USC_ANA_RULE_CRAL'">
                <span>{{ row.setting.Rule.Cral.direction }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('Analytics.ana_dwell_time')" width="120" align="center">
            <template #default="{ row }">
              <div v-if="row.setting.ruleType == 'USC_ANA_RULE_LOIT'">
                <span>{{ row.setting.Rule.Loit.dwellTime }}</span>
              </div>
              <div v-else-if="row.setting.ruleType == 'USC_ANA_RULE_STVE'">
                <span>{{ row.setting.Rule.Stve.dwellTime }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('CommTableEdit.comm_operational')" width="100" align="center">
            <template #default="{ row }">
              <el-button type="text" @click.stop="delRow(row)">{{ t('CommTableEdit.comm_delete') }}</el-button>
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
          <span>{{ t('Analytics.ana_check_type') }}</span>
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
      <el-dialog v-model="moreSetting" :title="t('Analytics.ana_more_settings')" width="600" top="20vh" custom-class="moreSettins">
        <div class="more_settings">
          <el-checkbox v-model="ruleForm.metaEnabled">
            <template #default>
              <span class="iconfont icon-yuanshujufenxi" style="font-size: 16px;"> </span>
              <span>{{ t('Analytics.ana_rule_mesg') }}</span>
            </template>
          </el-checkbox>
          <el-checkbox v-model="ruleForm.motionDet">
            <template #default>
              <span class="iconfont icon-yidongzhence1" style="font-size: 16px;"> </span>
              <span>{{ t('Analytics.ana_enable_motion_detection') }}</span>
            </template>
          </el-checkbox>
          <el-checkbox v-model="ruleForm.groudMode">
            <template #default>
              <span class="iconfont icon-dimianmoshi" style="font-size: 16px;"> </span>
              <span>{{ t('Analytics.ana_ground_mode') }}</span>
            </template>
          </el-checkbox>
          <el-checkbox v-model="ruleForm.colorDet">
            <template #default>
              <span class="iconfont icon-yansejiance" style="font-size: 16px;"> </span>
              <span>{{ t('Analytics.ana_enable_color_detection') }}</span>
            </template>
          </el-checkbox>
          <el-checkbox v-model="ruleForm.txtSearch">
            <template #default>
              <span class="iconfont icon-wenbensousuo1" style="font-size: 16px;"> </span>
              <span>{{ t('Analytics.ana_text_search') }}</span>
            </template>
          </el-checkbox>
        </div>
        <hr style="border-color: #888; background-color: transparent; color: transparent; ">
        <div class="more_settings_label" style="margin: 20px 0 0 70px;">{{ t('Analytics.ana_classifier') }}</div>
        <div class="more_settings">
          <el-select v-model="ruleForm.classifiers" style="width: 217px;" multiple >
            <el-option v-for="item in classifierList" :key="item.value" :label="item.name" :value="item.uuid">
            </el-option>
          </el-select>
        </div>
        <template #footer>
          <el-button type="primary" @click="moreSettingsClose">{{$t("CommTableEdit.comm_ok")}}</el-button>
        </template>
      </el-dialog>
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
      .el-table__row {
        cursor: pointer;
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

// Device tree node styles
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
:deep(.el-dialog) {
  padding: 0 !important;
  // margin: 0;
  .el-dialog__header {
    height: 40px;
    line-height: 50px;
    padding: 0 20px;
    background-color: #454545;
  }
  .el-dialog__body {
    padding: 20px;
  }
  .el-dialog__footer {
    padding: 20px;
  }
}
.more_settings {
  padding-top: 10px;
  padding-left: 80px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 100%;
  :deep(.el-checkbox) {
    height: 35px;
    line-height: 35px;
    text-align: left;
    padding: 0 15px;
    border-radius: 3px;
    background: #404040;
    color: #fff;
    margin-bottom: 10px;

    .el-checkbox__label {
      padding-left: 0;
    }

    .el-checkbox__input {
      display: none !important;
    }
    
  }
  :deep(.is-checked) {
    background-color: #0399FE !important;
    .el-checkbox__label {
      color: #fff !important;
    }
  }
}
</style>

<style lang="scss">
  // Hide rule-config check-type styles
.ruleTypeSelect {
  display: none !important;
}
</style>