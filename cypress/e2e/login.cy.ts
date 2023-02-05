import { CyHttpMessages } from "cypress/types/net-stubbing"
import IncomingHttpRequest = CyHttpMessages.IncomingHttpRequest

const BASE_URL = 'http://localhost:4500'
const API_URL = '*login'
const FAKE_PASSWORD = 'fake-password'
const EMPTY_PASSWORD_RESPONSE = {"status": 1000, "description": "password is empty.", "data": {}}
const FAKE_PASSWORD_RESPONSE = {"status": 1105, "description": "Password is incorrect.", "data": {}}
const REAL_PASSWORD = 'real-password'
const REAL_PASSWORD_RESPONSE = {"status": 100, "description": "Login succeeded", "data": {"token": "eyJhbG.eyJk"}}

let interceptFlag: boolean = true

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
      cy.visit(BASE_URL)
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
      cy.visit(BASE_URL)
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
      cy.visit(BASE_URL)
      cy.get('input[type=password]').as('passwordInput')
      cy.get('@passwordInput').type(REAL_PASSWORD)
      cy.get('.ant-input-suffix').click()
      cy.get("input[type='text']").should("have.value", REAL_PASSWORD)
    })
    it('should change the display of the password to clear then hide with mouse', () => {
      cy.visit(BASE_URL)
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
    it('should send the request to the server and redirect into the dashboard', () => {
      cy.visit(BASE_URL)
      cy.get('input[type=password]').type(REAL_PASSWORD, { force: true })
      cy.get('button[type=submit]').click()
      cy.wait('@logUser').then(() => {
        expect(interceptFlag).to.equal(true)
        cy.url()
            .should('be.contain', 'dashboard')
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
    it('should send the request to the server and redirect into the dashboard', () => {
      cy.visit(BASE_URL)
      cy.get('input[type=password]').type(REAL_PASSWORD + "{enter}", { force: true })
      cy.wait('@logUser').then(() => {
        expect(interceptFlag).to.equal(true)
        cy.url()
            .should('be.contain', 'dashboard')
      })
    })
  })
})
