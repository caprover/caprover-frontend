import ApiManager from '../../api/ApiManager'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import ReduxState from '../../models/ReduxState'

export const DISK_USAGE_UPDATED = 'DISK_USAGE_UPDATED'

export interface DiskUsageAction {
    type: typeof DISK_USAGE_UPDATED
    payload: Partial<DiskUsageViewState>
}

type DiskUsageDispatch = (action: DiskUsageAction) => void

export function refreshDiskUsage() {
    return (dispatch: DiskUsageDispatch, getState: () => ReduxState) => {
        const { diskUsage } = getState().globalReducer

        if (diskUsage.isLoading) {
            return Promise.resolve()
        }

        const apiManager = new ApiManager()

        dispatch({
            type: DISK_USAGE_UPDATED,
            payload: { isLoading: true, refreshFailed: false },
        })

        return apiManager
            .getDiskUsage()
            .then((data) => {
                dispatch({
                    type: DISK_USAGE_UPDATED,
                    payload: { data, isLoading: false },
                })
            })
            .catch(() => {
                dispatch({
                    type: DISK_USAGE_UPDATED,
                    payload: { isLoading: false, refreshFailed: true },
                })
            })
            .then(() => {
                apiManager.destroy()
            })
    }
}
