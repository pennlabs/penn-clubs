import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { M1 } from '../../constants/measurements'
import { Club } from '../../types'
import { OBJECT_NAME_SINGULAR, SITE_NAME } from '../../utils/branding'
import { Center, Col, EmptyState, Icon, Row, Text } from '../common'
import MemberCard from './MemberCard'

const Toggle = styled.div`
  color: ${DARK_GRAY};
  cursor: pointer;
`

const MemberList = ({
  club: { members },
}: {
  club: Club
}): ReactElement<any> => {
  const [expanded, setExpanded] = useState(false)
  const hasMembers = members.length > 0
  return hasMembers ? (
    <div>
      {expanded ? (
        <Row margin={M1}>
          {members.map((a) => (
            <Col
              key={a.username || a.name}
              sm={12}
              md={6}
              lg={3}
              flex
              margin={M1}
            >
              <MemberCard account={a} />
            </Col>
          ))}
        </Row>
      ) : (
        <Row margin={M1}>
          {members.slice(0, 4).map((a) => (
            <Col
              key={a.username || a.name}
              sm={12}
              md={6}
              lg={3}
              flex
              margin={M1}
            >
              <MemberCard account={a} />
            </Col>
          ))}
        </Row>
      )}
      {members.length >= 5 && (
        <Toggle
          className="is-pulled-right"
          onClick={() => setExpanded(!expanded)}
        >
          See {expanded ? 'less' : 'more'}{' '}
          <Icon
            alt={expanded ? 'less' : 'more'}
            name={expanded ? 'chevron-up' : 'chevron-down'}
          />
        </Toggle>
      )}
    </div>
  ) : (
    <Center>
      <EmptyState
        name="hiring"
        size="25%"
        style={{ marginTop: 0, marginBottom: 0 }}
      />
      <Text>
        No {OBJECT_NAME_SINGULAR} members have linked their accounts on{' '}
        {SITE_NAME} yet.
        <br />
        Check back later for a list of {OBJECT_NAME_SINGULAR} members!
      </Text>
    </Center>
  )
}

export default MemberList
