import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import rootReducer from '../../redux/reducers'
import ApiManager from '../../api/ApiManager'
import Cluster from './Cluster'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('./AddNode', () => () => <button>Add node</button>)
jest.mock('./DockerRegistriesStaticInfo', () => () => <div />)
jest.mock('./DefaultDockerRegistry', () => () => <div />)
jest.mock('./DockerRegistryTable', () => () => <div />)
jest.mock('./DockerRegistryAdd', () => () => <div />)

beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }))
})
afterEach(() => jest.restoreAllMocks())

it('loads the lower registry section and enables adding nodes when its default registry arrives', async () => {
    let resolveRegistries: (data: any) => void = () => {}
    jest.spyOn(ApiManager.prototype, 'getDockerRegistries').mockReturnValue(
        new Promise((resolve) => {
            resolveRegistries = resolve
        })
    )
    jest.spyOn(ApiManager.prototype, 'getAllNodes').mockResolvedValue({
        nodes: [],
    })
    const scrollIntoView = jest.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const { container } = render(
        <Provider store={createStore(rootReducer)}>
            <Cluster />
        </Provider>
    )
    fireEvent.click(await screen.findByText('Configure Docker Registries'))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(
        screen.queryByRole('button', { name: 'Add node' })
    ).not.toBeInTheDocument()
    await act(async () => {
        resolveRegistries({
            defaultPushRegistryId: 'registry-1',
            registries: [],
        })
    })
    expect(
        await screen.findByRole('button', { name: 'Add node' })
    ).toBeInTheDocument()
    const cards = container.querySelectorAll('.ant-card-head-title')
    expect(cards[0]).toHaveTextContent('Nodes')
    expect(cards[1]).toHaveTextContent('Docker Registries')
})
