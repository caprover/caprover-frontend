import { EditOutlined } from '@ant-design/icons'
import React, { PropsWithChildren } from 'react'
import Utils from '../../utils/Utils'
import ClickableLink from '../global/ClickableLink'

type EditableSpanProps = PropsWithChildren<{
    onEditClick: () => void
}>

class EditableSpan extends React.Component<EditableSpanProps> {
    private className: string

    constructor(props: EditableSpanProps) {
        super(props)
        this.className = `edit-icon-${Utils.hashCode(
            props.children ? props.children.toString() : 'none'
        )}`
    }

    handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const editIcon = e.currentTarget.querySelector(
            '.' + this.className
        ) as HTMLElement
        if (editIcon) editIcon.style.opacity = '1'
    }

    handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        const editIcon = e.currentTarget.querySelector(
            '.' + this.className
        ) as HTMLElement
        if (editIcon) editIcon.style.opacity = '0'
    }

    render() {
        const { children, onEditClick } = this.props

        return (
            <span
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: 'pointer',
                    paddingInlineEnd: 20,
                }}
                onClick={onEditClick}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                {children}
                <span
                    className={this.className}
                    style={{
                        marginInlineStart: 5,
                        opacity: 0,
                        transition: 'opacity 0.3s',
                    }}
                >
                    <ClickableLink onLinkClicked={onEditClick}>
                        <EditOutlined />
                    </ClickableLink>
                </span>
            </span>
        )
    }
}

export default EditableSpan
