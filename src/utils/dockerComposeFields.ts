// Keep these lists in sync with the backend consumers, rather than the model alone:
// image, volumes, ports, environment, and caproverExtra:
// https://github.com/caprover/caprover/blob/master/src/user/oneclick/OneClickAppDeploymentHelper.ts
// depends_on (deployment order only):
// https://github.com/caprover/caprover/blob/master/src/user/oneclick/OneClickAppDeployManager.ts
// hostname, cap_add, and command:
// https://github.com/caprover/caprover/blob/master/src/utils/DockerComposeToServiceOverride.ts
const consumedServiceFields = [
    'image',
    'volumes',
    'ports',
    'environment',
    'depends_on',
    'hostname',
    'cap_add',
    'command',
    'caproverExtra',
]

const consumedExtraFields = [
    'dockerfileLines',
    'containerHttpPort',
    'notExposeAsWebApp',
    'websocketSupport',
]

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

// This checks field consumption only, not whether supported fields use valid syntax.
export function getIgnoredDockerComposeFields(compose: unknown): string[] {
    if (!isRecord(compose)) return []

    // DockerComposeEntry supplies its own captainVersion and caproverOneClickApp.
    // Only services from the pasted document reach the deployment consumers.
    const ignored = Object.keys(compose).filter((key) => key !== 'services')
    const services = compose.services
    if (!isRecord(services)) return ignored

    Object.keys(services).forEach((serviceName) => {
        const service = services[serviceName]
        if (!isRecord(service)) return

        const prefix = `services.${serviceName}`
        Object.keys(service).forEach((key) => {
            if (!consumedServiceFields.includes(key)) {
                ignored.push(`${prefix}.${key}`)
            } else if (key === 'caproverExtra') {
                const extra = service[key]
                if (!isRecord(extra)) return
                Object.keys(extra).forEach((extraKey) => {
                    if (!consumedExtraFields.includes(extraKey)) {
                        ignored.push(`${prefix}.caproverExtra.${extraKey}`)
                    }
                })
            }
        })
    })

    return ignored
}
