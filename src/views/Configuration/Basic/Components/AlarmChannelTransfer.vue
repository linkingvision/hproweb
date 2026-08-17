<template>
  <div class="alarm-channel-transfer">
    <div class="channel-panel">
      <el-input v-model="sourceFilter" class="filter-input" :placeholder="t('Common.comm_filtration')">
        <template #prefix><i class="iconfont icon-sousuo1"></i></template>
      </el-input>
      <el-tree
        ref="sourceTreeRef"
        :data="sourceTree"
        node-key="uuid"
        show-checkbox
        highlight-current
        :props="treeProps"
        :filter-node-method="filterNode"
        :empty-text="t('CommTable.comm_no_data_available')"
        @check="onSourceCheck"
        @node-expand="onNodeExpand">
        <template #default="{ data }">
          <span class="tree-node-content">
            <i v-if="data.iconclass" :class="data.iconclass"></i>
            <span :class="data.iconclass4" :title="data.label || data.name">{{ data.label || data.name }}</span>
            <span v-if="data.length" class="node-count">{{ data.online }}/{{ data.length }}</span>
          </span>
        </template>
      </el-tree>
    </div>

    <div class="transfer-buttons">
      <button @click.prevent="addChannels"><i class="iconfont icon-youjiantou"></i></button>
      <button @click.prevent="removeChannels"><i class="iconfont icon-zuojiantou"></i></button>
    </div>

    <div class="channel-panel">
      <el-input v-model="targetFilter" class="filter-input" :placeholder="t('Common.comm_filtration')">
        <template #prefix><i class="iconfont icon-sousuo1"></i></template>
      </el-input>
      <el-tree
        ref="targetTreeRef"
        :data="selectedChannels"
        node-key="uuid"
        show-checkbox
        highlight-current
        :props="treeProps"
        :filter-node-method="filterNode"
        :empty-text="t('CommTable.comm_no_data_available')">
        <template #default="{ data }">
          <span class="tree-node-content">
            <i v-if="data.iconclass" :class="data.iconclass"></i>
            <span :class="data.iconclass4" :title="data.label || data.name">{{ data.label || data.name }}</span>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  isSelectableAlarmChannel,
  loadChildrenForNode,
  loadDevicePartitionTree,
  normalizeSelectedChannel,
  type DeviceTreeNode
} from '@/utils/devicesTree'

const props = defineProps<{
  modelValue: DeviceTreeNode[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DeviceTreeNode[]): void
}>()

const { t } = useI18n()

const sourceTree = ref<DeviceTreeNode[]>([])
const sourceTreeRef = ref<any>(null)
const targetTreeRef = ref<any>(null)
const sourceFilter = ref('')
const targetFilter = ref('')
const treeProps = { children: 'children', label: 'label' }

const selectedChannels = computed<DeviceTreeNode[]>({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

watch(sourceFilter, value => sourceTreeRef.value?.filter(value))
watch(targetFilter, value => targetTreeRef.value?.filter(value))

function filterNode(value: string, data: DeviceTreeNode, node: any) {
  if (!value) return true
  const label = data.label || data.name || ''
  if (label.includes(value)) return true
  let parent = node?.parent
  while (parent?.data) {
    const parentLabel = parent.data.label || parent.data.name || ''
    if (parentLabel.includes(value)) return true
    parent = parent.parent
  }
  return false
}

function hasEmptyChild(data: DeviceTreeNode) {
  return !!data.children?.[0]?.EmptyItem
}

async function ensureNodeChildren(data: DeviceTreeNode) {
  if (!hasEmptyChild(data)) return
  data.children = []
  try {
    data.children = await loadChildrenForNode(data)
  } catch {
    data.children = []
  }
}

async function onSourceCheck(data: DeviceTreeNode) {
  await ensureNodeChildren(data)
}

async function onNodeExpand(data: DeviceTreeNode) {
  await ensureNodeChildren(data)
}

function addChannels() {
  const checkedNodes = sourceTreeRef.value?.getCheckedNodes?.() ?? []
  const next = [...selectedChannels.value]
  for (const node of checkedNodes as DeviceTreeNode[]) {
    if (!isSelectableAlarmChannel(node)) continue
    if (!next.some(item => item.uuid === node.uuid)) {
      next.push(normalizeSelectedChannel(node))
    }
  }
  selectedChannels.value = next
}

function removeChannels() {
  const checkedNodes = targetTreeRef.value?.getCheckedNodes?.() ?? []
  if (!checkedNodes.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 3000 })
    return
  }
  const removeUuid = new Set((checkedNodes as DeviceTreeNode[]).map(item => item.uuid))
  selectedChannels.value = selectedChannels.value.filter(item => !removeUuid.has(item.uuid))
  targetTreeRef.value?.setCheckedKeys?.([])
}

onMounted(async () => {
  try {
    sourceTree.value = await loadDevicePartitionTree()
  } catch {
    sourceTree.value = []
  }
})
</script>

<style lang="scss" scoped>
.alarm-channel-transfer {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 900px;
  margin-right: 0;
  padding-right: 0;

  .channel-panel {
    width: 447px;
    height: 496px;
    padding: 10px;
    border: 1px solid rgba(218, 218, 218, 0.2);
    border-radius: 4px;
    background-color: #1b1b1b;
    overflow: auto;

    .filter-input {
      margin-bottom: 8px;
    }

    .el-tree {
      min-width: 300px;
      background: transparent;
    }
  }

  .transfer-buttons {
    width: 10%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;

    button {
      width: 40px;
      min-width: 40px;
      height: 40px;
      border-radius: 4px;
      border: 1px solid #0399fe;
      color: #0399fe;
      background: transparent;
      cursor: pointer;
    }
  }

  .tree-node-content {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: 100%;

    i {
      font-size: 14px;
    }

    .node-count {
      padding-left: 4px;
    }
  }
}
</style>
