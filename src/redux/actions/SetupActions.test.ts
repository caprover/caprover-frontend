import ApiManager from '../../api/ApiManager'
import ReduxState from '../../models/ReduxState'
import { SetupStatus } from '../../models/SetupStatus'
import StorageHelper from '../../utils/StorageHelper'
import GlobalReducer from '../reducers/GlobalReducer'
import {
    dismissSetup,
    emitSetupStatusChanged,
    refreshSetup,
    SetupAction,
} from './SetupActions'

afterEach(() => jest.restoreAllMocks())
function getLoadingState(): ReduxState {
    return {
        globalReducer: {
            setupStatus: SetupStatus.Loading,
            setupDismissed: false,
            diskUsage: {
                data: undefined,
                isLoading: false,
                refreshFailed: false,
            },
        },
    }
}
it.each([false, true])(
    'derives setup completion only from forceSsl (%s)',
    async (forceSsl) => {
        jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockResolvedValue({
            forceSsl,
            hasRootSsl: true,
            rootDomain: 'example.com',
            captainSubDomain: 'captain',
        })
        const dispatch = jest.fn()
        await refreshSetup()(dispatch, getLoadingState)
        expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
            emitSetupStatusChanged(SetupStatus.Loading),
            emitSetupStatusChanged(
                forceSsl ? SetupStatus.Complete : SetupStatus.Required
            ),
        ])
    }
)
it('retains an explicit failure when setup status cannot be fetched', async () => {
    jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockRejectedValue(
        new Error('Unavailable')
    )
    const dispatch = jest.fn()
    await refreshSetup()(dispatch, getLoadingState)
    expect(dispatch).toHaveBeenLastCalledWith(
        emitSetupStatusChanged(SetupStatus.Failed)
    )
})
it.each(['resolves', 'rejects'])(
    'does not overwrite setup completion when an earlier request %s',
    async (outcome) => {
        let finishRequest: () => void = () => undefined
        jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockImplementation(
            () =>
                new Promise((resolve, reject) => {
                    finishRequest = () => {
                        if (outcome === 'resolves') {
                            resolve({ forceSsl: false })
                        } else {
                            reject(new Error('Unavailable'))
                        }
                    }
                })
        )
        let setupStatus = SetupStatus.Required
        const dispatch = jest.fn((action: SetupAction) => {
            setupStatus = action.payload
        })
        const getState = (): ReduxState => ({
            globalReducer: {
                setupStatus,
                setupDismissed: false,
                diskUsage: {
                    data: undefined,
                    isLoading: false,
                    refreshFailed: false,
                },
            },
        })

        const refresh = refreshSetup()(dispatch, getState)
        dispatch(emitSetupStatusChanged(SetupStatus.Complete))
        finishRequest()
        await refresh

        expect(setupStatus).toBe(SetupStatus.Complete)
    }
)
it('persists dismissal and changes navigation state without calling a server operation', () => {
    const persist = jest.spyOn(StorageHelper, 'setSetupDismissedInLocalStorage')
    const state = GlobalReducer(
        undefined,
        emitSetupStatusChanged(SetupStatus.Required)
    )
    const dismissed = GlobalReducer(state, dismissSetup())
    expect(persist).toHaveBeenCalledTimes(1)
    expect(dismissed.setupDismissed).toBe(true)
    expect(dismissed.setupStatus).toBe(SetupStatus.Required)
})
