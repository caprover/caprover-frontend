import { isEnteringMonitoring } from './DiskUsageRefresh'

describe('disk usage refresh navigation', () => {
    it('refreshes when the user enters Monitoring', () => {
        expect(isEnteringMonitoring('/apps', '/monitoring')).toBe(true)
    })

    it('does not refresh for navigation within Monitoring', () => {
        expect(isEnteringMonitoring('/monitoring', '/monitoring/details')).toBe(
            false
        )
    })

    it('does not refresh when the user leaves Monitoring', () => {
        expect(isEnteringMonitoring('/monitoring', '/apps')).toBe(false)
    })

    it('does not treat a similarly named route as Monitoring', () => {
        expect(isEnteringMonitoring('/apps', '/monitoring-tools')).toBe(false)
    })
})
