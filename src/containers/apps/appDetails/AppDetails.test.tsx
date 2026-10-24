import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { MemoryRouter } from 'react-router-dom'
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
