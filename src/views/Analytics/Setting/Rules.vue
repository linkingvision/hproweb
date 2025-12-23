<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search } from '@element-plus/icons-vue'
import { GetDevPartitionApi } from '@/api/configuration/device';
import { GetDeviceChannels } from '@/api/channel';
import { GetAnalyticsApi } from '@/api/Analytics/rules';
import { H5SPlayerWS, H5sPlayerRTC } from '@/assets/js/h5splayer.js';
import { AiDraw, H5sPlayerWS2 } from '@/assets/js/h5jssdk.js';
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
    console.log('正在加载中，跳过重复请求');
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
      console.log('设备树数据加载完成:', channelData.value);
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
  tableData.value = [];
  if (data.isDeviceChannel) {
    const row = {
      index: 1,
      channelName: node.data.name,
      channelToken: node.data.token,
      data: node.data,
      rules: analyticsCount.value[node.data.uuid] ? analyticsCount.value[node.data.uuid].length : 0
    }
    tableData.value.push(row)
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
  tableData.value = [];
  // 如果是通道节点，不处理展开事件
  if (data.isDeviceChannel) {
    return;
  }
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
  tableData.value = [];
  // 如果是通道节点，不处理合并事件
  if (data.isDeviceChannel) {
    return;
  }
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

const rulesTableData = ref<any[]>([])
const rulesTotal = ref<number>(0)
const confCount = ref<number>(0)
const analyticsCount = ref<any>({})
const GetAnalytics = async (channelUUID?: string, bEnable?: boolean) => {
  rulesTableData.value = [];
  rulesTotal.value = 0;
  confCount.value = 0;
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
    <div class="table_right rule-right">
      <el-table :data="tableData" stripe height="100%" style="width: 100%;">
        <el-table-column prop="index" label="序号" width="160" align="center"></el-table-column>
        <el-table-column prop="channelName" label="通道名称" align="center"></el-table-column>
        <el-table-column prop="channelToken" label="编号" width="500" align="center"></el-table-column>
        <el-table-column prop="rules" label="规则数" align="center"></el-table-column>
        <el-table-column label="编辑">
          <template #default="{ row }">
            <el-button type="text" size="small">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
</style>