import { Card, Empty, Icon, Input, Row, Tooltip } from 'antd'
import React, { Component, Fragment } from 'react'
import { IHashMapGeneric } from '../../../../models/IHashMapGeneric'
import { IOneClickAppIdentifier } from '../../../../models/IOneClickAppModels'
import StringSimilarity from '../../../../utils/StringSimilarity'
import NewTabLink from '../../../global/NewTabLink'

export default class OneClickGrid extends Component<
    {
        oneClickAppList: IOneClickAppIdentifier[]
        onAppSelectionChanged: (appName: string, baseDomain: string) => void
    },
    { sortScores: IHashMapGeneric<number>; selectedApp: string | undefined }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            selectedApp: undefined,
            sortScores: {},
        }
    }

    create3rdPartyTagIfNeeded(app: IOneClickAppIdentifier) {
        const MAIN_REPO = `https://oneclickapps.caprover.com`

        if (app.baseUrl === MAIN_REPO) {
            return undefined
        }

        return (
            <div style={{ marginTop: 20 }}>
                <Row align="middle" justify="end" type="flex">
                    <Tooltip title={'From: ' + app.baseUrl}>
                        <Icon type="flag" theme="twoTone" />
                    </Tooltip>
                </Row>
            </div>
        )
    }

    createOneClickApp(app: IOneClickAppIdentifier) {
        const self = this
        return (
            <div key={app.name + app.baseUrl} className="one-click-app-card">
                <Card
                    onClick={() =>
                        this.props.onAppSelectionChanged(app.name, app.baseUrl)
                    }
                    cover={
                        <img
                            style={{ margin: 10 }}
                            src={app.logoUrl}
                            alt="App logo"
                        />
                    }
                    hoverable
                >
                    <Card.Meta
                        title={app.displayName}
                        description={app.description}
                    />
                    {self.create3rdPartyTagIfNeeded(app)}
                </Card>
            </div>
        )
    }

    render() {
        const self = this

        let apps = self.props.oneClickAppList
        if (Object.keys(self.state.sortScores).length > 0) {
            const appsSorted = apps.concat().sort((a, b) => {
                return (
                    (self.state.sortScores[b.name] || 0) -
                    (self.state.sortScores[a.name] || 0)
                )
            })

            apps = appsSorted.filter((it) => {
                return self.state.sortScores[it.name] > 0.5
            })
        }

        return (
            <Fragment>
                <div style={{ height: 40 }} />
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    <Input.Search
                        style={{ maxWidth: 200, marginBottom: 30 }}
                        placeholder="Search for an app..."
                        onChange={({ currentTarget }) => {
                            const searchTerm = (currentTarget.value || '')
                                .trim()
                                .toLowerCase()
                            const sortScores: IHashMapGeneric<number> = {}

                            if (searchTerm) {
                                self.props.oneClickAppList.forEach((app) => {
                                    let score = 0

                                    const appNameForSearch = (
                                        (app.displayName || '').trim() ||
                                        app.name
                                    )
                                        .toLowerCase()
                                        .trim()

                                    if (
                                        appNameForSearch
                                            .toLowerCase()
                                            .includes(searchTerm)
                                    ) {
                                        score = 1
                                    } else if (
                                        app.description &&
                                        app.description
                                            .toLowerCase()
                                            .includes(searchTerm)
                                    ) {
                                        score = 0.99
                                    } else {
                                        score = StringSimilarity.compareTwoStrings(
                                            searchTerm,
                                            appNameForSearch
                                        )
                                    }

                                    sortScores[app.name] = score || 0
                                })
                            }

                            self.setState({ sortScores })
                        }}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {apps.length ? (
                        apps.length &&
                        apps.map((app) => self.createOneClickApp(app))
                    ) : (
                        <div>
                            <Empty description="No matching App" />
                            <div style={{ paddingTop: 30 }}>
                                What if the app/database I want is not listed
                                here? &nbsp;
                                <NewTabLink url="https://caprover.com/docs/one-click-apps.html#what-about-other-apps">
                                    <Icon type="info-circle" />
                                </NewTabLink>
                            </div>
                        </div>
                    )}
                </div>
            </Fragment>
        )
    }
}
