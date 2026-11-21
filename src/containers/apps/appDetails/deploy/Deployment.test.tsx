import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { message, Modal } from 'antd'
import { createMemoryHistory } from 'history'
import ApiManager from '../../../../api/ApiManager'
import { IAppDef, IAppVersion } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
import Deployment from './Deployment'

jest.mock('../../../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))

const app: IAppDef = {
    appName: 'test-app',
    deployedVersion: 0,
    notExposeAsWebApp: false,
    hasPersistentData: false,
    hasDefaultSubDomainSsl: false,
    containerHttpPort: 80,
    captainDefinitionRelativeFilePath: './captain-definition',
    forceSsl: false,
    websocketSupport: false,
    instanceCount: 1,
    networks: [],
    customDomain: [],
    ports: [],
    volumes: [],
    envVars: [],
    versions: [],
}

const version = (number: number, image?: string): IAppVersion => ({
    version: number,
    deployedImageName: image,
    timeStamp: '2026-01-01T00:00:00Z',
    gitHash: image ? '1234567890abcdef' : undefined,
})

function tabProps(appDefinition = app): AppDetailsTabProps {
    return {
        history: createMemoryHistory(),
        apiManager: new ApiManager(),
        updateApiData: jest.fn(),
        onUpdateConfigAndSave: jest.fn().mockResolvedValue(true),
        reFetchData: jest.fn(),
        setLoading: jest.fn(),
        isMobile: false,
        apiData: {
            appDefinition,
            rootDomain: 'example.com',
            captainSubDomain: 'captain',
            defaultNginxConfig: '',
            projects: [],
            goAccessInfo: {
                isEnabled: false,
                data: { rotationFrequencyCron: '' },
            },
        },
    }
}

const button = (name: string) => screen.getByText(name).closest('button')!

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        }),
    })
})

beforeEach(() => {
    jest.spyOn(message, 'info').mockReturnValue(
        Object.assign(jest.fn(), { then: jest.fn() })
    )
    jest.spyOn(ApiManager.prototype, 'fetchBuildLogs').mockResolvedValue({
        isAppBuilding: false,
        isBuildFailed: false,
        logs: { firstLineNumber: 0, lines: [] },
    })
})

afterEach(() => {
    jest.restoreAllMocks()
})

it('opens a fresh app with the archive selected and keeps history independent', () => {
    render(<Deployment {...tabProps()} />)

    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(
        screen.getByRole('radio', { name: 'CapRover archive' })
    ).toBeChecked()
    expect(button('Upload & Deploy')).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()

    fireEvent.click(button('View history'))
    expect(screen.getByText('No deployment history yet')).toBeVisible()
    expect(button('Upload & Deploy')).toBeVisible()
    fireEvent.click(button('Hide options'))
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Upload & Deploy' })).toBeNull()
})

it('shows successful version zero as active after a newer unsuccessful attempt', () => {
    render(
        <Deployment
            {...tabProps({
                ...app,
                versions: [version(0, 'nginx:alpine'), version(1)],
            })}
        />
    )

    expect(screen.getByText('Version 0')).toBeVisible()
    expect(screen.getByText('nginx:alpine')).toBeVisible()
    expect(screen.getByText('1234567890abcdef')).toBeVisible()
    expect(button('Show options')).toBeVisible()
    expect(button('View history')).toBeVisible()

    fireEvent.click(button('View history'))
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(
        within(rows[0]).getByRole('img', { name: 'exclamation-circle' })
    ).toBeVisible()
    expect(within(rows[0]).queryByRole('button')).toBeNull()
    expect(
        within(rows[1]).getByRole('img', { name: 'check-circle' })
    ).toBeVisible()
})

it('distinguishes a failed first attempt, missing version zero and a missing known active version', () => {
    const { rerender } = render(
        <Deployment {...tabProps({ ...app, versions: [version(0)] })} />
    )

    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(screen.queryByText('Version 0')).toBeNull()
    fireEvent.click(button('View history'))
    expect(
        within(screen.getByRole('table')).queryByRole('img', {
            name: 'check-circle',
        })
    ).toBeNull()

    rerender(<Deployment {...tabProps({ ...app, versions: [version(51)] })} />)
    expect(screen.getByText('Deployment details unavailable')).toBeVisible()
    expect(screen.queryByText('Version 0')).toBeNull()

    rerender(
        <Deployment
            {...tabProps({
                ...app,
                deployedVersion: 50,
                versions: [version(51)],
            })}
        />
    )
    expect(screen.getByText('Version 50')).toBeVisible()
    expect(screen.getByText('Deployment details unavailable')).toBeVisible()
})

it('paginates the latest five rows and only deploys an eligible image after confirming', () => {
    const upload = jest
        .spyOn(ApiManager.prototype, 'uploadCaptainDefinitionContent')
        .mockReturnValue(new Promise(() => {}))
    const confirm = jest.spyOn(Modal, 'confirm').mockReturnValue({
        destroy: jest.fn(),
        update: jest.fn(),
    })
    const versions = Array.from({ length: 50 }, (_, i) =>
        version(i, i === 49 ? undefined : 'example/image:' + i)
    )
    render(
        <Deployment
            {...tabProps({ ...app, deployedVersion: 48, versions })}
            isMobile
        />
    )

    fireEvent.click(button('View history'))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(5)
    const visibleVersions = () =>
        within(table)
            .getAllByRole('row')
            .slice(1)
            .map((row) =>
                Number(within(row).getAllByRole('cell')[1].textContent)
            )
    expect(visibleVersions()).toEqual([49, 48, 47, 46, 45])
    fireEvent.click(screen.getByTitle('2'))
    expect(visibleVersions()).toEqual([44, 43, 42, 41, 40])

    const revert = table.querySelector(
        'button[aria-label="Revert to this version"]'
    )!
    fireEvent.click(revert)
    expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Rollback?' })
    )
    expect(upload).not.toHaveBeenCalled()

    confirm.mock.calls[0][0].onOk?.()
    expect(upload).toHaveBeenCalledWith(
        'test-app',
        { schemaVersion: 2, dockerfileLines: ['FROM example/image:44'] },
        '1234567890abcdef',
        true
    )
})

it('retains manual input through method switches, collapse and a refresh for the same app', () => {
    const { rerender } = render(<Deployment {...tabProps()} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Docker image' }))
    fireEvent.change(screen.getByPlaceholderText('nginxdemos/hello:latest'), {
        target: { value: 'nginx:alpine' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Dockerfile' }))
    fireEvent.click(button('Hide options'))
    rerender(
        <Deployment
            {...tabProps({ ...app, versions: [version(0, 'nginx:alpine')] })}
        />
    )
    expect(button('Show options')).toBeVisible()
    fireEvent.click(button('Show options'))
    expect(screen.getByRole('radio', { name: 'Dockerfile' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Docker image' }))
    expect(screen.getByPlaceholderText('nginxdemos/hello:latest')).toHaveValue(
        'nginx:alpine'
    )

    rerender(
        <Deployment
            key="fresh-app"
            {...tabProps({ ...app, appName: 'fresh-app' })}
        />
    )
    expect(
        screen.getByRole('radio', { name: 'CapRover archive' })
    ).toBeChecked()
    expect(screen.getByPlaceholderText('nginxdemos/hello:latest')).toHaveValue(
        ''
    )
})

it('refreshes the active summary and history together, keeping prior details if the refresh fails', async () => {
    const versions = [version(0, 'nginx:alpine')]
    const getAllApps = jest
        .spyOn(ApiManager.prototype, 'getAllApps')
        .mockRejectedValueOnce(new Error('Could not load apps'))
        .mockResolvedValue({
            appDefinitions: [{ ...app, versions }],
            rootDomain: 'example.com',
            captainSubDomain: 'captain',
            defaultNginxConfig: '',
        })
    jest.spyOn(
        ApiManager.prototype,
        'uploadCaptainDefinitionContent'
    ).mockResolvedValue(undefined)
    render(<Deployment {...tabProps()} />)
    fireEvent.click(button('View history'))
    fireEvent.click(screen.getByRole('radio', { name: 'Docker image' }))
    fireEvent.change(screen.getByPlaceholderText('nginxdemos/hello:latest'), {
        target: { value: 'nginx:alpine' },
    })
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Deploy Now' }))
    })

    expect(
        screen.getByText(/information shown may be out of date/)
    ).toBeVisible()
    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(screen.getByText('No deployment history yet')).toBeVisible()
    expect(button('Hide Build Logs')).toBeVisible()

    await act(async () => {
        fireEvent.click(button('Retry'))
    })
    expect(screen.getByText('Version 0')).toBeVisible()
    expect(getAllApps).toHaveBeenCalledTimes(2)
    expect(
        within(screen.getByRole('table')).getByRole('img', {
            name: 'check-circle',
        })
    ).toBeVisible()
    expect(
        screen.queryByText(/information shown may be out of date/)
    ).toBeNull()
    expect(button('Hide options')).toBeVisible()
})

it('saves only the selected settings row and retains a rejected Git draft', async () => {
    const props = tabProps({
        ...app,
        appPushWebhook: {
            repoInfo: {
                repo: 'example.com/saved',
                branch: 'master',
                user: 'git',
                password: '',
                sshKey: '',
            },
            tokenVersion: '1',
            pushWebhookToken: 'saved-token',
        },
    })
    const save = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
    render(<Deployment {...props} onUpdateConfigAndSave={save} />)
    const git = within(screen.getByRole('region', { name: 'Git repository' }))
    const path = within(
        screen.getByRole('region', { name: 'captain-definition path' })
    )
    fireEvent.click(path.getByRole('button', { name: 'Edit' }))
    fireEvent.change(path.getByRole('textbox'), {
        target: { value: './unsubmitted' },
    })
    fireEvent.click(git.getByRole('button', { name: 'Edit' }))
    fireEvent.change(git.getByRole('textbox', { name: 'Branch' }), {
        target: { value: 'draft-branch' },
    })

    expect(git.getByText('example.com/saved · master')).toBeVisible()
    expect(git.getByRole('button', { name: 'Force build' })).toBeDisabled()
    fireEvent.click(button('Manage token'))
    fireEvent.click(button('Enable App Token'))
    expect(save).toHaveBeenLastCalledWith({
        appDeployTokenConfig: { enabled: true },
    })
    expect(
        screen.getByRole('link', { name: 'Deployment methods' })
    ).toHaveAttribute(
        'href',
        'https://caprover.com/docs/deployment-methods.html'
    )

    await act(async () => {
        fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
    })
    expect(save).toHaveBeenLastCalledWith({
        appPushWebhook: {
            ...props.apiData.appDefinition.appPushWebhook,
            repoInfo: {
                ...props.apiData.appDefinition.appPushWebhook?.repoInfo,
                branch: 'draft-branch',
            },
        },
    })
    expect(git.getByRole('textbox', { name: 'Branch' })).toHaveValue(
        'draft-branch'
    )
    expect(path.getByRole('textbox')).toHaveValue('./unsubmitted')
})
