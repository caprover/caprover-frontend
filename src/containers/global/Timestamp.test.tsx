import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Timestamp from './Timestamp'

jest.mock('../../utils/Utils', () => ({
    __esModule: true,
    default: {
        getLocalizedDateTime: () => 'October 23, 2026, 11:42 AM',
        getRelativeDateTime: () => 'a day ago',
    },
}))

it.each([false, true])(
    'preserves the exact date with relative display: %s',
    async (relative) => {
        render(
            <Timestamp
                timestamp="2026-10-23T18:42:00.000Z"
                relative={relative}
            />
        )
        const time = screen.getByText(
            relative ? 'a day ago' : 'October 23, 2026, 11:42 AM'
        )
        expect(time).toHaveAttribute('dateTime', '2026-10-23T18:42:00.000Z')
        fireEvent.mouseEnter(time)
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            relative ? 'October 23, 2026, 11:42 AM' : 'a day ago'
        )
    }
)
