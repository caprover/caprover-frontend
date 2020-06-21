export const ROOT_KEY_CHANGED = 'ROOT_KEY_CHANGED'
export const SIZE_CHANGED = 'SIZE_CHANGED'

export function emitRootKeyChanged() {
    return {
        type: ROOT_KEY_CHANGED,
        payload: {},
    }
}

export function emitSizeChanged() {
    return {
        type: SIZE_CHANGED,
        payload: {},
    }
}
