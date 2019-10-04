import { CLUBS_GREY } from '../../constants/colors'
import { DetailTag } from '../common/Tags'

const DetailsTag = s.div`
  padding: 10px 0 0 0;
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const Detail = s.div`
  display: flex;
  justify-content: space-between;
`

const Details = ({ size, applicationRequired, acceptingMembers }) => (
  <DetailsTag>
    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">
        Membership:
      </b>
      <DetailTag className="tag is-rounded">{size}</DetailTag>
    </Detail>

    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">
        Requires Application:
      </b>
      <DetailTag className="tag is-rounded">
        {{
          1: 'No',
          2: 'Some Roles',
          3: 'All Roles',
        }[applicationRequired] || 'Uknown'}
      </DetailTag>
    </Detail>

    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">
        Accepting Members:
      </b>
      <DetailTag className="tag is-rounded">
        {acceptingMembers ? 'Yes' : 'No'}
      </DetailTag>
    </Detail>
  </DetailsTag>
)

Details.propTypes = {
  size: PropTypes.string.isRequired,
  applicationRequired: PropTypes.number.isRequired,
  acceptingMember: PropTypes.bool.isRequired,
}

export default Details
