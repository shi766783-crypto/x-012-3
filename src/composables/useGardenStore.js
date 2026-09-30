import { computed, reactive, watch } from 'vue'
import { DEFAULT_GOALS } from '../constants/garden'
import { todayISO } from '../utils/date'
import { loadGardenState, saveGardenState } from '../services/storage'
import {
  buildLeaderboards,
  buildTimeline,
  calculateAchievements,
  createId,
  getDashboard,
  getDueWateringPlants,
  getLastWateredDate,
  getWateringStatus,
  updateWateringGoal,
} from '../services/gardenRules'

const demoState = {
  plants: [
    {
      id: 'plant-demo-1',
      name: '琴叶榕',
      variety: 'Ficus lyrata',
      category: '观叶',
      location: '客厅',
      lightNeed: '半阴',
      wateringFrequency: 4,
      fertilizerFrequency: 30,
      purchaseDate: '2026-08-18',
      lastWateredDate: '2026-09-12',
      potSize: '28cm 陶盆',
      soilType: '泥炭土混合珍珠岩',
      photo: '',
      alive: true,
    },
    {
      id: 'plant-demo-2',
      name: '蓝雪花',
      variety: 'Plumbago auriculata',
      category: '观花',
      location: '阳台',
      lightNeed: '全阳',
      wateringFrequency: 2,
      fertilizerFrequency: 14,
      purchaseDate: '2026-07-02',
      lastWateredDate: '2026-09-13',
      potSize: '20cm 加仑盆',
      soilType: '通用营养土',
      photo: '',
      alive: true,
    },
  ],
  careRecords: [
    {
      id: 'care-demo-1',
      plantId: 'plant-demo-2',
      date: '2026-09-14',
      type: '施肥',
      amount: '缓释肥 5g',
      note: '花量增加，叶色正常',
      photo: '',
    },
    {
      id: 'care-demo-2',
      plantId: 'plant-demo-1',
      date: '2026-09-12',
      type: '浇水',
      amount: '约 600ml',
      note: '盆底少量出水',
      photo: '',
    },
  ],
  growthRecords: [
    {
      id: 'growth-demo-1',
      plantId: 'plant-demo-1',
      date: '2026-08-20',
      height: 82,
      leafCount: 14,
      bloomState: '未开花',
    },
    {
      id: 'growth-demo-2',
      plantId: 'plant-demo-1',
      date: '2026-09-10',
      height: 88,
      leafCount: 17,
      bloomState: '未开花',
    },
    {
      id: 'growth-demo-3',
      plantId: 'plant-demo-2',
      date: '2026-09-08',
      height: 45,
      leafCount: 56,
      bloomState: '盛开',
    },
  ],
  pestRecords: [],
  goals: DEFAULT_GOALS,
}

export function useGardenStore() {
  const storedState = loadGardenState()
  const state = reactive(storedState || demoState)

  const plantsWithStatus = computed(() =>
    state.plants.map((plant) => ({ ...plant, wateringStatus: getWateringStatus(plant) })),
  )
  const dueWateringPlants = computed(() => getDueWateringPlants(state.plants))
  const dashboard = computed(() => getDashboard(state.plants, state.careRecords, state.growthRecords))
  const goals = computed(() => updateWateringGoal(state.goals, state.careRecords))
  const achievements = computed(() =>
    calculateAchievements(state.plants, state.careRecords, state.growthRecords, state.pestRecords, goals.value),
  )
  const leaderboards = computed(() => buildLeaderboards(state.plants, state.careRecords, state.growthRecords))

  watch(
    state,
    () => {
      saveGardenState({ ...state, goals: goals.value })
    },
    { deep: true },
  )

  function addPlant(payload) {
    state.plants.unshift({
      ...payload,
      id: createId('plant'),
      lastWateredDate: payload.lastWateredDate || payload.purchaseDate || todayISO(),
      alive: true,
    })
  }

  // 浇水记录变动后，按剩余养护记录重算对应植物的上次浇水日期。
  // 这是待浇水提醒、逾期状态、连续天数立即回到正确值的关键。
  function recalcPlantWateringDate(plantId) {
    const plant = state.plants.find((item) => item.id === plantId)
    if (!plant) return
    plant.lastWateredDate = getLastWateredDate(plant, state.careRecords)
  }

  function addCareRecord(payload) {
    const record = { ...payload, id: createId('care') }
    state.careRecords.unshift(record)

    if (record.type === '浇水') recalcPlantWateringDate(record.plantId)
  }

  function updateCareRecord(id, payload) {
    const index = state.careRecords.findIndex((record) => record.id === id)
    if (index === -1) return
    const old = state.careRecords[index]
    state.careRecords[index] = { ...old, ...payload, id }

    // 浇水记录的日期、类型或所属植物变化后，相关植物的上次浇水日期都要重算。
    recalcPlantWateringDate(old.plantId)
    if (old.plantId !== state.careRecords[index].plantId) {
      recalcPlantWateringDate(state.careRecords[index].plantId)
    }
  }

  function deleteCareRecord(id) {
    const record = state.careRecords.find((item) => item.id === id)
    state.careRecords = state.careRecords.filter((item) => item.id !== id)
    if (record?.type === '浇水') recalcPlantWateringDate(record.plantId)
  }

  function addGrowthRecord(payload) {
    state.growthRecords.unshift({ ...payload, id: createId('growth') })
  }

  function updateGrowthRecord(id, payload) {
    const index = state.growthRecords.findIndex((record) => record.id === id)
    if (index === -1) return
    state.growthRecords[index] = { ...state.growthRecords[index], ...payload, id }
  }

  function deleteGrowthRecord(id) {
    state.growthRecords = state.growthRecords.filter((record) => record.id !== id)
  }

  function addPestRecord(payload) {
    state.pestRecords.unshift({ ...payload, id: createId('pest') })
  }

  function updatePestRecord(id, payload) {
    const index = state.pestRecords.findIndex((record) => record.id === id)
    if (index === -1) return
    state.pestRecords[index] = { ...state.pestRecords[index], ...payload, id }
  }

  function deletePestRecord(id) {
    state.pestRecords = state.pestRecords.filter((record) => record.id !== id)
  }

  function getPlantTimeline(plantId) {
    return buildTimeline(plantId, state.careRecords, state.growthRecords, state.pestRecords)
  }

  function getPlantGrowth(plantId) {
    return state.growthRecords
      .filter((record) => record.plantId === plantId)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  return {
    state,
    plantsWithStatus,
    dueWateringPlants,
    dashboard,
    goals,
    achievements,
    leaderboards,
    addPlant,
    addCareRecord,
    updateCareRecord,
    deleteCareRecord,
    addGrowthRecord,
    updateGrowthRecord,
    deleteGrowthRecord,
    addPestRecord,
    updatePestRecord,
    deletePestRecord,
    getPlantTimeline,
    getPlantGrowth,
  }
}
