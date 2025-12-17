import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ExperimentData {
  id: string
  name: string
  type: string
  parameters: Record<string, any>
  results: any[]
  timestamp: number
}

export const useExperimentStore = defineStore('experiment', () => {
  const experiments = ref<ExperimentData[]>([])
  const currentExperiment = ref<ExperimentData | null>(null)

  function addExperiment(experiment: ExperimentData) {
    experiments.value.push(experiment)
  }

  function updateExperiment(id: string, data: Partial<ExperimentData>) {
    const index = experiments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      experiments.value[index] = { ...experiments.value[index], ...data } as ExperimentData
    }
  }

  function deleteExperiment(id: string) {
    const index = experiments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      experiments.value.splice(index, 1)
    }
  }

  function setCurrentExperiment(experiment: ExperimentData | null) {
    currentExperiment.value = experiment
  }

  return {
    experiments,
    currentExperiment,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    setCurrentExperiment
  }
})
