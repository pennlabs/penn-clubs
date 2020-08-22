describe('Invitation tests', () => {
  before(() => {
    cy.login() 

    const fields = [
      { label: 'Name', value: 'test new club', pressEnter: false },
      { label: 'Size', value: '< 20', pressEnter: true },
      {
        label: 'Is an application required to join your organization?',
        value: 'No Application Required',
        pressEnter: true,
      },
    ]
    
    // Create club
    cy.visit('/create')

    fields.forEach(({ label, value, pressEnter }) => {
      const input = cy.contains('.field', label).find('input')
      input.focus().clear().type(value)

      if (pressEnter) {
        input.type('{enter}')
      }

      input.blur()
    })

    cy.contains('Select tags relevant to your club!').click()
    cy.contains('Undergraduate').click()

    cy.contains('Submit').click()

    // wait for club to be created, should be redirected to renewal page
    cy.contains('Renew Club').should('be.visible') 
  })

  after(() => {
    cy.login()
    cy.visit('/club/test-new-club/edit#settings')
    cy.contains('Delete Club')
    cy.contains('.button', 'Delete Club').click()
    cy.contains('404 Not Found')
    
    cy.logout()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Invites User', () => {
    cy.visit('/club/test-new-club/edit#member')
    cy.contains('Invite Members').scrollIntoView()
    cy.get('[data-testid="invite-emails-input"]').type(
        'bfranklin@seas.upenn.edu'
    )

    cy.get('[data-testid="invite-emails-submit"]').click()

    cy.contains('Sent invite(s) to 1 email(s)!').should('be.visible')

    cy.visit('/club/test-new-club/edit#member')
    cy.contains('Invite Members').scrollIntoView()
    cy.get('[data-testid="invite-emails-input"]').type(
        'bfranklin@seas.upenn.edu'
    )

    cy.get('[data-testid="invite-emails-submit"]').click()

    cy.contains('Sent invite(s) to 1 email(s)!').should('be.visible')

  })

  it('Visits invitation page', () => {
    cy.request('GET', '/api/test/lastemail').then((response) => {
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)
      cy.contains('Invitation for test new club')
    })
  })

  it('Accepts invitation using incorrect login credentials', () => {
    cy.contains('Accept Invitation').click()
    cy.contains('This invitation was meant for "bfranklin", but you are logged in as "test"!')
    cy.logout()
  })

  it('Accepts invitation as public using incorrect and correct token with correct login credentials', () => {
    cy.login('bfranklin', 'test')

    cy.request('GET', '/api/test/lastemail').then((response) => {
      // Wrong Token leads to error
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/WRONGTOKEN`)

      cy.contains('Accept Invitation').click()
      cy.contains('Missing or invalid token in request!')

      // Correct Token leads to success
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)

      cy.contains('Accept Invitation').click()

      // Redirect to club page
      cy.contains('test new club needs to be re-registered for the 2020-2021 academic year').should('be.visible')
      cy.contains('bfranklin@seas.upenn.edu')
      
      // Accessing invitation link after accepting it leads to 404 
      cy.visit(`/invite/${response.body['code']}/${response.body['id']}/${response.body['token']}`)
      cy.contains('404 Not Found')

      cy.logout()
    })
  })
})
