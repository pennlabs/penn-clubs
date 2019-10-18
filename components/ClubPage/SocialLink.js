export default (props) => {
    var club = props.club
    var item = props.item
    var social = props.type

      if (social == 'email') {
        return (
            club[item.name]
          );
      } else {
        return (
            <a href={club[item.name]}>{club.name}</a>
          );
      }
  }