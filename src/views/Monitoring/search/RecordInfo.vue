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
  isLeaf?: boolean; // flag: is leaf node
  loaded?: boolean; // flag: children already loaded
  isDeviceChannel?: boolean; // flag: is device channel (child of expanded device)
}

const { t } = useI18n()

const filterText = ref<string>('')
let activeCollapse = ref<string>('device')
let treeData = ref<TreeNode[]>([]);
const expandedKeys = ref<string[]>([]);

const recordData = ref<any>({
  type: "",
  token: "",
})

const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) ||
                       (partition.dev && partition.dev.length > 0);
    
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      children: hasChildren ? [] : [{ id: 'placeholder', label: '', type: 'partition', data: null }], // placeholder so all nodes show expand icon
      data: partition,
      isLeaf: false,
      loaded: false
    };
    
    if (hasChildren) {
      // 1. Sub-partitions first
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children = childrenNodes;
      } else {
        partitionNode.children = [];
      }
      
      // 2. Device nodes
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // device may have child data
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    
    // 3. Map nodes — disabled for now
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
    
    // 4. View nodes — disabled for now
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

const getNodeIcon = (node: TreeNode) => {
  switch (node.type) {
    case 'partition':
      return 'icon-gen';
    case 'device':
      // Channel children of a device use the camera icon
      if (node.isDeviceChannel) {
        return 'icon-shexiangjizaixian';
      }
      // Device nodes use the device icon
      return 'icon-Device';
    case 'map':
      return 'icon-ditu';
    case 'view':
      return 'icon-shipin';
    default:
      return 'icon-gen';
  }
};

const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // Online status: prefer node.online, fallback to node.data.online
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};

const handleNodeClick = (data: TreeNode) => {
};

const loadChildrenData = async (nodeData: TreeNode): Promise<TreeNode[]> => {
  try {
    if (nodeData.type === 'partition') {
      // Partition nodes may need a dedicated API
      // Example using existing API — adapt as needed
      const res = await GetDevPartitionApi();
      if (res.status === 200 && res.data.code === 0) {
        // Handle response — adjust to actual API format
        return [];
      }
    } else if (nodeData.type === 'device') {
      if (nodeData.data && nodeData.data.token) {
        const res = await GetDeviceChannels( nodeData.data.token );
        if (res.status === 200 && res.data.code === 0) {
          const channels = res.data.result || [];
          return channels.map((channel: any, index: number) => ({
            id: `channel_${nodeData.data.devId}_${index}`,
            label: channel.name || `Channel ${index + 1}`,
            type: 'device' as const,
            data: channel,
            online: channel.online,
            isLeaf: true,
            loaded: true,
            isDeviceChannel: true
          }));
        }
      }
    }
    return [];
  } catch (error) {
    return [];
  }
};

const handleNodeExpand = async (data: TreeNode, node: any) => {
  // Skip placeholder nodes (data.data is null)
  if (!data.data) return;

  recordData.value = {
    type: data.type,
    token: data.data.token,
    name: data.label
  };
  if (data.loaded) {
    return;
  }

  // Lazy-load on placeholder node expand
  if (data.children && data.children.length === 1 && data.children[0] && data.children[0].id === 'placeholder') {
    try {
      const childrenData = await loadChildrenData(data);

      if (childrenData.length > 0) {
        data.children = childrenData;
        data.loaded = true;
      } else {
        // No sub-data — mark as leaf and clear children
        data.children = [];
        data.isLeaf = true;
        data.loaded = true;
      }

      // Force tree component update
      treeData.value = [...treeData.value];
    } catch (error) {
      data.children = [];
      data.isLeaf = true;
      data.loaded = true;
      treeData.value = [...treeData.value];
    }
  }
};

const handleNodeCollapse = (data: TreeNode, node: any) => {
};

// Flatten root, display contents directly
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. Sub-partitions first
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. Device nodes
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // add placeholder child
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. Map nodes — disabled for now
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
    
    // 4. View nodes — disabled for now
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
    // Use flatten helper, skip root
    treeData.value = flattenRootNodes(res.data.result);
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
    :deep(.el-input) {
      .el-input__wrapper {
        border-radius: 16px;
      }
    }
    :deep(.el-collapse) {
      border: 0;
      .el-collapse-item__header {
        background-color: #404040;
        border: 0;
        color: #fff;
        height: 48px;
        .liveview-colltitle{
          display: flex;
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
      
      // Online devices: full opacity
      &.device-online {
        opacity: 1;
      }
      
      // Offline devices: 0.6 opacity
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