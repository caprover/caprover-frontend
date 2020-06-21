import { Col, Input, Row } from 'antd'
import React, { Component } from 'react'
import Utils from '../../../../utils/Utils'
import PasswordField from '../../../global/PasswordField'
import { RepoInfo } from '../../AppDefinition'

export default class GitRepoForm extends Component<{
    gitRepoValues: RepoInfo
    updateRepoInfo: (newRepoInfo: RepoInfo) => void
}> {
    render() {
        return (
            <div>
                <form action="/" autoComplete="off">
                    <Row gutter={20}>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.gitRepoValues.repo}
                                addonBefore="Repository"
                                placeholder="github.com/someone/something"
                                type="url"
                                spellCheck={false}
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="off"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.repo = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.gitRepoValues.branch}
                                addonBefore={
                                    <span>Branch&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                }
                                placeholder="master"
                                type="text"
                                spellCheck={false}
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="off"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.branch = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 12 }}
                            className={
                                this.props.gitRepoValues.sshKey
                                    ? 'hide-on-demand'
                                    : ''
                            }
                        >
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.gitRepoValues.user}
                                addonBefore={<span>Username&nbsp;</span>}
                                placeholder="myemail@gmail.com"
                                type="email"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.user = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 12 }}
                            className={
                                this.props.gitRepoValues.sshKey
                                    ? 'hide-on-demand'
                                    : ''
                            }
                        >
                            <PasswordField
                                defaultValue={this.props.gitRepoValues.password}
                                addonBefore="Password"
                                placeholder="githubpassword"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.password = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col span={24}>
                            <span>
                                Or, instead of username/password, use SSH Key:
                            </span>
                            <Input.TextArea
                                style={{ marginBottom: 20 }}
                                rows={4}
                                value={this.props.gitRepoValues.sshKey}
                                placeholder={
                                    '-----BEGIN RSA PRIVATE KEY-----\nAABBBCCC'
                                }
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.sshKey = e.target.value
                                    if (newObj.sshKey) {
                                        // Upon changing SSH key, we forcefully remove user/pass to inform the user that SSH will take priority
                                        newObj.password = ''
                                        newObj.user = ''
                                    }
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                    </Row>
                </form>
            </div>
        )
    }
}
