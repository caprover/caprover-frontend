import { CapRoverModels } from 'caprover-api'
import ApiManager from '../../api/ApiManager'

export const DISK_USAGE_REFRESH_STARTED = 'DISK_USAGE_REFRESH_STARTED'
export const DISK_USAGE_REFRESH_SUCCEEDED = 'DISK_USAGE_REFRESH_SUCCEEDED'
export const DISK_USAGE_REFRESH_FAILED = 'DISK_USAGE_REFRESH_FAILED'

let nextRequestId = 0

export function refreshDiskUsage() {
    return (dispatch: any) => {
        const requestId = ++nextRequestId
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
