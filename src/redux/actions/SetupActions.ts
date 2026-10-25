import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'
import { SetupStatus } from '../../models/SetupStatus'
import StorageHelper from '../../utils/StorageHelper'

export const SETUP_STATUS_CHANGED = 'SETUP_STATUS_CHANGED'
export const SETUP_DISMISSED = 'SETUP_DISMISSED'

export type SetupAction =
    | { type: typeof SETUP_STATUS_CHANGED; payload: SetupStatus }
    | { type: typeof SETUP_DISMISSED }

export function emitSetupStatusChanged(status: SetupStatus): SetupAction {
    return { type: SETUP_STATUS_CHANGED, payload: status }
}

export function dismissSetup(): SetupAction {
    StorageHelper.setSetupDismissedInLocalStorage()
    return { type: SETUP_DISMISSED }
}

export function refreshSetup() {
    return (
        dispatch: (action: SetupAction) => void,
        getState: () => ReduxState
    ) => {
        const apiManager = new ApiManager()
        dispatch(emitSetupStatusChanged(SetupStatus.Loading))
        return apiManager
            .getCaptainInfo()
            .then(function (data) {
                if (typeof data.forceSsl !== 'boolean')
                    throw new Error('Setup status is unavailable')
                if (
                    getState().globalReducer.setupStatus === SetupStatus.Loading
                ) {
                    dispatch(
                        emitSetupStatusChanged(
                            data.forceSsl
                                ? SetupStatus.Complete
                                : SetupStatus.Required
                        )
                    )
                }
            })
            .catch(() => {
                if (
                    getState().globalReducer.setupStatus === SetupStatus.Loading
                ) {
                    dispatch(emitSetupStatusChanged(SetupStatus.Failed))
                }
            })
            .then(() => apiManager.destroy())
    }
}
