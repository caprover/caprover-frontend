import CrashReporter from './CrashReporter'

class ErrorFactory {
    public readonly OKAY = 100
    public readonly OKAY_BUILD_STARTED = 101
    public readonly OK_PARTIALLY = 102

    public readonly STATUS_ERROR_GENERIC = 1000
    public readonly STATUS_ERROR_CAPTAIN_NOT_INITIALIZED = 1001
    public readonly STATUS_ERROR_USER_NOT_INITIALIZED = 1101
    public readonly STATUS_ERROR_NOT_AUTHORIZED = 1102
    public readonly STATUS_ERROR_ALREADY_EXIST = 1103
    public readonly STATUS_ERROR_BAD_NAME = 1104
    public readonly STATUS_WRONG_PASSWORD = 1105
    public readonly STATUS_AUTH_TOKEN_INVALID = 1106
    public readonly VERIFICATION_FAILED = 1107
    public readonly ILLEGAL_OPERATION = 1108
    public readonly BUILD_ERROR = 1109
    public readonly ILLEGAL_PARAMETER = 1110
    public readonly NOT_FOUND = 1111
    public readonly AUTHENTICATION_FAILED = 1112
    public readonly STATUS_PASSWORD_BACK_OFF = 1113

    public readonly UNKNOWN_ERROR = 1999

    createError(status: number, message: string) {
        let e = new Error(message || 'null') as any
        e.captainStatus = status
        e.captainMessage = message
        return e
    }

    eatUpPromiseRejection() {
        return function (error: any) {
            CrashReporter.getInstance().captureException(error)
            // nom nom
        }
    }
}

export default new ErrorFactory()
