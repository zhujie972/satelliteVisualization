import React, { Component } from "react";
import { Row, Col } from "antd";
import axios from "axios";
import SatSetting from "./SatSetting";
import SatelliteList from "./SatelliteList";
import WorldMap from "./WorldMap";
import { NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY } from "../constants";

class Main extends Component {
  constructor() {
    super();
    this.state = {
      satInfo: null,
      satList: null,
      setting: null,
      isLoadingList: false,
    };
  }
  showNearbySatellite = (setting) => {
    this.setState({
      isLoadingList: true,
      setting: setting,
    });
    this.fetchSatellite(setting);
  };

  fetchSatellite = (setting) => {
    const { latitude, longitude, elevation, altitude } = setting;
    const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

    this.setState({
      isLoadingList: true,
    });

    axios
      .get(url)
      .then((response) => {
        console.log(response.data);
        this.setState({
          satInfo: response.data,
          isLoadingList: false,
        });
      })
      .catch((error) => {
        console.log("err in fetch satellite -> ", error);
        this.setState({
          isLoadingList: false,
        });
      });
  };

  showMap = (selected) => {
    this.setState((preState) => ({
      ...preState,
      satList: [...selected],
    }));
  };

  render() {
    const { isLoadingList, satInfo, satList, setting } = this.state;
    return (
      <Row className="main">
        <Col span={8} className="left-side">
          <SatSetting onShow={this.showNearbySatellite} />
          <SatelliteList
            isLoad={isLoadingList}
            satInfo={satInfo}
            onShowMap={this.showMap}
          />
        </Col>
        <Col span={16} className="right-side">
          <WorldMap satData={satList} observerData={setting} />
        </Col>
      </Row>
    );
  }
}

export default Main;