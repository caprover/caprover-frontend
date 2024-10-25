import { Input } from 'antd'
import React from 'react'

interface CodeEditProps {
    rows?: number | undefined
    placeholder?: string | undefined
    defaultValue?: string | undefined
    value?: string | undefined
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const CodeEdit: React.FC<CodeEditProps> = ({
    value,
    placeholder,
    rows,
    defaultValue,
    onChange,
}) => {
    return (
        <Input.TextArea
            defaultValue={defaultValue}
            spellCheck={false}
            autoCorrect="off"
            autoComplete="off"
            autoCapitalize="off"
            placeholder={placeholder}
            style={{
                overflowX: 'auto',
                whiteSpace: 'pre',
                fontSize: 12,
            }}
            className="code-input"
            rows={rows || 4}
            value={value}
            onChange={(e) => onChange(e)}
        />
    )
}

export default CodeEdit
