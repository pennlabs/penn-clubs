import React from 'react'
import { Row, Col } from '../common'
import MemberCard from './MemberCard'

const MemberList = ({ club }) => (
  <Row>
    {club.members.length ? (
      club.members.map((a, i) => (
        <Col sm={12} md={6} lg={3} margin="5px" flex>
          <MemberCard a={a} key={i} />
        </Col>
      ))
    ) : (
      <p>
        No club members have linked their accounts on Penn Clubs yet. Check back
        later for a list of club members!
      </p>
    )}
  </Row>
)

export default MemberList
