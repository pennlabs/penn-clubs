import { Field } from 'formik'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
import styled from 'styled-components'

import { ClubApplication } from '~/types'
import { doApiRequest } from '~/utils'

import { Checkbox, Icon, Loading, Modal, Subtitle, Text } from '../common'
import { DateTimeField, TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

const fields = (
  <>
    <Field name="name" as={TextField} />
    <Field name="start_date" as={DateTimeField} />
    <Field name="end_date" as={DateTimeField} />
    <Field name="release_date" as={DateTimeField} />
  </>
)

type Cycle = {
  name: string
  id: number | null
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
  changed: boolean
}

const ScrollWrapper = styled.div`
  overflow-y: auto;
  margin-top: 1rem;
  height: 40vh;
`

const WhartonApplicationCycles = (): ReactElement => {
  const [editMembership, setEditMembership] = useState(false)
  const [membershipCycle, setMembershipCycle] = useState<Cycle>({
    name: '',
    id: null,
  })

  const [editExtensions, setEditExtensions] = useState(false)
  const [extensionsCycle, setExtensionsCycle] = useState<Cycle>({
    name: '',
    id: null,
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
    const clubsToUpdate = clubsExtensions.filter((x) => x.changed)
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
      doApiRequest(`/cycles/${extensionsCycle.id}/clubs?format=json`)
        .then((resp) => resp.json())
        .then((data) => {
          const initialOptions = data.map((club: ClubApplication) => {
            return {
              id: club.id,
              clubName: club.name,
              endDate: new Date(club.application_end_time),
              exception: club.application_end_time_exception,
              changed: false,
            }
          })
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
                setMembershipCycle({ name: object.name, id: object.id })
                setEditMembership(true)
                setEditExtensions(false)
              }}
            >
              <Icon name="user" /> Membership
            </button>
            <button
              className="button is-info is-small"
              onClick={() => {
                setExtensionsCycle({ name: object.name, id: object.id })
                setEditExtensions(true)
                setEditMembership(false)
              }}
            >
              Extensions
            </button>
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
                              club.changed = true
                              setClubsExtensions([...clubsExtensions])
                            }}
                          />
                        </td>
                        <td>
                          <Checkbox
                            onChange={(e) => {
                              club.exception = e.target.checked
                              club.changed = true
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
            >
              Submit
            </button>
          </>
        )}
      </Modal>
    </>
  )
}

export default WhartonApplicationCycles
