describe('Authenticated user tests', () => {
  before(() => {
    cy.login()
  })

  after(() => {
    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Logs in successfully', () => {
    cy.visit('/')
    cy.contains('Test User')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
    cy.contains('Test User')

    const tabs = ['Clubs', 'Bookmarks', 'Subscriptions', 'Profile']
    tabs.forEach(tab => {
      cy.get('.tabs')
        .contains(tab)
        .click()
      cy.url().should('contain', `#${tab}`)
    })
  })

  it('Visits club page', () => {
    cy.visit('/club/pppjo')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })

  it('Visits the organization page', () => {
    cy.visit('/club/pppjo/org')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })

  it('Vists the welcome page', () => {
    cy.visit('/welcome')
    cy.contains('Penn Clubs')
  })

  it('Visits the club creation page', () => {
    cy.visit('/create')
    cy.contains('Penn Clubs')
  })

  it('Creates and deletes a new club', () => {
    cy.visit('/create')
    cy.contains('Penn Clubs')

    // create new club
    const fields = [
      ['Name', 'test new club', false],
      ['Subtitle', 'this is a test new club!', false],
      ['Size', '< 20', true],
      [
        'Is an application required to join your organization?',
        'No Application Required',
        true,
      ],
    ]

    fields.forEach(([label, value, pressEnter]) => {
      const input = cy.contains('.field', label).find('input')
      input
        .focus()
        .clear()
        .type(value)

      if (pressEnter) {
        input.type('{enter}')
      }

      input.blur()
    })
    cy.contains('Submit').click()

    // delete created club
    cy.visit('/club/test-new-club/edit#settings')
    cy.contains('Delete Club')
    cy.contains('.button', 'Deactivate').click()
    cy.contains('.button', 'Delete Club').click()

    // ensure club is deleted
    cy.contains('404 Not Found')
  })
})
