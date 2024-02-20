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
    cy.contains('Engineering Student')
  })

  it('Vists the welcome page', () => {
    cy.visit('/welcome')
    cy.contains('Penn Clubs')
    cy.contains('Tell us about yourself')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
    cy.contains('Engineering Student')

    const tabs = ['Clubs', 'Bookmarks', 'Subscriptions', 'Profile']

    // check that all tabs exist
    tabs.forEach((tab) => {
      cy.get('.tabs').contains(tab).should('be.visible')
    })

    // click on each tab
    tabs.forEach((tab) => {
      cy.get('.tabs').contains(tab).should('be.visible').click()
      cy.url().should('contain', `${tab}`)
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

  it('Visits the club creation page', () => {
    cy.visit('/create')
    cy.contains('Penn Clubs')
  })

  it('Visits the club invitation page', () => {
    cy.visit('/invite/pppjo/example/example')
    cy.contains('Penn Pre-Professional Juggling Organization')
  })

  it('Visits the events page', () => {
    cy.visit('/events')
    cy.contains(new Date().getFullYear())
  })

  it('Visits the fair page', () => {
    cy.visit('/fair')
    cy.contains('Sample Fair – Student Guide')
  })

  it('Visits the zoom page', () => {
    cy.visit('/zoom')
    cy.contains('Zoom Configuration')
  })

  it('Creates and deletes a new club', () => {
    cy.visit('/create')
    cy.contains('Penn Clubs')

    // create new club
    const fields = [
      { label: 'Name', value: 'test new club', pressEnter: false },
      {
        label: 'Subtitle',
        value: 'this is a test new club!',
        pressEnter: false,
      },
      { label: 'Size', value: '< 20', pressEnter: true },
      {
        label: 'Email',
        value: 'example@example.com',
        pressEnter: false,
      },
      {
        label: 'What is the membership process to join your club?',
        value: 'Open Membership',
        pressEnter: true,
      },
    ]

    // set fields
    fields.forEach(({ label, value, pressEnter }) => {
      const input = cy.contains('.field', label).find('input')
      input.focus().clear().type(value)

      if (pressEnter) {
        input.type('{enter}')
      }

      input.blur()
    })

    // set tags
    cy.contains('Select tags relevant to your club!').click()
    cy.contains('Undergraduate').click()

    // set description
    cy.contains('Type your club description here!').click({ force: true })
    cy.focused().type('This is an example club description!').blur()

    // submit form
    cy.contains('Submit').click()

    // wait for club to be created, should be redirected to renewal page
    cy.contains('Renew Club').should('be.visible')

    // test membership invites
    const fakeEmails = []
    for (var i = 0; i < 50; i++) {
      fakeEmails.push(`test${i}@example.com`)
    }

    cy.visit('/club/test-new-club/edit/member')
    cy.contains('Invite Members').scrollIntoView()
    cy.get('textarea[placeholder="Enter email addresses here!"]').type(fakeEmails.join(','), {delay: 1})
    cy.contains('.button', 'Send Invite').click()
    cy.contains(/Sent invites? to 50 emails?/).should('be.visible')

    // delete created club
    cy.contains('Settings').click()
    cy.contains('Delete Club')
    cy.contains('.button', 'Delete Club').click()

    // ensure club is deleted
    cy.contains('404 Not Found')
  })
})
