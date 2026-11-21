import { Col, Input, Row } from 'antd'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
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
                <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                    <Row gutter={20}>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.gitRepoValues.repo}
                                addonBefore={localize(
                                    'apps.deploy_git_repo',
                                    'Repository'
                                )}
                                aria-label={localize(
                                    'apps.deploy_git_repo',
                                    'Repository'
                                )}
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
                                addonBefore={localize(
                                    'apps.deploy_git_branch',
                                    'Branch'
                                )}
                                aria-label={localize(
                                    'apps.deploy_git_branch',
                                    'Branch'
                                )}
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
                                addonBefore={localize(
                                    'apps.deploy_git_username',
                                    'Username'
                                )}
                                aria-label={localize(
                                    'apps.deploy_git_username',
                                    'Username'
                                )}
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
                                addonBefore={localize(
                                    'apps.deploy_git_password',
                                    'Password'
                                )}
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
                                {localize(
                                    'apps.deploy_ssh_key_replacement_description',
                                    'Or, instead of username/password, use SSH Key:'
                                )}
                            </span>
                            <Input.TextArea
                                style={{ marginBottom: 20 }}
                                rows={4}
                                aria-label={localize(
                                    'apps.deploy_git_ssh_key',
                                    'SSH Key'
                                )}
                                value={this.props.gitRepoValues.sshKey || ''}
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
