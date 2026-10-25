import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { MemoryRouter } from 'react-router-dom'
import AppRuntimeStatus, { RuntimeDataStatus } from './AppRuntimeStatus'

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

const nullValue = JSON.parse('null')

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
            : nullValue,
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
    latestFailure: nullValue,
    error: nullValue,
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
                runtimeDataStatus={RuntimeDataStatus.Ready}
                isMobile={false}
                {...overrides}
            />
        </MemoryRouter>
    )
}

it('shows healthy instance counts as clickable tags', () => {
    const runtime = {
        ...createRuntime(),
        runningInstances: 3,
        desiredInstances: 3,
    }
    const { container } = renderStatus(runtime, { showInstances: true })

    const countButton = screen.getByRole('button', {
        name: 'website, Healthy, 3/3 running',
    })
    expect(countButton).toHaveTextContent('3')
    expect(countButton.querySelector('.ant-tag-success')).toBeTruthy()
    expect(container.querySelector('.ant-badge-status-dot')).toBeNull()

    fireEvent.click(countButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('3/3 running')).not.toHaveLength(0)
})

it('shows a red running/desired count when instances are missing', () => {
    const runtime = {
        ...createRuntime(CapRoverModels.AppRuntimeStatus.Degraded),
        runningInstances: 1,
        desiredInstances: 3,
    }
    renderStatus(runtime, { showInstances: true })

    const countButton = screen.getByRole('button', {
        name: 'website, Needs attention, 1/3 running',
    })
    expect(countButton).toHaveTextContent('1/3')
    expect(countButton.querySelector('.ant-tag-error')).toBeTruthy()
})

it('shows zero for stopped apps and the actual count when overprovisioned', () => {
    const stopped = {
        ...createRuntime(CapRoverModels.AppRuntimeStatus.Stopped),
        runningInstances: 0,
        desiredInstances: 0,
    }
    const { rerender } = renderStatus(stopped, { showInstances: true })

    const stoppedButton = screen.getByRole('button', {
        name: 'website, Stopped, 0/0 running',
    })
    expect(stoppedButton).toHaveTextContent('0')
    expect(stoppedButton.querySelector('.ant-tag-default')).toBeTruthy()

    rerender(
        <MemoryRouter>
            <AppRuntimeStatus
                appName="website"
                runtime={{
                    ...createRuntime(),
                    runningInstances: 2,
                    desiredInstances: 1,
                }}
                runtimeDataStatus={RuntimeDataStatus.Ready}
                isMobile={false}
                showInstances
            />
        </MemoryRouter>
    )
    const overprovisionedButton = screen.getByRole('button', {
        name: 'website, Healthy, 2/1 running',
    })
    expect(overprovisionedButton).toHaveTextContent('2/1')
    expect(overprovisionedButton.querySelector('.ant-tag-success')).toBeTruthy()
})

it('keeps the configured count visible while runtime data loads', () => {
    renderStatus(undefined, {
        runtimeDataStatus: RuntimeDataStatus.Loading,
        showInstances: true,
        configuredInstances: 0,
    })

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('shows a neutral unknown count when runtime data is unavailable', () => {
    renderStatus(undefined, {
        runtimeDataStatus: RuntimeDataStatus.Failed,
        showInstances: true,
    })

    const countButton = screen.getByRole('button', {
        name: 'website, Runtime status unavailable',
    })
    expect(countButton).toHaveTextContent('–')
    expect(countButton.querySelector('.ant-tag-default')).toBeTruthy()

    fireEvent.click(countButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
})

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
                ...createTask(CapRoverModels.TaskState.Starting),
                taskId: 'task-starting-2',
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
    expect(screen.getByText('Starting')).toBeInTheDocument()
    expect(screen.getByText(/task: non-zero exit/)).toBeInTheDocument()
})

it('describes the current transition before an older failure', async () => {
    const runtime: CapRoverModels.AppRuntime = {
        ...createRuntime(CapRoverModels.AppRuntimeStatus.Degraded),
        currentTasks: [
            createTask(),
            {
                ...createTask(CapRoverModels.TaskState.Starting),
                taskId: 'task-starting-2',
                slot: 2,
            },
        ],
        latestFailure: {
            taskId: 'old-failure',
            occurredAt: new Date(Date.now() - 86400000).toISOString(),
            error: 'old failure',
        },
    }
    renderStatus(runtime)

    fireEvent.mouseOver(
        screen.getByRole('button', {
            name: 'website, Needs attention, 1/2 running',
        })
    )

    await waitFor(() => {
        expect(screen.getByText(/Starting .* ago/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Latest failure:/)).not.toBeInTheDocument()
})

it('uses the node ID when a task has no node name', () => {
    const runtime = createRuntime()
    runtime.currentTasks = [
        {
            ...createTask(),
            nodeName: nullValue,
            nodeId: 'node-fallback-id',
        },
    ]
    renderStatus(runtime)

    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Healthy, 1/1 running',
        })
    )

    expect(screen.getByText(/node-fallback-id/)).toBeInTheDocument()
})

it('marks every Docker transition state as processing', () => {
    const transitionStates = [
        CapRoverModels.TaskState.New,
        CapRoverModels.TaskState.Allocated,
        CapRoverModels.TaskState.Assigned,
        CapRoverModels.TaskState.Accepted,
    ]
    const runtime: CapRoverModels.AppRuntime = {
        ...createRuntime(CapRoverModels.AppRuntimeStatus.Degraded),
        desiredInstances: transitionStates.length,
        runningInstances: 0,
        currentTasks: transitionStates.map((state, index) => ({
            ...createTask(state),
            taskId: `transition-${state}`,
            slot: index + 1,
        })),
    }
    renderStatus(runtime)

    fireEvent.click(
        screen.getByRole('button', {
            name: 'website, Needs attention, 0/4 running',
        })
    )

    expect(document.querySelectorAll('.ant-tag-processing')).toHaveLength(4)
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
    renderStatus(createRuntime(), {
        runtimeDataStatus: RuntimeDataStatus.Failed,
    })

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
        runtimeDataStatus: RuntimeDataStatus.Failed,
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
    const { container } = renderStatus(undefined, {
        runtimeDataStatus: RuntimeDataStatus.Loading,
    })

    expect(container).toBeEmptyDOMElement()
})
