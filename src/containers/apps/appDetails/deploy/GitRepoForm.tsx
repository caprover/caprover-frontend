import { Col, Input, Row, Select } from 'antd'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
import PasswordField from '../../../global/PasswordField'
import { RepoInfo } from '../../AppDefinition'

enum GitAuthentication {
    Public = 'public',
    Https = 'https',
    Ssh = 'ssh',
}

// Existing servers require a non-empty credential pair for public repositories.
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
        authentication,
        user: hasPublicPlaceholder ? '' : user,
        password: hasPublicPlaceholder ? '' : password,
    }
}

export function getGitRepoInfoForSave(draft: GitRepoDraft): RepoInfo {
    const { authentication, ...repoInfo } = draft
    switch (authentication) {
        case GitAuthentication.Https:
            return { ...repoInfo, sshKey: '' }
        case GitAuthentication.Ssh:
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
    updateRepoInfo: (draft: GitRepoDraft) => void
}> {
    render() {
        const { gitRepoValues, updateRepoInfo } = this.props
        const { authentication } = gitRepoValues
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
                                value={gitRepoValues.repo}
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
                                onChange={(e) =>
                                    updateRepoInfo({
                                        ...gitRepoValues,
                                        repo: e.target.value,
                                    })
                                }
                            />
                        </Col>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={gitRepoValues.branch}
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
                                onChange={(e) =>
                                    updateRepoInfo({
                                        ...gitRepoValues,
                                        branch: e.target.value,
                                    })
                                }
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
                                onChange={(selected) =>
                                    updateRepoInfo({
                                        ...gitRepoValues,
                                        authentication: selected,
                                    })
                                }
                            />
                        </Col>
                        {authentication === GitAuthentication.Https && (
                            <Col span={24}>
                                <Row gutter={20}>
                                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                        <Input
                                            style={{ marginBottom: 20 }}
                                            value={gitRepoValues.user}
                                            addonBefore={localize(
                                                'apps.deploy_git_username',
                                                'Username'
                                            )}
                                            aria-label={localize(
                                                'apps.deploy_git_username',
                                                'Username'
                                            )}
                                            autoComplete="off"
                                            onChange={(e) =>
                                                updateRepoInfo({
                                                    ...gitRepoValues,
                                                    user: e.target.value,
                                                })
                                            }
                                        />
                                    </Col>
                                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                        <PasswordField
                                            defaultValue={
                                                gitRepoValues.password
                                            }
                                            addonBefore={localize(
                                                'apps.deploy_git_password',
                                                'Password'
                                            )}
                                            placeholder={localize(
                                                'apps.deploy_git_password_or_token',
                                                'Password or access token'
                                            )}
                                            onChange={(e) =>
                                                updateRepoInfo({
                                                    ...gitRepoValues,
                                                    password: e.target.value,
                                                })
                                            }
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        )}
                        {authentication === GitAuthentication.Ssh && (
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
                                    value={gitRepoValues.sshKey || ''}
                                    placeholder={
                                        '-----BEGIN RSA PRIVATE KEY-----\nAABBBCCC'
                                    }
                                    onChange={(e) =>
                                        updateRepoInfo({
                                            ...gitRepoValues,
                                            sshKey: e.target.value,
                                        })
                                    }
                                />
                            </Col>
                        )}
                    </Row>
                </form>
            </div>
        )
    }
}
