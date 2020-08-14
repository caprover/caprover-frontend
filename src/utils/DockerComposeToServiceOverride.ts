import * as yaml from 'yaml'
import { IDockerComposeService } from '../models/IOneClickAppModels'
import Utils from './Utils'

export default class DockerComposeToServiceOverride {
    static convertComposeToService(compose: IDockerComposeService) {
        // NOTE:
        // Port, replicas, env vars, volumes, and image are supplied through CapRover definition
        // network will be set to captain-overlay
        // restart_policy is not generally needed, by default docker services restart automatically
        // ----
        // Only parse parameters that are not from the aforementioned list.
        // The only useful parameter that we are parsing at the moment is hostname: https://github.com/caprover/caprover/issues/404

        const overrides = [] as any[]
        overrides.push(DockerComposeToServiceOverride.parseHostname(compose))

        let mergedOverride = {} as any
        overrides.forEach((o) => {
            mergedOverride = Utils.mergeObjects(mergedOverride, o)
        })
        if (Object.keys(mergedOverride).length === 0) {
            return undefined
        }

        return yaml.stringify(mergedOverride)
    }

    private static parseHostname(compose: IDockerComposeService) {
        const override = {} as any
        const hostname = !!compose.hostname ? `${compose.hostname}`.trim() : ''
        if (!!compose.hostname) {
            override.TaskTemplate = {
                ContainerSpec: {
                    Hostname: hostname,
                },
            }
        }

        return override
    }
}
