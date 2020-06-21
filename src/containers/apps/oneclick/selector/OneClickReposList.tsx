import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import Search from 'antd/lib/input/Search'
import React from 'react'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'

export default class OneClickReposList extends ApiComponent<
    {},
    {
        apiData: any
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
        }
    }

    componentDidMount() {
        const self = this
        self.fetchData()
    }

    fetchData() {
        const self = this
        self.apiManager
            .getAllOneClickAppRepos()
            .then(function (apiData) {
                self.setState({
                    apiData,
                })
            })
            .catch(Toaster.createCatcher())
    }

    onConnectNewRepositoryClicked(domain: string) {
        const self = this
        self.apiManager
            .addNewCustomOneClickRepo(domain)
            .then(function () {
                self.setState({
                    apiData: undefined,
                })
                self.fetchData()
            })
            .catch(Toaster.createCatcher())
    }

    onDeleteUrlClicked(url: string) {
        const self = this
        Modal.confirm({
            title: 'Remove One Click Repo',
            content: (
                <div>
                    <p>
                        Are you sure you want to delete the one click repository
                        from your list?
                    </p>
                    <code>{url}</code>
                </div>
            ),
            onOk() {
                self.apiManager
                    .deleteCustomOneClickRepo(url)
                    .then(function () {
                        self.fetchData()
                    })
                    .catch(Toaster.createCatcher())
            },
            onCancel() {
                // do nothing
            },
        })
    }

    createUrlRow(url: string) {
        const self = this
        return (
            <div key={url} style={{ margin: 10 }}>
                <Button
                    style={{ marginRight: 10 }}
                    onClick={() => {
                        self.onDeleteUrlClicked(url)
                    }}
                    size="small"
                    danger
                >
                    <span>
                        <DeleteOutlined />
                    </span>
                </Button>

                {url}
            </div>
        )
    }

    create3rdPartyRepoList() {
        const self = this

        if (!self.state.apiData) return undefined

        if (!self.state.apiData.urls) return undefined

        const urls = Utils.copyObject(self.state.apiData.urls as string[])

        return <div>{urls.map((u) => self.createUrlRow(u))}</div>
    }

    render() {
        const self = this

        if (!this.state.apiData) return <CenteredSpinner />

        return (
            <div>
                <h4>3rd party repositories:</h4>
                <div style={{ maxWidth: 600, marginBottom: 30 }}>
                    <Search
                        placeholder="oneclick-apps.your-3rd-party-domain.com"
                        enterButton="Connect New Repository"
                        onSearch={(value) =>
                            self.onConnectNewRepositoryClicked(value)
                        }
                    />
                </div>
                {self.create3rdPartyRepoList()}
            </div>
        )
    }
}
