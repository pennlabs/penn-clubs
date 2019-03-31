import React from 'react'
import ClubCard from '../components/ClubCard'
import Modal from '../components/Modal'

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    var props = this.props
    return (
      <div>
        <div class="columns is-multiline" style={{ padding: "2rem", marginTop: 150 }}>
          {props.clubs.map((club) => (
            <ClubCard club={club} tags={props.tags} openModal={props.openModal}/>
          ))}
        </div>
      </div>);
  }
}

export default ClubDisplay
