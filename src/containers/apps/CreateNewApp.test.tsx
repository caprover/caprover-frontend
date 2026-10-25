import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import CreateNewApp from './CreateNewApp'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('../../components/ProjectSelector', () => () => <div />)

it('opens the existing modal from Overview and consumes only the creation query parameter', async () => {
    window.matchMedia = jest.fn().mockImplementation((media) => ({
        matches: false,
        media,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }))
    const history = createMemoryHistory({
        initialEntries: ['/apps?create=true&q=api'],
    })
    const create = jest.fn()
    const element = () => (
        <CreateNewApp
            history={history}
            onCreateNewAppClicked={create}
            projects={[]}
            isCreatingApp={false}
        />
    )
    const first = render(element())
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(history.location.search).toBe('?q=api')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(create).not.toHaveBeenCalled()
    first.unmount()
    render(element())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
