<template>
  <div>
    <div class="grid-preview" :style="gridPreviewStyle">
      <div v-for="cell in previewGrid" :key="cell.id" class="grid-cell" :style="computeCellStyle(cell)">
        <div class="cell-edge top-edge"    @click="selectEdgeForMerge(cell, 'top')"></div>
        <div class="cell-edge right-edge"  @click="selectEdgeForMerge(cell, 'right')"></div>
        <div class="cell-edge bottom-edge" @click="selectEdgeForMerge(cell, 'bottom')"></div>
        <div class="cell-edge left-edge"   @click="selectEdgeForMerge(cell, 'left')"></div>
      </div>
    </div>
    <div class="control-panel">
      <div class="control-group">
        <span class="label">{{ t('Liveview.live_row') }}：</span>
        <el-input-number class="inputnumber" size="small" v-model="rows" controls-position="right" :min="1" :max="8" />
      </div>
      <div class="control-group">
        <span class="label">{{ t('Liveview.live_column') }}：</span>
        <el-input-number class="inputnumber" size="small" v-model="cols" controls-position="right" :min="1" :max="8" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface GridCell {
  id: string
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
  merged: boolean
  mergeGroup?: string[]
}

interface LayoutData {
  layoutType: string
  rows: number
  cols: number
  grid: Omit<GridCell, 'mergeGroup'>[]
}

const emit = defineEmits<{
  'get-layout-data': [data: LayoutData]
  'update-grid': [grid: GridCell[], layoutType: string]
}>()

const rows = ref(2)
const cols = ref(2)
const previewGrid = ref<GridCell[]>([])
const mergeSelections = ref<{ cell: GridCell; edge: string }[]>([])

const gridPreviewStyle = computed(() => ({
  display: 'grid',
  gridTemplateRows: `repeat(${rows.value}, 1fr)`,
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
}))

const generateGrid = () => {
  const newGrid: GridCell[] = []
  for (let row = 1; row <= rows.value; row++) {
    for (let col = 1; col <= cols.value; col++) {
      newGrid.push({ id: `${row}-${col}`, rowStart: row, rowEnd: row + 1, colStart: col, colEnd: col + 1, merged: false })
    }
  }
  previewGrid.value = newGrid
}

const computeCellStyle = (cell: GridCell) => ({
  'grid-row-start': cell.rowStart,
  'grid-row-end': cell.rowEnd,
  'grid-column-start': cell.colStart,
  'grid-column-end': cell.colEnd,
  backgroundColor: cell.merged ? '#888' : '#676767',
})

const checkHorizontalMerge = (a: GridCell, b: GridCell) =>
  a.rowStart === b.rowStart && a.rowEnd === b.rowEnd

const checkVerticalMerge = (a: GridCell, b: GridCell) =>
  a.colStart === b.colStart && a.colEnd === b.colEnd

const isAdjacentAndValid = (
  first: { cell: GridCell; edge: string },
  second: { cell: GridCell; edge: string }
) => {
  const { cell: fc, edge: fe } = first
  const { cell: sc, edge: se } = second
  if (fc.id === sc.id) return false
  if ((fe === 'right' && se === 'left') || (fe === 'left' && se === 'right')) {
    if (fc.colEnd === sc.colStart || fc.colStart === sc.colEnd)
      return checkHorizontalMerge(fc, sc)
  }
  if ((fe === 'bottom' && se === 'top') || (fe === 'top' && se === 'bottom')) {
    if (fc.rowEnd === sc.rowStart || fc.rowStart === sc.rowEnd)
      return checkVerticalMerge(fc, sc)
  }
  return false
}

const updateMergedCells = (cell: GridCell, rS: number, rE: number, cS: number, cE: number) => {
  cell.rowStart = rS; cell.rowEnd = rE; cell.colStart = cS; cell.colEnd = cE
  const group = new Set([...(cell.mergeGroup ?? []), cell.id])
  cell.mergeGroup = Array.from(group)
  previewGrid.value.forEach(g => { if (group.has(g.id)) g.mergeGroup = Array.from(group) })
}

const performMerge = (
  first: { cell: GridCell; edge: string },
  second: { cell: GridCell; edge: string }
) => {
  if (!isAdjacentAndValid(first, second)) return
  const { cell: fc } = first, { cell: sc } = second
  const rS = Math.min(fc.rowStart, sc.rowStart), rE = Math.max(fc.rowEnd, sc.rowEnd)
  const cS = Math.min(fc.colStart, sc.colStart), cE = Math.max(fc.colEnd, sc.colEnd)
  updateMergedCells(fc, rS, rE, cS, cE)
  updateMergedCells(sc, rS, rE, cS, cE)
  fc.merged = true; sc.merged = true
}

const selectEdgeForMerge = (cell: GridCell, edge: string) => {
  if (mergeSelections.value.length === 0) {
    mergeSelections.value.push({ cell, edge })
  } else {
    const prev = mergeSelections.value[0]
    if (isAdjacentAndValid(prev, { cell, edge })) {
      performMerge(prev, { cell, edge })
      mergeSelections.value = []
    } else {
      mergeSelections.value = [{ cell, edge }]
    }
  }
}

/** Called by parent to emit the current layout */
const getLayoutData = () => {
  const cleanedGrid = previewGrid.value.map(({ id, rowStart, rowEnd, colStart, colEnd, merged }) =>
    ({ id, rowStart, rowEnd, colStart, colEnd, merged })
  )
  emit('get-layout-data', { layoutType: `${rows.value}|${cols.value}`, rows: rows.value, cols: cols.value, grid: cleanedGrid })
}

/** Reset to default 2×2 */
const resetToDefault = () => {
  rows.value = 2; cols.value = 2
  mergeSelections.value = []
  generateGrid()
}

defineExpose({ getLayoutData, resetToDefault })

watch(rows, generateGrid)
watch(cols, generateGrid)
onMounted(generateGrid)
</script>

<style scoped>
.grid-preview {
  border: 1px solid #232323;
  margin-top: 10px;
  width: 100%;
  height: 300px;
  display: grid;
  gap: 5px;
}
.control-panel {
  display: flex;
  padding: 10px;
  justify-content: space-between;
}
.control-group {
  display: flex;
  align-items: center;
  margin-right: 20px;
}
.label {
  font-size: 12px;
  margin-right: 10px;
  white-space: nowrap;
}
.grid-cell {
  border: 1px solid #232323;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cell-edge {
  position: absolute;
  background-color: #232323;
  cursor: pointer;
}
.cell-edge:hover { background-color: #fedb03; }
.top-edge    { top: 0; left: 0; right: 0; height: 3px; }
.right-edge  { right: 0; top: 0; bottom: 0; width: 3px; }
.bottom-edge { bottom: 0; left: 0; right: 0; height: 3px; }
.left-edge   { left: 0; top: 0; bottom: 0; width: 3px; }
</style>
