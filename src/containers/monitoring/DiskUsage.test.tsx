import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import DiskUsage, { DiskUsageAlert, formatBytes } from './DiskUsage'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, message: string) => message,
}))

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: undefined,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }),
    })
})

const createDiskUsage = (
    severity: CapRoverModels.DiskUsageSeverity = 'normal'
): DiskUsageViewState => ({
    data: {
        coverage: 'captain-node',
        nodes: [
            {
                nodeId: 'node-1',
                hostname: 'captain-01',
                disks: [
                    {
                        totalBytes: 40_000_000_000,
                        usedBytes: 36_800_000_000,
                        availableBytes: 3_200_000_000,
                        severity,
                    },
                ],
            },
        ],
    },
    isLoading: false,
    refreshFailed: false,
})

const createHistory = () => ({ push: jest.fn() }) as any

describe('DiskUsageAlert', () => {
    it('stays hidden while disk usage is healthy', () => {
        const { container } = render(
            <DiskUsageAlert
                diskUsage={createDiskUsage()}
                history={createHistory()}
            />
        )

        expect(container).toBeEmptyDOMElement()
    })

    it('shows the backend warning severity and links to Monitoring', () => {
        const history = createHistory()
        render(
            <DiskUsageAlert
                diskUsage={createDiskUsage('warning')}
                history={history}
            />
        )

        expect(
            screen.getByText('Disk space is running low')
        ).toBeInTheDocument()
        expect(screen.getByText(/captain-01/)).toHaveTextContent(
            '3.2 GB available (8% of capacity)'
        )

        fireEvent.click(screen.getByRole('button', { name: 'View disk usage' }))
        expect(history.push).toHaveBeenCalledWith('/monitoring')
    })

    it('shows a critical alert when the backend reports critical severity', () => {
        render(
            <DiskUsageAlert
                diskUsage={createDiskUsage('critical')}
                history={createHistory()}
            />
        )

        expect(
            screen.getByText('Disk space is critically low')
        ).toBeInTheDocument()
    })

    it('marks a previous warning reading as outdated after refresh fails', () => {
        render(
            <DiskUsageAlert
                diskUsage={{
                    ...createDiskUsage('warning'),
                    refreshFailed: true,
                }}
                history={createHistory()}
            />
        )

        expect(screen.getByText(/captain-01/)).toHaveTextContent(
            'Could not refresh disk usage. These values may be outdated.'
        )
    })
})

describe('DiskUsage', () => {
    it('shows capacity, host, usage, and the cleanup action', () => {
        const history = createHistory()
        render(
            <DiskUsage
                diskUsage={createDiskUsage('warning')}
                history={history}
                refreshDiskUsage={jest.fn()}
            />
        )

        expect(screen.getByText('3.2 GB')).toBeInTheDocument()
        expect(screen.getByText(/available of 40.0 GB/)).toHaveTextContent(
            'captain-01'
        )
        expect(screen.getByText('92% used')).toBeInTheDocument()
        expect(screen.getByText('Warning')).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'Review disk cleanup' })
        )
        expect(history.push).toHaveBeenCalledWith('/maintenance#disk-cleanup')
    })

    it('keeps the previous reading visible after a refresh failure', () => {
        const onRefresh = jest.fn()
        render(
            <DiskUsage
                diskUsage={{
                    ...createDiskUsage(),
                    refreshFailed: true,
                }}
                history={createHistory()}
                refreshDiskUsage={onRefresh}
            />
        )

        expect(
            screen.getByText(
                'Could not refresh disk usage. These values may be outdated.'
            )
        ).toBeInTheDocument()
        expect(screen.getByText('3.2 GB')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('shows an unavailable state and supports a manual retry', () => {
        const onRefresh = jest.fn()
        render(
            <DiskUsage
                diskUsage={{
                    data: undefined,
                    isLoading: false,
                    refreshFailed: true,
                }}
                history={createHistory()}
                refreshDiskUsage={onRefresh}
            />
        )

        expect(
            screen.getByText('Disk usage is unavailable')
        ).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(onRefresh).toHaveBeenCalledTimes(1)
    })
})

it('formats disk capacity with decimal units', () => {
    expect(formatBytes(3_200_000_000)).toBe('3.2 GB')
    expect(formatBytes(40_000_000_000)).toBe('40.0 GB')
})
