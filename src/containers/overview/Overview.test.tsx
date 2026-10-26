import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'
import ApiManager from '../../api/ApiManager'
import { SetupStatus } from '../../models/SetupStatus'
import { getRecentDeployments, Overview } from './Overview'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('../monitoring/DiskUsage', () => () => <div>Disk summary</div>)

const nullValue = JSON.parse('null')

const app = (appName: string, versions: CapRoverModels.IAppVersion[] = []) =>
    ({ appName, versions, deployedVersion: 1 }) as CapRoverModels.IAppDef
const version = (version: number, day: number) => ({
    version,
    timeStamp: `2026-10-${String(day).padStart(2, '0')}T12:00:00Z`,
    deployedImageName: `image:${version}`,
    gitHash: undefined,
})
const runtime = (
    appName: string,
    overrides: Partial<CapRoverModels.AppRuntime> = {}
): CapRoverModels.AppRuntime => ({
    appName,
    status: CapRoverModels.AppRuntimeStatus.Running,
    runningInstances: 1,
    desiredInstances: 1,
    currentTasks: [],
    latestFailure: nullValue,
    error: nullValue,
    ...overrides,
})
const nodes = [
    {
        nodeId: 'node-1',
        hostname: 'captain-01',
        state: 'ready',
        status: 'active',
    },
] as CapRoverModels.ServerDockerInfo[]

beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((media) => ({
        matches: false,
        media,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }))
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockResolvedValue({
        appDefinitions: [app('api')],
        rootDomain: 'example.com',
        captainSubDomain: 'captain',
        defaultNginxConfig: '',
    })
    jest.spyOn(ApiManager.prototype, 'getAppsRuntime').mockResolvedValue({
        apps: [runtime('api')],
    })
    jest.spyOn(ApiManager.prototype, 'getAllNodes').mockResolvedValue({ nodes })
    jest.spyOn(ApiManager.prototype, 'getVersionInfo').mockResolvedValue({
        currentVersion: '1.15.5',
        latestVersion: '1.15.6',
        canUpdate: true,
        changeLogMessage: '',
    })
    jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockResolvedValue({
        rootDomain: 'example.com',
        captainSubDomain: 'captain',
        hasRootSsl: true,
        forceSsl: true,
    })
})
afterEach(() => jest.restoreAllMocks())
function showOverview() {
    const history = createMemoryHistory({ initialEntries: ['/overview'] })
    const refreshDiskUsage = jest.fn()
    render(
        <Router history={history}>
            <Overview
                history={history}
                location={history.location}
                match={{
                    path: '/overview',
                    url: '/overview',
                    isExact: true,
                    params: {},
                }}
                isMobile={false}
                setupStatus={SetupStatus.Complete}
                setupDismissed={false}
                diskUsage={{
                    data: undefined,
                    isLoading: false,
                    refreshFailed: false,
                }}
                refreshDiskUsage={refreshDiskUsage}
            />
        </Router>
    )
    return { history, refreshDiskUsage }
}

it('selects five timestamped deployment events globally, including repeated apps, without changing history', () => {
    const apps = [
        app('api', [version(1, 20), version(2, 24), version(3, 25)]),
        app('worker', [
            version(1, 19),
            version(2, 21),
            version(3, 23),
            { ...version(4, 22), timeStamp: 'invalid' },
        ]),
    ]
    const original = JSON.stringify(apps)
    expect(
        getRecentDeployments(apps).map(
            (it) => `${it.appName}:${it.version.version}`
        )
    ).toEqual(['api:3', 'api:2', 'worker:3', 'worker:2', 'api:1'])
    expect(JSON.stringify(apps)).toBe(original)
})

it('preserves node/version sections when the app-list request fails and retries successfully', async () => {
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockRejectedValueOnce(
        new Error('Unavailable')
    )
    const { refreshDiskUsage } = showOverview()
    expect(
        await screen.findByText(
            'App data is unavailable. Refresh to try again.'
        )
    ).toBeInTheDocument()
    expect(screen.getByText('captain-01')).toBeInTheDocument()
    expect(screen.getByText('1.15.5')).toBeInTheDocument()
    expect(
        screen.queryByText('No apps yet. Create your first app to get started.')
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findAllByText('1/1')).toHaveLength(2)
    expect(refreshDiskUsage).toHaveBeenCalledTimes(2)
})

it('reports missing runtime data without including it in the running/desired totals', async () => {
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockResolvedValue({
        appDefinitions: [app('api'), app('worker')],
        rootDomain: 'example.com',
        captainSubDomain: 'captain',
        defaultNginxConfig: '',
    })
    showOverview()
    expect(await screen.findAllByText('1/1')).toHaveLength(2)
    expect(screen.getByText(/Without runtime data: 1/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'worker' })).toHaveAttribute(
        'href',
        '/apps/details/worker'
    )
})

it('surfaces failed runtime collection without claiming a healthy zero', async () => {
    jest.spyOn(ApiManager.prototype, 'getAppsRuntime').mockRejectedValue(
        new Error('Unavailable')
    )
    showOverview()
    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('0/0')).not.toBeInTheDocument()
    expect(screen.getByText(/Without runtime data: 1/)).toBeInTheDocument()
})

it('shows explicit empty states and routes the Create App action to the existing Apps flow', async () => {
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockResolvedValue({
        appDefinitions: [],
        rootDomain: 'example.com',
        captainSubDomain: 'captain',
        defaultNginxConfig: '',
    })
    const { history } = showOverview()
    expect(
        await screen.findByText(
            'No apps yet. Create your first app to get started.'
        )
    ).toBeInTheDocument()
    expect(
        screen.getByText('No deployment history is available yet.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create App' }))
    expect(history.location.pathname + history.location.search).toBe(
        '/apps?create=true'
    )
})

it('surfaces degraded counts and historical failures using the existing runtime control', async () => {
    jest.spyOn(ApiManager.prototype, 'getAppsRuntime').mockResolvedValue({
        apps: [
            runtime('api', {
                status: CapRoverModels.AppRuntimeStatus.Degraded,
                runningInstances: 1,
                desiredInstances: 3,
                latestFailure: {
                    taskId: 'failed',
                    occurredAt: nullValue,
                    error: 'Container exited',
                },
            }),
        ],
    })
    showOverview()
    expect(await screen.findAllByText('1/3')).toHaveLength(2)
    expect(
        screen.getByText('Previous task failure: Container exited')
    ).toBeInTheDocument()
})

it('keeps app health compact and prioritizes current issues over historical failures', async () => {
    const appNames = [
        'recovered',
        'healthy-a',
        'degraded-a',
        'healthy-b',
        'stopped',
        'healthy-c',
        'degraded-b',
    ]
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockResolvedValue({
        appDefinitions: appNames.map((name) => app(name)),
        rootDomain: 'example.com',
        captainSubDomain: 'captain',
        defaultNginxConfig: '',
    })
    jest.spyOn(ApiManager.prototype, 'getAppsRuntime').mockResolvedValue({
        apps: [
            runtime('recovered', {
                latestFailure: {
                    taskId: 'previous',
                    occurredAt: nullValue,
                    error: 'Old failure',
                },
            }),
            runtime('healthy-a'),
            runtime('degraded-a', {
                status: CapRoverModels.AppRuntimeStatus.Degraded,
                runningInstances: 0,
                latestFailure: {
                    taskId: 'failed',
                    occurredAt: nullValue,
                    error: 'Container exited',
                },
            }),
            runtime('healthy-b', {
                runningInstances: 3,
                desiredInstances: 3,
            }),
            runtime('stopped', {
                status: CapRoverModels.AppRuntimeStatus.Stopped,
                runningInstances: 0,
                desiredInstances: 0,
            }),
            runtime('healthy-c'),
            runtime('degraded-b', {
                status: CapRoverModels.AppRuntimeStatus.Degraded,
                runningInstances: 0,
            }),
        ],
    })
    showOverview()

    expect(await screen.findByText('Needs attention (4)')).toBeInTheDocument()
    expect(screen.getByText('Healthy (3)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'degraded-a' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'stopped' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'healthy-a' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'healthy-b' })).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(
        screen.queryByRole('link', { name: 'recovered' })
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole('link', { name: 'degraded-b' })
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole('link', { name: 'healthy-c' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('+ 2 more')).toHaveAttribute('href', '/apps')
    expect(screen.getByText('+ 1 more')).toHaveAttribute('href', '/apps')
    expect(
        screen.getByText('Previous task failure: Container exited')
    ).toBeInTheDocument()
})

it('omits the attention section when every app is healthy', async () => {
    showOverview()
    expect(await screen.findByText('Healthy (1)')).toBeInTheDocument()
    expect(screen.queryByText(/Needs attention \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Previous task failure/)).not.toBeInTheDocument()
})
