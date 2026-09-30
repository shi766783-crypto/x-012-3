<script setup>
import { reactive, ref } from 'vue'
import GrowthCanvas from './GrowthCanvas.vue'
import { BLOOM_STATES, CARE_TYPES } from '../constants/garden'
import { formatDate } from '../utils/date'

defineProps({
  plants: {
    type: Array,
    required: true,
  },
  careRecords: {
    type: Array,
    required: true,
  },
  achievements: {
    type: Object,
    required: true,
  },
  getPlantTimeline: {
    type: Function,
    required: true,
  },
  getPlantGrowth: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update-record', 'delete-record'])

const editingId = ref('')
const editForm = reactive({})

function startEdit(item) {
  editingId.value = item.id
  if (item.kind === 'care') {
    Object.assign(editForm, {
      date: item.raw.date,
      type: item.raw.type,
      amount: item.raw.amount || '',
      note: item.raw.note || '',
    })
  } else if (item.kind === 'growth') {
    Object.assign(editForm, {
      date: item.raw.date,
      height: item.raw.height || 0,
      leafCount: item.raw.leafCount || 0,
      bloomState: item.raw.bloomState,
    })
  } else if (item.kind === 'pest') {
    Object.assign(editForm, {
      date: item.raw.date,
      symptom: item.raw.symptom || '',
      treatment: item.raw.treatment || '',
      recovery: item.raw.recovery || '',
    })
  }
}

function cancelEdit() {
  editingId.value = ''
}

function saveEdit(item) {
  emit('update-record', { kind: item.kind, id: item.id, payload: { ...editForm } })
  editingId.value = ''
}

function confirmDelete(item) {
  if (window.confirm('确定删除这条记录吗？此操作不可撤销。')) {
    emit('delete-record', { kind: item.kind, id: item.id })
  }
}
</script>

<template>
  <section class="panel profile-panel">
    <div class="panel-heading">
      <h2>个人中心</h2>
      <span>{{ achievements.points }} 积分</span>
    </div>

    <div class="profile-layout">
      <aside>
        <h3>我的植物列表</h3>
        <ul class="simple-list">
          <li v-for="plant in plants" :key="plant.id">{{ plant.name }} · {{ plant.location }}</li>
        </ul>

        <h3>最近养护记录</h3>
        <ul class="simple-list">
          <li v-for="record in careRecords.slice(0, 6)" :key="record.id">
            {{ formatDate(record.date) }} · {{ record.type }}
          </li>
        </ul>
      </aside>

      <div class="profile-main">
        <article v-for="plant in plants" :key="plant.id" class="plant-detail">
          <div class="plant-detail-heading">
            <h3>{{ plant.name }}生长曲线</h3>
            <span>{{ getPlantGrowth(plant.id).length }} 条指标</span>
          </div>
          <GrowthCanvas :records="getPlantGrowth(plant.id)" />
          <div class="timeline">
            <div v-for="item in getPlantTimeline(plant.id).slice(0, 5)" :key="item.id" class="timeline-item">
              <template v-if="editingId === item.id">
                <div class="timeline-edit">
                  <input v-model="editForm.date" type="date" />
                  <template v-if="item.kind === 'care'">
                    <select v-model="editForm.type">
                      <option v-for="type in CARE_TYPES" :key="type" :value="type">{{ type }}</option>
                    </select>
                    <input v-model="editForm.amount" placeholder="用量或备注" />
                    <textarea v-model="editForm.note" rows="2" placeholder="养护细节"></textarea>
                  </template>
                  <template v-else-if="item.kind === 'growth'">
                    <input v-model.number="editForm.height" min="0" type="number" placeholder="高度 cm" />
                    <input v-model.number="editForm.leafCount" min="0" type="number" placeholder="叶片数" />
                    <select v-model="editForm.bloomState">
                      <option v-for="state in BLOOM_STATES" :key="state" :value="state">{{ state }}</option>
                    </select>
                  </template>
                  <template v-else-if="item.kind === 'pest'">
                    <textarea v-model="editForm.symptom" rows="2" placeholder="症状"></textarea>
                    <textarea v-model="editForm.treatment" rows="2" placeholder="处理方法"></textarea>
                    <textarea v-model="editForm.recovery" rows="2" placeholder="恢复情况"></textarea>
                  </template>
                  <div class="timeline-edit-actions">
                    <button class="secondary-action" type="button" @click="saveEdit(item)">保存</button>
                    <button class="secondary-action" type="button" @click="cancelEdit">取消</button>
                  </div>
                </div>
              </template>
              <template v-else>
                <time>{{ formatDate(item.date) }}</time>
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
                <div class="timeline-actions">
                  <button type="button" @click="startEdit(item)">编辑</button>
                  <button type="button" @click="confirmDelete(item)">删除</button>
                </div>
              </template>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
