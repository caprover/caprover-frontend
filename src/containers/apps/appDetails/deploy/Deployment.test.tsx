import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { message, Modal } from 'antd'
import { createMemoryHistory } from 'history'
import ApiManager from '../../../../api/ApiManager'
import { IAppDef, IAppVersion } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
import Deployment from './Deployment'
import { createGitRepoDraft, getGitRepoInfoForSave } from './GitRepoForm'

// Allow time for Ant Design to render the table in jsdom after async updates.
jest.setTimeout(15000)

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

function selectGitAuthentication(name: string) {
    const combobox = document.getElementById('git-authentication')!
    expect(combobox).toHaveAttribute('role', 'combobox')
    fireEvent.mouseDown(combobox)
    const dropdown = Array.from(
        document.querySelectorAll<HTMLElement>('.ant-select-dropdown')
    ).find(
        (element) => !element.classList.contains('ant-select-dropdown-hidden')
    )
    fireEvent.click(within(dropdown!).getByRole('option', { name }))
}

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

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.slice(0, 2).map((heading) => heading.textContent)).toEqual([
        'Deployment history',
        'Deployment settings',
    ])
    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(
        screen.getByRole('radio', { name: 'CapRover archive' })
    ).toBeChecked()
    expect(button('Upload & Deploy')).toBeVisible()
    expect(button('Hide history')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('No deployment history yet')).toBeVisible()

    fireEvent.click(button('Hide history'))
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(button('Upload & Deploy')).toBeVisible()

    fireEvent.click(button('View history'))
    expect(screen.getByText('No deployment history yet')).toBeVisible()
    expect(button('Upload & Deploy')).toBeVisible()
    const hideMethods = screen.getByRole('button', {
        name: 'Hide deployment methods',
    })
    expect(hideMethods).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(hideMethods)
    const chooseMethod = screen.getByRole('button', {
        name: 'Choose deployment method',
    })
    expect(chooseMethod).toHaveAttribute('aria-expanded', 'false')
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

    expect(screen.getAllByText('Version 0')[0]).toBeVisible()
    expect(
        screen.getAllByText('nginx:alpine', { selector: 'code' })[0]
    ).toBeVisible()
    expect(screen.getByText('1234567890abcdef')).toBeVisible()
    expect(button('Choose deployment method')).toHaveAttribute(
        'aria-expanded',
        'false'
    )

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Failed')).toBeVisible()
    expect(
        within(rows[0]).queryByRole('button', {
            name: 'Revert to this version',
        })
    ).toBeNull()
    expect(within(rows[1]).getByText('Active')).toBeVisible()
})

it('shows In progress only for the latest version without an image while building', () => {
    render(
        <Deployment
            {...tabProps({
                ...app,
                deployedVersion: 1,
                isAppBuilding: true,
                versions: [
                    version(1, 'nginx:1.26-alpine'),
                    version(2),
                    version(3),
                ],
            })}
        />
    )

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('In progress')).toBeVisible()
    expect(within(rows[1]).getByText('Failed')).toBeVisible()
    expect(within(rows[2]).getByText('Active')).toBeVisible()
})

it('distinguishes a failed first attempt, missing version zero and a missing known active version', () => {
    const { rerender } = render(
        <Deployment {...tabProps({ ...app, versions: [version(0)] })} />
    )

    expect(screen.getByText('No active deployment yet')).toBeVisible()
    expect(within(screen.getByRole('table')).queryByText('Active')).toBeNull()
    expect(within(screen.getByRole('table')).getByText('Failed')).toBeVisible()

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
    // The highest version can arrive anywhere in the response.
    versions.unshift({ ...versions.pop()!, timeStamp: '' })
    render(
        <Deployment
            {...tabProps({ ...app, deployedVersion: 48, versions })}
            isMobile
        />
    )

    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(6)
    const visibleVersions = () =>
        within(screen.getByRole('table'))
            .getAllByRole('row')
            .filter((row) => row.hasAttribute('data-row-key'))
            .map((row) =>
                Number(
                    within(row)
                        .getAllByRole('cell')[0]
                        .textContent?.replace(/^\D+/, '')
                )
            )
    expect(visibleVersions()).toEqual([49, 48, 47, 46, 45])
    const dataRows = within(table)
        .getAllByRole('row')
        .filter((row) => row.hasAttribute('data-row-key'))
    const firstVersion = dataRows[0]
    expect(within(firstVersion).getByText('Failed')).toBeVisible()
    expect(within(firstVersion).getAllByRole('cell')[3]).toBeEmptyDOMElement()
    expect(within(dataRows[1]).getByText('Active')).toBeVisible()
    expect(within(dataRows[2]).getByText('Succeeded')).toBeVisible()
    fireEvent.click(screen.getByTitle('2'))
    expect(visibleVersions()).toEqual([44, 43, 42, 41, 40])

    const revert = within(table).getAllByRole('button', {
        name: 'Revert to this version',
    })[0]
    revert.focus()
    expect(revert).toHaveFocus()
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

    fireEvent.click(button('Hide history'))
    expect(screen.getByText('Version 48')).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()
    fireEvent.click(button('View history'))
    expect(visibleVersions()).toEqual([49, 48, 47, 46, 45])
})

it('retains manual input through method switches, collapse and a refresh for the same app', () => {
    const { rerender } = render(<Deployment {...tabProps()} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Docker image' }))
    fireEvent.change(screen.getByPlaceholderText('nginxdemos/hello:latest'), {
        target: { value: 'nginx:alpine' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Dockerfile' }))
    fireEvent.click(button('Hide deployment methods'))
    rerender(
        <Deployment
            {...tabProps({ ...app, versions: [version(0, 'nginx:alpine')] })}
        />
    )
    expect(button('Choose deployment method')).toHaveAttribute(
        'aria-expanded',
        'false'
    )
    fireEvent.click(button('Choose deployment method'))
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

    fireEvent.click(button('Hide history'))
    expect(screen.queryByRole('table')).toBeNull()
    expect(button('Hide Build Logs')).toBeVisible()
    await act(async () => {
        fireEvent.click(button('Retry'))
    })
    expect(screen.getByText('Version 0')).toBeVisible()
    expect(getAllApps).toHaveBeenCalledTimes(2)
    fireEvent.click(button('View history'))
    expect(within(screen.getByRole('table')).getByText('Active')).toBeVisible()
    expect(
        screen.queryByText(/information shown may be out of date/)
    ).toBeNull()
    expect(button('Hide deployment methods')).toHaveAttribute(
        'aria-expanded',
        'true'
    )
})

it('keeps build logs open while a build is running', async () => {
    jest.spyOn(ApiManager.prototype, 'fetchBuildLogs').mockResolvedValue({
        isAppBuilding: true,
        isBuildFailed: false,
        logs: { firstLineNumber: 0, lines: ['Build output'] },
    })
    render(<Deployment {...tabProps()} />)

    const toggle = await screen.findByRole('button', {
        name: 'Hide Build Logs',
    })
    expect(toggle).toBeDisabled()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const output = screen.getByDisplayValue(/Build output/)
    expect(output).toBeVisible()
    const summary = screen.getByText('No active deployment yet')
    expect(summary.compareDocumentPosition(output)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(output.compareDocumentPosition(screen.getByRole('table'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
    )

    fireEvent.click(button('Hide history'))
    expect(output).toBeVisible()
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
    const gitRegion = screen.getByRole('region', { name: 'Git repository' })
    const git = within(gitRegion)
    const path = within(
        screen.getByRole('region', { name: 'captain-definition path' })
    )
    const settingsRows = gitRegion.parentElement!
    expect(settingsRows).toHaveClass('deployment-settings-grid')
    fireEvent.click(path.getByRole('button', { name: 'Edit path' }))
    expect(settingsRows).not.toHaveClass('deployment-settings-grid')
    fireEvent.change(path.getByRole('textbox'), {
        target: { value: './unsubmitted' },
    })
    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    fireEvent.change(git.getByRole('textbox', { name: 'Branch' }), {
        target: { value: 'draft-branch' },
    })

    expect(git.getByText('example.com/saved · master')).toBeVisible()
    expect(git.getByRole('button', { name: 'Force build' })).toBeDisabled()
    fireEvent.click(button('Token settings'))
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

    fireEvent.change(path.getByRole('textbox'), { target: { value: '' } })
    fireEvent.click(git.getByRole('button', { name: 'Cancel' }))
    expect(settingsRows).not.toHaveClass('deployment-settings-grid')
    fireEvent.click(button('Hide token settings'))
    expect(path.getByRole('textbox')).toHaveValue('')
    expect(settingsRows).not.toHaveClass('deployment-settings-grid')
    fireEvent.click(path.getByRole('button', { name: 'Cancel' }))
    expect(settingsRows).toHaveClass('deployment-settings-grid')

    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    expect(settingsRows).not.toHaveClass('deployment-settings-grid')
    fireEvent.click(button('Token settings'))
    fireEvent.click(git.getByRole('button', { name: 'Cancel' }))
    expect(settingsRows).not.toHaveClass('deployment-settings-grid')
    fireEvent.click(button('Hide token settings'))
    expect(settingsRows).toHaveClass('deployment-settings-grid')
})

it('saves a public repository with the compatibility pair and clears it without credentials', async () => {
    const save = jest.fn().mockResolvedValue(true)
    const props = tabProps()
    const { rerender } = render(
        <Deployment {...props} onUpdateConfigAndSave={save} />
    )
    const git = within(screen.getByRole('region', { name: 'Git repository' }))
    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    expect(git.getByText('Public repository')).toBeVisible()
    expect(git.queryByRole('textbox', { name: 'Username' })).toBeNull()
    expect(git.queryByRole('textbox', { name: 'SSH private key' })).toBeNull()
    fireEvent.change(git.getByRole('textbox', { name: 'Repository' }), {
        target: {
            value: 'https://github.com/caprover/zero-downtime-example.git',
        },
    })
    fireEvent.change(git.getByRole('textbox', { name: 'Branch' }), {
        target: { value: 'master' },
    })
    await act(async () => {
        fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
    })

    const savedRepo = {
        repo: 'https://github.com/caprover/zero-downtime-example.git',
        branch: 'master',
        user: 'caprover-public',
        password: 'caprover-public',
        sshKey: '',
    }
    expect(save).toHaveBeenLastCalledWith({
        appPushWebhook: {
            tokenVersion: '',
            pushWebhookToken: '',
            repoInfo: savedRepo,
        },
    })

    rerender(
        <Deployment
            {...tabProps({
                ...app,
                appPushWebhook: {
                    tokenVersion: '1',
                    pushWebhookToken: 'saved-token',
                    repoInfo: savedRepo,
                },
            })}
            onUpdateConfigAndSave={save}
        />
    )
    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    expect(git.getByText('Public repository')).toBeVisible()
    expect(git.getByRole('button', { name: 'Save & Restart' })).toBeDisabled()
    for (const name of ['Repository', 'Branch']) {
        fireEvent.change(git.getByRole('textbox', { name }), {
            target: { value: '' },
        })
    }
    await act(async () => {
        fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
    })
    expect(save).toHaveBeenLastCalledWith({
        appPushWebhook: {
            tokenVersion: '1',
            pushWebhookToken: 'saved-token',
            repoInfo: {
                repo: '',
                branch: '',
                user: '',
                password: '',
                sshKey: '',
            },
        },
    })
})

it('preserves legacy HTTPS credentials until saving an explicit switch to SSH', async () => {
    const save = jest.fn().mockResolvedValue(true)
    const webhook = {
        tokenVersion: '1',
        pushWebhookToken: 'saved-token',
        repoInfo: {
            repo: 'git@github.com:example/project.git',
            branch: 'main',
            user: 'test',
            password: 'test',
            sshKey: '',
        },
    }
    const { rerender } = render(
        <Deployment
            {...tabProps({ ...app, appPushWebhook: webhook })}
            onUpdateConfigAndSave={save}
        />
    )
    const git = within(screen.getByRole('region', { name: 'Git repository' }))
    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    expect(git.getByText('HTTPS credentials')).toBeVisible()
    expect(git.getByRole('textbox', { name: 'Username' })).toHaveValue('test')
    expect(git.queryByRole('textbox', { name: 'SSH private key' })).toBeNull()

    selectGitAuthentication('SSH deploy key')
    expect(git.queryByRole('textbox', { name: 'Username' })).toBeNull()
    fireEvent.change(git.getByRole('textbox', { name: 'SSH private key' }), {
        target: { value: 'fixture-key' },
    })
    selectGitAuthentication('HTTPS credentials')
    expect(git.getByRole('textbox', { name: 'Username' })).toHaveValue('test')
    expect(git.getByRole('button', { name: 'Save & Restart' })).toBeDisabled()
    selectGitAuthentication('SSH deploy key')
    expect(git.getByRole('textbox', { name: 'SSH private key' })).toHaveValue(
        'fixture-key'
    )
    await act(async () => {
        fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
    })
    const sshRepo = {
        ...webhook.repoInfo,
        user: '',
        password: '',
        sshKey: 'fixture-key',
    }
    expect(save).toHaveBeenLastCalledWith({
        appPushWebhook: { ...webhook, repoInfo: sshRepo },
    })

    rerender(
        <Deployment
            {...tabProps({
                ...app,
                appPushWebhook: { ...webhook, repoInfo: sshRepo },
            })}
            onUpdateConfigAndSave={save}
        />
    )
    fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
    expect(git.getByText('SSH deploy key')).toBeVisible()
    selectGitAuthentication('HTTPS credentials')
    fireEvent.change(git.getByRole('textbox', { name: 'Username' }), {
        target: { value: 'git-user' },
    })
    fireEvent.change(git.getByPlaceholderText('Password or access token'), {
        target: { value: 'fixture-token' },
    })
    selectGitAuthentication('Public repository')
    selectGitAuthentication('HTTPS credentials')
    fireEvent.click(git.getByRole('button', { name: 'Show Password' }))
    expect(git.getByPlaceholderText('Password or access token')).toHaveValue(
        'fixture-token'
    )
    await act(async () => {
        fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
    })
    expect(save).toHaveBeenLastCalledWith({
        appPushWebhook: {
            ...webhook,
            repoInfo: {
                ...sshRepo,
                user: 'git-user',
                password: 'fixture-token',
                sshKey: '',
            },
        },
    })
}, 30000)

it.each([
    ['HTTPS credentials', ''],
    ['SSH deploy key', 'fixture-key'],
])(
    'preserves saved %s on branch edits and switches to Public with the same webhook',
    async (method, sshKey) => {
        const save = jest.fn().mockResolvedValue(true)
        const webhook = {
            tokenVersion: '1',
            pushWebhookToken: 'saved-token',
            repoInfo: {
                repo: sshKey
                    ? 'git@github.com:example/project.git'
                    : 'github.com/example/project',
                branch: 'main',
                user: 'git-user',
                password: 'fixture-token',
                sshKey,
            },
        }
        const { rerender } = render(
            <Deployment
                {...tabProps({ ...app, appPushWebhook: webhook })}
                onUpdateConfigAndSave={save}
            />
        )
        const git = within(
            screen.getByRole('region', { name: 'Git repository' })
        )
        fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
        expect(git.getByText(method)).toBeVisible()
        expect(
            git.getByRole('button', { name: 'Save & Restart' })
        ).toBeDisabled()
        fireEvent.change(git.getByRole('textbox', { name: 'Branch' }), {
            target: { value: 'release' },
        })
        await act(async () => {
            fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
        })
        const updatedWebhook = {
            ...webhook,
            repoInfo: { ...webhook.repoInfo, branch: 'release' },
        }
        expect(save).toHaveBeenLastCalledWith({
            appPushWebhook: updatedWebhook,
        })

        rerender(
            <Deployment
                {...tabProps({ ...app, appPushWebhook: updatedWebhook })}
                onUpdateConfigAndSave={save}
            />
        )
        fireEvent.click(git.getByRole('button', { name: 'Edit repository' }))
        selectGitAuthentication('Public repository')
        fireEvent.change(git.getByRole('textbox', { name: 'Repository' }), {
            target: { value: 'github.com/example/project' },
        })
        await act(async () => {
            fireEvent.click(git.getByRole('button', { name: 'Save & Restart' }))
        })
        expect(save).toHaveBeenLastCalledWith({
            appPushWebhook: {
                ...updatedWebhook,
                repoInfo: {
                    repo: 'github.com/example/project',
                    branch: 'release',
                    user: 'caprover-public',
                    password: 'caprover-public',
                    sshKey: '',
                },
            },
        })
    },
    30000
)

it('treats null repository and branch values as empty in an older config', () => {
    const repoInfo = JSON.parse(
        '{"repo":null,"branch":null,"user":"","password":"","sshKey":""}'
    )
    const draft = createGitRepoDraft(repoInfo)
    expect(getGitRepoInfoForSave(draft, repoInfo)).toEqual({
        repo: '',
        branch: '',
        user: '',
        password: '',
        sshKey: '',
    })
})
