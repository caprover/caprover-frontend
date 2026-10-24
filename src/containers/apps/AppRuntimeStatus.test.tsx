import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { MemoryRouter } from 'react-router-dom'
import AppRuntimeStatus from './AppRuntimeStatus'

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

const EMPTY_VALUE = JSON.parse('null') as never

const createTask = (
    state: CapRoverModels.TaskState = CapRoverModels.TaskState.Running
): CapRoverModels.RuntimeTask => ({
    taskId: `task-${state}`,
    slot: 1,
    nodeId: 'node-1',
    nodeName: 'captain-01',
    image: 'nginx:alpine',
    state,
    desiredState: CapRoverModels.TaskState.Running,
    stateChangedAt: new Date(Date.now() - 120000).toISOString(),
    message: '',
    error:
        state === CapRoverModels.TaskState.Failed
            ? 'task: non-zero exit (1)'
            : EMPTY_VALUE,
    exitCode: state === CapRoverModels.TaskState.Failed ? 1 : 0,
})

const createRuntime = (
    status: CapRoverModels.AppRuntimeStatus = CapRoverModels.AppRuntimeStatus
        .Running
): CapRoverModels.AppRuntime => ({
    appName: 'website',
    status,
    desiredInstances:
        status === CapRoverModels.AppRuntimeStatus.Degraded ? 2 : 1,
    runningInstances: 1,
    currentTasks: [createTask()],
    latestFailure: EMPTY_VALUE,
    error: EMPTY_VALUE,
})

function renderStatus(
    runtime: CapRoverModels.AppRuntime | undefined,
    overrides: Partial<React.ComponentProps<typeof AppRuntimeStatus>> = {}
) {
    return render(
        <MemoryRouter>
            <AppRuntimeStatus
                appName="website"
                runtime={runtime}
                isLoading={false}
                refreshFailed={false}
                isMobile={false}
                {...overrides}
            />
        </MemoryRouter>
    )
}

it('renders a quiet healthy indicator and opens current task details', () => {
    const runtime = createRuntime()
    const { container } = renderStatus(runtime)

    expect(container.querySelector('.ant-badge-status-success')).toBeTruthy()
    const statusButton = screen.getByRole('button', {
        name: 'website, Healthy, 1/1 running',
    })

    fireEvent.click(statusButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('1/1 running')).not.toHaveLength(0)
    expect(screen.getByText('Current tasks')).toBeInTheDocument()
    expect(screen.getByText('Instance 1')).toBeInTheDocument()
    expect(screen.getByText('nginx:alpine')).toBeInTheDocument()
})

it('shows degraded tasks and the latest failure', () => {
    const runtime: CapRoverModels.AppRuntime = {
        ...createRuntime(CapRoverModels.AppRuntimeStatus.Degraded),
        currentTasks: [
            createTask(),
            {
                ...createTask(CapRoverModels.TaskState.Failed),
                taskId: 'task-failed-2',
                slot: 2,
            },
        ],
        latestFailure: {
            taskId: 'task-failed-2',
            occurredAt: new Date(Date.now() - 30000).toISOString(),
            error: 'task: non-zero exit (1)',
        },
    }
    const { container } = renderStatus(runtime)

    expect(container.querySelector('.ant-badge-status-error')).toBeTruthy()
    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Needs attention, 1/2 running',
        })
    )

    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(screen.getByText('Instance 2')).toBeInTheDocument()
    expect(screen.getByText('Latest failure')).toBeInTheDocument()
    expect(screen.getAllByText(/task: non-zero exit/)).toHaveLength(2)
})

it('shows bounded history from the app details response', () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
        ...createTask(CapRoverModels.TaskState.Shutdown),
        taskId: `history-${index}`,
        slot: index + 1,
    }))
    const runtime: CapRoverModels.AppRuntimeDetails = {
        ...createRuntime(),
        taskHistory: history,
    }
    renderStatus(runtime)

    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Healthy, 1/1 running',
        })
    )

    expect(screen.getByText('Recent task history')).toBeInTheDocument()
    expect(screen.getByText('Instance 10')).toBeInTheDocument()
})

it('preserves stale runtime data and labels a refresh failure', () => {
    renderStatus(createRuntime(), { refreshFailed: true })

    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Healthy, 1/1 running',
        })
    )

    expect(
        screen.getByText(
            'Could not refresh runtime status. These values may be outdated.'
        )
    ).toBeInTheDocument()
    expect(screen.getAllByText('1/1 running')).not.toHaveLength(0)
})

it('shows unavailable runtime data and links to app details', () => {
    renderStatus(undefined, {
        refreshFailed: true,
        appDetailsPath: '/apps/details/website',
    })

    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Runtime status unavailable',
        })
    )

    expect(screen.getAllByText('Runtime status unavailable')).not.toHaveLength(
        0
    )
    expect(
        screen.getByRole('link', { name: 'Open app details' })
    ).toHaveAttribute('href', '/apps/details/website')
})

it('renders nothing before the first runtime response', () => {
    const { container } = renderStatus(undefined, { isLoading: true })

    expect(container).toBeEmptyDOMElement()
})
