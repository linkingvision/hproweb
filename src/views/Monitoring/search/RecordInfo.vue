<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetDevPartitionApi } from '@/api/configuration/device'
import { GetDeviceChannels } from '@/api/channel'
import RecordStatus from './components/RecordStatus.vue';

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
let activeCollapse = ref<string>('device')
let treeData = ref<TreeNode[]>([]);
const expandedKeys = ref<string[]>([]); // 记录展开的节点

const recordData = ref<any>({
  type: "",
  token: "",
})

// 转换数据为树形结构
const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) ||
                       (partition.dev && partition.dev.length > 0);
    
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      children: hasChildren ? [] : [{ id: 'placeholder', label: '', type: 'partition', data: null }], // 占位符，让所有节点都显示展开图标
      data: partition,
      isLeaf: false, // 初始都不是叶子节点
      loaded: false // 初始都未加载
    };
    
    // 如果有实际的子数据，则立即加载
    if (hasChildren) {
      // 1. 优先展示children（子分区）
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children = childrenNodes;
      } else {
        partitionNode.children = [];
      }
      
      // 2. 展示dev设备
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 设备也可能有子数据
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    
    // 3. 展示map地图 - 暂时注释，以后需要时再启用
    // if (partition.map && partition.map.length > 0) {
    //   partition.map.forEach((map: any) => {
    //     partitionNode.children!.push({
    //       id: `map_${map.mapId}`,
    //       label: map.mapName,
    //       type: 'map',
    //       data: map
    //     });
    //   });
    // }
    
    // 4. 展示view视图 - 暂时注释，以后需要时再启用
    // if (partition.view && partition.view.length > 0) {
    //   partition.view.forEach((view: any) => {
    //     partitionNode.children!.push({
    //       id: `view_${view.viewId}`,
    //       label: view.viewName,
    //       type: 'view',
    //       data: view
    //     });
    //   });
    // }
    
    result.push(partitionNode);
  });
  
  return result;
};

// 过滤树数据
const filteredTreeData = computed(() => {
  if (!filterText.value) return treeData.value;
  
  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.filter(node => {
      const matchesFilter = node.label.toLowerCase().includes(filterText.value.toLowerCase());
      if (node.children && node.children.length > 0) {
        node.children = filterTree(node.children);
        return matchesFilter || node.children.length > 0;
      }
      return matchesFilter;
    });
  };
  
  return filterTree(JSON.parse(JSON.stringify(treeData.value)));
});

// 获取节点图标
const getNodeIcon = (node: TreeNode) => {
  switch (node.type) {
    case 'partition':
      return 'icon-gen';
    case 'device':
      // 如果是设备通道（展开设备后的子节点），使用摄像机图标
      if (node.isDeviceChannel) {
        return 'icon-shexiangjizaixian';
      }
      // 如果是设备本身，使用设备图标
      return 'icon-Device';
    case 'map':
      return 'icon-ditu';
    case 'view':
      return 'icon-shipin';
    default:
      return 'icon-gen';
  }
};

// 获取节点样式类
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // 获取在线状态：优先使用node.online，如果不存在则使用node.data.online
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};

// 节点点击事件
const handleNodeClick = (data: TreeNode) => {
  // console.log('Node clicked:', data);
  // 这里可以添加节点点击的处理逻辑
};

// 懒加载子节点数据的API调用
const loadChildrenData = async (nodeData: TreeNode): Promise<TreeNode[]> => {
  try {
    // 这里根据节点类型调用不同的API
    if (nodeData.type === 'partition') {
      // 对于分区节点，可能需要调用特定的API获取子分区或设备
      // 这里使用现有的API作为示例，你可以根据实际需求修改
      const res = await GetDevPartitionApi();
      if (res.status === 200 && res.data.code === 0) {
        // 处理返回的数据，这里需要根据实际API返回格式调整
        return []; // 返回处理后的子节点数据
      }
    } else if (nodeData.type === 'device') {
      // 对于设备节点，可能需要获取设备的通道信息
      if (nodeData.data && nodeData.data.token) {
        const res = await GetDeviceChannels( nodeData.data.token );
        if (res.status === 200 && res.data.code === 0) {
          // 处理设备通道数据
          const channels = res.data.result || [];
          return channels.map((channel: any, index: number) => ({
            id: `channel_${nodeData.data.devId}_${index}`,
            label: channel.name || `通道 ${index + 1}`,
            type: 'device' as const,
            data: channel,
            online: channel.online, // 设置通道的在线状态
            isLeaf: true,
            loaded: true,
            isDeviceChannel: true // 标记为设备通道
          }));
        }
      }
    }
    return [];
  } catch (error) {
    console.error('加载子节点数据失败:', error);
    return [];
  }
};

// 节点展开事件
const handleNodeExpand = async (data: TreeNode, node: any) => {
  console.log('Node expanded:', data, node);
  recordData.value = {
    type: data.type,
    token: data.data.token,
    name: data.label
  };
  // 如果已经加载过，直接返回
  if (data.loaded) {
    return;
  }
  
  // 如果是占位符节点，进行懒加载
  if (data.children && data.children.length === 1 && data.children[0] && data.children[0].id === 'placeholder') {
    try {
      const childrenData = await loadChildrenData(data);
      
      if (childrenData.length > 0) {
        // 有子数据，替换占位符
        data.children = childrenData;
        data.loaded = true;
      } else {
        // 没有子数据，标记为叶子节点并清空children
        data.children = [];
        data.isLeaf = true;
        data.loaded = true;
      }
      
      // 强制更新树组件
      treeData.value = [...treeData.value];
    } catch (error) {
      console.error('展开节点失败:', error);
      // 出错时也清空占位符
      data.children = [];
      data.isLeaf = true;
      data.loaded = true;
      treeData.value = [...treeData.value];
    }
  }
};

// 节点收起事件
const handleNodeCollapse = (data: TreeNode, node: any) => {
  // console.log('Node collapsed:', data, node);
  // 这里可以添加节点收起时的处理逻辑
};

// 扁平化根节点，直接展示其内容
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. 优先展示children（子分区）
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. 展示dev设备
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 添加占位符
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. 展示map地图 - 暂时注释，以后需要时再启用
    // if (partition.map && partition.map.length > 0) {
    //   partition.map.forEach((map: any) => {
    //     result.push({
    //       id: `map_${map.mapId}`,
    //       label: map.mapName,
    //       type: 'map',
    //       data: map,
    //       children: [{ id: 'placeholder', label: '', type: 'map', data: null }],
    //       isLeaf: false,
    //       loaded: false
    //     });
    //   });
    // }
    
    // 4. 展示view视图 - 暂时注释，以后需要时再启用
    // if (partition.view && partition.view.length > 0) {
    //   partition.view.forEach((view: any) => {
    //     result.push({
    //       id: `view_${view.viewId}`,
    //       label: view.viewName,
    //       type: 'view',
    //       data: view,
    //       children: [{ id: 'placeholder', label: '', type: 'view', data: null }],
    //       isLeaf: false,
    //       loaded: false
    //     });
    //   });
    // }
  });
  
  return result;
};

const GetDevPartition = async () => {
  const res = await GetDevPartitionApi();
  if (res.status == 200 && res.data.code === 0) {
    // 使用扁平化函数，不展示根节点
    treeData.value = flattenRootNodes(res.data.result);
    // console.log('TreeData => ', treeData.value);
  }
}

onMounted(() => {
  GetDevPartition()
})
</script>

<template>
  <div class="Record-Info">
    <div class="device-tree">
      <div  style="padding: 10px;">
        <el-input v-model="filterText" :placeholder="t('Common.comm_filtration')">
          <template #suffix>
            <i class="iconfont icon-sousuo1"></i>
          </template>
        </el-input>
      </div>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="device">
          <template #title>
            <div style="display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px;">
              <div class="title-text" style="white-space: nowrap;">{{ t('Common.comm_device_partition') }}</div>
              <div class="liveview-colltitle" style="align-items: center;">
                <div @click.stop="GetDevPartition"><i class="iconfont icon-shuaxin"></i></div>
              </div>
            </div>
          </template>
          
          <div class="tree-container">
            <el-tree-v2
              :data="filteredTreeData"
              :props="{ label: 'label', children: 'children' }"
              node-key="id"
              :height="780"
              @node-click="handleNodeClick"
              @node-expand="handleNodeExpand"
              @node-collapse="handleNodeCollapse"
            >
              <template #default="{ data }">
                <div :class="getNodeClass(data)" class="tree-node-content">
                  <i :class="`iconfont ${getNodeIcon(data)}`" class="node-icon"></i>
                  <span class="node-label">{{ data.label }}</span>
                </div>
              </template>
            </el-tree-v2>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="record-info">
      <RecordStatus ref="LocalRecordingStatus" router="recordInfo" :recordData="recordData"></RecordStatus>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.Record-Info {
  width: 100%;
  height: 100%;
  display: flex;
  .device-tree {
    width: 17%;
    height: 100%;
    background-color: #2b2b2b;
    margin-right: 6px;
    // padding: 10px;
    :deep(.el-input) {
      // border-radius: 12px;
      .el-input__wrapper {
        border-radius: 16px;
      }
    }
    :deep(.el-collapse) {
      // background-color: #424242;
      border: 0;
      .el-collapse-item__header {
        background-color: #404040;
        border: 0;
        color: #fff;
        height: 48px;
        .liveview-colltitle{
          display: flex;
          // width: ;
          div {
            margin-left: 12px;
            width: 26px;
            height: 26px;
            background-color: #232323;
            border-radius: 13px;
            text-align: center;
            line-height: 26px;
            cursor: pointer;
            transition: background-color 0.3s;
            &:hover {
              background-color: #404040;
            }
            i {
              font-size: 14px;
            }
          }
        }
      }
      .el-collapse-item__wrap {
        background-color: transparent;
        border: 0;
      }
      .el-collapse-item__content {
        padding: 0;
      }
    }
    
    .tree-container {
      
      :deep(.el-tree-v2) {
        background-color: transparent;
        color: #fff;
        
        .el-tree-node {
          .el-tree-node__content {
            background-color: transparent;
            border-radius: 4px;
            margin: 1px 0;
            padding: 2px 8px;
            transition: background-color 0.3s;
            
            &:hover {
              background-color: rgba(255, 255, 255, 0.1);
            }
          }
          
          .el-tree-node__expand-icon {
            color: #fff;
          }
        }
      }
    }
    
    .tree-node-content {
      display: flex;
      align-items: center;
      width: 100%;
      
      // 在线设备透明度为1（正常显示）
      &.device-online {
        opacity: 1;
      }
      
      // 离线设备透明度为0.6（与节点相同）
      &.device-offline {
        opacity: 0.6;
      }
      
      .node-icon {
        margin-right: 8px;
        font-size: 16px;
      }
      
      .node-label {
        flex: 1;
        font-size: 14px;
        color: #fff;
      }
    }
  }
  .record-info {
    flex: 1;
    height: 100%;
    background-color: #232323;
  }
}
</style>