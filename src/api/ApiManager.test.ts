import ApiManager from './ApiManager'

describe('ApiManager.startOneClickAppDeploy', () => {
    it('sends parent and group project options through the generic API', async () => {
        const apiManager = Object.create(ApiManager.prototype) as ApiManager
        const executeGenericApiCommand = jest
            .fn()
            .mockResolvedValue({ jobId: 'job-id' })
        const mutableApiManager = apiManager as any
        mutableApiManager.executeGenericApiCommand = executeGenericApiCommand
        const template = { services: { web: {} } }
        const values = [{ key: 'KEY', value: 'value' }]

        await apiManager.startOneClickAppDeploy(template, values, {
            parentProjectId: ' parent-id ',
            projectName: ' compose-stack ',
        })

        expect(executeGenericApiCommand).toHaveBeenCalledWith(
            'POST',
            '/user/oneclick/deploy',
            {
                template,
                values,
                parentProjectId: 'parent-id',
                projectName: 'compose-stack',
            }
        )
    })

    it('sends an explicit root project for old callers', async () => {
        const apiManager = Object.create(ApiManager.prototype) as ApiManager
        const executeGenericApiCommand = jest.fn().mockResolvedValue({
            jobId: 'job-id',
        })
        const mutableApiManager = apiManager as any
        mutableApiManager.executeGenericApiCommand = executeGenericApiCommand

        await apiManager.startOneClickAppDeploy({}, [])

        expect(executeGenericApiCommand).toHaveBeenCalledWith(
            'POST',
            '/user/oneclick/deploy',
            {
                template: {},
                values: [],
                parentProjectId: '',
            }
        )
    })

    it('accepts positional project options for compatible callers', async () => {
        const apiManager = Object.create(ApiManager.prototype) as ApiManager
        const executeGenericApiCommand = jest.fn().mockResolvedValue({
            jobId: 'job-id',
        })
        const mutableApiManager = apiManager as any
        mutableApiManager.executeGenericApiCommand = executeGenericApiCommand

        await apiManager.startOneClickAppDeploy(
            {},
            [],
            'parent-id',
            'compose-stack'
        )

        expect(executeGenericApiCommand).toHaveBeenCalledWith(
            'POST',
            '/user/oneclick/deploy',
            {
                template: {},
                values: [],
                parentProjectId: 'parent-id',
                projectName: 'compose-stack',
            }
        )
    })
})
