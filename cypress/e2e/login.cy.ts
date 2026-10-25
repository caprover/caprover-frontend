import { CyHttpMessages } from "cypress/types/net-stubbing"
import IncomingHttpRequest = CyHttpMessages.IncomingHttpRequest

const BASE_URL = Cypress.config('baseUrl') || 'http://localhost:4500'
const API_URL = '*login'
const REMEMBER_ME_OPTION_KEY = 'CAPROVER_REMEMBER_ME_OPTION'
const AUTH_KEY = 'CAPROVER_AUTH_KEY'
const FAKE_PASSWORD = 'fake-password'
const EMPTY_PASSWORD_RESPONSE = {"status": 1000, "description": "password is empty.", "data": {}}
const FAKE_PASSWORD_RESPONSE = {"status": 1105, "description": "Password is incorrect.", "data": {}}
const REAL_PASSWORD = 'real-password'
const REAL_PASSWORD_RESPONSE = {"status": 100, "description": "Login succeeded", "data": {"token": "eyJhbG.eyJk"}}

let interceptFlag: boolean = true

const visitLoginPage = (forceSsl = false) => {
  cy.intercept('GET', '**/api/v2/user/system/info', {
    statusCode: 200,
    body: {
      status: 100,
      data: {
        hasRootSsl: forceSsl,
        forceSsl,
        rootDomain: forceSsl ? 'example.com' : '',
        captainSubDomain: 'captain',
      },
    },
  })
  return cy.visit(BASE_URL, {
    onBeforeLoad: (win) => {
      win.localStorage.clear()
      win.sessionStorage.clear()
    },
  })
}

describe('login page', () => {
  describe('without any password', () => {
    beforeEach(() => {
      interceptFlag = false
      cy.intercept({
        method: 'POST',
        url: API_URL
      }, async (req: IncomingHttpRequest) => {
        interceptFlag = true
        req.reply({
          statusCode: 200,
          delay: 100,
          body: EMPTY_PASSWORD_RESPONSE
          // legacy return is here to prevent regression but is not useful anymore
        })
      })
    })
    it('should not sent the request to the server', () => {
      visitLoginPage()
      cy.get('button[type=submit]').click()
      cy.wait(1000).then(() => {
        expect(interceptFlag).to.equal(false)
      })
    })
  })
  describe('with a bad password', () => {
    beforeEach(() => {
      interceptFlag = false
      cy.intercept({
        method: 'POST',
        url: API_URL
      }, async (req: IncomingHttpRequest) => {
        interceptFlag = true
        req.reply({
          statusCode: 200,
          delay: 100,
          body: FAKE_PASSWORD_RESPONSE
          // legacy return is here to prevent regression but is not useful anymore
        })
      }).as('logUser')
    })
    it('should send the request to the server and display Password is incorrect', () => {
      visitLoginPage()
      cy.get('input[type=password]').type(FAKE_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@logUser').then(() => {
        expect(interceptFlag).to.equal(true)
      cy.wait(50).then(() => {
        cy.get(".ant-message-error").should("contain.text", "1105 : Password is incorrect.")
        // Should be changed for a11y purpose
        })
      })
    })
  })
  describe('trying to change the password display', () => {
    it('should change the display of the password to clear with mouse', () => {
      visitLoginPage()
      cy.get('input[type=password]').as('passwordInput')
      cy.get('@passwordInput').type(REAL_PASSWORD)
      cy.get('.ant-input-suffix').click()
      cy.get("input[type='text']").should("have.value", REAL_PASSWORD)
    })
    it('should change the display of the password to clear then hide with mouse', () => {
      visitLoginPage()
      cy.get('input[type=password]').as('passwordInput')
      cy.get('@passwordInput').type(REAL_PASSWORD)
      cy.get('.ant-input-suffix').click()
      cy.get('.ant-input-suffix').click()
      cy.get("@passwordInput").should("have.value", REAL_PASSWORD)
    })
    describe.skip('should change the display of the password with tabulation', () => {
      // not implemented yet
    })
  })
  describe('with a good password clicking on login button', () => {
    beforeEach(() => {
      interceptFlag = false
      cy.intercept({
        method: 'POST',
        url: API_URL
      }, async (req: IncomingHttpRequest) => {
        interceptFlag = true
        // legacy reply is here to prevent regression but is not useful anymore with the new form
        req.reply({
          statusCode: 200,
          delay: 100,
          body: REAL_PASSWORD_RESPONSE
        })
      }).as('logUser')
    })
    it('should send the request to the server and redirect into setup', () => {
      visitLoginPage()
      cy.get('input[type=password]').type(REAL_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@logUser').then(() => {
        expect(interceptFlag).to.equal(true)
        cy.url()
            .should('be.contain', '/setup')
      })
    })
  })
  describe('with a good password typing on enter currently on the password', () => {
    beforeEach(() => {
      interceptFlag = false
      cy.intercept({
        method: 'POST',
        url: API_URL
      }, async (req: IncomingHttpRequest) => {
        interceptFlag = true
        // legacy reply is here to prevent regression but is not useful anymore with the new form
        req.reply({
          statusCode: 200,
          delay: 100,
          body: REAL_PASSWORD_RESPONSE
        })
      }).as('logUser')
    })
    it('should send the request to the server and redirect into setup', () => {
      visitLoginPage()
      cy.get('input[type=password]').type(REAL_PASSWORD + "{enter}", { force: true })
      cy.wait('@logUser').then(() => {
        expect(interceptFlag).to.equal(true)
        cy.url()
            .should('be.contain', '/setup')
      })
    })
  })

  describe('with a fully configured server', () => {
    beforeEach(() => {
      cy.intercept({
        method: 'POST',
        url: API_URL
      }, {
        statusCode: 200,
        body: REAL_PASSWORD_RESPONSE
      }).as('logUser')
    })
    it('redirects to Apps after login', () => {
      visitLoginPage(true)
      cy.get('input[type=password]').type(REAL_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@logUser')
      cy.url().should('be.contain', '/apps')
    })
  })

  describe('Remember Me preference', () => {
    const openRememberMePanel = () => {
      cy.contains('.ant-collapse-header', 'Remember Me').click()
    }

    it('persists the selected option and restores it after reload', () => {
      visitLoginPage()
      openRememberMePanel()
      cy.contains('.ant-radio-wrapper', 'Use localStorage').click()

      cy.window().then((win) => {
        expect(
          win.localStorage.getItem(REMEMBER_ME_OPTION_KEY)
        ).to.equal('3')
      })

      cy.reload()
      openRememberMePanel()
      cy.get('input[type="radio"][value="3"]').should('be.checked')
    })

    it('stores a successful sessionStorage login in sessionStorage only', () => {
      cy.intercept(
        {
          method: 'POST',
          url: API_URL,
        },
        {
          statusCode: 200,
          body: REAL_PASSWORD_RESPONSE,
        }
      ).as('rememberMeSessionLogin')

      visitLoginPage()
      openRememberMePanel()
      cy.contains('.ant-radio-wrapper', 'Use sessionStorage').click()
      cy.get('input[type=password]').type(REAL_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@rememberMeSessionLogin')

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem(AUTH_KEY)).to.equal(
          REAL_PASSWORD_RESPONSE.data.token
        )
        expect(win.localStorage.getItem(AUTH_KEY)).to.equal('')
      })
    })

    it('stores a successful localStorage login in localStorage only', () => {
      cy.intercept(
        {
          method: 'POST',
          url: API_URL,
        },
        {
          statusCode: 200,
          body: REAL_PASSWORD_RESPONSE,
        }
      ).as('rememberMeLocalLogin')

      visitLoginPage()
      openRememberMePanel()
      cy.contains('.ant-radio-wrapper', 'Use localStorage').click()
      cy.get('input[type=password]').type(REAL_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@rememberMeLocalLogin')

      cy.window().then((win) => {
        expect(win.localStorage.getItem(AUTH_KEY)).to.equal(
          REAL_PASSWORD_RESPONSE.data.token
        )
        expect(win.sessionStorage.getItem(AUTH_KEY)).to.equal('')
      })
    })
  })
})
