import { getSizeDisplay } from '../../utils'
import Icon from '../common/Icon'

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

const infoStyles = {
  marginBottom: '5px',
}

const applicationTextMap = {
  3: 'Application Required for All Roles',
  2: 'Application Required for Some',
  1: 'No Application Required',
}
const defaultApplicationText = 'No Application Required'

const InfoBox = ({
  club: {
    size,
    accepting_members: acceptingMembers,
    application_required: applicationRequired,
  },
}) => (
  <div>
    <p style={infoStyles}>
      <Icon name="user" alt="members" style={iconStyles} />
      {' ' + getSizeDisplay(size)}
    </p>
    {acceptingMembers ? (
      <p style={infoStyles}>
        <Icon name="check-circle" style={iconStyles} alt="check" />
        {' Currently Accepting Members'}
      </p>
    ) : (
      <p style={infoStyles}>
        <Icon name="x-circle" style={iconStyles} alt="negative" />
        {' Not Currently Accepting Members'}
      </p>
    )}

    <p style={infoStyles}>
      <Icon name="edit" style={iconStyles} alt="edit" />
      {' ' + applicationTextMap[applicationRequired] || defaultApplicationText}
    </p>
  </div>
)

export default InfoBox
