import { Input } from 'antd'
import React from 'react'

interface CodeEditProps {
    rows?: number | undefined
    placeholder?: string | undefined
    value: string | undefined
    onChange: (value: string) => void
}

const CodeEdit: React.FC<CodeEditProps> = ({
    value,
    placeholder,
    rows,
    onChange,
}) => {
    return (
        <Input.TextArea
            spellCheck={false}
            placeholder={placeholder}
            style={{
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                fontSize: 12,
            }}
            className="code-input"
            rows={rows || 4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

export default CodeEdit
