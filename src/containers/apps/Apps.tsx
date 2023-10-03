import { RouteComponentProps } from 'react-router'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import { IAppDef } from './AppDefinition'
import AppsTable from './AppsTable'
import CreateNewApp from './CreateNewApp'

export default class Apps extends ApiComponent<
    RouteComponentProps<any>,
    {
        isLoading: boolean
        apiData:
            | {
                  appDefinitions: IAppDef[]
                  defaultNginxConfig: string
                  rootDomain: string
              }
            | undefined
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: true,
            apiData: undefined,
        }
    }

    onCreateNewAppClicked(appName: string, hasPersistentData: boolean) {
        const self = this

        Promise.resolve() //
            .then(function () {
                self.setState({ isLoading: true })
                return self.apiManager.registerNewApp(
                    appName,
                    hasPersistentData,
                    true
                )
            })
            .then(function () {
                return self.reFetchData()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        const apiData = self.state.apiData

        if (!apiData) {
            return <ErrorRetry />
        }

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 25,
                    padding: '0 20px',
                    margin: '0 auto 300px',
                    maxWidth: 1000,
                }}
            >
                <CreateNewApp
                    onCreateNewAppClicked={(
                        appName: string,
                        hasPersistency: boolean
                    ) => {
                        self.onCreateNewAppClicked(appName, hasPersistency)
                    }}
                />
                {apiData.appDefinitions.length > 0 ? (
                    <AppsTable
                        search={self.props.location.search}
                        history={self.props.history}
                        defaultNginxConfig={apiData.defaultNginxConfig}
                        apps={apiData.appDefinitions}
                        rootDomain={apiData.rootDomain}
                    />
                ) : (
                    <div />
                )}
            </div>
        )
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        self.setState({ isLoading: true })
        return this.apiManager
            .getAllApps()
            .then(function (data: any) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }
}
