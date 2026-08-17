import {
  GetAccessDeviceApi,
  GetCascadeHierarchyApi,
  GetDevPartitionListApi,
  GetDeviceChannelsByTokenApi
} from '@/api/configuration/alarmConfig'

export interface DeviceTreeNode {
  uuid: string
  token?: string
  label?: string
  name?: string
  type?: string
  DifferentType?: string
  children?: DeviceTreeNode[]
  EmptyItem?: number
  iconclass?: string
  iconclass4?: string
  enabled?: boolean
  online?: boolean | number
  length?: number
  gbId?: string
  rootToken?: string
  casPartitionId?: string
  accessDevId?: string | number
  [key: string]: any
}

let emptyId = 0

function emptyNode(): DeviceTreeNode {
  emptyId += 1
  return { uuid: `empty-${emptyId}`, EmptyItem: 1 }
}

function responseResult(res: any) {
  return res?.data?.result ?? res?.result ?? []
}

function normalizeChannel(channel: any, type = 'devChannel'): DeviceTreeNode {
  return {
    ...channel,
    uuid: channel.uuid ?? channel.token,
    token: channel.token,
    label: channel.label ?? channel.name,
    name: channel.name ?? channel.label,
    type: channel.type,
    DifferentType: type,
    enabled: channel.enabled,
    online: channel.online,
    parentToken: channel.parentToken,
    iconclass: channel.enabled === false
      ? 'iconfont icon-xiangjijinyong el-tree-camera'
      : channel.online === false
        ? 'iconfont icon-shexiangjilixian el-tree-camera'
        : 'iconfont icon-shexiangji-zaixian',
    iconclass4: channel.online === false || channel.enabled === false ? 'el-tree-camera' : '',
    children: []
  }
}

function normalizeDevice(device: any): DeviceTreeNode {
  return {
    ...device,
    uuid: device.token,
    token: device.token,
    label: device.name,
    type: device.type,
    DifferentType: 'dev',
    enabled: device.enabled,
    online: device.online,
    iconclass: device.online === false ? 'iconfont icon-Devicelixian el-tree-camera' : 'iconfont icon-Device',
    iconclass4: device.online === false ? 'el-tree-camera' : '',
    children: [emptyNode()]
  }
}

function normalizeCascadeDevice(device: any): DeviceTreeNode {
  return {
    ...device,
    uuid: device.token,
    token: device.token,
    label: device.name,
    type: device.casType ?? device.type,
    DifferentType: 'casDev',
    enabled: device.enabled,
    online: device.online,
    gbId: device.gbId,
    iconclass: device.online === false ? 'iconfont icon-Devicelixian el-tree-camera' : 'iconfont icon-Device',
    iconclass4: device.online === false ? 'el-tree-camera' : '',
    children: [emptyNode()]
  }
}

function normalizeAccessDevice(device: any): DeviceTreeNode {
  return {
    ...device,
    uuid: device.uuid ?? device.accessToken,
    token: device.accessToken ?? device.token,
    label: device.name,
    type: device.type,
    DifferentType: 'accessDev',
    enabled: device.enabled,
    online: device.online,
    accessDevId: device.accessDevId,
    iconclass: device.online === false ? 'iconfont icon-Devicelixian el-tree-camera' : 'iconfont icon-Device',
    iconclass4: device.online === false ? 'el-tree-camera' : '',
    children: [emptyNode()]
  }
}

function normalizeMap(map: any): DeviceTreeNode {
  return {
    ...map,
    uuid: map.uuid,
    token: map.mapId,
    label: map.mapName,
    type: map.type,
    DifferentType: 'map',
    iconclass: 'iconfont icon-ditu'
  }
}

function normalizeView(view: any): DeviceTreeNode {
  return {
    ...view,
    uuid: view.uuid,
    token: view.viewId,
    label: view.viewName,
    type: view.viewType,
    DifferentType: 'view',
    iconclass: 'iconfont icon-shitu2'
  }
}

function nodeTypeOrder(node: DeviceTreeNode) {
  const order: Record<string, number> = {
    PartitionNode: 0,
    dev: 1,
    casDev: 2,
    map: 3,
    view: 4,
    accessDev: 5,
  }
  return order[node.DifferentType ?? ''] ?? 99
}

function sortByOrder(nodes: DeviceTreeNode[]) {
  return nodes.sort((a, b) => {
    const typeDiff = nodeTypeOrder(a) - nodeTypeOrder(b)
    if (typeDiff !== 0) return typeDiff
    return Number(a.disOrder ?? 0) - Number(b.disOrder ?? 0)
  })
}

function normalizePartition(item: any, isRoot = false): DeviceTreeNode {
  const node: DeviceTreeNode = {
    ...item,
    uuid: item.uuid,
    label: item.devPartitionName ?? item.label,
    iconclass: 'iconfont icon-gen',
    DifferentType: isRoot ? 'Root' : 'PartitionNode',
    children: []
  }

  if (Array.isArray(item.children)) {
    node.children!.push(...item.children.map((child: any) => normalizePartition(child)))
  }
  if (Array.isArray(item.dev)) {
    node.children!.push(...item.dev.map(normalizeDevice))
  }
  if (Array.isArray(item.casDev)) {
    node.children!.push(...item.casDev.map(normalizeCascadeDevice))
  }
  if (Array.isArray(item.map)) {
    node.children!.push(...item.map.map(normalizeMap))
  }
  if (Array.isArray(item.view)) {
    node.children!.push(...item.view.map(normalizeView))
  }
  if (Array.isArray(item.accessDev)) {
    node.children!.push(...item.accessDev.map(normalizeAccessDevice))
  }

  node.children = sortByOrder(node.children ?? [])
  return node
}

function normalizeCascadePartition(item: any): DeviceTreeNode {
  const node: DeviceTreeNode = {
    ...item,
    uuid: item.uuid ?? item.token ?? item.gbId,
    token: item.token ?? item.gbId,
    rootToken: item.rootToken,
    casPartitionId: item.casPartitionId ?? item.token,
    gbId: item.gbId,
    label: item.label ?? item.name ?? item.casPartitionName,
    DifferentType: 'CasDevChildren',
    iconclass: 'iconfont icon-gen',
    children: []
  }
  if (Array.isArray(item.children)) node.children!.push(...item.children.map(normalizeCascadePartition))
  if (Array.isArray(item.chan)) node.children!.push(...item.chan.map((chan: any) => normalizeChannel(chan, 'CasDevChannel')))
  return node
}

function normalizeCascadeResult(result: any): DeviceTreeNode[] {
  const source = Array.isArray(result) ? result : [result]
  const nodes: DeviceTreeNode[] = []
  for (const item of source.filter(Boolean)) {
    if (Array.isArray(item.children)) nodes.push(...item.children.map(normalizeCascadePartition))
    if (Array.isArray(item.chan)) nodes.push(...item.chan.map((chan: any) => normalizeChannel(chan, 'CasDevChannel')))
    if (!item.children && !item.chan && (item.name || item.label || item.uuid || item.token)) {
      nodes.push(normalizeCascadePartition(item))
    }
  }
  return nodes
}

export function isSelectableAlarmChannel(node: DeviceTreeNode) {
  return node.DifferentType === 'devChannel' || node.DifferentType === 'CasDevChannel'
}

export async function loadDevicePartitionTree() {
  const res = await GetDevPartitionListApi()
  const result = responseResult(res)
  return Array.isArray(result) ? result.map((item: any) => normalizePartition(item, true)) : []
}

export async function loadChildrenForNode(node: DeviceTreeNode) {
  if (!node?.token) return []

  if (node.gbId || node.casPartitionId || node.rootToken) {
    const token = node.gbId || node.rootToken || node.token
    const casToken = node.gbId ? undefined : node.token
    const res = await GetCascadeHierarchyApi(String(token), casToken ? String(casToken) : undefined)
    return normalizeCascadeResult(responseResult(res))
  }

  if (node.accessDevId) {
    const res = await GetAccessDeviceApi(node.accessDevId)
    const result = responseResult(res)
    if (Array.isArray(result)) return result.map((item: any) => normalizePartition(item, true))
    return normalizePartition(result, true).children ?? []
  }

  const res = await GetDeviceChannelsByTokenApi(node.token)
  const result = responseResult(res)
  return Array.isArray(result) ? result.map((item: any) => normalizeChannel(item)) : []
}

export function normalizeSelectedChannel(channel: any): DeviceTreeNode {
  return {
    ...channel,
    uuid: channel.uuid,
    token: channel.token,
    label: channel.label ?? channel.name,
    name: channel.name ?? channel.label,
    DifferentType: channel.DifferentType ?? 'devChannel',
    iconclass: channel.iconclass ?? 'iconfont icon-shexiangji-zaixian',
    children: []
  }
}
