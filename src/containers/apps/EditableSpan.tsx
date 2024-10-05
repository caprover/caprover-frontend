import { EditOutlined } from '@ant-design/icons'
import React from 'react'
import Utils from '../../utils/Utils'
import ClickableLink from '../global/ClickableLink'

interface EditableSpanProps {
    titleName: string
    onEditClick: () => void
}

class EditableSpan extends React.Component<EditableSpanProps> {
    private className: string

    constructor(props: EditableSpanProps) {
        super(props)
        this.className = `edit-icon-${Utils.hashCode(props.titleName)}`
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
        const { titleName: projectName, onEditClick } = this.props

        return (
            <span
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: 'pointer',
                    paddingRight: 20,
                }}
                onClick={onEditClick}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                {projectName}
                <span
                    className={this.className}
                    style={{
                        marginLeft: 10,
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
