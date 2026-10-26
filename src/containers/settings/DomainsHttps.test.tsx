import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Modal } from 'antd'
import ApiManager from '../../api/ApiManager'
import { DomainsHttps } from './DomainsHttps'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('../global/ErrorRetry', () => () => <div>Request failed</div>)

const captainInfo = {
    rootDomain: 'apps.example.com',
    captainSubDomain: 'captain',
    hasRootSsl: true,
    forceSsl: true,
}
function showDomains(guided: boolean, info = captainInfo) {
    jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockResolvedValue(info)
    return render(
        <DomainsHttps guided={guided} emitSetupStatusChanged={jest.fn()} />
    )
}
beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((media) => ({
        matches: false,
        media,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }))
})
afterEach(() => {
    jest.restoreAllMocks()
    Modal.destroyAll()
})

it('warns before unlocking domain editing when root HTTPS is enforced', async () => {
    const confirm = jest.spyOn(Modal, 'confirm').mockImplementation(() => ({
        destroy: jest.fn(),
        update: jest.fn(),
    }))
    const update = jest
        .spyOn(ApiManager.prototype, 'updateRootDomain')
        .mockResolvedValue()
    showDomains(false)

    fireEvent.click(
        await screen.findByRole('button', { name: 'Change Root Domain' })
    )
    expect(screen.queryByPlaceholderText('my-root.example.com')).toBeNull()
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(update).not.toHaveBeenCalled()

    const confirmation = confirm.mock.calls[0][0]
    expect(confirmation.okText).toBe('I Understand the Risk')
    expect(confirmation.okButtonProps).toEqual({ danger: true })
    const { container } = render(confirmation.content as JSX.Element)
    expect(
        screen.getByText(/You can always update your root domain/)
    ).toBeInTheDocument()
    expect(container.querySelector('strong')).toHaveTextContent(
        'all your apps default domain and your root domain'
    )

    act(() => confirmation.onOk!())
    fireEvent.change(screen.getByPlaceholderText('my-root.example.com'), {
        target: { value: 'new.example.com' },
    })
    fireEvent.click(screen.getByText('Update Domain'))
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith('new.example.com', true)
})

it('keeps domain editing locked until the risk is acknowledged', async () => {
    const confirm = jest.spyOn(Modal, 'confirm').mockImplementation(() => ({
        destroy: jest.fn(),
        update: jest.fn(),
    }))
    showDomains(false)
    fireEvent.click(
        await screen.findByRole('button', { name: 'Change Root Domain' })
    )
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(screen.queryByPlaceholderText('my-root.example.com')).toBeNull()
})

it.each([false, true])(
    'still confirms secured domain updates during partial setup (guided: %s)',
    async (guided) => {
        const confirm = jest.spyOn(Modal, 'confirm').mockImplementation(() => ({
            destroy: jest.fn(),
            update: jest.fn(),
        }))
        const update = jest
            .spyOn(ApiManager.prototype, 'updateRootDomain')
            .mockResolvedValue()
        showDomains(guided, { ...captainInfo, forceSsl: false })
        fireEvent.change(
            await screen.findByPlaceholderText('my-root.example.com'),
            { target: { value: 'new.example.com' } }
        )
        fireEvent.click(screen.getByText('Update Domain'))
        expect(update).not.toHaveBeenCalled()
        expect(confirm).toHaveBeenCalledTimes(1)
        confirm.mock.calls[0][0].onOk!()
        expect(update).toHaveBeenCalledWith('new.example.com', true)
    }
)

it('updates an unsecured domain without a risk confirmation', async () => {
    const confirm = jest.spyOn(Modal, 'confirm')
    const update = jest
        .spyOn(ApiManager.prototype, 'updateRootDomain')
        .mockResolvedValue()
    showDomains(false, {
        ...captainInfo,
        hasRootSsl: false,
        forceSsl: false,
    })
    fireEvent.change(await screen.findByPlaceholderText('my-root.example.com'), {
        target: { value: 'new.example.com' },
    })
    fireEvent.click(screen.getByText('Update Domain'))
    expect(confirm).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith('new.example.com', false)
})

it.each([false, true])(
    'keeps HTTPS actions available in partial setup (guided: %s)',
    async (guided) => {
        showDomains(guided, { ...captainInfo, forceSsl: false })
        expect(
            await screen.findByRole('button', { name: 'Enable HTTPS' })
        ).toBeDisabled()
        expect(
            screen.getByRole('button', { name: 'Force HTTPS' })
        ).toBeEnabled()
        expect(screen.queryByText('Congratulations!') !== null).toBe(false)
    }
)

it('keeps the initial domain and HTTPS steps available in permanent Settings', async () => {
    showDomains(false, {
        ...captainInfo,
        rootDomain: '',
        hasRootSsl: false,
        forceSsl: false,
    })
    expect(await screen.findByText('Domains & HTTPS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable HTTPS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Force HTTPS' })).toBeDisabled()
    expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument()
})

it('shows the existing retry UI when captain configuration cannot be loaded', async () => {
    jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockRejectedValue(
        new Error('Unavailable')
    )
    render(<DomainsHttps emitSetupStatusChanged={jest.fn()} />)
    expect(await screen.findByText('Request failed')).toBeInTheDocument()
    expect(screen.queryByText('Enable HTTPS')).not.toBeInTheDocument()
})
