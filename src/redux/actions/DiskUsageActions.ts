import { CapRoverModels } from 'caprover-api'
import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'

export const DISK_USAGE_REFRESH_STARTED = 'DISK_USAGE_REFRESH_STARTED'
export const DISK_USAGE_REFRESH_SUCCEEDED = 'DISK_USAGE_REFRESH_SUCCEEDED'
export const DISK_USAGE_REFRESH_FAILED = 'DISK_USAGE_REFRESH_FAILED'

export type DiskUsageAction =
    | {
          type: typeof DISK_USAGE_REFRESH_STARTED
          payload: { requestId: number }
      }
    | {
          type: typeof DISK_USAGE_REFRESH_SUCCEEDED
          payload: {
              requestId: number
              data: CapRoverModels.DiskUsageResponse
          }
      }
    | {
          type: typeof DISK_USAGE_REFRESH_FAILED
          payload: { requestId: number }
      }

type DiskUsageDispatch = (action: DiskUsageAction) => void

export function refreshDiskUsage() {
    return (dispatch: DiskUsageDispatch, getState: () => ReduxState) => {
        const { diskUsage, diskUsageRequestId } = getState().globalReducer

        if (diskUsage.isLoading && diskUsageRequestId > 0) {
            return Promise.resolve()
        }

        const requestId = diskUsageRequestId + 1
        const apiManager = new ApiManager()

        dispatch({
            type: DISK_USAGE_REFRESH_STARTED,
            payload: { requestId },
        })

        return apiManager
            .getDiskUsage()
            .then((data: CapRoverModels.DiskUsageResponse) => {
                dispatch({
                    type: DISK_USAGE_REFRESH_SUCCEEDED,
                    payload: { requestId, data },
                })
            })
            .catch(() => {
                dispatch({
                    type: DISK_USAGE_REFRESH_FAILED,
                    payload: { requestId },
                })
            })
            .then(() => {
                apiManager.destroy()
            })
    }
}
