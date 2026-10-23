import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'
import {
    DISK_USAGE_REFRESH_STARTED,
    DISK_USAGE_REFRESH_SUCCEEDED,
    refreshDiskUsage,
} from './DiskUsageActions'

jest.mock('../../api/ApiManager')

const diskUsageData = {
    coverage: 'captain-node' as const,
    nodes: [],
}

function createState(isLoading: boolean, requestId: number): ReduxState {
    return {
        globalReducer: {
            diskUsage: {
                data: undefined,
                isLoading,
                refreshFailed: false,
            },
            diskUsageRequestId: requestId,
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

    it('starts the initial refresh even though initial state is loading', async () => {
        getDiskUsage.mockResolvedValue(diskUsageData)
        const dispatch = jest.fn()

        await refreshDiskUsage()(dispatch, () => createState(true, 0))

        expect(dispatch).toHaveBeenNthCalledWith(1, {
            type: DISK_USAGE_REFRESH_STARTED,
            payload: { requestId: 1 },
        })
        expect(dispatch).toHaveBeenNthCalledWith(2, {
            type: DISK_USAGE_REFRESH_SUCCEEDED,
            payload: { requestId: 1, data: diskUsageData },
        })
        expect(destroy).toHaveBeenCalledTimes(1)
    })

    it('reuses a refresh that is already in progress', async () => {
        const dispatch = jest.fn()

        await refreshDiskUsage()(dispatch, () => createState(true, 1))

        expect(ApiManager).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })
})
