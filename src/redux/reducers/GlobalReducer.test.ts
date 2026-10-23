import {
    DISK_USAGE_REFRESH_FAILED,
    DISK_USAGE_REFRESH_STARTED,
    DISK_USAGE_REFRESH_SUCCEEDED,
} from '../actions/DiskUsageActions'
import GlobalReducer from './GlobalReducer'

const diskUsageData = {
    coverage: 'captain-node',
    nodes: [],
}

describe('disk usage state', () => {
    it('stores a successful refresh', () => {
        const loadingState = GlobalReducer(undefined, {
            type: DISK_USAGE_REFRESH_STARTED,
            payload: { requestId: 1 },
        })
        const loadedState = GlobalReducer(loadingState, {
            type: DISK_USAGE_REFRESH_SUCCEEDED,
            payload: { requestId: 1, data: diskUsageData },
        })

        expect(loadedState.diskUsage).toEqual({
            data: diskUsageData,
            isLoading: false,
            refreshFailed: false,
        })
    })

    it('preserves the previous reading when a refresh fails', () => {
        const previousState = {
            diskUsageRequestId: 2,
            diskUsage: {
                data: diskUsageData,
                isLoading: true,
                refreshFailed: false,
            },
        }
        const failedState = GlobalReducer(previousState, {
            type: DISK_USAGE_REFRESH_FAILED,
            payload: { requestId: 2 },
        })

        expect(failedState.diskUsage).toEqual({
            data: diskUsageData,
            isLoading: false,
            refreshFailed: true,
        })
    })

    it('ignores a response from an older request', () => {
        const currentState = {
            diskUsageRequestId: 3,
            diskUsage: {
                data: undefined,
                isLoading: true,
                refreshFailed: false,
            },
        }

        expect(
            GlobalReducer(currentState, {
                type: DISK_USAGE_REFRESH_SUCCEEDED,
                payload: { requestId: 2, data: diskUsageData },
            })
        ).toBe(currentState)
    })
})
