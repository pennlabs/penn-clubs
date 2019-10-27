import renderPage from "../renderPage.js";
import { getDefaultClubImageURL, doApiRequest } from "../utils";
import React from "react";
import s from "styled-components";
import Tabs from "../components/ClubPage/Tabs.js";
import Header from "../components/ClubPage/Header.js";
import InfoBox from "../components/ClubPage/InfoBox.js";
import SocialIcons from "../components/ClubPage/SocialIcons.js";

const Image = s.img`
  max-height: 300px;
  max-width: 100%;
  object-fit: contain;
`;

class Club extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      club: null
    };
  }

  componentDidMount() {
    doApiRequest(`/clubs/${this.props.query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => this.setState({ club: data }));
  }

  render() {
    const { club } = this.state;

    if (!club) {
      return <div />;
    }

    if (!club.code) {
      return (
        <div className="has-text-centered" style={{ margin: 30 }}>
          <h1 className="title is-h1">404 Not Found</h1>
          <p>The club you are looking for does not exist.</p>
        </div>
      );
    }

    return (
      <div style={{ padding: "30px 50px" }}>
        <Header
          club={club}
          userInfo={this.props.userInfo}
          favorites={this.props.favorites}
          updateFavorites={this.props.updateFavorites}
        />
        <div className="columns">
          <div className="column is-6">
            <Image src={club.image_url || getDefaultClubImageURL()} />
          </div>
          <div className="column is-6">
            <InfoBox club={club} />
            <SocialIcons club={club} />
            <Tabs club={club} />
          </div>
        </div>
      </div>
    );
  }
}

Club.getInitialProps = async props => {
  var { query } = props;
  return { query: query };
};

export default renderPage(Club);
