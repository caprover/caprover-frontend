import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'
import { DISK_USAGE_UPDATED, refreshDiskUsage } from './DiskUsageActions'

jest.mock('../../api/ApiManager')

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

function createState(isLoading: boolean): ReduxState {
    return {
        globalReducer: {
            diskUsage: {
                data: undefined,
                isLoading,
                refreshFailed: false,
            },
        },
    }
}

describe('refreshDiskUsage', () => {
    const getDiskUsage = jest.fn()
    const destroy = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        const apiManagerMock = ApiManager as unknown as jest.Mock
        apiManagerMock.mockImplementation(() => ({
            destroy,
            getDiskUsage,
        }))
    })

    it('refreshes disk usage', async () => {
        getDiskUsage.mockResolvedValue(diskUsageData)
        const dispatch = jest.fn()

        await refreshDiskUsage()(dispatch, () => createState(false))

        expect(dispatch).toHaveBeenNthCalledWith(1, {
            type: DISK_USAGE_UPDATED,
            payload: { isLoading: true, refreshFailed: false },
        })
        expect(dispatch).toHaveBeenNthCalledWith(2, {
            type: DISK_USAGE_UPDATED,
            payload: { data: diskUsageData, isLoading: false },
        })
        expect(destroy).toHaveBeenCalledTimes(1)
    })

    it('reuses a refresh that is already in progress', async () => {
        const dispatch = jest.fn()

        await refreshDiskUsage()(dispatch, () => createState(true))

        expect(ApiManager).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('treats an empty response as a refresh failure', async () => {
        getDiskUsage.mockResolvedValue({
            coverage: 'captain-node',
            nodes: [],
        })
        const dispatch = jest.fn()

        await refreshDiskUsage()(dispatch, () => createState(false))

        expect(dispatch).toHaveBeenLastCalledWith({
            type: DISK_USAGE_UPDATED,
            payload: { isLoading: false, refreshFailed: true },
        })
        expect(destroy).toHaveBeenCalledTimes(1)
    })
})
