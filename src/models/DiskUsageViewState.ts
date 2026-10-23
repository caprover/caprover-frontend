import { CapRoverModels } from 'caprover-api'

export default interface DiskUsageViewState {
    data?: CapRoverModels.DiskUsageResponse
    isLoading: boolean
    refreshFailed: boolean
}
