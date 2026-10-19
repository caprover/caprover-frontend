import { IOneClickTemplate } from '../models/IOneClickAppModels'

function isSet(value: unknown) {
    // YAML null is a valid unset value.
    // tslint:disable-next-line:no-null-keyword
    return value !== undefined && value !== null
}

function fail(path: string, message: string): never {
    throw new Error(`${path}: ${message}`)
}

function mapping(value: unknown, path: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fail(path, 'Expected a mapping.')
    }
    return value as Record<string, unknown>
}

function checkOptions(
    value: Record<string, unknown>,
    allowed: string[],
    path: string
) {
    Object.keys(value).forEach((key) => {
        if (!allowed.includes(key)) {
            fail(
                `${path}.${key}`,
                'This option cannot be represented by CapRover.'
            )
        }
    })
}

function normalizeEnvironment(value: unknown, path: string) {
    // Preserve arbitrary environment names, including __proto__, as data.
    // tslint:disable-next-line:no-null-keyword
    const result: Record<string, string> = Object.create(null)
    if (Array.isArray(value)) {
        value.forEach((entry, index) => {
            if (typeof entry !== 'string' || !entry.split('=')[0]) {
                fail(`${path}[${index}]`, 'Expected KEY=value or KEY.')
            }
            const separator = entry.indexOf('=')
            if (separator < 0) {
                // The browser has no Compose host environment to resolve bare keys.
                delete result[entry]
            } else {
                result[entry.slice(0, separator)] = entry.slice(separator + 1)
            }
        })
    } else {
        const entries = mapping(value, path)
        Object.keys(entries).forEach((key) => {
            const entry = entries[key]
            if (!isSet(entry)) return
            if (!['string', 'number', 'boolean'].includes(typeof entry)) {
                fail(`${path}.${key}`, 'Expected a scalar environment value.')
            }
            result[key] = String(entry)
        })
    }
    return result
}

function normalizeList(
    value: unknown,
    path: string,
    convert: (entry: Record<string, unknown>, path: string) => string
): string[] {
    if (!Array.isArray(value)) return fail(path, 'Expected a list.')
    return value.map((entry, index) => {
        if (typeof entry === 'string') return entry
        const entryPath = `${path}[${index}]`
        return convert(mapping(entry, entryPath), entryPath)
    })
}

function normalizeVolume(entry: Record<string, unknown>, path: string) {
    checkOptions(entry, ['type', 'source', 'target', 'read_only'], path)
    if (entry.type !== 'volume' && entry.type !== 'bind') {
        fail(`${path}.type`, 'Only volume and bind mounts are supported.')
    }
    if (entry.read_only !== undefined && entry.read_only !== false) {
        fail(
            `${path}.read_only`,
            'Read-only mounts are unsupported by CapRover.'
        )
    }
    if (
        typeof entry.source !== 'string' ||
        !entry.source ||
        entry.source.includes(':') ||
        typeof entry.target !== 'string' ||
        !entry.target.startsWith('/') ||
        entry.target.includes(':')
    ) {
        fail(path, 'A source and an absolute container target are required.')
    }
    if ((entry.type === 'bind') !== entry.source.startsWith('/')) {
        fail(
            `${path}.source`,
            'Bind sources must be absolute host paths; volume sources must be names.'
        )
    }
    return `${entry.source}:${entry.target}`
}

function normalizePort(entry: Record<string, unknown>, path: string) {
    checkOptions(entry, ['target', 'published', 'protocol', 'mode'], path)
    if (entry.protocol !== undefined && entry.protocol !== 'tcp') {
        fail(
            `${path}.protocol`,
            'Only protocol: tcp can be converted to the existing one-click port format.'
        )
    }
    if (entry.mode !== undefined && entry.mode !== 'ingress') {
        fail(
            `${path}.mode`,
            'Only ingress port publishing is supported by CapRover.'
        )
    }
    for (const key of ['published', 'target']) {
        const value = entry[key]
        if (
            !['string', 'number'].includes(typeof value) ||
            !/^(\d+|\$\$cap_\w+)$/.test(String(value)) ||
            (/^\d+$/.test(String(value)) &&
                (Number(value) < 1 || Number(value) > 65535))
        ) {
            fail(`${path}.${key}`, 'A single port from 1 to 65535 is required.')
        }
    }
    return `${entry.published}:${entry.target}`
}

/**
 * Normalize input syntax while preserving the backend's one-click contract.
 * Keep in sync with the environment map and colon-separated volume/port lists consumed at:
 * https://github.com/caprover/caprover/blob/master/src/user/oneclick/OneClickAppDeploymentHelper.ts
 * Long-form options that this consumer cannot preserve must fail before deployment.
 */
export default function normalizeComposeTemplate(
    template: IOneClickTemplate
): IOneClickTemplate {
    const services = mapping(template.services, 'services')
    // Service names must also be treated as data.
    // tslint:disable-next-line:no-null-keyword
    const normalized: IOneClickTemplate['services'] = Object.create(null)
    Object.keys(services).forEach((name) => {
        const service = mapping(services[name], `services.${name}`)
        const result = { ...service }
        if (isSet(service.environment)) {
            result.environment = normalizeEnvironment(
                service.environment,
                `services.${name}.environment`
            )
        }
        if (isSet(service.volumes)) {
            result.volumes = normalizeList(
                service.volumes,
                `services.${name}.volumes`,
                normalizeVolume
            )
        }
        if (isSet(service.ports)) {
            result.ports = normalizeList(
                service.ports,
                `services.${name}.ports`,
                normalizePort
            )
        }
        normalized[name] = result
    })
    return { ...template, services: normalized }
}
