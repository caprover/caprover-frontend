import { Monitoring } from './Monitoring'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, message: string) => message,
}))

const createProps = (isLoading: boolean) =>
    ({
        diskUsage: {
            data: undefined,
            isLoading,
            refreshFailed: false,
        },
        refreshDiskUsage: jest.fn(),
    }) as any

describe('Monitoring disk usage refresh', () => {
    it('refreshes disk usage when Monitoring mounts', () => {
        const props = createProps(false)

        new Monitoring(props).componentDidMount()

        expect(props.refreshDiskUsage).toHaveBeenCalledTimes(1)
    })

    it('reuses a refresh that is already in progress', () => {
        const props = createProps(true)

        new Monitoring(props).componentDidMount()

        expect(props.refreshDiskUsage).not.toHaveBeenCalled()
    })
})
