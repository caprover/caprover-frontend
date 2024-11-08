export default interface IGoAccessInfo {
    isEnabled: boolean
    data: {
        rotationFrequencyCron: string
        logRetentionDays?: number
    }
}
