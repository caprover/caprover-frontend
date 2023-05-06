import { message } from 'antd'

export default class Toaster {
    static toastError(error: any) {
        let errorMessage = 'Something bad happened.'
        if (error.captainStatus) {
            let errorDescription = error.captainMessage || errorMessage
            errorMessage = `${error.captainStatus} : ${errorDescription}`
        }
        message.error(errorMessage)
        if (!!process.env.REACT_APP_IS_DEBUG) console.error(error)
    }

    static toastInfo(info: string) {
        message.info(info)
    }

    static toastSuccess(success: string) {
        message.success(success)
    }

    static createCatcher(functionToRun?: Function) {
        return function (error: any) {
            Toaster.toastError(error)
            if (functionToRun) {
                functionToRun()
            }
        }
    }
}
