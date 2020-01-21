import { useState } from 'react'
import s from 'styled-components'
import { Row, Col, Icon } from '../common'
import { DARK_GRAY } from '../../constants/colors'
import MemberCard from './MemberCard'

const Toggle = s.div`
  color: ${DARK_GRAY};
  cursor: pointer;
`

const MemberList = ({ club }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      {expanded ? (
        <Row>
          {club.members.map((a, i) => (
            <Col sm={12} md={6} lg={3} margin="5px" flex>
              <MemberCard a={a} key={i} />
            </Col>
          ))}
        </Row>
      ) : (
        <Row>
          {club.members.length ? (
            club.members.slice(0, 4).map((a, i) => (
              <Col sm={12} md={6} lg={3} margin="5px" flex>
                <MemberCard a={a} key={i} />
              </Col>
            ))
          ) : (
            <p>
              No club members have linked their accounts on Penn Clubs yet.
              Check back later for a list of club members!
            </p>
          )}
        </Row>
      )}

      {club.members.length >= 5 && (
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
