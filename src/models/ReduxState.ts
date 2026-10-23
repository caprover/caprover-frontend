import DiskUsageViewState from './DiskUsageViewState'

export interface GlobalState {
    diskUsage: DiskUsageViewState
    diskUsageRequestId: number
    isMobile?: boolean
    rootElementKey?: string
}

export default interface ReduxState {
    globalReducer: GlobalState
}
