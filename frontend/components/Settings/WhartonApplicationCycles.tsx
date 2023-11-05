import { Field } from 'formik'
import React, { ReactElement, useEffect } from 'react'
import Select from 'react-select'

import { ClubApplication } from '~/types'
import { doApiRequest } from '~/utils'

import { Icon, Loading, Modal } from '../common'
import { DateTimeField, TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

const fields = (
  <>
    <Field name="name" as={TextField} />
    <Field name="start_date" as={DateTimeField} />
    <Field name="end_date" as={DateTimeField} />
  </>
)

type ClubOption = {
  label: string
  value: number
}

const WhartonApplicationCycles = (): ReactElement => {
  const [editMembership, setEditMembership] = React.useState(false)
  const [membershipCycle, setMembershipCycle] = React.useState({
    name: '',
    id: null,
  })

  // use { label: string; value: number; }[]
  const [clubsSelected, setClubsSelected] = React.useState<ClubOption[]>([])

  const [clubsInitial, setClubsInitial] = React.useState(null)
  const [clubsInitialOptions, setClubsInitialOptions] = React.useState<
    ClubOption[]
  >([])
  const [possibleClubs, setPossibleClubs] = React.useState(null)
  const [clubOptions, setClubOptions] = React.useState(null)

  const closeModal = (): void => {
    setEditMembership(false)
    // calculate difference between initial and selected
    const clubsToRemove = clubsInitialOptions.filter(
      (x) => !clubsSelected.includes(x),
    )
    const clubsToAdd = clubsSelected.filter(
      (x) => !clubsInitialOptions.includes(x),
    )

    // call /cycles/:id/add_clubs and /cycles/remove_clubs_from_all with data.clubs as list of ids
    if (clubsToRemove.length > 0) {
      doApiRequest(`/cycles/remove_clubs_from_all/`, {
        method: 'POST',
        body: { clubs: clubsToRemove.map((x) => x.value) },
      })
    }
    if (clubsToAdd.length > 0) {
      doApiRequest(`/cycles/${membershipCycle.id}/add_clubs/`, {
        method: 'POST',
        body: { clubs: clubsToAdd.map((x) => x.value) },
      })
    }
  }
  useEffect(() => {
    if (possibleClubs == null) {
      doApiRequest('/whartonapplications/?format=json')
        .then((resp) => resp.json())
        .then((data) => {
          setPossibleClubs(data)
          setClubOptions(
            data.map((club: ClubApplication) => {
              return { label: club.name, value: club.id }
            }),
          )
        })
    }
  }, [possibleClubs])

  useEffect(() => {
    if (membershipCycle && membershipCycle.id != null) {
      doApiRequest(`/cycles/${membershipCycle.id}/clubs?format=json`)
        .then((resp) => resp.json())
        .then((data) => {
          setClubsInitial(data)
          const initialOptions = data.map((club: ClubApplication) => {
            return { label: club.name, value: club.id }
          })
          setClubsInitialOptions(initialOptions)
          setClubsSelected(initialOptions)
        })
    }
  }, [membershipCycle])

  if (clubOptions == null) {
    return <Loading />
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
        ]}
        actions={(object) => (
          <button
            className="button is-info is-small"
            onClick={() => {
              setMembershipCycle({ name: object.name, id: object.id })
              setEditMembership(true)
            }}
          >
            <Icon name="user" /> Membership
          </button>
        )}
      />
      <Modal show={editMembership} closeModal={closeModal}>
        {membershipCycle && membershipCycle.name && (
          <>
            <h1 style={{ paddingBottom: '20px' }}>
              Club Membership for {membershipCycle.name}
            </h1>
            <div style={{ paddingLeft: 10, paddingRight: 10 }}>
              <Select
                onChange={(e) => setClubsSelected([...e])}
                value={clubsSelected}
                options={clubOptions}
                isMulti
              />
            </div>
            <button
              className="button is-primary"
              style={{ position: 'absolute', bottom: 10, right: 10 }}
              onClick={closeModal}
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
