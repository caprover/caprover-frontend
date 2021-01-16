import DarkModeHelper from '../../utils/ThemeModeHelper'
import Utils from '../../utils/Utils'
import {
    DARK_MODE_CHANGED,
    ROOT_KEY_CHANGED,
    SIZE_CHANGED,
} from '../actions/GlobalActions'

const defaultState = {
    isDarkMode: true,
}

export default function (
    state = defaultState,
    action: { payload: any; type: string }
) {
    switch (action.type) {
        case ROOT_KEY_CHANGED:
            return { ...state, rootElementKey: Utils.generateUuidV4() }
        case SIZE_CHANGED:
            return { ...state, isMobile: Utils.isMobile() }
        case DARK_MODE_CHANGED:
            DarkModeHelper.loadTheme(action.payload)
            return { ...state, isDarkMode: action.payload }
        default:
            return state
    }
}
