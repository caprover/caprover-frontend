import '@testing-library/jest-dom'
import { act, render, waitFor } from '@testing-library/react'
import { CapRoverModels } from 'caprover-api'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import ApiManager from '../../api/ApiManager'
import Apps from './Apps'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, message: string) => message,
}))
jest.mock('./AppsTable', () => () => <div />)
jest.mock('./CreateNewApp', () => () => <div />)

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

it('serializes overlapping runtime refreshes and runs one queued refresh', async () => {
    const runtimeResponse: CapRoverModels.AppsRuntimeResponse = { apps: [] }
    let resolveFirstRequest: (
        response: CapRoverModels.AppsRuntimeResponse
    ) => void = () => undefined
    const firstRequest = new Promise<CapRoverModels.AppsRuntimeResponse>(
        (resolve) => {
            resolveFirstRequest = resolve
        }
    )
    const getAppsRuntime = jest
        .spyOn(ApiManager.prototype, 'getAppsRuntime')
        .mockReturnValueOnce(firstRequest)
        .mockResolvedValue(runtimeResponse)
    jest.spyOn(ApiManager.prototype, 'getAllApps').mockResolvedValue({
        appDefinitions: [],
        rootDomain: 'captain.localhost',
        captainSubDomain: 'captain',
        defaultNginxConfig: '',
    })
    jest.spyOn(ApiManager.prototype, 'getAllProjects').mockResolvedValue({
        projects: [],
    })

    let apps: Apps | undefined
    render(
        <MemoryRouter initialEntries={['/apps/']}>
            <Route
                path="/apps/"
                render={(props) => (
                    <Apps
                        {...props}
                        ref={(ref) => {
                            if (ref) apps = ref
                        }}
                    />
                )}
            />
        </MemoryRouter>
    )

    await waitFor(() => expect(getAppsRuntime).toHaveBeenCalledTimes(1))

    act(() => {
        apps!.refreshRuntime()
        apps!.refreshRuntime()
    })
    expect(getAppsRuntime).toHaveBeenCalledTimes(1)

    await act(async () => {
        resolveFirstRequest(runtimeResponse)
        await firstRequest
    })

    await waitFor(() => expect(getAppsRuntime).toHaveBeenCalledTimes(2))
    await waitFor(() =>
        expect(apps!.state.appsRuntimeData).toEqual(runtimeResponse)
    )
})
