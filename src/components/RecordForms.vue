<script setup>
import { computed, reactive, ref } from 'vue'
import { BLOOM_STATES, CARE_TYPES } from '../constants/garden'
import { formatDate, todayISO } from '../utils/date'

const props = defineProps({
  plants: {
    type: Array,
    required: true,
  },
  careRecords: {
    type: Array,
    required: true,
  },
  growthRecords: {
    type: Array,
    required: true,
  },
  pestRecords: {
    type: Array,
    required: true,
  },
})
const emit = defineEmits([
  'care',
  'update-care',
  'delete-care',
  'growth',
  'update-growth',
  'delete-growth',
  'pest',
  'update-pest',
  'delete-pest',
])

const firstPlantId = computed(() => props.plants[0]?.id || '')
const care = reactive({ plantId: '', date: todayISO(), type: '浇水', amount: '', note: '', photo: '' })
const growth = reactive({ plantId: '', date: todayISO(), height: 0, leafCount: 0, bloomState: '未开花' })
const pest = reactive({ plantId: '', date: todayISO(), symptom: '', treatment: '', recovery: '' })
const editingCareId = ref('')
const editingGrowthId = ref('')
const editingPestId = ref('')

const sortedCareRecords = computed(() =>
  [...props.careRecords].sort((a, b) => b.date.localeCompare(a.date)),
)
const sortedGrowthRecords = computed(() =>
  [...props.growthRecords].sort((a, b) => b.date.localeCompare(a.date)),
)
const sortedPestRecords = computed(() =>
  [...props.pestRecords].sort((a, b) => b.date.localeCompare(a.date)),
)

function ensurePlantId(form) {
  if (!form.plantId) form.plantId = firstPlantId.value
}

function plantName(plantId) {
  return props.plants.find((plant) => plant.id === plantId)?.name || '已删除植物'
}

function submitCare() {
  ensurePlantId(care)
  if (!care.plantId) return

  const payload = { ...care }
  if (editingCareId.value) emit('update-care', editingCareId.value, payload)
  else emit('care', payload)

  editingCareId.value = ''
  care.amount = ''
  care.note = ''
  care.photo = ''
}

function editCare(record) {
  editingCareId.value = record.id
  Object.assign(care, {
    plantId: record.plantId,
    date: record.date,
    type: record.type,
    amount: record.amount || '',
    note: record.note || '',
    photo: record.photo || '',
  })
}

function cancelCareEdit() {
  editingCareId.value = ''
  care.amount = ''
  care.note = ''
  care.photo = ''
}

function removeCare(record) {
  if (window.confirm(`确定删除 ${formatDate(record.date)} 的${record.type}记录吗？`)) {
    emit('delete-care', record.id)
    if (editingCareId.value === record.id) cancelCareEdit()
  }
}

function submitGrowth() {
  ensurePlantId(growth)
  if (!growth.plantId) return

  const payload = { ...growth }
  if (editingGrowthId.value) emit('update-growth', editingGrowthId.value, payload)
  else emit('growth', payload)

  editingGrowthId.value = ''
  growth.height = 0
  growth.leafCount = 0
}

function editGrowth(record) {
  editingGrowthId.value = record.id
  Object.assign(growth, {
    plantId: record.plantId,
    date: record.date,
    height: record.height || 0,
    leafCount: record.leafCount || 0,
    bloomState: record.bloomState,
  })
}

function cancelGrowthEdit() {
  editingGrowthId.value = ''
  growth.height = 0
  growth.leafCount = 0
}

function removeGrowth(record) {
  if (window.confirm(`确定删除 ${formatDate(record.date)} 的生长指标吗？`)) {
    emit('delete-growth', record.id)
    if (editingGrowthId.value === record.id) cancelGrowthEdit()
  }
}

function submitPest() {
  ensurePlantId(pest)
  if (!pest.plantId || !pest.symptom.trim()) return

  const payload = { ...pest, symptom: pest.symptom.trim() }
  if (editingPestId.value) emit('update-pest', editingPestId.value, payload)
  else emit('pest', payload)

  editingPestId.value = ''
  pest.symptom = ''
  pest.treatment = ''
  pest.recovery = ''
}

function editPest(record) {
  editingPestId.value = record.id
  Object.assign(pest, {
    plantId: record.plantId,
    date: record.date,
    symptom: record.symptom,
    treatment: record.treatment || '',
    recovery: record.recovery || '',
  })
}

function cancelPestEdit() {
  editingPestId.value = ''
  pest.symptom = ''
  pest.treatment = ''
  pest.recovery = ''
}

function removePest(record) {
  if (window.confirm(`确定删除 ${formatDate(record.date)} 的病虫害记录吗？`)) {
    emit('delete-pest', record.id)
    if (editingPestId.value === record.id) cancelPestEdit()
  }
}

function handlePhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    care.photo = reader.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <section class="records-grid">
    <form class="panel compact-form" @submit.prevent="submitCare">
      <div class="panel-heading">
        <h2>{{ editingCareId ? '修改养护记录' : '养护操作' }}</h2>
      </div>
      <select v-model="care.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="care.date" type="date" />
      <select v-model="care.type">
        <option v-for="item in CARE_TYPES" :key="item">{{ item }}</option>
      </select>
      <input v-model="care.amount" placeholder="用量或备注" />
      <textarea v-model="care.note" rows="3" placeholder="养护细节"></textarea>
      <input accept="image/*" type="file" @change="handlePhoto" />
      <img v-if="care.photo" class="record-photo-preview" :src="care.photo" alt="养护记录照片" />
      <div class="form-actions">
        <button class="secondary-action" type="submit">{{ editingCareId ? '保存修改' : '记录养护' }}</button>
        <button v-if="editingCareId" class="cancel-action" type="button" @click="cancelCareEdit">取消</button>
      </div>

      <div class="record-list">
        <h3>已有记录</h3>
        <p v-if="!sortedCareRecords.length" class="record-empty">暂无养护记录</p>
        <article v-for="record in sortedCareRecords" :key="record.id" class="record-item">
          <div class="record-content">
            <time>{{ formatDate(record.date) }}</time>
            <strong>{{ record.type }} · {{ plantName(record.plantId) }}</strong>
            <p>{{ record.note || record.amount || '已记录养护操作' }}</p>
          </div>
          <div class="record-actions">
            <button type="button" @click="editCare(record)">修改</button>
            <button class="danger-action" type="button" @click="removeCare(record)">删除</button>
          </div>
        </article>
      </div>
    </form>

    <form class="panel compact-form" @submit.prevent="submitGrowth">
      <div class="panel-heading">
        <h2>{{ editingGrowthId ? '修改生长指标' : '生长指标' }}</h2>
      </div>
      <select v-model="growth.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="growth.date" type="date" />
      <input v-model.number="growth.height" min="0" type="number" placeholder="高度 cm" />
      <input v-model.number="growth.leafCount" min="0" type="number" placeholder="叶片数" />
      <select v-model="growth.bloomState">
        <option v-for="item in BLOOM_STATES" :key="item">{{ item }}</option>
      </select>
      <div class="form-actions">
        <button class="secondary-action" type="submit">{{ editingGrowthId ? '保存修改' : '记录指标' }}</button>
        <button v-if="editingGrowthId" class="cancel-action" type="button" @click="cancelGrowthEdit">取消</button>
      </div>

      <div class="record-list">
        <h3>已有记录</h3>
        <p v-if="!sortedGrowthRecords.length" class="record-empty">暂无生长指标</p>
        <article v-for="record in sortedGrowthRecords" :key="record.id" class="record-item">
          <div class="record-content">
            <time>{{ formatDate(record.date) }}</time>
            <strong>{{ plantName(record.plantId) }}</strong>
            <p>高度 {{ record.height || 0 }} cm · 叶片 {{ record.leafCount || 0 }} 片 · {{ record.bloomState }}</p>
          </div>
          <div class="record-actions">
            <button type="button" @click="editGrowth(record)">修改</button>
            <button class="danger-action" type="button" @click="removeGrowth(record)">删除</button>
          </div>
        </article>
      </div>
    </form>

    <form class="panel compact-form" @submit.prevent="submitPest">
      <div class="panel-heading">
        <h2>{{ editingPestId ? '修改病虫害记录' : '病虫害记录' }}</h2>
      </div>
      <select v-model="pest.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="pest.date" type="date" />
      <textarea v-model="pest.symptom" required rows="3" placeholder="症状"></textarea>
      <textarea v-model="pest.treatment" rows="3" placeholder="处理方法"></textarea>
      <textarea v-model="pest.recovery" rows="3" placeholder="恢复情况"></textarea>
      <div class="form-actions">
        <button class="secondary-action" type="submit">{{ editingPestId ? '保存修改' : '保存记录' }}</button>
        <button v-if="editingPestId" class="cancel-action" type="button" @click="cancelPestEdit">取消</button>
      </div>

      <div class="record-list">
        <h3>已有记录</h3>
        <p v-if="!sortedPestRecords.length" class="record-empty">暂无病虫害记录</p>
        <article v-for="record in sortedPestRecords" :key="record.id" class="record-item">
          <div class="record-content">
            <time>{{ formatDate(record.date) }}</time>
            <strong>{{ plantName(record.plantId) }}</strong>
            <p>{{ record.symptom }}；{{ record.recovery || '恢复情况待观察' }}</p>
          </div>
          <div class="record-actions">
            <button type="button" @click="editPest(record)">修改</button>
            <button class="danger-action" type="button" @click="removePest(record)">删除</button>
          </div>
        </article>
      </div>
    </form>
  </section>
</template>
