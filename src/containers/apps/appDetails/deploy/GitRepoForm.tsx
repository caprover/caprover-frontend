import { Col, Input, Row, Select } from 'antd'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
import Utils from '../../../../utils/Utils'
import PasswordField from '../../../global/PasswordField'
import { RepoInfo } from '../../AppDefinition'

enum GitAuthentication {
    Public = 'public',
    Https = 'https',
    Ssh = 'ssh',
}

// The existing API requires credentials. This exact username/password pair is
// reserved to recognize Public repository settings when reopening the editor.
const PUBLIC_REPO_PLACEHOLDER = 'caprover-public'

export interface GitRepoDraft extends RepoInfo {
    authentication: GitAuthentication
}

export function createGitRepoDraft(repoInfo: RepoInfo): GitRepoDraft {
    const { user, password, sshKey } = repoInfo
    const hasPublicPlaceholder =
        !sshKey &&
        user === PUBLIC_REPO_PLACEHOLDER &&
        password === PUBLIC_REPO_PLACEHOLDER

    let authentication = GitAuthentication.Public
    if (sshKey) {
        authentication = GitAuthentication.Ssh
    } else if (!hasPublicPlaceholder && (user || password)) {
        authentication = GitAuthentication.Https
    }

    return {
        ...repoInfo,
        repo: repoInfo.repo ?? '',
        branch: repoInfo.branch ?? '',
        authentication,
        user: hasPublicPlaceholder ? '' : (user ?? ''),
        password: hasPublicPlaceholder ? '' : (password ?? ''),
    }
}

export function getGitRepoInfoForSave(
    draft: GitRepoDraft,
    savedRepoInfo: RepoInfo
): RepoInfo {
    const { authentication, ...repoInfo } = draft
    switch (authentication) {
        case GitAuthentication.Https:
            return { ...repoInfo, sshKey: '' }
        case GitAuthentication.Ssh:
            // Existing configurations can store both credentials and use SSH.
            if (savedRepoInfo.sshKey && repoInfo.sshKey) {
                return {
                    ...repoInfo,
                    user: savedRepoInfo.user ?? '',
                    password: savedRepoInfo.password ?? '',
                }
            }
            return { ...repoInfo, user: '', password: '' }
        case GitAuthentication.Public: {
            const placeholder =
                repoInfo.repo.trim() && repoInfo.branch.trim()
                    ? PUBLIC_REPO_PLACEHOLDER
                    : ''
            return {
                ...repoInfo,
                user: placeholder,
                password: placeholder,
                sshKey: '',
            }
        }
    }
}

export default class GitRepoForm extends Component<{
    gitRepoValues: GitRepoDraft
    updateRepoInfo: (newRepoInfo: GitRepoDraft) => void
}> {
    render() {
        const { authentication } = this.props.gitRepoValues
        const authenticationLabel = localize(
            'apps.deploy_git_authentication',
            'Authentication'
        )
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
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <label htmlFor="git-authentication">
                                {authenticationLabel}
                            </label>
                            <Select<GitAuthentication>
                                id="git-authentication"
                                aria-label={authenticationLabel}
                                style={{ display: 'block', marginBottom: 20 }}
                                value={authentication}
                                // Expose all three options to screen readers.
                                virtual={false}
                                options={[
                                    {
                                        value: GitAuthentication.Public,
                                        label: localize(
                                            'apps.deploy_git_auth_public',
                                            'Public repository'
                                        ),
                                    },
                                    {
                                        value: GitAuthentication.Https,
                                        label: localize(
                                            'apps.deploy_git_auth_https',
                                            'HTTPS credentials'
                                        ),
                                    },
                                    {
                                        value: GitAuthentication.Ssh,
                                        label: localize(
                                            'apps.deploy_git_auth_ssh',
                                            'SSH deploy key'
                                        ),
                                    },
                                ]}
                                onChange={(selected) => {
                                    const newObj = Utils.copyObject(
                                        this.props.gitRepoValues
                                    )
                                    newObj.authentication = selected
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                    </Row>
                    {authentication === GitAuthentication.Https && (
                        <Row gutter={20}>
                            <Col xs={{ span: 24 }} lg={{ span: 12 }}>
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
                            <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                <PasswordField
                                    defaultValue={
                                        this.props.gitRepoValues.password
                                    }
                                    addonBefore={localize(
                                        'apps.deploy_git_password',
                                        'Password'
                                    )}
                                    placeholder={localize(
                                        'apps.deploy_git_password_or_token',
                                        'Password or access token'
                                    )}
                                    onChange={(e) => {
                                        const newObj = Utils.copyObject(
                                            this.props.gitRepoValues
                                        )
                                        newObj.password = e.target.value
                                        this.props.updateRepoInfo(newObj)
                                    }}
                                />
                            </Col>
                        </Row>
                    )}
                    {authentication === GitAuthentication.Ssh && (
                        <Row gutter={20}>
                            <Col span={24}>
                                <label htmlFor="git-ssh-private-key">
                                    {localize(
                                        'apps.deploy_git_ssh_private_key',
                                        'SSH private key'
                                    )}
                                </label>
                                <Input.TextArea
                                    id="git-ssh-private-key"
                                    style={{ marginBottom: 20 }}
                                    rows={4}
                                    value={
                                        this.props.gitRepoValues.sshKey || ''
                                    }
                                    placeholder={
                                        '-----BEGIN RSA PRIVATE KEY-----\nAABBBCCC'
                                    }
                                    onChange={(e) => {
                                        const newObj = Utils.copyObject(
                                            this.props.gitRepoValues
                                        )
                                        newObj.sshKey = e.target.value
                                        this.props.updateRepoInfo(newObj)
                                    }}
                                />
                            </Col>
                        </Row>
                    )}
                </form>
            </div>
        )
    }
}
