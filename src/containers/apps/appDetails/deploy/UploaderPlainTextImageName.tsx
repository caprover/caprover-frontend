import { ICaptainDefinition } from '../../../../models/ICaptainDefinition'
import UploaderPlainTextBase from './UploaderPlainTextBase'

export default class UploaderPlainTextImageName extends UploaderPlainTextBase {
    protected getPlaceHolderValue() {
        return `nginxdemos/hello:latest`
    }

    protected isSingleLine() {
        return true
    }

    protected convertDataToCaptainDefinition(userEnteredValue: string) {
        const capDefinition: ICaptainDefinition = {
            schemaVersion: 2,
            imageName: userEnteredValue.trim(),
        }

        return JSON.stringify(capDefinition)
    }
}
