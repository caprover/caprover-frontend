import Utils from '../../utils/Utils'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import { GlobalState } from '../../models/ReduxState'
import {
    DiskUsageAction,
    DISK_USAGE_REFRESH_FAILED,
    DISK_USAGE_REFRESH_STARTED,
    DISK_USAGE_REFRESH_SUCCEEDED,
} from '../actions/DiskUsageActions'
import { ROOT_KEY_CHANGED, SIZE_CHANGED } from '../actions/GlobalActions'

const initialDiskUsage: DiskUsageViewState = {
    data: undefined,
    isLoading: true,
    refreshFailed: false,
}

const initialState: GlobalState = {
    diskUsage: initialDiskUsage,
    diskUsageRequestId: 0,
}

type GlobalReducerAction =
    | DiskUsageAction
    | { type: typeof ROOT_KEY_CHANGED; payload: {} }
    | { type: typeof SIZE_CHANGED; payload: {} }

// eslint-disable-next-line import/no-anonymous-default-export
export default function (
    state: GlobalState = initialState,
    action: GlobalReducerAction
): GlobalState {
    switch (action.type) {
        case ROOT_KEY_CHANGED:
            return { ...state, rootElementKey: Utils.generateUuidV4() }
        case SIZE_CHANGED:
            return { ...state, isMobile: Utils.isMobile() }
        case DISK_USAGE_REFRESH_STARTED:
            return {
                ...state,
                diskUsageRequestId: action.payload.requestId,
                diskUsage: {
                    ...(state.diskUsage || initialDiskUsage),
                    isLoading: true,
                    refreshFailed: false,
                },
            }
        case DISK_USAGE_REFRESH_SUCCEEDED:
            if (action.payload.requestId !== state.diskUsageRequestId) {
                return state
            }
            return {
                ...state,
                diskUsage: {
                    data: action.payload.data,
                    isLoading: false,
                    refreshFailed: false,
                },
            }
        case DISK_USAGE_REFRESH_FAILED:
            if (action.payload.requestId !== state.diskUsageRequestId) {
                return state
            }
            return {
                ...state,
                diskUsage: {
                    ...(state.diskUsage || initialDiskUsage),
                    isLoading: false,
                    refreshFailed: true,
                },
            }
        default:
            return state
    }
}
