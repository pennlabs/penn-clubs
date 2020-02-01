describe('Page load tests', () => {
  it('Visits the index page', () => {
    cy.visit('/')
    cy.contains('Penn Clubs')
  })

  it('Visits the FAQ page', () => {
    cy.visit('/faq')
    cy.contains('Penn Clubs')
  })

  it('Vists the rank page', () => {
    cy.visit('/rank')
    cy.contains('Penn Clubs')
  })

  it('Visits the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
  })
})

describe('Authenticated user tests', () => {
  before(() => {
    cy.visit('/')
    cy.contains('Login')
      .invoke('attr', 'href')
      .then(href => {
        cy.request({
          method: 'GET',
          url: href,
        }).then(data => {
          cy.window().then(win => {
            const ele = win.document.createElement('div')
            ele.innerHTML = data.body
            const form = new win.FormData(ele.querySelector('form'))
            const formattedData = {}
            Array.from(form.entries()).forEach(a => {
              formattedData[a[0]] = a[1]
            })
            formattedData.allow = 'Authorize'
            const url = data.redirects[data.redirects.length - 1].substring(5)
            cy.request({
              method: 'POST',
              url: url,
              form: true,
              headers: {
                Referer: url,
              },
              body: formattedData,
            })
          })
        })
      })
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  })

  it('Logs in successfully', () => {
    cy.visit('/')
    cy.contains('Test User')
  })

  it('Vists the settings page', () => {
    cy.visit('/settings')
    cy.contains('Penn Clubs')
    cy.contains('Test User')
  })
})
