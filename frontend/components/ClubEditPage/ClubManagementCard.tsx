import { Field, Form, Formik, useFormikContext } from 'formik'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'

import {
  Contact,
  Icon,
  Loading,
  Subtitle,
  Tag,
  Text,
} from '~/components/common'
import { CLUB_ROUTE } from '~/constants'
import { Badge, Club } from '~/types'
import { doApiRequest } from '~/utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '~/utils/branding'

import { FormStyle } from '../FormComponents'

const ClubSearchField = ({ name }) => {
  const { setFieldValue } = useFormikContext()
  const [clubs, setClubs] = useState<Club[]>([])

  useEffect(() => {
    doApiRequest(`/clubs/directory/?format=json`)
      .then((resp) => resp.json())
      .then(setClubs)
  }, [])

  return (
    <div className="mb-3">
      <Select
        instanceId={name}
        key={name}
        placeholder={`Select a ${OBJECT_NAME_SINGULAR}`}
        isMulti={false}
        options={clubs.map((club) => ({ label: club.name, value: club.code }))}
        onChange={(opt) => setFieldValue(name, opt?.value)}
        formatOptionLabel={(opt) => (
          <>
            <b>{opt.label}</b>{' '}
            <span className="has-text-grey">{opt.value}</span>
          </>
        )}
      />
    </div>
  )
}

type ClubManagementCardProps = {
  club: Club
}

const ClubManagementCard = ({
  club,
}: ClubManagementCardProps): ReactElement<any> => {
  const [badges, setBadges] = useState<Badge[] | null>(null)
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null)
  const [clubs, setClubs] = useState<Club[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const reloadOwned = () => {
    doApiRequest(`/clubs/${club.code}/owned_badges/?format=json`)
      .then((resp) => resp.json())
      .then((badges) => {
        setBadges(badges)
        setActiveBadge(badges[0])
      })
  }

  useEffect(reloadOwned, [])

  useEffect(() => {
    if (activeBadge != null) {
      doApiRequest(`/badges/${activeBadge.id}/clubs/?format=json`)
        .then((resp) => resp.json())
        .then(setClubs)
    } else {
      setClubs(null)
    }
  }, [activeBadge])

  return (
    <>
      <Text>
        If {club.name} is an umbrella {OBJECT_NAME_SINGULAR}, you can use this
        page to assign badges to {OBJECT_NAME_PLURAL} that are associated with
        your {OBJECT_NAME_SINGULAR}. All of the badges you have access to are
        shown below.
      </Text>
      {badges != null ? (
        <div className="columns">
          <div className="column is-one-third">
            <aside className="menu">
              <p className="menu-label">Your Badges</p>
              <ul className="menu-list">
                {badges.map((badge) => (
                  <li key={badge.id}>
                    <a
                      className={
                        badge.id === activeBadge?.id ? 'is-active' : undefined
                      }
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveBadge(badge)
                      }}
                    >
                      {badge.label}
                    </a>
                  </li>
                ))}
                {badges.length <= 0 && <li>No Badges</li>}
              </ul>
            </aside>
          </div>
          <div className="column">
            {activeBadge != null ? (
              <>
                <Subtitle>
                  <Tag
                    className="tag is-rounded mt-1"
                    color={
                      activeBadge.color.length > 0
                        ? activeBadge.color
                        : 'd3d3d3'
                    }
                  >
                    {activeBadge.label}
                  </Tag>{' '}
                  {activeBadge.description}
                </Subtitle>
                {clubs != null ? (
                  <>
                    <Text>
                      There are {clubs.length} {OBJECT_NAME_PLURAL} with this
                      badge. You can use the form below to add this badge to a{' '}
                      {OBJECT_NAME_SINGULAR}.
                    </Text>
                    <div className="mb-5">
                      <Formik
                        onSubmit={(
                          data: { club: string },
                          { setSubmitting },
                        ) => {
                          if (data.club == null || data.club.length <= 0) {
                            toast.error(
                              <>
                                You must specify a club to add the{' '}
                                <b>{activeBadge.label}</b> badge to.
                              </>,
                            )
                            setSubmitting(false)
                            return
                          }
                          doApiRequest(`/badges/${activeBadge.id}/clubs/`, {
                            method: 'POST',
                            body: data,
                          }).then(() => {
                            setSubmitting(false)
                            reloadOwned()
                            toast.success(
                              <>
                                Added badge <b>{activeBadge.label}</b> to{' '}
                                {OBJECT_NAME_SINGULAR} <b>{data.club}</b>.
                              </>,
                            )
                          })
                        }}
                        initialValues={{ club: '' }}
                      >
                        {({ isSubmitting }) => (
                          <Form>
                            <FormStyle isHorizontal>
                              <Field name="club" as={ClubSearchField} />
                              <button
                                type="submit"
                                className="button is-success is-small"
                                disabled={isSubmitting}
                              >
                                <Icon name="plus" /> Add Badge to{' '}
                                {OBJECT_NAME_TITLE_SINGULAR}
                              </button>
                            </FormStyle>
                          </Form>
                        )}
                      </Formik>
                    </div>
                    <div className="panel">
                      {clubs.map((club) => (
                        <div className="panel-block is-clearfix">
                          {club.name}{' '}
                          <Link
                            href={CLUB_ROUTE(club.code)}
                            className="ml-2"
                            target="_blank"
                          >
                            <Icon name="external-link" />
                          </Link>
                          <div style={{ marginLeft: 'auto' }}>
                            <button
                              className="button is-small is-danger"
                              disabled={loading}
                              onClick={(e) => {
                                e.preventDefault()
                                setClubs((clubs) =>
                                  clubs != null
                                    ? [...clubs].filter(
                                        (c) => c.code !== club.code,
                                      )
                                    : null,
                                )
                                setLoading(true)
                                doApiRequest(
                                  `/badges/${activeBadge.id}/clubs/${club.code}/?format=json`,
                                  { method: 'DELETE' },
                                ).then(() => {
                                  toast.success(
                                    <>
                                      Removed badge <b>{activeBadge.label}</b>{' '}
                                      from {OBJECT_NAME_SINGULAR}{' '}
                                      <b>{club.name}</b>.
                                    </>,
                                  )
                                  setLoading(false)
                                })
                              }}
                            >
                              Remove Badge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Loading />
                )}
              </>
            ) : (
              <Text>
                It does not look like your {OBJECT_NAME_PLURAL} has access to
                any badges. If you believe this is a mistake, please contact{' '}
                <Contact />.
              </Text>
            )}
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default ClubManagementCard
