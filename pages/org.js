import renderPage from "../renderPage.js";
import { getDefaultClubImageURL, doApiRequest } from "../utils";
import React, { Component } from "react";
import s from "styled-components";
import Header from "../components/ClubPage/Header.js";
import InfoBox from "../components/ClubPage/InfoBox.js";
import SocialIcons from "../components/ClubPage/SocialIcons.js";
import clubEx from "./club_tree_example.json";
import OrgChildren from "../components/OrgPage/OrgChildren.js";
import OrgTabs from "../components/OrgPage/OrgsTabs.js";

const Image = s.img`
  max-height: 300px;
  max-width: 100%;
  object-fit: contain;
`;

class Org extends Component {
  constructor(props) {
    super(props);
    this.state = {
      club: null,
      children: null
    };
  }

  componentDidMount() {
    doApiRequest(`/clubs/${this.props.query.club}/?format=json`)
      .then(resp => {
        console.log("FIRST RESP", resp);
        return resp.json();
      })
      .then(data => {
        console.log("FIRST DAA", data);
        this.setState({ club: data });
      });
    doApiRequest(`/clubs/${this.props.query.club}/children/?format=json`)
      .then(resp => {
        console.log("SECOND RESP", resp);
        return resp.json();
      })
      .then(data => {
        console.log("SECOND DAT", data);
        this.setState({ children: data.children });
      });
    console.log(this.state.children);
  }
  render() {
    const { club, children } = this.state;
    if (!club) {
      return (
        <div className="has-text-centered">
          <h1 className="title is-h1">404 Not Found</h1>
        </div>
      );
    }
    if (!children) {
      return (
        <div className="has-text-centered">
          <h1 className="title is-h1">404 Not Found</h1>
          <p>Club you are looking for has no children</p>
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
        <div></div>
        <div className="columns">
          <div className="column is-6">
            <OrgChildren children={children}></OrgChildren>
            {/* <Image src={club.image_url || getDefaultClubImageURL()} /> */}
          </div>
          <div className="column is-6">
            <InfoBox club={club} />
            <SocialIcons club={club} />
            <OrgTabs club={club} />
          </div>
        </div>
        {/* <OrgChildren children={club.children}></OrgChildren> */}
      </div>
    );
  }
}

Org.getInitialProps = async props => {
  const { query } = props;
  return { query: query };
};

export default renderPage(Org);
