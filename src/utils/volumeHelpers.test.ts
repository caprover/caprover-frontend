import { IAppDef } from '../containers/apps/AppDefinition'
import {
    buildVolumeUsageIndex,
    formatLocalized,
    getOtherAppsUsingVolumeLabel,
    resolvePhysicalVolumeName,
} from './volumeHelpers'

function makeApp(
    appName: string,
    options: {
        isLegacyAppName?: boolean
        volumes?: Array<{
            containerPath?: string
            volumeName?: string
            hostPath?: string
        }>
    } = {}
): IAppDef {
    return {
        appName,
        isLegacyAppName: options.isLegacyAppName,
        volumes: (options.volumes || []).map((v) => ({
            containerPath: v.containerPath || '/data',
            volumeName: v.volumeName,
            hostPath: v.hostPath,
        })),
        // Minimal IAppDef fields required by the type; unused by helpers
        deployedVersion: 0,
        notExposeAsWebApp: false,
        hasPersistentData: true,
        hasDefaultSubDomainSsl: false,
        containerHttpPort: 80,
        captainDefinitionRelativeFilePath: 'captain-definition',
        forceSsl: false,
        websocketSupport: false,
        instanceCount: 1,
        networks: [],
        customDomain: [],
        ports: [],
        envVars: [],
        versions: [],
    }
}

describe('resolvePhysicalVolumeName', () => {
    it('returns empty string for empty or whitespace-only label', () => {
        expect(resolvePhysicalVolumeName('', false)).toBe('')
        expect(resolvePhysicalVolumeName('   ', false)).toBe('')
        expect(resolvePhysicalVolumeName('', true)).toBe('')
        expect(resolvePhysicalVolumeName(undefined as any, false)).toBe('')
    })

    it('returns label as-is for modern apps', () => {
        expect(resolvePhysicalVolumeName('my-data', false)).toBe('my-data')
        expect(resolvePhysicalVolumeName('my-data', undefined)).toBe('my-data')
        expect(resolvePhysicalVolumeName('  my-data  ', false)).toBe('my-data')
    })

    it('prefixes namespace for legacy apps with default captain namespace', () => {
        expect(resolvePhysicalVolumeName('data', true)).toBe('captain--data')
        expect(resolvePhysicalVolumeName('  data  ', true)).toBe(
            'captain--data'
        )
    })

    it('uses custom namespace when provided for legacy apps', () => {
        expect(resolvePhysicalVolumeName('data', true, 'custom')).toBe(
            'custom--data'
        )
    })

    it('does not rewrite modern labels that look like legacy physical names', () => {
        // Theoretical: API normally forbids `--` in volume names
        expect(resolvePhysicalVolumeName('captain--data', false)).toBe(
            'captain--data'
        )
    })
})

describe('buildVolumeUsageIndex', () => {
    it('returns empty object for empty app list', () => {
        expect(buildVolumeUsageIndex([])).toEqual({})
    })

    it('skips apps without appName', () => {
        const app = makeApp('', { volumes: [{ volumeName: 'data' }] })
        app.appName = undefined
        expect(buildVolumeUsageIndex([app])).toEqual({})
    })

    it('indexes modern labels as-is', () => {
        const apps = [
            makeApp('api', { volumes: [{ volumeName: 'shared-db' }] }),
            makeApp('worker', { volumes: [{ volumeName: 'shared-db' }] }),
        ]
        expect(buildVolumeUsageIndex(apps)).toEqual({
            'shared-db': ['api', 'worker'],
        })
    })

    it('indexes legacy labels with captain-- prefix using each app flag', () => {
        const apps = [
            makeApp('old-app', {
                isLegacyAppName: true,
                volumes: [{ volumeName: 'data' }],
            }),
        ]
        expect(buildVolumeUsageIndex(apps)).toEqual({
            'captain--data': ['old-app'],
        })
    })

    it('excludes hostPath bind mounts even with residual volumeName', () => {
        const apps = [
            makeApp('api', {
                volumes: [
                    {
                        volumeName: 'should-ignore',
                        hostPath: '/host/path',
                    },
                    { volumeName: 'kept' },
                ],
            }),
        ]
        expect(buildVolumeUsageIndex(apps)).toEqual({
            kept: ['api'],
        })
    })

    it('skips empty volume labels', () => {
        const apps = [
            makeApp('api', {
                volumes: [{ volumeName: '' }, { volumeName: '   ' }],
            }),
        ]
        expect(buildVolumeUsageIndex(apps)).toEqual({})
    })

    it('sorts unique app names', () => {
        const apps = [
            makeApp('zeta', { volumes: [{ volumeName: 'v' }] }),
            makeApp('alpha', { volumes: [{ volumeName: 'v' }] }),
            makeApp('zeta', { volumes: [{ volumeName: 'v' }] }),
        ]
        // Two entries with same appName still unique via Set
        expect(buildVolumeUsageIndex(apps)['v']).toEqual(['alpha', 'zeta'])
    })
})

describe('getOtherAppsUsingVolumeLabel', () => {
    it('returns empty array when label is empty', () => {
        const index = { data: ['other'] }
        expect(
            getOtherAppsUsingVolumeLabel('', false, 'me', index)
        ).toEqual([])
        expect(
            getOtherAppsUsingVolumeLabel('   ', false, 'me', index)
        ).toEqual([])
    })

    it('returns other modern apps using the same label', () => {
        const apps = [
            makeApp('api', { volumes: [{ volumeName: 'shared-db' }] }),
            makeApp('worker', { volumes: [{ volumeName: 'shared-db' }] }),
        ]
        const index = buildVolumeUsageIndex(apps)
        expect(
            getOtherAppsUsingVolumeLabel(
                'shared-db',
                false,
                'api',
                index
            )
        ).toEqual(['worker'])
    })

    it('excludes the current app from the list', () => {
        const apps = [
            makeApp('only-mine', { volumes: [{ volumeName: 'mine' }] }),
        ]
        const index = buildVolumeUsageIndex(apps)
        expect(
            getOtherAppsUsingVolumeLabel('mine', false, 'only-mine', index)
        ).toEqual([])
    })

    it('critical: mixed-era same logical label does not collide', () => {
        // Legacy "data" → captain--data; modern "data" → data
        const apps = [
            makeApp('legacy-app', {
                isLegacyAppName: true,
                volumes: [{ volumeName: 'data' }],
            }),
            makeApp('modern-app', {
                isLegacyAppName: false,
                volumes: [{ volumeName: 'data' }],
            }),
        ]
        const index = buildVolumeUsageIndex(apps)
        expect(index).toEqual({
            'captain--data': ['legacy-app'],
            data: ['modern-app'],
        })
        expect(
            getOtherAppsUsingVolumeLabel(
                'data',
                true,
                'legacy-app',
                index
            )
        ).toEqual([])
        expect(
            getOtherAppsUsingVolumeLabel(
                'data',
                false,
                'modern-app',
                index
            )
        ).toEqual([])
    })

    it('warns when two modern apps share the same label', () => {
        const apps = [
            makeApp('a', { volumes: [{ volumeName: 'shared' }] }),
            makeApp('b', { volumes: [{ volumeName: 'shared' }] }),
        ]
        const index = buildVolumeUsageIndex(apps)
        expect(
            getOtherAppsUsingVolumeLabel('shared', false, 'a', index)
        ).toEqual(['b'])
    })

    it('resolves lookup with current app legacy flag against index', () => {
        const apps = [
            makeApp('legacy-app', {
                isLegacyAppName: true,
                volumes: [{ volumeName: 'data' }],
            }),
            makeApp('other-legacy', {
                isLegacyAppName: true,
                volumes: [{ volumeName: 'data' }],
            }),
        ]
        const index = buildVolumeUsageIndex(apps)
        expect(
            getOtherAppsUsingVolumeLabel(
                'data',
                true,
                'legacy-app',
                index
            )
        ).toEqual(['other-legacy'])
    })

    it('returns empty when index is empty', () => {
        expect(
            getOtherAppsUsingVolumeLabel('data', false, 'me', {})
        ).toEqual([])
    })
})

describe('formatLocalized', () => {
    it('replaces %s with the provided value', () => {
        expect(
            formatLocalized(
                'This volume is already used by other application(s): %s',
                'my-db, worker'
            )
        ).toBe(
            'This volume is already used by other application(s): my-db, worker'
        )
    })

    it('replaces all %s occurrences', () => {
        expect(formatLocalized('%s and %s', 'a')).toBe('a and a')
    })
})
