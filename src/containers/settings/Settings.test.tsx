import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import ApiManager from '../../api/ApiManager'
import { Settings } from './Settings'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('./DomainsHttps', () => () => <div>Domains</div>)
jest.mock('./ChangePass', () => () => <div>Password</div>)
jest.mock('./ThemeSettings', () => () => <div>Themes</div>)
jest.mock('./NginxConfig', () => () => <div>Templates</div>)
jest.mock('../global/DarkModeSwitch', () => () => <div />)
jest.mock('../global/LanguageSelector', () => () => <div />)
jest.mock('./OtpSettings', () => ({ rootDomain }: { rootDomain: string }) => (
    <div>2FA for {rootDomain}</div>
))
jest.mock('./ProFeatures', () => () => <div />)

afterEach(() => jest.restoreAllMocks())
it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
])(
    'preserves feature and subscription gating for Security 2FA (%s, %s)',
    async (isFeatureFlagEnabled, isSubscribed) => {
        jest.spyOn(ApiManager.prototype, 'getCaptainInfo').mockResolvedValue({
            rootDomain: 'apps.example.com',
            captainSubDomain: 'captain',
            hasRootSsl: true,
            forceSsl: true,
        })
        jest.spyOn(
            ApiManager.prototype,
            'getProFeaturesState'
        ).mockResolvedValue({
            proFeaturesState: { isFeatureFlagEnabled, isSubscribed },
        })
        const settings = render(<Settings isMobile={false} />)
        await screen.findByText('Security')
        // Flush the captain/Pro request before checking either gated result.
        await screen.findByText('Domains')
        if (isFeatureFlagEnabled && isSubscribed) {
            expect(
                await screen.findByText('2FA for apps.example.com')
            ).toBeInTheDocument()
            expect(
                settings.container.querySelector('.settings-grid .ant-card')
            ).toHaveTextContent('2FA for apps.example.com')
        } else {
            expect(
                screen.queryByText('2FA for apps.example.com')
            ).not.toBeInTheDocument()
        }
    }
)
