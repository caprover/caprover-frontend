import { IOneClickTemplate } from '../models/IOneClickAppModels'

export const DEPLOYMENT_QUERY_PARAM_TEMPLATE = 'template'
export const DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY = 'valuesArray'
export const DEPLOYMENT_QUERY_PARAM_APP_NAME = 'appName'
export const DEPLOYMENT_QUERY_PARAM_PARENT_PROJECT_ID = 'parentProjectId'
export const DEPLOYMENT_QUERY_PARAM_PROJECT_NAME = 'projectName'

export interface OneClickDeploymentUrlData {
    template: IOneClickTemplate
    valuesArray: Array<{ key: string; value: string }>
    appName: string
    parentProjectId: string
    projectName?: string
}

export function createOneClickDeploymentUrl(
    data: OneClickDeploymentUrlData
): string {
    const query = new URLSearchParams()
    query.set(DEPLOYMENT_QUERY_PARAM_TEMPLATE, JSON.stringify(data.template))
    query.set(
        DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
        JSON.stringify(data.valuesArray)
    )
    query.set(DEPLOYMENT_QUERY_PARAM_APP_NAME, data.appName)
    query.set(
        DEPLOYMENT_QUERY_PARAM_PARENT_PROJECT_ID,
        `${data.parentProjectId || ''}`.trim()
    )

    if (data.projectName !== undefined) {
        query.set(
            DEPLOYMENT_QUERY_PARAM_PROJECT_NAME,
            `${data.projectName || ''}`.trim()
        )
    }
    return `/apps/oneclick/deployment?${query.toString()}`
}

export function parseOneClickDeploymentUrl(
    search: string
): OneClickDeploymentUrlData {
    const query = new URLSearchParams(search)
    const templateString = query.get(DEPLOYMENT_QUERY_PARAM_TEMPLATE)
    const valuesArrayString = query.get(DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY)
    const appName = query.get(DEPLOYMENT_QUERY_PARAM_APP_NAME)

    if (!templateString || !valuesArrayString || !appName) {
        throw new Error('Missing required parameters for deployment')
    }

    const valuesArray = JSON.parse(valuesArrayString)
    if (!Array.isArray(valuesArray)) {
        throw new Error('Invalid values array for deployment')
    }

    const projectName = query.get(DEPLOYMENT_QUERY_PARAM_PROJECT_NAME)
    return {
        template: JSON.parse(templateString) as IOneClickTemplate,
        valuesArray,
        appName,
        parentProjectId: `${
            query.get(DEPLOYMENT_QUERY_PARAM_PARENT_PROJECT_ID) || ''
        }`.trim(),
        projectName:
            projectName === null ? undefined : `${projectName || ''}`.trim(),
    }
}
