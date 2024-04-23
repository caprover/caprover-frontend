import { Checkbox, Input, Modal, message } from 'antd'
import ApiManager from '../../api/ApiManager'
import { IHashMapGeneric } from '../../models/IHashMapGeneric'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import NewTabLink from '../global/NewTabLink'
import { IAppDef } from './AppDefinition'

export default function onDeleteAppClicked(
    appDefinitionsInput: IAppDef[],
    apiManager: ApiManager,
    onRequestSent: () => void,
    onFinished: (success: boolean) => void
) {
    const volumesToDelete: IHashMapGeneric<boolean> = {}

    const appDefinitions: IAppDef[] = []

    const confirmation = { confirmationText: '' }

    appDefinitionsInput.forEach((a) => {
        appDefinitions.push(Utils.copyObject(a))
    })

    const allVolumes: string[] = []

    appDefinitions.forEach((appDef) => {
        if (appDef.volumes) {
            appDef.volumes.forEach((v) => {
                if (v.volumeName) {
                    allVolumes.push(v.volumeName)
                    volumesToDelete[v.volumeName] = true
                }
            })
        }
    })

    const appsList = (
        <ul>
            {appDefinitions.map((a) => (
                <li key={a.appName || ''}>
                    {' '}
                    <code>{a.appName}</code>
                </li>
            ))}
        </ul>
    )

    Modal.confirm({
        okType: 'danger',
        title: 'Confirm Permanent Delete?',
        content: (
            <div>
                <div>
                    You are about to delete {appsList}
                    Please note that this is
                    <b> not reversible</b>.
                </div>
                <p className={allVolumes.length ? '' : 'hide-on-demand'}>
                    Please select the volumes you want to delete. Note that if
                    any of the volumes are being used by other CapRover apps,
                    they will not be deleted even if you select them. Deleting
                    volumes takes <b>more than 10 seconds</b>, please be patient
                </p>
                {allVolumes.map((v) => {
                    return (
                        <div key={v}>
                            <Checkbox
                                defaultChecked={!!volumesToDelete[v]}
                                onChange={(e: any) => {
                                    volumesToDelete[v] = !volumesToDelete[v]
                                }}
                            >
                                {v}
                            </Checkbox>
                        </div>
                    )
                })}
                <p style={{ marginTop: 25 }}>
                    Type CONFIRM in the box below to confirm deletion of this
                    app:
                </p>
                <Input
                    type="text"
                    placeholder={'CONFIRM'}
                    onChange={(e) => {
                        confirmation.confirmationText = e.target.value.trim()
                    }}
                />
            </div>
        ),
        onOk() {
            if (confirmation.confirmationText.toLowerCase() !== 'confirm') {
                message.warning(
                    'Confirm text did not match. Operation cancelled.'
                )
                return
            }
            const volumes: string[] = []
            Object.keys(volumesToDelete).forEach((v) => {
                if (volumesToDelete[v]) {
                    volumes.push(v)
                }
            })

            return apiManager
                .deleteApp(
                    undefined,
                    volumes,
                    appDefinitions.map((a) => a.appName || '')
                )
                .then(function (data) {
                    const volumesFailedToDelete =
                        data.volumesFailedToDelete as string[]
                    if (volumesFailedToDelete && volumesFailedToDelete.length) {
                        Modal.info({
                            title: "Some volumes weren't deleted!",
                            content: (
                                <div>
                                    <p>
                                        Some volumes weren't deleted because
                                        they were probably being used by other
                                        containers. Sometimes, this is because
                                        of a temporary delay when the original
                                        container deletion was done with a
                                        delay. Please consult the{' '}
                                        <NewTabLink url="https://caprover.com/docs/persistent-apps.html#removing-persistent-apps">
                                            documentation
                                        </NewTabLink>{' '}
                                        and delete them manually if needed.
                                        Skipped volumes are:
                                    </p>
                                    <ul>
                                        {volumesFailedToDelete.map((v) => (
                                            <li>
                                                <code>{v}</code>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ),
                        })
                    }
                    message.success('App deleted!')
                })
                .then(function () {
                    onFinished(true)
                })
                .catch(
                    Toaster.createCatcher(function () {
                        onFinished(false)
                    })
                )
        },
        onCancel() {
            // do nothing
        },
    })
}
