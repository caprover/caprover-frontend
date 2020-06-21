import Utils from '../../utils/Utils'
import { ROOT_KEY_CHANGED, SIZE_CHANGED } from '../actions/GlobalActions'

export default function (state = {}, action: { payload: any; type: string }) {
    switch (action.type) {
        case ROOT_KEY_CHANGED:
            return { ...state, rootElementKey: Utils.generateUuidV4() }
        case SIZE_CHANGED:
            return { ...state, isMobile: Utils.isMobile() }
        default:
            return state
    }
}
