import { SetupStatus } from './SetupStatus'
import DiskUsageViewState from './DiskUsageViewState'

export interface GlobalState {
    setupStatus: SetupStatus
    setupDismissed: boolean
    diskUsage: DiskUsageViewState
    isMobile?: boolean
    rootElementKey?: string
}

export default interface ReduxState {
    globalReducer: GlobalState
}
