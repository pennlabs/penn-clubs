import { useRouter } from 'next/router'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUB_EDIT_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { ADMIN_CANVAS_GAP, ADMIN_CARD_PAD, ADMIN_NAVY } from './adminTheme'
import { PageHeading, PageTitle } from './ClubAdminShell'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${ADMIN_CANVAS_GAP};
  margin-bottom: ${ADMIN_CANVAS_GAP};
`

const Stat = styled.button`
  appearance: none;
  text-align: left;
  background: white;
  border: 0;
  border-radius: 10px;
  padding: ${ADMIN_CARD_PAD};
  cursor: pointer;
  color: ${ADMIN_NAVY};

  &:hover {
    background: #fafafa;
  }
`

const Label = styled.div`
  font-size: 13px;
  color: #42424f;
  margin-bottom: 6px;
`

const Value = styled.div`
  font-size: 18px;
  font-weight: 600;
`

type Props = {
  club: Club
}

export default function HomeCard({ club }: Props): ReactElement<any> {
  const router = useRouter()
  const open = (tab: string) => {
    router.push(`${CLUB_EDIT_ROUTE(club.code)}/${tab}`, undefined, {
      shallow: true,
    })
  }

  const memberCount = club.members?.length || club.membership_count || 0

  return (
    <>
      <PageHeading>
        <PageTitle>Home</PageTitle>
      </PageHeading>
      <Grid>
        <Stat type="button" onClick={() => open('settings')}>
          <Label>Approval</Label>
          <Value>{club.approved ? 'Approved' : 'Not approved'}</Value>
        </Stat>
        <Stat type="button" onClick={() => open('info')}>
          <Label>Accepting members</Label>
          <Value>{club.accepting_members ? 'Yes' : 'No'}</Value>
        </Stat>
        <Stat type="button" onClick={() => open('member')}>
          <Label>Members</Label>
          <Value>{memberCount}</Value>
        </Stat>
        <Stat type="button" onClick={() => open('info')}>
          <Label>Favorites</Label>
          <Value>{club.favorite_count || 0}</Value>
        </Stat>
      </Grid>
      <p style={{ color: ADMIN_NAVY, marginTop: 0 }}>
        Manage {club.name}. Use the sidebar to edit the public{' '}
        {OBJECT_NAME_SINGULAR} page, membership, events, and the rest of the
        officer tools.
      </p>
    </>
  )
}
