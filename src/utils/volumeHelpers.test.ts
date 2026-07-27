import { VolumeListItem } from '../models/VolumeInfo'
import {
    formatLocalized,
    getOtherAppsUsingVolume,
    resolvePhysicalVolumeName,
} from './volumeHelpers'

function makeVolume(
    name: string,
    usedByAppNames: string[],
    isLikelySystem = false
): VolumeListItem {
    return {
        name,
        driver: 'local',
        mountpoint: `/var/lib/docker/volumes/${name}/_data`,
        scope: 'local',
        labels: {},
        options: null,
        usedByAppNames,
        isLikelySystem,
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
        expect(resolvePhysicalVolumeName('captain--data', false)).toBe(
            'captain--data'
        )
    })
})

describe('getOtherAppsUsingVolume', () => {
    const volumes: VolumeListItem[] = [
        makeVolume('my-postgres-data', ['my-db', 'worker']),
        makeVolume('captain--legacy-data', ['old-app']),
        makeVolume('only-mine', ['current-app']),
        makeVolume('unused-vol', []),
    ]

    it('returns empty array when physical name is empty', () => {
        expect(getOtherAppsUsingVolume('', volumes, 'current-app')).toEqual([])
    })

    it('returns empty array when volume is not in inventory', () => {
        expect(
            getOtherAppsUsingVolume('unknown-vol', volumes, 'current-app')
        ).toEqual([])
    })

    it('returns empty array for empty inventory', () => {
        expect(
            getOtherAppsUsingVolume('my-postgres-data', [], 'current-app')
        ).toEqual([])
    })

    it('returns other apps using the volume', () => {
        expect(
            getOtherAppsUsingVolume('my-postgres-data', volumes, 'other-app')
        ).toEqual(['my-db', 'worker'])
    })

    it('excludes the current app from the list', () => {
        expect(
            getOtherAppsUsingVolume('my-postgres-data', volumes, 'my-db')
        ).toEqual(['worker'])
        expect(
            getOtherAppsUsingVolume('only-mine', volumes, 'current-app')
        ).toEqual([])
    })

    it('returns empty when volume has no usedByAppNames', () => {
        expect(
            getOtherAppsUsingVolume('unused-vol', volumes, 'current-app')
        ).toEqual([])
    })

    it('handles missing usedByAppNames gracefully', () => {
        const broken = [
            {
                ...makeVolume('broken', []),
                usedByAppNames: undefined as any,
            },
        ]
        expect(getOtherAppsUsingVolume('broken', broken, 'app')).toEqual([])
    })

    it('matches legacy physical names', () => {
        expect(
            getOtherAppsUsingVolume(
                'captain--legacy-data',
                volumes,
                'current-app'
            )
        ).toEqual(['old-app'])
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

describe('legacy resolve → getOtherAppsUsingVolume (AppConfigs path)', () => {
    it('resolves logical label for legacy app and lists other apps', () => {
        const inventory: VolumeListItem[] = [
            makeVolume('captain--data', ['legacy-app', 'other-app']),
        ]
        const physical = resolvePhysicalVolumeName('data', true)
        expect(physical).toBe('captain--data')
        expect(
            getOtherAppsUsingVolume(physical, inventory, 'legacy-app')
        ).toEqual(['other-app'])
    })

    it('does not warn when only the current legacy app uses the volume', () => {
        const inventory: VolumeListItem[] = [
            makeVolume('captain--data', ['legacy-app']),
        ]
        const physical = resolvePhysicalVolumeName('data', true)
        expect(
            getOtherAppsUsingVolume(physical, inventory, 'legacy-app')
        ).toEqual([])
    })
})
