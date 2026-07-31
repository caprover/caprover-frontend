import { isProjectNameAllowed, normalizeProjectName } from './ProjectName'

describe('project name rules', () => {
    it('normalizes user input to lowercase kebab-case', () => {
        expect(normalizeProjectName('  My Compose Stack  ')).toBe(
            'my-compose-stack'
        )
    })

    it.each(['compose', 'compose-2', 'a1'])('accepts %p', (name) => {
        expect(isProjectNameAllowed(name)).toBe(true)
    })

    it.each([
        '',
        'Compose',
        '-compose',
        'compose-',
        'compose--stack',
        'root',
        'captain',
    ])('rejects %p', (name) => {
        expect(isProjectNameAllowed(name)).toBe(false)
    })
})
