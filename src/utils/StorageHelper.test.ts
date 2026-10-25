import StorageHelper, { REMEMBER_ME_OPTION } from './StorageHelper'

describe('Remember Me option storage', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it('returns undefined when no option has been stored', () => {
        expect(
            StorageHelper.getRememberMeOptionFromLocalStorage()
        ).toBeUndefined()
    })

    it.each([1, 2, 3])('stores and reads option %i', (option) => {
        StorageHelper.setRememberMeOptionInLocalStorage(option)

        expect(window.localStorage.getItem(REMEMBER_ME_OPTION)).toBe(
            JSON.stringify(option)
        )
        expect(StorageHelper.getRememberMeOptionFromLocalStorage()).toBe(option)
    })

    it.each([
        ['malformed JSON', '{not-json'],
        ['a JSON string', JSON.stringify('2')],
        ['a fractional number', JSON.stringify(2.5)],
        ['a boolean', JSON.stringify(true)],
        ['null', 'null'],
    ])('returns undefined for %s', (_description, value) => {
        window.localStorage.setItem(REMEMBER_ME_OPTION, value)

        expect(
            StorageHelper.getRememberMeOptionFromLocalStorage()
        ).toBeUndefined()
    })

    it('does not persist a non-integer option', () => {
        StorageHelper.setRememberMeOptionInLocalStorage(2.5)

        expect(window.localStorage.getItem(REMEMBER_ME_OPTION)).not.toBeTruthy()
    })
})

describe('Setup dismissal storage', () => {
    beforeEach(() => localStorage.clear())
    it('persists dismissal across reads in the current origin', () => {
        expect(StorageHelper.getSetupDismissedFromLocalStorage()).toBe(false)
        StorageHelper.setSetupDismissedInLocalStorage()
        expect(StorageHelper.getSetupDismissedFromLocalStorage()).toBe(true)
    })
    it('treats unrelated or malformed stored values as unfinished', () => {
        localStorage.setItem('CAPROVER_SETUP_DISMISSED', 'not-a-boolean')
        expect(StorageHelper.getSetupDismissedFromLocalStorage()).toBe(false)
    })
})
