import React from 'react'
import Select from 'react-select'
import Header from '../components/Header'
import Footer from '../components/Footer'
import renderPage from '../renderPage.js'
import PropTypes from 'prop-types'

const FAQ = () => (
  <div style={{ backgroundColor: '#f9f9f9' }}>
    <div className='container' style={{ width: '75%', paddingBottom: '2rem' }}>
      <h1 className='is-size-2' style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>Frequently Asked Questions</h1>
      <p>
        <b className='is-size-5'>What is Penn Clubs?</b>
        <br />
      Penn Clubs is meant to be your central source of information about student organizations. Keep discovering new clubs throughout the year, not just at the SAC Fair.
        <br /><br />
        <b className='is-size-5'>Why is this a beta?</b>
        <br />
      This is the public beta version of Penn Clubs, which means we’re still working out some kinks and (more importantly) adding useful features. Please be patient as we improve the site! The reason we decided to roll out a beta is so that you can use Penn Clubs to find and join clubs this fall.
        <br />
      We’re so excited to let everyone at Penn contribute to the development of Penn Clubs! Your feedback is incredibly important to us. Have any questions or comments? Find any bugs? <a href='https://airtable.com/shrCsYFWxCwfwE7cf'>Please let us know on our feedback form.</a>
        <br /><br />
        <b className='is-size-5'>Why do I have to log in?</b>
        <br />
      Logging in allows us to create an account for you on Penn Clubs. When you click the heart button on a club, it will be saved to your Favorites list. You can use this to keep track of clubs you’re interested in, or a part of.

      We have new features planned that will make further use of your user account! For example, you’ll be able to join club rosters as a Member or Officer.
        <br /><br />
        <b className='is-size-5'>How do I use this site?</b>
        <br />
      The #1 way to use this site is to browse clubs at Penn! You can:
      Search for clubs by name, and use filters like Type (tags that describe the club), Size (number of members), and Applications (if applications are required to join).
      Add clubs to your Favorites list to keep track of them
      Browse information that clubs post: description, how to join, member testimonials
        <br /><br />
        <b className='is-size-5'>How do I edit an organization’s profile?</b>
        <br />
      You’ll need to have Administrator permission for that organization. We’ve invited people as Administrators based on information submitted by clubs to SAC during Spring 2019.
        <ul style={{ listStyleType: 'disc', marginLeft: '2rem', marginTop: '0.5rem' }}>
          <li>If you did not receive Administrator permission and you believe you should have, let us know at contact@pennclubs.com and we’ll work with you to verify your request.</li>
          <li>If your club did not submit this information to SAC, we’ve been contacting clubs by their listed email to ask for the names of people who need Administrator permission. You can also email us at contact@pennclubs.com and we’ll work with you to verify your request.</li>
        </ul>
        <br /><br />
        <b className='is-size-5'>Why I can’t find an organization on Penn Clubs?</b>
        <br />
      Sorry about that! We’re in the process of making Penn Clubs as comprehensive as possible, creating the first complete directory of student organizations at Penn. Please fill out the <a href='https://airtable.com/shrCsYFWxCwfwE7cf'>feedback form</a> as a “Missing Club” and tell us more about what’s missing. If you’re in charge of this club, please enter your Penn email so that we can give you Administrator permission to edit the club page that we’ll create for you.
        <br /><br />
        <b className='is-size-5'>I have another question!</b>
        <br />
        <a href='https://airtable.com/shrCsYFWxCwfwE7cf'>Please let us know on our feedback form :)</a>
      </p>
    </div>
  </div>
)

export default renderPage(FAQ)
