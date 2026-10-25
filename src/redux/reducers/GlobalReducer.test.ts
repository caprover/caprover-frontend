import { SetupStatus } from '../../models/SetupStatus'
import { DISK_USAGE_UPDATED } from '../actions/DiskUsageActions'
import GlobalReducer from './GlobalReducer'

const diskUsageData = {
    coverage: 'captain-node' as const,
    nodes: [
        {
            nodeId: 'node-1',
            hostname: 'captain-01',
            disks: [
                {
                    totalBytes: 40_000_000_000,
                    usedBytes: 36_800_000_000,
                    availableBytes: 3_200_000_000,
                    severity: 'warning' as const,
                },
            ],
        },
    ],
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
            setupStatus: SetupStatus.Loading,
            setupDismissed: false,
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
