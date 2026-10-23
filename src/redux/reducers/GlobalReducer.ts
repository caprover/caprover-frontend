import Utils from '../../utils/Utils'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import { GlobalState } from '../../models/ReduxState'
import {
    DiskUsageAction,
    DISK_USAGE_UPDATED,
} from '../actions/DiskUsageActions'
import { ROOT_KEY_CHANGED, SIZE_CHANGED } from '../actions/GlobalActions'

const initialDiskUsage: DiskUsageViewState = {
    data: undefined,
    isLoading: false,
    refreshFailed: false,
}

const initialState: GlobalState = {
    diskUsage: initialDiskUsage,
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
        case DISK_USAGE_UPDATED:
            return {
                ...state,
                diskUsage: {
                    ...state.diskUsage,
                    ...action.payload,
                },
            }
        default:
            return state
    }
}
