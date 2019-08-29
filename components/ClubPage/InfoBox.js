import { getSizeDisplay } from '../../utils'

export default (props) => (
  <div>
    <p>
      <i className="fa-fw fas fa-user-friends"></i>
      {' ' + getSizeDisplay(props.club.size)}
    </p>
    { props.club.application_required ? (<p><i className="fa-fw fas fa-door-open"></i> Application Required</p>) : (<p><i className="fas fa-door-closed"></i> No Application Required</p>) }
    { props.club.accepting_applications === 3 ? (<p><i className="fa-fw fas fa-user-plus"></i> Accepting Applications for All Roles</p>) : props.club.accepting_applications === 2 ? (<p><i className="fas fa-user-plus"></i> Accepting Applications for Some Roles</p>) : (<p><i className="fas fa-user-times"></i> Not Accepting Applications</p>) }
  </div>
)
