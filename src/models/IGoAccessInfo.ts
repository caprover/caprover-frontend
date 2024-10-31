export default interface IGoAccessInfo {
    isEnabled: boolean
    data: {
        rotationFrequencyCron: string
        catchupFrequencyCron: string
        logRetentionDays?: number
    }
}
