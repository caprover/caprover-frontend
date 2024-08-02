import * as yaml from 'yaml'
import { IDockerComposeService } from '../models/IOneClickAppModels'
import Utils from './Utils'

export default class DockerComposeToServiceOverride {
    /**
     * Converts the unsupported docker compose parameters to CapRover service override definition.
     * Port, replicas, env vars, volumes, and image are supplied through CapRover definition,
     * network will be set to captain-overlay restart_policy is not generally needed,
     * by default docker services restart automatically.
     * Only parse parameters that are not from the aforementioned list.
     * The only useful parameter that we are parsing at the moment is hostname: https://github.com/caprover/caprover/issues/404
     *
     * @param docker compose service definition
     * @returns the override service definition in yaml format
     */
    static convertUnconsumedComposeParametersToServiceOverride(
        compose: IDockerComposeService
    ) {
        const overrides = [] as any[]
        overrides.push(DockerComposeToServiceOverride.parseHostname(compose))
        // Add more overrides here if needed

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
