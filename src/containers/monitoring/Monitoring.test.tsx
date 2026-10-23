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
    it.each([false, true])(
        'requests a refresh when Monitoring mounts (isLoading: %s)',
        (isLoading) => {
            const props = createProps(isLoading)

            new Monitoring(props).componentDidMount()

            expect(props.refreshDiskUsage).toHaveBeenCalledTimes(1)
        }
    )
})
