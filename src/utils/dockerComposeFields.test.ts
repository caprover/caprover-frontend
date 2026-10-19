import { getIgnoredDockerComposeFields } from './dockerComposeFields'

describe('getIgnoredDockerComposeFields', () => {
    it('reports ignored root and service fields with their full paths', () => {
        expect(
            getIgnoredDockerComposeFields({
                version: '3.8',
                services: {
                    web: {
                        image: 'nginx',
                        build: { context: '.', args: { image: 'ignored' } },
                        restart: 'always',
                        deploy: { replicas: 3 },
                    },
                    db: { image: 'mysql', container_name: 'db' },
                },
                volumes: { data: { driver: 'local' } },
                networks: { private: {} },
            })
        ).toEqual([
            'version',
            'volumes',
            'networks',
            'services.web.build',
            'services.web.restart',
            'services.web.deploy',
            'services.db.container_name',
        ])
    })

    it('accepts consumed fields and arbitrary environment variable names', () => {
        expect(
            getIgnoredDockerComposeFields({
                services: {
                    web: {
                        image: 'nginx',
                        volumes: ['data:/data'],
                        ports: ['8080:80'],
                        environment: { restart: 'value', build: 'value' },
                        depends_on: ['db'],
                        hostname: 'web',
                        cap_add: ['NET_ADMIN'],
                        command: ['nginx'],
                        caproverExtra: {
                            dockerfileLines: ['FROM nginx'],
                            containerHttpPort: 80,
                            notExposeAsWebApp: true,
                            websocketSupport: true,
                        },
                    },
                },
            })
        ).toEqual([])
    })

    it('checks caproverExtra without treating arbitrary nested keys as fields', () => {
        expect(
            getIgnoredDockerComposeFields({
                services: {
                    web: {
                        caproverExtra: { containerHttpPort: 80, typo: true },
                        labels: { image: 'ignored with labels' },
                    },
                },
            })
        ).toEqual([
            'services.web.caproverExtra.typo',
            'services.web.labels',
        ])
    })

    it('reports metadata overwritten by the Compose entry page', () => {
        expect(
            getIgnoredDockerComposeFields({
                services: {},
                captainVersion: 4,
                caproverOneClickApp: { variables: [] },
            })
        ).toEqual(['captainVersion', 'caproverOneClickApp'])
    })

    it('handles empty and incomplete input without throwing', () => {
        for (const input of [undefined, null, '', [], 42, {}]) {
            expect(getIgnoredDockerComposeFields(input)).toEqual([])
        }
        for (const services of [null, [], 'invalid']) {
            expect(getIgnoredDockerComposeFields({ services })).toEqual([])
        }
        expect(
            getIgnoredDockerComposeFields({
                services: { web: null, db: [], api: { caproverExtra: null } },
            })
        ).toEqual([])
    })

    it('updates warnings as fields are removed without changing the input', () => {
        const compose = {
            services: { web: { image: 'nginx', restart: 'always' } },
        }
        const before = JSON.stringify(compose)
        expect(getIgnoredDockerComposeFields(compose)).toEqual([
            'services.web.restart',
        ])
        expect(JSON.stringify(compose)).toBe(before)
        expect(
            getIgnoredDockerComposeFields({
                services: { web: { image: 'nginx' } },
            })
        ).toEqual([])
    })

    it('treats names inherited from Object.prototype as ignored fields', () => {
        expect(
            getIgnoredDockerComposeFields({
                services: { web: { toString: 'ignored' } },
            })
        ).toEqual(['services.web.toString'])
    })
})
