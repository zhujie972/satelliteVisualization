import React, {Component} from 'react';
import { feature } from 'topojson-client';
import axios from 'axios';
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { geoGraticule, geoPath } from 'd3-geo';
import { select as d3Select } from 'd3-selection';

import { WORLD_MAP_URL } from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor(){
        super();
        this.state = {
            map: null
        }
        // 为什么要用refMap？这里必须用他， 为什么呢？ react的方式去获得页面上一些元素的ref。
        // 
        this.refMap = React.createRef();
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

    generateMap(land){
        //
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        const graticule = geoGraticule();

        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);
            //2d 是画 2d 图
        let context = canvas.node().getContext("2d");

        let path = geoPath()
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';
            context.strokeStyle = '#000';
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();


            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

        
            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            // context.lineWidth = 0.5;
            context.stroke();
        })
    }

    render() {
        return (
            <div className="map-box">
                <canvas className="map" ref={this.refMap} />
            </div>
        );
    }
}

export default WorldMap;
