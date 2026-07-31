import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ParentProjectSelector from './ParentProjectSelector'

jest.mock('../utils/Language', () => ({
    localize: (key: string, message: string) => message,
}))

jest.mock('./ProjectSelector', () => (props: any) => (
    <div>
        <span data-testid="selected-project">{props.selectedProjectId}</span>
        <button onClick={() => props.onChange(' project-id ')}>Select</button>
        <button onClick={() => props.onChange('')}>Clear</button>
    </div>
))

const projects = [
    {
        id: 'project-id',
        name: 'project',
        description: '',
    },
]

describe('ParentProjectSelector', () => {
    it('stays hidden when no projects exist', () => {
        const { container } = render(
            <ParentProjectSelector
                projects={[]}
                selectedProjectId=""
                onChange={jest.fn()}
            />
        )

        expect(container).toBeEmptyDOMElement()
    })

    it('shows the root selector when explicitly requested without projects', () => {
        render(
            <ParentProjectSelector
                projects={[]}
                selectedProjectId=""
                onChange={jest.fn()}
                hideWhenEmpty={false}
            />
        )

        expect(screen.getByTestId('selected-project')).toHaveTextContent('')
    })

    it('normalizes selection and exposes root through clear', () => {
        const onChange = jest.fn()
        render(
            <ParentProjectSelector
                projects={projects}
                selectedProjectId=" project-id "
                onChange={onChange}
            />
        )

        expect(screen.getByTestId('selected-project')).toHaveTextContent(
            'project-id'
        )
        fireEvent.click(screen.getByRole('button', { name: 'Select' }))
        fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
        expect(onChange).toHaveBeenNthCalledWith(1, 'project-id')
        expect(onChange).toHaveBeenNthCalledWith(2, '')
    })
})
