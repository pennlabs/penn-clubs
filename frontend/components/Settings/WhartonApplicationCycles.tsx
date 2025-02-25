import { Field } from 'formik'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
import styled from 'styled-components'

import { ClubApplication } from '~/types'
import { doApiRequest, getApiUrl } from '~/utils'

import { Checkbox, Icon, Loading, Modal, Subtitle, Text } from '../common'
import { DateTimeField, TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

const fields = (
  <>
    <Field name="name" as={TextField} required />
    <Field name="start_date" as={DateTimeField} required />
    <Field name="end_date" as={DateTimeField} required />
    <Field name="release_date" as={DateTimeField} required />
  </>
)

type Cycle = {
  name: string
  id: number | null
  endDate: Date
}

type ClubOption = {
  label: string
  value: number
}

type ExtensionOption = {
  id: number
  clubName: string
  endDate: Date
  exception?: boolean
  originalEndDate: Date
  originalException: boolean
}

const ScrollWrapper = styled.div`
  overflow-y: auto;
  margin-top: 1rem;
  height: 40vh;
`

type ClubApplicationWithClub = ClubApplication & {
  club__name: string
  club__code: number
}

const WhartonApplicationCycles = (): ReactElement<any> => {
  const [editMembership, setEditMembership] = useState(false)
  const [membershipCycle, setMembershipCycle] = useState<Cycle>({
    name: '',
    id: null,
    endDate: new Date(),
  })

  const [editExtensions, setEditExtensions] = useState(false)
  const [extensionsCycle, setExtensionsCycle] = useState<Cycle>({
    name: '',
    id: null,
    endDate: new Date(),
  })

  const [clubsSelectedMembership, setClubsSelectedMembership] = useState<
    ClubOption[]
  >([])
  const [clubOptionsMembership, setClubOptionsMembership] = useState<
    ClubOption[]
  >([])

  const [clubsExtensions, setClubsExtensions] = useState<ExtensionOption[]>([])

  const [permissions, setPermissions] = useState<boolean | null>(null)

  const closeMembershipModal = (): void => {
    setEditMembership(false)

    // call /cycles/:id/clubs to set the clubs associated with the cycle
    doApiRequest(`/cycles/${membershipCycle.id}/edit_clubs/`, {
      method: 'PATCH',
      body: { clubs: clubsSelectedMembership.map((x) => x.value) },
    })
  }

  const closeExtensionsModal = (): void => {
    setEditExtensions(false)
    // calculate clubs that have changed
    const clubsToUpdate = clubsExtensions.filter(
      (x) =>
        x.originalEndDate !== x.endDate || x.originalException !== x.exception,
    )
    // split into clubs with exceptions and clubs without
    const clubsExceptions = clubsToUpdate.filter((x) => x.exception)
    const clubsNoExceptions = clubsToUpdate.filter((x) => !x.exception)

    // call /cycles/:id/add_clubs and /cycles/remove_clubs_from_all with data.clubs as list of ids
    if (clubsExceptions.length > 0) {
      doApiRequest(`/cycles/add_clubs_to_exception/`, {
        method: 'POST',
        body: {
          clubs: clubsExceptions.map((x) => {
            // eslint-disable-next-line camelcase
            return { id: x.id, end_date: x.endDate }
          }),
        },
      })
    }
    if (clubsNoExceptions.length > 0) {
      doApiRequest(`/cycles/remove_clubs_from_exception/`, {
        method: 'POST',
        body: { clubs: clubsNoExceptions.map((x) => x.id) },
      })
    }
  }

  useEffect(() => {
    doApiRequest('/clubs/?format=json')
      .then((resp) => resp.json())
      .then((data) => data.filter((club) => club.is_wharton))
      .then((data) => {
        setClubOptionsMembership(
          data.map((club) => {
            return { label: club.name, value: club.code }
          }),
        )
      })
  }, [])

  const refreshMembership = (): void => {
    if (membershipCycle && membershipCycle.id != null) {
      doApiRequest(`/cycles/${membershipCycle.id}/get_clubs?format=json`)
        .then((resp) => resp.json())
        .then((associatedClubs) => {
          setClubsSelectedMembership(
            associatedClubs.map((data) => {
              return { label: data.club__name, value: data.club__code }
            }),
          )
        })
    }
  }

  useEffect(() => {
    refreshMembership()
  }, [membershipCycle])

  useEffect(() => {
    doApiRequest('/cycles')
      .then((resp) => resp.json())
      .then((data) => {
        setPermissions(!data.detail)
      })
  })

  useEffect(() => {
    if (extensionsCycle && extensionsCycle.id != null) {
      doApiRequest(
        `/cycles/${extensionsCycle.id}/club_applications?format=json`,
      )
        .then((resp) => resp.json())
        .then((data) => {
          const initialOptions = data.map(
            (application: ClubApplicationWithClub) => {
              return {
                id: application.id,
                clubName: application.club__name,
                endDate: new Date(application.application_end_time),
                exception: application.application_end_time_exception,
                originalEndDate: new Date(application.application_end_time),
                originalException: application.application_end_time_exception,
              }
            },
          )
          setClubsExtensions(initialOptions)
        })
    }
  }, [extensionsCycle])

  if (clubOptionsMembership == null || permissions == null) {
    return <Loading />
  }

  if (!permissions) {
    return <Text>You do not have permission to view this page.</Text>
  }

  return (
    <>
      <ModelForm
        baseUrl={`/cycles/`}
        noun="Cycle"
        fields={fields}
        tableFields={[
          { name: 'name' },
          { name: 'start_date' },
          { name: 'end_date' },
          { name: 'release_date' },
        ]}
        confirmDeletion={true}
        actions={(object) => (
          <>
            <button
              className="button is-info is-small"
              onClick={() => {
                setMembershipCycle({
                  name: object.name,
                  id: object.id,
                  endDate: new Date(object.end_date),
                })
                setEditMembership(true)
                setEditExtensions(false)
              }}
            >
              <Icon name="user" /> Membership
            </button>
            <button
              className="button is-info is-small"
              onClick={() => {
                setExtensionsCycle({
                  name: object.name,
                  id: object.id,
                  endDate: new Date(object.end_date),
                })
                setEditExtensions(true)
                setEditMembership(false)
              }}
            >
              Extensions
            </button>
            <a
              href={getApiUrl(`/cycles/${object.id}/applications`)}
              className="button is-info is-small"
            >
              Export Applications
            </a>
          </>
        )}
      />
      <Modal show={editMembership} closeModal={() => setEditMembership(false)}>
        {membershipCycle && membershipCycle.name && (
          <>
            <Subtitle>
              Club Membership for {membershipCycle.name} Cycle
            </Subtitle>
            {
              <>
                <div
                  style={{
                    paddingLeft: 20,
                    paddingRight: 20,
                    paddingTop: '20px',
                  }}
                >
                  <ScrollWrapper>
                    <Select
                      onChange={(e) => setClubsSelectedMembership([...e])}
                      value={clubsSelectedMembership}
                      options={clubOptionsMembership}
                      isMulti
                      isClearable={false}
                      backspaceRemovesValue={false}
                    />
                  </ScrollWrapper>
                </div>
                <button
                  className="button is-danger is-primary"
                  style={{ position: 'absolute', bottom: 10, right: 10 }}
                  onClick={closeMembershipModal}
                >
                  Submit
                </button>
                <button
                  className="button is-primary"
                  style={{ position: 'absolute', bottom: 60, right: 10 }}
                  onClick={refreshMembership}
                >
                  Refresh
                </button>
              </>
            }
          </>
        )}
      </Modal>
      <Modal show={editExtensions} closeModal={closeExtensionsModal}>
        {extensionsCycle && extensionsCycle.name && (
          <>
            <Subtitle>
              Individual Club Extensions for {extensionsCycle.name}
            </Subtitle>
            <div
              style={{ paddingLeft: 20, paddingRight: 20, paddingTop: '20px' }}
            >
              <ScrollWrapper>
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th>End Date</th>
                      <th>Exception</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubsExtensions.map((club) => (
                      <tr key={club.clubName}>
                        <td>
                          <p>{club.clubName}</p>
                        </td>
                        <td>
                          <DatePicker
                            selected={club.endDate}
                            onChange={(date) => {
                              club.endDate = date
                              setClubsExtensions([...clubsExtensions])
                            }}
                          />
                        </td>
                        <td>
                          <Checkbox
                            onChange={(e) => {
                              club.exception = e.target.checked
                              setClubsExtensions([...clubsExtensions])
                            }}
                            checked={
                              club.exception != null ? club.exception : false
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {clubsExtensions.length < 10 && (
                      <div style={{ height: '200px' }} />
                    )}
                  </tbody>
                </table>
              </ScrollWrapper>
            </div>
            <button
              className="button is-primary"
              style={{ position: 'absolute', bottom: 10, right: 10 }}
              onClick={closeExtensionsModal}
              disabled={clubsExtensions.some(
                (x) =>
                  // For the case where we change end date without giving an exception to a club without one
                  !x.exception &&
                  !x.originalException &&
                  x.endDate.getTime() !== extensionsCycle.endDate.getTime(),
              )}
            >
              Submit
            </button>
            {clubsExtensions.some(
              (x) =>
                !x.exception &&
                !x.originalException &&
                x.endDate.getTime() !== extensionsCycle.endDate.getTime(),
            ) && (
              <p className="is-danger">
                To change the end date for a club, you must also check its
                exception box.
              </p>
            )}
          </>
        )}
      </Modal>
    </>
  )
}

export default WhartonApplicationCycles
