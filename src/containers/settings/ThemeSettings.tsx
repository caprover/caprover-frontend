import {
    DeleteOutlined,
    EditOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { Button, Input, Modal, Row } from 'antd'
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

const ThemeSettings = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [confirmLoading, setConfirmLoading] = useState(false)

    const [allThemes, setAllThemes] = useState([] as CapRoverTheme[])
    const { currentTheme, setCapRoverThemeContext } =
        useContext(CapRoverThemeContext)

    const [editModalTheme, setEditModalTheme] = useState(
        undefined as undefined | CapRoverTheme
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
                        while (
                            allThemes.some((theme) => theme.name === t.name)
                        ) {
                            t.name += '-edited'
                        }

                        setEditModalTheme(t)
                    }}
                >
                    <EditOutlined />
                </Button>
                <Button
                    shape="circle"
                    style={{ marginInlineStart: 10 }}
                    danger={true}
                    type="default"
                    disabled={!currentTheme || currentTheme.builtIn}
                    onClick={() => {
                        if (!currentTheme) return
                        const t = Utils.copyObject(currentTheme)
                        while (
                            allThemes.some((theme) => theme.name === t.name)
                        ) {
                            t.name += '-edited'
                        }

                        setEditModalTheme(t)
                    }}
                >
                    <DeleteOutlined />
                </Button>
            </Row>

            <Modal
                confirmLoading={confirmLoading}
                width={600}
                title="Customize Theme"
                open={!!editModalTheme}
                onOk={() => {
                    if (!editModalTheme) return
                    setConfirmLoading(true)
                    return ThemeProvider.getInstance()
                        .saveCustomTheme(editModalTheme.name, editModalTheme)
                        .then(() => {
                            setCapRoverThemeContext(editModalTheme)
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
                    disabled={!!editModalTheme && !editModalTheme.builtIn}
                    readOnly={!!editModalTheme && !editModalTheme.builtIn}
                    addonBefore={localize('themes.edit_name', 'Theme name')}
                    placeholder="my-awesome-theme"
                    value={!editModalTheme ? '' : editModalTheme.name}
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.name = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
                <div
                    style={{
                        marginTop: 32,
                        marginBottom: 5,
                    }}
                >
                    {localize('themes.ant_design_theme', 'Ant Design theme')}

                    <span style={{ marginInlineStart: 5 }}>
                        {' '}
                        <NewTabLink url="https://ant.design/docs/react/customize-theme">
                            <InfoCircleOutlined />
                        </NewTabLink>
                    </span>
                </div>
                <Input.TextArea
                    spellCheck={false}
                    style={{
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                    }}
                    className="code-input"
                    rows={15}
                    value={!editModalTheme ? '' : editModalTheme.content}
                    onChange={(e) => {
                        const cp = Utils.copyObject(editModalTheme!!)
                        cp.content = e.target.value
                        setEditModalTheme(cp)
                    }}
                />
            </Modal>
        </div>
    )
}

export default ThemeSettings
