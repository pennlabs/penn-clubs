import { Field } from 'formik'
import { ReactElement } from 'react'

import { Club, MembershipRank, MembershipRole } from '../../types'
import { getApiUrl, getRoleDisplay } from '../../utils'
import { Icon } from '../common'
import { MultiselectField, TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

export const MEMBERSHIP_ROLES: MembershipRole[] = [
  {
    value: MembershipRank.Member,
    label: 'Member',
  },
  {
    value: MembershipRank.Officer,
    label: 'Officer',
  },
  {
    value: MembershipRank.Owner,
    label: 'Owner',
  },
]

type MembersCardProps = {
  club: Club
}

export default function MembersCard({ club }: MembersCardProps): ReactElement {
  return (
    <BaseCard title="Members">
      <ModelForm
        keyField="username"
        deleteVerb="Kick"
        noun="Member"
        allowCreation={false}
        confirmDeletion={true}
        baseUrl={`/clubs/${club.code}/members/`}
        fields={
          <>
            <Field name="title" as={TextField} />
            <Field
              name="role"
              as={MultiselectField}
              choices={MEMBERSHIP_ROLES}
              serialize={({ value }) => value}
              valueDeserialize={(val) =>
                MEMBERSHIP_ROLES.find((x) => x.value === val)
              }
              isMulti={false}
            />
          </>
        }
        tableFields={[
          {
            name: 'name',
          },
          {
            name: 'title',
            label: 'Title (Permissions)',
            converter: (a, all) => `${a} (${getRoleDisplay(all.role)})`,
          },
          {
            name: 'email',
          },
        ]}
        currentTitle={(obj) => `${obj.name} (${obj.email})`}
      />
      <div style={{ marginTop: '1em' }}>
        <a
          href={getApiUrl(`/clubs/${club.code}/members/?format=xlsx`)}
          className="button is-link is-small"
        >
          <Icon alt="download" name="download" /> Download Member List
        </a>
      </div>
    </BaseCard>
  )
}
