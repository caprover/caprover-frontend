import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import PasswordField from './PasswordField'

const Form = ({ initial }: { initial: string }) => {
    const [password, setPassword] = useState(initial)
    return (
        <PasswordField
            defaultValue={password}
            onChange={(e) => setPassword(e.target.value)}
        />
    )
}

it('hides a revealed password again and keeps the edited value', () => {
    render(<Form initial="secret" />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Show Password'))
    fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'changed' },
    })
    fireEvent.click(screen.getByLabelText('Hide Password'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Show Password'))
    expect(screen.getByRole('textbox')).toHaveValue('changed')
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
})

it('offers hiding only once a new password has been typed', () => {
    render(<Form initial="" />)
    const input = screen.getByRole('textbox')
    expect(screen.queryByLabelText('Hide Password')).not.toBeInTheDocument()

    input.focus()
    fireEvent.change(input, { target: { value: 'n' } })
    expect(screen.getByLabelText('Hide Password')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveFocus()
})
