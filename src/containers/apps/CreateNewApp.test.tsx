import { CreateNewApp } from './CreateNewApp'

jest.mock('../../utils/Language', () => ({
    localize: (key: string, message: string) => message,
}))

describe('CreateNewApp project assignment', () => {
    const createProps = () => ({
        isMobile: true,
        projects: [],
        onCreateNewAppClicked: jest.fn(),
        onOneClickAppClicked: jest.fn(),
        onDockerComposeClicked: jest.fn(),
    })

    it('defaults to root, sends a selection, and supports clearing it', () => {
        const props = createProps()
        const component = new CreateNewApp(props as any)
        const mutableState = component.state as any
        mutableState.appName = 'test-app'

        component.onCreateNewAppClicked()
        expect(props.onCreateNewAppClicked).toHaveBeenLastCalledWith(
            'test-app',
            '',
            false
        )

        mutableState.selectedProjectId = 'project-id'
        component.onCreateNewAppClicked()
        expect(props.onCreateNewAppClicked).toHaveBeenLastCalledWith(
            'test-app',
            'project-id',
            false
        )

        mutableState.selectedProjectId = ''
        component.onCreateNewAppClicked()
        expect(props.onCreateNewAppClicked).toHaveBeenLastCalledWith(
            'test-app',
            '',
            false
        )
    })

    it('keeps the apps home selector hidden when no projects exist', () => {
        const component = new CreateNewApp(createProps() as any)

        expect(component.createProjectInApp()).toBeUndefined()
    })
})
