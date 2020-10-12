const site = process.env.NEXT_PUBLIC_SITE_NAME || 'clubs'

const sites = {
  clubs: {
    SITE_NAME: 'Penn Clubs',
    SCHOOL_NAME: 'University of Pennsylvania',
    SITE_SUBTITLE: 'Student Organizations at the University of Pennsylvania',
    DOMAIN: 'pennclubs.com',

    OBJECT_NAME_PLURAL: 'clubs',
    OBJECT_NAME_LONG_PLURAL: 'student organizations',
    OBJECT_NAME_SINGULAR: 'club',

    OBJECT_NAME_TITLE: 'Clubs',
    OBJECT_NAME_TITLE_SINGULAR: 'Club',

    SITE_LOGO: '/static/img/peoplelogo.png',
    SITE_TAGLINE: 'Find your people!',

    APPROVAL_AUTHORITY: 'Office of Student Affairs',

    FIELD_PARTICIPATION_LABEL: 'How to Get Involved',

    OBJECT_URL_SLUG: 'club',
    OBJECT_TAB_MEMBERSHIP_LABEL: 'Membership',
    OBJECT_TAB_RECRUITMENT_LABEL: 'Recruitment',
  },
  fyh: {
    SITE_NAME: 'First Year Hub',
    SCHOOL_NAME: 'University of Pennsylvania',
    SITE_SUBTITLE: 'Student Resources at the University of Pennsylvania',
    DOMAIN: 'hub.provost.upenn.edu',

    OBJECT_NAME_PLURAL: 'resources',
    OBJECT_NAME_LONG_PLURAL: 'university resources',
    OBJECT_NAME_SINGULAR: 'resource',

    OBJECT_NAME_TITLE: 'Resources',
    OBJECT_NAME_TITLE_SINGULAR: 'Resource',

    SITE_LOGO: '/static/img/penn_shield.png',
    SITE_TAGLINE: 'Find your activities!',

    APPROVAL_AUTHORITY: 'Office of Student Affairs',

    FIELD_PARTICIPATION_LABEL: 'Services Offered',

    OBJECT_URL_SLUG: 'org',
    OBJECT_TAB_MEMBERSHIP_LABEL: 'Admins',
    OBJECT_TAB_RECRUITMENT_LABEL: 'Mailing List',
  },
}

export const SITE_ID = site
export const SITE_NAME = sites[site].SITE_NAME
export const SITE_SUBTITLE = sites[site].SITE_SUBTITLE
export const SITE_TAGLINE = sites[site].SITE_TAGLINE
export const SCHOOL_NAME = sites[site].SCHOOL_NAME
export const DOMAIN = sites[site].DOMAIN

export const OBJECT_NAME_PLURAL = sites[site].OBJECT_NAME_PLURAL
export const OBJECT_NAME_LONG_PLURAL = sites[site].OBJECT_NAME_LONG_PLURAL
export const OBJECT_NAME_SINGULAR = sites[site].OBJECT_NAME_SINGULAR

export const OBJECT_NAME_TITLE = sites[site].OBJECT_NAME_TITLE
export const OBJECT_NAME_TITLE_SINGULAR = sites[site].OBJECT_NAME_TITLE_SINGULAR

export const APPROVAL_AUTHORITY = sites[site].APPROVAL_AUTHORITY

export const SITE_LOGO = sites[site].SITE_LOGO

export const FIELD_PARTICIPATION_LABEL = sites[site].FIELD_PARTICIPATION_LABEL
export const OBJECT_URL_SLUG = sites[site].OBJECT_URL_SLUG
export const OBJECT_TAB_MEMBERSHIP_LABEL =
  sites[site].OBJECT_TAB_MEMBERSHIP_LABEL
export const OBJECT_TAB_RECRUITMENT_LABEL =
  sites[site].OBJECT_TAB_RECRUITMENT_LABEL
