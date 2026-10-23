import { DISK_USAGE_UPDATED } from '../actions/DiskUsageActions'
import GlobalReducer from './GlobalReducer'

const diskUsageData = {
    coverage: 'captain-node' as const,
    nodes: [],
}

describe('disk usage state', () => {
    it('stores a successful refresh', () => {
        const loadedState = GlobalReducer(undefined, {
            type: DISK_USAGE_UPDATED,
            payload: { data: diskUsageData, isLoading: false },
        })

        expect(loadedState.diskUsage).toEqual({
            data: diskUsageData,
            isLoading: false,
            refreshFailed: false,
        })
    })

    it('preserves the previous reading when a refresh fails', () => {
        const previousState = {
            diskUsage: {
                data: diskUsageData,
                isLoading: true,
                refreshFailed: false,
            },
        }
        const failedState = GlobalReducer(previousState, {
            type: DISK_USAGE_UPDATED,
            payload: { isLoading: false, refreshFailed: true },
        })

        expect(failedState.diskUsage).toEqual({
            data: diskUsageData,
            isLoading: false,
            refreshFailed: true,
        })
    })
})
