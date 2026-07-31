import { IOneClickTemplate } from '../models/IOneClickAppModels'
import {
    createOneClickDeploymentUrl,
    parseOneClickDeploymentUrl,
} from './OneClickDeploymentUrl'

const template: IOneClickTemplate = {
    captainVersion: 4,
    services: {
        web: { image: 'nginx:1.27' },
    },
    caproverOneClickApp: {
        displayName: 'Web & API',
        instructions: { start: 'Start', end: 'Done' },
        variables: [],
    },
}

describe('one-click deployment URL', () => {
    it('round-trips the parent project and Compose group name', () => {
        const url = createOneClickDeploymentUrl({
            template,
            valuesArray: [{ key: 'PASSWORD', value: 'a&b=c' }],
            appName: 'Docker Compose',
            parentProjectId: ' parent-id ',
            projectName: ' compose-stack ',
        })

        const parsed = parseOneClickDeploymentUrl(url.split('?')[1])

        expect(parsed).toEqual({
            template,
            valuesArray: [{ key: 'PASSWORD', value: 'a&b=c' }],
            appName: 'Docker Compose',
            parentProjectId: 'parent-id',
            projectName: 'compose-stack',
        })
    })

    it('keeps root as the default for legacy deployment URLs', () => {
        const url = createOneClickDeploymentUrl({
            template,
            valuesArray: [],
            appName: 'nginx',
            parentProjectId: '',
        })

        const parsed = parseOneClickDeploymentUrl(url.split('?')[1])

        expect(parsed.parentProjectId).toBe('')
        expect(parsed.projectName).toBeUndefined()
    })
})
