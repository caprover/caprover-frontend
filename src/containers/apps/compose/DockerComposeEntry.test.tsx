jest.mock('../../../api/ApiManager', () => ({
    __esModule: true,
    default: class { destroy() {} },
}))
jest.mock('../../../utils/Language', () => ({
    localize: (_key: string, message: string) => message,
}))

import DockerComposeEntry from './DockerComposeEntry'
import {
    DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
    ONE_CLICK_APP_NAME_VAR_NAME,
} from '../oneclick/OneClickDeploymentConstants'

test('Docker Compose passes the project name as $$cap_appname', () => {
    const push = jest.fn()
    new DockerComposeEntry({ history: { push } } as any).deploy(
        { services: {} },
        'my-compose-project'
    )
    const query = new URLSearchParams(push.mock.calls[0][0].split('?')[1])
    expect(JSON.parse(query.get(DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY)!)).toEqual([
        { key: ONE_CLICK_APP_NAME_VAR_NAME, value: 'my-compose-project' },
    ])
})
