import { getSizeDisplay } from '../../utils'

export default (props) => (
  <div>
    <p>
      <i class="fas fa-user-friends"></i>
      {' ' + getSizeDisplay(props.club.size)}
    </p>
    { props.club.application_required ? (<p><i class="fas fa-door-open"></i> Application Required</p>) : (<p><i class="fas fa-door-closed"></i> No Application Required</p>) }
    { props.club.accepting_applications ? (<p><i class="fas fa-user-plus"></i> Accepting Applications</p>) : (<p><i class="fas fa-user-times"></i> Not Accepting Applications</p>) }
  </div>
)
