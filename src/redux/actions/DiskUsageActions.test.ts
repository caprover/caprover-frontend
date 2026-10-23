import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'
import { DISK_USAGE_UPDATED, refreshDiskUsage } from './DiskUsageActions'

jest.mock('../../api/ApiManager')

const diskUsageData = {
    coverage: 'captain-node' as const,
    nodes: [],
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
})
