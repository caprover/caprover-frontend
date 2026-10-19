import OneClickDeploymentPage from './OneClickDeploymentPage'
import Toaster from '../../../../utils/Toaster'

jest.mock('react/jsx-runtime', () => ({}), { virtual: true })
jest.mock('../../../global/ApiComponent', () => ({
    __esModule: true,
    default: class {
        props: any
        constructor(props: any) {
            this.props = props
        }
        setState() {}
    },
}))
jest.mock('../../../global/CenteredSpinner', () => ({}))
jest.mock('./OneClickAppDeployProgress', () => ({}))
jest.mock('../../../../utils/DomUtils', () => ({
    __esModule: true,
    default: { scrollToTopBar: jest.fn() },
}))
jest.mock('../../../../utils/Toaster', () => ({
    __esModule: true,
    default: { createCatcher: jest.fn(() => jest.fn()) },
}))

function createPage(service: unknown) {
    const template = {
        services: { app: service },
        captainVersion: 4,
        caproverOneClickApp: { variables: [] },
    }
    const values = [{ key: '$$cap_token', value: 'secret' }]
    const params = new URLSearchParams({
        template: JSON.stringify(template),
        valuesArray: JSON.stringify(values),
        appName: 'example',
        templateName: 'TEMPLATE_ONE_CLICK',
    })
    const history = { goBack: jest.fn() }
    const page = new OneClickDeploymentPage({
        location: { search: `?${params}` },
        history,
    })
    const startOneClickAppDeploy = jest.fn().mockResolvedValue({ jobId: 'job' })
    Object.assign(page, { apiManager: { startOneClickAppDeploy } })
    return { page, history, startOneClickAppDeploy, template, values }
}

it('sends normalized template fields and unchanged variable values to the API', async () => {
    const { page, startOneClickAppDeploy, template, values } = createPage({
        image: 'example',
        environment: ['TOKEN=$$cap_token'],
        volumes: [{ type: 'volume', source: 'data', target: '/data' }],
        ports: [{ published: 8080, target: 80 }],
    })
    page.componentDidMount()
    expect(startOneClickAppDeploy).toHaveBeenCalledWith(
        {
            ...template,
            services: {
                app: {
                    image: 'example',
                    environment: { TOKEN: '$$cap_token' },
                    volumes: ['data:/data'],
                    ports: ['8080:80'],
                },
            },
        },
        values,
        'TEMPLATE_ONE_CLICK'
    )
    await Promise.resolve()
})

it('reports incompatible options and stops before the API request', () => {
    const { page, history, startOneClickAppDeploy } = createPage({
        ports: [{ target: 80, published: 8080, host_ip: '127.0.0.1' }],
    })
    const reportError = jest.fn()
    const createCatcher = Toaster.createCatcher as jest.Mock
    createCatcher.mockReturnValue(reportError)
    page.componentDidMount()
    expect(startOneClickAppDeploy).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalledWith(
        expect.stringContaining('services.app.ports[0].host_ip')
    )
    expect(history.goBack).toHaveBeenCalled()
})
