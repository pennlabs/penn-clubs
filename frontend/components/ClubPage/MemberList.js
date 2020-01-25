import { useState } from 'react'
import s from 'styled-components'
import { Row, Col, Icon, Center, EmptyState } from '../common'
import { DARK_GRAY } from '../../constants/colors'
import MemberCard from './MemberCard'

const Toggle = s.div`
  color: ${DARK_GRAY};
  cursor: pointer;
`

const MemberList = ({ club: { members } }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      {expanded ? (
        <Row>
          {members.map(a => (
            <Col key={a.username} sm={12} md={6} lg={3} margin="5px" flex>
              <MemberCard account={a} />
            </Col>
          ))}
        </Row>
      ) : (
          <Row>
            {members.length ? (
              members.slice(0, 4).map(a => (
                <Col key={a.username} sm={12} md={6} lg={3} margin="5px" flex>
                  <MemberCard account={a} />
                </Col>
              ))
            ) : (
              <Center>
                <EmptyState name="hiring" size="25%" style={{ marginTop: 0, marginBottom: 0 }} />
                <p>
                  No club members have linked their accounts on Penn Clubs yet.
                  <br />
                  Check back later for a list of club members!
                </p>
              </Center>
            )}
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
  )
}

export default MemberList
