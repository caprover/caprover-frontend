import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { createMemoryHistory } from 'history'
import { createRef } from 'react'
import { MemoryRouter } from 'react-router-dom'
import ApiManager from '../../../api/ApiManager'
import Toaster from '../../../utils/Toaster'
import { IAppDef } from '../AppDefinition'
import { RuntimeDataStatus } from '../AppRuntimeStatus'
import { SingleAppApiData, AppDetails } from './AppDetails'

jest.mock('../../../utils/Language', () => ({
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

afterEach(() => {
    jest.restoreAllMocks()
})

const apiData: SingleAppApiData = {
    appDefinition: {
        appName: 'new-app',
        projectId: '',
        description: '',
        deployedVersion: 1,
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
        tags: [],
        ports: [],
        volumes: [],
        envVars: [],
        versions: [],
    },
    rootDomain: 'captain.localhost',
    captainSubDomain: 'captain',
    defaultNginxConfig: '',
    projects: [],
    goAccessInfo: {
        isEnabled: false,
        data: { rotationFrequencyCron: '' },
    },
}

it("does not show a previous app's runtime beside a renamed app", () => {
    const nullValue = JSON.parse('null')
    const appDetails = new AppDetails({ isMobile: false })
    appDetails.state = {
        ...appDetails.state,
        apiData,
        isLoading: false,
        runtimeDataStatus: RuntimeDataStatus.Loading,
        appRuntime: {
            appName: 'old-app',
            status: CapRoverModels.AppRuntimeStatus.Running,
            desiredInstances: 1,
            runningInstances: 1,
            currentTasks: [],
            latestFailure: nullValue,
            error: nullValue,
            taskHistory: [],
        },
    }

    const { container } = render(
        <MemoryRouter>{appDetails.createAppHeader()}</MemoryRouter>
    )

    expect(container).toHaveTextContent('new-app')
    expect(container.querySelector('.ant-badge-status-dot')).not.toBeTruthy()
})

// Exercise the page's API lifecycle without mounting the full set of tabs.
class AppDetailsSaveTest extends AppDetails {
    render() {
        return <div />
    }
}

async function mountAppDetailsForSave() {
    let savedApp: CapRoverModels.IAppDef = { ...apiData.appDefinition }
    const getAllApps = jest.spyOn(ApiManager.prototype, 'getAllApps')
    getAllApps.mockImplementation(async () => ({
        appDefinitions: [savedApp],
        rootDomain: apiData.rootDomain,
        captainSubDomain: apiData.captainSubDomain,
        defaultNginxConfig: apiData.defaultNginxConfig,
    }))
    jest.spyOn(ApiManager.prototype, 'getAllProjects').mockResolvedValue({
        projects: [],
    })
    jest.spyOn(ApiManager.prototype, 'getGoAccessInfo').mockResolvedValue(
        apiData.goAccessInfo
    )
    jest.spyOn(ApiManager.prototype, 'getAppRuntime').mockRejectedValue(
        new Error('Runtime unavailable')
    )
    jest.spyOn(Toaster, 'toastError').mockImplementation(() => {})
    const save = jest
        .spyOn(ApiManager.prototype, 'updateConfigAndSave')
        .mockImplementation(async (_appName, definition) => {
            const token = definition.appDeployTokenConfig
            savedApp = {
                ...definition,
                appDeployTokenConfig: token?.enabled
                    ? {
                          enabled: true,
                          appDeployToken:
                              token.appDeployToken || 'server-token',
                      }
                    : { enabled: false },
            }
        })
    const ref = createRef<AppDetailsSaveTest>()
    const path = '/apps/details/new-app'
    const history = createMemoryHistory({ initialEntries: [path] })
    await act(async () => {
        render(
            <AppDetailsSaveTest
                ref={ref}
                history={history}
                location={history.location}
                match={{
                    path,
                    url: path,
                    isExact: true,
                    params: { appName: 'new-app' },
                }}
                mainContainer={createRef<HTMLDivElement>()}
                isMobile={false}
            />
        )
    })
    const details = ref.current!
    const draft = (changes: Partial<IAppDef>) =>
        act(() => {
            const current = details.state.apiData!
            details.setState({
                apiData: {
                    ...current,
                    appDefinition: { ...current.appDefinition, ...changes },
                },
            })
        })
    return { details, draft, getAllApps, save }
}

it('saves a deployment setting from the saved definition and keeps other tabs’ drafts for their own save', async () => {
    const { details, draft, save } = await mountAppDetailsForSave()
    const envVars = [{ key: 'EDITOR_DRAFT', value: 'unsaved' }]
    draft({ envVars, forceSsl: true })
    await act(async () => {
        expect(
            await details.onUpdateConfigAndSave({
                captainDefinitionRelativeFilePath:
                    './docker/captain-definition',
            })
        ).toBe(true)
    })
    expect(save).toHaveBeenLastCalledWith(
        'new-app',
        expect.objectContaining({
            captainDefinitionRelativeFilePath: './docker/captain-definition',
            envVars: [],
            forceSsl: false,
        })
    )
    expect(details.state.apiData?.appDefinition).toMatchObject({
        envVars,
        forceSsl: true,
    })

    await act(async () => {
        expect(await details.onUpdateConfigAndSave()).toBe(true)
    })
    expect(save).toHaveBeenLastCalledWith(
        'new-app',
        expect.objectContaining({ envVars, forceSsl: true })
    )
})

it('recovers the accepted token after a failed refresh before saving another setting', async () => {
    const { details, getAllApps, save } = await mountAppDetailsForSave()
    getAllApps.mockRejectedValueOnce(new Error('Refresh failed'))
    await act(async () => {
        expect(
            await details.onUpdateConfigAndSave({
                appDeployTokenConfig: { enabled: true },
            })
        ).toBe(false)
    })
    expect(save).toHaveBeenCalledTimes(1)

    getAllApps.mockRejectedValueOnce(new Error('Still unavailable'))
    const path = './docker/captain-definition'
    await act(async () => {
        expect(
            await details.onUpdateConfigAndSave({
                captainDefinitionRelativeFilePath: path,
            })
        ).toBe(false)
    })
    expect(save).toHaveBeenCalledTimes(1)

    await act(async () => {
        expect(
            await details.onUpdateConfigAndSave({
                captainDefinitionRelativeFilePath: path,
            })
        ).toBe(true)
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith(
        'new-app',
        expect.objectContaining({
            captainDefinitionRelativeFilePath: path,
            appDeployTokenConfig: {
                enabled: true,
                appDeployToken: 'server-token',
            },
        })
    )
})
