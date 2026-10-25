import DiskUsageViewState from '../../models/DiskUsageViewState'
import { GlobalState } from '../../models/ReduxState'
import { SetupStatus } from '../../models/SetupStatus'
import StorageHelper from '../../utils/StorageHelper'
import Utils from '../../utils/Utils'
import {
    DiskUsageAction,
    DISK_USAGE_UPDATED,
} from '../actions/DiskUsageActions'
import { ROOT_KEY_CHANGED, SIZE_CHANGED } from '../actions/GlobalActions'
import {
    SetupAction,
    SETUP_DISMISSED,
    SETUP_STATUS_CHANGED,
} from '../actions/SetupActions'

const initialDiskUsage: DiskUsageViewState = {
    data: undefined,
    isLoading: false,
    refreshFailed: false,
}

const initialState: GlobalState = {
    setupStatus: SetupStatus.Loading,
    setupDismissed: StorageHelper.getSetupDismissedFromLocalStorage(),
    diskUsage: initialDiskUsage,
}

type GlobalReducerAction =
    | DiskUsageAction
    | SetupAction
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
        case SETUP_STATUS_CHANGED:
            return { ...state, setupStatus: action.payload }
        case SETUP_DISMISSED:
            return { ...state, setupDismissed: true }
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
