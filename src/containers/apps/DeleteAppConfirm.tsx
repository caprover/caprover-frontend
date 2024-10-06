import { Checkbox, Input, Modal, message } from 'antd'
import ApiManager from '../../api/ApiManager'
import { IHashMapGeneric } from '../../models/IHashMapGeneric'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import NewTabLink from '../global/NewTabLink'
import { IAppDef } from './AppDefinition'

export default function onDeleteAppClicked(
    appDefinitionsInput: IAppDef[],
    projects: ProjectDefinition[],
    apiManager: ApiManager,
    onFinished: (success: boolean) => void
) {
    const volumesToDelete: IHashMapGeneric<boolean> = {}
    const allVolumesNames = new Set<string>()

    const appDefinitions: IAppDef[] = []

    const confirmation = { confirmationText: '' }

    appDefinitionsInput.forEach((a) => {
        appDefinitions.push(Utils.copyObject(a))
    })

    appDefinitions.forEach((appDef) => {
        if (appDef.volumes) {
            appDef.volumes.forEach((v) => {
                if (v.volumeName) {
                    allVolumesNames.add(v.volumeName)
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

    const projectList = (
        <ul style={{ marginTop: 6 }}>
            {projects.map((a) => (
                <li key={a.id || ''}>
                    {' '}
                    <code>{a.name}</code>
                </li>
            ))}
        </ul>
    )

    Modal.confirm({
        okType: 'danger',
        title: localize('apps.delete_app_title', 'Confirm Permanent Delete?'),
        content: (
            <div>
                <div>
                    <div
                        className={
                            appDefinitions.length ? '' : 'hide-on-demand'
                        }
                    >
                        {localize('apps.delete_app_apps_list', 'Apps')}:
                        {appsList}
                    </div>
                    <div className={projects.length ? '' : 'hide-on-demand'}>
                        {localize('apps.delete_app_projects_list', 'Projects')}:
                        {projectList}
                    </div>
                    <b>
                        {' '}
                        {localize(
                            'apps.delete_app_warning',
                            'Please note that this is not reversible'
                        )}
                    </b>
                    .
                </div>
                <p className={allVolumesNames.size ? '' : 'hide-on-demand'}>
                    {localize(
                        'apps.delete_app_volumes_to_delete',
                        'Please select the volumes you want to delete. Note that if any of the volumes are being used by other CapRover apps, they will not be deleted even if you select them. Deleting volumes takes more than 10 seconds, please be patient'
                    )}
                </p>
                {Array.from(allVolumesNames).map((v) => {
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
                    {localize(
                        'apps.delete_app_confirm',
                        'Type %s in the box below to confirm deletion'
                    )
                        .split('%s')
                        .join('CONFIRM')}
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
                    localize(
                        'apps.delete_app_failed_confirm',
                        'Confirm text did not match. Operation cancelled.'
                    )
                )
                return
            }
            const volumes: string[] = []
            Object.keys(volumesToDelete).forEach((v) => {
                if (volumesToDelete[v]) {
                    volumes.push(v)
                }
            })

            return Promise.resolve()
                .then(function () {
                    if (!appDefinitions || appDefinitions.length === 0) return
                    return apiManager
                        .deleteApp(
                            undefined,
                            volumes,
                            appDefinitions.map((a) => a.appName || '')
                        )
                        .then(function (data) {
                            const volumesFailedToDelete =
                                data.volumesFailedToDelete as string[]
                            if (
                                volumesFailedToDelete &&
                                volumesFailedToDelete.length
                            ) {
                                Modal.info({
                                    title: "Some volumes weren't deleted!",
                                    content: (
                                        <div>
                                            <p>
                                                Some volumes weren't deleted
                                                because they were probably being
                                                used by other containers.
                                                Sometimes, this is because of a
                                                temporary delay when the
                                                original container deletion was
                                                done with a delay. Please
                                                consult the{' '}
                                                <NewTabLink url="https://caprover.com/docs/persistent-apps.html#removing-persistent-apps">
                                                    documentation
                                                </NewTabLink>{' '}
                                                and delete them manually if
                                                needed. Skipped volumes are:
                                            </p>
                                            <ul>
                                                {volumesFailedToDelete.map(
                                                    (v) => (
                                                        <li>
                                                            <code>{v}</code>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    ),
                                })
                            }

                            message.success(
                                localize(
                                    'apps.delete_app_apps_deleted',
                                    'App(s) deleted!'
                                )
                            )
                        })
                })
                .then(function () {
                    if (projects.length) {
                        return apiManager
                            .deleteProjects(projects.map((it) => it.id))
                            .then(() => {
                                message.success(
                                    localize(
                                        'apps.delete_app_project_deleted',
                                        'Project(s) deleted!'
                                    )
                                )
                            })
                    }
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
