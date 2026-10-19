import * as yaml from 'yaml'
import { IOneClickTemplate } from '../models/IOneClickAppModels'
import normalizeComposeTemplate from './normalizeComposeTemplate'

function template(service: unknown): IOneClickTemplate {
    return {
        captainVersion: 4,
        caproverOneClickApp: {
            instructions: { start: 'Start', end: 'Done' },
            displayName: 'Example',
            variables: [],
        },
        services: { app: service },
    } as IOneClickTemplate
}

describe('normalizeComposeTemplate', () => {
    it('produces the same backend payload for both YAML syntaxes', () => {
        const short = yaml.parse(`
image: example:latest
environment:
  TOKEN: a=b==
  EMPTY: ''
  PORT: '8080'
volumes:
  - data:/data
  - /srv/config:/config
ports:
  - '8080:80'
`)
        const long = yaml.parse(`
image: example:latest
environment:
  - TOKEN=a=b==
  - EMPTY=
  - PORT=8080
volumes:
  - type: volume
    source: data
    target: /data
  - type: bind
    source: /srv/config
    target: /config
    read_only: false
ports:
  - target: 80
    published: '8080'
    protocol: tcp
    mode: ingress
`)
        expect(normalizeComposeTemplate(template(long))).toEqual(
            normalizeComposeTemplate(template(short))
        )
    })

    it('preserves metadata, unrelated fields, and existing short syntax without mutating input', () => {
        const original = template({
            image: 'example',
            environment: { COUNT: 0, ENABLED: false },
            volumes: [
                'data:/data',
                { type: 'volume', source: 'cache', target: '/cache' },
            ],
            ports: ['8080:80', { published: 9090, target: 90 }],
            depends_on: ['db'],
            command: ['run', '--verbose'],
            caproverExtra: { containerHttpPort: 80 },
        })
        const snapshot = JSON.stringify(original)
        const normalized = normalizeComposeTemplate(original)
        expect(JSON.stringify(original)).toBe(snapshot)
        expect(normalized.caproverOneClickApp).toEqual(
            original.caproverOneClickApp
        )
        expect(normalized.services.app).toEqual({
            ...original.services.app,
            environment: { COUNT: '0', ENABLED: 'false' },
            volumes: ['data:/data', 'cache:/cache'],
            ports: ['8080:80', '9090:90'],
        })
        expect(normalizeComposeTemplate(normalized)).toEqual(normalized)
    })

    it('keeps empty values, uses the last assignment, and omits unresolved variables', () => {
        const environment = [
            'EMPTY=',
            'TOKEN=first',
            'TOKEN=a=b',
            'UNSET=old',
            'UNSET',
        ]
        expect(
            normalizeComposeTemplate(template({ environment })).services.app
                .environment
        ).toEqual({ EMPTY: '', TOKEN: 'a=b' })
        const map = yaml.parse('EMPTY: ""\nUNSET:\n')
        expect(
            normalizeComposeTemplate(template({ environment: map })).services
                .app.environment
        ).toEqual({ EMPTY: '' })
    })

    it('preserves special environment keys as data', () => {
        const normalized = normalizeComposeTemplate(
            template({
                environment: ['__proto__=value', 'constructor=other'],
            })
        )
        expect(
            JSON.parse(JSON.stringify(normalized)).services.app.environment
        ).toEqual(JSON.parse('{"__proto__":"value","constructor":"other"}'))
    })

    it('preserves One-Click variable placeholders until backend substitution', () => {
        const normalized = normalizeComposeTemplate(
            template({
                environment: ['TOKEN=$$cap_token'],
                volumes: [
                    {
                        type: 'volume',
                        source: '$$cap_appname-data',
                        target: '/data',
                    },
                ],
                ports: [
                    {
                        published: '$$cap_host_port',
                        target: '$$cap_container_port',
                    },
                ],
            })
        )
        expect(normalized.services.app.ports).toEqual([
            '$$cap_host_port:$$cap_container_port',
        ])
        expect(normalized.services.app.volumes).toEqual([
            '$$cap_appname-data:/data',
        ])
        expect(normalized.services.app.environment).toEqual({
            TOKEN: '$$cap_token',
        })
    })

    it.each([
        [{ environment: [{ KEY: 'value' }] }, 'environment[0]'],
        [{ environment: ['=value'] }, 'environment[0]'],
        [{ environment: { KEY: ['value'] } }, 'environment.KEY'],
        [{ volumes: { data: '/data' } }, 'volumes'],
        [{ volumes: [{ type: 'tmpfs', target: '/tmp' }] }, 'volumes[0].type'],
        [
            {
                volumes: [
                    {
                        type: 'volume',
                        source: 'data',
                        target: '/data',
                        read_only: true,
                    },
                ],
            },
            'volumes[0].read_only',
        ],
        [
            {
                volumes: [
                    {
                        type: 'volume',
                        source: 'data',
                        target: '/data',
                        volume: { nocopy: true },
                    },
                ],
            },
            'volumes[0].volume',
        ],
        [
            { volumes: [{ type: 'bind', source: './data', target: '/data' }] },
            'volumes[0].source',
        ],
        [{ volumes: [{ type: 'volume', target: '/data' }] }, 'volumes[0]'],
        [{ ports: { '8080': 80 } }, 'ports'],
        [{ ports: [{ target: 80 }] }, 'ports[0].published'],
        [
            { ports: [{ target: 80, published: '8080-8082' }] },
            'ports[0].published',
        ],
        [{ ports: [{ target: 65536, published: 8080 }] }, 'ports[0].target'],
        [
            { ports: [{ target: 80, published: 8080, protocol: 'udp' }] },
            'ports[0].protocol',
        ],
        [
            { ports: [{ target: 80, published: 8080, host_ip: '127.0.0.1' }] },
            'ports[0].host_ip',
        ],
        [
            { ports: [{ target: 80, published: 8080, mode: 'host' }] },
            'ports[0].mode',
        ],
    ])(
        'rejects an unsupported input with its field path: %j',
        (service, path) => {
            expect(() => normalizeComposeTemplate(template(service))).toThrow(
                `services.app.${path}`
            )
        }
    )

    it('normalizes every service', () => {
        const original = template({ environment: ['A=one'] })
        original.services.db = { environment: ['B=two'] } as any
        expect(
            normalizeComposeTemplate(original).services.db.environment
        ).toEqual({ B: 'two' })
    })
})
