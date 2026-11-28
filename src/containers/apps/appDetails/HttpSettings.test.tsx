import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import ApiManager from '../../../api/ApiManager'
import { IAppDef } from '../AppDefinition'
import { AppDetailsTabProps } from './AppDetails'
import HttpSettings from './HttpSettings'

jest.mock('../../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))

const app: IAppDef = {
    appName: 'test-app',
    deployedVersion: 0,
    notExposeAsWebApp: false,
    hasPersistentData: false,
    hasDefaultSubDomainSsl: true,
    containerHttpPort: 80,
    captainDefinitionRelativeFilePath: './captain-definition',
    forceSsl: false,
    websocketSupport: false,
    instanceCount: 1,
    networks: [],
    customDomain: [{ publicDomain: 'www.example.com', hasSsl: true }],
    ports: [],
    volumes: [],
    envVars: [],
    versions: [],
}

function tabProps(appDefinition: IAppDef): AppDetailsTabProps {
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

it('hides the redirect status code when no redirect domain is set', () => {
    render(<HttpSettings {...tabProps(app)} />)

    expect(screen.getByText('No redirects')).toBeInTheDocument()
    expect(screen.queryByText('302 (temporary)')).not.toBeInTheDocument()
})

it('shows 302 for a redirect domain without a stored status code', () => {
    render(
        <HttpSettings
            {...tabProps({ ...app, redirectDomain: 'www.example.com' })}
        />
    )

    expect(screen.getByText('302 (temporary)')).toBeInTheDocument()
})

it('updates the draft when 301 is selected', () => {
    const props = tabProps({ ...app, redirectDomain: 'www.example.com' })
    render(<HttpSettings {...props} />)

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1])
    fireEvent.click(screen.getByText('301 (permanent)'))

    expect(props.updateApiData).toHaveBeenLastCalledWith(
        expect.objectContaining({
            appDefinition: expect.objectContaining({
                redirectDomain: 'www.example.com',
                redirectDomainStatusCode: 301,
            }),
        })
    )
})

it('shows a stored 301 status code', () => {
    render(
        <HttpSettings
            {...tabProps({
                ...app,
                redirectDomain: 'www.example.com',
                redirectDomainStatusCode: 301,
            })}
        />
    )

    expect(screen.getByText('301 (permanent)')).toBeInTheDocument()
})

it('follows the draft when it is replaced by refetched data', () => {
    const props = tabProps({
        ...app,
        redirectDomain: 'www.example.com',
        redirectDomainStatusCode: 301,
    })
    const { rerender } = render(<HttpSettings {...props} />)

    rerender(
        <HttpSettings
            {...tabProps({ ...app, redirectDomain: 'www.example.com' })}
        />
    )

    expect(screen.getByText('302 (temporary)')).toBeInTheDocument()
    expect(screen.queryByText('301 (permanent)')).not.toBeInTheDocument()
})
