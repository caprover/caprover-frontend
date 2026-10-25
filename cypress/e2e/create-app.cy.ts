const openCreateApp = () => {
    cy.contains('button', 'Create App').click()
    cy.contains('.ant-dropdown-menu-item', 'Empty App').click()
    cy.get('[role="dialog"]').should('be.visible')
}

const projectOptions = [false, true]

projectOptions.forEach((withProjects) => {
    describe(`Create App (projects: ${withProjects})`, () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/v2/user/system/info', {
                statusCode: 200,
                body: {
                    status: 100,
                    data: {
                        hasRootSsl: true,
                        forceSsl: true,
                        rootDomain: 'example.com',
                        captainSubDomain: 'captain',
                    },
                },
            })
            cy.intercept('GET', '**/api/v2/theme/current', {
                statusCode: 200,
                body: { status: 100, data: { theme: null } },
            })
            cy.intercept('GET', '**/api/v2/user/system/versioninfo', {
                statusCode: 200,
                body: { status: 100, data: { canUpdate: false } },
            })
            cy.intercept('GET', '**/api/v2/user/system/diskusage', {
                statusCode: 200,
                body: { status: 100, data: { nodes: [] } },
            })
            cy.intercept('GET', '**/api/v2/user/apps/appDefinitions', {
                statusCode: 200,
                body: {
                    status: 100,
                    data: {
                        appDefinitions: [],
                        defaultNginxConfig: '',
                        rootDomain: 'example.com',
                        captainSubDomain: 'captain',
                    },
                },
            })
            cy.intercept('GET', '**/api/v2/user/projects', {
                statusCode: 200,
                body: {
                    status: 100,
                    data: {
                        projects: withProjects
                            ? [
                                  {
                                      id: 'production',
                                      name: 'Production',
                                      description: '',
                                  },
                              ]
                            : [],
                    },
                },
            })
            cy.intercept(
                'POST',
                '**/api/v2/user/apps/appDefinitions/register*',
                {
                    statusCode: 200,
                    body: { status: 100, data: {} },
                }
            ).as('createApp')
            cy.visit('/#/apps/', {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem('CAPROVER_AUTH_KEY', 'test-token')
                    win.localStorage.setItem('CAPROVER_LANGUAGE', 'en-US')
                },
            })
            openCreateApp()
        })

        it('submits from the name field with Enter', () => {
            cy.get('#appName').type('keyboard-app{enter}')
            cy.wait('@createApp').its('request.body').should('deep.equal', {
                appName: 'keyboard-app',
                projectId: '',
                hasPersistentData: false,
            })
            cy.get('[role="dialog"]').should('not.exist')
        })

        it('restores trigger focus and resets the form after Escape and Cancel', () => {
            cy.get('#appName').type('discard-me{esc}')
            cy.get('[role="dialog"]').should('not.exist')
            cy.contains('button', 'Create App').should('have.focus')
            openCreateApp()
            cy.get('#appName').should('have.value', '')
            cy.get('[role="dialog"]').contains('button', 'Cancel').click()
            cy.contains('button', 'Create App').should('have.focus')
            cy.get('@createApp.all').should('have.length', 0)
        })
    })
})
