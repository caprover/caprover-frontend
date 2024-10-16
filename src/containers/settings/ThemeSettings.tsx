import {
    DeleteOutlined,
    EditOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { Button, Input, Modal, Popconfirm, Row } from 'antd'
import { useContext, useEffect, useState } from 'react'
import CapRoverThemeContext from '../../contexts/CapRoverThemeContext'
import CapRoverTheme from '../../styles/theme/CapRoverTheme'
import { ThemeProvider } from '../../styles/theme/ThemeProvider'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import NewTabLink from '../global/NewTabLink'
import ThemeSelector from '../global/ThemeSelector'

interface EditModalInfo {
    theme: CapRoverTheme
    oldName: string
}

const ThemeSettings = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [confirmLoading, setConfirmLoading] = useState(false)

    const [allThemes, setAllThemes] = useState([] as CapRoverTheme[])
    const { currentTheme, setCapRoverThemeContext } =
        useContext(CapRoverThemeContext)

    const [editModalTheme, setEditModalTheme] = useState(
        undefined as undefined | EditModalInfo
    )

    const fetchThemes = async () => {
        setIsLoading(true)
        try {
            const data = await ThemeProvider.getInstance().getAllThemes()
            setAllThemes(data)
        } catch (error) {
            Toaster.createCatcher()(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchThemes()
    }, [])

    if (isLoading) {
        return <CenteredSpinner />
    }

    if (!allThemes) {
        return <ErrorRetry />
    }

    return (
        <div>
            <p>
                {localize(
                    'themes.description',
                    'CapRover comes with many built-in themes! Go ahead and select your favorite theme'
                )}
            </p>

            <Row>
                <ThemeSelector themes={allThemes} />
                <Button
                    shape="circle"
                    style={{ marginInlineStart: 10 }}
                    type="default"
                    disabled={!currentTheme}
                    onClick={() => {
                        if (!currentTheme) return
                        const t = Utils.copyObject(currentTheme)
                        let oldName = t.name

                        if (t.builtIn) {
                            oldName = '' // API creates a NEW theme if oldName is empty
                            while (
                                allThemes.some((theme) => theme.name === t.name)
                            ) {
                                t.name += '-edited'
                            }
                        }

                        t.builtIn = false
                        setEditModalTheme({
                            oldName,
                            theme: t,
                        })
                    }}
                >
                    <EditOutlined />
                </Button>

                <Popconfirm
                    title={localize(
                        'theme.delete_theme_title',
                        'Delete ' + currentTheme?.name + '?'
                    )}
                    okText={localize('theme.delete', 'Delete')}
                    onConfirm={() => {
                        return ThemeProvider.getInstance()
                            .deleteTheme(currentTheme?.name || '')
                            .catch(Toaster.createCatcher())
                            .then(() => {
                                setCapRoverThemeContext(undefined)
                                fetchThemes()
                            })
                    }}
                >
                    <Button
                        shape="circle"
                        style={{ marginInlineStart: 10 }}
                        danger={true}
                        type="default"
                        disabled={!currentTheme || currentTheme.builtIn}
                    >
                        <DeleteOutlined />
                    </Button>
                </Popconfirm>
            </Row>

            <Modal
                confirmLoading={confirmLoading}
                width={600}
                title={localize('themes.customize_theme', 'Customize Theme')}
                open={!!editModalTheme}
                onOk={() => {
                    if (!editModalTheme) return
                    setConfirmLoading(true)
                    return ThemeProvider.getInstance()
                        .saveCustomTheme(
                            editModalTheme.oldName,
                            editModalTheme.theme
                        )
                        .then(() => {
                            setCapRoverThemeContext(editModalTheme.theme)
                            setEditModalTheme(undefined)
                        })
                        .catch(Toaster.createCatcher())
                        .then(() => {
                            setConfirmLoading(false)
                            fetchThemes()
                        })
                }}
                onCancel={() => {
                    setEditModalTheme(undefined)
                }}
            >
                <Input
                    addonBefore={localize('themes.edit_name', 'Theme name')}
                    placeholder="My Awesome Theme"
                    value={!editModalTheme ? '' : editModalTheme.theme.name}
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.theme.name = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
                <div
                    style={{
                        marginTop: 32,
                        marginBottom: 5,
                    }}
                >
                    {localize(
                        'themes.theme_custom_help',
                        'You can customize CapRover theme by providing custom theme and inject elements (font, CSS, JS, etc) into the <head> section.'
                    )}{' '}
                    <span>
                        {' '}
                        <NewTabLink url="https://caprover.com/docs/theme-customization.html">
                            {' '}
                            {localize(
                                'themes.see_here',
                                'See here for details.'
                            )}{' '}
                            <InfoCircleOutlined />
                        </NewTabLink>
                    </span>
                </div>
                <div
                    style={{
                        marginTop: 32,
                        marginBottom: 5,
                    }}
                >
                    Ant Design theme
                </div>
                <Input.TextArea
                    spellCheck={false}
                    style={{
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                    }}
                    className="code-input"
                    rows={12}
                    value={!editModalTheme ? '' : editModalTheme.theme.content}
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.theme.content = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
                <div
                    style={{
                        marginTop: 32,
                        marginBottom: 5,
                    }}
                >
                    {localize(
                        'themes.head_embed',
                        'Embed elements into <head>'
                    )}
                </div>
                <Input.TextArea
                    spellCheck={false}
                    style={{
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                    }}
                    placeholder={`<link href="https://fonts.googleapis.com/css" rel="stylesheet"/>`}
                    className="code-input"
                    rows={4}
                    value={
                        !editModalTheme ? '' : editModalTheme.theme.headEmbed
                    }
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.theme.headEmbed = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
                <div
                    style={{
                        marginTop: 32,
                        marginBottom: 5,
                    }}
                >
                    {localize(
                        'themes.caprover_extra',
                        'Other configuration passed to CapRover'
                    )}
                </div>
                <Input.TextArea
                    spellCheck={false}
                    placeholder={"{siderTheme:'dark'}"}
                    style={{
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                    }}
                    className="code-input"
                    rows={4}
                    value={!editModalTheme ? '' : editModalTheme.theme.extra}
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.theme.extra = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
            </Modal>
        </div>
    )
}

export default ThemeSettings
