import { ReactElement } from 'react'

import { Club, MembershipRank, MembershipRole } from '../../types'
import { getApiUrl, getRoleDisplay } from '../../utils'
import { Icon } from '../common'
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
        fields={[
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'role',
            type: 'select',
            choices: MEMBERSHIP_ROLES,
            converter: (a) => MEMBERSHIP_ROLES.find((x) => x.value === a),
            reverser: (a) => a.value,
          },
        ]}
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
