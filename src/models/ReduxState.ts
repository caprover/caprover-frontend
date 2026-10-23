import DiskUsageViewState from './DiskUsageViewState'

export interface GlobalState {
    diskUsage: DiskUsageViewState
    isMobile?: boolean
    rootElementKey?: string
}

export default interface ReduxState {
    globalReducer: GlobalState
}
