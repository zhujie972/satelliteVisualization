import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
  WORLD_MAP_URL,
  SATELLITE_POSITION_URL,
  SAT_API_KEY,
} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.state = {
          isLoading: false,
          isDrawing: false,
        };
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        // 为什么要用refMap？这里必须用他， 为什么呢？ react的方式去获得页面上一些元素的ref。
        // 
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
      }

    componentDidMount() {
        //res 和response 有区别吗？ 应该没有，只是名字 、、原来叫res，换成response试试
        axios.get(WORLD_MAP_URL)
            .then(response => {
                const { data } = response;
                const land = feature(data, data.objects.countries).features;
                //生成地图
                this.generateMap(land);
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.satData !== this.props.satData) {
          const { latitude, longitude, elevation, duration } =
            this.props.observerData;
          const endTime = duration * 60;
    
          this.setState({
            isLoading: true,
          });
    
          const urls = this.props.satData.map((sat) => {
            const { satid } = sat;
            const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
    
            return axios.get(url);
          });
          // 打包处理 promise
          Promise.all(urls)
            .then((res) => {
              const arr = res.map((sat) => sat.data);
              this.setState({
                isLoading: false,
                isDrawing: true,
              });
    
              if (!prevState.isDrawing) {
                this.track(arr);
              } else {
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML =
                  "Please wait for these satellite animation to finish before selection new ones!";
              }
            })
            //任意一个失败都到这一步
            .catch((e) => {
              console.log("err in fetch satellite position -> ", e.message);
            });
        }
      }

    track = (data) => {
        if (!data[0].hasOwnProperty("positions")) {
          throw new Error("no position data");
        }
    
        const len = data[0].positions.length;
        const { context2 } = this.map;
    
        let now = new Date();
    
        let i = 0;
    
        let timer = setInterval(() => {
          let ct = new Date();
    
          let timePassed = i === 0 ? 0 : ct - now;
          let time = new Date(now.getTime() + 60 * timePassed);
    
          context2.clearRect(0, 0, width, height);
    
          context2.font = "bold 14px sans-serif";
          context2.fillStyle = "#333";
          context2.textAlign = "center";
          context2.fillText(d3TimeFormat(time), width / 2, 10);
    
          if (i >= len) {
            clearInterval(timer);
            this.setState({ isDrawing: false });
            const oHint = document.getElementsByClassName("hint")[0];
            oHint.innerHTML = "";
            return;
          }
    
          data.forEach((sat) => {
            const { info, positions } = sat;
            this.drawSat(info, positions[i]);
          });
    
          i += 60;
        }, 1000);
    };

    
    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;
    
        if (!satlongitude || !satlatitude) return;
    
        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join("");
    
        const { projection, context2 } = this.map;
        const xy = projection([satlongitude, satlatitude]);
    
        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();
    
        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
      };
        
    // generateMap(land){
    //     //
    //     const projection = geoKavrayskiy7()
    //         .scale(170)
    //         .translate([width / 2, height / 2])
    //         .precision(.1);

    //     const graticule = geoGraticule();

    //     const canvas = d3Select(this.refMap.current)
    //         .attr("width", width)
    //         .attr("height", height);
    //         //2d 是画 2d 图
    //     let context = canvas.node().getContext("2d");

    //     let path = geoPath()
    //         .projection(projection)
    //         .context(context);

    //     land.forEach(ele => {
    //         context.fillStyle = '#B3DDEF';
    //         context.strokeStyle = '#000';
    //         context.globalAlpha = 0.7;
    //         context.beginPath();
    //         path(ele);
    //         context.fill();
    //         context.stroke();


    //         context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
    //         context.beginPath();
    //         path(graticule());
    //         context.lineWidth = 0.1;
    //         context.stroke();

        
    //         context.beginPath();
    //         context.lineWidth = 0.5;
    //         path(graticule.outline());
    //         // context.lineWidth = 0.5;
    //         context.stroke();
    //     })
    // }

    generateMap = (land) => {
        const projection = geoKavrayskiy7()
          .scale(170)
          .translate([width / 2, height / 2])
          .precision(0.1);
    
        const graticule = geoGraticule();
    
        const canvas = d3Select(this.refMap.current)
          .attr("width", width)
          .attr("height", height);
    
        const canvas2 = d3Select(this.refTrack.current)
          .attr("width", width)
          .attr("height", height);
    
        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");
    
        let path = geoPath().projection(projection).context(context);
    
        land.forEach((ele) => {
          context.fillStyle = "#B3DDEF";
          context.strokeStyle = "#000";
          context.globalAlpha = 0.7;
          context.beginPath();
          path(ele);
          context.fill();
          context.stroke();
    
          context.strokeStyle = "rgba(220, 220, 220, 0.1)";
          context.beginPath();
          path(graticule());
          context.lineWidth = 0.1;
          context.stroke();
    
          context.beginPath();
          context.lineWidth = 0.5;
          path(graticule.outline());
          context.stroke();
        });
    
        this.map = {
          projection: projection,
          graticule: graticule,
          context: context,
          context2: context2,
        };
      };
    

    // render() {
    //     return (
    //         <div className="map-box">
    //             <canvas className="map" ref={this.refMap} />
    //         </div>
    //     );
    // }
    render() {
        const { isLoading } = this.state;
        return (
          <div className="map-box">
            {isLoading ? (
              <div className="spinner">
                <Spin tip="Loading..." size="large" />
              </div>
            ) : null}
            <canvas className="map" ref={this.refMap} />
            <canvas className="track" ref={this.refTrack} />
            <div className="hint" />
          </div>
        );
      }
}

export default WorldMap;
