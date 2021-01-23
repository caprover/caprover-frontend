import {
    FlagTwoTone,
    InfoCircleOutlined,
    SafetyCertificateTwoTone,
} from '@ant-design/icons'
import { Card, Empty, Input, Row, Tooltip } from 'antd'
import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { IHashMapGeneric } from '../../../../models/IHashMapGeneric'
import { IOneClickAppIdentifier } from '../../../../models/IOneClickAppModels'
import StringSimilarity from '../../../../utils/StringSimilarity'
import NewTabLink from '../../../global/NewTabLink'

export default class OneClickGrid extends Component<
    {
        oneClickAppList: IOneClickAppIdentifier[]
        onAppSelectionChanged: (
            event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
            appName: string
        ) => void
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

        const isFromMainRepository = app.baseUrl === MAIN_REPO || !app.baseUrl
        const isUsingOfficialImage = !!app.isOfficial

        return (
            <div style={{ marginTop: 20 }}>
                <Row align="middle" justify="space-between">
                    {isFromMainRepository ? undefined : (
                        <Tooltip title={`From: ${app.baseUrl}`}>
                            <FlagTwoTone />
                        </Tooltip>
                    )}
                    {!isUsingOfficialImage ? undefined : (
                        <Tooltip
                            title={`Uses the official image provided by the application developer, or a trusted source like Bitnami or LinuxServer`}
                        >
                            <SafetyCertificateTwoTone />
                        </Tooltip>
                    )}
                </Row>
            </div>
        )
    }

    createOneClickApp(app: IOneClickAppIdentifier) {
        const self = this
        // For template selection set uri to #
        const url =
            app.name && app.baseUrl
                ? `/apps/oneclick/${app.name}?baseDomain=${encodeURIComponent(
                      app.baseUrl
                  )}`
                : '#'
        return (
            <div key={app.name + app.baseUrl} className="one-click-app-card">
                <Link
                    to={url}
                    onClick={(event) =>
                        this.props.onAppSelectionChanged(event, app.name)
                    }
                >
                    <Card
                        cover={<img src={app.logoUrl} alt="App logo" />}
                        hoverable
                    >
                        <Card.Meta
                            title={app.displayName}
                            description={app.description}
                        />
                        {self.create3rdPartyTagIfNeeded(app)}
                    </Card>
                </Link>
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
                                    <InfoCircleOutlined />
                                </NewTabLink>
                            </div>
                        </div>
                    )}
                </div>
            </Fragment>
        )
    }
}
